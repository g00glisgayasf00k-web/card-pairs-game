import type { Card, SpecialType, Suit } from "../lib/pokerHands";
import { SpecialArt } from "./SpecialArt";

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};

const SPECIAL_CLASS: Record<SpecialType, string> = {
  bomb:  "special-bomb",
  star:  "special-star",
  joker: "special-joker",
};

interface Props {
  card: Card;
  selected?: boolean;
  guided?: boolean;
  popping?: boolean;
}

export function PlayingCard({ card, selected, guided, popping }: Props) {
  const suit = SUIT_SYMBOL[card.suit];
  const sp   = card.special;

  return (
    <div
      className={[
        "playing-card",
        `suit-${card.suit}`,
        sp ? SPECIAL_CLASS[sp] : "",
        selected && !popping ? "selected" : "",
        guided && !popping ? "guided" : "",
        popping ? "pop" : "",
      ].filter(Boolean).join(" ")}
      aria-label={`${card.rank} of ${card.suit}${sp ? ` (${sp})` : ""}`}
    >
      <div className="card-face">
        <div className="corner corner-tl">
          <span className="c-rank">{card.rank}</span>
        </div>

        {!sp && (
          <div className="center-pip" aria-hidden>{suit}</div>
        )}

        {/* Special card — big centred icon */}
        {sp && (
          <div className="special-center" aria-hidden>
            <SpecialArt type={sp} className="special-art--card" />
          </div>
        )}
      </div>
    </div>
  );
}
