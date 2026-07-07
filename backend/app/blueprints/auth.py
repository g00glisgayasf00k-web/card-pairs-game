import re
import secrets

import bcrypt
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token

from app.models import User, db

auth_bp = Blueprint("auth", __name__)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _unique_username(base: str) -> str:
    cleaned = re.sub(r"[^\w.-]", "", (base or "").strip())[:24]
    if len(cleaned) < 3:
        cleaned = "player"
    candidate = cleaned[:32]
    n = 1
    while User.query.filter_by(username=candidate).first():
        suffix = str(n)
        candidate = f"{cleaned[: max(1, 32 - len(suffix))]}{suffix}"
        n += 1
    return candidate


def _auth_response(user: User, status: int = 200):
    token = create_access_token(identity=str(user.id))
    payload = {"token": token, "username": user.username, "user_id": user.id}
    if user.email:
        payload["email"] = user.email
    return jsonify(payload), status


@auth_bp.get("/config")
def public_config():
    return jsonify({"googleClientId": current_app.config.get("GOOGLE_CLIENT_ID") or ""})


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if len(username) < 3 or len(username) > 32:
        return jsonify({"error": "Username must be 3–32 characters"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(username=username, password_hash=_hash_password(password))
    db.session.add(user)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Could not create account — server database error"}), 500

    return _auth_response(user, 201)


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not _check_password(password, user.password_hash):
        return jsonify({"error": "Invalid username or password"}), 401

    return _auth_response(user)


def _verify_google_credential(credential: str, client_id: str) -> dict:
    """Lazy import so the app boots even if google-auth extras are missing."""
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
    except ImportError as exc:
        raise RuntimeError("Google sign-in dependencies are not installed") from exc

    return id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)


@auth_bp.post("/google")
def google_login():
    client_id = current_app.config.get("GOOGLE_CLIENT_ID") or ""
    if not client_id:
        return jsonify({"error": "Google sign-in is not configured on the server"}), 503

    data = request.get_json(silent=True) or {}
    credential = (data.get("credential") or "").strip()
    if not credential:
        return jsonify({"error": "Missing Google credential"}), 400

    try:
        idinfo = _verify_google_credential(credential, client_id)
    except RuntimeError:
        return jsonify({"error": "Google sign-in is not available on the server"}), 503
    except ValueError:
        return jsonify({"error": "Invalid Google sign-in"}), 401

    google_sub = idinfo.get("sub")
    if not google_sub:
        return jsonify({"error": "Invalid Google profile"}), 401

    email = (idinfo.get("email") or "").strip().lower()
    name = (idinfo.get("name") or "").strip()

    user = User.query.filter_by(google_id=google_sub).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()

    if not user:
        base_name = name or (email.split("@")[0] if email else f"player_{google_sub[:8]}")
        user = User(
            username=_unique_username(base_name),
            password_hash=_hash_password(secrets.token_urlsafe(32)),
            google_id=google_sub,
            email=email or None,
        )
        db.session.add(user)
    else:
        if not user.google_id:
            user.google_id = google_sub
        if email and not user.email:
            user.email = email

    db.session.commit()
    return _auth_response(user)
