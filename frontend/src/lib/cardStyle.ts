import { loadProgress, saveProgress } from "./progress";

export type CardSuitStyle = "classic" | "four_color";

/** Gem cost to unlock the four-color deck cosmetic (♥♦ red/blue/green/black). */
export const FOUR_COLOR_DECK_COST = 150;

const DOC_CLASS = "deck-four-color";

export function getCardSuitStyle(): CardSuitStyle {
  const saved = loadProgress();
  if (!saved?.fourColorDeckOwned) return "classic";
  return saved.cardSuitStyle === "four_color" ? "four_color" : "classic";
}

export function applyCardSuitStyleToDocument(style?: CardSuitStyle): void {
  const active = style ?? getCardSuitStyle();
  document.documentElement.classList.toggle(DOC_CLASS, active === "four_color");
}

/** Spend gems to unlock four-color suits. Auto-equips on purchase. */
export function buyFourColorDeck(): boolean {
  const saved = loadProgress();
  if (!saved) return false;
  if (saved.fourColorDeckOwned) return false;
  if (saved.credits < FOUR_COLOR_DECK_COST) return false;

  saveProgress({
    ...saved,
    credits: saved.credits - FOUR_COLOR_DECK_COST,
    fourColorDeckOwned: true,
    cardSuitStyle: "four_color",
  });
  applyCardSuitStyleToDocument("four_color");
  return true;
}

/** Toggle equip for players who already own the cosmetic. */
export function setCardSuitStyle(style: CardSuitStyle): boolean {
  const saved = loadProgress();
  if (!saved) return false;
  if (style === "four_color" && !saved.fourColorDeckOwned) return false;

  saveProgress({
    ...saved,
    cardSuitStyle: style,
  });
  applyCardSuitStyleToDocument(style);
  return true;
}
