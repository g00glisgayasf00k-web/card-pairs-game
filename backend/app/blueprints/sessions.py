"""Client heartbeat sessions for playtime / engagement metrics."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.db_util import as_utc, iso_utc
from app.models import GameSession, User, db

sessions_bp = Blueprint("sessions", __name__)

# If no ping within this window, start a new session.
SESSION_GAP = timedelta(minutes=5)
# Cap each heartbeat credit so a tab left open overnight doesn't invent hours.
MAX_HEARTBEAT_SECONDS = 180


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
    # Store naive UTC — matches other columns and avoids aware/naive PG quirks.
    now_naive = now.replace(tzinfo=None)

    open_session = (
        GameSession.query.filter_by(user_id=user_id, ended_at=None)
        .order_by(GameSession.id.desc())
        .first()
    )

    added = 0
    if open_session and open_session.last_heartbeat_at:
        last = as_utc(open_session.last_heartbeat_at)
        gap_sec = max(0, int((now - last).total_seconds())) if last else 0
        if gap_sec <= int(SESSION_GAP.total_seconds()):
            added = min(MAX_HEARTBEAT_SECONDS, gap_sec)
            open_session.last_heartbeat_at = now_naive
            open_session.duration_seconds = int(open_session.duration_seconds or 0) + added
            if platform:
                open_session.platform = platform
            session_id = open_session.id
            duration = open_session.duration_seconds
        else:
            open_session.ended_at = open_session.last_heartbeat_at
            open_session = GameSession(
                user_id=user_id,
                started_at=now_naive,
                last_heartbeat_at=now_naive,
                duration_seconds=0,
                platform=platform,
            )
            db.session.add(open_session)
            db.session.flush()
            session_id = open_session.id
            duration = 0
    else:
        if open_session and open_session.ended_at is None:
            # Stale row with no heartbeat — close it before opening a fresh one.
            open_session.ended_at = now_naive
        open_session = GameSession(
            user_id=user_id,
            started_at=now_naive,
            last_heartbeat_at=now_naive,
            duration_seconds=0,
            platform=platform,
        )
        db.session.add(open_session)
        db.session.flush()
        session_id = open_session.id
        duration = 0

    user.last_seen_at = now_naive
    user.total_play_seconds = int(user.total_play_seconds or 0) + added
    db.session.commit()

    return jsonify(
        {
            "ok": True,
            "session_id": session_id,
            "session_seconds": duration,
            "total_play_seconds": int(user.total_play_seconds or 0),
            "added_seconds": added,
            "server_time": iso_utc(now),
        }
    )
