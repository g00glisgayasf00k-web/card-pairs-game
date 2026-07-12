import { useCallback, useEffect, useRef, useState } from "react";
import {
  ENERGY_BUY_TEN_COST,
  MAX_ENERGY,
  buyTenEnergy,
  grantEnergyFromVideo,
  syncEnergyState,
} from "../lib/energy";
import { clearGemRewardAd, mountGemRewardAd } from "../lib/adsense";
import { nativeAdsAvailable, showRewardedEnergyAd, showRewardedGemAd } from "../lib/nativeAds";
import { GEM_SHOP_PACKS } from "../lib/credits";
import { fetchPaymentConfig, type PaymentConfig, type PaymentPack } from "../lib/payments";
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
import { SquareCheckoutModal } from "./SquareCheckoutModal";
import { HOME_ASSETS, HomeKitShell } from "./home";

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

const FALLBACK_PACKS: PaymentPack[] = GEM_SHOP_PACKS.map((p) => ({
  id: p.id,
  gems: p.gems,
  label: p.label,
  price_cents: 0,
  currency: "USD",
  price_label: p.priceLabel,
}));

function VideoAdOverlay({
  kind,
  progress,
  onCancel,
}: {
  kind: AdKind;
  progress: number;
  onCancel: () => void;
}) {
  const adHostRef = useRef<HTMLDivElement>(null);
  const isGemAd = kind === "gems";
  const rewardLabel =
    kind === "gems" ? `+${GEM_VIDEO_REWARD} gems` : `+${ENERGY_VIDEO_REWARD} energy`;

  useEffect(() => {
    if (!isGemAd) return;
    const host = adHostRef.current;
    if (!host) return;
    void mountGemRewardAd(host);
    return () => clearGemRewardAd(host);
  }, [isGemAd]);

  return (
    <div className="royal-shop-ad" role="status" aria-live="polite">
      <div className="royal-shop-ad__panel">
        <span className="royal-shop-ad__badge">Sponsored</span>
        <div className="royal-shop-ad__screen">
          {isGemAd ? (
            <div
              ref={adHostRef}
              className="royal-shop-ad__slot"
              aria-label="Advertisement — watch to earn free gems"
            />
          ) : (
            <>
              <span className="royal-shop-ad__play" aria-hidden>
                ▶
              </span>
              <p className="royal-shop-ad__title">Royal Poker Match</p>
              <p className="royal-shop-ad__tagline">Play your hand — match pairs, beat the table.</p>
            </>
          )}
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
  const [gemAdBusy, setGemAdBusy] = useState(false);
  const [energyAdBusy, setEnergyAdBusy] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [checkoutPack, setCheckoutPack] = useState<PaymentPack | null>(null);

  const loggedIn = typeof localStorage !== "undefined" && !!localStorage.getItem("token");
  const purchasesEnabled = Boolean(paymentConfig?.enabled && loggedIn);
  const shopPacks = paymentConfig?.packs?.length ? paymentConfig.packs : FALLBACK_PACKS;

  const saved = loadProgress();
  const { energy } = syncEnergyState();
  const gems = saved?.credits ?? 0;
  const energyFull = energy >= MAX_ENERGY;
  const canBuyEnergy = !energyFull && gems >= ENERGY_BUY_TEN_COST;
  const gemAdsLeft = gemVideoAdsRemaining();
  const energyAdsLeft = energyVideoAdsRemaining();
  const canWatchGemAd = gemAdsLeft > 0 && !adKind && !gemAdBusy;
  const canWatchEnergyAd = energyAdsLeft > 0 && energy < MAX_ENERGY && !adKind && !energyAdBusy;

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
    void fetchPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig(null));
  }, []);

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

  const handlePurchaseSuccess = (credits: number) => {
    const progress = loadProgress();
    if (progress) {
      saveProgress({ ...progress, credits, updatedAt: Date.now() });
    }
    setCheckoutPack(null);
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

  // Free gems: real AdMob rewarded video on the native app, web fallback otherwise.
  const handleGemAd = async () => {
    if (!canWatchGemAd || gemAdBusy) return;
    if (nativeAdsAvailable()) {
      setGemAdBusy(true);
      try {
        const rewarded = await showRewardedGemAd();
        if (rewarded && recordGemVideoAd()) {
          const progress = loadProgress();
          if (progress) {
            saveProgress({ ...progress, credits: progress.credits + GEM_VIDEO_REWARD });
          }
          refresh();
        }
      } finally {
        setGemAdBusy(false);
      }
      return;
    }
    startAd("gems");
  };

  // Energy boost: real AdMob rewarded video on the native app, web fallback otherwise.
  const handleEnergyAd = async () => {
    if (!canWatchEnergyAd || energyAdBusy) return;
    if (nativeAdsAvailable()) {
      setEnergyAdBusy(true);
      try {
        const rewarded = await showRewardedEnergyAd();
        if (rewarded && recordEnergyVideoAd()) {
          grantEnergyFromVideo(ENERGY_VIDEO_REWARD);
          refresh();
        }
      } finally {
        setEnergyAdBusy(false);
      }
      return;
    }
    startAd("energy");
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
              onClick={() => void handleGemAd()}
              disabled={!canWatchGemAd || gemAdBusy}
            >
              {gemAdBusy ? "Loading…" : "▶ Free"}
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
              onClick={() => void handleEnergyAd()}
              disabled={!canWatchEnergyAd || energyAdBusy}
            >
              {energyAdBusy ? "Loading…" : "▶ Free"}
            </button>
          </div>
        </li>
      </ul>
    </section>
  );

  const purchaseBanner = !paymentConfig?.enabled ? (
    <p className="royal-shop-coming-soon" role="status">
      Gem purchases are not available yet. Free video rewards are still available below.
    </p>
  ) : !loggedIn ? (
    <p className="royal-shop-coming-soon" role="status">
      Sign in to buy gems with Square. Free video rewards are still available below.
    </p>
  ) : null;

  const energySection = (
    <section className="royal-shop-section royal-shop-energy">
      <h3
        className={`royal-shop__section-title${emphasizeEnergy ? " royal-shop__section-title--alert" : ""}`}
      >
        {emphasizeEnergy ? "Need energy to play" : "Refill energy"}
      </h3>
      <p className="royal-shop__section-note">
        Max {MAX_ENERGY} energy · +1 every 2 hours · each level attempt costs 1
      </p>
      <div className={`royal-shop-card royal-shop-card--row${!canBuyEnergy ? " royal-shop-card--locked" : ""}`}>
        <span className="royal-shop-card__icon">⚡</span>
        <div className="royal-shop-card__meta">
          <span className="royal-shop-card__label">Full bar</span>
          <span className="royal-shop-card__detail">
            {energyFull
              ? `Energy already full (${MAX_ENERGY}/${MAX_ENERGY})`
              : `Refill to ${MAX_ENERGY} instantly · costs ${ENERGY_BUY_TEN_COST} 💎`}
          </span>
        </div>
        <button
          type="button"
          className="royal-shop-card__btn"
          onClick={handleBuyEnergy}
          disabled={!canBuyEnergy}
        >
          {energyFull ? "Full" : `${ENERGY_BUY_TEN_COST} 💎`}
        </button>
      </div>
    </section>
  );

  const gemsSection = (
    <section className="royal-shop-section">
      <h3 className="royal-shop__section-title">Buy gems</h3>
      <p className="royal-shop__section-note">
        {purchasesEnabled
          ? "Secure card checkout powered by Square."
          : paymentConfig?.enabled
            ? "Sign in to purchase gem packs."
            : "Gem packs will be available here soon."}
      </p>
      <ul className="royal-shop-grid">
        {shopPacks.map((pack) => {
          const featured = pack.id === FEATURED_PACK_ID;
          return (
            <li key={pack.id}>
              <div
                className={`royal-shop-card${featured ? " royal-shop-card--featured" : ""}${!purchasesEnabled ? " royal-shop-card--locked" : ""}`}
              >
                {featured && <span className="royal-shop-card__badge">Best value</span>}
                <span className="royal-shop-card__icon">{PACK_ICONS[pack.id] ?? "💎"}</span>
                <span className="royal-shop-card__label">{pack.label}</span>
                <span className="royal-shop-card__detail">+{pack.gems.toLocaleString()} gems</span>
                <button
                  type="button"
                  className={`royal-shop-card__btn${!purchasesEnabled ? " royal-shop-card__btn--soon" : ""}`}
                  onClick={() => purchasesEnabled && setCheckoutPack(pack)}
                  disabled={!purchasesEnabled}
                >
                  {purchasesEnabled ? pack.price_label : "Sign in"}
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
    <>
      <HomeKitShell
        tone="shop"
        title="Shop"
        lead="Gems & energy for the table."
        brandIcon={HOME_ASSETS.nav.shop}
        chip={
          <span className="hk-kit__chip">
            <img src={HOME_ASSETS.header.gems} alt="" />
            {gems.toLocaleString()}
          </span>
        }
        onClose={onClose}
        hideHero={false}
      >
        <div className="royal-shop gem-shop-modal" style={{ margin: 0, maxHeight: "none", overflow: "visible" }}>
          <div className="royal-shop__header">
            <ResourceBar gems={gems} energy={energy} maxEnergy={MAX_ENERGY} />
          </div>

          {emphasizeEnergy && (
            <p className="royal-shop-alert" role="status">
              You&apos;re out of energy — watch a free video below to keep playing.
            </p>
          )}

          <div className="royal-shop__body">
            {purchaseBanner}
            {sections}
          </div>

          {adKind && (
            <VideoAdOverlay kind={adKind} progress={adProgress} onCancel={cancelAd} />
          )}
        </div>
      </HomeKitShell>

      {checkoutPack && paymentConfig && (
        <SquareCheckoutModal
          pack={checkoutPack}
          config={paymentConfig}
          onClose={() => setCheckoutPack(null)}
          onSuccess={(credits) => handlePurchaseSuccess(credits)}
        />
      )}
    </>
  );
}
