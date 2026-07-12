"""Generate short random poker missions for friend / quick challenges."""

from __future__ import annotations

import random
from typing import Any

# Keep in sync with frontend pokerHands.HAND_SCORES (scoring during play).
HAND_SCORES = {
    "pair": 50,
    "two_pair": 150,
    "three_of_a_kind": 200,
    "straight": 300,
    "flush": 400,
    "four_of_a_kind": 900,
    "straight_flush": 1500,
    "royal_flush": 2500,
}

# No full_house — matches the requested challenge pool.
HAND_POOL = [
    ("pair", 28),
    ("two_pair", 22),
    ("three_of_a_kind", 16),
    ("straight", 12),
    ("flush", 10),
    ("four_of_a_kind", 6),
    ("straight_flush", 4),
    ("royal_flush", 2),
]

RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
RANK_VALUES = {r: i for i, r in enumerate(RANKS, start=2)}
SUITS = ["hearts", "diamonds", "clubs", "spades"]
STRAIGHT_HIGH_RANKS = ["5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
# Ace-high suited broadway is a royal flush — never generate it as straight_flush.
STRAIGHT_FLUSH_HIGH_RANKS = ["5", "6", "7", "8", "9", "10", "J", "Q", "K"]

AVG_PTS_PER_MOVE = 120
STAR_MULT = {"three": 1.15, "two": 1.55, "one": 2.0}


def _pick_weighted(rng: random.Random, exclude: set[str] | None = None) -> str:
    exclude = exclude or set()
    pool = [(h, w) for h, w in HAND_POOL if h not in exclude]
    if not pool:
        pool = list(HAND_POOL)
    total = sum(w for _, w in pool)
    roll = rng.uniform(0, total)
    upto = 0.0
    for hand, weight in pool:
        upto += weight
        if roll <= upto:
            return hand
    return pool[-1][0]


def _pick_rank(rng: random.Random, exclude: set[str] | None = None) -> str:
    exclude = exclude or set()
    choices = [r for r in RANKS if r not in exclude]
    return rng.choice(choices or RANKS)


def _ranks_for_straight_high(high: str) -> list[str]:
    if high == "5":
        return ["A", "2", "3", "4", "5"]
    idx = RANKS.index(high)
    return RANKS[idx - 4 : idx + 1]


def _specify(hand: str, min_count: int, rng: random.Random) -> dict[str, Any]:
    goal: dict[str, Any] = {"hand": hand, "minCount": min_count}
    # ~70% of eligible hands get specific ranks/suits for variety
    specific = rng.random() < 0.7
    if hand == "royal_flush" or not specific:
        return goal

    if hand in ("pair", "three_of_a_kind", "four_of_a_kind"):
        goal["ranks"] = [_pick_rank(rng)]
    elif hand == "two_pair":
        a = _pick_rank(rng)
        b = _pick_rank(rng, {a})
        goal["ranks"] = sorted([a, b], key=lambda r: RANK_VALUES[r], reverse=True)
    elif hand == "straight":
        high = rng.choice(STRAIGHT_HIGH_RANKS)
        goal["ranks"] = _ranks_for_straight_high(high)
    elif hand == "straight_flush":
        high = rng.choice(STRAIGHT_FLUSH_HIGH_RANKS)
        goal["ranks"] = _ranks_for_straight_high(high)
        goal["suit"] = rng.choice(SUITS)
    elif hand == "flush":
        goal["suit"] = rng.choice(SUITS)
    return goal


def _star_limits(target_points: int, challenge_hands: int) -> dict[str, int]:
    def budget(mult: float) -> int:
        return max(1, int((target_points / AVG_PTS_PER_MOVE) * mult + 0.999))

    three = max(challenge_hands + 1, budget(STAR_MULT["three"]))
    two = max(three + 1, budget(STAR_MULT["two"]))
    one = max(two + 1, budget(STAR_MULT["one"]))
    return {"one": one, "two": two, "three": three}


def generate_challenge_mission(seed: int | None = None) -> dict[str, Any]:
    """
    Build a compact duel mission: random board is separate (board_seed).
    2 goals, mixed difficulty, specific hands often, ~12–20 move budget.
    """
    rng = random.Random(seed) if seed is not None else random.SystemRandom()

    goal_count = 2 if rng.random() < 0.75 else 3
    goals: list[dict[str, Any]] = []
    used: set[str] = set()
    for _ in range(goal_count):
        hand = _pick_weighted(rng, used)
        used.add(hand)
        # Pairs/two-pair can ask for 2 clears; rare hands stay at 1
        if hand in ("pair", "two_pair") and rng.random() < 0.45:
            min_count = 2
        else:
            min_count = 1
        goals.append(_specify(hand, min_count, rng))

    challenge_points = sum(HAND_SCORES[g["hand"]] * int(g["minCount"]) for g in goals)
    challenge_hands = sum(int(g["minCount"]) for g in goals)
    # Short duel: goals + light scoring headroom (combos / extras fill the gap)
    target_points = max(400, challenge_points + rng.randint(200, 450))
    # Cap so games don't drag past a quick duel
    target_points = min(target_points, 1400)

    limits = _star_limits(target_points, challenge_hands)
    # Keep 1★ budget in a snappy band (~10–18 moves)
    limits["one"] = max(limits["two"] + 1, min(limits["one"], 18))
    limits["two"] = min(limits["two"], limits["one"] - 1)
    limits["three"] = min(limits["three"], limits["two"] - 1)
    limits["three"] = max(challenge_hands + 1, limits["three"])

    return {
        "goals": goals,
        "target_points": target_points,
        "star_move_limits": limits,
        "move_limit": limits["one"],
        "challenge_points": challenge_points,
        "challenge_hands": challenge_hands,
    }
