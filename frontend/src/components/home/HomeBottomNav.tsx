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
    <nav
      className="absolute inset-x-0 bottom-0 grid grid-cols-5 gap-1 border-t border-home-border bg-home-grad-bottom px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Main"
    >
      {TABS.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={[
              "relative flex flex-col items-center gap-1 px-1 py-1.5 text-[10px] font-bold tracking-wide uppercase",
              on ? "text-home-gold" : "text-home-muted",
            ].join(" ")}
          >
            {on && (
              <span className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded bg-home-gold" />
            )}
            <img
              src={tab.icon}
              alt=""
              width={22}
              height={22}
              className={on ? "opacity-100" : "opacity-70"}
              style={on ? undefined : { filter: "grayscale(0.4)" }}
            />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
