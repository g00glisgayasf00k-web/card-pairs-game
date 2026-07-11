"""Async seeded challenges between friends."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Challenge, Friendship, PlayerProgress, User, db
from app.services.push import send_to_user

challenges_bp = Blueprint("challenges", __name__)

MAX_LEVEL = 500
CHALLENGE_TTL_HOURS = 24


def _utc_now():
    return datetime.now(timezone.utc)


def _notify(user_id: int, title: str, body: str, data: dict[str, str]) -> None:
    try:
        send_to_user(user_id, title=title, body=body, data=data)
    except Exception:
        pass


def _user_public(u: User | None) -> dict | None:
    if not u:
        return None
    return {"id": u.id, "username": u.username}


def _are_friends(a: int, b: int) -> bool:
    row = Friendship.query.filter(
        Friendship.status == "accepted",
        ((Friendship.user_id == a) & (Friendship.friend_id == b))
        | ((Friendship.user_id == b) & (Friendship.friend_id == a)),
    ).first()
    return row is not None


def _highest_unlocked(user_id: int) -> int:
    prog = PlayerProgress.query.filter_by(user_id=user_id).first()
    if not prog or not prog.payload:
        return 1
    try:
        data = json.loads(prog.payload)
    except (TypeError, ValueError):
        return 1
    hu = data.get("highestUnlocked")
    if isinstance(hu, (int, float)) and hu >= 1:
        return min(MAX_LEVEL, int(hu))
    level = data.get("level")
    if isinstance(level, (int, float)) and level >= 1:
        return min(MAX_LEVEL, int(level))
    return 1


def _expire_if_needed(ch: Challenge) -> None:
    if ch.status in ("pending", "active") and ch.expires_at.replace(tzinfo=timezone.utc) < _utc_now():
        # SQLite may return naive datetimes
        expires = ch.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < _utc_now():
            ch.status = "expired"
            ch.updated_at = _utc_now()


def _compare_attempts(
    a_stars: int, a_moves: int, a_score: int, a_id: int,
    b_stars: int, b_moves: int, b_score: int, b_id: int,
) -> int | None:
    """Return winner user_id, or None on true tie."""
    if a_stars != b_stars:
        return a_id if a_stars > b_stars else b_id
    if a_moves != b_moves:
        return a_id if a_moves < b_moves else b_id
    if a_score != b_score:
        return a_id if a_score > b_score else b_id
    return None


def _serialize(ch: Challenge, me: int) -> dict:
    _expire_if_needed(ch)
    return {
        "id": ch.id,
        "level": ch.level,
        "board_seed": ch.board_seed,
        "status": ch.status,
        "kind": getattr(ch, "kind", None) or "friend",
        "wager_gems": ch.wager_gems,
        "expires_at": ch.expires_at.isoformat(),
        "challenger": _user_public(ch.challenger),
        "opponent": _user_public(ch.opponent),
        "you_are": "challenger" if ch.challenger_id == me else "opponent",
        "challenger_result": (
            {
                "stars": ch.challenger_stars,
                "moves": ch.challenger_moves,
                "score": ch.challenger_score,
                "submitted_at": ch.challenger_submitted_at.isoformat()
                if ch.challenger_submitted_at
                else None,
            }
            if ch.challenger_submitted_at
            else None
        ),
        "opponent_result": (
            {
                "stars": ch.opponent_stars,
                "moves": ch.opponent_moves,
                "score": ch.opponent_score,
                "submitted_at": ch.opponent_submitted_at.isoformat()
                if ch.opponent_submitted_at
                else None,
            }
            if ch.opponent_submitted_at
            else None
        ),
        "winner_user_id": ch.winner_user_id,
        "created_at": ch.created_at.isoformat(),
    }


@challenges_bp.get("")
@jwt_required()
def list_challenges():
    me = int(get_jwt_identity())
    rows = (
        Challenge.query.filter(
            (Challenge.challenger_id == me) | (Challenge.opponent_id == me)
        )
        .order_by(Challenge.created_at.desc())
        .limit(50)
        .all()
    )
    dirty = False
    out = []
    for ch in rows:
        before = ch.status
        item = _serialize(ch, me)
        if ch.status != before:
            dirty = True
        out.append(item)
    if dirty:
        db.session.commit()
    return jsonify({"challenges": out})


@challenges_bp.post("")
@jwt_required()
def create_challenge():
    me = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    friend_id = data.get("friend_user_id")
    try:
        friend_id = int(friend_id)
    except (TypeError, ValueError):
        return jsonify({"error": "friend_user_id required"}), 400

    if friend_id == me:
        return jsonify({"error": "Cannot challenge yourself"}), 400
    if not _are_friends(me, friend_id):
        return jsonify({"error": "You must be friends first"}), 403

    opponent = User.query.get(friend_id)
    if not opponent:
        return jsonify({"error": "Player not found"}), 404

    level = min(_highest_unlocked(me), _highest_unlocked(friend_id))
    level = max(1, min(MAX_LEVEL, level))

    seed = secrets.randbits(31)
    ch = Challenge(
        challenger_id=me,
        opponent_id=friend_id,
        level=level,
        board_seed=seed,
        status="pending",
        kind="friend",
        wager_gems=0,
        expires_at=_utc_now() + timedelta(hours=CHALLENGE_TTL_HOURS),
    )
    db.session.add(ch)
    db.session.commit()
    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "A friend"
    _notify(
        friend_id,
        "New challenge",
        f"{me_name} challenged you — level {level}",
        {"type": "challenge", "challenge_id": str(ch.id)},
    )
    return jsonify({"challenge": _serialize(ch, me)}), 201


@challenges_bp.get("/<int:challenge_id>")
@jwt_required()
def get_challenge(challenge_id: int):
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.challenger_id != me and ch.opponent_id != me):
        return jsonify({"error": "Challenge not found"}), 404
    before = ch.status
    payload = _serialize(ch, me)
    if ch.status != before:
        db.session.commit()
    return jsonify({"challenge": payload})


@challenges_bp.post("/<int:challenge_id>/accept")
@jwt_required()
def accept_challenge(challenge_id: int):
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or ch.opponent_id != me:
        return jsonify({"error": "Challenge not found"}), 404
    _expire_if_needed(ch)
    if ch.status != "pending":
        return jsonify({"error": f"Challenge is {ch.status}"}), 409
    ch.status = "active"
    ch.updated_at = _utc_now()
    db.session.commit()
    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Your friend"
    _notify(
        ch.challenger_id,
        "Challenge accepted",
        f"{me_name} accepted your challenge",
        {"type": "challenge", "challenge_id": str(ch.id)},
    )
    return jsonify({"challenge": _serialize(ch, me)})


@challenges_bp.post("/<int:challenge_id>/decline")
@jwt_required()
def decline_challenge(challenge_id: int):
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.opponent_id != me and ch.challenger_id != me):
        return jsonify({"error": "Challenge not found"}), 404
    if ch.status not in ("pending", "active"):
        return jsonify({"error": f"Challenge is {ch.status}"}), 409
    if ch.challenger_id == me and ch.status == "active":
        return jsonify({"error": "Cannot decline after accept — play or wait for expiry"}), 409
    ch.status = "declined"
    ch.updated_at = _utc_now()
    db.session.commit()
    return jsonify({"challenge": _serialize(ch, me)})


@challenges_bp.post("/<int:challenge_id>/submit")
@jwt_required()
def submit_challenge(challenge_id: int):
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.challenger_id != me and ch.opponent_id != me):
        return jsonify({"error": "Challenge not found"}), 404

    _expire_if_needed(ch)
    if ch.status == "expired":
        db.session.commit()
        already = (
            (ch.challenger_id == me and ch.challenger_submitted_at)
            or (ch.opponent_id == me and ch.opponent_submitted_at)
        )
        if already:
            return (
                jsonify(
                    {
                        "error": "Challenge expired",
                        "challenge": _serialize(ch, me),
                    }
                ),
                409,
            )
        return jsonify({"error": "Challenge expired"}), 409
    if ch.status == "pending":
        # Challenger may play before opponent accepts — auto-activate
        if ch.challenger_id == me:
            ch.status = "active"
        else:
            return jsonify({"error": "Accept the challenge first"}), 409
    if ch.status not in ("active", "completed"):
        return jsonify({"error": f"Challenge is {ch.status}"}), 409

    data = request.get_json(silent=True) or {}
    try:
        stars = max(0, min(3, int(data.get("stars", 0))))
        moves = max(0, int(data.get("moves", 0)))
        score = max(0, int(data.get("score", 0)))
    except (TypeError, ValueError):
        return jsonify({"error": "stars, moves, and score required"}), 400

    now = _utc_now()
    if ch.challenger_id == me:
        if ch.challenger_submitted_at:
            # Idempotent: return locked-in result so the client can show it
            return (
                jsonify(
                    {
                        "error": "Already submitted",
                        "challenge": _serialize(ch, me),
                    }
                ),
                409,
            )
        ch.challenger_stars = stars
        ch.challenger_moves = moves
        ch.challenger_score = score
        ch.challenger_submitted_at = now
    else:
        if ch.opponent_submitted_at:
            return (
                jsonify(
                    {
                        "error": "Already submitted",
                        "challenge": _serialize(ch, me),
                    }
                ),
                409,
            )
        ch.opponent_stars = stars
        ch.opponent_moves = moves
        ch.opponent_score = score
        ch.opponent_submitted_at = now

    if ch.challenger_submitted_at and ch.opponent_submitted_at:
        ch.winner_user_id = _compare_attempts(
            ch.challenger_stars or 0,
            ch.challenger_moves or 0,
            ch.challenger_score or 0,
            ch.challenger_id,
            ch.opponent_stars or 0,
            ch.opponent_moves or 0,
            ch.opponent_score or 0,
            ch.opponent_id,
        )
        ch.status = "completed"

    ch.updated_at = now
    db.session.commit()

    other_id = ch.opponent_id if me == ch.challenger_id else ch.challenger_id
    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Your friend"
    if ch.status == "completed":
        _notify(
            other_id,
            "Challenge finished",
            f"{me_name} finished — check who won",
            {"type": "challenge_complete", "challenge_id": str(ch.id)},
        )
    else:
        _notify(
            other_id,
            "Your turn",
            f"{me_name} submitted their challenge score",
            {"type": "challenge", "challenge_id": str(ch.id)},
        )

    return jsonify({"challenge": _serialize(ch, me)})
