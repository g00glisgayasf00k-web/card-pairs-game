import { useEffect, useState, type ReactNode } from "react";

/** Phones/tablets turned sideways — not full desktop landscape. */
const LANDSCAPE_MQ = "(orientation: landscape) and (max-height: 520px)";

interface Props {
  children: ReactNode;
}

export function PortraitGate({ children }: Props) {
  const [blocked, setBlocked] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(LANDSCAPE_MQ).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(LANDSCAPE_MQ);
    const onChange = () => setBlocked(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      {children}
      {blocked && (
        <div className="portrait-gate" role="alertdialog" aria-modal="true" aria-labelledby="portrait-gate-title">
          <div className="portrait-gate__card">
            <div className="portrait-gate__icon" aria-hidden>
              <span className="portrait-gate__phone">📱</span>
              <span className="portrait-gate__arrow">↻</span>
            </div>
            <h2 id="portrait-gate-title" className="portrait-gate__title">
              Please rotate your device
            </h2>
            <p className="portrait-gate__text">
              Royal Match Poker is designed for portrait mode. Turn your phone upright to continue playing.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
