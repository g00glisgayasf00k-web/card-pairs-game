import { loadProgress, defaultProgress, saveProgress } from "./progress";

/** Levels 10, 20, 30… award a gem chest on first clear. */
export function isMilestoneChestLevel(level: number): boolean {
  const n = Math.floor(level);
  return n >= 10 && n % 10 === 0;
}

/**
 * Random gems from 10%–100% of the cleared level.
 * Level 10 → 1–10, level 20 → 2–20, etc.
 */
export function rollMilestoneChestGems(level: number): number {
  const max = Math.max(1, Math.floor(level));
  const min = Math.max(1, Math.floor(max * 0.1));
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function hasClaimedMilestoneChest(level: number): boolean {
  const saved = loadProgress();
  return (saved?.milestoneChestsClaimed ?? []).includes(Math.floor(level));
}

/** Persist claim + gem grant. Returns new credit balance. Idempotent per level. */
export function claimMilestoneChest(level: number, gems: number): number {
  const saved = loadProgress() ?? defaultProgress();
  const n = Math.floor(level);
  const claimed = saved.milestoneChestsClaimed ?? [];
  if (claimed.includes(n)) return saved.credits;

  const amount = Math.max(0, Math.floor(gems));
  const nextCredits = saved.credits + amount;
  saveProgress({
    ...saved,
    credits: nextCredits,
    milestoneChestsClaimed: [...claimed, n].sort((a, b) => a - b),
  });
  return nextCredits;
}
