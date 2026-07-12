/** Friend-challenge gem wager helpers (keep in sync with backend). */

export const WAGER_PRESETS = [1, 5, 25, 50, 100] as const;

export const WAGER_MIN = 1;
export const WAGER_MAX = 10_000;

/** Platform fee: 5% of wager, minimum 1 gem. */
export function challengeFeeGems(wager: number): number {
  if (wager < 1) return 0;
  return Math.max(1, Math.ceil(wager * 0.05));
}

export function clampWager(value: number): number {
  if (!Number.isFinite(value)) return WAGER_MIN;
  return Math.max(WAGER_MIN, Math.min(WAGER_MAX, Math.floor(value)));
}
