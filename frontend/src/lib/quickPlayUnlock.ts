import { formatLevelId, toGlobalLevel } from "./levelMap";
import { loadProgress } from "./progress";

/** Solo progress required before Quick play (UI label 1-1). */
export const QUICK_PLAY_UNLOCK_DISPLAY_WORLD = 1;
export const QUICK_PLAY_UNLOCK_STAGE = 1;

export function quickPlayUnlockGlobal(): number {
  return toGlobalLevel(QUICK_PLAY_UNLOCK_DISPLAY_WORLD + 1, QUICK_PLAY_UNLOCK_STAGE);
}

export function quickPlayUnlockLabel(): string {
  return formatLevelId(quickPlayUnlockGlobal());
}

/** Cleared Solo 1-1 (or progressed past it). */
export function isQuickPlayUnlocked(): boolean {
  const saved = loadProgress();
  if (!saved) return false;
  const need = quickPlayUnlockGlobal();
  if (saved.completedLevels.includes(need)) return true;
  return saved.highestUnlocked > need;
}
