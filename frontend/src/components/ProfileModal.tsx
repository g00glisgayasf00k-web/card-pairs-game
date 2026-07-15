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
import { ContactSupportSection } from "./ContactSupportSection";
import { HOME_ASSETS, HomeKitShell } from "./home";
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
    <HomeKitShell
      tone="settings"
      title="Settings"
      lead="Account, energy, gems, and campaign progress."
      brandIcon={HOME_ASSETS.nav.settings}
      chip={
        <span className="hk-kit__chip">
          <img src={HOME_ASSETS.header.profile} alt="" />
          {username ?? "Guest"}
        </span>
      }
      onClose={onClose}
    >
      <div className="profile-modal hk-kit__panel" style={{ padding: 0, border: "none", background: "transparent" }}>
        <div className="profile-modal__hero">
          <img
            src={HOME_ASSETS.header.profile}
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: "999px" }}
          />
          <div>
            <p className="profile-modal__name">{username ?? "Guest player"}</p>
            <p className="profile-modal__sub">Royal Poker Match</p>
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
              <strong>
                {energy} / {MAX_ENERGY} energy
              </strong>
              <span className="profile-stats__hint">
                {nextEnergyIn
                  ? `+1 every 2 hours · next in ${nextEnergyIn}`
                  : "Full — each level attempt costs 1 energy"}
              </span>
            </span>
          </li>
          <li>
            <span className="profile-stats__icon">
              <img src={HOME_ASSETS.header.gems} alt="" width={16} height={16} />
            </span>
            <span>
              <strong>{saved?.credits ?? 0} gems</strong>
              <span className="profile-stats__hint">Tap gems on home to open the shop</span>
            </span>
          </li>
          <li>
            <span className="profile-stats__icon">
              <img src={HOME_ASSETS.home.levelBadge} alt="" width={16} height={16} />
            </span>
            <span>
              <strong>
                {completed} / {MAX_LEVEL} levels cleared
              </strong>
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

        <ContactSupportSection />

        <p className="profile-modal__version">Version {__APP_VERSION__}</p>
      </div>
    </HomeKitShell>
  );
}
