import { ukDateKey } from "./energy";

const STORAGE_KEY = "royalMatchTreasuryAds";

export const GEM_VIDEO_REWARD = 25;
export const ENERGY_VIDEO_REWARD = 2;
export const MAX_GEM_VIDEO_ADS_PER_DAY = 5;
export const MAX_ENERGY_VIDEO_ADS_PER_DAY = 3;
export const VIDEO_AD_DURATION_MS = 3000;

interface TreasuryAdsState {
  ukDate: string;
  gemAdsUsed: number;
  energyAdsUsed: number;
}

function defaultState(): TreasuryAdsState {
  return { ukDate: ukDateKey(), gemAdsUsed: 0, energyAdsUsed: 0 };
}

function loadState(): TreasuryAdsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<TreasuryAdsState>;
    return {
      ukDate: typeof parsed.ukDate === "string" ? parsed.ukDate : ukDateKey(),
      gemAdsUsed: Math.max(0, Math.floor(parsed.gemAdsUsed ?? 0)),
      energyAdsUsed: Math.max(0, Math.floor(parsed.energyAdsUsed ?? 0)),
    };
  } catch {
    return defaultState();
  }
}

function saveState(state: TreasuryAdsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncDay(state: TreasuryAdsState): TreasuryAdsState {
  const today = ukDateKey();
  if (state.ukDate === today) return state;
  return { ukDate: today, gemAdsUsed: 0, energyAdsUsed: 0 };
}

function currentState(): TreasuryAdsState {
  const state = loadState();
  const synced = syncDay(state);
  if (synced.ukDate !== state.ukDate) {
    saveState(synced);
  }
  return synced;
}

export function gemVideoAdsRemaining(): number {
  const state = currentState();
  return Math.max(0, MAX_GEM_VIDEO_ADS_PER_DAY - state.gemAdsUsed);
}

export function energyVideoAdsRemaining(): number {
  const state = currentState();
  return Math.max(0, MAX_ENERGY_VIDEO_ADS_PER_DAY - state.energyAdsUsed);
}

export function recordGemVideoAd(): boolean {
  const state = currentState();
  if (state.gemAdsUsed >= MAX_GEM_VIDEO_ADS_PER_DAY) return false;
  saveState({ ...state, gemAdsUsed: state.gemAdsUsed + 1 });
  return true;
}

export function recordEnergyVideoAd(): boolean {
  const state = currentState();
  if (state.energyAdsUsed >= MAX_ENERGY_VIDEO_ADS_PER_DAY) return false;
  saveState({ ...state, energyAdsUsed: state.energyAdsUsed + 1 });
  return true;
}
