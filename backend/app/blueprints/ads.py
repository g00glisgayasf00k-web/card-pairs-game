"""Rewarded ad completion logging for monetization metrics."""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import AdWatchRecord, User, db

ads_bp = Blueprint("ads", __name__)

VALID_KINDS = {"gem", "energy", "tournament"}


def _cents_per_watch() -> int:
    """Estimated revenue credit per rewarded completion (not AdMob payout)."""
    try:
        return max(0, int(current_app.config.get("AD_REWARD_CENTS_PER_WATCH", 1)))
    except (TypeError, ValueError):
        return 1


@ads_bp.post("/watch")
@jwt_required()
def record_ad_watch():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    body = request.get_json(silent=True) or {}
    kind = str(body.get("kind") or "").strip().lower()
    platform = str(body.get("platform") or "").strip()[:32] or None
    if kind not in VALID_KINDS:
        return jsonify({"error": "kind must be gem, energy, or tournament"}), 400

    cents = _cents_per_watch()
    row = AdWatchRecord(
        user_id=user_id,
        kind=kind,
        platform=platform,
        estimated_cents=cents,
    )
    db.session.add(row)
    db.session.commit()
    return jsonify(
        {
            "ok": True,
            "id": row.id,
            "kind": kind,
            "estimated_cents": cents,
        }
    ), 201
