import type { ReactNode } from "react";

export type HomeNavTab = "play" | "scores" | "rules" | "shop" | "settings";

interface Props {
  active: HomeNavTab;
  onSelect: (tab: HomeNavTab) => void;
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="home-bottom-nav__svg" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

const TABS: { id: HomeNavTab; label: string; icon: ReactNode }[] = [
  {
    id: "play",
    label: "Play",
    icon: (
      <NavIcon>
        <path
          fill="currentColor"
          d="M12 3.1 2.8 10.6c-.25.2-.35.45-.35.7V20c0 .55.45 1 1 1h6.35v-6.2h4.4V21h6.35c.55 0 1-.45 1-1v-8.7c0-.25-.1-.5-.35-.7L12 3.1z"
        />
      </NavIcon>
    ),
  },
  {
    id: "scores",
    label: "Scores",
    icon: (
      <NavIcon>
        <path
          fill="currentColor"
          d="M8 3.5h8v1.4h-.9c0 2.7-1.55 4.7-3.1 5.55C13.55 11.3 15.1 13.3 15.1 16H8.9c0-2.7 1.55-4.7 3.1-5.55C10.45 9.6 8.9 7.6 8.9 4.9H8V3.5zm1.2 14h5.6V19H13.5v1.5h-3V19H9.2v-1.5z"
        />
      </NavIcon>
    ),
  },
  {
    id: "rules",
    label: "Rules",
    icon: (
      <NavIcon>
        <path
          fill="currentColor"
          d="M4.2 5.1c1.6-.85 3.5-1.05 5.15.05.5.35.95.8 1.35 1.3.4-.5.85-.95 1.35-1.3 1.65-1.1 3.55-.9 5.15-.05v13.5c-1.5-.45-3.15-.55-4.65.35-.55.35-1.05.85-1.55 1.35-.5-.5-1-.999-1.55-1.35-1.5-.9-3.15-.8-4.65-.35V5.1zm1.7.95v11.2c1-.2 2.05-.15 2.95.4.4.25.75.55 1.1.95V8.05c-.4-.5-.85-.9-1.35-1.2-1-.65-1.9-.55-2.7-.05zm11.2 0c-.8-.5-1.7-.6-2.7-.05-.5.3-.95.7-1.35 1.2v10.55c.35-.4.7-.7 1.1-.95.9-.55 1.95-.6 2.95-.4V6.05z"
        />
      </NavIcon>
    ),
  },
  {
    id: "shop",
    label: "Shop",
    icon: (
      <NavIcon>
        <path
          fill="currentColor"
          d="M7.4 7.2 6.1 4H3v1.6h2.15l3.35 8.05L7.2 16.2c-.2.4-.05.9.35 1.1.15.05.3.1.45.1h10.2v-1.6H8.65l.55-1.1h7.7c.35 0 .65-.2.8-.55l3-7.2c.1-.25.05-.55-.1-.75-.15-.2-.4-.35-.65-.35H7.4zm1.1 13.1a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9zm9.2 0a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9z"
        />
      </NavIcon>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <NavIcon>
        <path
          fill="currentColor"
          d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54A.48.48 0 0 0 13.9 2h-3.8a.48.48 0 0 0-.48.42l-.36 2.54c-.58.23-1.12.54-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.75 8.48a.49.49 0 0 0 .12.61l2.03 1.58c-.04.3-.06.62-.06.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.13.22.39.31.59.22l2.39-.96c.5.4 1.04.72 1.62.94l.36 2.54c.05.24.25.42.48.42h3.8c.24 0 .43-.18.48-.42l.36-2.54c.58-.23 1.12-.54 1.62-.94l2.39.96c.22.09.46 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
        />
      </NavIcon>
    ),
  },
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
            {tab.icon}
            <span className="home-bottom-nav__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
