import type { SpecialType } from "../lib/pokerHands";

interface Props {
  type: SpecialType;
  className?: string;
}

/** Power-up art from the concept sheet (in-game + Powers tab). */
const POWER_ART: Record<SpecialType, string> = {
  arrow_h: "/assets/pixellab/power-arrow-h.png",
  arrow_v: "/assets/pixellab/power-arrow-v.png",
  bomb: "/assets/pixellab/power-bomb.png",
  joker: "/assets/pixellab/power-joker.png",
  rainbow: "/assets/pixellab/power-rainbow.png",
};

/** Renders power-up artwork for board cells and the guide modal */
export function SpecialArt({ type, className }: Props) {
  return (
    <img
      src={POWER_ART[type]}
      alt=""
      draggable={false}
      className={["special-art", `special-art--${type}`, className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}
