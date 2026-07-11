import json

from sqlalchemy import desc

from app.models import PlayerProgress, Score, User, db

HAND_LABELS = [
    "pair",
    "two_pair",
    "three_of_a_kind",
    "straight",
    "flush",
    "full_house",
    "four_of_a_kind",
    "straight_flush",
    "royal_flush",
]


def _parse_progress_payload(raw: str) -> dict | None:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _campaign_level(payload: dict) -> int:
    highest = int(payload.get("highestUnlocked") or 1)
    current = int(payload.get("level") or 1)
    return max(1, highest, current)


def _lifetime_hand_counts(payload: dict) -> dict[str, int]:
    raw = payload.get("lifetimeHandCounts") or {}
    if not isinstance(raw, dict):
        return {}
    out: dict[str, int] = {}
    for hand in HAND_LABELS:
        val = raw.get(hand)
        if isinstance(val, (int, float)) and val > 0:
            out[hand] = int(val)
    return out


def build_leaderboards(limit: int = 10) -> dict:
    limit = max(1, min(limit, 50))

    score_rows = (
        db.session.query(Score, User.username, User.id)
        .join(User)
        .order_by(desc(Score.points), desc(Score.created_at))
        .all()
    )
    best_score_by_user: dict[int, dict] = {}
    for score, username, user_id in score_rows:
        existing = best_score_by_user.get(user_id)
        if existing is None or score.points > existing["points"]:
            best_score_by_user[user_id] = {
                "user_id": user_id,
                "username": username,
                "points": score.points,
                "hands_cleared": score.hands_cleared,
                "best_hand": score.best_hand,
                "played_at": score.created_at.isoformat(),
            }
    top_scores = sorted(
        best_score_by_user.values(), key=lambda row: row["points"], reverse=True
    )[:limit]

    progress_rows = (
        db.session.query(PlayerProgress, User.username, User.id)
        .join(User)
        .all()
    )

    level_rows: list[dict] = []
    hand_totals: dict[str, dict[int, dict]] = {hand: {} for hand in HAND_LABELS}

    for prog, username, user_id in progress_rows:
        payload = _parse_progress_payload(prog.payload)
        if not payload:
            continue

        campaign_level = _campaign_level(payload)
        level_rows.append(
            {
                "user_id": user_id,
                "username": username,
                "level": campaign_level,
                "highest_unlocked": int(payload.get("highestUnlocked") or 1),
                "completed": len(payload.get("completedLevels") or []),
                "stars_total": sum(
                    int(v)
                    for v in (payload.get("levelStars") or {}).values()
                    if isinstance(v, (int, float))
                ),
            }
        )

        for hand, count in _lifetime_hand_counts(payload).items():
            existing = hand_totals[hand].get(user_id)
            if existing is None or count > existing["count"]:
                hand_totals[hand][user_id] = {
                    "user_id": user_id,
                    "username": username,
                    "count": count,
                }

    highest_level = sorted(level_rows, key=lambda row: row["level"], reverse=True)[:limit]

    most_stars = sorted(
        [row for row in level_rows if row["stars_total"] > 0],
        key=lambda row: (row["stars_total"], row["level"], row["completed"]),
        reverse=True,
    )[:limit]

    hand_leaders: dict[str, list[dict]] = {}
    for hand in HAND_LABELS:
        leaders = sorted(
            hand_totals[hand].values(), key=lambda row: row["count"], reverse=True
        )[:limit]
        hand_leaders[hand] = leaders

    return {
        "top_scores": top_scores,
        "highest_level": highest_level,
        "most_stars": most_stars,
        "hand_leaders": hand_leaders,
    }
