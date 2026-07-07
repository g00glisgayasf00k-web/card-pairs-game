import { loadProgress, saveProgress, defaultProgress, type SavedProgress } from "./progress";

export const MAX_ENERGY = 12;
export const ENERGY_PER_ATTEMPT = 1;
/** Milliseconds between each +1 energy while below max. */
export const ENERGY_REGEN_MS = 120 * 60 * 1000;

/** Gems to buy a full energy refill. */
export const ENERGY_BUY_TEN_COST = 100;

/** UK calendar day key — used by video-ad daily limits in treasuryAds. */
export function ukDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(date);
}

export function applyEnergyRegen(
  energy: number,
  energyRegenAt: number,
  now = Date.now()
): { energy: number; energyRegenAt: number } {
  let e = Math.min(MAX_ENERGY, Math.max(0, Math.floor(energy)));

  if (e >= MAX_ENERGY) {
    return { energy: MAX_ENERGY, energyRegenAt: 0 };
  }

  let nextAt = energyRegenAt > 0 ? energyRegenAt : now + ENERGY_REGEN_MS;

  while (e < MAX_ENERGY && now >= nextAt) {
    e += 1;
    nextAt += ENERGY_REGEN_MS;
  }

  if (e >= MAX_ENERGY) {
    return { energy: MAX_ENERGY, energyRegenAt: 0 };
  }

  return { energy: e, energyRegenAt: nextAt };
}

export function msUntilNextEnergy(energyRegenAt: number, now = Date.now()): number {
  if (!energyRegenAt || energyRegenAt <= 0) return 0;
  return Math.max(0, energyRegenAt - now);
}

export function formatTimeUntilNextEnergy(energyRegenAt: number, now = Date.now()): string {
  const ms = msUntilNextEnergy(energyRegenAt, now);
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.ceil((ms - h * 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function withRefreshedEnergy(saved: SavedProgress): SavedProgress {
  const { energy, energyRegenAt } = applyEnergyRegen(
    saved.energy ?? MAX_ENERGY,
    saved.energyRegenAt ?? 0
  );
  return { ...saved, energy, energyRegenAt };
}

/** Load progress, apply timed regen, persist if changed. */
export function syncEnergyState(): Pick<
  SavedProgress,
  "energy" | "energyRegenAt" | "energyPaidLevel"
> {
  const base = loadProgress() ?? { ...defaultProgress(), v: 9 as const, updatedAt: Date.now() };
  const refreshed = withRefreshedEnergy(base as SavedProgress);
  if (
    refreshed.energy !== base.energy ||
    refreshed.energyRegenAt !== (base as SavedProgress).energyRegenAt
  ) {
    saveProgress(refreshed);
  }
  return {
    energy: refreshed.energy,
    energyRegenAt: refreshed.energyRegenAt,
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

  const wasFull = refreshed.energy >= MAX_ENERGY;
  const newEnergy = refreshed.energy - ENERGY_PER_ATTEMPT;
  const energyRegenAt =
    newEnergy >= MAX_ENERGY
      ? 0
      : wasFull
        ? Date.now() + ENERGY_REGEN_MS
        : refreshed.energyRegenAt;

  saveProgress({
    ...refreshed,
    energy: newEnergy,
    energyRegenAt,
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

  const newEnergy = Math.min(MAX_ENERGY, refreshed.energy + Math.floor(amount));
  saveProgress({
    ...refreshed,
    energy: newEnergy,
    energyRegenAt: newEnergy >= MAX_ENERGY ? 0 : refreshed.energyRegenAt,
  });
  return true;
}

/** Buy a full energy bar for gems. */
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
    energyRegenAt: 0,
  });
  return true;
}
