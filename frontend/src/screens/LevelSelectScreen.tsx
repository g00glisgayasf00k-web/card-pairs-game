import { useCallback, useEffect, useRef, useState } from "react";
import {
  allWorlds,
  formatLevelId,
  STAGES_PER_WORLD,
  stagesInWorld,
  toGlobalLevel,
  displayWorld,
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

function nodeSpriteVariant(
  state: LevelNodeState,
  isMilestone: boolean,
  isCurrent: boolean
): "gold" | "blue" | "purple" {
  if (isMilestone || state === "completed") return "gold";
  if (isCurrent) return "purple";
  return "blue";
}

function LevelChip({
  globalLevel,
  isMilestone,
  state,
  isCurrent,
  stars,
  onSelect,
}: LevelChipProps) {
  const locked = state === "locked";
  const label = formatLevelId(globalLevel);
  const sprite = nodeSpriteVariant(state, isMilestone, isCurrent);

  return (
    <div className={`map-node${isMilestone ? " map-node--milestone" : ""}`}>
      {isCurrent && (
        <div className="map-you-are-here" aria-hidden>
          <span className="map-you-are-here__arrow">▼</span>
          <span className="map-you-are-here__text">You are here!</span>
        </div>
      )}
      <div className="map-island-pad map-island-pad--sprite" aria-hidden />
      <button
        type="button"
        className={[
          "level-chip",
          "level-chip--sprite",
          `level-chip--sprite-${sprite}`,
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
        <span className="level-chip__sprite" aria-hidden />
        {locked ? (
          <span className="level-chip__lock" aria-hidden>
            <span className="level-chip__lock-icon">🔒</span>
          </span>
        ) : (
          <span className="level-chip__label">{label}</span>
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
      <path className="map-path map-path--shadow" d={fullPath} />
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
  const worldStars = countStarsInWorld(selectedWorld);
  const nextWorld = selectedWorld + 1;
  const nextWorldLocked = nextWorld <= 10 && !isWorldUnlocked(nextWorld);
  const bossLevel = toGlobalLevel(selectedWorld, STAGES_PER_WORLD);
  const bossState = getLevelNodeState(bossLevel);
  const chestTarget = starsToUnlockWorld(nextWorld);

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
    }, 200);
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
    <div className="level-select-screen royal-map-screen">
      <div className="royal-map-sky" aria-hidden>
        <div className="royal-map-cloud royal-map-cloud--1" />
        <div className="royal-map-cloud royal-map-cloud--2" />
        <div className="royal-map-cloud royal-map-cloud--3" />
        <div className="royal-map-castle-peak">
          <span className="royal-map-castle-peak__icon">🏰</span>
          <span className="royal-map-castle-peak__label">Castle Peak</span>
        </div>
        <div className="royal-map-dragon">🐉</div>
        <div className="royal-map-balloon">🎈</div>
      </div>

      <div className="level-select-sparkles royal-map-confetti" aria-hidden />

      <div className="mobile-shell mobile-shell--levels">
        <header className="royal-map-hud">
          <button type="button" className="levels-back" onClick={onBack} aria-label="Back">
            ←
          </button>
          <ResourceBar
            gems={gems}
            energy={energy}
            maxEnergy={MAX_ENERGY}
            stars={totalStars}
            onGemsClick={() => setShowGemShop(true)}
            onEnergyClick={() => setShowGemShop(true)}
          />
          <button type="button" className="royal-map-menu" aria-label="Menu" onClick={onBack}>
            ☰
          </button>
        </header>

        <nav className="world-tabs world-tabs--map" aria-label="World selection">
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
                <span className="world-tab__num">{displayWorld(world)}</span>
              </button>
            );
          })}
        </nav>

        <div className="world-ribbon world-ribbon--map">
          <span className="world-ribbon__fold world-ribbon__fold--l" aria-hidden />
          <h2 className="world-ribbon__text">{worldTitle(selectedWorld)}</h2>
          <span className="world-ribbon__fold world-ribbon__fold--r" aria-hidden />
        </div>

        <div className="royal-map-stage">
          <aside className="map-widget map-widget--fest" aria-hidden>
            <span className="map-widget__tag">Spring fest</span>
            <span className="map-widget__icon">🎁</span>
            <span className="map-widget__timer">Coming soon</span>
          </aside>

          <aside className="map-widget map-widget--chest">
            <span className="map-widget__tag">Star chest</span>
            <span className="map-widget__icon">🎁</span>
            <div className="map-widget__bar">
              <div
                className="map-widget__bar-fill"
                style={{
                  width: `${Math.min(100, (worldStars / Math.max(1, chestTarget)) * 100)}%`,
                }}
              />
            </div>
            <span className="map-widget__progress">
              {worldStars} / {chestTarget} ★
            </span>
          </aside>

          <aside className="map-widget map-widget--portal" aria-hidden>
            <span className="map-widget__tag">Magic portal</span>
            <span className="map-widget__icon map-widget__icon--portal">🌀</span>
            <span className="map-widget__timer">Soon</span>
          </aside>

          <aside
            className={`map-widget map-widget--boss${bossState === "locked" ? " map-widget--boss-locked" : ""}`}
          >
            <span className="map-widget__tag">Boss level</span>
            <span className="map-widget__boss-art">👹</span>
            <span className="map-widget__boss-title">Defeat the boss!</span>
            <span className="map-widget__boss-level">
              {bossState === "locked" && "🔒 "}
              {formatLevelId(bossLevel)}
            </span>
          </aside>

          <div className="level-map-scroll royal-map-scroll">
            <div className="level-map royal-map-trail" style={{ aspectRatio: `100 / ${mapHeight}` }}>
              <div className="map-path-sprite-bg" aria-hidden />
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
              <div className="world-gate world-gate--map">
                <div className="world-gate__bar">
                  <span className="world-gate__bar-lock" aria-hidden>🔒</span>
                  <span className="world-gate__bar-text">
                    {worldStars} / {chestTarget} ★ to unlock {worldTitle(nextWorld)}
                  </span>
                </div>
              </div>
            )}

            <div className="levels-banner-foot levels-banner-foot--map">
              <span className="levels-banner-foot__ribbon" aria-hidden>🎀</span>
              <span className="levels-banner-foot__text">Unlock new puzzle lands</span>
              <span className="levels-banner-foot__suits" aria-hidden>
                ♥ ♦ ♣ ♠
              </span>
            </div>
          </div>
        </div>

        <footer className="levels-footer levels-footer--map">
          <div className="levels-footer__chips" aria-hidden>
            <span>🟢</span>
            <span>🟣</span>
            <span>🔴</span>
          </div>
          <button
            type="button"
            className="btn-royal-cta levels-start-btn--royal"
            onClick={handleStart}
            disabled={!isLevelPlayable(currentLevel)}
          >
            <span className="btn-royal-cta__main">Play {formatLevelId(currentLevel)}</span>
            <span className="btn-royal-cta__sub">
              {completedCount} / {TOTAL_LEVELS} cleared
            </span>
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
