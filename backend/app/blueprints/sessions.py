"""Client heartbeat sessions for playtime / engagement metrics."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import GameSession, User, db

sessions_bp = Blueprint("sessions", __name__)

# If no ping within this window, start a new session.
SESSION_GAP = timedelta(minutes=3)
# Cap each heartbeat credit so a tab left open overnight doesn't invent hours.
MAX_HEARTBEAT_SECONDS = 120


@sessions_bp.post("/ping")
@jwt_required()
def session_ping():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    body = request.get_json(silent=True) or {}
    platform = str(body.get("platform") or "").strip()[:32] or None
    now = datetime.now(timezone.utc)

    open_session = (
        GameSession.query.filter_by(user_id=user_id, ended_at=None)
        .order_by(GameSession.id.desc())
        .first()
    )

    added = 0
    if open_session and open_session.last_heartbeat_at:
        last = open_session.last_heartbeat_at
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        gap = now - last
        if gap <= SESSION_GAP:
            added = min(MAX_HEARTBEAT_SECONDS, max(0, int(gap.total_seconds())))
            open_session.last_heartbeat_at = now
            open_session.duration_seconds = int(open_session.duration_seconds or 0) + added
            session_id = open_session.id
            duration = open_session.duration_seconds
        else:
            open_session.ended_at = last
            open_session = GameSession(
                user_id=user_id,
                started_at=now,
                last_heartbeat_at=now,
                duration_seconds=0,
                platform=platform,
            )
            db.session.add(open_session)
            db.session.flush()
            session_id = open_session.id
            duration = 0
    else:
        open_session = GameSession(
            user_id=user_id,
            started_at=now,
            last_heartbeat_at=now,
            duration_seconds=0,
            platform=platform,
        )
        db.session.add(open_session)
        db.session.flush()
        session_id = open_session.id
        duration = 0

    user.last_seen_at = now
    user.total_play_seconds = int(user.total_play_seconds or 0) + added
    db.session.commit()

    return jsonify(
        {
            "ok": True,
            "session_id": session_id,
            "session_seconds": duration,
            "total_play_seconds": user.total_play_seconds,
            "added_seconds": added,
        }
    )
