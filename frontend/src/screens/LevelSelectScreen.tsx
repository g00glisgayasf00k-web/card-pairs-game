import { useCallback, useEffect, useRef, useState } from "react";
import {
  allWorlds,
  formatLevelId,
  STAGES_PER_WORLD,
  stagesInWorld,
  toGlobalLevel,
  TOTAL_LEVELS,
  worldShortName,
  worldTitle,
  type LevelNodeState,
} from "../lib/levelMap";
import {
  buildPathSegments,
  buildWorldMapPoints,
  chipPaletteForStage,
  mapViewBoxHeight,
  pathThrough,
  progressIndexInWorld,
  type ChipPalette,
} from "../lib/mapLayout";
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
  palette: ChipPalette;
  isMilestone: boolean;
  state: LevelNodeState;
  isCurrent: boolean;
  stars: number;
  onSelect: (globalLevel: number) => void;
}

function LevelChip({
  globalLevel,
  palette,
  isMilestone,
  state,
  isCurrent,
  stars,
  onSelect,
}: LevelChipProps) {
  const label = formatLevelId(globalLevel);
  const locked = state === "locked";
  const completed = state === "completed";

  return (
    <div className={`map-node${isMilestone ? " map-node--milestone" : ""}`}>
      {isCurrent && (
        <span className="level-chip__avatar" aria-hidden>
          🕵️
        </span>
      )}
      <button
        type="button"
        className={[
          "level-chip",
          `level-chip--${palette}`,
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
        <span className="level-chip__edge" aria-hidden />
        {locked ? (
          <span className="level-chip__lock" aria-hidden>
            <span className="level-chip__lock-icon">🔒</span>
          </span>
        ) : (
          <span className="level-chip__face">
            <span className="level-chip__label">{label}</span>
            {completed && <span className="level-chip__check">✓</span>}
          </span>
        )}
      </button>
      {!locked && <StarRating stars={stars} />}
    </div>
  );
}

function PixelMapPath({
  points,
  segments,
  progressIndex,
  viewHeight,
}: {
  points: ReturnType<typeof buildWorldMapPoints>;
  segments: ReturnType<typeof buildPathSegments>;
  progressIndex: number;
  viewHeight: number;
}) {
  const fullPath = pathThrough(points);
  const litCount = progressIndex >= 0 ? progressIndex + 1 : 0;
  const litPoints = points.slice(0, Math.min(litCount, points.length));
  const progressPath = litPoints.length >= 2 ? pathThrough(litPoints) : "";

  let tileIndex = 0;
  const litTileLimit = progressIndex >= 0 ? progressIndex * 4 + 4 : 0;

  return (
    <svg
      className="map-path-svg"
      viewBox={`0 0 100 ${viewHeight}`}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden
    >
      <path className="map-path map-path--shadow" d={fullPath} />
      <path className="map-path map-path--stone" d={fullPath} />
      {progressPath && <path className="map-path map-path--active" d={progressPath} />}

      {segments.map((seg) =>
        seg.tiles.map((pt) => {
          const idx = tileIndex++;
          const lit = idx < litTileLimit;
          return (
            <rect
              key={`tile-${seg.from}-${idx}`}
              className={`map-stone-tile${lit ? " map-stone-tile--lit" : ""}`}
              x={pt.x - 1.8}
              y={pt.y - 1.8}
              width={3.6}
              height={3.6}
            />
          );
        })
      )}
    </svg>
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
  const nextWorldUnlocked = nextWorld <= 10 && isWorldUnlocked(nextWorld);

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

  const mapPoints = buildWorldMapPoints();
  const mapSegments = buildPathSegments(mapPoints);
  const mapHeight = mapViewBoxHeight();
  const pathProgress = progressIndexInWorld(selectedWorld, currentLevel);
  const currentInWorld = worldForLevel(currentLevel) === selectedWorld;

  return (
    <div className="level-select-screen level-select-screen--pixel">
      <div className="mobile-shell mobile-shell--levels">
        <header className="levels-hero levels-hero--pixel">
          <button type="button" className="levels-back" onClick={onBack} aria-label="Back">
            ←
          </button>
          <p className="levels-subtitle levels-subtitle--pixel">
            {completedCount}/{TOTAL_LEVELS} · {totalStars} ★
          </p>
          <div className="levels-hero__spacer" aria-hidden />
        </header>

        <nav className="world-tabs world-tabs--pixel" aria-label="World selection">
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
                <span className="world-tab__num">{world}</span>
              </button>
            );
          })}
        </nav>

        <div className="level-map-scroll">
          <div className="level-map level-map--pixel" style={{ aspectRatio: `100 / ${mapHeight}` }}>
            <PixelMapPath
              points={mapPoints}
              segments={mapSegments}
              progressIndex={pathProgress}
              viewHeight={mapHeight}
            />

            <div className="pixel-map-sign pixel-map-sign--world" aria-hidden>
              <span className="pixel-map-sign__post" />
              <span className="pixel-map-sign__board">
                WORLD {selectedWorld}: {worldShortName(selectedWorld).toUpperCase()}
              </span>
            </div>

            <div className="pixel-map-hud" role="status">
              <div className="pixel-map-hud__row">
                <span className="pixel-map-hud__icon">🏆</span>
                <span className="pixel-map-hud__label">SCORE</span>
              </div>
              <div className="pixel-map-hud__stars">{totalStars} ★</div>
              {currentInWorld && (
                <div className="pixel-map-hud__next">
                  NEXT: {formatLevelId(currentLevel)}
                </div>
              )}
            </div>

            {nextWorldUnlocked && selectedWorld < 10 && (
              <button
                type="button"
                className="pixel-map-sign pixel-map-sign--next"
                onClick={() => setSelectedWorld(nextWorld)}
                aria-label={`Go to ${worldTitle(nextWorld)}`}
              >
                <span className="pixel-map-sign__post" />
                <span className="pixel-map-sign__board pixel-map-sign__board--arrow">
                  TO WORLD {nextWorld}: {worldShortName(nextWorld).toUpperCase()} →
                </span>
              </button>
            )}

            <div className="map-nodes">
              {stagesInWorld(selectedWorld).map((stage, index) => {
                const globalLevel = toGlobalLevel(selectedWorld, stage);
                const state = getLevelNodeState(globalLevel);
                const isCurrent = globalLevel === currentLevel;
                const isMilestone = stage === STAGES_PER_WORLD;
                const pt = mapPoints[index]!;

                return (
                  <div
                    key={globalLevel}
                    ref={isCurrent ? currentRef : undefined}
                    className="map-node-slot"
                    style={{
                      left: `${pt.x}%`,
                      top: `${(pt.y / mapHeight) * 100}%`,
                    }}
                  >
                    <LevelChip
                      globalLevel={globalLevel}
                      palette={chipPaletteForStage(stage)}
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
          </div>

          {nextWorldLocked && selectedWorld < 10 && (
            <div className="world-gate world-gate--pixel">
              <div className="pixel-map-sign pixel-map-sign--gate" aria-hidden>
                <span className="pixel-map-sign__post" />
                <span className="pixel-map-sign__board">
                  🔒 WORLD {nextWorld}: {worldShortName(nextWorld).toUpperCase()}
                </span>
              </div>
              <p className="world-gate__bar-text">
                {countStarsInWorld(selectedWorld)} / {starsToUnlockWorld(nextWorld)} ★ to unlock
              </p>
            </div>
          )}
        </div>

        <footer className="levels-footer">
          <button
            type="button"
            className="levels-start-btn levels-start-btn--pixel"
            onClick={handleStart}
            disabled={!isLevelPlayable(currentLevel)}
          >
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
