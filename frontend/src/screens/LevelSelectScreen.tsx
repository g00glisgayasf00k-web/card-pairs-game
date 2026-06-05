import { useCallback, useEffect, useRef, useState } from "react";
import {
  allWorlds,
  formatLevelId,
  STAGES_PER_WORLD,
  stagesInWorld,
  toGlobalLevel,
  TOTAL_LEVELS,
  worldTitle,
  type LevelNodeState,
} from "../lib/levelMap";
import {
  countCompleted,
  getCurrentLevel,
  getLevelNodeState,
  isLevelPlayable,
} from "../lib/levelProgress";

interface Props {
  onBack: () => void;
  onSelectLevel: (globalLevel: number) => void;
}

interface LevelNodeProps {
  globalLevel: number;
  side: "left" | "right" | "center";
  isMilestone: boolean;
  state: LevelNodeState;
  isCurrent: boolean;
  onSelect: (globalLevel: number) => void;
}

function LevelNode({ globalLevel, side, isMilestone, state, isCurrent, onSelect }: LevelNodeProps) {
  const label = formatLevelId(globalLevel);
  const locked = state === "locked";
  const completed = state === "completed";

  return (
    <div className={`level-path__row level-path__row--${side}`}>
      <div className="level-path__connector" aria-hidden />
      <button
        type="button"
        className={[
          "level-node",
          isMilestone ? "level-node--milestone" : "",
          `level-node--${state}`,
          isCurrent ? "level-node--current" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={locked}
        onClick={() => onSelect(globalLevel)}
        aria-label={
          locked
            ? `${label} locked`
            : completed
              ? `${label} completed`
              : `Play level ${label}`
        }
      >
        {locked && <span className="level-node__lock" aria-hidden>🔒</span>}
        {completed && !locked && <span className="level-node__check" aria-hidden>✓</span>}
        <span className="level-node__label">{label}</span>
        {isMilestone && !locked && <span className="level-node__crown" aria-hidden>👑</span>}
      </button>
    </div>
  );
}

export function LevelSelectScreen({ onBack, onSelectLevel }: Props) {
  const [tick, setTick] = useState(0);
  const currentRef = useRef<HTMLDivElement>(null);
  const completedCount = countCompleted();
  const currentLevel = getCurrentLevel();

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const el = currentRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [tick, currentLevel]);

  const handleSelect = (globalLevel: number) => {
    if (!isLevelPlayable(globalLevel)) return;
    onSelectLevel(globalLevel);
  };

  return (
    <div className="level-select-screen">
      <div className="mobile-shell mobile-shell--levels">
        <header className="level-select-header">
          <button type="button" className="level-select-back" onClick={onBack} aria-label="Back">
            ←
          </button>
          <div className="level-select-header__center">
            <h1 className="level-select-header__title">Levels</h1>
            <p className="level-select-header__progress">
              {completedCount} / {TOTAL_LEVELS} completed
            </p>
          </div>
          <div className="level-select-header__spacer" aria-hidden />
        </header>

        <div className="level-map-scroll">
          <div className="level-map">
            {allWorlds().map((world) => (
              <section key={world} className="world-section">
                <div className="world-banner">
                  <span className="world-banner__glow" aria-hidden />
                  <h2 className="world-banner__title">{worldTitle(world)}</h2>
                  <span className="world-banner__range">
                    {world}-1 – {world}-10
                  </span>
                </div>

                <div className="level-path">
                  {stagesInWorld(world).map((stage, index) => {
                    const globalLevel = toGlobalLevel(world, stage);
                    const state = getLevelNodeState(globalLevel);
                    const isCurrent = globalLevel === currentLevel;
                    const side =
                      index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right";
                    const isMilestone = stage === STAGES_PER_WORLD;

                    return (
                      <div
                        key={globalLevel}
                        ref={isCurrent ? currentRef : undefined}
                        className="level-path__step"
                      >
                        <LevelNode
                          globalLevel={globalLevel}
                          side={side}
                          isMilestone={isMilestone}
                          state={state}
                          isCurrent={isCurrent}
                          onSelect={handleSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            <div className="level-map__end">
              <span className="level-map__end-icon">🏆</span>
              <p>Master all 100 levels</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
