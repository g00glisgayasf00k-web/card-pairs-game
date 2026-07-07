import { HAND_RANK_ORDER, type HandLabel } from "./pokerHands";
import type { HandCounts } from "./levels";
import { MAX_LEVEL } from "./levels";
import { STARTING_CREDITS } from "./credits";
import { MAX_ENERGY, applyDailyEnergyRefresh, ukDateKey } from "./energy";

const STORAGE_KEY = "royalMatchProgress";
const PROGRESS_USER_KEY = "royalMatchProgressUser";
const VERSION = 8;

type ProgressSyncHook = (payload: SavedProgress) => void;
let progressSyncHook: ProgressSyncHook | null = null;

export function setProgressSyncHook(hook: ProgressSyncHook | null): void {
  progressSyncHook = hook;
}

export interface SavedProgress {
  v: typeof VERSION;
  /** Furthest level the player may start (1–100). */
  highestUnlocked: number;
  /** Global levels cleared at least once. */
  completedLevels: number[];
  /** Best star rating (1–3) per global level. */
  levelStars: Record<number, number>;
  level: number;
  levelScore: number;
  levelHands: number;
  levelHandCounts: HandCounts;
  /** Lifetime hands cleared by type — synced for leaderboards. */
  lifetimeHandCounts: HandCounts;
  handsCleared: number;
  bestHand: HandLabel;
  /** In-game currency for buying extra moves. */
  credits: number;
  /** Play attempts remaining today (max 10, refreshes UK midnight). */
  energy: number;
  /** Last UK date energy was synced (YYYY-MM-DD). */
  energyUkDate: string;
  /** Level we already spent energy to enter this attempt. */
  energyPaidLevel: number | null;
  /** @deprecated Combo removed — kept for save migration. */
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

function parseCompletedLevels(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const n of raw) {
    if (typeof n === "number" && n >= 1 && n <= MAX_LEVEL) {
      out.push(Math.floor(n));
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

function parseLevelStars(raw: unknown, completedLevels: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  if (raw && typeof raw === "object") {
    for (const [key, val] of Object.entries(raw)) {
      const level = Math.floor(Number(key));
      if (level >= 1 && level <= MAX_LEVEL && typeof val === "number" && val >= 1 && val <= 3) {
        out[level] = Math.floor(val);
      }
    }
  }
  for (const n of completedLevels) {
    if (out[n] === undefined) out[n] = 3;
  }
  return out;
}

function migrateFromLegacy(data: Partial<SavedProgress> & { v?: number }): {
  highestUnlocked: number;
  completedLevels: number[];
} {
  const frontier = Math.min(
    MAX_LEVEL,
    Math.max(1, Math.floor(typeof data.level === "number" ? data.level : 1))
  );
  const completed: number[] = [];
  for (let i = 1; i < frontier; i++) {
    completed.push(i);
  }
  return { highestUnlocked: frontier, completedLevels: completed };
}

function parseProgress(raw: string | null): SavedProgress | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedProgress> & { totalScore?: number; v?: number };
    if (data.v !== VERSION && data.v !== 7 && data.v !== 6 && data.v !== 5 && data.v !== 4 && data.v !== 3 && data.v !== 2 && data.v !== 1) {
      return null;
    }
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

    let highestUnlocked: number;
    let completedLevels: number[];

    if (data.v === VERSION && typeof data.highestUnlocked === "number") {
      highestUnlocked = Math.min(MAX_LEVEL, Math.max(1, Math.floor(data.highestUnlocked)));
      completedLevels = parseCompletedLevels(data.completedLevels);
    } else {
      ({ highestUnlocked, completedLevels } = migrateFromLegacy(data));
    }

    const levelStars = parseLevelStars(data.levelStars, completedLevels);

    const credits =
      typeof data.credits === "number"
        ? Math.max(0, Math.floor(data.credits))
        : STARTING_CREDITS;

    const energyRaw =
      typeof data.energy === "number" ? Math.max(0, Math.floor(data.energy)) : MAX_ENERGY;
    const energyUkDate =
      typeof data.energyUkDate === "string" ? data.energyUkDate : ukDateKey();
    const { energy, energyUkDate: syncedDate } = applyDailyEnergyRefresh(energyRaw, energyUkDate);
    const energyPaidLevel =
      typeof data.energyPaidLevel === "number" ? Math.floor(data.energyPaidLevel) : null;

    return {
      v: VERSION,
      highestUnlocked,
      completedLevels,
      levelStars,
      level: Math.floor(data.level),
      levelScore: Math.floor(data.levelScore),
      levelHands: Math.floor(data.levelHands),
      levelHandCounts: parseHandCounts(data.levelHandCounts),
      lifetimeHandCounts: parseHandCounts(data.lifetimeHandCounts),
      handsCleared: Math.floor(data.handsCleared),
      bestHand: data.bestHand,
      credits,
      energy,
      energyUkDate: syncedDate,
      energyPaidLevel,
      streak: 0,
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

export function importProgress(data: unknown): SavedProgress | null {
  if (data == null) return null;
  try {
    return parseProgress(JSON.stringify(data));
  } catch {
    return null;
  }
}

export function saveProgress(
  data: Omit<SavedProgress, "v" | "updatedAt">,
  options?: { skipSync?: boolean }
): void {
  const payload: SavedProgress = {
    v: VERSION,
    ...data,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (!options?.skipSync) {
    progressSyncHook?.(payload);
  }
}

export function applyImportedProgress(data: unknown): boolean {
  const parsed = importProgress(data);
  if (!parsed) return false;
  saveProgress(parsed, { skipSync: true });
  return true;
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROGRESS_USER_KEY);
}

/** Username that last wrote local progress — used to detect account switches. */
export function getProgressOwner(): string | null {
  return localStorage.getItem(PROGRESS_USER_KEY);
}

export function setProgressOwner(username: string): void {
  localStorage.setItem(PROGRESS_USER_KEY, username);
}

export function defaultProgress(): Omit<SavedProgress, "v" | "updatedAt"> {
  return {
    highestUnlocked: 1,
    completedLevels: [],
    levelStars: {},
    level: 1,
    levelScore: 0,
    levelHands: 0,
    levelHandCounts: {},
    lifetimeHandCounts: {},
    handsCleared: 0,
    bestHand: "pair",
    credits: STARTING_CREDITS,
    energy: MAX_ENERGY,
    energyUkDate: ukDateKey(),
    energyPaidLevel: null,
    streak: 0,
    tutorialStep: 0,
  };
}

/** True when save data is a brand-new campaign with no recorded play. */
export function isFreshAccountProgress(saved: SavedProgress): boolean {
  return (
    saved.highestUnlocked <= 1 &&
    saved.completedLevels.length === 0 &&
    saved.levelScore === 0 &&
    saved.handsCleared === 0
  );
}
