import { toGlobalLevel } from "./levelMap";
import { getLevelConfig, type LevelConfig } from "./levels";
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
  /** Inclusive display-world range for random boards. */
  boardDisplayWorld: number;
  boardStageFrom: number;
  boardStageTo: number;
}

export const TOURNAMENT_TIERS: TournamentTier[] = [
  {
    id: "bronze",
    name: "Bronze Cup",
    unlockDisplayWorld: 0,
    unlockStage: 10,
    entryGems: 10,
    rewardPool: 500,
    boardDisplayWorld: 0,
    boardStageFrom: 1,
    boardStageTo: 10,
  },
  {
    id: "silver",
    name: "Silver Cup",
    unlockDisplayWorld: 2,
    unlockStage: 10,
    entryGems: 50,
    rewardPool: 2500,
    boardDisplayWorld: 2,
    boardStageFrom: 1,
    boardStageTo: 10,
  },
  {
    id: "gold",
    name: "Gold Cup",
    unlockDisplayWorld: 4,
    unlockStage: 10,
    entryGems: 250,
    rewardPool: 12_500,
    boardDisplayWorld: 4,
    boardStageFrom: 1,
    boardStageTo: 10,
  },
];

/** Top-3 split of the prize pool. */
export const TOURNAMENT_PAYOUT = [
  { place: 1, share: 0.5, label: "1st" },
  { place: 2, share: 0.3, label: "2nd" },
  { place: 3, share: 0.2, label: "3rd" },
] as const;

export interface TournamentBoardPick {
  tierId: string;
  tierName: string;
  level: number;
  boardSeed: number;
  entryGems: number;
  rewardPool: number;
  cfg: LevelConfig;
}

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

export function tierBoardGlobalLevels(tier: TournamentTier): number[] {
  const world = tier.boardDisplayWorld + 1;
  const levels: number[] = [];
  for (let stage = tier.boardStageFrom; stage <= tier.boardStageTo; stage++) {
    levels.push(toGlobalLevel(world, stage));
  }
  return levels;
}

/** Pick a random campaign board from the cup’s range (goals come from that level). */
export function pickTournamentBoard(tier: TournamentTier): TournamentBoardPick {
  const levels = tierBoardGlobalLevels(tier);
  const level = levels[Math.floor(Math.random() * levels.length)] ?? levels[0]!;
  const boardSeed = (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
  const base = getLevelConfig(level);
  return {
    tierId: tier.id,
    tierName: tier.name,
    level,
    boardSeed,
    entryGems: tier.entryGems,
    rewardPool: tier.rewardPool,
    cfg: {
      ...base,
      tier: tier.name,
      label: "Tournament",
    },
  };
}

/** Rank key: fewer hands wins; if tied, closer to the point target wins. */
export function tournamentRankKey(hands: number, score: number, targetPoints: number): [number, number] {
  return [hands, Math.abs(score - targetPoints)];
}

export function compareTournamentResults(
  a: { hands: number; score: number },
  b: { hands: number; score: number },
  targetPoints: number
): number {
  const [ah, ap] = tournamentRankKey(a.hands, a.score, targetPoints);
  const [bh, bp] = tournamentRankKey(b.hands, b.score, targetPoints);
  if (ah !== bh) return ah - bh;
  return ap - bp;
}
