import { HOME_ASSETS } from "./homeAssets";

export type HomeNavTab = "play" | "scores" | "rules" | "shop" | "settings";

interface Props {
  active: HomeNavTab;
  onSelect: (tab: HomeNavTab) => void;
}

const TABS: { id: HomeNavTab; label: string; icon: string }[] = [
  { id: "play", label: "Play", icon: HOME_ASSETS.nav.play },
  { id: "scores", label: "Scores", icon: HOME_ASSETS.nav.scores },
  { id: "rules", label: "Rules", icon: HOME_ASSETS.nav.rules },
  { id: "shop", label: "Shop", icon: HOME_ASSETS.nav.shop },
  { id: "settings", label: "Settings", icon: HOME_ASSETS.nav.settings },
];

export function HomeBottomNav({ active, onSelect }: Props) {
  return (
    <nav className="home-bottom-nav" aria-label="Main">
      {TABS.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`home-bottom-nav__btn${on ? " home-bottom-nav__btn--on" : ""}`}
          >
            <span
              className="home-bottom-nav__glyph"
              style={{ maskImage: `url(${tab.icon})`, WebkitMaskImage: `url(${tab.icon})` }}
              aria-hidden
            />
            <span className="home-bottom-nav__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
