import { toGlobalLevel } from "./levelMap";
import { loadProgress } from "./progress";

/** UI world ids are 0-based (0-10 = first world’s final stage). */
export interface TournamentTier {
  id: string;
  name: string;
  /** Display world number (0-based) required cleared through this stage. */
  unlockDisplayWorld: number;
  unlockStage: number;
  entryGems: number;
  /** Total gem pool paid to top 3 (50% / 30% / 20%). */
  rewardPool: number;
}

export const TOURNAMENT_TIERS: TournamentTier[] = [
  {
    id: "bronze",
    name: "Bronze Cup",
    unlockDisplayWorld: 0,
    unlockStage: 10,
    entryGems: 10,
    rewardPool: 500,
  },
  {
    id: "silver",
    name: "Silver Cup",
    unlockDisplayWorld: 2,
    unlockStage: 10,
    entryGems: 50,
    rewardPool: 2500,
  },
  {
    id: "gold",
    name: "Gold Cup",
    unlockDisplayWorld: 4,
    unlockStage: 10,
    entryGems: 250,
    rewardPool: 12_500,
  },
];

/** Top-3 split of the prize pool. */
export const TOURNAMENT_PAYOUT = [
  { place: 1, share: 0.5, label: "1st" },
  { place: 2, share: 0.3, label: "2nd" },
  { place: 3, share: 0.2, label: "3rd" },
] as const;

export function unlockGlobalLevel(tier: TournamentTier): number {
  return toGlobalLevel(tier.unlockDisplayWorld + 1, tier.unlockStage);
}

export function unlockLabel(tier: TournamentTier): string {
  return `${tier.unlockDisplayWorld}-${tier.unlockStage}`;
}

export function payoutAmounts(pool: number): { place: number; label: string; gems: number }[] {
  return TOURNAMENT_PAYOUT.map((p) => ({
    place: p.place,
    label: p.label,
    gems: Math.round(pool * p.share),
  }));
}

export function isTournamentUnlocked(tier: TournamentTier): boolean {
  const saved = loadProgress();
  if (!saved) return false;
  const need = unlockGlobalLevel(tier);
  if (saved.completedLevels.includes(need)) return true;
  return saved.highestUnlocked > need;
}
