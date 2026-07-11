interface Props {
  gems: number;
  energy: number;
  maxEnergy: number;
  stars?: number;
  onGemsClick?: () => void;
  onEnergyClick?: () => void;
}

export function ResourceBar({
  gems,
  energy,
  maxEnergy,
  stars,
  onGemsClick,
  onEnergyClick,
}: Props) {
  const GemTag = onGemsClick ? "button" : "div";
  const EnergyTag = onEnergyClick ? "button" : "div";

  return (
    <div className="royal-resource-bar" role="group" aria-label="Resources">
      <GemTag
        type={onGemsClick ? "button" : undefined}
        className="royal-resource royal-resource--gems"
        onClick={onGemsClick}
      >
        <span className="royal-resource__icon" aria-hidden>
          <img src="/assets/header/icon_gems.svg" alt="" width={14} height={14} />
        </span>
        <span className="royal-resource__val">{gems.toLocaleString()}</span>
        {onGemsClick && <span className="royal-resource__plus">+</span>}
      </GemTag>
      {stars !== undefined && (
        <div className="royal-resource royal-resource--stars">
          <span className="royal-resource__icon">★</span>
          <span className="royal-resource__val">{stars}</span>
        </div>
      )}
      <EnergyTag
        type={onEnergyClick ? "button" : undefined}
        className="royal-resource royal-resource--energy"
        onClick={onEnergyClick}
      >
        <span className="royal-resource__icon">⚡</span>
        <span className="royal-resource__val">
          {energy}/{maxEnergy}
        </span>
        {onEnergyClick && <span className="royal-resource__plus">+</span>}
      </EnergyTag>
    </div>
  );
}
