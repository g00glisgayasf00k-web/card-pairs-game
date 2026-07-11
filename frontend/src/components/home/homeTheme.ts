/** Shared home design-system types */

export type HomeGlow = "purple" | "blue" | "green";

export const HOME_GLOW_CLASS: Record<HomeGlow, string> = {
  purple: "shadow-glow-purple",
  blue: "shadow-glow-blue",
  green: "shadow-glow-green",
};

export const HOME_MODE_BG_CLASS: Record<HomeGlow, string> = {
  purple: "bg-mode-purple",
  blue: "bg-mode-blue",
  green: "bg-mode-green",
};

export const HOME_ACCENT_CLASS: Record<HomeGlow, string> = {
  purple: "bg-home-purple",
  blue: "bg-home-blue",
  green: "bg-home-green",
};
