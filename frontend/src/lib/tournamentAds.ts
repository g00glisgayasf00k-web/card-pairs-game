import {
  TOURNAMENT_TIERS,
  tournamentPeriodKey,
  type TournamentReset,
} from "./tournamentTiers";

const STORAGE_KEY = "royalMatchTournamentAds";

/** Free ad entries per scoring period (matches cup reset windows). */
export const TOURNAMENT_FREE_AD_LIMITS: Record<string, number> = {
  bronze: 5,
  silver: 3,
  gold: 1,
};

interface TierAdState {
  periodKey: string;
  used: number;
}

type TournamentAdsState = Record<string, TierAdState>;

function defaultState(): TournamentAdsState {
  return {};
}

function loadState(): TournamentAdsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as TournamentAdsState;
    if (!parsed || typeof parsed !== "object") return defaultState();
    const out: TournamentAdsState = {};
    for (const [tierId, row] of Object.entries(parsed)) {
      if (!row || typeof row !== "object") continue;
      out[tierId] = {
        periodKey: typeof row.periodKey === "string" ? row.periodKey : "",
        used: Math.max(0, Math.floor(row.used ?? 0)),
      };
    }
    return out;
  } catch {
    return defaultState();
  }
}

function saveState(state: TournamentAdsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetFor(tierId: string): TournamentReset {
  return TOURNAMENT_TIERS.find((t) => t.id === tierId)?.reset ?? "daily";
}

export function maxTournamentFreeAds(tierId: string): number {
  return TOURNAMENT_FREE_AD_LIMITS[tierId] ?? 0;
}

function syncedTier(tierId: string, periodKey: string): TierAdState {
  const state = loadState();
  const row = state[tierId];
  if (row && row.periodKey === periodKey) return row;
  const fresh = { periodKey, used: 0 };
  saveState({ ...state, [tierId]: fresh });
  return fresh;
}

export function resolveTournamentPeriodKey(tierId: string, periodKeyFromApi?: string): string {
  if (periodKeyFromApi) return periodKeyFromApi;
  return tournamentPeriodKey(resetFor(tierId));
}

export function tournamentFreeAdsRemaining(tierId: string, periodKeyFromApi?: string): number {
  const max = maxTournamentFreeAds(tierId);
  if (max <= 0) return 0;
  const pk = resolveTournamentPeriodKey(tierId, periodKeyFromApi);
  const row = syncedTier(tierId, pk);
  return Math.max(0, max - row.used);
}

/** Record one free ad entry. Returns false if the period limit is already hit. */
export function recordTournamentFreeAd(tierId: string, periodKeyFromApi?: string): boolean {
  const max = maxTournamentFreeAds(tierId);
  if (max <= 0) return false;
  const pk = resolveTournamentPeriodKey(tierId, periodKeyFromApi);
  const state = loadState();
  const row = state[tierId]?.periodKey === pk ? state[tierId]! : { periodKey: pk, used: 0 };
  if (row.used >= max) return false;
  saveState({ ...state, [tierId]: { periodKey: pk, used: row.used + 1 } });
  return true;
}

export function tournamentFreeAdPeriodLabel(reset: TournamentReset): string {
  if (reset === "daily") return "today";
  if (reset === "weekly") return "this week";
  return "this month";
}
