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
      setError(`Need ${tier.entryGems}💎 — you have ${saved.credits}💎.`);
      return;
    }
    setBusyId(tier.id);
    saveProgress({
      ...saved,
      credits: saved.credits - tier.entryGems,
    });
    setConfirmTier(null);
    setInfo(`Entered ${tier.name}! Top 3 share ${tier.rewardPool.toLocaleString()}💎.`);
    setBusyId(null);
    refresh();
    onBalanceChange?.();
  };

  return (
    <>
      <div className="modal-overlay scores-overlay home-menu-overlay" onClick={onClose} role="presentation">
        <div
          className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal play-mode-modal--compete"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="tournament-title"
        >
          <header className="play-mode-modal__header">
            <h2 id="tournament-title">Tournament</h2>
            <p className="play-mode-modal__lead">
              Pick a cup — pay the entry fee, climb the board, and take a share of the prize pool.
            </p>
            <p className="play-mode-modal__hint">
              Your gems: {gems.toLocaleString()}💎 · Top 3 split 50% / 30% / 20%
            </p>
          </header>

          <div className="play-mode-modal__body tournament-list">
            {error && <p className="play-mode-modal__error">{error}</p>}
            {info && <p className="play-mode-modal__note">{info}</p>}

            {TOURNAMENT_TIERS.map((tier) => {
              const unlocked = isTournamentUnlocked(tier);
              const payouts = payoutAmounts(tier.rewardPool);
              const canAfford = gems >= tier.entryGems;
              return (
                <article
                  key={tier.id}
                  className={`tournament-tier${unlocked ? "" : " tournament-tier--locked"}`}
                >
                  <div className="tournament-tier__head">
                    <div>
                      <span className="tournament-tier__name">{tier.name}</span>
                      <span className="tournament-tier__unlock">
                        {unlocked
                          ? "Unlocked"
                          : `Locked · clear Solo ${unlockLabel(tier)}`}
                      </span>
                    </div>
                    <span className="tournament-tier__pool">
                      {tier.rewardPool.toLocaleString()}💎
                    </span>
                  </div>

                  <ul className="tournament-tier__payouts">
                    {payouts.map((p) => (
                      <li key={p.place}>
                        <span>{p.label}</span>
                        <strong>{p.gems.toLocaleString()}💎</strong>
                      </li>
                    ))}
                  </ul>

                  <div className="tournament-tier__actions">
                    {unlocked ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busyId === tier.id || !canAfford}
                        onClick={() => {
                          setError(null);
                          setConfirmTier(tier);
                        }}
                      >
                        Enter · {tier.entryGems}💎
                      </button>
                    ) : (
                      <button type="button" className="btn scores-close" disabled>
                        Locked
                      </button>
                    )}
                    {unlocked && !canAfford && (
                      <button
                        type="button"
                        className="play-mode-wager"
                        onClick={() => onOpenShop?.()}
                      >
                        Get gems
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <footer className="play-mode-modal__footer">
            <button type="button" className="btn scores-close" onClick={onClose}>
              Close
            </button>
          </footer>
        </div>
      </div>

      {confirmTier && (
        <div className="modal-overlay scores-overlay" role="presentation">
          <div
            className="modal scores-modal"
            role="dialog"
            aria-labelledby="tournament-enter-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="tournament-enter-title">Enter {confirmTier.name}?</h2>
            <p>
              Entry fee <strong>{confirmTier.entryGems}💎</strong>. Prize pool{" "}
              <strong>{confirmTier.rewardPool.toLocaleString()}💎</strong> for the top 3
              (50% / 30% / 20%).
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-primary"
                disabled={busyId === confirmTier.id}
                onClick={() => enterTournament(confirmTier)}
              >
                <img src={HOME_ASSETS.header.gems} alt="" width={14} height={14} />
                &nbsp;Pay {confirmTier.entryGems}💎
              </button>
              <button
                type="button"
                className="btn scores-close"
                onClick={() => setConfirmTier(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
