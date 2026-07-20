"""Account deletion requests (Play Store / privacy compliance)."""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import SupportTicket, User, db

account_bp = Blueprint("account", __name__)

MAX_DETAILS = 2000
DELETION_SUBJECT = "Account deletion request"


def _find_user(username: str) -> User | None:
    return User.query.filter(User.username.ilike(username)).first()


@account_bp.post("/deletion-request")
def deletion_request():
    """Public endpoint — creates a support ticket for a matching username."""
    body = request.get_json(silent=True) or {}
    username = str(body.get("username") or "").strip()
    contact_email = str(body.get("contact_email") or body.get("email") or "").strip()
    details = str(body.get("details") or "").strip()
    confirm = body.get("confirm") in (True, "true", "1", 1, "yes", "on")

    if not confirm:
        return jsonify({"error": "Please confirm you want the account deleted"}), 400
    if len(username) < 2:
        return jsonify({"error": "Enter the account username"}), 400
    if "@" not in contact_email or len(contact_email) < 5:
        return jsonify({"error": "Enter a valid contact email"}), 400
    if len(details) > MAX_DETAILS:
        return jsonify({"error": f"Details must be {MAX_DETAILS} characters or fewer"}), 400

    user = _find_user(username)
    if not user:
        return jsonify(
            {
                "error": "No account found with that username. Check the spelling, or sign in and use Settings → Support.",
            }
        ), 404

    open_deletion = SupportTicket.query.filter_by(
        user_id=user.id, status="open", subject=DELETION_SUBJECT
    ).count()
    if open_deletion >= 2:
        return jsonify(
            {
                "error": "A deletion request is already open for this account. We’ll process it within 30 days.",
            }
        ), 429

    message_parts = [
        "Player requested permanent account and data deletion via /delete-account.html.",
        f"Contact email: {contact_email}",
    ]
    if details:
        message_parts.append(f"Details: {details}")
    message_parts.append("Please verify ownership, then delete the account and associated data.")

    ticket = SupportTicket(
        user_id=user.id,
        subject=DELETION_SUBJECT,
        message="\n\n".join(message_parts),
        status="open",
    )
    db.session.add(ticket)
    db.session.commit()

    return jsonify(
        {
            "ok": True,
            "message": (
                "Deletion request received for that username. "
                "We’ll verify and process it within 30 days. "
                "You may get a confirmation at the email you provided."
            ),
        }
    ), 201


@account_bp.post("/deletion-request/me")
@jwt_required()
def deletion_request_me():
    """Signed-in shortcut from Settings."""
    me = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    details = str(body.get("details") or "").strip()
    if len(details) > MAX_DETAILS:
        return jsonify({"error": f"Details must be {MAX_DETAILS} characters or fewer"}), 400

    open_deletion = SupportTicket.query.filter_by(
        user_id=me, status="open", subject=DELETION_SUBJECT
    ).count()
    if open_deletion >= 2:
        return jsonify(
            {
                "error": "A deletion request is already open. We’ll process it within 30 days.",
            }
        ), 429

    message = (
        "Player requested permanent account and data deletion from in-app Settings.\n\n"
        + (f"Details: {details}" if details else "No extra details provided.")
    )
    ticket = SupportTicket(
        user_id=me,
        subject=DELETION_SUBJECT,
        message=message,
        status="open",
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify(
        {
            "ok": True,
            "message": "Deletion request received. We’ll process verified requests within 30 days.",
        }
    ), 201
