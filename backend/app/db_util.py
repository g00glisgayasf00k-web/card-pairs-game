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
            ch_cols = {c["name"] for c in inspector.get_columns("challenges")}
        for col_name, sql in (
            ("fee_gems", "ALTER TABLE challenges ADD COLUMN fee_gems INTEGER DEFAULT 0 NOT NULL"),
            (
                "challenger_staked",
                "ALTER TABLE challenges ADD COLUMN challenger_staked BOOLEAN DEFAULT 0 NOT NULL"
                if is_sqlite
                else "ALTER TABLE challenges ADD COLUMN challenger_staked BOOLEAN DEFAULT FALSE NOT NULL",
            ),
            (
                "opponent_staked",
                "ALTER TABLE challenges ADD COLUMN opponent_staked BOOLEAN DEFAULT 0 NOT NULL"
                if is_sqlite
                else "ALTER TABLE challenges ADD COLUMN opponent_staked BOOLEAN DEFAULT FALSE NOT NULL",
            ),
            (
                "gems_settled",
                "ALTER TABLE challenges ADD COLUMN gems_settled BOOLEAN DEFAULT 0 NOT NULL"
                if is_sqlite
                else "ALTER TABLE challenges ADD COLUMN gems_settled BOOLEAN DEFAULT FALSE NOT NULL",
            ),
            (
                "proposed_wager_gems",
                "ALTER TABLE challenges ADD COLUMN proposed_wager_gems INTEGER",
            ),
            (
                "proposed_by_id",
                "ALTER TABLE challenges ADD COLUMN proposed_by_id INTEGER",
            ),
            (
                "challenger_duration_ms",
                "ALTER TABLE challenges ADD COLUMN challenger_duration_ms INTEGER",
            ),
            (
                "opponent_duration_ms",
                "ALTER TABLE challenges ADD COLUMN opponent_duration_ms INTEGER",
            ),
        ):
            if col_name in ch_cols:
                continue
            try:
                with engine.begin() as conn:
                    conn.execute(text(sql))
            except OperationalError:
                pass
            ch_cols = {c["name"] for c in inspector.get_columns("challenges")}

    if "match_tickets" in inspector.get_table_names():
        mt_cols = {c["name"] for c in inspector.get_columns("match_tickets")}
        if "elo" not in mt_cols:
            try:
                with engine.begin() as conn:
                    conn.execute(
                        text(
                            "ALTER TABLE match_tickets ADD COLUMN elo INTEGER DEFAULT 1000 NOT NULL"
                        )
                    )
            except OperationalError:
                pass

    _migrate_tournament_period_key(engine, inspector, is_sqlite)
    _migrate_tournament_duration_ms(engine, inspector)


def _migrate_tournament_duration_ms(engine, inspector) -> None:
    inspector = inspect(engine)
    if "tournament_runs" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("tournament_runs")}
    if "duration_ms" in cols:
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE tournament_runs ADD COLUMN duration_ms INTEGER"))
    except OperationalError:
        pass


def _migrate_tournament_period_key(engine, inspector, is_sqlite: bool) -> None:
    """Add period_key and switch uniqueness to (user_id, tier_id, period_key)."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if "tournament_runs" not in tables:
        return

    cols = {c["name"] for c in inspector.get_columns("tournament_runs")}
    if "period_key" in cols:
        return

    if is_sqlite:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE tournament_runs_new (
                        id INTEGER NOT NULL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        tier_id VARCHAR(32) NOT NULL,
                        period_key VARCHAR(32) NOT NULL,
                        level INTEGER NOT NULL,
                        board_seed BIGINT NOT NULL,
                        target_points INTEGER NOT NULL,
                        hands INTEGER NOT NULL,
                        score INTEGER NOT NULL,
                        created_at DATETIME NOT NULL,
                        updated_at DATETIME NOT NULL,
                        CONSTRAINT uq_tournament_user_tier_period
                            UNIQUE (user_id, tier_id, period_key),
                        FOREIGN KEY(user_id) REFERENCES users (id)
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO tournament_runs_new (
                        id, user_id, tier_id, period_key, level, board_seed,
                        target_points, hands, score, created_at, updated_at
                    )
                    SELECT
                        id, user_id, tier_id, 'legacy', level, board_seed,
                        target_points, hands, score, created_at, updated_at
                    FROM tournament_runs
                    """
                )
            )
            conn.execute(text("DROP TABLE tournament_runs"))
            conn.execute(text("ALTER TABLE tournament_runs_new RENAME TO tournament_runs"))
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_tournament_runs_user_id ON tournament_runs (user_id)")
            )
            conn.execute(
                text("CREATE INDEX IF NOT EXISTS ix_tournament_runs_tier_id ON tournament_runs (tier_id)")
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tournament_runs_period_key ON tournament_runs (period_key)"
                )
            )
        return

    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE tournament_runs "
                "ADD COLUMN period_key VARCHAR(32) DEFAULT 'legacy' NOT NULL"
            )
        )
        conn.execute(
            text(
                "UPDATE tournament_runs SET period_key = 'legacy' "
                "WHERE period_key IS NULL OR period_key = ''"
            )
        )

    for constraint_name in ("uq_tournament_user_tier", "tournament_runs_user_id_tier_id_key"):
        try:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE tournament_runs DROP CONSTRAINT {constraint_name}"))
        except Exception:
            pass

    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE tournament_runs "
                    "ADD CONSTRAINT uq_tournament_user_tier_period "
                    "UNIQUE (user_id, tier_id, period_key)"
                )
            )
    except Exception:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_tournament_runs_period_key "
                    "ON tournament_runs (period_key)"
                )
            )
    except Exception:
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
