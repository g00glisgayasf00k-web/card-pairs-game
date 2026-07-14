import { toGlobalLevel } from "./levelMap";
import type { LevelConfig } from "./levels";
import { loadProgress } from "./progress";
import { generateScoreRaceMission, scoreRaceLevelConfig, tournamentHandLimit } from "./scoreRaceMission";

/** UI world ids are 0-based (0-10 = first world’s final stage). */
export type TournamentReset = "daily" | "weekly" | "monthly";

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
  /** Scoring window — resets at UK midnight. */
  reset: TournamentReset;
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
    reset: "daily",
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
    reset: "weekly",
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
    reset: "monthly",
  },
];

const LONDON_TZ = "Europe/London";

/** London calendar parts for period math (matches backend tournament_periods). */
function londonParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

/** Instant of a London wall-clock YYYY-MM-DD 00:00. */
function londonMidnightUtcMs(year: number, month: number, day: number): number {
  // Approximate via iterative format — enough for countdown UI.
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let t = guess;
  for (let i = 0; i < 6; i++) {
    const bits = fmt.formatToParts(new Date(t));
    const g = (type: string) => Number(bits.find((p) => p.type === type)?.value ?? 0);
    const y = g("year");
    const m = g("month");
    const d = g("day");
    const h = g("hour");
    const mi = g("minute");
    const target = Date.UTC(year, month - 1, day);
    const have = Date.UTC(y, m - 1, d);
    const dayDeltaMs = target - have;
    const clockDeltaMs = (h * 60 + mi) * 60_000;
    const next = t + dayDeltaMs - clockDeltaMs;
    if (Math.abs(next - t) < 1000) return next;
    t = next;
  }
  return t;
}

export function tournamentPeriodEndsAt(reset: TournamentReset, now = new Date()): Date {
  const { year, month, day, weekday } = londonParts(now);
  if (reset === "daily") {
    const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
    return new Date(
      londonMidnightUtcMs(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate())
    );
  }
  if (reset === "weekly") {
    const daysUntilNextMonday = 7 - weekday; // Mon→7 … Sun→1
    const next = new Date(Date.UTC(year, month - 1, day + daysUntilNextMonday));
    let ends = new Date(
      londonMidnightUtcMs(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
    );
    if (ends.getTime() <= now.getTime()) {
      const later = new Date(Date.UTC(year, month - 1, day + daysUntilNextMonday + 7));
      ends = new Date(
        londonMidnightUtcMs(later.getUTCFullYear(), later.getUTCMonth() + 1, later.getUTCDate())
      );
    }
    return ends;
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return new Date(londonMidnightUtcMs(nextYear, nextMonth, 1));
}

/** Matches backend `period_key` (London calendar / ISO week). */
export function tournamentPeriodKey(reset: TournamentReset, now = new Date()): string {
  const { year, month, day } = londonParts(now);
  if (reset === "daily") {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (reset === "monthly") {
    return `${year}-${String(month).padStart(2, "0")}`;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dow = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dow);
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function formatTournamentResetCountdown(endsAt: Date, now = new Date()): string {
  const ms = Math.max(0, endsAt.getTime() - now.getTime());
  if (ms <= 0) return "soon";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(1, mins)}m`;
}

export function tournamentResetLabel(reset: TournamentReset): string {
  if (reset === "daily") return "Daily · resets UK midnight";
  if (reset === "weekly") return "Weekly · resets Monday UK midnight";
  return "Monthly · resets 1st UK midnight";
}

/** Human label for a stored period_key. */
export function formatTournamentPeriodLabel(
  periodKey: string,
  reset: TournamentReset
): string {
  const key = periodKey.trim();
  if (!key || key === "legacy") return "Earlier results";
  if (reset === "weekly" || /^(\d{4})-W(\d{2})$/.test(key)) {
    const m = key.match(/^(\d{4})-W(\d{2})$/);
    if (m) return `Week ${Number(m[2])} · ${m[1]}`;
  }
  if (reset === "monthly" || /^\d{4}-\d{2}$/.test(key)) {
    const m = key.match(/^(\d{4})-(\d{2})$/);
    if (m) {
      const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
      return d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const [y, mo, da] = key.split("-").map(Number);
    const d = new Date(Date.UTC(y!, mo! - 1, da!));
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return key;
}

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

/** Pick a score-race board for the cup (hands vary by cup, 3–5 goals, ×10 goal payout). */
export function pickTournamentBoard(tier: TournamentTier): TournamentBoardPick {
  const levels = tierBoardGlobalLevels(tier);
  const level = levels[Math.floor(Math.random() * levels.length)] ?? levels[0]!;
  const boardSeed = (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
  const handLimit = tournamentHandLimit(tier.id);
  const mission = generateScoreRaceMission(boardSeed, handLimit);
  const cfg = scoreRaceLevelConfig(mission, {
    tier: tier.name,
    label: "Tournament",
    level,
  });
  return {
    tierId: tier.id,
    tierName: tier.name,
    level,
    boardSeed,
    entryGems: tier.entryGems,
    rewardPool: tier.rewardPool,
    cfg,
  };
}

/** Rank key: higher score wins; if tied, faster duration wins. */
export function tournamentRankKey(
  score: number,
  durationMs: number | null | undefined
): [number, number] {
  const d = durationMs != null && durationMs > 0 ? durationMs : 10 ** 12;
  return [-Math.floor(score), d];
}

export function compareTournamentResults(
  a: { score: number; durationMs?: number | null },
  b: { score: number; durationMs?: number | null }
): number {
  const [as, ad] = tournamentRankKey(a.score, a.durationMs);
  const [bs, bd] = tournamentRankKey(b.score, b.durationMs);
  if (as !== bs) return as - bs;
  return ad - bd;
}
