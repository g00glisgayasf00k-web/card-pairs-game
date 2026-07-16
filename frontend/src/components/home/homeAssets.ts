/** Public asset paths for the home screen redesign (UI kit sheet) */

export const HOME_ASSETS = {
  background: {
    main: "/assets/background/bg_main.png",
  },
  hero: {
    banner: "/assets/hero/banner_choose_mode.png",
    panelBg: "/assets/hero/panel_hero_bg.png",
    cardsHand: "/assets/hero/cards_royal_flush.png",
    chipsStack: "/assets/hero/chips_stack.png",
    particlesGold: "/assets/hero/particles_gold.png",
    youtubeThumbnail: "/assets/hero/youtube-thumbnail.png",
    onboardingLandscape: "/assets/hero/onboarding-hero-landscape.png",
  },
  cards: {
    purple: {
      base: "/assets/cards/purple/card_base.png",
      glow: "/assets/cards/purple/card_glow.png",
      icon: "/assets/cards/purple/icon_trophy.png",
      label: "/assets/home/label_solo.png",
      circle: "/assets/ui/icon_circle_bg.png",
    },
    blue: {
      base: "/assets/cards/blue/card_base.png",
      glow: "/assets/cards/blue/card_glow.png",
      icon: "/assets/cards/blue/icon_vs.png",
      label: "/assets/home/label_multiplayer.png",
      circle: "/assets/ui/icon_circle_blue.png",
    },
    green: {
      base: "/assets/cards/green/card_base.png",
      glow: "/assets/cards/green/card_glow.png",
      icon: "/assets/cards/green/icon_crown.png",
      label: "/assets/home/label_tournament.png",
      circle: "/assets/ui/icon_circle_green.png",
    },
  },
  ui: {
    circleBg: "/assets/ui/icon_circle_bg.png",
    chevron: "/assets/ui/icon_chevron_right.png",
    progressBg: "/assets/ui/progress_bg.png",
    progressFill: "/assets/ui/progress_fill.png",
  },
  header: {
    menu: "/assets/header/icon_menu.png",
    profile: "/assets/header/icon_profile.png",
    gems: "/assets/header/icon_gems.png",
    crown: "/assets/header/logo_crown.png",
    logo: "/assets/header/logo-royal-poker-match.png",
    logoStacked: "/assets/brand/logo-stacked.png",
    logoFull: "/assets/brand/logo-full-on-green.png",
  },
  home: {
    levelBadge: "/assets/home/icon_level_badge.png",
    chest: "/assets/home/icon_chest.png",
    friendsBadge: "/assets/home/badge-friends.png",
    friendsLabel: "/assets/home/label_friends.png",
  },
  nav: {
    play: "/assets/nav/nav_play.png",
    scores: "/assets/nav/nav_scores.png",
    rules: "/assets/nav/nav_rules.png",
    shop: "/assets/nav/nav_shop.png",
    settings: "/assets/nav/nav_settings.png",
  },
} as const;
