import random

from flask import Blueprint, jsonify, request

from app.services.poker_hands import (
    evaluate_hand,
    path_is_adjacent,
)

game_bp = Blueprint("game", __name__)

RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
SUITS = ["hearts", "diamonds", "clubs", "spades"]
DEFAULT_ROWS = 6
DEFAULT_COLS = 6


def _random_card():
    return {"rank": random.choice(RANKS), "suit": random.choice(SUITS)}


def _empty_board(rows: int, cols: int):
    return [[None for _ in range(cols)] for _ in range(rows)]


@game_bp.post("/new")
def new_game():
    data = request.get_json(silent=True) or {}
    rows = int(data.get("rows", DEFAULT_ROWS))
    cols = int(data.get("cols", DEFAULT_COLS))
    rows = max(4, min(rows, 10))
    cols = max(4, min(cols, 10))

    board = [[_random_card() for _ in range(cols)] for _ in range(rows)]
    return jsonify({"board": board, "rows": rows, "cols": cols, "score": 0})


@game_bp.post("/validate")
def validate_swipe():
    """
    Validate a swipe path. Body:
    {
      "board": [[{rank,suit}|null,...],...],
      "path": [{"row":0,"col":1}, ...]  // swipe order
    }
    """
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    path = data.get("path") or []

    if not board or not path:
        return jsonify({"valid": False, "error": "Missing board or path"}), 400

    cells = [(p["row"], p["col"]) for p in path]
    if not path_is_adjacent(cells):
        return jsonify({"valid": False, "error": "Cards must be adjacent"}), 200

    cards = []
    for r, c in cells:
        if r < 0 or r >= len(board) or c < 0 or c >= len(board[0]):
            return jsonify({"valid": False, "error": "Out of bounds"}), 200
        cell = board[r][c]
        if not cell:
            return jsonify({"valid": False, "error": "Empty cell"}), 200
        cards.append(cell)

    hand_rank, points, label = evaluate_hand(cards)
    if hand_rank is None:
        return jsonify({"valid": False, "error": "Not a poker hand"}), 200

    return jsonify(
        {
            "valid": True,
            "hand": label,
            "points": points,
            "cells": [{"row": r, "col": c} for r, c in cells],
        }
    )


@game_bp.post("/refill")
def refill_cells():
    """Replace cleared cells with random cards."""
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    cells = data.get("cells") or []

    if board is None:
        return jsonify({"error": "Missing board"}), 400

    for cell in cells:
        r, c = cell["row"], cell["col"]
        board[r][c] = _random_card()

    return jsonify({"board": board})
