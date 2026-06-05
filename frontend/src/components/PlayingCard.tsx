import type { Card, SpecialType, Suit } from "../lib/pokerHands";
import type { Blocker } from "../lib/blockers";
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
  blocker?: Blocker | null;
  selected?: boolean;
  guided?: boolean;
  popping?: boolean;
}

export function PlayingCard({ card, blocker, selected, guided, popping }: Props) {
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

      {blocker && blocker.hp > 0 && (
        <div
          className={[
            "blocker-overlay",
            `blocker-overlay--${blocker.kind}`,
            blocker.kind === "crate" && blocker.hp === 1 ? "blocker-overlay--damaged" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
        >
          <span className="blocker-overlay__icon">
            {blocker.kind === "glass" ? "🧊" : "📦"}
          </span>
        </div>
      )}
    </div>
  );
}
