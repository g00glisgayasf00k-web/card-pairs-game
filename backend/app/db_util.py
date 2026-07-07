import os
from datetime import datetime, timezone

from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError, OperationalError

from app.blueprints.auth import _hash_password
from app.models import User, db


def ensure_schema():
    """Create tables and apply lightweight SQLite column migrations."""
    db.create_all()

    engine = db.engine
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    cols = {c["name"] for c in inspector.get_columns("users")}
    migrations = [
        ("is_admin", "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL"),
        ("google_id", "ALTER TABLE users ADD COLUMN google_id VARCHAR(128)"),
        ("email", "ALTER TABLE users ADD COLUMN email VARCHAR(255)"),
        (
            "created_at",
            "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL",
        ),
    ]
    for col_name, sql in migrations:
        if col_name in cols:
            continue
        try:
            with engine.begin() as conn:
                conn.execute(text(sql))
            cols.add(col_name)
        except OperationalError:
            # Re-check — another worker may have migrated first.
            cols = {c["name"] for c in inspector.get_columns("users")}


def ensure_admin_user():
    username = (os.environ.get("ADMIN_USERNAME") or "").strip()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    if not username or not password:
        return

    try:
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
    except IntegrityError:
        db.session.rollback()


def utc_now():
    return datetime.now(timezone.utc)
