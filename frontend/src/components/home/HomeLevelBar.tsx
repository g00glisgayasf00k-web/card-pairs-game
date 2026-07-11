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
      className="flex w-full items-center gap-3 rounded-home-card border border-home-text/10 bg-home-bg px-4 py-3 text-left"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <strong className="text-sm font-extrabold tracking-wide text-home-text uppercase">
          Level {levelLabel}
        </strong>
        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-home-grad-bottom">
          <span
            className="block h-full rounded-full bg-home-gold"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />
        </span>
      </div>
      <span className="text-2xl" aria-hidden>
        🧰
      </span>
    </button>
  );
}
