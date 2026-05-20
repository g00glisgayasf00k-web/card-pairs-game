from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.config import Config
from app.models import db


def create_app(config_class=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    JWTManager(app)

    from app.blueprints.auth import auth_bp
    from app.blueprints.game import game_bp
    from app.blueprints.scores import scores_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(game_bp, url_prefix="/api/game")
    app.register_blueprint(scores_bp, url_prefix="/api/scores")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

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
        db.create_all()

    return app
