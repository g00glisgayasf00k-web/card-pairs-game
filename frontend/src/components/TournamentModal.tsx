import { useState } from "react";
import { HOME_ASSETS } from "./home/homeAssets";
import { loadProgress, saveProgress } from "../lib/progress";
import {
  TOURNAMENT_TIERS,
  isTournamentUnlocked,
  payoutAmounts,
  unlockLabel,
  type TournamentTier,
} from "../lib/tournamentTiers";

interface Props {
  onClose: () => void;
  onBalanceChange?: () => void;
  onOpenShop?: () => void;
}

export function TournamentModal({ onClose, onBalanceChange, onOpenShop }: Props) {
  const [tick, setTick] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmTier, setConfirmTier] = useState<TournamentTier | null>(null);

  void tick;
  const gems = loadProgress()?.credits ?? 0;
  const a = HOME_ASSETS;
  const green = a.cards.green;

  const refresh = () => setTick((t) => t + 1);

  const enterTournament = (tier: TournamentTier) => {
    setError(null);
    setInfo(null);
    if (!isTournamentUnlocked(tier)) {
      setError(`Clear level ${unlockLabel(tier)} in Solo to unlock.`);
      return;
    }
    const saved = loadProgress();
    if (!saved) {
      setError("Sign in and start Solo first.");
      return;
    }
    if (saved.credits < tier.entryGems) {
      setError(`Need ${tier.entryGems} gems — you have ${saved.credits}.`);
      return;
    }
    setBusyId(tier.id);
    saveProgress({
      ...saved,
      credits: saved.credits - tier.entryGems,
    });
    setConfirmTier(null);
    setInfo(`Entered ${tier.name}! Top 3 share ${tier.rewardPool.toLocaleString()} gems.`);
    setBusyId(null);
    refresh();
    onBalanceChange?.();
  };

  return (
    <>
      <div className="tn-kit-overlay" onClick={onClose} role="presentation">
        <div
          className="tn-kit"
          style={{ backgroundImage: `url(${a.background.main})` }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="tournament-title"
        >
          <div className="tn-kit__veil" aria-hidden />
          <div className="tn-kit__inner">
            <div className="tn-kit__top">
              <div className="tn-kit__brand">
                <img className="tn-kit__brand-label" src={green.label} alt="Tournament" />
                <span className="tn-kit__gems">
                  <img src={a.header.gems} alt="" />
                  {gems.toLocaleString()}
                </span>
              </div>
              <button type="button" className="tn-kit__close" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="tn-kit__hero" style={{ backgroundImage: `url(${a.hero.panelBg})` }}>
              <span
                className="tn-kit__hero-particles"
                style={{ backgroundImage: `url(${a.hero.particlesGold})` }}
                aria-hidden
              />
              <img className="tn-kit__hero-cards" src={a.hero.cardsHand} alt="" />
              <img className="tn-kit__hero-chips" src={a.hero.chipsStack} alt="" />
              <div className="tn-kit__hero-copy">
                <h2 id="tournament-title">Tournament</h2>
                <p>Pick a cup, pay the entry, and fight for the prize pool.</p>
              </div>
            </div>

            <div className="tn-kit__body">
              <p className="tn-kit__hint">Top 3 earn the prize pool payouts shown on each cup.</p>
              {error && <p className="tn-kit__error">{error}</p>}
              {info && <p className="tn-kit__info">{info}</p>}

              {TOURNAMENT_TIERS.map((tier) => {
                const unlocked = isTournamentUnlocked(tier);
                const payouts = payoutAmounts(tier.rewardPool);
                const canAfford = gems >= tier.entryGems;
                return (
                  <article
                    key={tier.id}
                    className={`tn-cup${unlocked ? "" : " tn-cup--locked"}`}
                    style={{ backgroundImage: `url(${green.base})` }}
                  >
                    <span
                      className="tn-cup__glow"
                      style={{ backgroundImage: `url(${green.glow})` }}
                      aria-hidden
                    />
                    <div className="tn-cup__row">
                      <span className="tn-cup__icon-wrap" aria-hidden>
                        <span
                          className="tn-cup__ring"
                          style={{ backgroundImage: `url(${green.circle})` }}
                        />
                        <img className="tn-cup__icon" src={green.icon} alt="" />
                      </span>
                      <div className="tn-cup__copy">
                        <span className="tn-cup__name">{tier.name}</span>
                        <span className="tn-cup__unlock">
                          {unlocked
                            ? "Unlocked"
                            : `Locked · clear Solo ${unlockLabel(tier)}`}
                        </span>
                      </div>
                      <div className="tn-cup__pool">
                        <span className="tn-cup__pool-label">Pool</span>
                        <span className="tn-cup__pool-val">
                          <img src={a.header.gems} alt="" />
                          {tier.rewardPool.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <ul className="tn-cup__payouts">
                      {payouts.map((p) => (
                        <li key={p.place}>
                          <span>{p.label}</span>
                          <strong>
                            <img src={a.header.gems} alt="" />
                            {p.gems.toLocaleString()}
                          </strong>
                        </li>
                      ))}
                    </ul>

                    <div className="tn-cup__actions">
                      {unlocked ? (
                        <button
                          type="button"
                          className="tn-kit__cta"
                          disabled={busyId === tier.id || !canAfford}
                          onClick={() => {
                            setError(null);
                            setConfirmTier(tier);
                          }}
                        >
                          Enter · {tier.entryGems}
                          <img
                            src={a.header.gems}
                            alt=""
                            width={14}
                            height={14}
                            style={{ marginLeft: "0.35rem", verticalAlign: "-2px" }}
                          />
                        </button>
                      ) : (
                        <button type="button" className="tn-kit__ghost" disabled>
                          Locked
                        </button>
                      )}
                      {unlocked && !canAfford && (
                        <button type="button" className="tn-kit__ghost" onClick={() => onOpenShop?.()}>
                          Get gems
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="tn-kit__footer">
              <button type="button" className="tn-kit__ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmTier && (
        <div className="tn-confirm-overlay" role="presentation">
          <div
            className="tn-confirm"
            role="dialog"
            aria-labelledby="tournament-enter-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tournament-enter-title">Enter {confirmTier.name}?</h2>
            <p>
              Entry fee <strong>{confirmTier.entryGems}</strong> gems. Prize pool{" "}
              <strong>{confirmTier.rewardPool.toLocaleString()}</strong> gems — payouts{" "}
              {payoutAmounts(confirmTier.rewardPool)
                .map((p) => `${p.label} ${p.gems.toLocaleString()}`)
                .join(" · ")}
              .
            </p>
            <div className="tn-confirm__actions">
              <button
                type="button"
                className="tn-kit__cta"
                disabled={busyId === confirmTier.id}
                onClick={() => enterTournament(confirmTier)}
              >
                <img src={a.header.gems} alt="" width={14} height={14} />
                &nbsp;Pay {confirmTier.entryGems}
              </button>
              <button type="button" className="tn-kit__ghost" onClick={() => setConfirmTier(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
