import type { ReactNode } from "react";
import type { HomeGlow } from "./homeTheme";

interface ProgressProps {
  label: string;
  percent: number;
}

interface Props {
  glow: HomeGlow;
  label: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  meta?: string;
  progress?: ProgressProps;
  onClick: () => void;
}

const CARD_CLASS: Record<HomeGlow, string> = {
  purple: "home-mode-card--purple",
  blue: "home-mode-card--blue",
  green: "home-mode-card--green",
};

export function GameModeCard({
  glow,
  label,
  title,
  subtitle,
  icon,
  meta,
  progress,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["home-mode-card", CARD_CLASS[glow]].join(" ")}
    >
      <div className="home-mode-card__body flex min-w-0 flex-1 flex-col">
        <span className="home-mode-card__tag">{label}</span>
        <span className="home-mode-card__title">{title}</span>
        <span className="home-mode-card__subtitle">{subtitle}</span>
        {meta && <span className="home-mode-card__meta">{meta}</span>}
        {progress && (
          <>
            <span className="home-mode-card__meta">{progress.label}</span>
            <span className="home-mode-card__progress" aria-hidden>
              <span style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }} />
            </span>
          </>
        )}
      </div>

      <span className="home-mode-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="home-mode-card__chev" aria-hidden>
        ›
      </span>
    </button>
  );
}
