export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "J" | "Q" | "K" | "A";

/**
 * Special cards — earned as rewards for clearing high hands:
 *   bomb  💣  TAP to explode — clears all 8 surrounding cards instantly
 *   star  ⭐  TAP to clear  — clears every card on the board of the same rank
 *   joker 🃏  PASSIVE WILD  — when included in a swipe it acts as any rank/suit
 */
export type SpecialType = "bomb" | "star" | "joker";

export interface Card {
  rank: Rank;
  suit: Suit;
  special?: SpecialType;
}

export type HandLabel =
  | "pair" | "two_pair" | "three_of_a_kind" | "straight" | "flush"
  | "full_house" | "four_of_a_kind" | "straight_flush" | "royal_flush";

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

/** All hands sorted low → high, for score reference UI */
export const HAND_SCORE_LIST: { hand: HandLabel; points: number }[] = (
  Object.keys(HAND_SCORES) as HandLabel[]
)
  .map((hand) => ({ hand, points: HAND_SCORES[hand] }))
  .sort((a, b) => a.points - b.points);

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14,
};

const ROYAL = new Set([10, 11, 12, 13, 14]);
const RANKS: Rank[] = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const ALL_CARDS: { rank: Rank; suit: Suit }[] = RANKS.flatMap((rank) =>
  SUITS.map((suit) => ({ rank, suit }))
);

// ── Card generation ───────────────────────────────────────────────────────────

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

// ── Specials earned as hand rewards ──────────────────────────────────────────

/** Returns the special cards injected into the board after clearing the given hand. */
export function specialsEarnedForHand(hand: HandLabel): SpecialType[] {
  switch (hand) {
    case "three_of_a_kind": return ["bomb"];
    case "straight":        return ["star"];
    case "flush":           return ["joker"];
    case "full_house":      return ["bomb", "star"];
    case "four_of_a_kind":  return ["star", "star"];
    case "straight_flush":  return ["joker", "star"];
    case "royal_flush":     return ["bomb", "star", "joker"];
    default:                return [];
  }
}

/** UI copy for the power-ups guide modal */
export const SPECIALS_GUIDE: {
  type: SpecialType;
  name: string;
  earn: string;
  effect: string;
}[] = [
  {
    type: "bomb",
    name: "Bomb",
    earn: "Clear a Three of a Kind or better",
    effect: "Tap to blast all 8 surrounding cards (+50 pts each)",
  },
  {
    type: "star",
    name: "Star",
    earn: "Clear a Straight or better",
    effect: "Tap to clear every card of the same rank (+75 pts each)",
  },
  {
    type: "joker",
    name: "Joker",
    earn: "Clear a Flush or better",
    effect: "Swipe into a hand — counts as any rank or suit",
  },
];

export const SPECIALS_EARN_BY_HAND: { hand: HandLabel; types: SpecialType[] }[] = [
  { hand: "three_of_a_kind", types: ["bomb"] },
  { hand: "straight",        types: ["star"] },
  { hand: "flush",           types: ["joker"] },
  { hand: "full_house",      types: ["bomb", "star"] },
  { hand: "four_of_a_kind",  types: ["star", "star"] },
  { hand: "straight_flush",  types: ["joker", "star"] },
  { hand: "royal_flush",     types: ["bomb", "star", "joker"] },
];

// ── Plain evaluator (rank/suit only, ignores special field) ──────────────────

function rankCounts(cards: { rank: Rank }[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of cards) {
    const v = RANK_VALUES[c.rank];
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return m;
}

function isFlush(cards: { suit: Suit }[]): boolean {
  return cards.length >= 5 && new Set(cards.map((c) => c.suit)).size === 1;
}

function straightValues(values: number[]): boolean {
  if (values.length !== 5) return false;
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length !== 5) return false;
  if (unique.join() === "2,3,4,5,14") return true;
  return unique[4]! - unique[0]! === 4;
}

function isStraight(cards: { rank: Rank }[]): boolean {
  return cards.length === 5 && straightValues(cards.map((c) => RANK_VALUES[c.rank]));
}

function isRoyal(cards: { rank: Rank; suit: Suit }[]): boolean {
  if (cards.length !== 5 || !isFlush(cards)) return false;
  const vals = new Set(cards.map((c) => RANK_VALUES[c.rank]));
  return vals.size === 5 && [...vals].every((v) => ROYAL.has(v)) && isStraight(cards);
}

export function evaluateHand(
  cards: { rank: Rank; suit: Suit }[]
): { hand: HandLabel; points: number } | null {
  if (cards.length < 2) return null;
  const counts = rankCounts(cards);
  const freq = [...counts.values()].sort((a, b) => b - a);
  const n = cards.length;
  const flush = n >= 5 && isFlush(cards);
  const straight = n === 5 && isStraight(cards);

  let hand: HandLabel | null = null;
  if (n === 5 && isRoyal(cards))                     hand = "royal_flush";
  else if (n === 5 && straight && flush)              hand = "straight_flush";
  else if (freq[0] === 4)                             hand = "four_of_a_kind";
  else if (n === 5 && freq[0] === 3 && freq[1] === 2) hand = "full_house";
  else if (n === 5 && flush)                          hand = "flush";
  else if (n === 5 && straight)                       hand = "straight";
  else if (freq[0] === 3)                             hand = "three_of_a_kind";
  else if (n === 4 && freq[0] === 2 && freq[1] === 2) hand = "two_pair";
  else if (n === 2 && freq[0] === 2)                  hand = "pair";
  else return null;

  return { hand, points: HAND_SCORES[hand] };
}

// ── Wild (joker) substitution ─────────────────────────────────────────────────

function evaluateHandWithWilds(
  cards: Card[]
): { hand: HandLabel; points: number } | null {
  const wilds = cards.filter((c) => c.special === "joker");
  const normals = cards.filter((c) => c.special !== "joker");
  const wc = wilds.length;
  const n = cards.length;

  if (wc === 0) return evaluateHand(normals);
  if (n < 2) return null;

  if (normals.length === 0) {
    if (n === 2) return { hand: "pair", points: HAND_SCORES.pair };
    if (n === 3) return { hand: "three_of_a_kind", points: HAND_SCORES.three_of_a_kind };
    if (n === 4) return { hand: "four_of_a_kind", points: HAND_SCORES.four_of_a_kind };
    return { hand: "royal_flush", points: HAND_SCORES.royal_flush };
  }

  const base = normals.map((c) => ({ rank: c.rank, suit: c.suit }));

  if (wc === 1) {
    let best: { hand: HandLabel; points: number } | null = null;
    for (const sub of ALL_CARDS) {
      const result = evaluateHand([...base, sub]);
      if (result && (!best || result.points > best.points)) best = result;
    }
    return best;
  }

  if (wc === 2) {
    let best: { hand: HandLabel; points: number } | null = null;
    for (const s1 of ALL_CARDS) {
      for (const s2 of ALL_CARDS) {
        const result = evaluateHand([...base, s1, s2]);
        if (result && (!best || result.points > best.points)) best = result;
      }
    }
    return best;
  }

  // 3+ wilds — return best possible for hand size
  if (n === 2) return { hand: "pair",              points: HAND_SCORES.pair };
  if (n === 3) return { hand: "three_of_a_kind",   points: HAND_SCORES.three_of_a_kind };
  if (n === 4) return { hand: "four_of_a_kind",    points: HAND_SCORES.four_of_a_kind };
  return       { hand: "royal_flush",              points: HAND_SCORES.royal_flush };
}

// ── Full result with special effects ─────────────────────────────────────────

export interface FullHandResult {
  hand: HandLabel;
  basePoints: number;
  totalPoints: number;
  hasJoker: boolean; // joker (wild) was used in this hand
}

export function evaluateHandFull(cards: Card[]): FullHandResult | null {
  const hasJoker = cards.some((c) => c.special === "joker");
  const base = hasJoker ? evaluateHandWithWilds(cards) : evaluateHand(cards);
  if (!base) return null;
  return { hand: base.hand, basePoints: base.points, totalPoints: base.points, hasJoker };
}

// ── Path helpers ─────────────────────────────────────────────────────────────

export function pathIsAdjacent(cells: { row: number; col: number }[]): boolean {
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1]!;
    const b = cells[i]!;
    if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) return false;
  }
  return true;
}

export function straightMustStartAtEnd(cards: Card[]): boolean {
  // Joker (wild) in path → skip direction rule
  if (cards.some((c) => c.special === "joker")) return true;
  if (cards.length !== 5) return true;

  const values = cards.map((c) => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const unique = [...new Set(values)].sort((a, b) => a - b);
  let low: Rank, high: Rank;
  if (unique.join() === "2,3,4,5,14") {
    low = "5"; high = "A";
  } else if (unique.length === 5 && unique[4]! - unique[0]! === 4) {
    low  = Object.entries(RANK_VALUES).find(([, v]) => v === unique[0])![0] as Rank;
    high = Object.entries(RANK_VALUES).find(([, v]) => v === unique[4])![0] as Rank;
  } else {
    return true;
  }
  const ends = new Set([low, high]);
  return ends.has(cards[0]!.rank) && ends.has(cards[cards.length - 1]!.rank);
}

export const HAND_RANK_ORDER: Record<HandLabel, number> = {
  pair: 1, two_pair: 2, three_of_a_kind: 3, straight: 4,
  flush: 5, full_house: 6, four_of_a_kind: 7, straight_flush: 8, royal_flush: 9,
};
