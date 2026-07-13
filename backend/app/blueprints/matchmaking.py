"""Quick matchmaking vs players of similar Elo rating."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.challenge_mission import generate_score_race_mission
from app.elo import ELO_MATCH_BAND, ELO_MATCH_BAND_WIDE
from app.models import Challenge, MatchTicket, PlayerProgress, db
from app.progress_grants import get_player_elo, load_progress_payload


matchmaking_bp = Blueprint("matchmaking", __name__)

MAX_LEVEL = 500
TICKET_TTL_SECONDS = 120
CHALLENGE_TTL_HOURS = 24
# Solo 1-1 (display world 1, stage 1) = global level 11
QUICK_PLAY_MIN_LEVEL = 11


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


def _quick_play_unlocked(user_id: int) -> bool:
    """Require Solo 1-1 cleared (or progress past it)."""
    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    payload = load_progress_payload(row)
    completed = payload.get("completedLevels") or []
    if isinstance(completed, list) and QUICK_PLAY_MIN_LEVEL in completed:
        return True
    try:
        highest = int(payload.get("highestUnlocked") or 1)
    except (TypeError, ValueError):
        highest = 1
    return highest > QUICK_PLAY_MIN_LEVEL


def _ticket_elo(t: MatchTicket) -> int:
    raw = getattr(t, "elo", None)
    if isinstance(raw, int) and raw > 0:
        return raw
    return get_player_elo(t.user_id)


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


def _cancel_ticket(t: MatchTicket | None) -> None:
    if t and t.status in ("waiting", "matched"):
        t.status = "cancelled"


def _player_submitted(ch: Challenge, me: int) -> bool:
    if ch.challenger_id == me:
        return bool(ch.challenger_submitted_at)
    if ch.opponent_id == me:
        return bool(ch.opponent_submitted_at)
    return False


def _pick_partner(me: int, my_elo: int, now: datetime) -> MatchTicket | None:
    candidates = (
        MatchTicket.query.filter(
            MatchTicket.status == "waiting",
            MatchTicket.user_id != me,
        )
        .order_by(MatchTicket.created_at.asc())
        .limit(60)
        .all()
    )
    best: MatchTicket | None = None
    best_dist = None
    for t in candidates:
        if _as_utc(t.expires_at) < now:
            t.status = "cancelled"
            continue
        dist = abs(_ticket_elo(t) - my_elo)
        if dist > ELO_MATCH_BAND_WIDE:
            continue
        if best is None or dist < best_dist:
            # Prefer tight band first
            if dist <= ELO_MATCH_BAND or best is None:
                best = t
                best_dist = dist
            elif best_dist is not None and best_dist > ELO_MATCH_BAND and dist < best_dist:
                best = t
                best_dist = dist
    return best


@matchmaking_bp.post("/quick")
@jwt_required()
def join_quick():
    me = int(get_jwt_identity())
    if not _quick_play_unlocked(me):
        return (
            jsonify(
                {
                    "error": "Clear Solo 1-1 before Quick play",
                }
            ),
            403,
        )
    _expire_stale_tickets()

    from app.blueprints.challenges import _expire_if_needed

    data = request.get_json(silent=True) or {}
    # Fresh search: drop any prior ticket so the player isn't stuck on an old match.
    want_fresh = bool(data.get("fresh"))

    existing = _active_ticket(me)
    if existing and existing.status == "matched" and existing.challenge_id:
        ch = Challenge.query.get(existing.challenge_id)
        if ch:
            _expire_if_needed(ch)
            db.session.commit()
            unfinished = ch.status == "active"
            already_done = _player_submitted(ch, me)
            if unfinished and not already_done and not want_fresh:
                return jsonify({"status": "matched", "challenge": _serialize_challenge(ch, me)})
            if unfinished and not already_done and want_fresh:
                # Explicit new search — forfeit the abandoned duel, then queue again.
                now = _utc_now()
                from app.blueprints.challenges import (
                    _arm_quick_finish_window,
                    _finish_if_both_submitted,
                    _record_forfeit_side,
                    _release_player_ticket,
                )

                _record_forfeit_side(
                    ch, "challenger" if ch.challenger_id == me else "opponent", now
                )
                _release_player_ticket(ch, me)
                _arm_quick_finish_window(ch, now)
                _finish_if_both_submitted(ch)
                ch.updated_at = now
                db.session.commit()
            else:
                _cancel_ticket(existing)
                db.session.commit()
        else:
            _cancel_ticket(existing)
            db.session.commit()
    elif existing and existing.status == "waiting":
        if want_fresh or _as_utc(existing.expires_at) < _utc_now():
            _cancel_ticket(existing)
            db.session.commit()
        else:
            return jsonify(
                {
                    "status": "waiting",
                    "ticket_id": existing.id,
                    "elo": _ticket_elo(existing),
                }
            )

    # Drop any leftover active tickets before creating a new one.
    leftover = _active_ticket(me)
    if leftover:
        _cancel_ticket(leftover)
        db.session.commit()

    unlocked = _highest_unlocked(me)
    my_elo = get_player_elo(me)
    now = _utc_now()
    partner = _pick_partner(me, my_elo, now)
    db.session.commit()

    if partner:
        partner_elo = _ticket_elo(partner)
        level = max(1, min(MAX_LEVEL, min(unlocked, partner.unlocked_level)))
        seed = secrets.randbits(31)
        mission = generate_score_race_mission(seed)
        ch = Challenge(
            challenger_id=partner.user_id,
            opponent_id=me,
            level=level,
            board_seed=seed,
            mission_json=json.dumps(mission),
            status="active",
            kind="quick",
            wager_gems=0,
            fee_gems=0,
            challenger_staked=False,
            opponent_staked=False,
            gems_settled=True,
            expires_at=now + timedelta(hours=CHALLENGE_TTL_HOURS),
        )
        db.session.add(ch)
        db.session.flush()

        partner.status = "matched"
        partner.challenge_id = ch.id

        my_ticket = MatchTicket(
            user_id=me,
            unlocked_level=unlocked,
            elo=my_elo,
            status="matched",
            challenge_id=ch.id,
            expires_at=now + timedelta(seconds=TICKET_TTL_SECONDS),
        )
        db.session.add(my_ticket)
        db.session.commit()
        return jsonify(
            {
                "status": "matched",
                "challenge": _serialize_challenge(ch, me),
                "elo": my_elo,
                "opponent_elo": partner_elo,
            }
        )

    ticket = MatchTicket(
        user_id=me,
        unlocked_level=unlocked,
        elo=my_elo,
        status="waiting",
        expires_at=now + timedelta(seconds=TICKET_TTL_SECONDS),
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"status": "waiting", "ticket_id": ticket.id, "elo": my_elo})


@matchmaking_bp.get("/quick")
@jwt_required()
def poll_quick():
    me = int(get_jwt_identity())
    _expire_stale_tickets()
    ticket = _active_ticket(me)
    if not ticket:
        return jsonify({"status": "idle"})
    if ticket.status == "matched" and ticket.challenge_id:
        from app.blueprints.challenges import _expire_if_needed

        ch = Challenge.query.get(ticket.challenge_id)
        if ch:
            _expire_if_needed(ch)
            db.session.commit()
            if ch.status == "active" and not _player_submitted(ch, me):
                return jsonify(
                    {
                        "status": "matched",
                        "challenge": _serialize_challenge(ch, me),
                        "elo": get_player_elo(me),
                    }
                )
            # Already submitted or settled — free the ticket so they aren't stuck.
            ticket.status = "cancelled"
            db.session.commit()
            if ch.status != "active":
                return jsonify(
                    {
                        "status": "settled",
                        "challenge": _serialize_challenge(ch, me),
                        "elo": get_player_elo(me),
                    }
                )
            return jsonify({"status": "idle", "elo": get_player_elo(me)})
        ticket.status = "cancelled"
        db.session.commit()
    if ticket.status == "waiting":
        if _as_utc(ticket.expires_at) < _utc_now():
            ticket.status = "cancelled"
            db.session.commit()
            return jsonify({"status": "idle"})
        return jsonify(
            {
                "status": "waiting",
                "ticket_id": ticket.id,
                "elo": _ticket_elo(ticket),
            }
        )
    return jsonify({"status": "idle"})


@matchmaking_bp.delete("/quick")
@jwt_required()
def leave_quick():
    """Leave the queue. Also clears matched tickets after you've already submitted."""
    me = int(get_jwt_identity())
    from app.blueprints.challenges import _expire_if_needed

    rows = MatchTicket.query.filter(
        MatchTicket.user_id == me,
        MatchTicket.status.in_(("waiting", "matched")),
    ).all()
    for t in rows:
        if t.status == "waiting":
            t.status = "cancelled"
            continue
        # matched: only drop if duel is done for this player (submitted / settled)
        if t.challenge_id:
            ch = Challenge.query.get(t.challenge_id)
            if ch:
                _expire_if_needed(ch)
                if ch.status != "active" or _player_submitted(ch, me):
                    t.status = "cancelled"
            else:
                t.status = "cancelled"
        else:
            t.status = "cancelled"
    db.session.commit()
    return jsonify({"ok": True})
