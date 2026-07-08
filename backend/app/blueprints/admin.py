import json
from datetime import datetime, timedelta, timezone
from functools import wraps
from zoneinfo import ZoneInfo

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc, func

from app.leaderboards import build_leaderboards
from app.models import PlayerProgress, Score, User, db
from app.password_util import generate_temp_password, hash_password

admin_bp = Blueprint("admin", __name__)

PROGRESS_VERSION = 9
MAX_ENERGY = 12
STARTING_CREDITS = 200
MAX_GEM_GRANT = 100_000
MAX_ENERGY_GRANT = 12


def _uk_date_key() -> str:
    return datetime.now(ZoneInfo("Europe/London")).strftime("%Y-%m-%d")


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


def _load_progress_payload(row: PlayerProgress | None) -> dict:
    if not row:
        return _default_progress_payload()
    try:
        payload = json.loads(row.payload)
        if isinstance(payload, dict):
            return payload
    except json.JSONDecodeError:
        pass
    return _default_progress_payload()


def _save_progress_payload(user_id: int, payload: dict, client_updated_at: int) -> PlayerProgress:
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
    return jsonify({"username": user.username, "is_admin": bool(user.is_admin), "user_id": user.id})


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

    db_uri = current_app.config.get("SQLALCHEMY_DATABASE_URI") or ""
    if "postgres" in db_uri:
        db_backend = "postgres"
    elif "sqlite" in db_uri:
        db_backend = "sqlite"
    else:
        db_backend = "unknown"

    return jsonify(
        {
            "users": user_count,
            "players": player_count,
            "scores": score_count,
            "db_backend": db_backend,
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
            "email": user.email,
            "has_google": bool(user.google_id),
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


@admin_bp.post("/users/<int:user_id>/reset")
@admin_required
def admin_reset_user(user_id: int):
    """Clear a player's scores and cloud progress (moderation)."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    Score.query.filter_by(user_id=user.id).delete()
    PlayerProgress.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({"reset": True, "username": user.username}), 200


@admin_bp.delete("/users/<int:user_id>")
@admin_required
def admin_delete_user(user_id: int):
    """Permanently delete a player account and all associated data."""
    actor_id = int(get_jwt_identity())
    if user_id == actor_id:
        return jsonify({"error": "You cannot delete your own account while signed in"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    username = user.username
    Score.query.filter_by(user_id=user.id).delete()
    PlayerProgress.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"deleted": True, "username": username}), 200


@admin_bp.post("/users/<int:user_id>/grant")
@admin_required
def admin_grant_resources(user_id: int):
    """Add gems and/or energy to a player's cloud save."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    gems_raw = data.get("gems")
    energy_raw = data.get("energy")

    if gems_raw is None and energy_raw is None:
        return jsonify({"error": "Provide gems and/or energy to grant"}), 400

    gems_add = 0
    energy_add = 0

    if gems_raw is not None:
        try:
            gems_add = int(gems_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "gems must be an integer"}), 400
        if gems_add < 1 or gems_add > MAX_GEM_GRANT:
            return jsonify({"error": f"gems must be between 1 and {MAX_GEM_GRANT}"}), 400

    if energy_raw is not None:
        try:
            energy_add = int(energy_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "energy must be an integer"}), 400
        if energy_add < 1 or energy_add > MAX_ENERGY_GRANT:
            return jsonify({"error": f"energy must be between 1 and {MAX_ENERGY_GRANT}"}), 400

    row = PlayerProgress.query.filter_by(user_id=user.id).first()
    payload = _load_progress_payload(row)
    now = _now_ms()

    if gems_add:
        payload["credits"] = max(0, int(payload.get("credits") or STARTING_CREDITS) + gems_add)

    if energy_add:
        current_energy = int(payload.get("energy") if payload.get("energy") is not None else MAX_ENERGY)
        payload["energy"] = min(MAX_ENERGY, max(0, current_energy + energy_add))
        if payload["energy"] >= MAX_ENERGY:
            payload["energyRegenAt"] = 0

    payload["updatedAt"] = now
    _save_progress_payload(user.id, payload, now)

    summary = _progress_summary(payload)
    return jsonify(
        {
            "granted": True,
            "username": user.username,
            "gems_added": gems_add,
            "energy_added": energy_add,
            "progress_summary": summary,
            "client_updated_at": now,
        }
    ), 200


@admin_bp.post("/users/<int:user_id>/admin")
@admin_required
def admin_set_role(user_id: int):
    """Promote a player to admin or revoke an existing admin's access."""
    actor_id = int(get_jwt_identity())
    if user_id == actor_id:
        return jsonify({"error": "You cannot change your own admin status"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    make_admin = data.get("is_admin")
    if not isinstance(make_admin, bool):
        return jsonify({"error": "is_admin must be true or false"}), 400

    if user.is_admin == make_admin:
        return jsonify(
            {"updated": False, "username": user.username, "is_admin": user.is_admin}
        ), 200

    if not make_admin:
        admin_count = User.query.filter(User.is_admin.is_(True)).count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot revoke the last remaining admin"}), 400

    user.is_admin = make_admin
    db.session.commit()

    return jsonify(
        {"updated": True, "username": user.username, "is_admin": user.is_admin}
    ), 200


@admin_bp.post("/users/<int:user_id>/reset-password")
@admin_required
def admin_reset_password(user_id: int):
    """Set a temporary password for a player who lost access."""
    actor_id = int(get_jwt_identity())
    if user_id == actor_id:
        return jsonify({"error": "Use your account settings to change your own password"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    custom = (data.get("password") or "").strip()
    if custom:
        if len(custom) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        if len(custom) > 72:
            return jsonify({"error": "Password is too long"}), 400
        temp_password = custom
    else:
        temp_password = generate_temp_password()

    user.password_hash = hash_password(temp_password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify(
        {
            "reset": True,
            "username": user.username,
            "temporary_password": temp_password,
        }
    ), 200
