"""Friends list — request / accept / decline by username."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Friendship, User, db
from app.services.push import send_to_user

friends_bp = Blueprint("friends", __name__)


def _utc_now():
    return datetime.now(timezone.utc)


def _pair_ids(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def _find_friendship(a: int, b: int) -> Friendship | None:
    return Friendship.query.filter(
        ((Friendship.user_id == a) & (Friendship.friend_id == b))
        | ((Friendship.user_id == b) & (Friendship.friend_id == a))
    ).first()


def _user_public(u: User) -> dict:
    return {"id": u.id, "username": u.username}


def _notify_friend(user_id: int, title: str, body: str, kind: str) -> None:
    try:
        send_to_user(user_id, title=title, body=body, data={"type": kind})
    except Exception:
        pass


@friends_bp.get("")
@jwt_required()
def list_friends():
    me = int(get_jwt_identity())
    rows = Friendship.query.filter(
        (Friendship.user_id == me) | (Friendship.friend_id == me)
    ).all()

    accepted = []
    incoming = []
    outgoing = []

    for row in rows:
        other_id = row.friend_id if row.user_id == me else row.user_id
        other = User.query.get(other_id)
        if not other:
            continue
        item = {
            "id": row.id,
            "user": _user_public(other),
            "status": row.status,
            "created_at": row.created_at.isoformat(),
        }
        if row.status == "accepted":
            accepted.append(item)
        elif row.friend_id == me:
            incoming.append(item)
        else:
            outgoing.append(item)

    accepted.sort(key=lambda x: x["user"]["username"].lower())
    return jsonify(
        {"friends": accepted, "incoming": incoming, "outgoing": outgoing}
    )


@friends_bp.post("/request")
@jwt_required()
def request_friend():
    me = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    if not username:
        return jsonify({"error": "Username required"}), 400

    other = User.query.filter_by(username=username).first()
    if not other:
        return jsonify({"error": "Player not found"}), 404
    if other.id == me:
        return jsonify({"error": "Cannot friend yourself"}), 400

    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Someone"

    existing = _find_friendship(me, other.id)
    if existing:
        if existing.status == "accepted":
            return jsonify({"error": "Already friends"}), 409
        if existing.user_id == me:
            return jsonify({"error": "Request already sent"}), 409
        # They already requested us — auto-accept
        existing.status = "accepted"
        existing.updated_at = _utc_now()
        db.session.commit()
        _notify_friend(
            other.id,
            "Friend request accepted",
            f"{me_name} is now your friend",
            "friend_accepted",
        )
        return jsonify({"friendship": {"id": existing.id, "status": "accepted", "user": _user_public(other)}})

    row = Friendship(user_id=me, friend_id=other.id, status="pending")
    db.session.add(row)
    db.session.commit()
    _notify_friend(
        other.id,
        "Friend request",
        f"{me_name} wants to be friends",
        "friend_request",
    )
    return jsonify(
        {
            "friendship": {
                "id": row.id,
                "status": "pending",
                "user": _user_public(other),
            }
        }
    ), 201


@friends_bp.post("/<int:friendship_id>/accept")
@jwt_required()
def accept_friend(friendship_id: int):
    me = int(get_jwt_identity())
    row = Friendship.query.get(friendship_id)
    if not row or row.friend_id != me or row.status != "pending":
        return jsonify({"error": "Request not found"}), 404
    row.status = "accepted"
    row.updated_at = _utc_now()
    db.session.commit()
    other = User.query.get(row.user_id)
    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Someone"
    if other:
        _notify_friend(
            other.id,
            "Friend request accepted",
            f"{me_name} accepted your friend request",
            "friend_accepted",
        )
    return jsonify(
        {
            "friendship": {
                "id": row.id,
                "status": "accepted",
                "user": _user_public(other) if other else None,
            }
        }
    )


@friends_bp.post("/<int:friendship_id>/decline")
@jwt_required()
def decline_friend(friendship_id: int):
    me = int(get_jwt_identity())
    row = Friendship.query.get(friendship_id)
    if not row:
        return jsonify({"error": "Request not found"}), 404
    if row.friend_id != me and row.user_id != me:
        return jsonify({"error": "Request not found"}), 404
    if row.status == "accepted" and row.user_id != me and row.friend_id != me:
        return jsonify({"error": "Request not found"}), 404

    # Incoming decline or cancel outgoing / unfriend
    db.session.delete(row)
    db.session.commit()
    return jsonify({"ok": True})
