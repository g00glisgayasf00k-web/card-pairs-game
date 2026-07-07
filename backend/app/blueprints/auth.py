import hashlib
import re
import secrets
from datetime import timedelta, timezone
from typing import Optional

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token

from app.db_util import utc_now
from app.models import User, db
from app.password_util import check_password, hash_password
from app.services.email import send_password_reset_email

auth_bp = Blueprint("auth", __name__)

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _hash_password(password: str) -> str:
    return hash_password(password)


def _check_password(password: str, password_hash: str) -> bool:
    return check_password(password, password_hash)


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _valid_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email))


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


def _find_user_by_identifier(identifier: str) -> Optional[User]:
    value = identifier.strip()
    if not value:
        return None
    if "@" in value:
        normalized = _normalize_email(value)
        return User.query.filter(db.func.lower(User.email) == normalized).first()
    return User.query.filter_by(username=value).first()


def _clear_reset_token(user: User) -> None:
    user.reset_token_hash = None
    user.reset_token_expires = None


@auth_bp.get("/config")
def public_config():
    return jsonify({"googleClientId": current_app.config.get("GOOGLE_CLIENT_ID") or ""})


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    email_raw = (data.get("email") or "").strip()
    email = _normalize_email(email_raw) if email_raw else None

    if len(username) < 3 or len(username) > 32:
        return jsonify({"error": "Username must be 3–32 characters"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if email and not _valid_email(email):
        return jsonify({"error": "Enter a valid email address"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409
    if email and User.query.filter(db.func.lower(User.email) == email).first():
        return jsonify({"error": "Email already in use"}), 409

    user = User(username=username, password_hash=_hash_password(password), email=email)
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


@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("email") or data.get("identifier") or data.get("username") or "").strip()

    if not identifier:
        return jsonify({"error": "Enter your email or username"}), 400

    user = _find_user_by_identifier(identifier)
    generic = {
        "message": "If an account exists with a recovery email, we sent reset instructions."
    }

    if not user:
        return jsonify(generic)

    if not user.email:
        return jsonify(
            {
                "error": "This account has no email on file. Sign in with Google, or sign up again with an email address."
            }
        ), 400

    token = secrets.token_urlsafe(32)
    ttl = int(current_app.config.get("RESET_TOKEN_TTL_MINUTES") or 60)
    user.reset_token_hash = _hash_reset_token(token)
    user.reset_token_expires = utc_now() + timedelta(minutes=ttl)
    db.session.commit()

    reset_url = f"{current_app.config['FRONTEND_URL']}?reset={token}"
    try:
        send_password_reset_email(user.email, reset_url)
    except Exception as exc:
        _clear_reset_token(user)
        db.session.commit()
        current_app.logger.exception("Failed to send password reset email")
        return jsonify({"error": "Could not send reset email. Try again later."}), 503

    return jsonify(generic)


@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    password = data.get("password") or ""

    if not token:
        return jsonify({"error": "Reset link is invalid or expired"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    token_hash = _hash_reset_token(token)
    user = User.query.filter_by(reset_token_hash=token_hash).first()
    if not user or not user.reset_token_expires:
        return jsonify({"error": "Reset link is invalid or expired"}), 400

    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < utc_now():
        _clear_reset_token(user)
        db.session.commit()
        return jsonify({"error": "Reset link is invalid or expired"}), 400

    user.password_hash = _hash_password(password)
    _clear_reset_token(user)
    db.session.commit()

    return jsonify({"message": "Password updated. You can sign in now.", "username": user.username})


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
