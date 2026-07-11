interface Props {
  levelLabel: string;
  progressPercent: number;
  onClick: () => void;
}

export function HomeLevelBar({ levelLabel, progressPercent, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="home-mode-card w-full"
      style={{
        background: "linear-gradient(135deg, #0E2F28, #04110F)",
        boxShadow:
          "inset 0 2px 6px rgba(255,255,255,0.15), inset 0 -4px 10px rgba(0,0,0,0.4)",
      }}
    >
      <div className="home-mode-card__body flex min-w-0 flex-1 flex-col gap-1.5">
        <strong className="home-mode-card__title text-sm">Level {levelLabel}</strong>
        <span className="home-mode-card__subtitle">Start over from level 1</span>
        <span className="home-mode-card__progress" aria-hidden>
          <span style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
        </span>
      </div>
      <span className="home-mode-card__icon text-2xl" aria-hidden>
        🧰
      </span>
    </button>
  );
}
