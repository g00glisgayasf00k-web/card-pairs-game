import { MAX_LEVEL } from "./levels";
import { STAGES_PER_WORLD, toGlobalLevel, worldForLevel } from "./levelMap";
import { defaultProgress, loadProgress, saveProgress, type SavedProgress } from "./progress";
import type { LevelNodeState } from "./levelMap";

export { worldForLevel };

function countStarsInWorldFrom(
  world: number,
  levelStars: Record<number, number>
): number {
  const start = toGlobalLevel(world, 1);
  const end = start + STAGES_PER_WORLD - 1;
  let total = 0;
  for (let n = start; n <= end; n++) {
    total += levelStars[n] ?? 0;
  }
  return total;
}

/** Cap progress that crossed a world gate without enough stars in the prior world. */
function capHighestUnlockedByStarGates(
  highest: number,
  levelStars: Record<number, number>
): number {
  let capped = highest;
  for (let world = worldForLevel(capped); world >= 2; world--) {
    if (countStarsInWorldFrom(world - 1, levelStars) < starsToUnlockWorld(world)) {
      capped = Math.min(capped, toGlobalLevel(world - 1, STAGES_PER_WORLD));
    }
  }
  return capped;
}

export function getHighestUnlocked(): number {
  const saved = loadProgress();
  const highest = saved?.highestUnlocked ?? 1;
  if (!saved) return highest;
  return capHighestUnlockedByStarGates(highest, saved.levelStars);
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
  const world = worldForLevel(n);
  if (!isWorldUnlocked(world)) return "locked";
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
  const next = Math.min(MAX_LEVEL, highest + 1);
  return isLevelPlayable(next) ? next : highest;
}

export function isLevelPlayable(globalLevel: number): boolean {
  return getLevelNodeState(globalLevel) !== "locked";
}

export function markLevelComplete(globalLevel: number, stars: number): number {
  const saved = loadProgress() ?? defaultProgress();
  const n = Math.floor(globalLevel);
  if (n < 1 || n > MAX_LEVEL) return 0;

  const completed = new Set(saved.completedLevels);
  completed.add(n);
  const sorted = [...completed].sort((a, b) => a - b);
  const bestStars = Math.max(saved.levelStars[n] ?? 0, Math.min(3, Math.max(1, stars)));
  const levelStars = { ...saved.levelStars, [n]: bestStars };

  let highestUnlocked = saved.highestUnlocked;
  if (n >= saved.highestUnlocked && n < MAX_LEVEL) {
    const next = n + 1;
    const levelWorld = worldForLevel(n);
    const nextWorld = worldForLevel(next);
    const canEnterNextWorld =
      levelWorld === nextWorld ||
      countStarsInWorldFrom(levelWorld, levelStars) >= starsToUnlockWorld(nextWorld);
    highestUnlocked = canEnterNextWorld
      ? Math.max(saved.highestUnlocked, next)
      : Math.max(saved.highestUnlocked, n);
  } else if (n >= saved.highestUnlocked) {
    highestUnlocked = Math.max(saved.highestUnlocked, n);
  }

  highestUnlocked = capHighestUnlockedByStarGates(
    Math.min(MAX_LEVEL, highestUnlocked),
    levelStars
  );

  saveProgress({
    ...saved,
    completedLevels: sorted,
    levelStars,
    highestUnlocked,
    level: highestUnlocked,
    levelScore: 0,
    levelHands: 0,
    levelHandCounts: {},
    streak: 0,
    tutorialStep: highestUnlocked === 1 ? saved.tutorialStep : 3,
  });

  return bestStars;
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
    (saved.levelScore > 0 || saved.levelHands > 0)
  );
}

export function getLevelStars(globalLevel: number): number {
  const saved = loadProgress();
  if (!saved) return 0;
  return saved.levelStars[globalLevel] ?? 0;
}

export function countTotalStars(): number {
  const saved = loadProgress();
  if (!saved) return 0;
  return Object.values(saved.levelStars).reduce((sum, n) => sum + n, 0);
}

/** Stars earned in a single world (for world gate progress). */
export function countStarsInWorld(world: number): number {
  const saved = loadProgress();
  if (!saved) return 0;
  return countStarsInWorldFrom(world, saved.levelStars);
}

export function isWorldUnlocked(world: number): boolean {
  if (world <= 1) return true;
  return countStarsInWorld(world - 1) >= starsToUnlockWorld(world);
}

/** Stars needed to unlock the next world (all 10 stages in prior world). */
export function starsToUnlockWorld(world: number): number {
  return world <= 1 ? 0 : STAGES_PER_WORLD * 3;
}
