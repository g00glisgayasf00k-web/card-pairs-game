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
  countStarsInWorld,
  countTotalStars,
  getCurrentLevel,
  getLevelNodeState,
  getLevelStars,
  isLevelPlayable,
  isWorldUnlocked,
  starsToUnlockWorld,
  worldForLevel,
} from "../lib/levelProgress";

interface Props {
  onBack: () => void;
  onSelectLevel: (globalLevel: number) => void;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="chip-stars" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`chip-star${i <= stars ? " chip-star--lit" : ""}${i <= stars && stars === 3 ? " chip-star--gold" : ""}`}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

interface LevelChipProps {
  globalLevel: number;
  side: "left" | "center" | "right";
  isMilestone: boolean;
  state: LevelNodeState;
  isCurrent: boolean;
  stars: number;
  onSelect: (globalLevel: number) => void;
}

function LevelChip({
  globalLevel,
  side,
  isMilestone,
  state,
  isCurrent,
  stars,
  onSelect,
}: LevelChipProps) {
  const label = formatLevelId(globalLevel);
  const locked = state === "locked";

  return (
    <div className={`map-row map-row--${side}${isMilestone ? " map-row--milestone" : ""}`}>
      <div className="map-row__inner">
        <button
          type="button"
          className={[
            "level-chip",
            isMilestone ? "level-chip--milestone" : "",
            `level-chip--${state}`,
            isCurrent ? "level-chip--current" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={locked}
          onClick={() => onSelect(globalLevel)}
          aria-label={locked ? `${label} locked` : `Play level ${label}`}
        >
          <span className="level-chip__rim" aria-hidden />
          {locked ? (
            <span className="level-chip__lock" aria-hidden>
              <span className="level-chip__lock-icon">🔒</span>
              <span className="level-chip__lock-label">{label}</span>
            </span>
          ) : (
            <span className="level-chip__face">
              <span className="level-chip__label">{label}</span>
            </span>
          )}
        </button>
        {!locked && <StarRating stars={stars} />}
      </div>
    </div>
  );
}

export function LevelSelectScreen({ onBack, onSelectLevel }: Props) {
  const currentLevel = getCurrentLevel();
  const [selectedWorld, setSelectedWorld] = useState(() => worldForLevel(currentLevel));
  const [tick, setTick] = useState(0);
  const currentRef = useRef<HTMLDivElement>(null);

  const completedCount = countCompleted();
  const totalStars = countTotalStars();
  const nextWorld = selectedWorld + 1;
  const nextWorldLocked = nextWorld <= 10 && !isWorldUnlocked(nextWorld);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (worldForLevel(currentLevel) !== selectedWorld) return;
    const el = currentRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [tick, currentLevel, selectedWorld]);

  const handleSelect = (globalLevel: number) => {
    if (!isLevelPlayable(globalLevel)) return;
    onSelectLevel(globalLevel);
  };

  const handleStart = () => {
    if (isLevelPlayable(currentLevel)) {
      onSelectLevel(currentLevel);
    }
  };

  return (
    <div className="level-select-screen">
      <div className="level-select-sparkles" aria-hidden />

      <div className="mobile-shell mobile-shell--levels">
        <header className="levels-hero">
          <button type="button" className="levels-back" onClick={onBack} aria-label="Back">
            ←
          </button>

          <div className="levels-title-wrap">
            <div className="levels-title-deco" aria-hidden>
              <span className="levels-deco-card levels-deco-card--1">A♠</span>
              <span className="levels-deco-card levels-deco-card--2">A♥</span>
              <span className="levels-deco-coin">🪙</span>
            </div>
            <div className="levels-title-banner">
              <span className="levels-title-banner__wing levels-title-banner__wing--l">♠</span>
              <h1 className="levels-title-banner__text">LEVELS</h1>
              <span className="levels-title-banner__wing levels-title-banner__wing--r">♥</span>
            </div>
            <p className="levels-subtitle">
              {completedCount} / {TOTAL_LEVELS} cleared · {totalStars} ★
            </p>
          </div>

          <div className="levels-hero__spacer" aria-hidden />
        </header>

        <nav className="world-tabs" aria-label="World selection">
          {allWorlds().map((world) => {
            const unlocked = isWorldUnlocked(world);
            return (
              <button
                key={world}
                type="button"
                className={`world-tab${selectedWorld === world ? " world-tab--active" : ""}${!unlocked ? " world-tab--locked" : ""}`}
                disabled={!unlocked}
                onClick={() => setSelectedWorld(world)}
                aria-label={`${worldTitle(world)}${!unlocked ? " locked" : ""}`}
              >
                <span className="world-tab__suit" aria-hidden>
                  {world % 2 === 0 ? "♦" : "♣"}
                </span>
                <span className="world-tab__num">{world}</span>
              </button>
            );
          })}
        </nav>

        <div className="world-ribbon">
          <span className="world-ribbon__fold world-ribbon__fold--l" aria-hidden />
          <h2 className="world-ribbon__text">{worldTitle(selectedWorld)}</h2>
          <span className="world-ribbon__fold world-ribbon__fold--r" aria-hidden />
        </div>

        <div className="level-map-scroll">
          <div className="level-map">
            <svg className="map-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#7dffba" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                className="map-path-glow"
                d="M 50 2 Q 22 18 50 28 Q 78 38 50 48 Q 22 58 50 68 Q 78 78 50 88 Q 22 94 50 98"
                fill="none"
                stroke="url(#pathGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>

            <div className="map-nodes">
              {stagesInWorld(selectedWorld).map((stage, index) => {
                const globalLevel = toGlobalLevel(selectedWorld, stage);
                const state = getLevelNodeState(globalLevel);
                const isCurrent = globalLevel === currentLevel;
                const side =
                  index % 3 === 0 ? "left" : index % 3 === 1 ? "center" : "right";
                const isMilestone = stage === STAGES_PER_WORLD;

                return (
                  <div
                    key={globalLevel}
                    ref={isCurrent ? currentRef : undefined}
                    className="map-node-slot"
                  >
                    <LevelChip
                      globalLevel={globalLevel}
                      side={side}
                      isMilestone={isMilestone}
                      state={state}
                      isCurrent={isCurrent}
                      stars={getLevelStars(globalLevel)}
                      onSelect={handleSelect}
                    />
                  </div>
                );
              })}
            </div>

            {nextWorldLocked && selectedWorld < 10 && (
              <div className="world-gate">
                <div className="world-gate__icon" aria-hidden>
                  <span className="world-gate__shield">🛡️</span>
                  <span className="world-gate__lock">🔒</span>
                  <span className="world-gate__star">⭐</span>
                </div>
                <div className="world-gate__bar">
                  <span className="world-gate__bar-lock" aria-hidden>🔒</span>
                  <span className="world-gate__bar-text">
                    {countStarsInWorld(selectedWorld)} / {starsToUnlockWorld(nextWorld)} ★ to unlock{" "}
                    {worldTitle(nextWorld)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="levels-footer">
          <button
            type="button"
            className="levels-start-btn"
            onClick={handleStart}
            disabled={!isLevelPlayable(currentLevel)}
          >
            <span className="levels-start-btn__glow" aria-hidden />
            <span className="levels-start-btn__text">START</span>
            <span className="levels-start-btn__sub">
              Level {formatLevelId(currentLevel)}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}
