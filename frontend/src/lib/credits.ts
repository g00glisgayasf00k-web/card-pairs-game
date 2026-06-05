/** Starting balance for new players. */
export const STARTING_CREDITS = 200;

/** Extra hands granted per purchase. */
export const MOVES_PACK_SIZE = 5;

/** Credit cost for one move pack. */
export const MOVES_PACK_COST = 60;

export function canAffordMovesPack(credits: number): boolean {
  return credits >= MOVES_PACK_COST;
}

export function movesPackLabel(): string {
  return `+${MOVES_PACK_SIZE} moves (${MOVES_PACK_COST} 💎)`;
}
