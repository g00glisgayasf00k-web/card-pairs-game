from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc

from app.leaderboards import build_leaderboards
from app.models import Score, User, db
scores_bp = Blueprint("scores", __name__)


@scores_bp.get("/leaderboard")
def leaderboard():
    limit = min(int(request.args.get("limit", 20)), 100)
    payload = build_leaderboards(limit)
    rows = payload["top_scores"]
    return jsonify(
        {
            "leaderboard": [
                {
                    "username": row["username"],
                    "points": row["points"],
                    "hands_cleared": row["hands_cleared"],
                    "best_hand": row["best_hand"],
                    "played_at": row["played_at"],
                }
                for row in rows
            ]
        }
    )


@scores_bp.get("/leaderboards")
def leaderboards():
    limit = min(int(request.args.get("limit", 10)), 50)
    return jsonify(build_leaderboards(limit))


@scores_bp.get("/me")
@jwt_required()
def my_scores():
    user_id = int(get_jwt_identity())
    scores = (
        Score.query.filter_by(user_id=user_id)
        .order_by(desc(Score.points))
        .limit(20)
        .all()
    )
    return jsonify(
        {
            "scores": [
                {
                    "points": s.points,
                    "hands_cleared": s.hands_cleared,
                    "best_hand": s.best_hand,
                    "played_at": s.created_at.isoformat(),
                }
                for s in scores
            ]
        }
    )


@scores_bp.post("/submit")
@jwt_required()
def submit_score():
    data = request.get_json(silent=True) or {}
    points = int(data.get("points", 0))
    hands_cleared = int(data.get("hands_cleared", 0))
    best_hand = data.get("best_hand", "pair")

    user_id = int(get_jwt_identity())
    if points <= 0:
        return jsonify({"saved": False, "message": "Nothing to save"}), 200

    score = Score(
        user_id=user_id,
        points=points,
        hands_cleared=hands_cleared,
        best_hand=best_hand,
    )
    db.session.add(score)
    db.session.commit()

    return jsonify({"saved": True, "id": score.id}), 201


@scores_bp.delete("/me")
@jwt_required()
def reset_my_scores():
    user_id = int(get_jwt_identity())
    Score.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"reset": True}), 200
