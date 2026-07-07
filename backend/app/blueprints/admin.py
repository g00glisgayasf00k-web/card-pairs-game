import json
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc, func

from app.leaderboards import build_leaderboards
from app.models import PlayerProgress, Score, User, db

admin_bp = Blueprint("admin", __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user or not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def _progress_summary(payload: dict | None) -> dict | None:
    if not payload:
        return None
    level_stars = payload.get("levelStars") or {}
    stars_total = sum(int(v) for v in level_stars.values() if isinstance(v, (int, float)))
    return {
        "level": payload.get("level"),
        "credits": payload.get("credits"),
        "energy": payload.get("energy"),
        "completed": len(payload.get("completedLevels") or []),
        "highest_unlocked": payload.get("highestUnlocked"),
        "stars_total": stars_total,
        "hands_cleared": payload.get("handsCleared"),
        "lifetime_hand_counts": payload.get("lifetimeHandCounts") or {},
        "client_updated_at": payload.get("updatedAt"),
    }


@admin_bp.get("/me")
@jwt_required()
def admin_me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"username": user.username, "is_admin": bool(user.is_admin)})


@admin_bp.get("/stats")
@admin_required
def admin_stats():
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    user_count = User.query.count()
    player_count = User.query.filter(User.is_admin.is_(False)).count()
    score_count = Score.query.count()
    synced_count = PlayerProgress.query.count()
    signups_7d = User.query.filter(User.created_at >= week_ago).count()
    scores_7d = Score.query.filter(Score.created_at >= week_ago).count()

    recent_scores = (
        db.session.query(Score, User.username)
        .join(User)
        .order_by(desc(Score.created_at))
        .limit(8)
        .all()
    )

    recent_users = User.query.order_by(desc(User.id)).limit(8).all()

    return jsonify(
        {
            "users": user_count,
            "players": player_count,
            "scores": score_count,
            "synced_players": synced_count,
            "users_pending_sync": max(0, user_count - synced_count),
            "signups_7d": signups_7d,
            "scores_7d": scores_7d,
            "recent_scores": [
                {
                    "username": username,
                    "points": score.points,
                    "hands_cleared": score.hands_cleared,
                    "best_hand": score.best_hand,
                    "played_at": score.created_at.isoformat(),
                }
                for score, username in recent_scores
            ],
            "recent_signups": [
                {
                    "id": u.id,
                    "username": u.username,
                    "created_at": u.created_at.isoformat(),
                }
                for u in recent_users
            ],
        }
    )


@admin_bp.get("/leaderboard")
@admin_required
def admin_leaderboard():
    limit = min(int(request.args.get("limit", 25)), 100)
    payload = build_leaderboards(limit)
    return jsonify({"leaderboard": payload["top_scores"]})


@admin_bp.get("/leaderboards")
@admin_required
def admin_leaderboards():
    limit = min(int(request.args.get("limit", 10)), 50)
    return jsonify(build_leaderboards(limit))


@admin_bp.get("/users")
@admin_required
def admin_users():
    limit = min(int(request.args.get("limit", 25)), 100)
    offset = max(int(request.args.get("offset", 0)), 0)
    query_text = (request.args.get("q") or "").strip()

    base_query = User.query
    if query_text:
        base_query = base_query.filter(User.username.ilike(f"%{query_text}%"))

    total = base_query.count()
    rows = (
        base_query.order_by(desc(User.id))
        .offset(offset)
        .limit(limit)
        .all()
    )

    user_ids = [u.id for u in rows]
    progress_map: dict[int, PlayerProgress] = {}
    score_counts: dict[int, int] = {}

    if user_ids:
        progress_map = {
            p.user_id: p
            for p in PlayerProgress.query.filter(PlayerProgress.user_id.in_(user_ids)).all()
        }
        score_counts = dict(
            db.session.query(Score.user_id, func.count(Score.id))
            .filter(Score.user_id.in_(user_ids))
            .group_by(Score.user_id)
            .all()
        )

    users = []
    for u in rows:
        prog = progress_map.get(u.id)
        summary = None
        if prog:
            try:
                summary = _progress_summary(json.loads(prog.payload))
                if summary is not None:
                    summary["client_updated_at"] = prog.client_updated_at
            except json.JSONDecodeError:
                summary = None

        users.append(
            {
                "id": u.id,
                "username": u.username,
                "is_admin": bool(u.is_admin),
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "score_count": score_counts.get(u.id, 0),
                "progress": summary,
                "has_synced": prog is not None,
            }
        )

    return jsonify({"users": users, "total": total, "offset": offset, "limit": limit})


@admin_bp.get("/users/<int:user_id>")
@admin_required
def admin_user_detail(user_id: int):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    prog = PlayerProgress.query.filter_by(user_id=user.id).first()
    progress_payload = None
    if prog:
        try:
            progress_payload = json.loads(prog.payload)
        except json.JSONDecodeError:
            progress_payload = None

    scores = (
        Score.query.filter_by(user_id=user.id)
        .order_by(desc(Score.created_at))
        .limit(50)
        .all()
    )

    best_score = (
        Score.query.filter_by(user_id=user.id)
        .order_by(desc(Score.points))
        .first()
    )

    return jsonify(
        {
            "id": user.id,
            "username": user.username,
            "is_admin": bool(user.is_admin),
            "created_at": user.created_at.isoformat(),
            "progress": progress_payload,
            "progress_summary": _progress_summary(progress_payload),
            "client_updated_at": prog.client_updated_at if prog else 0,
            "best_score": best_score.points if best_score else None,
            "scores": [
                {
                    "points": s.points,
                    "hands_cleared": s.hands_cleared,
                    "best_hand": s.best_hand,
                    "played_at": s.created_at.isoformat(),
                }
                for s in scores
            ],
        }
    )
