import type { SpecialType } from "../lib/pokerHands";

interface Props {
  type: SpecialType;
  className?: string;
}

const SUIT_PIPS = [
  { suit: "hearts", glyph: "♥" },
  { suit: "diamonds", glyph: "♦" },
  { suit: "clubs", glyph: "♣" },
  { suit: "spades", glyph: "♠" },
] as const;

/** Renders power-up artwork for board cells and the guide modal */
export function SpecialArt({ type, className }: Props) {
  if (type === "rainbow") {
    return (
      <div
        className={["special-art", "special-art--rainbow", "rainbow-suit", className]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      >
        <span className="rainbow-suit__card">
          {SUIT_PIPS.map(({ suit, glyph }) => (
            <span
              key={suit}
              className={`rainbow-suit__pip rainbow-suit__pip--${suit}`}
            >
              {glyph}
            </span>
          ))}
        </span>
      </div>
    );
  }

  return (
    <div
      className={["special-art", `special-art--${type}`, className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}
