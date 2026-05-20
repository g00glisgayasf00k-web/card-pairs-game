export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type HandLabel =
  | "pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush"
  | "royal_flush";

export const HAND_SCORES: Record<HandLabel, number> = {
  pair: 100,
  two_pair: 250,
  three_of_a_kind: 400,
  straight: 600,
  flush: 800,
  full_house: 1200,
  four_of_a_kind: 1800,
  straight_flush: 3000,
  royal_flush: 5000,
};

export const HAND_DISPLAY: Record<HandLabel, string> = {
  pair: "Pair",
  two_pair: "Two Pair",
  three_of_a_kind: "Three of a Kind",
  straight: "Straight",
  flush: "Flush",
  full_house: "Full House",
  four_of_a_kind: "Four of a Kind",
  straight_flush: "Straight Flush",
  royal_flush: "Royal Flush",
};

const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const ROYAL = new Set([10, 11, 12, 13, 14]);
const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export function randomCard(): Card {
  return {
    rank: RANKS[Math.floor(Math.random() * RANKS.length)]!,
    suit: SUITS[Math.floor(Math.random() * SUITS.length)]!,
  };
}

export function createBoard(rows: number, cols: number): (Card | null)[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randomCard())
  );
}

function rankCounts(cards: Card[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of cards) {
    const v = RANK_VALUES[c.rank];
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return m;
}

function isFlush(cards: Card[]): boolean {
  return cards.length >= 5 && new Set(cards.map((c) => c.suit)).size === 1;
}

function straightValues(values: number[]): boolean {
  if (values.length !== 5) return false;
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length !== 5) return false;
  if (unique.join() === "2,3,4,5,14") return true;
  return unique[4]! - unique[0]! === 4;
}

function isStraight(cards: Card[]): boolean {
  return cards.length === 5 && straightValues(cards.map((c) => RANK_VALUES[c.rank]));
}

function isRoyal(cards: Card[]): boolean {
  if (cards.length !== 5 || !isFlush(cards)) return false;
  const vals = new Set(cards.map((c) => RANK_VALUES[c.rank]));
  return vals.size === 5 && [...vals].every((v) => ROYAL.has(v)) && isStraight(cards);
}

export function pathIsAdjacent(cells: { row: number; col: number }[]): boolean {
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1]!;
    const b = cells[i]!;
    if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) return false;
  }
  return true;
}

export function straightMustStartAtEnd(cards: Card[]): boolean {
  if (cards.length !== 5) return true;
  const values = cards.map((c) => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const unique = [...new Set(values)].sort((a, b) => a - b);
  let low: Rank;
  let high: Rank;
  if (unique.join() === "2,3,4,5,14") {
    low = "5";
    high = "A";
  } else if (unique.length === 5 && unique[4]! - unique[0]! === 4) {
    const inv = Object.entries(RANK_VALUES).find(([, v]) => v === unique[0])![0] as Rank;
    const invH = Object.entries(RANK_VALUES).find(([, v]) => v === unique[4])![0] as Rank;
    low = inv;
    high = invH;
  } else {
    return true;
  }
  const ends = new Set([low, high]);
  return ends.has(cards[0]!.rank) && ends.has(cards[cards.length - 1]!.rank);
}

export function evaluateHand(
  cards: Card[]
): { hand: HandLabel; points: number } | null {
  if (cards.length < 2) return null;

  const counts = rankCounts(cards);
  const freq = [...counts.values()].sort((a, b) => b - a);
  const n = cards.length;
  const flush = n >= 5 && isFlush(cards);
  const straight = n === 5 && isStraight(cards);

  let hand: HandLabel | null = null;

  if (n === 5 && isRoyal(cards)) hand = "royal_flush";
  else if (n === 5 && straight && flush) hand = "straight_flush";
  else if (freq[0] === 4) hand = "four_of_a_kind";
  else if (n === 5 && freq[0] === 3 && freq[1] === 2) hand = "full_house";
  else if (n === 5 && flush) hand = "flush";
  else if (n === 5 && straight) hand = "straight";
  else if (freq[0] === 3) hand = "three_of_a_kind";
  else if (n === 4 && freq[0] === 2 && freq[1] === 2) hand = "two_pair";
  else if (n === 2 && freq[0] === 2) hand = "pair";
  else return null;

  return { hand, points: HAND_SCORES[hand] };
}

export const HAND_RANK_ORDER: Record<HandLabel, number> = {
  pair: 1,
  two_pair: 2,
  three_of_a_kind: 3,
  straight: 4,
  flush: 5,
  full_house: 6,
  four_of_a_kind: 7,
  straight_flush: 8,
  royal_flush: 9,
};
