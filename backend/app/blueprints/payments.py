from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.gem_catalog import get_gem_pack, pack_list_public
from app.models import PurchaseRecord, User, db
from app.progress_grants import grant_gems
from app.square_client import SquareError, create_card_payment

payments_bp = Blueprint("payments", __name__)


def _payments_enabled() -> bool:
    app_id = (current_app.config.get("SQUARE_APPLICATION_ID") or "").strip()
    location_id = (current_app.config.get("SQUARE_LOCATION_ID") or "").strip()
    access_token = (current_app.config.get("SQUARE_ACCESS_TOKEN") or "").strip()
    return bool(app_id and location_id and access_token)


@payments_bp.get("/config")
def payment_config():
    """Public Square client config + gem pack catalog."""
    environment = (current_app.config.get("SQUARE_ENVIRONMENT") or "sandbox").strip().lower()
    enabled = _payments_enabled()
    return jsonify(
        {
            "enabled": enabled,
            "provider": "square",
            "application_id": current_app.config.get("SQUARE_APPLICATION_ID", "") if enabled else "",
            "location_id": current_app.config.get("SQUARE_LOCATION_ID", "") if enabled else "",
            "environment": environment if enabled else "",
            "packs": pack_list_public() if enabled else [],
        }
    )


@payments_bp.post("/charge")
@jwt_required()
def charge_gem_pack():
    """Charge a gem pack with a Square payment token from the Web Payments SDK."""
    if not _payments_enabled():
        return jsonify({"error": "Payments are not configured"}), 503

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    pack_id = (data.get("pack_id") or "").strip()
    source_id = (data.get("source_id") or "").strip()
    if not pack_id or not source_id:
        return jsonify({"error": "pack_id and source_id are required"}), 400

    pack = get_gem_pack(pack_id)
    if not pack:
        return jsonify({"error": "Unknown gem pack"}), 400

    try:
        payment = create_card_payment(
            source_id=source_id,
            amount_cents=pack["price_cents"],
            currency=pack["currency"],
            reference_id=f"{pack_id}-{user_id}",
            note=f"Royal Match Poker — {pack['label']} ({pack['gems']} gems) for {user.username}",
        )
    except SquareError as exc:
        return jsonify({"error": str(exc)}), exc.status_code

    square_payment_id = payment.get("id")
    if not square_payment_id:
        return jsonify({"error": "Payment did not return an id"}), 502

    existing = PurchaseRecord.query.filter_by(square_payment_id=square_payment_id).first()
    if existing:
        return jsonify(
            {
                "paid": True,
                "duplicate": True,
                "pack_id": existing.pack_id,
                "gems_added": existing.gems_granted,
                "credits": _user_credits(user_id),
                "payment_id": existing.square_payment_id,
            }
        ), 200

    try:
        gems_added, credits = grant_gems(user_id, pack["gems"])
        record = PurchaseRecord(
            user_id=user_id,
            pack_id=pack_id,
            square_payment_id=square_payment_id,
            amount_cents=pack["price_cents"],
            currency=pack["currency"],
            gems_granted=gems_added,
            status=payment.get("status") or "completed",
        )
        db.session.add(record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Payment succeeded but gems could not be granted — contact support"}), 500

    return jsonify(
        {
            "paid": True,
            "pack_id": pack_id,
            "gems_added": gems_added,
            "credits": credits,
            "payment_id": square_payment_id,
        }
    ), 200


def _user_credits(user_id: int) -> int:
    from app.progress_grants import load_progress_payload
    from app.models import PlayerProgress

    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    payload = load_progress_payload(row)
    return int(payload.get("credits") or 0)
