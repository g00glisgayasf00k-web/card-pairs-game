import { useCallback, useEffect, useState } from "react";
import {
  ENERGY_BUY_TEN_COST,
  MAX_ENERGY,
  buyTenEnergy,
  grantEnergyFromVideo,
  syncEnergyState,
} from "../lib/energy";
import { GEM_SHOP_PACKS, grantGemPack } from "../lib/credits";
import { loadProgress, saveProgress } from "../lib/progress";
import {
  ENERGY_VIDEO_REWARD,
  GEM_VIDEO_REWARD,
  MAX_ENERGY_VIDEO_ADS_PER_DAY,
  MAX_GEM_VIDEO_ADS_PER_DAY,
  VIDEO_AD_DURATION_MS,
  energyVideoAdsRemaining,
  gemVideoAdsRemaining,
  recordEnergyVideoAd,
  recordGemVideoAd,
} from "../lib/treasuryAds";
import { ResourceBar } from "./ResourceBar";

interface Props {
  onClose: () => void;
  onBalanceChange: () => void;
  emphasizeEnergy?: boolean;
}

type AdKind = "gems" | "energy";

const PACK_ICONS: Record<string, string> = {
  handful: "💎",
  pouch: "💠",
  vault: "👑",
  treasure: "🏆",
};

const FEATURED_PACK_ID = "treasure";

function VideoAdOverlay({
  kind,
  progress,
  onCancel,
}: {
  kind: AdKind;
  progress: number;
  onCancel: () => void;
}) {
  const rewardLabel =
    kind === "gems" ? `+${GEM_VIDEO_REWARD} gems` : `+${ENERGY_VIDEO_REWARD} energy`;

  return (
    <div className="royal-shop-ad" role="status" aria-live="polite">
      <div className="royal-shop-ad__panel">
        <span className="royal-shop-ad__badge">Sponsored</span>
        <div className="royal-shop-ad__screen">
          <span className="royal-shop-ad__play" aria-hidden>
            ▶
          </span>
          <p className="royal-shop-ad__title">Royal Match Poker</p>
          <p className="royal-shop-ad__tagline">Play your hand — match pairs, beat the table.</p>
        </div>
        <div className="royal-shop-ad__progress" aria-hidden>
          <span className="royal-shop-ad__progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="royal-shop-ad__hint">
          {progress >= 1 ? `Reward unlocked: ${rewardLabel}` : "Watching… reward in a moment"}
        </p>
        {progress < 0.35 && (
          <button type="button" className="royal-shop-ad__skip" onClick={onCancel}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

export function GemShopModal({ onClose, onBalanceChange, emphasizeEnergy = false }: Props) {
  const [balanceTick, setBalanceTick] = useState(0);
  const [adKind, setAdKind] = useState<AdKind | null>(null);
  const [adProgress, setAdProgress] = useState(0);

  const saved = loadProgress();
  const { energy } = syncEnergyState();
  const gems = saved?.credits ?? 0;
  const canBuyEnergy = energy < MAX_ENERGY && gems >= ENERGY_BUY_TEN_COST;
  const gemAdsLeft = gemVideoAdsRemaining();
  const energyAdsLeft = energyVideoAdsRemaining();
  const canWatchGemAd = gemAdsLeft > 0 && !adKind;
  const canWatchEnergyAd = energyAdsLeft > 0 && energy < MAX_ENERGY && !adKind;

  const refresh = useCallback(() => {
    setBalanceTick((t) => t + 1);
    onBalanceChange();
  }, [onBalanceChange]);

  // Re-read balances when refresh runs.
  void balanceTick;

  const finishAd = useCallback(
    (kind: AdKind) => {
      const progress = loadProgress();
      if (!progress) return;

      if (kind === "gems") {
        if (!recordGemVideoAd()) return;
        saveProgress({ ...progress, credits: progress.credits + GEM_VIDEO_REWARD });
      } else {
        if (!recordEnergyVideoAd()) return;
        grantEnergyFromVideo(ENERGY_VIDEO_REWARD);
      }
      refresh();
    },
    [refresh]
  );

  useEffect(() => {
    if (!adKind) return;

    const start = Date.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / VIDEO_AD_DURATION_MS);
      setAdProgress(progress);
      if (progress >= 1) {
        window.clearInterval(timer);
        finishAd(adKind);
        setAdKind(null);
        setAdProgress(0);
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [adKind, finishAd]);

  const handleBuyGems = (packId: string) => {
    const amount = grantGemPack(packId);
    if (!amount || !saved) return;
    saveProgress({ ...saved, credits: saved.credits + amount });
    refresh();
  };

  const handleBuyEnergy = () => {
    if (buyTenEnergy()) refresh();
  };

  const startAd = (kind: AdKind) => {
    if (kind === "gems" && !canWatchGemAd) return;
    if (kind === "energy" && !canWatchEnergyAd) return;
    setAdProgress(0);
    setAdKind(kind);
  };

  const cancelAd = () => {
    setAdKind(null);
    setAdProgress(0);
  };

  const freeRewardsSection = (
    <section className="royal-shop-section">
      <h3 className="royal-shop__section-title">Free rewards</h3>
      <p className="royal-shop__section-note">Watch a short video — limits reset at UK midnight.</p>
      <ul className="royal-shop-rewards">
        <li>
          <div className="royal-shop-card royal-shop-card--row royal-shop-card--video">
            <span className="royal-shop-card__icon">📺</span>
            <div className="royal-shop-card__meta">
              <span className="royal-shop-card__label">Watch video</span>
              <span className="royal-shop-card__detail">
                +{GEM_VIDEO_REWARD} gems · {gemAdsLeft}/{MAX_GEM_VIDEO_ADS_PER_DAY} left today
              </span>
            </div>
            <button
              type="button"
              className="royal-shop-card__btn royal-shop-card__btn--video"
              onClick={() => startAd("gems")}
              disabled={!canWatchGemAd}
            >
              ▶ Free
            </button>
          </div>
        </li>
        <li>
          <div className="royal-shop-card royal-shop-card--row royal-shop-card--video">
            <span className="royal-shop-card__icon">⚡</span>
            <div className="royal-shop-card__meta">
              <span className="royal-shop-card__label">Energy boost</span>
              <span className="royal-shop-card__detail">
                +{ENERGY_VIDEO_REWARD} energy · {energyAdsLeft}/{MAX_ENERGY_VIDEO_ADS_PER_DAY} left
                today
              </span>
            </div>
            <button
              type="button"
              className="royal-shop-card__btn royal-shop-card__btn--video"
              onClick={() => startAd("energy")}
              disabled={!canWatchEnergyAd}
            >
              ▶ Free
            </button>
          </div>
        </li>
      </ul>
    </section>
  );

  const energySection = (
    <section className="royal-shop-section royal-shop-energy">
      <h3
        className={`royal-shop__section-title${emphasizeEnergy ? " royal-shop__section-title--alert" : ""}`}
      >
        {emphasizeEnergy ? "Need energy to play" : "Refill energy"}
      </h3>
      <div className="royal-shop-card royal-shop-card--row">
        <span className="royal-shop-card__icon">⚡</span>
        <div className="royal-shop-card__meta">
          <span className="royal-shop-card__label">Full bar</span>
          <span className="royal-shop-card__detail">+{MAX_ENERGY} energy instantly</span>
        </div>
        <button
          type="button"
          className="royal-shop-card__btn"
          onClick={handleBuyEnergy}
          disabled={!canBuyEnergy}
        >
          {ENERGY_BUY_TEN_COST} 💎
        </button>
      </div>
    </section>
  );

  const gemsSection = (
    <section className="royal-shop-section">
      <h3 className="royal-shop__section-title">Buy gems</h3>
      <p className="royal-shop__section-note">Demo store — connect real payments later.</p>
      <ul className="royal-shop-grid">
        {GEM_SHOP_PACKS.map((pack) => {
          const featured = pack.id === FEATURED_PACK_ID;
          return (
            <li key={pack.id}>
              <div
                className={`royal-shop-card${featured ? " royal-shop-card--featured" : ""}`}
              >
                {featured && <span className="royal-shop-card__badge">Best value</span>}
                <span className="royal-shop-card__icon">{PACK_ICONS[pack.id] ?? "💎"}</span>
                <span className="royal-shop-card__label">{pack.label}</span>
                <span className="royal-shop-card__detail">+{pack.gems.toLocaleString()} gems</span>
                <button
                  type="button"
                  className="royal-shop-card__btn"
                  onClick={() => handleBuyGems(pack.id)}
                >
                  {pack.priceLabel}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );

  const sections = emphasizeEnergy
    ? [energySection, freeRewardsSection, gemsSection]
    : [freeRewardsSection, energySection, gemsSection];

  return (
    <div className="modal-overlay scores-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal gem-shop-modal royal-shop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="gem-shop-title"
      >
        <div className="royal-shop__header">
          <div className="royal-frame royal-frame--compact">
            <span className="royal-frame__crown" aria-hidden>
              👑
            </span>
            <h2 id="gem-shop-title" className="royal-frame__title">
              Royal treasury
            </h2>
            <p className="royal-frame__sub">Gems & energy for the table</p>
          </div>
          <ResourceBar gems={gems} energy={energy} maxEnergy={MAX_ENERGY} />
        </div>

        {emphasizeEnergy && (
          <p className="royal-shop-alert" role="status">
            You&apos;re out of energy — watch a free video or spend gems to keep playing.
          </p>
        )}

        <div className="royal-shop__body">{sections}</div>

        <button type="button" className="btn scores-close royal-shop-close" onClick={onClose}>
          Close
        </button>

        {adKind && (
          <VideoAdOverlay kind={adKind} progress={adProgress} onCancel={cancelAd} />
        )}
      </div>
    </div>
  );
}
