import type { SpecialType } from "../lib/pokerHands";

interface Props {
  type: SpecialType;
  className?: string;
}

/** Renders bomb / joker / star from the shared power-ups sprite sheet */
export function SpecialArt({ type, className }: Props) {
  return (
    <div
      className={["special-art", `special-art--${type}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    />
  );
}
