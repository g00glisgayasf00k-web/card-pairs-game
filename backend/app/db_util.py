import os
from datetime import datetime, timezone

from sqlalchemy import inspect, text

from app.blueprints.auth import _hash_password
from app.models import User, db


def ensure_schema():
    """Create tables and apply lightweight SQLite column migrations."""
    db.create_all()

    engine = db.engine
    if engine.dialect.name != "sqlite":
        return

    insp = inspect(engine)
    if "users" not insp.get_table_names():
        return

    cols = {c["name"] for c in insp.get_columns("users")}
    if "is_admin" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL"))


def ensure_admin_user():
    username = (os.environ.get("ADMIN_USERNAME") or "").strip()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    if not username or not password:
        return

    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(
            username=username,
            password_hash=_hash_password(password),
            is_admin=True,
        )
        db.session.add(user)
    else:
        user.is_admin = True
        user.password_hash = _hash_password(password)
    db.session.commit()


def utc_now():
    return datetime.now(timezone.utc)
