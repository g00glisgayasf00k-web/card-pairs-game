import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  allWorlds,
  formatLevelId,
  STAGES_PER_WORLD,
  stagesInWorld,
  toGlobalLevel,
  displayWorld,
  TOTAL_LEVELS,
  worldTitle,
  worldTheme,
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
          className={`chip-star${i <= stars ? " chip-star--lit" : ""}`}
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

function PokerChip({
  globalLevel,
  isMilestone,
  state,
  isCurrent,
  stars,
  onSelect,
}: LevelChipProps) {
  const locked = state === "locked";
  const label = formatLevelId(globalLevel);

  return (
    <div className={`map-node${isMilestone ? " map-node--milestone" : ""}`}>
      {isCurrent && <span className="map-current-beacon" aria-hidden />}
      <button
        type="button"
        className={[
          "poker-chip",
          isMilestone ? "poker-chip--boss" : "",
          `poker-chip--${state}`,
          isCurrent ? "poker-chip--current" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={locked}
        onClick={() => onSelect(globalLevel)}
        aria-label={locked ? `${label} locked` : `Play level ${label}`}
      >
        <span className="poker-chip__edge" aria-hidden />
        <span className="poker-chip__face">
          {locked ? (
            <span className="poker-chip__lock" aria-hidden>
              LOCK
            </span>
          ) : (
            <span className="poker-chip__label">{label}</span>
          )}
        </span>
      </button>
      {!locked && <StarRating stars={stars} />}
    </div>
  );
}

function WorldPath({
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
      className="felt-path-svg"
      viewBox={`0 0 100 ${viewHeight}`}
      preserveAspectRatio="xMidYMin meet"
      aria-hidden
    >
      {/* soft shadow under the ribbon for depth */}
      <path className="felt-path felt-path--shadow" d={fullPath} />
      {/* full route — muted base in the world colour */}
      <path className="felt-path felt-path--base" d={fullPath} />
      {/* elegant dashed centre line */}
      <path className="felt-path felt-path--dash" d={fullPath} />
      {/* completed portion — bright glowing colour */}
      {progressPath && (
        <>
          <path className="felt-path felt-path--active" d={progressPath} />
          <path className="felt-path felt-path--active-dash" d={progressPath} />
        </>
      )}
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
  const chestTarget = starsToUnlockWorld(nextWorld);
  const theme = worldTheme(selectedWorld);

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

  const feltStyle = {
    "--world-main": theme.main,
    "--world-dark": theme.dark,
    "--world-light": theme.light,
    "--world-felt": theme.felt,
    "--world-felt-edge": theme.feltEdge,
  } as CSSProperties;

  return (
    <div className="felt-screen" style={feltStyle}>
      <header className="felt-hud">
        <button type="button" className="felt-icon-btn" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div className="felt-hud__center">
          <p className="felt-hud__eyebrow">Royal Match Table</p>
          <ResourceBar
            gems={gems}
            energy={energy}
            maxEnergy={MAX_ENERGY}
            stars={totalStars}
            onGemsClick={() => setShowGemShop(true)}
            onEnergyClick={() => setShowGemShop(true)}
          />
        </div>
        <button type="button" className="felt-icon-btn" aria-label="Menu" onClick={onBack}>
          ≡
        </button>
      </header>

      <nav className="felt-world-tabs" aria-label="World selection">
        {allWorlds().map((world) => {
          const unlocked = isWorldUnlocked(world);
          const wt = worldTheme(world);
          return (
            <button
              key={world}
              type="button"
              className={`felt-world-tab${selectedWorld === world ? " felt-world-tab--active" : ""}${!unlocked ? " felt-world-tab--locked" : ""}`}
              style={{ "--tab-color": wt.main } as CSSProperties}
              disabled={!unlocked}
              onClick={() => setSelectedWorld(world)}
              aria-label={`${worldTitle(world)}${!unlocked ? " locked" : ""}`}
            >
              {unlocked ? displayWorld(world) : "🔒"}
            </button>
          );
        })}
      </nav>

      <div className="felt-world-banner">
        <h2 className="felt-world-banner__title">{worldTitle(selectedWorld)}</h2>
        <div className="felt-chest">
          <div className="felt-chest__bar">
            <div
              className="felt-chest__fill"
              style={{ width: `${Math.min(100, (worldStars / Math.max(1, chestTarget)) * 100)}%` }}
            />
          </div>
          <span className="felt-chest__count">
            Stars {worldStars}/{chestTarget}
          </span>
        </div>
      </div>

      <div className="felt-board-scroll">
        <div className="felt-board" style={{ aspectRatio: `100 / ${mapHeight}` }}>
          <WorldPath points={mapPoints} progressIndex={pathProgress} viewHeight={mapHeight} />

          <div className="felt-nodes">
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
                  className="felt-node-slot"
                  style={{
                    left: `${pt.x}%`,
                    top: `${(pt.y / mapHeight) * 100}%`,
                  }}
                >
                  <PokerChip
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
          <div className="felt-gate">
            <span aria-hidden>🔒</span>
            {worldStars} / {chestTarget} ★ to unlock {worldTitle(nextWorld)}
          </div>
        )}
      </div>

      <footer className="felt-footer">
        <button
          type="button"
          className="felt-play-btn"
          onClick={handleStart}
          disabled={!isLevelPlayable(currentLevel)}
        >
          <span className="felt-play-btn__main">Play {formatLevelId(currentLevel)}</span>
          <span className="felt-play-btn__sub">
            {completedCount} / {TOTAL_LEVELS} cleared
          </span>
        </button>
      </footer>

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
