"""Tournament cup period keys — London midnight resets."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

try:
    LONDON = ZoneInfo("Europe/London")
except ZoneInfoNotFoundError:
    # Windows/dev without IANA DB — install tzdata. Fall back to UTC (no DST).
    LONDON = timezone.utc

# Daily / Weekly / Monthly · each with Low / Medium / High stakes.
# Legacy bronze/silver/gold kept as aliases → medium stake of that period.
TIER_RESET: dict[str, str] = {
    "daily_low": "daily",
    "daily_medium": "daily",
    "daily_high": "daily",
    "weekly_low": "weekly",
    "weekly_medium": "weekly",
    "weekly_high": "weekly",
    "monthly_low": "monthly",
    "monthly_medium": "monthly",
    "monthly_high": "monthly",
    "bronze": "daily",
    "silver": "weekly",
    "gold": "monthly",
}


def london_now(now: datetime | None = None) -> datetime:
    if now is None:
        now = datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return now.astimezone(LONDON)


def period_key(tier_id: str, now: datetime | None = None) -> str:
    """Stable id for the cup's current scoring window."""
    local = london_now(now)
    kind = TIER_RESET.get((tier_id or "").strip().lower(), "daily")
    if kind == "weekly":
        iso = local.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    if kind == "monthly":
        return local.strftime("%Y-%m")
    return local.strftime("%Y-%m-%d")


def period_ends_at(tier_id: str, now: datetime | None = None) -> datetime:
    """UTC instant when the current period ends (start of the next period, London midnight)."""
    local = london_now(now)
    kind = TIER_RESET.get((tier_id or "").strip().lower(), "daily")

    if kind == "weekly":
        # ISO week Mon–Sun; resets Monday 00:00 London (end of Sunday).
        days_until_next_monday = 7 - local.weekday()  # Mon→7 … Sun→1
        next_start = (local + timedelta(days=days_until_next_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        if next_start <= local:
            next_start += timedelta(days=7)
    elif kind == "monthly":
        # Resets at midnight after the last day of the month (= 1st 00:00).
        if local.month == 12:
            next_start = local.replace(
                year=local.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
        else:
            next_start = local.replace(
                month=local.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
    else:
        next_start = (local + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

    return next_start.astimezone(timezone.utc)


def period_meta(tier_id: str, now: datetime | None = None) -> dict:
    tier = (tier_id or "").strip().lower()
    ends = period_ends_at(tier, now)
    return {
        "tier_id": tier,
        "reset": TIER_RESET.get(tier, "daily"),
        "period_key": period_key(tier, now),
        "period_ends_at": ends.isoformat().replace("+00:00", "Z"),
    }


def period_sort_key(pk: str) -> tuple:
    """Sort period keys newest-first (legacy last)."""
    key = (pk or "").strip()
    if not key or key == "legacy":
        return (0, "")
    return (1, key)
