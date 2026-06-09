/** Starting balance for new players. */
export const STARTING_CREDITS = 200;

export interface MovesPack {
  id: string;
  moves: number;
  cost: number;
  label: string;
}

/** Extra move packs — offered when the player runs out of hands. */
export const MOVES_PACKS: MovesPack[] = [
  { id: "one", moves: 1, cost: 5, label: "+1 move" },
  { id: "three", moves: 3, cost: 10, label: "+3 moves" },
  { id: "five", moves: 5, cost: 15, label: "+5 moves" },
];

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

export function getMovesPack(packId: string): MovesPack | undefined {
  return MOVES_PACKS.find((p) => p.id === packId);
}

export function canAffordMovesPack(credits: number, packId: string): boolean {
  const pack = getMovesPack(packId);
  return pack != null && credits >= pack.cost;
}

export function cheapestAffordableMovesPack(credits: number): MovesPack | null {
  for (const pack of MOVES_PACKS) {
    if (credits >= pack.cost) return pack;
  }
  return null;
}

export function grantGemPack(packId: string): number {
  const pack = GEM_SHOP_PACKS.find((p) => p.id === packId);
  return pack?.gems ?? 0;
}
