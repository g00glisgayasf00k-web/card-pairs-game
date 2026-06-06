import json
from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc, func

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
    user_count = User.query.count()
    score_count = Score.query.count()
    synced_count = PlayerProgress.query.count()
    return jsonify(
        {
            "users": user_count,
            "scores": score_count,
            "synced_players": synced_count,
        }
    )


@admin_bp.get("/users")
@admin_required
def admin_users():
    limit = min(int(request.args.get("limit", 50)), 200)
    offset = max(int(request.args.get("offset", 0)), 0)

    rows = (
        User.query.order_by(desc(User.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    user_ids = [u.id for u in rows]
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
                payload = json.loads(prog.payload)
                summary = {
                    "level": payload.get("level"),
                    "credits": payload.get("credits"),
                    "energy": payload.get("energy"),
                    "completed": len(payload.get("completedLevels") or []),
                    "highest_unlocked": payload.get("highestUnlocked"),
                    "client_updated_at": prog.client_updated_at,
                }
            except json.JSONDecodeError:
                summary = None

        users.append(
            {
                "id": u.id,
                "username": u.username,
                "is_admin": bool(u.is_admin),
                "created_at": u.created_at.isoformat(),
                "score_count": score_counts.get(u.id, 0),
                "progress": summary,
            }
        )

    total = User.query.count()
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
        .limit(20)
        .all()
    )

    return jsonify(
        {
            "id": user.id,
            "username": user.username,
            "is_admin": bool(user.is_admin),
            "created_at": user.created_at.isoformat(),
            "progress": progress_payload,
            "client_updated_at": prog.client_updated_at if prog else 0,
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
