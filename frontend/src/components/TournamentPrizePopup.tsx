import { HOME_ASSETS } from "./home";

export interface PrizePopupItem {
  id: number;
  tierName: string;
  place: number;
  gems: number;
}

interface Props {
  prizes: PrizePopupItem[];
  onDismiss: () => void;
}

function placeLabel(place: number): string {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  return `#${place}`;
}

/** Shown on next home load after a cup pays out top-3 gems. */
export function TournamentPrizePopup({ prizes, onDismiss }: Props) {
  if (prizes.length === 0) return null;
  const total = prizes.reduce((s, p) => s + p.gems, 0);

  return (
    <div className="tn-confirm-overlay" role="presentation">
      <div
        className="tn-confirm tn-confirm--prize"
        role="dialog"
        aria-labelledby="tn-prize-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tn-prize-title">Cup prizes!</h2>
        <p>The last tournament period finished. Your gems are already in your wallet.</p>
        <ul className="tn-prize-list">
          {prizes.map((p) => (
            <li key={p.id}>
              <span>
                {placeLabel(p.place)} · {p.tierName}
              </span>
              <strong>
                <img src={HOME_ASSETS.header.gems} alt="" width={14} height={14} /> +{p.gems}
              </strong>
            </li>
          ))}
        </ul>
        {prizes.length > 1 && (
          <p className="tn-prize-total">
            Total <strong>+{total}</strong> gems
          </p>
        )}
        <div className="tn-confirm__actions">
          <button type="button" className="tn-kit__cta" onClick={onDismiss}>
            Nice
          </button>
        </div>
      </div>
    </div>
  );
}
