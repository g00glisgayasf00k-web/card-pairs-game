import uuid

import requests
from flask import current_app


class SquareError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _square_config() -> tuple[str, str, str]:
    access_token = (current_app.config.get("SQUARE_ACCESS_TOKEN") or "").strip()
    location_id = (current_app.config.get("SQUARE_LOCATION_ID") or "").strip()
    environment = (current_app.config.get("SQUARE_ENVIRONMENT") or "sandbox").strip().lower()
    if not access_token or not location_id:
        raise SquareError("Square payments are not configured", 503)
    return access_token, location_id, environment


def square_api_base(environment: str) -> str:
    if environment == "production":
        return "https://connect.squareup.com"
    return "https://connect.squareupsandbox.com"


def create_card_payment(
    *,
    source_id: str,
    amount_cents: int,
    currency: str,
    reference_id: str,
    note: str,
) -> dict:
    access_token, location_id, environment = _square_config()
    url = f"{square_api_base(environment)}/v2/payments"
    body = {
        "source_id": source_id,
        "idempotency_key": str(uuid.uuid4()),
        "amount_money": {"amount": amount_cents, "currency": currency},
        "location_id": location_id,
        "reference_id": reference_id[:40],
        "note": note[:500],
    }
    res = requests.post(
        url,
        json=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Square-Version": "2024-10-17",
        },
        timeout=30,
    )
    data = res.json()
    if not res.ok:
        detail = data.get("errors", [{}])[0].get("detail", res.text)
        raise SquareError(detail or "Payment failed", res.status_code)
    payment = data.get("payment") or {}
    if payment.get("status") not in ("COMPLETED", "APPROVED", "PENDING"):
        raise SquareError(f"Payment status: {payment.get('status') or 'unknown'}")
    return payment
