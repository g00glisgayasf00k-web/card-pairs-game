import json
from datetime import datetime, timezone

from app.models import PlayerProgress, db

PROGRESS_VERSION = 9
STARTING_CREDITS = 100
MAX_ENERGY = 12


def _now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def _default_progress_payload() -> dict:
    now = _now_ms()
    return {
        "v": PROGRESS_VERSION,
        "highestUnlocked": 1,
        "completedLevels": [],
        "levelStars": {},
        "level": 1,
        "levelScore": 0,
        "levelHands": 0,
        "levelHandCounts": {},
        "lifetimeHandCounts": {},
        "handsCleared": 0,
        "bestHand": "pair",
        "credits": STARTING_CREDITS,
        "energy": MAX_ENERGY,
        "energyRegenAt": 0,
        "energyPaidLevel": None,
        "streak": 0,
        "tutorialStep": 0,
        "updatedAt": now,
    }


def load_progress_payload(row: PlayerProgress | None) -> dict:
    if not row:
        return _default_progress_payload()
    try:
        payload = json.loads(row.payload)
        if isinstance(payload, dict):
            return payload
    except json.JSONDecodeError:
        pass
    return _default_progress_payload()


def save_progress_payload(user_id: int, payload: dict, client_updated_at: int) -> PlayerProgress:
    payload_text = json.dumps(payload)
    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    if not row:
        row = PlayerProgress(
            user_id=user_id,
            payload=payload_text,
            client_updated_at=client_updated_at,
            updated_at=datetime.now(timezone.utc),
        )
        db.session.add(row)
    else:
        row.payload = payload_text
        row.client_updated_at = client_updated_at
        row.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return row


def grant_gems(user_id: int, gems: int) -> tuple[int, int]:
    """Add gems to a player's cloud save. Returns (gems_added, new_credits_total)."""
    if gems < 1:
        raise ValueError("gems must be positive")
    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    payload = load_progress_payload(row)
    now = _now_ms()
    current = int(payload.get("credits") or STARTING_CREDITS)
    payload["credits"] = current + gems
    payload["updatedAt"] = now
    save_progress_payload(user_id, payload, now)
    return gems, payload["credits"]


def adjust_gems(user_id: int, delta: int) -> tuple[int, int]:
    """Add or spend gems. Returns (new_credits, client_updated_at). Raises ValueError if broke."""
    if delta == 0:
        row = PlayerProgress.query.filter_by(user_id=user_id).first()
        payload = load_progress_payload(row)
        current = int(payload.get("credits") or STARTING_CREDITS)
        updated = int(payload.get("updatedAt") or _now_ms())
        return current, updated

    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    payload = load_progress_payload(row)
    now = _now_ms()
    current = int(payload.get("credits") or STARTING_CREDITS)
    next_credits = current + delta
    if next_credits < 0:
        raise ValueError("Not enough gems")
    payload["credits"] = next_credits
    payload["updatedAt"] = now
    save_progress_payload(user_id, payload, now)
    return next_credits, now


def challenge_fee_gems(wager: int) -> int:
    """Platform fee: 5% of wager, minimum 1 gem. (Legacy — friend duels are free now.)"""
    import math

    if wager < 1:
        return 0
    return max(1, int(math.ceil(wager * 0.05)))


DEFAULT_ELO = 1000


def get_player_elo(user_id: int) -> int:
    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    payload = load_progress_payload(row)
    raw = payload.get("elo")
    try:
        elo = int(raw)
    except (TypeError, ValueError):
        return DEFAULT_ELO
    return max(100, elo)


def set_player_elo(user_id: int, elo: int) -> int:
    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    payload = load_progress_payload(row)
    now = _now_ms()
    value = max(100, int(elo))
    payload["elo"] = value
    payload["updatedAt"] = now
    save_progress_payload(user_id, payload, now)
    return value
