import type { SpecialType } from "../lib/pokerHands";

interface Props {
  type: SpecialType;
  className?: string;
}

/** Renders power-up artwork for board cells and the guide modal */
export function SpecialArt({ type, className }: Props) {
  return (
    <div
      className={["special-art", `special-art--${type}`, className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}
