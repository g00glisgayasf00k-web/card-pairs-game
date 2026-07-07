import smtplib
from email.message import EmailMessage

from flask import current_app


def _smtp_configured() -> bool:
    return bool(current_app.config.get("SMTP_HOST") and current_app.config.get("MAIL_FROM"))


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    subject = "Reset your Royal Match Poker password"
    body = (
        "You requested a password reset for Royal Match Poker.\n\n"
        f"Open this link to choose a new password (expires in "
        f"{current_app.config.get('RESET_TOKEN_TTL_MINUTES', 60)} minutes):\n\n"
        f"{reset_url}\n\n"
        "If you did not request this, you can ignore this email.\n"
    )

    if not _smtp_configured():
        current_app.logger.warning(
            "SMTP not configured — password reset link for %s: %s", to_email, reset_url
        )
        return True

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = current_app.config["MAIL_FROM"]
    msg["To"] = to_email
    msg.set_content(body)

    host = current_app.config["SMTP_HOST"]
    port = int(current_app.config.get("SMTP_PORT") or 587)
    user = current_app.config.get("SMTP_USER") or ""
    password = current_app.config.get("SMTP_PASSWORD") or ""
    use_tls = current_app.config.get("SMTP_USE_TLS", True)

    with smtplib.SMTP(host, port, timeout=30) as server:
        if use_tls:
            server.starttls()
        if user:
            server.login(user, password)
        server.send_message(msg)

    return True
