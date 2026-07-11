import type { CSSProperties, ReactNode } from "react";

interface HitProps {
  label: string;
  style: CSSProperties;
  onClick: () => void;
}

function Hit({ label, style, onClick }: HitProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute z-20 cursor-pointer border-0 bg-transparent p-0"
      style={style}
    />
  );
}

interface OverlayProps {
  style: CSSProperties;
  className?: string;
  children: ReactNode;
}

function Overlay({ style, className = "", children }: OverlayProps) {
  return (
    <div className={`absolute z-30 pointer-events-none ${className}`} style={style}>
      {children}
    </div>
  );
}

export interface HomeMockupProps {
  gems: number;
  cleared: number;
  maxLevels: number;
  level: number;
  onMenu: () => void;
  onShop: () => void;
  onProfile: () => void;
  onSolo: () => void;
  onChallenge: () => void;
  onCompete: () => void;
  onLevelBar: () => void;
  onScores: () => void;
  onRules: () => void;
  onSettings: () => void;
}

/**
 * Pixel-faithful home: the approved mockup image is the visual.
 * Transparent hit targets + small live-data overlays keep progress/gems accurate.
 */
export function HomeMockupPage({
  gems,
  cleared,
  maxLevels,
  level,
  onMenu,
  onShop,
  onProfile,
  onSolo,
  onChallenge,
  onCompete,
  onLevelBar,
  onScores,
  onRules,
  onSettings,
}: HomeMockupProps) {
  const progressPct = Math.min(100, Math.round((cleared / maxLevels) * 100));
  const stageInWorld = ((level - 1) % 20);
  const stagePct = Math.min(100, (stageInWorld / 20) * 100);

  return (
    <div className="relative mx-auto w-full max-w-[420px] select-none">
      <img
        src="/assets/home-mockup-ref.png"
        alt="Royal Poker Match home"
        className="pointer-events-none block h-auto w-full"
        draggable={false}
      />

      {/* Header controls */}
      <Hit label="Menu" onClick={onMenu} style={{ left: "3.5%", top: "2.5%", width: "10%", height: "4.5%" }} />
      <Hit label="Shop gems" onClick={onShop} style={{ left: "61%", top: "2.6%", width: "23%", height: "4.4%" }} />
      <Hit label="Profile" onClick={onProfile} style={{ left: "85%", top: "2.4%", width: "11%", height: "4.8%" }} />

      <Overlay
        style={{ left: "69%", top: "3.4%", width: "11%", height: "2.6%" }}
        className="flex items-center justify-center rounded-sm bg-[#0a1628]"
      >
        <span className="text-[11px] font-extrabold leading-none text-white tabular-nums">
          {gems.toLocaleString()}
        </span>
      </Overlay>

      {/* Mode cards — calibrated from mockup strips */}
      <Hit label="Enter table" onClick={onSolo} style={{ left: "4%", top: "33.5%", width: "92%", height: "12.5%" }} />
      <Hit label="Challenge a friend" onClick={onChallenge} style={{ left: "4%", top: "47.5%", width: "92%", height: "16%" }} />
      <Hit label="Compete" onClick={onCompete} style={{ left: "4%", top: "65%", width: "92%", height: "13%" }} />

      {/* Solo progress (live) */}
      <Overlay
        style={{ left: "7.5%", top: "41.6%", width: "48%", height: "1.5%" }}
        className="flex items-center bg-[#1a0f2e] pl-4"
      >
        <span className="text-[9px] font-bold tracking-wide text-[#FFD700] uppercase">
          ★ {cleared} / {maxLevels} cleared
        </span>
      </Overlay>
      <Overlay
        style={{ left: "7.5%", top: "43.4%", width: "40%", height: "0.65%" }}
        className="overflow-hidden rounded-full bg-black/55"
      >
        <div className="h-full rounded-full bg-[#6C2BD9]" style={{ width: `${progressPct}%` }} />
      </Overlay>

      {/* Level strip */}
      <Hit
        label="Start over from level 1"
        onClick={onLevelBar}
        style={{ left: "4%", top: "79.5%", width: "92%", height: "6.5%" }}
      />
      <Overlay
        style={{ left: "15%", top: "80.4%", width: "32%", height: "4.5%" }}
        className="flex flex-col justify-center bg-[#061A17] pl-1"
      >
        <span className="text-[12px] font-extrabold leading-tight text-white uppercase">Level {level}</span>
        <span className="text-[9px] leading-tight text-[#B8C4C2]">Start over from level 1</span>
      </Overlay>
      <Overlay
        style={{ left: "52%", top: "81.5%", width: "24%", height: "3%" }}
        className="flex flex-col justify-center gap-0.5 bg-[#061A17]"
      >
        <span className="text-[8px] font-bold text-[#B8C4C2]">
          {stageInWorld} / 20
        </span>
        <span className="block h-1 overflow-hidden rounded-full bg-black/45">
          <span className="block h-full rounded-full bg-[#0D47A1]" style={{ width: `${stagePct}%` }} />
        </span>
      </Overlay>

      {/* Bottom nav */}
      <Hit label="Play" onClick={() => undefined} style={{ left: "1%", top: "88.5%", width: "19.5%", height: "9%" }} />
      <Hit label="Scores" onClick={onScores} style={{ left: "20.5%", top: "88.5%", width: "19.5%", height: "9%" }} />
      <Hit label="Rules" onClick={onRules} style={{ left: "40%", top: "88.5%", width: "19.5%", height: "9%" }} />
      <Hit label="Shop" onClick={onShop} style={{ left: "59.5%", top: "88.5%", width: "19.5%", height: "9%" }} />
      <Hit label="Settings" onClick={onSettings} style={{ left: "79%", top: "88.5%", width: "19.5%", height: "9%" }} />
    </div>
  );
}
