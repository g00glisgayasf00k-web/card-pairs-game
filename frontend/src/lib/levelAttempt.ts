import { shouldResumeSavedRun } from "./levelProgress";
import { loadProgress } from "./progress";
import { hasEnergy, trySpendEnergyForLevel } from "./energy";

/** Whether starting this level costs energy (false when resuming mid-level). */
export function levelAttemptCostsEnergy(globalLevel: number): boolean {
  const saved = loadProgress();
  return !shouldResumeSavedRun(globalLevel, saved);
}

/** Check the player can start; spend energy unless resuming. Returns false if out of energy. */
export function beginLevelAttempt(globalLevel: number): boolean {
  if (!levelAttemptCostsEnergy(globalLevel)) return true;
  return trySpendEnergyForLevel(globalLevel);
}

export function canBeginLevelAttempt(globalLevel: number): boolean {
  if (!levelAttemptCostsEnergy(globalLevel)) return true;
  return hasEnergy();
}
