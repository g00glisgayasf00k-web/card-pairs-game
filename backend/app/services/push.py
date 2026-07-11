"""FCM HTTP v1 push — no-op when credentials are not configured."""

from __future__ import annotations

import json
import logging
from typing import Any

from flask import current_app

from app.models import DeviceToken, db

logger = logging.getLogger(__name__)

_cached_creds = None
_cached_project: str | None = None


def _fcm_ready() -> tuple[Any, str] | None:
    """Return (credentials, project_id) or None if push is not configured."""
    global _cached_creds, _cached_project

    project_id = (current_app.config.get("FCM_PROJECT_ID") or "").strip()
    sa_json = (current_app.config.get("FCM_SERVICE_ACCOUNT_JSON") or "").strip()
    if not project_id or not sa_json:
        return None

    if _cached_creds is not None and _cached_project == project_id:
        return _cached_creds, project_id

    try:
        from google.oauth2 import service_account
    except ImportError:
        logger.warning("google-auth not available — push disabled")
        return None

    try:
        info = json.loads(sa_json)
        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/firebase.messaging"],
        )
        _cached_creds = creds
        _cached_project = project_id
        return creds, project_id
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Invalid FCM_SERVICE_ACCOUNT_JSON: %s", exc)
        return None


def send_to_user(
    user_id: int,
    *,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> int:
    """Send a notification to all devices for a user. Returns sent count."""
    ready = _fcm_ready()
    if not ready:
        return 0

    tokens = DeviceToken.query.filter_by(user_id=user_id).all()
    if not tokens:
        return 0

    creds, project_id = ready
    try:
        import google.auth.transport.requests
        import requests as http
    except ImportError:
        return 0

    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json; charset=utf-8",
    }

    payload_data = {k: str(v) for k, v in (data or {}).items()}
    sent = 0
    stale: list[DeviceToken] = []

    for row in tokens:
        message = {
            "message": {
                "token": row.token,
                "notification": {"title": title, "body": body},
                "data": payload_data,
                "android": {
                    "priority": "high",
                    "notification": {
                        "channel_id": "social",
                        "notification_priority": "PRIORITY_HIGH",
                    },
                },
            }
        }
        try:
            resp = http.post(url, headers=headers, json=message, timeout=12)
            if resp.status_code == 200:
                sent += 1
                continue
            # Unregistered / invalid token → drop
            try:
                err = resp.json()
                status = (
                    err.get("error", {}).get("details", [{}])[0].get("errorCode")
                    or err.get("error", {}).get("status")
                    or ""
                )
            except Exception:
                status = ""
            if resp.status_code in (404, 400) or "UNREGISTERED" in str(status).upper():
                stale.append(row)
            else:
                logger.warning(
                    "FCM send failed (%s): %s", resp.status_code, resp.text[:300]
                )
        except Exception:
            logger.exception("FCM request error for user %s", user_id)

    if stale:
        for row in stale:
            db.session.delete(row)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    return sent
