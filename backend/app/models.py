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
