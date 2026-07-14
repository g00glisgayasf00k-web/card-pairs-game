from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True, index=True)
    google_id = db.Column(db.String(128), unique=True, nullable=True, index=True)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    reset_token_hash = db.Column(db.String(128), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    privacy_accepted_at = db.Column(db.DateTime, nullable=True)
    privacy_policy_version = db.Column(db.String(16), nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    scores = db.relationship("Score", back_populates="user", lazy="dynamic")
    progress = db.relationship("PlayerProgress", back_populates="user", uselist=False)


class PlayerProgress(db.Model):
    __tablename__ = "player_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    payload = db.Column(db.Text, nullable=False, default="{}")
    client_updated_at = db.Column(db.BigInteger, default=0, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = db.relationship("User", back_populates="progress")


class Score(db.Model):
    __tablename__ = "scores"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    hands_cleared = db.Column(db.Integer, default=0)
    best_hand = db.Column(db.String(32), default="pair")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = db.relationship("User", back_populates="scores")


class PurchaseRecord(db.Model):
    __tablename__ = "purchase_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    pack_id = db.Column(db.String(32), nullable=False)
    square_payment_id = db.Column(db.String(128), unique=True, nullable=False, index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(8), nullable=False, default="USD")
    gems_granted = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(32), nullable=False, default="completed")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = db.relationship("User", backref=db.backref("purchases", lazy="dynamic"))


class Friendship(db.Model):
    __tablename__ = "friendships"
    __table_args__ = (
        db.UniqueConstraint("user_id", "friend_id", name="uq_friendship_pair"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    friend_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.String(16), nullable=False, default="pending")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", foreign_keys=[user_id])
    friend = db.relationship("User", foreign_keys=[friend_id])


class Challenge(db.Model):
    __tablename__ = "challenges"

    id = db.Column(db.Integer, primary_key=True)
    challenger_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    opponent_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    level = db.Column(db.Integer, nullable=False)
    board_seed = db.Column(db.BigInteger, nullable=False)
    status = db.Column(db.String(16), nullable=False, default="pending")
    kind = db.Column(db.String(16), nullable=False, default="friend")
    wager_gems = db.Column(db.Integer, nullable=False, default=0)
    fee_gems = db.Column(db.Integer, nullable=False, default=0)
    challenger_staked = db.Column(db.Boolean, nullable=False, default=False)
    opponent_staked = db.Column(db.Boolean, nullable=False, default=False)
    gems_settled = db.Column(db.Boolean, nullable=False, default=False)
    # Counter-offer while still pending (negotiate wager / fee).
    proposed_wager_gems = db.Column(db.Integer, nullable=True)
    proposed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    # JSON mission: goals, target_points, move budgets (friend/quick duels).
    mission_json = db.Column(db.Text, nullable=True)

    challenger_stars = db.Column(db.Integer, nullable=True)
    challenger_moves = db.Column(db.Integer, nullable=True)
    challenger_score = db.Column(db.Integer, nullable=True)
    challenger_duration_ms = db.Column(db.Integer, nullable=True)
    challenger_submitted_at = db.Column(db.DateTime, nullable=True)

    opponent_stars = db.Column(db.Integer, nullable=True)
    opponent_moves = db.Column(db.Integer, nullable=True)
    opponent_score = db.Column(db.Integer, nullable=True)
    opponent_duration_ms = db.Column(db.Integer, nullable=True)
    opponent_submitted_at = db.Column(db.DateTime, nullable=True)

    winner_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    challenger = db.relationship("User", foreign_keys=[challenger_id])
    opponent = db.relationship("User", foreign_keys=[opponent_id])
    winner = db.relationship("User", foreign_keys=[winner_user_id])


class DeviceToken(db.Model):
    """FCM / APNs device tokens for push notifications."""

    __tablename__ = "device_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    token = db.Column(db.String(512), unique=True, nullable=False, index=True)
    platform = db.Column(db.String(16), nullable=False, default="android")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", backref=db.backref("device_tokens", lazy="dynamic"))


class MatchTicket(db.Model):
    __tablename__ = "match_tickets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    unlocked_level = db.Column(db.Integer, nullable=False, default=1)
    elo = db.Column(db.Integer, nullable=False, default=1000)
    status = db.Column(db.String(16), nullable=False, default="waiting")
    challenge_id = db.Column(db.Integer, db.ForeignKey("challenges.id"), nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at = db.Column(db.DateTime, nullable=False)

    user = db.relationship("User", foreign_keys=[user_id])
    challenge = db.relationship("Challenge", foreign_keys=[challenge_id])


class TournamentRun(db.Model):
    """Best completed tournament attempt per user per cup per period."""

    __tablename__ = "tournament_runs"
    __table_args__ = (
        db.UniqueConstraint(
            "user_id", "tier_id", "period_key", name="uq_tournament_user_tier_period"
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    tier_id = db.Column(db.String(32), nullable=False, index=True)
    # London calendar window: daily YYYY-MM-DD, weekly YYYY-Www, monthly YYYY-MM
    period_key = db.Column(db.String(32), nullable=False, default="legacy", index=True)
    level = db.Column(db.Integer, nullable=False)
    board_seed = db.Column(db.BigInteger, nullable=False)
    target_points = db.Column(db.Integer, nullable=False)
    hands = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    duration_ms = db.Column(db.Integer, nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship("User", foreign_keys=[user_id])


class SupportTicket(db.Model):
    """Player contact-support message for the admin inbox."""

    __tablename__ = "support_tickets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    subject = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(16), nullable=False, default="open", index=True)
    admin_reply = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    replied_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", foreign_keys=[user_id])
