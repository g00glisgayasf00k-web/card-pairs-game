import { HAND_DISPLAY } from "../lib/pokerHands";
import { MAX_LEVEL } from "../lib/levels";
import {
  MAX_ENERGY,
  formatTimeUntilUkMidnight,
  syncEnergyState,
} from "../lib/energy";
import { countCompleted, countTotalStars } from "../lib/levelProgress";
import { loadProgress } from "../lib/progress";
import { ProfileAccountSection } from "./ProfileAccountSection";

interface Props {
  username: string | null;
  onClose: () => void;
  onAccountChange?: () => void;
}

export function ProfileModal({ username, onClose, onAccountChange }: Props) {
  const saved = loadProgress();
  const { energy } = syncEnergyState();
  const completed = countCompleted();
  const stars = countTotalStars();
  const resetIn = formatTimeUntilUkMidnight();

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

        <ProfileAccountSection displayName={username} onAccountChange={onAccountChange} />

        <ul className="profile-stats">
          <li>
            <span className="profile-stats__icon">⚡</span>
            <span>
              <strong>{energy} / {MAX_ENERGY} energy</strong>
              <span className="profile-stats__hint">Refills to {MAX_ENERGY} at midnight UK · {resetIn} left</span>
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
      </div>
    </div>
  );
}
