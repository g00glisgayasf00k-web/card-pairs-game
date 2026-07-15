"""Async seeded challenges between friends."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Challenge, Friendship, MatchTicket, PlayerProgress, User, db
from app.progress_grants import adjust_gems, challenge_fee_gems, get_player_elo, set_player_elo
from app.elo import apply_elo_result
from app.services.push import send_to_user
from app.challenge_mission import generate_score_race_mission

challenges_bp = Blueprint("challenges", __name__)

MAX_LEVEL = 500
CHALLENGE_TTL_HOURS = 24
# After the first Quick Play finish, the other player has this long to submit or is DQed.
QUICK_FINISH_WINDOW_SECONDS = 10 * 60
# Forfeit / DQ must lose on turns — never record 0 moves (that would beat a real finish).
FORFEIT_MOVES = 99_999
FORFEIT_DURATION_MS = None
MAX_DURATION_MS = 24 * 60 * 60 * 1000
WAGER_PRESETS = {1, 5, 25, 50, 100}
WAGER_MIN = 1
WAGER_MAX = 10_000


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
    return {"id": u.id, "username": u.username, "elo": get_player_elo(u.id)}


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


def _parse_wager(raw) -> int | None:
    try:
        wager = int(raw)
    except (TypeError, ValueError):
        return None
    if wager < WAGER_MIN or wager > WAGER_MAX:
        return None
    return wager


def _expire_if_needed(ch: Challenge) -> None:
    if ch.status not in ("pending", "active"):
        return
    expires = ch.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires >= _utc_now():
        return

    kind = getattr(ch, "kind", None) or "friend"
    # Quick Play: one finished, other timed out → DQ missing side with 0 and settle.
    if (
        kind == "quick"
        and ch.status == "active"
        and bool(ch.challenger_submitted_at) != bool(ch.opponent_submitted_at)
    ):
        _dq_missing_side(ch)
        return

    ch.status = "expired"
    ch.updated_at = _utc_now()
    _refund_stakes(ch)
    _release_match_tickets(ch)


def _release_match_tickets(ch: Challenge) -> None:
    """Free both players to queue for a new Quick Play match."""
    MatchTicket.query.filter_by(challenge_id=ch.id).update(
        {"status": "cancelled"}, synchronize_session=False
    )


def _release_player_ticket(ch: Challenge, user_id: int) -> None:
    """Free one player to rematch while the duel may still be waiting on the other."""
    MatchTicket.query.filter_by(user_id=user_id, challenge_id=ch.id).update(
        {"status": "cancelled"}, synchronize_session=False
    )


def _player_has_submitted(ch: Challenge, user_id: int) -> bool:
    if ch.challenger_id == user_id:
        return bool(ch.challenger_submitted_at)
    if ch.opponent_id == user_id:
        return bool(ch.opponent_submitted_at)
    return False


def _dq_missing_side(ch: Challenge) -> None:
    """DQ the player who never submitted with a losing sentinel, then settle."""
    now = _utc_now()
    if ch.challenger_submitted_at and not ch.opponent_submitted_at:
        _record_forfeit_side(ch, "opponent", now)
    elif ch.opponent_submitted_at and not ch.challenger_submitted_at:
        _record_forfeit_side(ch, "challenger", now)
    else:
        ch.status = "expired"
        ch.updated_at = now
        _refund_stakes(ch)
        _release_match_tickets(ch)
        return

    ch.winner_user_id = _decide_winner(ch)
    ch.status = "completed"
    ch.updated_at = now
    _settle_wager(ch)
    _apply_quick_elo(ch)
    _release_match_tickets(ch)


def _record_forfeit_side(ch: Challenge, side: str, now: datetime) -> None:
    """Record a loss that cannot win on turns (Quick) or stars (friend)."""
    if side == "challenger":
        ch.challenger_stars = 0
        ch.challenger_moves = FORFEIT_MOVES
        ch.challenger_score = 0
        ch.challenger_duration_ms = FORFEIT_DURATION_MS
        ch.challenger_submitted_at = now
    else:
        ch.opponent_stars = 0
        ch.opponent_moves = FORFEIT_MOVES
        ch.opponent_score = 0
        ch.opponent_duration_ms = FORFEIT_DURATION_MS
        ch.opponent_submitted_at = now


def _finish_if_both_submitted(ch: Challenge) -> dict | None:
    """Complete the duel when both sides have results. Returns Elo payload if any."""
    if not (ch.challenger_submitted_at and ch.opponent_submitted_at):
        return None
    if ch.status == "completed":
        return None
    ch.winner_user_id = _decide_winner(ch)
    ch.status = "completed"
    _settle_wager(ch)
    elo = _apply_quick_elo(ch)
    _release_match_tickets(ch)
    return elo


def _arm_quick_finish_window(ch: Challenge, now: datetime) -> None:
    """First finisher starts the opponent's 10-minute clock."""
    if (getattr(ch, "kind", None) or "friend") != "quick":
        return
    if ch.challenger_submitted_at and ch.opponent_submitted_at:
        return
    if not (ch.challenger_submitted_at or ch.opponent_submitted_at):
        return
    ch.expires_at = now + timedelta(seconds=QUICK_FINISH_WINDOW_SECONDS)


def _refund_stakes(ch: Challenge) -> None:
    """Refund staked wagers (not the platform fee) when a duel ends without settlement."""
    if getattr(ch, "gems_settled", False):
        return
    wager = int(ch.wager_gems or 0)
    if wager < 1:
        ch.gems_settled = True
        return
    if getattr(ch, "challenger_staked", False):
        try:
            adjust_gems(ch.challenger_id, wager)
        except ValueError:
            pass
        ch.challenger_staked = False
    if getattr(ch, "opponent_staked", False):
        try:
            adjust_gems(ch.opponent_id, wager)
        except ValueError:
            pass
        ch.opponent_staked = False
    ch.gems_settled = True


def _settle_wager(ch: Challenge) -> None:
    """Pay out pot (2× wager) to winner, or refund both on a tie. Fee stays with house."""
    if getattr(ch, "gems_settled", False):
        return
    wager = int(ch.wager_gems or 0)
    if wager < 1:
        ch.gems_settled = True
        return

    pot = 0
    if getattr(ch, "challenger_staked", False):
        pot += wager
        ch.challenger_staked = False
    if getattr(ch, "opponent_staked", False):
        pot += wager
        ch.opponent_staked = False

    if pot <= 0:
        ch.gems_settled = True
        return

    if ch.winner_user_id:
        try:
            adjust_gems(ch.winner_user_id, pot)
        except ValueError:
            pass
    else:
        half = wager if pot >= wager * 2 else pot // 2
        if half > 0:
            try:
                adjust_gems(ch.challenger_id, half)
            except ValueError:
                pass
            try:
                adjust_gems(ch.opponent_id, pot - half)
            except ValueError:
                pass

    ch.gems_settled = True


def _apply_quick_elo(ch: Challenge) -> dict | None:
    """Update Elo for ranked quick matches. Friend challenges do not affect rating."""
    if (getattr(ch, "kind", None) or "friend") != "quick":
        return None
    a = get_player_elo(ch.challenger_id)
    b = get_player_elo(ch.opponent_id)
    if ch.winner_user_id == ch.challenger_id:
        winner = "a"
    elif ch.winner_user_id == ch.opponent_id:
        winner = "b"
    else:
        winner = "tie"
    new_a, new_b, delta = apply_elo_result(a, b, winner)
    set_player_elo(ch.challenger_id, new_a)
    set_player_elo(ch.opponent_id, new_b)
    return {
        "challenger_elo": new_a,
        "opponent_elo": new_b,
        "challenger_elo_before": a,
        "opponent_elo_before": b,
        "elo_delta": delta,
    }


def _compare_attempts(
    a_stars: int, a_moves: int, a_score: int, a_id: int,
    b_stars: int, b_moves: int, b_score: int, b_id: int,
) -> int | None:
    """Friend duel: more stars → fewer moves → higher score. None = tie."""
    if a_stars != b_stars:
        return a_id if a_stars > b_stars else b_id
    if a_moves != b_moves:
        return a_id if a_moves < b_moves else b_id
    if a_score != b_score:
        return a_id if a_score > b_score else b_id
    return None


def _compare_quick(
    a_score: int,
    a_duration_ms: int | None,
    a_id: int,
    b_score: int,
    b_duration_ms: int | None,
    b_id: int,
) -> int | None:
    """Quick Play: higher score wins; equal score → faster time. None = tie."""
    if a_score != b_score:
        return a_id if a_score > b_score else b_id
    # Missing duration (forfeit / legacy) loses to a real clock.
    a_d = a_duration_ms if a_duration_ms is not None else 10**12
    b_d = b_duration_ms if b_duration_ms is not None else 10**12
    if a_d != b_d:
        return a_id if a_d < b_d else b_id
    return None


def _mission_payload(ch: Challenge) -> dict:
    raw = getattr(ch, "mission_json", None)
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except (TypeError, json.JSONDecodeError):
        return {}


def _is_score_race_challenge(ch: Challenge) -> bool:
    kind = getattr(ch, "kind", None) or "friend"
    if kind == "quick":
        return True
    mission = _mission_payload(ch)
    return mission.get("mode") == "score_race" or isinstance(mission.get("hand_limit"), int)


def _decide_winner(ch: Challenge) -> int | None:
    if _is_score_race_challenge(ch):
        return _compare_quick(
            ch.challenger_score or 0,
            getattr(ch, "challenger_duration_ms", None),
            ch.challenger_id,
            ch.opponent_score or 0,
            getattr(ch, "opponent_duration_ms", None),
            ch.opponent_id,
        )
    return _compare_attempts(
        ch.challenger_stars or 0,
        ch.challenger_moves or 0,
        ch.challenger_score or 0,
        ch.challenger_id,
        ch.opponent_stars or 0,
        ch.opponent_moves or 0,
        ch.opponent_score or 0,
        ch.opponent_id,
    )


def _clamp_duration_ms(raw) -> int | None:
    if raw is None:
        return None
    try:
        ms = int(raw)
    except (TypeError, ValueError):
        return None
    if ms < 1:
        return None
    return min(ms, MAX_DURATION_MS)


def _attempt_payload(
    stars: int | None,
    moves: int | None,
    score: int | None,
    duration_ms: int | None,
    submitted_at,
) -> dict | None:
    if not submitted_at:
        return None
    display_moves = int(moves or 0)
    forfeited = display_moves >= FORFEIT_MOVES
    return {
        "stars": int(stars or 0),
        "moves": 0 if forfeited else display_moves,
        "score": int(score or 0),
        "duration_ms": None if forfeited else duration_ms,
        "forfeited": forfeited,
        "submitted_at": submitted_at.isoformat(),
    }


def _mission_payload(ch: Challenge) -> dict | None:
    raw = getattr(ch, "mission_json", None)
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _credits_payload(user_id: int) -> dict:
    try:
        credits, updated_at = adjust_gems(user_id, 0)
    except ValueError:
        return {}
    return {"credits": credits, "client_updated_at": updated_at}


def _serialize(ch: Challenge, me: int) -> dict:
    _expire_if_needed(ch)
    fee = int(getattr(ch, "fee_gems", 0) or 0)
    wager = int(ch.wager_gems or 0)
    if fee < 1 and wager > 0:
        fee = challenge_fee_gems(wager)
    proposed = getattr(ch, "proposed_wager_gems", None)
    proposed_wager = int(proposed) if proposed is not None else None
    proposed_by_id = getattr(ch, "proposed_by_id", None)
    proposed_by = None
    if proposed_wager is not None and proposed_by_id:
        if proposed_by_id == ch.challenger_id:
            proposed_by = "challenger"
        elif proposed_by_id == ch.opponent_id:
            proposed_by = "opponent"
    proposed_fee = challenge_fee_gems(proposed_wager) if proposed_wager else None
    return {
        "id": ch.id,
        "level": ch.level,
        "board_seed": ch.board_seed,
        "status": ch.status,
        "kind": getattr(ch, "kind", None) or "friend",
        "wager_gems": ch.wager_gems,
        "fee_gems": fee,
        "proposed_wager_gems": proposed_wager,
        "proposed_fee_gems": proposed_fee,
        "proposed_by": proposed_by,
        "expires_at": ch.expires_at.isoformat(),
        "mission": _mission_payload(ch),
        "challenger": _user_public(ch.challenger),
        "opponent": _user_public(ch.opponent),
        "you_are": "challenger" if ch.challenger_id == me else "opponent",
        "challenger_result": _attempt_payload(
            ch.challenger_stars,
            ch.challenger_moves,
            ch.challenger_score,
            getattr(ch, "challenger_duration_ms", None),
            ch.challenger_submitted_at,
        ),
        "opponent_result": _attempt_payload(
            ch.opponent_stars,
            ch.opponent_moves,
            ch.opponent_score,
            getattr(ch, "opponent_duration_ms", None),
            ch.opponent_submitted_at,
        ),
        "winner_user_id": ch.winner_user_id,
        "created_at": ch.created_at.isoformat(),
        "finish_deadline_at": (
            ch.expires_at.isoformat()
            if (
                ch.status == "active"
                and (getattr(ch, "kind", None) or "friend") == "quick"
                and bool(ch.challenger_submitted_at) != bool(ch.opponent_submitted_at)
            )
            else None
        ),
    }


def _apply_wager_terms(ch: Challenge, new_wager: int) -> None:
    """Move challenge to new_wager and adjust challenger escrow (wager + fee)."""
    old_wager = int(ch.wager_gems or 0)
    old_fee = int(getattr(ch, "fee_gems", 0) or 0) or challenge_fee_gems(old_wager)
    new_fee = challenge_fee_gems(new_wager)
    old_total = old_wager + old_fee if getattr(ch, "challenger_staked", False) else 0
    new_total = new_wager + new_fee
    delta = new_total - old_total
    if delta != 0:
        adjust_gems(ch.challenger_id, -delta)
    ch.wager_gems = new_wager
    ch.fee_gems = new_fee
    ch.challenger_staked = True
    ch.proposed_wager_gems = None
    ch.proposed_by_id = None


def _activate_with_opponent_stake(ch: Challenge, opponent_id: int) -> tuple[int, int]:
    """Charge opponent the current wager and mark active. Returns credits tuple."""
    wager = int(ch.wager_gems or 0)
    credits, client_updated_at = adjust_gems(opponent_id, 0)
    if wager > 0 and not getattr(ch, "opponent_staked", False):
        credits, client_updated_at = adjust_gems(opponent_id, -wager)
        ch.opponent_staked = True
    ch.status = "active"
    ch.updated_at = _utc_now()
    return credits, client_updated_at


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
        settled_before = getattr(ch, "gems_settled", False)
        item = _serialize(ch, me)
        if ch.status != before or getattr(ch, "gems_settled", False) != settled_before:
            dirty = True
        out.append(item)
    if dirty:
        db.session.commit()
    return jsonify({"challenges": out, **_credits_payload(me)})


@challenges_bp.post("")
@jwt_required()
def create_challenge():
    """Create a free friend duel (1 energy spent client-side). No gem wager."""
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

    # Display/progress band only — the duel uses a random board + mission
    level = min(_highest_unlocked(me), _highest_unlocked(friend_id))
    level = max(1, min(MAX_LEVEL, level))

    seed = secrets.randbits(31)
    mission = generate_score_race_mission(seed)
    ch = Challenge(
        challenger_id=me,
        opponent_id=friend_id,
        level=level,
        board_seed=seed,
        status="pending",
        kind="friend",
        wager_gems=0,
        fee_gems=0,
        challenger_staked=False,
        opponent_staked=False,
        gems_settled=True,
        mission_json=json.dumps(mission),
        expires_at=_utc_now() + timedelta(hours=CHALLENGE_TTL_HOURS),
    )
    db.session.add(ch)
    db.session.commit()
    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "A friend"
    _notify(
        friend_id,
        "New challenge",
        f"{me_name} challenged you to a multiplayer duel",
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
    settled_before = getattr(ch, "gems_settled", False)
    payload = _serialize(ch, me)
    if ch.status != before or getattr(ch, "gems_settled", False) != settled_before:
        db.session.commit()
    out = {"challenge": payload, **_credits_payload(me)}
    # Sync Rating for whoever opens the settled duel (first finisher often missed submit-time Elo).
    if ch.status == "completed" and (getattr(ch, "kind", None) or "friend") == "quick":
        out["elo"] = {
            "challenger_elo": get_player_elo(ch.challenger_id),
            "opponent_elo": get_player_elo(ch.opponent_id),
        }
    return jsonify(out)


@challenges_bp.post("/<int:challenge_id>/accept")
@jwt_required()
def accept_challenge(challenge_id: int):
    """Accept a free friend challenge (1 energy spent client-side)."""
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or ch.opponent_id != me:
        return jsonify({"error": "Challenge not found"}), 404
    _expire_if_needed(ch)
    if ch.status != "pending":
        db.session.commit()
        return jsonify({"error": f"Challenge is {ch.status}"}), 409

    # Clear any legacy negotiate state
    ch.proposed_wager_gems = None
    ch.proposed_by_id = None
    ch.wager_gems = 0
    ch.fee_gems = 0
    ch.gems_settled = True
    ch.status = "active"
    ch.updated_at = _utc_now()
    db.session.commit()

    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Your friend"
    _notify(
        ch.challenger_id,
        "Challenge accepted",
        f"{me_name} accepted your multiplayer challenge",
        {"type": "challenge", "challenge_id": str(ch.id)},
    )
    return jsonify({"challenge": _serialize(ch, me)})


@challenges_bp.post("/<int:challenge_id>/negotiate")
@jwt_required()
def negotiate_challenge(challenge_id: int):
    """Counter-propose a different wager (fee recalculates at 5%, min 1)."""
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.challenger_id != me and ch.opponent_id != me):
        return jsonify({"error": "Challenge not found"}), 404
    _expire_if_needed(ch)
    if ch.status != "pending":
        db.session.commit()
        return jsonify({"error": f"Challenge is {ch.status}"}), 409

    data = request.get_json(silent=True) or {}
    wager = _parse_wager(data.get("wager_gems"))
    if wager is None:
        return jsonify({"error": f"wager_gems must be between {WAGER_MIN} and {WAGER_MAX}"}), 400

    current = int(ch.wager_gems or 0)
    existing_proposed = getattr(ch, "proposed_wager_gems", None)
    if wager == current and existing_proposed is None:
        return jsonify({"error": "Pick a different wager to negotiate"}), 400
    if existing_proposed is not None and int(existing_proposed) == wager:
        return jsonify({"error": "That offer is already on the table"}), 400

    ch.proposed_wager_gems = wager
    ch.proposed_by_id = me
    ch.updated_at = _utc_now()
    db.session.commit()

    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Your friend"
    other_id = ch.opponent_id if me == ch.challenger_id else ch.challenger_id
    fee = challenge_fee_gems(wager)
    _notify(
        other_id,
        "Challenge offer",
        f"{me_name} proposed {wager} gems (fee {fee})",
        {"type": "challenge", "challenge_id": str(ch.id)},
    )
    return jsonify({"challenge": _serialize(ch, me), **_credits_payload(me)})


@challenges_bp.post("/<int:challenge_id>/reject-offer")
@jwt_required()
def reject_challenge_offer(challenge_id: int):
    """Reject a counter-offer and keep the original wager on the table."""
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.challenger_id != me and ch.opponent_id != me):
        return jsonify({"error": "Challenge not found"}), 404
    _expire_if_needed(ch)
    if ch.status != "pending":
        db.session.commit()
        return jsonify({"error": f"Challenge is {ch.status}"}), 409

    proposed_by = getattr(ch, "proposed_by_id", None)
    if getattr(ch, "proposed_wager_gems", None) is None or not proposed_by:
        return jsonify({"error": "No offer to reject"}), 409
    if proposed_by == me:
        return jsonify({"error": "Cannot reject your own offer — wait or change it"}), 409

    ch.proposed_wager_gems = None
    ch.proposed_by_id = None
    ch.updated_at = _utc_now()
    db.session.commit()

    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Your friend"
    other_id = ch.opponent_id if me == ch.challenger_id else ch.challenger_id
    _notify(
        other_id,
        "Offer rejected",
        f"{me_name} rejected your counter-offer — original {ch.wager_gems}💎 still open",
        {"type": "challenge", "challenge_id": str(ch.id)},
    )
    return jsonify({"challenge": _serialize(ch, me), **_credits_payload(me)})


@challenges_bp.post("/<int:challenge_id>/decline")
@jwt_required()
def decline_challenge(challenge_id: int):
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.opponent_id != me and ch.challenger_id != me):
        return jsonify({"error": "Challenge not found"}), 404
    if ch.status not in ("pending", "active"):
        return jsonify({"error": f"Challenge is {ch.status}"}), 409
    if ch.status == "active":
        return jsonify({"error": "Cannot decline after accept — play or wait for expiry"}), 409
    ch.status = "declined"
    ch.proposed_wager_gems = None
    ch.proposed_by_id = None
    ch.updated_at = _utc_now()
    _refund_stakes(ch)
    db.session.commit()
    return jsonify({"challenge": _serialize(ch, me), **_credits_payload(me)})


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
                        **_credits_payload(me),
                    }
                ),
                409,
            )
        return jsonify({"error": "Challenge expired", **_credits_payload(me)}), 409
    if ch.status == "pending":
        return jsonify({"error": "Wait until your opponent accepts the challenge"}), 409
    if ch.status == "completed":
        return jsonify({"challenge": _serialize(ch, me), **_credits_payload(me)})
    if ch.status != "active":
        return jsonify({"error": f"Challenge is {ch.status}"}), 409

    data = request.get_json(silent=True) or {}
    try:
        stars = max(0, min(3, int(data.get("stars", 0))))
        moves = max(0, min(FORFEIT_MOVES - 1, int(data.get("moves", 0))))
        score = max(0, int(data.get("score", 0)))
    except (TypeError, ValueError):
        return jsonify({"error": "stars, moves, and score required"}), 400
    duration_ms = _clamp_duration_ms(data.get("duration_ms"))

    now = _utc_now()
    if ch.challenger_id == me:
        if ch.challenger_submitted_at:
            return (
                jsonify(
                    {
                        "error": "Already submitted",
                        "challenge": _serialize(ch, me),
                        **_credits_payload(me),
                    }
                ),
                409,
            )
        ch.challenger_stars = stars
        ch.challenger_moves = moves
        ch.challenger_score = score
        ch.challenger_duration_ms = duration_ms
        ch.challenger_submitted_at = now
    else:
        if ch.opponent_submitted_at:
            return (
                jsonify(
                    {
                        "error": "Already submitted",
                        "challenge": _serialize(ch, me),
                        **_credits_payload(me),
                    }
                ),
                409,
            )
        ch.opponent_stars = stars
        ch.opponent_moves = moves
        ch.opponent_score = score
        ch.opponent_duration_ms = duration_ms
        ch.opponent_submitted_at = now

    # Free this player to queue again immediately (don't wait on the opponent).
    _release_player_ticket(ch, me)
    _arm_quick_finish_window(ch, now)
    elo_update = _finish_if_both_submitted(ch)

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
        mins = QUICK_FINISH_WINDOW_SECONDS // 60
        _notify(
            other_id,
            "Your turn — 10 minutes",
            f"{me_name} finished. Submit within {mins} minutes or you forfeit.",
            {"type": "challenge", "challenge_id": str(ch.id)},
        )

    out = {"challenge": _serialize(ch, me), **_credits_payload(me)}
    if elo_update:
        out["elo"] = elo_update
    return jsonify(out)


@challenges_bp.post("/<int:challenge_id>/forfeit")
@jwt_required()
def forfeit_challenge(challenge_id: int):
    """Back out of an active duel — records a losing sentinel (not 0 turns)."""
    me = int(get_jwt_identity())
    ch = Challenge.query.get(challenge_id)
    if not ch or (ch.challenger_id != me and ch.opponent_id != me):
        return jsonify({"error": "Challenge not found"}), 404

    _expire_if_needed(ch)
    if ch.status == "completed":
        db.session.commit()
        return jsonify({"challenge": _serialize(ch, me), **_credits_payload(me)})
    if ch.status != "active":
        db.session.commit()
        return jsonify({"error": f"Challenge is {ch.status}"}), 409

    already = (
        (ch.challenger_id == me and ch.challenger_submitted_at)
        or (ch.opponent_id == me and ch.opponent_submitted_at)
    )
    if already:
        return jsonify({"challenge": _serialize(ch, me), **_credits_payload(me)})

    now = _utc_now()
    _record_forfeit_side(ch, "challenger" if ch.challenger_id == me else "opponent", now)

    _arm_quick_finish_window(ch, now)
    elo_update = _finish_if_both_submitted(ch)
    # Free the quitting player to queue again even if the opponent still has time left.
    _release_player_ticket(ch, me)
    ch.updated_at = now
    db.session.commit()

    other_id = ch.opponent_id if me == ch.challenger_id else ch.challenger_id
    me_user = User.query.get(me)
    me_name = me_user.username if me_user else "Opponent"
    if ch.status == "completed":
        if ch.winner_user_id is None:
            _notify(
                other_id,
                "Match drawn",
                f"{me_name} also exited with 0 — draw",
                {"type": "challenge_complete", "challenge_id": str(ch.id)},
            )
        else:
            _notify(
                other_id,
                "Opponent forfeited",
                f"{me_name} backed out — you win",
                {"type": "challenge_complete", "challenge_id": str(ch.id)},
            )
    else:
        _notify(
            other_id,
            "Opponent forfeited",
            f"{me_name} exited with 0. Finish within 10 minutes to claim the win — or exit with 0 for a draw.",
            {"type": "challenge", "challenge_id": str(ch.id)},
        )

    out = {"challenge": _serialize(ch, me), "forfeited": True, **_credits_payload(me)}
    if elo_update:
        out["elo"] = elo_update
    return jsonify(out)
