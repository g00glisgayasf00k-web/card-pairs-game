/** Starting balance for new players. */
export const STARTING_CREDITS = 200;

/** Extra hands granted per purchase. */
export const MOVES_PACK_SIZE = 5;

/** Credit cost for one move pack. */
export const MOVES_PACK_COST = 60;

export interface GemPack {
  id: string;
  gems: number;
  label: string;
  priceLabel: string;
}

/** Display-only prices — grants gems instantly (hook up IAP later). */
export const GEM_SHOP_PACKS: GemPack[] = [
  { id: "handful", gems: 100, label: "Handful", priceLabel: "$0.99" },
  { id: "pouch", gems: 300, label: "Pouch", priceLabel: "$2.79" },
  { id: "vault", gems: 500, label: "Vault", priceLabel: "$4.49" },
  { id: "treasure", gems: 1000, label: "Treasure", priceLabel: "$8.99" },
];

export function canAffordMovesPack(credits: number): boolean {
  return credits >= MOVES_PACK_COST;
}

export function movesPackLabel(): string {
  return `+${MOVES_PACK_SIZE} moves (${MOVES_PACK_COST} 💎)`;
}

export function grantGemPack(packId: string): number {
  const pack = GEM_SHOP_PACKS.find((p) => p.id === packId);
  return pack?.gems ?? 0;
}
