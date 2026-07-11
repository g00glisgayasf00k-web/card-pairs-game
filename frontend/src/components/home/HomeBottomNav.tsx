export type HomeNavTab = "play" | "scores" | "rules" | "shop" | "settings";

interface Props {
  active: HomeNavTab;
  onSelect: (tab: HomeNavTab) => void;
}

const TABS: { id: HomeNavTab; label: string; icon: string }[] = [
  { id: "play", label: "Play", icon: "🏠" },
  { id: "scores", label: "Scores", icon: "🏆" },
  { id: "rules", label: "Rules", icon: "📖" },
  { id: "shop", label: "Shop", icon: "🛒" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function HomeBottomNav({ active, onSelect }: Props) {
  return (
    <nav
      className="absolute inset-x-0 bottom-0 grid grid-cols-5 gap-1 border-t border-home-text/10 bg-home-grad-bottom px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
            <span className="text-xl leading-none" aria-hidden>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
