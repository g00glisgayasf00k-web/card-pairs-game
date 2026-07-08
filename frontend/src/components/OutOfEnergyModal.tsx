import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ENERGY_BUY_TEN_COST,
  MAX_ENERGY,
  buyTenEnergy,
  formatTimeUntilNextEnergy,
  syncEnergyState,
} from "../lib/energy";
import { loadProgress } from "../lib/progress";

interface Props {
  /** Dismiss the popup without acting. */
  onClose: () => void;
  /** Called once energy is available again (bought or regenerated). */
  onRefilled: () => void;
  /** Open the full treasury (video rewards, gem packs, etc). */
  onOpenTreasury: () => void;
}

export function OutOfEnergyModal({ onClose, onRefilled, onOpenTreasury }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { energy, energyRegenAt } = syncEnergyState();
  const gems = loadProgress()?.credits ?? 0;
  const canRefill = gems >= ENERGY_BUY_TEN_COST && energy < MAX_ENERGY;
  const nextIn = formatTimeUntilNextEnergy(energyRegenAt);

  // Energy regenerated while the popup was open — resume automatically.
  useEffect(() => {
    if (energy >= 1) onRefilled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energy]);

  const handleRefill = () => {
    if (buyTenEnergy()) onRefilled();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-overlay scores-overlay out-of-energy-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal scores-modal out-of-energy"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="oo-energy-title"
      >
        <div className="out-of-energy__icon" aria-hidden>
          ⚡
        </div>
        <h2 id="oo-energy-title">Out of energy</h2>
        <p className="out-of-energy__lead">
          You&apos;ve used all your energy. Each level attempt costs 1&nbsp;⚡.
        </p>

        <div className="out-of-energy__timer">
          <span className="out-of-energy__timer-label">Next ⚡ in</span>
          <span className="out-of-energy__timer-val">{nextIn || "soon"}</span>
          <span className="out-of-energy__timer-sub">Refills 1 every 2 hours · max {MAX_ENERGY}</span>
        </div>

        <div className="out-of-energy__actions">
          <button
            type="button"
            className="btn out-of-energy__refill"
            onClick={handleRefill}
            disabled={!canRefill}
          >
            Refill to {MAX_ENERGY} · {ENERGY_BUY_TEN_COST} 💎
          </button>
          {!canRefill && (
            <p className="out-of-energy__note">
              You have {gems} 💎 — you need {ENERGY_BUY_TEN_COST} for a full refill.
            </p>
          )}
          <button type="button" className="btn ghost" onClick={onOpenTreasury}>
            More ways to get energy
          </button>
          <button type="button" className="btn ghost out-of-energy__back" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
