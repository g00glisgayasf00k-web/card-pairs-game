import type { Card, HandLabel, Rank, Suit } from "./pokerHands";

/** Guided lesson complete — player earns points freely on the fixed free-play board. */
export const TUTORIAL_FREE_STEP = 3;

export interface TutorialStepConfig {
  id: "pair" | "two_pair" | "three_of_a_kind";
  lesson: number;
  title: string;
  message: string;
  expectedHand: HandLabel;
  guidedPath: { row: number; col: number }[];
  board: Card[][];
}

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

/** Deterministic filler so every Beginner 1 run starts identically. */
const FILLER: Card[] = [
  c("2", "spades"), c("3", "hearts"), c("4", "clubs"), c("5", "diamonds"),
  c("6", "spades"), c("7", "hearts"), c("10", "clubs"), c("Q", "diamonds"),
  c("K", "spades"), c("A", "hearts"), c("2", "diamonds"), c("3", "clubs"),
  c("4", "spades"), c("5", "hearts"), c("6", "clubs"), c("7", "diamonds"),
  c("10", "spades"), c("J", "hearts"), c("Q", "clubs"), c("K", "diamonds"),
  c("A", "spades"), c("2", "clubs"), c("3", "diamonds"), c("4", "hearts"),
  c("5", "spades"), c("6", "diamonds"), c("7", "clubs"), c("10", "hearts"),
  c("J", "spades"), c("Q", "hearts"), c("K", "clubs"), c("A", "diamonds"),
  c("3", "spades"), c("4", "diamonds"), c("5", "clubs"), c("6", "hearts"),
  c("7", "spades"), c("10", "diamonds"), c("J", "clubs"), c("Q", "spades"),
  c("K", "hearts"), c("A", "clubs"), c("2", "hearts"), c("3", "clubs"),
  c("4", "diamonds"), c("5", "spades"), c("6", "clubs"), c("7", "diamonds"),
  c("10", "clubs"), c("J", "diamonds"), c("Q", "hearts"), c("K", "spades"),
  c("A", "diamonds"), c("2", "spades"), c("3", "hearts"), c("4", "clubs"),
  c("5", "diamonds"), c("6", "spades"), c("7", "hearts"), c("10", "clubs"),
  c("J", "diamonds"), c("Q", "spades"), c("K", "hearts"), c("A", "clubs"),
];

function buildBoard(placements: Record<string, Card>): Card[][] {
  let fi = 0;
  const rows: Card[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: Card[] = [];
    for (let col = 0; col < 8; col++) {
      const key = `${r},${col}`;
      row.push(placements[key] ?? FILLER[fi++]!);
    }
    rows.push(row);
  }
  return rows;
}

function cloneBoard(board: Card[][]): Card[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

const PAIR_PATH = [
  { row: 3, col: 3 },
  { row: 3, col: 4 },
];

const TWO_PAIR_PATH = [
  { row: 2, col: 2 },
  { row: 2, col: 3 },
  { row: 2, col: 4 },
  { row: 2, col: 5 },
];

const TRIPS_PATH = [
  { row: 4, col: 3 },
  { row: 4, col: 4 },
  { row: 4, col: 5 },
];

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: "pair",
    lesson: 1,
    title: "Make a Pair",
    message: "Swipe the glowing cards — connect two cards of the same rank.",
    expectedHand: "pair",
    guidedPath: PAIR_PATH,
    board: buildBoard({
      "3,3": c("9", "hearts"),
      "3,4": c("9", "diamonds"),
    }),
  },
  {
    id: "two_pair",
    lesson: 2,
    title: "Make Two Pair",
    message: "Swipe all four glowing cards — two pairs in one path.",
    expectedHand: "two_pair",
    guidedPath: TWO_PAIR_PATH,
    board: buildBoard({
      "2,2": c("J", "hearts"),
      "2,3": c("J", "diamonds"),
      "2,4": c("4", "clubs"),
      "2,5": c("4", "spades"),
    }),
  },
  {
    id: "three_of_a_kind",
    lesson: 3,
    title: "Three of a Kind",
    message: "Swipe the three glowing 8s — this level needs at least one!",
    expectedHand: "three_of_a_kind",
    guidedPath: TRIPS_PATH,
    board: buildBoard({
      "4,3": c("8", "hearts"),
      "4,4": c("8", "diamonds"),
      "4,5": c("8", "clubs"),
    }),
  },
];

/** Same board every time after the tutorial — extra pairs to reach 1,000 pts. */
export const TUTORIAL_FREE_BOARD = buildBoard({
  "0,0": c("9", "hearts"),
  "0,1": c("9", "diamonds"),
  "1,2": c("J", "hearts"),
  "1,3": c("J", "diamonds"),
  "1,4": c("4", "clubs"),
  "1,5": c("4", "spades"),
  "2,3": c("8", "hearts"),
  "2,4": c("8", "diamonds"),
  "2,5": c("8", "clubs"),
  "4,1": c("6", "hearts"),
  "4,2": c("6", "diamonds"),
  "5,5": c("K", "clubs"),
  "5,6": c("K", "spades"),
  "6,2": c("5", "hearts"),
  "6,3": c("5", "clubs"),
  "7,6": c("7", "hearts"),
  "7,7": c("7", "diamonds"),
});

export function isLevel1TutorialActive(level: number, tutorialStep: number): boolean {
  return level === 1 && tutorialStep < TUTORIAL_FREE_STEP;
}

export function getTutorialStepConfig(step: number): TutorialStepConfig | null {
  if (step < 0 || step >= TUTORIAL_STEPS.length) return null;
  return TUTORIAL_STEPS[step]!;
}

export function getLevel1SeedBoard(tutorialStep: number): Card[][] {
  if (tutorialStep >= TUTORIAL_FREE_STEP) {
    return cloneBoard(TUTORIAL_FREE_BOARD);
  }
  const cfg = getTutorialStepConfig(tutorialStep);
  return cfg ? cloneBoard(cfg.board) : cloneBoard(TUTORIAL_STEPS[0]!.board);
}

export function tutorialFreePlayMessage(): string {
  return "Great job! Keep matching hands to reach 1,000 points.";
}

export function pathMatchesGuide(
  path: { row: number; col: number }[],
  guide: { row: number; col: number }[]
): boolean {
  if (path.length !== guide.length) return false;
  const guideSet = new Set(guide.map((p) => `${p.row},${p.col}`));
  const pathSet = new Set(path.map((p) => `${p.row},${p.col}`));
  if (guideSet.size !== pathSet.size) return false;
  for (const key of guideSet) {
    if (!pathSet.has(key)) return false;
  }
  return true;
}
