"""Quick matchmaking vs players of similar campaign progress."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.challenge_mission import generate_challenge_mission
from app.models import Challenge, MatchTicket, PlayerProgress, db


matchmaking_bp = Blueprint("matchmaking", __name__)

MAX_LEVEL = 500
MATCH_BAND = 15
TICKET_TTL_SECONDS = 120
CHALLENGE_TTL_HOURS = 24


def _utc_now():
    return datetime.now(timezone.utc)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


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


def _serialize_challenge(ch: Challenge, me: int) -> dict:
    from app.blueprints.challenges import _serialize

    return _serialize(ch, me)


def _expire_stale_tickets() -> None:
    now = _utc_now()
    rows = MatchTicket.query.filter_by(status="waiting").all()
    dirty = False
    for t in rows:
        if _as_utc(t.expires_at) < now:
            t.status = "cancelled"
            dirty = True
    if dirty:
        db.session.commit()


def _active_ticket(me: int) -> MatchTicket | None:
    return (
        MatchTicket.query.filter(
            MatchTicket.user_id == me,
            MatchTicket.status.in_(("waiting", "matched")),
        )
        .order_by(MatchTicket.created_at.desc())
        .first()
    )


@matchmaking_bp.post("/quick")
@jwt_required()
def join_quick():
    me = int(get_jwt_identity())
    _expire_stale_tickets()

    existing = _active_ticket(me)
    if existing and existing.status == "matched" and existing.challenge_id:
        ch = Challenge.query.get(existing.challenge_id)
        if ch:
            return jsonify({"status": "matched", "challenge": _serialize_challenge(ch, me)})
    if existing and existing.status == "waiting" and _as_utc(existing.expires_at) >= _utc_now():
        return jsonify({"status": "waiting", "ticket_id": existing.id})

    if existing and existing.status == "waiting":
        existing.status = "cancelled"

    unlocked = _highest_unlocked(me)
    now = _utc_now()
    candidates = (
        MatchTicket.query.filter(
            MatchTicket.status == "waiting",
            MatchTicket.user_id != me,
        )
        .order_by(MatchTicket.created_at.asc())
        .limit(40)
        .all()
    )

    partner = None
    for t in candidates:
        if _as_utc(t.expires_at) < now:
            t.status = "cancelled"
            continue
        if abs(t.unlocked_level - unlocked) <= MATCH_BAND:
            partner = t
            break
    db.session.commit()

    if partner:
        level = max(1, min(MAX_LEVEL, min(unlocked, partner.unlocked_level)))
        seed = secrets.randbits(31)
        mission = generate_challenge_mission(seed)
        # Older waiting player is challenger for stable ordering
        ch = Challenge(
            challenger_id=partner.user_id,
            opponent_id=me,
            level=level,
            board_seed=seed,
            mission_json=json.dumps(mission),
            status="active",
            kind="quick",
            wager_gems=0,
            expires_at=now + timedelta(hours=CHALLENGE_TTL_HOURS),
        )
        db.session.add(ch)
        db.session.flush()

        partner.status = "matched"
        partner.challenge_id = ch.id

        my_ticket = MatchTicket(
            user_id=me,
            unlocked_level=unlocked,
            status="matched",
            challenge_id=ch.id,
            expires_at=now + timedelta(seconds=TICKET_TTL_SECONDS),
        )
        db.session.add(my_ticket)
        db.session.commit()
        return jsonify({"status": "matched", "challenge": _serialize_challenge(ch, me)})

    ticket = MatchTicket(
        user_id=me,
        unlocked_level=unlocked,
        status="waiting",
        expires_at=now + timedelta(seconds=TICKET_TTL_SECONDS),
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"status": "waiting", "ticket_id": ticket.id})


@matchmaking_bp.get("/quick")
@jwt_required()
def poll_quick():
    me = int(get_jwt_identity())
    _expire_stale_tickets()
    ticket = _active_ticket(me)
    if not ticket:
        return jsonify({"status": "idle"})
    if ticket.status == "matched" and ticket.challenge_id:
        ch = Challenge.query.get(ticket.challenge_id)
        if ch:
            return jsonify({"status": "matched", "challenge": _serialize_challenge(ch, me)})
    if ticket.status == "waiting":
        if _as_utc(ticket.expires_at) < _utc_now():
            ticket.status = "cancelled"
            db.session.commit()
            return jsonify({"status": "idle"})
        return jsonify({"status": "waiting", "ticket_id": ticket.id})
    return jsonify({"status": "idle"})


@matchmaking_bp.delete("/quick")
@jwt_required()
def leave_quick():
    me = int(get_jwt_identity())
    rows = MatchTicket.query.filter(
        MatchTicket.user_id == me,
        MatchTicket.status == "waiting",
    ).all()
    for t in rows:
        t.status = "cancelled"
    db.session.commit()
    return jsonify({"ok": True})
