import type { ReactNode } from "react";
import { HOME_ASSETS } from "./homeAssets";
import { HeadToHeadLabel } from "./HeadToHeadLabel";
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
  metaIcon?: "gem" | "shield" | "star";
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
  metaIcon,
  badge,
  progress,
  onClick,
}: Props) {
  const assets = CARD_ASSETS[glow];
  const badgeLabel = badge && badge > 0 ? (badge > 99 ? "99+" : String(badge)) : null;
  const pct = progress ? Math.max(0, Math.min(100, progress.percent)) : 0;
  const resolvedMetaIcon =
    metaIcon ?? (glow === "green" ? "shield" : undefined);

  return (
    <button
      type="button"
      onClick={onClick}
      className={["home-mode-card", CARD_CLASS[glow]].join(" ")}
      style={{ backgroundImage: `url(${assets.base})` }}
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
        {glow === "blue" ? (
          <HeadToHeadLabel className="home-mode-card__tag-img" />
        ) : (
          <img className="home-mode-card__tag-img" src={assets.label} alt={label} />
        )}
        <span className="home-mode-card__title">{title}</span>
        <span className="home-mode-card__subtitle">{subtitle}</span>

        {progress && (
          <div className="home-mode-card__progress-block">
            <span className="home-mode-card__meta home-mode-card__meta--progress">
              <span className="home-mode-card__meta-star" aria-hidden>
                ★
              </span>
              {progress.label}
            </span>
            <span
              className="home-mode-card__progress"
              aria-hidden
              style={{ backgroundImage: `url(${HOME_ASSETS.ui.progressBg})` }}
            >
              <span style={{ width: `${pct}%` }} />
            </span>
          </div>
        )}

        {meta && !progress && (
          <span className="home-mode-card__meta">
            {resolvedMetaIcon === "gem" && (
              <img
                className="home-mode-card__meta-icon"
                src={HOME_ASSETS.header.gems}
                alt=""
                width={14}
                height={14}
              />
            )}
            {resolvedMetaIcon === "shield" && (
              <img
                className="home-mode-card__meta-icon"
                src={HOME_ASSETS.home.levelBadge}
                alt=""
                width={14}
                height={14}
              />
            )}
            {meta}
          </span>
        )}
      </div>

      <span className="home-mode-card__icon-wrap" aria-hidden>
        <span
          className="home-mode-card__icon-ring"
          style={{ backgroundImage: `url(${assets.circle})` }}
        />
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
