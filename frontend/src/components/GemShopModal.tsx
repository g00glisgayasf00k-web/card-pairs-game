import {
  ENERGY_BUY_TEN_COST,
  MAX_ENERGY,
  buyTenEnergy,
  syncEnergyState,
} from "../lib/energy";
import { GEM_SHOP_PACKS, grantGemPack } from "../lib/credits";
import { loadProgress, saveProgress } from "../lib/progress";

interface Props {
  onClose: () => void;
  onBalanceChange: () => void;
  /** When opened from the energy chip — energy offers shown first. */
  emphasizeEnergy?: boolean;
}

export function GemShopModal({ onClose, onBalanceChange, emphasizeEnergy = false }: Props) {
  const saved = loadProgress();
  const { energy } = syncEnergyState();
  const gems = saved?.credits ?? 0;
  const canBuyEnergy = energy < MAX_ENERGY && gems >= ENERGY_BUY_TEN_COST;

  const handleBuyGems = (packId: string) => {
    const amount = grantGemPack(packId);
    if (!amount || !saved) return;
    saveProgress({ ...saved, credits: saved.credits + amount });
    onBalanceChange();
  };

  const handleBuyEnergy = () => {
    if (buyTenEnergy()) onBalanceChange();
  };

  const energySection = (
    <>
      <h3 className={`specials-subtitle${emphasizeEnergy ? " specials-subtitle--alert" : ""}`}>
        Buy energy {emphasizeEnergy ? "— you need ⚡ to play" : ""}
      </h3>
      <ul className="gem-shop-list gem-shop-list--energy">
        <li className="gem-shop-pack">
          <div className="gem-shop-pack__info">
            <span className="gem-shop-pack__label">+{MAX_ENERGY} energy</span>
            <span className="gem-shop-pack__gems">{ENERGY_BUY_TEN_COST} 💎</span>
          </div>
          <button
            type="button"
            className="btn gem-shop-pack__btn"
            onClick={handleBuyEnergy}
            disabled={!canBuyEnergy}
          >
            Buy 10
          </button>
        </li>
      </ul>
    </>
  );

  const gemsSection = (
    <>
      <h3 className="specials-subtitle">Buy gems</h3>
      <p className="scores-note gem-shop-modal__note">
        Demo store — gems are added instantly. Connect real payments later.
      </p>
      <ul className="gem-shop-list">
        {GEM_SHOP_PACKS.map((pack) => (
          <li key={pack.id} className="gem-shop-pack">
            <div className="gem-shop-pack__info">
              <span className="gem-shop-pack__label">{pack.label}</span>
              <span className="gem-shop-pack__gems">+{pack.gems} 💎</span>
            </div>
            <button
              type="button"
              className="btn gem-shop-pack__btn"
              onClick={() => handleBuyGems(pack.id)}
            >
              {pack.priceLabel}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className="modal-overlay scores-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal gem-shop-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="gem-shop-title"
      >
        <h2 id="gem-shop-title">Gem shop</h2>
        <p className="scores-note gem-shop-balance">
          <span>
            Balance: <strong>{gems} 💎</strong>
          </span>
          <span className="gem-shop-balance__sep" aria-hidden>
            ·
          </span>
          <span>
            Energy: <strong>{energy}/{MAX_ENERGY} ⚡</strong>
          </span>
        </p>

        {emphasizeEnergy ? (
          <>
            {energySection}
            {gemsSection}
          </>
        ) : (
          <>
            {gemsSection}
            {energySection}
          </>
        )}

        <button type="button" className="btn scores-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
