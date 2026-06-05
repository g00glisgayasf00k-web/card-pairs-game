import { MAX_LEVEL } from "./levels";
import { defaultProgress, loadProgress, saveProgress, type SavedProgress } from "./progress";
import type { LevelNodeState } from "./levelMap";

export function getHighestUnlocked(): number {
  const saved = loadProgress();
  return saved?.highestUnlocked ?? 1;
}

export function getCompletedLevels(): number[] {
  const saved = loadProgress();
  return saved?.completedLevels ?? [];
}

export function countCompleted(): number {
  return getCompletedLevels().length;
}

export function getLevelNodeState(globalLevel: number): LevelNodeState {
  const n = Math.floor(globalLevel);
  if (n < 1 || n > MAX_LEVEL) return "locked";
  const highest = getHighestUnlocked();
  const completed = new Set(getCompletedLevels());
  if (n > highest) return "locked";
  if (completed.has(n)) return "completed";
  return "unlocked";
}

/** Active level — first unlocked stage not yet completed. */
export function getCurrentLevel(): number {
  const highest = getHighestUnlocked();
  const completed = new Set(getCompletedLevels());
  if (!completed.has(highest)) return highest;
  return Math.min(MAX_LEVEL, highest + 1);
}

export function isLevelPlayable(globalLevel: number): boolean {
  return getLevelNodeState(globalLevel) !== "locked";
}

export function markLevelComplete(globalLevel: number): void {
  const saved = loadProgress() ?? defaultProgress();
  const n = Math.floor(globalLevel);
  if (n < 1 || n > MAX_LEVEL) return;

  const completed = new Set(saved.completedLevels);
  completed.add(n);
  const sorted = [...completed].sort((a, b) => a - b);
  const highestUnlocked = Math.min(MAX_LEVEL, Math.max(saved.highestUnlocked, n + 1));

  saveProgress({
    ...saved,
    completedLevels: sorted,
    highestUnlocked,
    level: highestUnlocked,
    levelScore: 0,
    levelHands: 0,
    levelHandCounts: {},
    streak: 0,
    tutorialStep: highestUnlocked === 1 ? saved.tutorialStep : 3,
  });
}

export function buildFreshRunForLevel(
  globalLevel: number,
  saved: SavedProgress | null
): Pick<
  SavedProgress,
  "level" | "levelScore" | "levelHands" | "levelHandCounts" | "streak" | "tutorialStep"
> {
  const n = Math.min(Math.max(1, Math.floor(globalLevel)), MAX_LEVEL);
  const isFirstPlayLevel1 = n === 1 && !(saved?.completedLevels.includes(1));

  return {
    level: n,
    levelScore: 0,
    levelHands: 0,
    levelHandCounts: {},
    streak: 0,
    tutorialStep: isFirstPlayLevel1 ? (saved?.tutorialStep ?? 0) : 3,
  };
}

export function shouldResumeSavedRun(globalLevel: number, saved: SavedProgress | null): boolean {
  if (!saved) return false;
  return (
    globalLevel === saved.highestUnlocked &&
    globalLevel === saved.level &&
    (saved.levelScore > 0 || saved.levelHands > 0 || saved.streak > 0)
  );
}
