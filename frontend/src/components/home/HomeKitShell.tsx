import type { ReactNode } from "react";
import { HOME_ASSETS } from "./homeAssets";

export type HomeKitTone = "scores" | "rules" | "shop" | "settings";

interface Props {
  tone: HomeKitTone;
  title: string;
  lead?: string;
  brandIcon: string;
  chip?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Hide the decorative hero (useful when content has its own header). */
  hideHero?: boolean;
  footerExtra?: ReactNode;
}

export function HomeKitShell({
  tone,
  title,
  lead,
  brandIcon,
  chip,
  onClose,
  children,
  hideHero = false,
  footerExtra,
}: Props) {
  const a = HOME_ASSETS;

  return (
    <div
      className={`hk-kit-overlay hk-kit-overlay--${tone}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="hk-kit"
        style={{ backgroundImage: `url(${a.background.main})` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="home-kit-title"
      >
        <div className="hk-kit__veil" aria-hidden />
        <div className="hk-kit__inner">
          <div className="hk-kit__top">
            <div className="hk-kit__brand">
              <img className="hk-kit__brand-icon" src={brandIcon} alt="" />
              <span className="hk-kit__brand-title">{title}</span>
              {chip}
            </div>
            <button type="button" className="hk-kit__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          {!hideHero && (
            <div className="hk-kit__hero" style={{ backgroundImage: `url(${a.hero.panelBg})` }}>
              <span
                className="hk-kit__hero-particles"
                style={{ backgroundImage: `url(${a.hero.particlesGold})` }}
                aria-hidden
              />
              <img className="hk-kit__hero-cards" src={a.hero.cardsHand} alt="" />
              <img className="hk-kit__hero-chips" src={a.hero.chipsStack} alt="" />
              <div className="hk-kit__hero-copy">
                <h2 id="home-kit-title">{title}</h2>
                {lead && <p>{lead}</p>}
              </div>
            </div>
          )}

          <div className="hk-kit__body">{children}</div>

          <div className="hk-kit__footer">
            {footerExtra}
            <button type="button" className="hk-kit__ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
