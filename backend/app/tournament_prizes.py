"""Settle tournament cups when a period ends; track unclaimed prize popups."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import distinct

from app.models import TournamentPrize, TournamentRun, db
from app.tournament_periods import period_key, period_sort_key

VALID_TIERS = ("bronze", "silver", "gold")

# Keep in sync with frontend tournamentTiers.TOURNAMENT_TIERS rewardPool.
TIER_REWARD_POOL = {
    "bronze": 500,
    "silver": 2500,
    "gold": 12_500,
}

# 1st / 2nd / 3rd shares.
PAYOUT_SHARES = (0.5, 0.3, 0.2)


def payout_gems(pool: int, place: int) -> int:
    if place < 1 or place > 3:
        return 0
    return int(round(pool * PAYOUT_SHARES[place - 1]))


def _rank_key(score: int, duration_ms: int | None) -> tuple[int, int]:
    d = int(duration_ms) if duration_ms is not None and duration_ms > 0 else 10**12
    return (-int(score), d)


def _past_period_keys(tier: str, current_pk: str) -> list[str]:
    raw = [
        row[0]
        for row in db.session.query(distinct(TournamentRun.period_key))
        .filter(TournamentRun.tier_id == tier)
        .all()
        if row[0]
    ]
    past = [pk for pk in raw if pk and pk != current_pk and pk != "legacy"]
    past.sort(key=period_sort_key, reverse=True)
    return past


def settle_tier_period(tier: str, pk: str) -> list[TournamentPrize]:
    """Idempotently pay top-3 for a closed period. Returns new prize rows (may be empty)."""
    import json
    from sqlalchemy.exc import IntegrityError

    from app.models import PlayerProgress
    from app.progress_grants import STARTING_CREDITS, _now_ms, load_progress_payload

    tier = (tier or "").strip().lower()
    if tier not in VALID_TIERS or not pk or pk == "legacy":
        return []

    existing = TournamentPrize.query.filter_by(tier_id=tier, period_key=pk).count()
    if existing > 0:
        return []

    runs = TournamentRun.query.filter_by(tier_id=tier, period_key=pk).all()
    if not runs:
        return []

    runs.sort(key=lambda r: _rank_key(r.score, getattr(r, "duration_ms", None)))
    pool = TIER_REWARD_POOL[tier]
    created: list[TournamentPrize] = []
    now = datetime.now(timezone.utc)

    for place, run in enumerate(runs[:3], start=1):
        gems = payout_gems(pool, place)
        if gems < 1:
            continue
        row = TournamentPrize(
            user_id=run.user_id,
            tier_id=tier,
            period_key=pk,
            place=place,
            gems=gems,
            score=run.score,
            granted_at=now,
            seen_at=None,
        )
        db.session.add(row)
        created.append(row)

        prog = PlayerProgress.query.filter_by(user_id=run.user_id).first()
        payload = load_progress_payload(prog)
        stamp = _now_ms()
        payload["credits"] = int(payload.get("credits") or STARTING_CREDITS) + gems
        payload["updatedAt"] = stamp
        text = json.dumps(payload)
        if not prog:
            db.session.add(
                PlayerProgress(
                    user_id=run.user_id,
                    payload=text,
                    client_updated_at=stamp,
                )
            )
        else:
            prog.payload = text
            prog.client_updated_at = stamp

    if not created:
        return []

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return []
    return created


def settle_closed_periods(*, max_periods_per_tier: int = 12) -> int:
    """Pay out any closed cups that still lack prize rows. Returns prizes created."""
    total = 0
    for tier in VALID_TIERS:
        current = period_key(tier)
        for pk in _past_period_keys(tier, current)[:max_periods_per_tier]:
            total += len(settle_tier_period(tier, pk))
    return total


def pending_prizes_for_user(user_id: int) -> list[dict]:
    """Unseen prize awards (gems already granted). Also settles closed periods first."""
    settle_closed_periods()
    rows = (
        TournamentPrize.query.filter_by(user_id=user_id, seen_at=None)
        .order_by(TournamentPrize.granted_at.asc())
        .all()
    )
    out = []
    for r in rows:
        out.append(
            {
                "id": r.id,
                "tier_id": r.tier_id,
                "period_key": r.period_key,
                "place": r.place,
                "gems": r.gems,
                "score": r.score,
                "granted_at": r.granted_at.isoformat() if r.granted_at else None,
            }
        )
    return out


def acknowledge_prizes(user_id: int, prize_ids: list[int] | None = None) -> int:
    """Mark prizes as seen so the popup does not repeat. Returns count updated."""
    q = TournamentPrize.query.filter_by(user_id=user_id, seen_at=None)
    if prize_ids:
        q = q.filter(TournamentPrize.id.in_(prize_ids))
    rows = q.all()
    if not rows:
        return 0
    now = datetime.now(timezone.utc)
    for r in rows:
        r.seen_at = now
    db.session.commit()
    return len(rows)


def tier_display_name(tier_id: str) -> str:
    return {
        "bronze": "Bronze Cup",
        "silver": "Silver Cup",
        "gold": "Gold Cup",
    }.get(tier_id, tier_id.title())
