"""In-app notification summary + device token registration for push."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Challenge, DeviceToken, Friendship, db

notifications_bp = Blueprint("notifications", __name__)


def _utc_now():
    return datetime.now(timezone.utc)


def _as_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def count_incoming_friend_requests(user_id: int) -> int:
    return Friendship.query.filter_by(friend_id=user_id, status="pending").count()


def count_actionable_challenges(user_id: int) -> int:
    rows = Challenge.query.filter(
        (Challenge.challenger_id == user_id) | (Challenge.opponent_id == user_id),
        Challenge.status.in_(("pending", "active")),
    ).all()
    now = _utc_now()
    count = 0
    dirty = False
    for ch in rows:
        kind = getattr(ch, "kind", None) or "friend"
        if kind != "friend":
            continue
        expires = _as_aware(ch.expires_at)
        if expires < now and ch.status in ("pending", "active"):
            ch.status = "expired"
            ch.updated_at = now
            dirty = True
            continue
        if ch.status == "pending" and ch.opponent_id == user_id:
            count += 1
        elif ch.status == "active":
            if ch.challenger_id == user_id and not ch.challenger_submitted_at:
                count += 1
            elif ch.opponent_id == user_id and not ch.opponent_submitted_at:
                count += 1
    if dirty:
        db.session.commit()
    return count


def notification_summary(user_id: int) -> dict:
    friends = count_incoming_friend_requests(user_id)
    challenges = count_actionable_challenges(user_id)
    return {
        "friend_requests": friends,
        "challenges": challenges,
        "total": friends + challenges,
    }


@notifications_bp.get("/summary")
@jwt_required()
def summary():
    me = int(get_jwt_identity())
    return jsonify(notification_summary(me))


@notifications_bp.post("/devices")
@jwt_required()
def register_device():
    me = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    platform = (data.get("platform") or "android").strip().lower()[:16]
    if not token or len(token) < 20:
        return jsonify({"error": "Valid device token required"}), 400
    if platform not in ("android", "ios", "web"):
        platform = "android"

    row = DeviceToken.query.filter_by(token=token).first()
    now = _utc_now()
    if row:
        row.user_id = me
        row.platform = platform
        row.updated_at = now
    else:
        row = DeviceToken(user_id=me, token=token, platform=platform)
        db.session.add(row)
    db.session.commit()
    return jsonify({"ok": True})


@notifications_bp.delete("/devices")
@jwt_required()
def unregister_device():
    me = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    if not token:
        return jsonify({"error": "token required"}), 400
    row = DeviceToken.query.filter_by(token=token, user_id=me).first()
    if row:
        db.session.delete(row)
        db.session.commit()
    return jsonify({"ok": True})
