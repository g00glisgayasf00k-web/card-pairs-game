import { loadProgress, saveProgress, defaultProgress, type SavedProgress } from "./progress";

export const MAX_ENERGY = 10;
export const ENERGY_PER_ATTEMPT = 1;

/** Gems to buy a full energy refill (10 ⚡). */
export const ENERGY_BUY_TEN_COST = 100;

/** UK calendar day key for midnight refresh (YYYY-MM-DD). */
export function ukDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(date);
}

export function applyDailyEnergyRefresh(
  energy: number,
  energyUkDate: string | undefined
): { energy: number; energyUkDate: string } {
  const today = ukDateKey();
  if (!energyUkDate || energyUkDate !== today) {
    return { energy: MAX_ENERGY, energyUkDate: today };
  }
  return {
    energy: Math.min(MAX_ENERGY, Math.max(0, Math.floor(energy))),
    energyUkDate: today,
  };
}

export function msUntilUkMidnight(from = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(from);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const h = get("hour");
  const m = get("minute");
  const s = get("second");
  const elapsed = (h * 3600 + m * 60 + s) * 1000;
  return 86_400_000 - elapsed;
}

export function formatTimeUntilUkMidnight(from = new Date()): string {
  let ms = msUntilUkMidnight(from);
  const h = Math.floor(ms / 3_600_000);
  ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000);
  return `${h}h ${m}m`;
}

function withRefreshedEnergy(saved: SavedProgress): SavedProgress {
  const { energy, energyUkDate } = applyDailyEnergyRefresh(
    saved.energy ?? MAX_ENERGY,
    saved.energyUkDate
  );
  return { ...saved, energy, energyUkDate };
}

/** Load progress, apply UK midnight refresh, persist if changed. */
export function syncEnergyState(): Pick<SavedProgress, "energy" | "energyUkDate" | "energyPaidLevel"> {
  const base = loadProgress() ?? { ...defaultProgress(), v: 8 as const, updatedAt: Date.now() };
  const refreshed = withRefreshedEnergy(base as SavedProgress);
  if (
    refreshed.energy !== base.energy ||
    refreshed.energyUkDate !== (base as SavedProgress).energyUkDate
  ) {
    saveProgress(refreshed);
  }
  return {
    energy: refreshed.energy,
    energyUkDate: refreshed.energyUkDate,
    energyPaidLevel: refreshed.energyPaidLevel ?? null,
  };
}

export function hasEnergy(amount = ENERGY_PER_ATTEMPT): boolean {
  return syncEnergyState().energy >= amount;
}

export function clearEnergyPaidLevel(): void {
  const saved = loadProgress();
  if (!saved || saved.energyPaidLevel == null) return;
  saveProgress({ ...saved, energyPaidLevel: null });
}

/** Spend 1 energy to start (or continue) an attempt on this level. Idempotent per level. */
export function trySpendEnergyForLevel(globalLevel: number): boolean {
  const saved = loadProgress() ?? defaultProgress();
  const refreshed = withRefreshedEnergy(saved as SavedProgress);

  if (refreshed.energyPaidLevel === globalLevel) {
    saveProgress({ ...refreshed, energyPaidLevel: globalLevel });
    return true;
  }

  if (refreshed.energy < ENERGY_PER_ATTEMPT) {
    saveProgress({ ...refreshed, energyPaidLevel: refreshed.energyPaidLevel ?? null });
    return false;
  }

  saveProgress({
    ...refreshed,
    energy: refreshed.energy - ENERGY_PER_ATTEMPT,
    energyPaidLevel: globalLevel,
  });
  return true;
}

/** New attempt after restart — pay energy again. */
export function trySpendEnergyForRetry(globalLevel: number): boolean {
  clearEnergyPaidLevel();
  return trySpendEnergyForLevel(globalLevel);
}

/** Grant energy from a rewarded video (capped at MAX_ENERGY). */
export function grantEnergyFromVideo(amount: number): boolean {
  const saved = loadProgress();
  if (!saved || amount <= 0) return false;
  const refreshed = withRefreshedEnergy(saved);
  if (refreshed.energy >= MAX_ENERGY) return false;

  saveProgress({
    ...refreshed,
    energy: Math.min(MAX_ENERGY, refreshed.energy + Math.floor(amount)),
  });
  return true;
}

/** Buy a full energy bar (10 ⚡) for 100 gems. */
export function buyTenEnergy(): boolean {
  const saved = loadProgress();
  if (!saved) return false;
  const refreshed = withRefreshedEnergy(saved);
  if (refreshed.energy >= MAX_ENERGY) return false;
  if (refreshed.credits < ENERGY_BUY_TEN_COST) return false;

  saveProgress({
    ...refreshed,
    credits: refreshed.credits - ENERGY_BUY_TEN_COST,
    energy: MAX_ENERGY,
  });
  return true;
}
