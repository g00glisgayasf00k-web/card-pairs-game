import { HAND_DISPLAY } from "../lib/pokerHands";
import { MAX_LEVEL } from "../lib/levels";
import {
  MAX_ENERGY,
  formatTimeUntilNextEnergy,
  syncEnergyState,
} from "../lib/energy";
import { countCompleted, countTotalStars } from "../lib/levelProgress";
import { loadProgress } from "../lib/progress";
import { ProfileAccountSection } from "./ProfileAccountSection";
import { useEffect, useState } from "react";

interface Props {
  username: string | null;
  onClose: () => void;
  onAccountChange?: () => void;
  onSignOut?: () => void;
}

export function ProfileModal({ username, onClose, onAccountChange, onSignOut }: Props) {
  const saved = loadProgress();
  const [energyState, setEnergyState] = useState(syncEnergyState);

  useEffect(() => {
    setEnergyState(syncEnergyState());
    const id = window.setInterval(() => setEnergyState(syncEnergyState()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { energy, energyRegenAt } = energyState;
  const completed = countCompleted();
  const stars = countTotalStars();
  const nextEnergyIn =
    energy >= MAX_ENERGY ? null : formatTimeUntilNextEnergy(energyRegenAt);

  return (
    <div className="modal-overlay scores-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="profile-title"
      >
        <h2 id="profile-title">Your profile</h2>

        <div className="profile-modal__hero">
          <span className="profile-modal__avatar" aria-hidden>
            👤
          </span>
          <div>
            <p className="profile-modal__name">{username ?? "Guest player"}</p>
            <p className="profile-modal__sub">Royal Match Poker</p>
          </div>
        </div>

        <ProfileAccountSection
          displayName={username}
          onAccountChange={onAccountChange}
          onSignOut={onSignOut}
        />

        <ul className="profile-stats">
          <li>
            <span className="profile-stats__icon">⚡</span>
            <span>
              <strong>{energy} / {MAX_ENERGY} energy</strong>
              <span className="profile-stats__hint">
                {nextEnergyIn
                  ? `+1 every 2 hours · next in ${nextEnergyIn}`
                  : "Full — each level attempt costs 1 energy"}
              </span>
            </span>
          </li>
          <li>
            <span className="profile-stats__icon">💎</span>
            <span>
              <strong>{saved?.credits ?? 0} gems</strong>
              <span className="profile-stats__hint">Tap gems in-game to buy more</span>
            </span>
          </li>
          <li>
            <span className="profile-stats__icon">🗺️</span>
            <span>
              <strong>{completed} / {MAX_LEVEL} levels cleared</strong>
            </span>
          </li>
          <li>
            <span className="profile-stats__icon">★</span>
            <span>
              <strong>{stars} stars earned</strong>
            </span>
          </li>
          <li>
            <span className="profile-stats__icon">🃏</span>
            <span>
              <strong>{saved?.handsCleared ?? 0} hands cleared</strong>
              <span className="profile-stats__hint">
                Best hand: {saved ? HAND_DISPLAY[saved.bestHand] : "—"}
              </span>
            </span>
          </li>
        </ul>

        <button type="button" className="btn scores-close" onClick={onClose}>
          Close
        </button>

        <p className="profile-modal__version">Version {__APP_VERSION__}</p>
      </div>
    </div>
  );
}
