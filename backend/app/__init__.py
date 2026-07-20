from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.config import Config
from app.models import User, db


def create_app(config_class=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)

    from app.blueprints.auth import auth_bp
    from app.blueprints.game import game_bp
    from app.blueprints.scores import scores_bp
    from app.blueprints.progress import progress_bp
    from app.blueprints.admin import admin_bp
    from app.blueprints.payments import payments_bp
    from app.blueprints.friends import friends_bp
    from app.blueprints.challenges import challenges_bp
    from app.blueprints.matchmaking import matchmaking_bp
    from app.blueprints.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(game_bp, url_prefix="/api/game")
    app.register_blueprint(scores_bp, url_prefix="/api/scores")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(friends_bp, url_prefix="/api/friends")
    app.register_blueprint(challenges_bp, url_prefix="/api/challenges")
    app.register_blueprint(matchmaking_bp, url_prefix="/api/matchmaking")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    from app.blueprints.tournaments import tournaments_bp
    from app.blueprints.support import support_bp
    from app.blueprints.account import account_bp

    app.register_blueprint(tournaments_bp, url_prefix="/api/tournaments")
    app.register_blueprint(support_bp, url_prefix="/api/support")
    app.register_blueprint(account_bp, url_prefix="/api/account")

    @app.route("/api/health")
    def health():
        uri = app.config.get("SQLALCHEMY_DATABASE_URI") or ""
        if "postgres" in uri:
            db_kind = "postgres"
        elif "sqlite" in uri:
            db_kind = "sqlite"
        else:
            db_kind = "unknown"
        try:
            users = User.query.count()
            return {"status": "ok", "db": db_kind, "users": users}
        except Exception as exc:
            return {"status": "error", "db": db_kind, "error": str(exc)}, 503

    static_dir = app.config.get("STATIC_FOLDER")
    if static_dir:
        static_path = Path(static_dir)

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path and (static_path / path).is_file():
                return send_from_directory(static_path, path)
            return send_from_directory(static_path, "index.html")

    with app.app_context():
        from app.db_util import ensure_admin_user, ensure_schema

        ensure_schema()
        ensure_admin_user()

    return app
