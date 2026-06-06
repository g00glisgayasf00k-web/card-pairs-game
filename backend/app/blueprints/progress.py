import json
from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.db_util import utc_now
from app.models import PlayerProgress, User, db

progress_bp = Blueprint("progress", __name__)


@progress_bp.get("/me")
@jwt_required()
def get_my_progress():
    user_id = int(get_jwt_identity())
    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    if not row:
        return jsonify({"progress": None, "client_updated_at": 0}), 200
    try:
        payload = json.loads(row.payload)
    except json.JSONDecodeError:
        payload = {}
    return jsonify(
        {
            "progress": payload,
            "client_updated_at": row.client_updated_at,
            "server_updated_at": row.updated_at.isoformat(),
        }
    )


@progress_bp.post("/sync")
@jwt_required()
def sync_progress():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    progress = data.get("progress")
    client_updated_at = int(data.get("client_updated_at") or 0)

    if not isinstance(progress, dict):
        return jsonify({"error": "progress object required"}), 400

    row = PlayerProgress.query.filter_by(user_id=user_id).first()
    if row and client_updated_at < row.client_updated_at:
        try:
            payload = json.loads(row.payload)
        except json.JSONDecodeError:
            payload = {}
        return jsonify(
            {
                "saved": False,
                "reason": "server_newer",
                "progress": payload,
                "client_updated_at": row.client_updated_at,
            }
        ), 200

    payload_text = json.dumps(progress)
    if not row:
        row = PlayerProgress(
            user_id=user_id,
            payload=payload_text,
            client_updated_at=client_updated_at,
            updated_at=utc_now(),
        )
        db.session.add(row)
    else:
        row.payload = payload_text
        row.client_updated_at = client_updated_at
        row.updated_at = utc_now()

    db.session.commit()
    return jsonify({"saved": True, "client_updated_at": row.client_updated_at}), 200
