import json
from datetime import datetime, timezone

from app.models import PlayerProgress, db

PROGRESS_VERSION = 9
STARTING_CREDITS = 200
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
