from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from sqlalchemy import desc

from app.models import Score, User, db
scores_bp = Blueprint("scores", __name__)


@scores_bp.get("/leaderboard")
def leaderboard():
    limit = min(int(request.args.get("limit", 20)), 100)
    rows = (
        db.session.query(Score, User.username)
        .join(User)
        .order_by(desc(Score.points), desc(Score.created_at))
        .limit(limit)
        .all()
    )
    return jsonify(
        {
            "leaderboard": [
                {
                    "username": username,
                    "points": score.points,
                    "hands_cleared": score.hands_cleared,
                    "best_hand": score.best_hand,
                    "played_at": score.created_at.isoformat(),
                }
                for score, username in rows
            ]
        }
    )


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
def submit_score():
    data = request.get_json(silent=True) or {}
    points = int(data.get("points", 0))
    hands_cleared = int(data.get("hands_cleared", 0))
    best_hand = data.get("best_hand", "pair")

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            user_id = int(uid)
    except Exception:
        pass

    if user_id is None:
        return jsonify({"saved": False, "message": "Login to save scores"}), 200

    score = Score(
        user_id=user_id,
        points=points,
        hands_cleared=hands_cleared,
        best_hand=best_hand,
    )
    db.session.add(score)
    db.session.commit()

    return jsonify({"saved": True, "id": score.id}), 201
