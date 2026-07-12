import type { ReactNode } from "react";
import { HOME_ASSETS } from "./homeAssets";
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
  icon?: ReactNode;
  meta?: string;
  badge?: number;
  progress?: ProgressProps;
  onClick: () => void;
}

const CARD_CLASS: Record<HomeGlow, string> = {
  purple: "home-mode-card--purple",
  blue: "home-mode-card--blue",
  green: "home-mode-card--green",
};

const CARD_ASSETS = HOME_ASSETS.cards;

export function GameModeCard({
  glow,
  label,
  title,
  subtitle,
  icon,
  meta,
  badge,
  progress,
  onClick,
}: Props) {
  const assets = CARD_ASSETS[glow];
  const badgeLabel = badge && badge > 0 ? (badge > 99 ? "99+" : String(badge)) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={["home-mode-card", CARD_CLASS[glow]].join(" ")}
    >
      {badgeLabel && (
        <span className="home-mode-card__badge" aria-label={`${badge} notifications`}>
          {badgeLabel}
        </span>
      )}
      <span
        className="home-mode-card__glow"
        aria-hidden
        style={{ backgroundImage: `url(${assets.glow})` }}
      />
      <div className="home-mode-card__body">
        <span className="home-mode-card__tag">{label}</span>
        <span className="home-mode-card__title">{title}</span>
        <span className="home-mode-card__subtitle">{subtitle}</span>
        {meta && <span className="home-mode-card__meta">{meta}</span>}
        {progress && (
          <>
            <span className="home-mode-card__meta home-mode-card__meta--progress">
              ★ {progress.label}
            </span>
            <span className="home-mode-card__progress" aria-hidden>
              <span style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }} />
            </span>
          </>
        )}
      </div>

      <span className="home-mode-card__icon-wrap" aria-hidden>
        {icon ?? (
          <img
            className="home-mode-card__badge-img"
            src={assets.icon}
            alt=""
            width={64}
            height={64}
          />
        )}
      </span>
      <span className="home-mode-card__chev" aria-hidden>
        <img src={HOME_ASSETS.ui.chevron} alt="" width={16} height={16} />
      </span>
    </button>
  );
}
