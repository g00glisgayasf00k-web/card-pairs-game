"""Player support tickets — contact form → admin inbox."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import SupportTicket, db

support_bp = Blueprint("support", __name__)

MAX_SUBJECT = 120
MAX_MESSAGE = 4000
MAX_REPLY = 4000


def _ticket_dict(ticket: SupportTicket, *, include_user: bool = False) -> dict:
    out = {
        "id": ticket.id,
        "subject": ticket.subject,
        "message": ticket.message,
        "status": ticket.status,
        "admin_reply": ticket.admin_reply,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "replied_at": ticket.replied_at.isoformat() if ticket.replied_at else None,
    }
    if include_user and ticket.user:
        out["user"] = {
            "id": ticket.user.id,
            "username": ticket.user.username,
        }
        out["user_id"] = ticket.user_id
    return out


@support_bp.get("")
@jwt_required()
def list_my_tickets():
    me = int(get_jwt_identity())
    tickets = (
        SupportTicket.query.filter_by(user_id=me)
        .order_by(SupportTicket.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({"tickets": [_ticket_dict(t) for t in tickets]})


@support_bp.post("")
@jwt_required()
def create_ticket():
    me = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    subject = str(body.get("subject") or "").strip()
    message = str(body.get("message") or "").strip()

    if len(subject) < 3:
        return jsonify({"error": "Subject is too short"}), 400
    if len(subject) > MAX_SUBJECT:
        return jsonify({"error": f"Subject must be {MAX_SUBJECT} characters or fewer"}), 400
    if len(message) < 10:
        return jsonify({"error": "Please include a bit more detail in your message"}), 400
    if len(message) > MAX_MESSAGE:
        return jsonify({"error": f"Message must be {MAX_MESSAGE} characters or fewer"}), 400

    open_count = SupportTicket.query.filter_by(user_id=me, status="open").count()
    if open_count >= 5:
        return jsonify({"error": "You already have several open tickets — wait for a reply"}), 429

    ticket = SupportTicket(
        user_id=me,
        subject=subject,
        message=message,
        status="open",
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify({"ticket": _ticket_dict(ticket)}), 201
