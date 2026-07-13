"""Tournament cup runs — ranked by highest score, then fastest time."""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import distinct

from app.models import TournamentRun, User, db
from app.tournament_periods import period_key, period_meta, period_sort_key

tournaments_bp = Blueprint("tournaments", __name__)

VALID_TIERS = {"bronze", "silver", "gold"}


def _rank_key(score: int, duration_ms: int | None) -> tuple[int, int]:
    """Higher score first; then lower duration. Missing duration sorts last."""
    d = int(duration_ms) if duration_ms is not None and duration_ms > 0 else 10**12
    return (-int(score), d)


def _is_better(new_score: int, new_duration: int | None, old: TournamentRun) -> bool:
    return _rank_key(new_score, new_duration) < _rank_key(old.score, getattr(old, "duration_ms", None))


def _row_dict(run: TournamentRun, username: str, place: int | None = None) -> dict:
    out = {
        "id": run.id,
        "tier_id": run.tier_id,
        "period_key": run.period_key,
        "username": username,
        "hands": run.hands,
        "score": run.score,
        "target_points": run.target_points,
        "point_delta": abs(run.score - run.target_points),
        "duration_ms": getattr(run, "duration_ms", None),
    }
    if place is not None:
        out["place"] = place
    return out


def _standings_for_period(
    tier: str, pk: str, limit: int, me: int | None = None
) -> tuple[list[dict], int | None]:
    runs = TournamentRun.query.filter_by(tier_id=tier, period_key=pk).all()
    runs.sort(key=lambda r: _rank_key(r.score, getattr(r, "duration_ms", None)))
    users = (
        {u.id: u.username for u in User.query.filter(User.id.in_([r.user_id for r in runs])).all()}
        if runs
        else {}
    )
    rows: list[dict] = []
    my_place = None
    for i, run in enumerate(runs[:limit], start=1):
        rows.append(_row_dict(run, users.get(run.user_id, "?"), i))
        if me is not None and run.user_id == me:
            my_place = i
    if me is not None and my_place is None:
        for i, run in enumerate(runs, start=1):
            if run.user_id == me:
                my_place = i
                rows.append(_row_dict(run, users.get(run.user_id, "?"), i))
                break
    return rows, my_place


@tournaments_bp.get("/<tier_id>/standings")
@jwt_required()
def standings(tier_id: str):
    tier = (tier_id or "").strip().lower()
    if tier not in VALID_TIERS:
        return jsonify({"error": "Unknown cup"}), 404

    meta = period_meta(tier)
    pk = meta["period_key"]
    limit = min(50, max(1, int(request.args.get("limit", 20))))
    me = int(get_jwt_identity())
    rows, my_place = _standings_for_period(tier, pk, limit, me)
    return jsonify({**meta, "standings": rows, "your_place": my_place})


@tournaments_bp.get("/<tier_id>/history")
@jwt_required()
def history(tier_id: str):
    """Past period top boards for a cup (excludes the live period)."""
    tier = (tier_id or "").strip().lower()
    if tier not in VALID_TIERS:
        return jsonify({"error": "Unknown cup"}), 404

    meta = period_meta(tier)
    current_pk = meta["period_key"]
    periods_limit = min(20, max(1, int(request.args.get("periods", 8))))
    row_limit = min(20, max(1, int(request.args.get("limit", 3))))

    raw_keys = [
        row[0]
        for row in db.session.query(distinct(TournamentRun.period_key))
        .filter(TournamentRun.tier_id == tier)
        .all()
        if row[0]
    ]
    past_keys = [pk for pk in raw_keys if pk != current_pk and pk != "legacy"]
    past_keys.sort(key=period_sort_key, reverse=True)
    past_keys = past_keys[:periods_limit]

    periods = []
    for pk in past_keys:
        rows, _ = _standings_for_period(tier, pk, row_limit, me=None)
        if not rows:
            continue
        periods.append({"period_key": pk, "standings": rows})

    return jsonify({**meta, "periods": periods})


@tournaments_bp.post("/<tier_id>/submit")
@jwt_required()
def submit(tier_id: str):
    tier = (tier_id or "").strip().lower()
    if tier not in VALID_TIERS:
        return jsonify({"error": "Unknown cup"}), 404

    body = request.get_json(silent=True) or {}
    try:
        hands = int(body.get("hands"))
        score = int(body.get("score"))
        level = int(body.get("level"))
        board_seed = int(body.get("board_seed"))
        target_points = int(body.get("target_points"))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid result payload"}), 400

    duration_ms = None
    raw_dur = body.get("duration_ms")
    if raw_dur is not None:
        try:
            duration_ms = max(1, min(24 * 60 * 60 * 1000, int(raw_dur)))
        except (TypeError, ValueError):
            duration_ms = None

    if hands < 1 or score < 0 or level < 1 or target_points < 1:
        return jsonify({"error": "Invalid result values"}), 400

    me = int(get_jwt_identity())
    pk = period_key(tier)
    existing = TournamentRun.query.filter_by(user_id=me, tier_id=tier, period_key=pk).first()
    improved = False
    if existing is None:
        existing = TournamentRun(
            user_id=me,
            tier_id=tier,
            period_key=pk,
            level=level,
            board_seed=board_seed,
            target_points=target_points,
            hands=hands,
            score=score,
            duration_ms=duration_ms,
        )
        db.session.add(existing)
        improved = True
    elif _is_better(score, duration_ms, existing):
        existing.level = level
        existing.board_seed = board_seed
        existing.target_points = target_points
        existing.hands = hands
        existing.score = score
        existing.duration_ms = duration_ms
        improved = True

    db.session.commit()

    runs = TournamentRun.query.filter_by(tier_id=tier, period_key=pk).all()
    runs.sort(key=lambda r: _rank_key(r.score, getattr(r, "duration_ms", None)))
    place = next((i for i, r in enumerate(runs, start=1) if r.user_id == me), None)

    return jsonify(
        {
            "ok": True,
            "improved": improved,
            "place": place,
            "hands": existing.hands,
            "score": existing.score,
            "target_points": existing.target_points,
            "duration_ms": getattr(existing, "duration_ms", None),
            **period_meta(tier),
        }
    )
