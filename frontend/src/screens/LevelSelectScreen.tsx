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
import { buildWorldMapPoints, mapViewBoxHeight } from "../lib/mapLayout";
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
import { loadProgress, PROGRESS_IMPORTED_EVENT } from "../lib/progress";
import { GemShopModal } from "../components/GemShopModal";
import { ResourceBar } from "../components/ResourceBar";

interface Props {
  onBack: () => void;
  onSelectLevel: (globalLevel: number) => void;
}

const MAP_ASSETS = {
  chipUnlocked: "/assets/pixellab/chip-unlocked.png",
  chipCompleted: "/assets/pixellab/chip-completed.png",
  chipLocked: "/assets/pixellab/chip-locked.png",
  feltPanel: "/assets/map-felt-panel.png",
  starChest: "/assets/pixellab/star-chest.png",
} as const;

function chipArtForState(state: LevelNodeState): string {
  if (state === "locked") return MAP_ASSETS.chipLocked;
  if (state === "completed") return MAP_ASSETS.chipCompleted;
  return MAP_ASSETS.chipUnlocked;
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
          "poker-chip--pixel",
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
        <img
          className="poker-chip__art"
          src={chipArtForState(state)}
          alt=""
          aria-hidden
          draggable={false}
        />
        {!locked && <span className="poker-chip__label">{label}</span>}
      </button>
      {!locked && <StarRating stars={stars} />}
    </div>
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
    const onImported = () => setWalletTick((t) => t + 1);
    window.addEventListener(PROGRESS_IMPORTED_EVENT, onImported);
    return () => window.removeEventListener(PROGRESS_IMPORTED_EVENT, onImported);
  }, []);

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

  useEffect(() => {
    if (energy >= MAX_ENERGY) return;
    const id = window.setInterval(() => setWalletTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, [energy]);
  const gems = saved?.credits ?? 0;

  const mapPoints = buildWorldMapPoints();
  const mapHeight = mapViewBoxHeight();

  const feltStyle = {
    "--world-main": theme.main,
    "--world-dark": theme.dark,
    "--world-light": theme.light,
    "--world-felt": theme.felt,
    "--world-felt-edge": theme.feltEdge,
  } as CSSProperties;

  return (
    <div className="felt-screen levels-reference" style={feltStyle}>
      <header className="felt-hud">
        <button type="button" className="felt-icon-btn" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div className="felt-hud__center">
          <p className="felt-hud__eyebrow">Levels</p>
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
          <img className="felt-chest__icon" src={MAP_ASSETS.starChest} alt="" aria-hidden />
          <div className="felt-chest__bar">
            <div
              className="felt-chest__fill"
              style={{ width: `${Math.min(100, (worldStars / Math.max(1, chestTarget)) * 100)}%` }}
            />
          </div>
          <span className="felt-chest__count">
            {worldStars}/{chestTarget} Stars
          </span>
        </div>
      </div>

      <div className="felt-board-scroll">
        <div
          className="felt-board felt-board--chips-only felt-board--pixel"
          style={{
            aspectRatio: `100 / ${mapHeight}`,
            backgroundImage: `url(${MAP_ASSETS.feltPanel})`,
          }}
        >
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
        <div className="felt-stars-preview" aria-hidden>
          <span className="felt-stars-preview__star">☆</span>
          <span className="felt-stars-preview__star felt-stars-preview__star--lit">★</span>
          <span className="felt-stars-preview__star felt-stars-preview__star--lit">★</span>
        </div>
        <button
          type="button"
          className="felt-play-btn"
          onClick={handleStart}
          disabled={!isLevelPlayable(currentLevel)}
        >
          <span className="felt-play-btn__main">START</span>
          <span className="felt-play-btn__sub">
            {formatLevelId(currentLevel)} · {completedCount} / {TOTAL_LEVELS} cleared
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
