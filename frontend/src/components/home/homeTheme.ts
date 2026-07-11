/** Shared home color palette — exact design-system values */

export const HOME_COLORS = {
  bgBase: "#061A17",
  bgTop: "#0D2B22",
  bgBottom: "#04110F",

  gold: "#FFD700",
  goldHighlight: "#FFF3B0",
  goldDeep: "#C99A2E",

  purple: "#6C2BD9",
  purpleDark: "#3B0E91",

  blue: "#0D47A1",
  blueDark: "#072A66",

  green: "#1B5E20",
  greenDark: "#0F3A13",

  glass: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.08)",

  textPrimary: "#FFFFFF",
  textSecondary: "#A8B5B2",

  suitSpade: "#1B1B1B",
  suitHeart: "#E63946",
  suitClub: "#2ECC71",
  suitDiamond: "#2962FF",
} as const;

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

export const HOME_ACCENT_HEX: Record<HomeGlow, string> = {
  purple: HOME_COLORS.purple,
  blue: HOME_COLORS.blue,
  green: HOME_COLORS.green,
};
