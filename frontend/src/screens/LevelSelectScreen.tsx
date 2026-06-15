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
  buildWorldMapPoints,
  mapViewBoxHeight,
  progressIndexInWorld,
  smoothPathThrough,
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
import { canBeginLevelAttempt } from "../lib/levelAttempt";
import { MAX_ENERGY, syncEnergyState } from "../lib/energy";
import { loadProgress } from "../lib/progress";
import { GemShopModal } from "../components/GemShopModal";
import { ResourceBar } from "../components/ResourceBar";

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
  isMilestone: boolean;
  state: LevelNodeState;
  isCurrent: boolean;
  stars: number;
  onSelect: (globalLevel: number) => void;
}

function LevelChip({
  globalLevel,
  isMilestone,
  state,
  isCurrent,
  stars,
  onSelect,
}: LevelChipProps) {
  const label = formatLevelId(globalLevel);
  const locked = state === "locked";

  return (
    <div className={`map-node${isMilestone ? " map-node--milestone" : ""}`}>
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
  );
}

function WorldMapPath({
  points,
  progressIndex,
  viewHeight,
}: {
  points: ReturnType<typeof buildWorldMapPoints>;
  progressIndex: number;
  viewHeight: number;
}) {
  const fullPath = smoothPathThrough(points);
  const litCount = progressIndex >= 0 ? progressIndex + 1 : 0;
  const litPoints = points.slice(0, Math.min(litCount, points.length));
  const progressPath = litPoints.length >= 2 ? smoothPathThrough(litPoints) : "";

  return (
    <svg
      className="map-path-svg"
      viewBox={`0 0 100 ${viewHeight}`}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden
    >
      <path className="map-path map-path--track" d={fullPath} />
      {progressPath && <path className="map-path map-path--active" d={progressPath} />}
    </svg>
  );
}

export function LevelSelectScreen({ onBack, onSelectLevel }: Props) {
  const currentLevel = getCurrentLevel();
  const [selectedWorld, setSelectedWorld] = useState(() => worldForLevel(currentLevel));
  const [tick, setTick] = useState(0);
  const [walletTick, setWalletTick] = useState(0);
  const [showGemShop, setShowGemShop] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
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
    if (!canBeginLevelAttempt(globalLevel)) {
      setPendingLevel(globalLevel);
      setShowGemShop(true);
      return;
    }
    onSelectLevel(globalLevel);
  };

  const handleStart = () => {
    if (isLevelPlayable(currentLevel)) {
      handleSelect(currentLevel);
    }
  };

  const handleWalletChange = () => {
    setWalletTick((t) => t + 1);
    if (pendingLevel !== null && canBeginLevelAttempt(pendingLevel)) {
      const level = pendingLevel;
      setPendingLevel(null);
      setShowGemShop(false);
      onSelectLevel(level);
    }
  };

  const saved = loadProgress();
  const { energy } = syncEnergyState();
  void walletTick;
  const gems = saved?.credits ?? 0;

  const mapPoints = buildWorldMapPoints();
  const mapHeight = mapViewBoxHeight();
  const pathProgress = progressIndexInWorld(selectedWorld, currentLevel);

  return (
    <div className="level-select-screen">
      <div className="level-select-sparkles" aria-hidden />

      <div className="mobile-shell mobile-shell--levels">
        <header className="levels-hero levels-hero--royal">
          <button type="button" className="levels-back" onClick={onBack} aria-label="Back">
            ←
          </button>

          <div className="levels-title-wrap">
            <div className="royal-logo royal-logo--compact">
              <div className="royal-logo__crown" aria-hidden>
                👑
              </div>
              <div className="royal-logo__shield">
                <span className="royal-logo__line royal-logo__line--main">Levels</span>
                <div className="royal-logo__suits" aria-hidden>
                  <span className="suit-spades">♠</span>
                  <span className="suit-hearts">♥</span>
                  <span className="suit-clubs">♣</span>
                  <span className="suit-diamonds">♦</span>
                </div>
              </div>
            </div>
            <ResourceBar
              gems={gems}
              energy={energy}
              maxEnergy={MAX_ENERGY}
              stars={totalStars}
              onGemsClick={() => setShowGemShop(true)}
              onEnergyClick={() => setShowGemShop(true)}
            />
            <p className="levels-subtitle">
              {completedCount} / {TOTAL_LEVELS} cleared · World {selectedWorld}
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
          <div className="level-map" style={{ aspectRatio: `100 / ${mapHeight}` }}>
            <WorldMapPath
              points={mapPoints}
              progressIndex={pathProgress}
              viewHeight={mapHeight}
            />

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

          <div className="levels-banner-foot">
            <span className="levels-banner-foot__text">Unlock new puzzle lands</span>
          </div>
        </div>

        <footer className="levels-footer">
          <button
            type="button"
            className="btn-royal-cta levels-start-btn--royal"
            onClick={handleStart}
            disabled={!isLevelPlayable(currentLevel)}
          >
            <span className="btn-royal-cta__main">Play level {formatLevelId(currentLevel)}</span>
            <span className="btn-royal-cta__sub">Compete & win rewards</span>
          </button>
        </footer>
      </div>

      {showGemShop && (
        <GemShopModal
          emphasizeEnergy
          onClose={() => {
            setShowGemShop(false);
            setPendingLevel(null);
          }}
          onBalanceChange={handleWalletChange}
        />
      )}
    </div>
  );
}
