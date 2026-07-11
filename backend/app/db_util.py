import os
from datetime import datetime, timezone

from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError, OperationalError

from app.password_util import hash_password
from app.models import User, db


def ensure_schema():
    """Create tables and apply lightweight column migrations."""
    db.create_all()

    engine = db.engine
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    cols = {c["name"] for c in inspector.get_columns("users")}
    is_sqlite = engine.dialect.name == "sqlite"
    migrations = [
        ("is_admin", "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL"),
        ("google_id", "ALTER TABLE users ADD COLUMN google_id VARCHAR(128)"),
        ("email", "ALTER TABLE users ADD COLUMN email VARCHAR(255)"),
        (
            "created_at",
            "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL",
        ),
        ("reset_token_hash", "ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(128)"),
        ("reset_token_expires", "ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP"),
    ]
    if not is_sqlite:
        migrations[0] = (
            "is_admin",
            "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL",
        )

    for col_name, sql in migrations:
        if col_name in cols:
            continue
        try:
            with engine.begin() as conn:
                conn.execute(text(sql))
            cols.add(col_name)
        except OperationalError:
            cols = {c["name"] for c in inspector.get_columns("users")}

    if "challenges" in inspector.get_table_names():
        ch_cols = {c["name"] for c in inspector.get_columns("challenges")}
        if "kind" not in ch_cols:
            try:
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE challenges ADD COLUMN kind VARCHAR(16) DEFAULT 'friend' NOT NULL"
                        )
                    )
            except OperationalError:
                pass
            ch_cols = {c["name"] for c in inspector.get_columns("challenges")}
        if "mission_json" not in ch_cols:
            try:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE challenges ADD COLUMN mission_json TEXT"))
            except OperationalError:
                pass


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
                password_hash=hash_password(password),
                is_admin=True,
            )
            db.session.add(user)
        else:
            user.is_admin = True
            user.password_hash = hash_password(password)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()


def utc_now():
    return datetime.now(timezone.utc)
