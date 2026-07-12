"""Standard Elo rating helpers for multiplayer matchmaking."""

from __future__ import annotations

DEFAULT_ELO = 1000
ELO_K = 32
ELO_FLOOR = 100
# Prefer opponents within this rating distance; expand if queue is thin.
ELO_MATCH_BAND = 150
ELO_MATCH_BAND_WIDE = 350


def expected_score(rating_a: int, rating_b: int) -> float:
    """Probability that A beats B."""
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))


def elo_change(winner_elo: int, loser_elo: int, k: int = ELO_K) -> int:
    """Points the winner gains (loser loses the same). Higher upset → larger swing."""
    exp = expected_score(winner_elo, loser_elo)
    return max(1, int(round(k * (1.0 - exp))))


def apply_elo_result(
    rating_a: int,
    rating_b: int,
    winner: str,
) -> tuple[int, int, int]:
    """
    winner: 'a' | 'b' | 'tie'
    Returns (new_a, new_b, delta_applied_to_winner_or_0_on_tie).
    """
    if winner == "tie":
        # Small pull toward each other on ties
        if rating_a == rating_b:
            return rating_a, rating_b, 0
        if rating_a > rating_b:
            d = max(1, elo_change(rating_b, rating_a) // 4)
            return max(ELO_FLOOR, rating_a - d), rating_b + d, 0
        d = max(1, elo_change(rating_a, rating_b) // 4)
        return rating_a + d, max(ELO_FLOOR, rating_b - d), 0

    if winner == "a":
        d = elo_change(rating_a, rating_b)
        return rating_a + d, max(ELO_FLOOR, rating_b - d), d
    d = elo_change(rating_b, rating_a)
    return max(ELO_FLOOR, rating_a - d), rating_b + d, d
