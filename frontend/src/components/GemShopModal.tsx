import {
  ENERGY_BUY_ONE_COST,
  ENERGY_REFILL_ALL_COST,
  MAX_ENERGY,
  buyFullEnergyRefill,
  buyOneEnergy,
  syncEnergyState,
} from "../lib/energy";
import {
  GEM_SHOP_PACKS,
  grantGemPack,
} from "../lib/credits";
import { loadProgress, saveProgress } from "../lib/progress";

interface Props {
  onClose: () => void;
  onBalanceChange: () => void;
  /** When opened because the player is out of energy. */
  emphasizeEnergy?: boolean;
}

export function GemShopModal({ onClose, onBalanceChange, emphasizeEnergy = false }: Props) {
  const saved = loadProgress();
  const { energy } = syncEnergyState();
  const gems = saved?.credits ?? 0;
  const canBuyOne = energy < MAX_ENERGY && gems >= ENERGY_BUY_ONE_COST;
  const canRefillAll = energy < MAX_ENERGY && gems >= ENERGY_REFILL_ALL_COST;

  const handleBuyGems = (packId: string) => {
    const amount = grantGemPack(packId);
    if (!amount || !saved) return;
    saveProgress({ ...saved, credits: saved.credits + amount });
    onBalanceChange();
  };

  const handleBuyEnergy = () => {
    if (buyOneEnergy()) onBalanceChange();
  };

  const handleRefillEnergy = () => {
    if (buyFullEnergyRefill()) onBalanceChange();
  };

  return (
    <div className="modal-overlay scores-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal gem-shop-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="gem-shop-title"
      >
        <h2 id="gem-shop-title">Gem shop</h2>
        <p className="scores-note">
          Balance: <strong>{gems} 💎</strong> · Energy: <strong>{energy}/{MAX_ENERGY} ⚡</strong>
        </p>

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

        <h3 className={`specials-subtitle${emphasizeEnergy ? " specials-subtitle--alert" : ""}`}>
          Buy energy {emphasizeEnergy ? "— you need ⚡ to play" : ""}
        </h3>
        <ul className="gem-shop-list gem-shop-list--energy">
          <li className="gem-shop-pack">
            <div className="gem-shop-pack__info">
              <span className="gem-shop-pack__label">+1 energy</span>
              <span className="gem-shop-pack__gems">{ENERGY_BUY_ONE_COST} 💎</span>
            </div>
            <button
              type="button"
              className="btn gem-shop-pack__btn"
              onClick={handleBuyEnergy}
              disabled={!canBuyOne}
            >
              Buy
            </button>
          </li>
          <li className="gem-shop-pack">
            <div className="gem-shop-pack__info">
              <span className="gem-shop-pack__label">Refill to {MAX_ENERGY}</span>
              <span className="gem-shop-pack__gems">{ENERGY_REFILL_ALL_COST} 💎</span>
            </div>
            <button
              type="button"
              className="btn gem-shop-pack__btn"
              onClick={handleRefillEnergy}
              disabled={!canRefillAll}
            >
              Refill
            </button>
          </li>
        </ul>

        <button type="button" className="btn scores-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
