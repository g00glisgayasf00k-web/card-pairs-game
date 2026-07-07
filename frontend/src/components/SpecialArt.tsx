import type { SpecialType } from "../lib/pokerHands";

interface Props {
  type: SpecialType;
  className?: string;
}

const GLYPH: Record<SpecialType, string> = {
  arrow_h: "↔",
  arrow_v: "↕",
  bomb: "💣",
  joker: "🃏",
  rainbow: "♠♥♦♣",
};

/** Renders power-up artwork for board cells and the guide modal */
export function SpecialArt({ type, className }: Props) {
  const useSprite =
    type === "bomb" || type === "joker" || type === "arrow_h" || type === "arrow_v";

  if (useSprite) {
    return (
      <div
        className={["special-art", `special-art--${type}`, className].filter(Boolean).join(" ")}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={["special-glyph", `special-glyph--${type}`, className].filter(Boolean).join(" ")}
      aria-hidden
    >
      {GLYPH[type]}
    </span>
  );
}
