"""Poker hand detection for swiped adjacent card paths."""

from dataclasses import dataclass
from enum import IntEnum
from typing import Sequence


class HandRank(IntEnum):
    PAIR = 1
    TWO_PAIR = 2
    THREE_OF_A_KIND = 3
    STRAIGHT = 4
    FLUSH = 5
    FULL_HOUSE = 6
    FOUR_OF_A_KIND = 7
    STRAIGHT_FLUSH = 8
    ROYAL_FLUSH = 9


HAND_LABELS = {
    HandRank.PAIR: "pair",
    HandRank.TWO_PAIR: "two_pair",
    HandRank.THREE_OF_A_KIND: "three_of_a_kind",
    HandRank.STRAIGHT: "straight",
    HandRank.FLUSH: "flush",
    HandRank.FULL_HOUSE: "full_house",
    HandRank.FOUR_OF_A_KIND: "four_of_a_kind",
    HandRank.STRAIGHT_FLUSH: "straight_flush",
    HandRank.ROYAL_FLUSH: "royal_flush",
}

HAND_SCORES = {
    HandRank.PAIR: 50,
    HandRank.TWO_PAIR: 150,
    HandRank.THREE_OF_A_KIND: 200,
    HandRank.STRAIGHT: 300,
    HandRank.FLUSH: 400,
    HandRank.FULL_HOUSE: 600,
    HandRank.FOUR_OF_A_KIND: 900,
    HandRank.STRAIGHT_FLUSH: 1500,
    HandRank.ROYAL_FLUSH: 2500,
}

RANK_VALUES = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
}

ROYAL_RANKS = {10, 11, 12, 13, 14}


@dataclass(frozen=True)
class Card:
    rank: str
    suit: str

    @property
    def value(self) -> int:
        return RANK_VALUES[self.rank]


def _rank_counts(cards: Sequence[Card]) -> dict[int, int]:
    counts: dict[int, int] = {}
    for c in cards:
        counts[c.value] = counts.get(c.value, 0) + 1
    return counts


def _is_flush(cards: Sequence[Card]) -> bool:
    return len(cards) >= 5 and len({c.suit for c in cards}) == 1


def _straight_values(values: list[int]) -> bool:
    if len(values) != 5:
        return False
    unique = sorted(set(values))
    if len(unique) != 5:
        return False
    # Ace-low wheel: A-2-3-4-5
    if unique == [2, 3, 4, 5, 14]:
        return True
    return unique[-1] - unique[0] == 4


def _is_straight(cards: Sequence[Card]) -> bool:
    if len(cards) != 5:
        return False
    return _straight_values([c.value for c in cards])


def _is_royal(cards: Sequence[Card]) -> bool:
    """Royal flush = exactly 10-J-Q-K-A of one suit."""
    return (
        len(cards) == 5
        and _is_flush(cards)
        and {c.value for c in cards} == ROYAL_RANKS
    )


def evaluate_hand(cards: Sequence[dict]) -> tuple[HandRank | None, int, str | None]:
    """
    Evaluate a swiped path of exactly five cards.
    Returns (rank, score, label) or (None, 0, None) if invalid.
    """
    if len(cards) != 5:
        return None, 0, None

    parsed = [Card(rank=c["rank"], suit=c["suit"]) for c in cards]
    counts = _rank_counts(parsed)
    freq = sorted(counts.values(), reverse=True)
    flush = _is_flush(parsed)
    straight = _is_straight(parsed)

    if _is_royal(parsed):
        rank = HandRank.ROYAL_FLUSH
    elif straight and flush:
        rank = HandRank.STRAIGHT_FLUSH
    elif freq == [4, 1]:
        rank = HandRank.FOUR_OF_A_KIND
    elif freq == [3, 2]:
        rank = HandRank.FULL_HOUSE
    elif flush:
        rank = HandRank.FLUSH
    elif straight:
        rank = HandRank.STRAIGHT
    elif freq == [3, 1, 1]:
        rank = HandRank.THREE_OF_A_KIND
    elif freq == [2, 2, 1]:
        rank = HandRank.TWO_PAIR
    elif freq == [2, 1, 1, 1]:
        rank = HandRank.PAIR
    else:
        return None, 0, None

    return rank, HAND_SCORES[rank], HAND_LABELS[rank]


def path_is_adjacent(cells: Sequence[tuple[int, int]]) -> bool:
    """Each step must be orthogonally adjacent to the previous."""
    for i in range(1, len(cells)):
        r0, c0 = cells[i - 1]
        r1, c1 = cells[i]
        if abs(r0 - r1) + abs(c0 - c1) != 1:
            return False
    return True
