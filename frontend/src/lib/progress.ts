import { HAND_RANK_ORDER, type HandLabel } from "./pokerHands";
import { MAX_LEVEL } from "./levels";

const STORAGE_KEY = "royalMatchProgress";
const VERSION = 2;

export interface SavedProgress {
  v: typeof VERSION;
  level: number;
  levelScore: number;
  levelHands: number;
  handsCleared: number;
  bestHand: HandLabel;
  streak: number;
  updatedAt: number;
}

function isHandLabel(v: unknown): v is HandLabel {
  return typeof v === "string" && v in HAND_RANK_ORDER;
}

function parseProgress(raw: string | null): SavedProgress | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedProgress> & { totalScore?: number };
    if (data.v !== VERSION && data.v !== 1) return null;
    if (typeof data.level !== "number" || data.level < 1 || data.level > MAX_LEVEL) return null;
    if (typeof data.levelScore !== "number" || data.levelScore < 0) return null;
    if (typeof data.levelHands !== "number" || data.levelHands < 0) return null;
    if (typeof data.handsCleared !== "number" || data.handsCleared < 0) return null;
    if (!isHandLabel(data.bestHand)) return null;
    if (typeof data.streak !== "number" || data.streak < 0) return null;
    return {
      v: VERSION,
      level: Math.floor(data.level),
      levelScore: Math.floor(data.levelScore),
      levelHands: Math.floor(data.levelHands),
      handsCleared: Math.floor(data.handsCleared),
      bestHand: data.bestHand,
      streak: Math.floor(data.streak),
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function loadProgress(): SavedProgress | null {
  return parseProgress(localStorage.getItem(STORAGE_KEY));
}

export function saveProgress(data: Omit<SavedProgress, "v" | "updatedAt">): void {
  const payload: SavedProgress = {
    v: VERSION,
    ...data,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function defaultProgress(): Omit<SavedProgress, "v" | "updatedAt"> {
  return {
    level: 1,
    levelScore: 0,
    levelHands: 0,
    handsCleared: 0,
    bestHand: "pair",
    streak: 0,
  };
}
