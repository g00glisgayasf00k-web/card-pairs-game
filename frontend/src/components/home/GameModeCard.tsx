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
      style={{
        backgroundImage: `url(${assets.base})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
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
      <div className="home-mode-card__body flex min-w-0 flex-1 flex-col">
        <span className="home-mode-card__tag">{label}</span>
        <span className="home-mode-card__title">{title}</span>
        <span className="home-mode-card__subtitle">{subtitle}</span>
        {meta && <span className="home-mode-card__meta">{meta}</span>}
        {progress && (
          <>
            <span className="home-mode-card__meta">{progress.label}</span>
            <span
              className="home-mode-card__progress"
              aria-hidden
              style={{ backgroundImage: `url(${HOME_ASSETS.ui.progressBg})`, backgroundSize: "100% 100%" }}
            >
              <span
                style={{
                  width: `${Math.max(0, Math.min(100, progress.percent))}%`,
                  backgroundImage: `url(${HOME_ASSETS.ui.progressFill})`,
                  backgroundSize: "cover",
                }}
              />
            </span>
          </>
        )}
      </div>

      <span className="home-mode-card__icon" aria-hidden>
        {icon ?? (
          <img
            src={assets.icon}
            alt=""
            width={36}
            height={36}
            style={{
              backgroundImage: `url(${HOME_ASSETS.ui.circleBg})`,
              backgroundSize: "contain",
            }}
          />
        )}
      </span>
      <span className="home-mode-card__chev" aria-hidden>
        <img src={HOME_ASSETS.ui.chevron} alt="" width={18} height={18} />
      </span>
    </button>
  );
}
