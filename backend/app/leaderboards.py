import json

from sqlalchemy import desc

from app.models import Friendship, PlayerProgress, Score, TournamentRun, User, db
from app.tournament_periods import period_key, period_meta

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

DEFAULT_ELO = 1000

TOURNAMENT_CUP_NAMES = {
    "bronze": "Bronze Cup",
    "silver": "Silver Cup",
    "gold": "Gold Cup",
}


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


def _stars_total(payload: dict) -> int:
    return sum(
        int(v)
        for v in (payload.get("levelStars") or {}).values()
        if isinstance(v, (int, float))
    )


def _player_rating(payload: dict) -> int:
    raw = payload.get("elo")
    try:
        return max(100, int(raw))
    except (TypeError, ValueError):
        return DEFAULT_ELO


def _rank_tournament(score: int, duration_ms: int | None) -> tuple[int, int]:
    d = int(duration_ms) if duration_ms is not None and duration_ms > 0 else 10**12
    return (-int(score), d)


def build_tournament_winners(limit_per_cup: int = 5) -> list[dict]:
    limit_per_cup = max(1, min(limit_per_cup, 20))
    cups: list[dict] = []
    for tier_id, name in TOURNAMENT_CUP_NAMES.items():
        pk = period_key(tier_id)
        meta = period_meta(tier_id)
        runs = TournamentRun.query.filter_by(tier_id=tier_id, period_key=pk).all()
        runs.sort(key=lambda r: _rank_tournament(r.score, getattr(r, "duration_ms", None)))
        user_ids = [r.user_id for r in runs[:limit_per_cup]]
        users = (
            {u.id: u.username for u in User.query.filter(User.id.in_(user_ids)).all()}
            if user_ids
            else {}
        )
        winners = []
        for i, run in enumerate(runs[:limit_per_cup], start=1):
            winners.append(
                {
                    "place": i,
                    "user_id": run.user_id,
                    "username": users.get(run.user_id, "?"),
                    "hands": run.hands,
                    "score": run.score,
                    "target_points": run.target_points,
                    "point_delta": abs(run.score - run.target_points),
                    "duration_ms": getattr(run, "duration_ms", None),
                }
            )
        cups.append(
            {
                "tier_id": tier_id,
                "name": name,
                "winners": winners,
                "reset": meta["reset"],
                "period_key": meta["period_key"],
                "period_ends_at": meta["period_ends_at"],
            }
        )
    return cups


def build_friends_board(user_id: int, limit: int = 20) -> list[dict]:
    """Stars ranking among the player and their accepted friends."""
    limit = max(1, min(limit, 50))
    rows = Friendship.query.filter(
        ((Friendship.user_id == user_id) | (Friendship.friend_id == user_id))
        & (Friendship.status == "accepted")
    ).all()
    ids = {user_id}
    for row in rows:
        ids.add(row.friend_id if row.user_id == user_id else row.user_id)

    users = {u.id: u.username for u in User.query.filter(User.id.in_(list(ids))).all()}
    progress_rows = PlayerProgress.query.filter(PlayerProgress.user_id.in_(list(ids))).all()
    by_user: dict[int, dict] = {}
    for prog in progress_rows:
        payload = _parse_progress_payload(prog.payload)
        if not payload:
            continue
        uid = prog.user_id
        by_user[uid] = {
            "user_id": uid,
            "username": users.get(uid, "?"),
            "level": _campaign_level(payload),
            "stars_total": _stars_total(payload),
            "rating": _player_rating(payload),
            "is_you": uid == user_id,
        }

    for uid in ids:
        if uid not in by_user:
            by_user[uid] = {
                "user_id": uid,
                "username": users.get(uid, "?"),
                "level": 1,
                "stars_total": 0,
                "rating": DEFAULT_ELO,
                "is_you": uid == user_id,
            }

    ranked = sorted(
        by_user.values(),
        key=lambda row: (row["stars_total"], row["level"], row["rating"]),
        reverse=True,
    )[:limit]
    return ranked


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
    rating_rows: list[dict] = []
    hand_totals: dict[str, dict[int, dict]] = {hand: {} for hand in HAND_LABELS}

    for prog, username, user_id in progress_rows:
        payload = _parse_progress_payload(prog.payload)
        if not payload:
            continue

        campaign_level = _campaign_level(payload)
        stars = _stars_total(payload)
        rating = _player_rating(payload)
        level_rows.append(
            {
                "user_id": user_id,
                "username": username,
                "level": campaign_level,
                "highest_unlocked": int(payload.get("highestUnlocked") or 1),
                "completed": len(payload.get("completedLevels") or []),
                "stars_total": stars,
            }
        )
        rating_rows.append(
            {
                "user_id": user_id,
                "username": username,
                "rating": rating,
                "level": campaign_level,
                "stars_total": stars,
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

    # Only players who have finished at least one Quick Play (avoids a wall of default 1000s).
    from app.models import Challenge

    played_ids = {
        uid
        for (uid,) in db.session.query(Challenge.challenger_id)
        .filter(Challenge.kind == "quick", Challenge.status == "completed")
        .distinct()
    } | {
        uid
        for (uid,) in db.session.query(Challenge.opponent_id)
        .filter(Challenge.kind == "quick", Challenge.status == "completed")
        .distinct()
    }
    top_quick_play = sorted(
        [row for row in rating_rows if row["user_id"] in played_ids],
        key=lambda row: (row["rating"], row["stars_total"], row["level"]),
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
        "top_quick_play": top_quick_play,
        "tournament_winners": build_tournament_winners(5),
        "hand_leaders": hand_leaders,
    }
