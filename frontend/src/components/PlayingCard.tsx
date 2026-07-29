import type { Card, SpecialType, Suit } from "../lib/pokerHands";
import { isBlocked, type Blocker } from "../lib/blockers";
import { SpecialArt } from "./SpecialArt";

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};

const SPECIAL_CLASS: Record<SpecialType, string> = {
  arrow_h: "special-arrow-h",
  arrow_v: "special-arrow-v",
  bomb: "special-bomb",
  joker: "special-joker",
  rainbow: "special-rainbow",
};

interface Props {
  card: Card;
  blocker?: Blocker | null;
  selected?: boolean;
  guided?: boolean;
  hinted?: boolean;
  popping?: boolean;
}

export function PlayingCard({ card, blocker, selected, guided, hinted, popping }: Props) {
  const suit = SUIT_SYMBOL[card.suit];
  const sp   = card.special;
  const isArrowOnly = sp === "arrow_h" || sp === "arrow_v";

  if (isArrowOnly) {
    return (
      <div
        className={[
          "playing-card",
          "arrow-power",
          SPECIAL_CLASS[sp],
          selected && !popping ? "selected" : "",
          guided && !popping && !hinted ? "guided" : "",
          hinted && !popping ? "hinted" : "",
          popping ? "pop" : "",
        ].filter(Boolean).join(" ")}
        aria-label={sp === "arrow_h" ? "Row arrow — tap to clear row" : "Column arrow — tap to clear column"}
      >
        <SpecialArt type={sp} className="special-art--arrow" />

        {blocker && isBlocked(blocker) && (
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
              {blocker.kind === "glass" ? "🧊" : blocker.kind === "crate" ? "📦" : "🪨"}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        "playing-card",
        `suit-${card.suit}`,
        sp ? SPECIAL_CLASS[sp] : "",
        selected && !popping ? "selected" : "",
        guided && !popping && !hinted ? "guided" : "",
        hinted && !popping ? "hinted" : "",
        popping ? "pop" : "",
      ].filter(Boolean).join(" ")}
      aria-label={`${card.rank} of ${card.suit}${sp ? ` (${sp})` : ""}`}
    >
      <div className="card-face">
        <div className="corner corner-tl">
          {sp !== "rainbow" && <span className="c-rank">{card.rank}</span>}
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

      {blocker && isBlocked(blocker) && (
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
            {blocker.kind === "glass" ? "🧊" : blocker.kind === "crate" ? "📦" : "🪨"}
          </span>
        </div>
      )}
    </div>
  );
}
