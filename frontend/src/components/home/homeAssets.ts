/** Public asset paths for the home screen redesign */

export const HOME_ASSETS = {
  background: {
    main: "/assets/background/bg_main.png",
  },
  hero: {
    panelBg: "/assets/hero/panel_hero_bg.png",
    cardsHand: "/assets/hero/cards_hand.png",
    chipsStack: "/assets/hero/chips_stack.png",
    particlesGold: "/assets/hero/particles_gold.png",
  },
  cards: {
    purple: {
      base: "/assets/cards/purple/card_base.png",
      glow: "/assets/cards/purple/card_glow.png",
      icon: "/assets/cards/purple/icon_trophy.svg",
    },
    blue: {
      base: "/assets/cards/blue/card_base.png",
      glow: "/assets/cards/blue/card_glow.png",
      icon: "/assets/cards/blue/icon_vs.svg",
    },
    green: {
      base: "/assets/cards/green/card_base.png",
      glow: "/assets/cards/green/card_glow.png",
      icon: "/assets/cards/green/icon_crown.svg",
    },
  },
  ui: {
    circleBg: "/assets/ui/icon_circle_bg.png",
    chevron: "/assets/ui/icon_chevron_right.svg",
    progressBg: "/assets/ui/progress_bg.png",
    progressFill: "/assets/ui/progress_fill.png",
  },
  header: {
    menu: "/assets/header/icon_menu.svg",
    profile: "/assets/header/icon_profile.svg",
    gems: "/assets/header/icon_gems.svg",
    crown: "/assets/header/logo_crown.svg",
  },
  nav: {
    play: "/assets/nav/nav_play.svg",
    scores: "/assets/nav/nav_scores.svg",
    rules: "/assets/nav/nav_rules.svg",
    shop: "/assets/nav/nav_shop.svg",
    settings: "/assets/nav/nav_settings.svg",
  },
} as const;
