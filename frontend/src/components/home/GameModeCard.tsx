import type { ReactNode } from "react";
import {
  HOME_ACCENT_CLASS,
  HOME_GLOW_CLASS,
  HOME_MODE_BG_CLASS,
  type HomeGlow,
} from "./homeTheme";

interface ProgressProps {
  label: string;
  percent: number;
}

interface Props {
  glow: HomeGlow;
  label: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  progress?: ProgressProps;
  onClick: () => void;
}

export function GameModeCard({ glow, label, title, subtitle, icon, progress, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-home-card border border-home-text/10 px-4 py-4 text-left",
        HOME_MODE_BG_CLASS[glow],
        HOME_GLOW_CLASS[glow],
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={[
            "inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-home-text uppercase",
            HOME_ACCENT_CLASS[glow],
          ].join(" ")}
        >
          {label}
        </span>
        <span className="text-base font-extrabold tracking-wide text-home-text uppercase">{title}</span>
        <span className="text-sm font-medium text-home-muted">{subtitle}</span>
        {progress && (
          <div className="mt-2 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-wide text-home-gold uppercase">
              {progress.label}
            </span>
            <span className="block h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-home-bg">
              <span
                className={["block h-full rounded-full", HOME_ACCENT_CLASS[glow]].join(" ")}
                style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
              />
            </span>
          </div>
        )}
      </div>

      <span
        className={[
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl text-home-text",
          HOME_ACCENT_CLASS[glow],
          HOME_GLOW_CLASS[glow],
        ].join(" ")}
        aria-hidden
      >
        {icon}
      </span>

      <span className="shrink-0 text-2xl font-light text-home-muted" aria-hidden>
        ›
      </span>
    </button>
  );
}
