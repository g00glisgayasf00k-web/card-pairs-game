import {
  ENERGY_BUY_TEN_COST,
  MAX_ENERGY,
  buyTenEnergy,
  syncEnergyState,
} from "../lib/energy";
import { GEM_SHOP_PACKS, grantGemPack } from "../lib/credits";
import { loadProgress, saveProgress } from "../lib/progress";
import { ResourceBar } from "./ResourceBar";

interface Props {
  onClose: () => void;
  onBalanceChange: () => void;
  emphasizeEnergy?: boolean;
}

const PACK_ICONS: Record<string, string> = {
  handful: "💎",
  pouch: "💠",
  vault: "👑",
  treasure: "🏆",
};

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

  return (
    <div className="modal-overlay scores-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal gem-shop-modal royal-shop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="gem-shop-title"
      >
        <div className="royal-shop__header">
          <div className="royal-frame" style={{ marginBottom: 0, boxShadow: "none" }}>
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

        <div className="royal-shop__body">
          {(emphasizeEnergy ? ["energy", "gems"] : ["gems", "energy"]).map((section) =>
            section === "energy" ? (
              <div key="energy" className="royal-shop-energy">
                <h3 className={`specials-subtitle${emphasizeEnergy ? " specials-subtitle--alert" : ""}`}>
                  {emphasizeEnergy ? "Need energy to play" : "Refill energy"}
                </h3>
                <div className="royal-shop-card">
                  <span className="royal-shop-card__icon">⚡</span>
                  <div className="royal-shop-card__meta">
                    <span className="royal-shop-card__label">+{MAX_ENERGY} energy</span>
                    <span className="royal-shop-card__detail">Full refill for one session</span>
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
              </div>
            ) : (
              <div key="gems">
                <h3 className="specials-subtitle">Buy gems</h3>
                <p className="scores-note gem-shop-modal__note">
                  Demo store — connect real payments later.
                </p>
                <ul className="royal-shop-grid">
                  {GEM_SHOP_PACKS.map((pack) => (
                    <li key={pack.id} className="royal-shop-card">
                      <span className="royal-shop-card__icon">{PACK_ICONS[pack.id] ?? "💎"}</span>
                      <span className="royal-shop-card__label">{pack.label}</span>
                      <span className="royal-shop-card__detail">+{pack.gems} gems</span>
                      <button
                        type="button"
                        className="royal-shop-card__btn"
                        onClick={() => handleBuyGems(pack.id)}
                      >
                        {pack.priceLabel}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>

        <button type="button" className="btn scores-close royal-shop-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
