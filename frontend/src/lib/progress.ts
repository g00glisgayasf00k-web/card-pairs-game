import { HAND_RANK_ORDER, type HandLabel } from "./pokerHands";
import type { HandCounts } from "./levels";
import { MAX_LEVEL } from "./levels";

const STORAGE_KEY = "royalMatchProgress";
const VERSION = 4;

export interface SavedProgress {
  v: typeof VERSION;
  level: number;
  levelScore: number;
  levelHands: number;
  levelHandCounts: HandCounts;
  handsCleared: number;
  bestHand: HandLabel;
  streak: number;
  /** Beginner 1 guided lesson progress (0–3). 3 = free play on level 1. */
  tutorialStep: number;
  updatedAt: number;
}

function isHandLabel(v: unknown): v is HandLabel {
  return typeof v === "string" && v in HAND_RANK_ORDER;
}

function parseHandCounts(raw: unknown): HandCounts {
  if (!raw || typeof raw !== "object") return {};
  const out: HandCounts = {};
  for (const [key, val] of Object.entries(raw)) {
    if (isHandLabel(key) && typeof val === "number" && val > 0) {
      out[key] = Math.floor(val);
    }
  }
  return out;
}

function parseProgress(raw: string | null): SavedProgress | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedProgress> & { totalScore?: number };
    if (data.v !== VERSION && data.v !== 3 && data.v !== 2 && data.v !== 1) return null;
    if (typeof data.level !== "number" || data.level < 1 || data.level > MAX_LEVEL) return null;
    if (typeof data.levelScore !== "number" || data.levelScore < 0) return null;
    if (typeof data.levelHands !== "number" || data.levelHands < 0) return null;
    if (typeof data.handsCleared !== "number" || data.handsCleared < 0) return null;
    if (!isHandLabel(data.bestHand)) return null;
    if (typeof data.streak !== "number" || data.streak < 0) return null;
    const tutorialStep =
      typeof data.tutorialStep === "number"
        ? Math.min(3, Math.max(0, Math.floor(data.tutorialStep)))
        : data.level === 1 && (data.levelScore ?? 0) > 0
          ? 3
          : 0;
    return {
      v: VERSION,
      level: Math.floor(data.level),
      levelScore: Math.floor(data.levelScore),
      levelHands: Math.floor(data.levelHands),
      levelHandCounts: parseHandCounts(data.levelHandCounts),
      handsCleared: Math.floor(data.handsCleared),
      bestHand: data.bestHand,
      streak: Math.floor(data.streak),
      tutorialStep,
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
    levelHandCounts: {},
    handsCleared: 0,
    bestHand: "pair",
    streak: 0,
    tutorialStep: 0,
  };
}
