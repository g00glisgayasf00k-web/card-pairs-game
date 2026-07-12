import { useEffect, useRef, useState } from "react";
import { ChallengeFriendModal } from "./ChallengeFriendModal";
import { HOME_ASSETS } from "./home/homeAssets";
import {
  joinQuickMatch,
  leaveQuickMatch,
  pollQuickMatch,
  type ChallengeDto,
} from "../lib/api";
import { formatLevelId } from "../lib/levelMap";
import { hasEnergy, syncEnergyState, trySpendEnergyOnce } from "../lib/energy";
import { loadProgress } from "../lib/progress";
import { OutOfEnergyModal } from "./OutOfEnergyModal";

type View = "hub" | "quick" | "friends";

interface Props {
  onClose: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  friendRequestCount?: number;
  challengeCount?: number;
  onNotificationsChange?: () => void;
  /** Open directly on friends inbox (e.g. from push). */
  initialView?: View;
}

export function MultiplayerModal({
  onClose,
  onPlayChallenge,
  friendRequestCount = 0,
  challengeCount = 0,
  onNotificationsChange,
  initialView = "hub",
}: Props) {
  const [view, setView] = useState<View>(initialView);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<ChallengeDto | null>(null);
  const [confirmQuick, setConfirmQuick] = useState(false);
  const [showOutOfEnergy, setShowOutOfEnergy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [elo, setElo] = useState(() => loadProgress()?.elo ?? 1000);
  const pollingRef = useRef(false);
  const blue = HOME_ASSETS.cards.blue;

  useEffect(() => {
    return () => {
      pollingRef.current = false;
      void leaveQuickMatch().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (status !== "waiting") return;
    pollingRef.current = true;
    const id = window.setInterval(() => {
      void pollQuickMatch()
        .then((r) => {
          if (!pollingRef.current) return;
          if (r.status === "matched" && r.challenge) {
            setMatched(r.challenge);
            setStatus("matched");
            setBusy(false);
          } else if (r.status === "idle") {
            setStatus("idle");
            setBusy(false);
            setError("Match timed out — try again");
          }
        })
        .catch(() => undefined);
    }, 1500);
    return () => {
      window.clearInterval(id);
      pollingRef.current = false;
    };
  }, [status]);

  if (view === "friends") {
    return (
      <ChallengeFriendModal
        onClose={onClose}
        onBack={() => setView("hub")}
        onPlayChallenge={onPlayChallenge}
        friendRequestCount={friendRequestCount}
        challengeCount={challengeCount}
        onNotificationsChange={onNotificationsChange}
      />
    );
  }

  const findMatch = async () => {
    setBusy(true);
    setError(null);
    setMatched(null);
    setStatus("waiting");
    try {
      const r = await joinQuickMatch();
      if (typeof (r as { elo?: number }).elo === "number") {
        setElo((r as { elo: number }).elo);
      }
      if (r.status === "matched" && r.challenge) {
        setMatched(r.challenge);
        setStatus("matched");
      } else {
        setStatus("waiting");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Matchmaking failed");
      setStatus("idle");
    } finally {
      setBusy(false);
    }
  };

  const startQuickWithEnergy = () => {
    syncEnergyState();
    if (!hasEnergy(1)) {
      setConfirmQuick(false);
      setShowOutOfEnergy(true);
      return;
    }
    if (!trySpendEnergyOnce()) {
      setConfirmQuick(false);
      setShowOutOfEnergy(true);
      return;
    }
    setConfirmQuick(false);
    void findMatch();
  };

  const cancelQueue = async () => {
    setCancelling(true);
    try {
      await leaveQuickMatch();
    } catch {
      /* ignore */
    }
    setStatus("idle");
    setBusy(false);
    setCancelling(false);
  };

  const playMatched = () => {
    if (!matched) return;
    onClose();
    onPlayChallenge(matched);
  };

  const opponentName =
    matched == null
      ? null
      : matched.you_are === "challenger"
        ? matched.opponent?.username
        : matched.challenger?.username;

  const finding = status === "waiting";

  return (
    <>
      <div className="modal-overlay scores-overlay home-menu-overlay" onClick={onClose} role="presentation">
        <div
          className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal play-mode-modal--challenge"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="multiplayer-title"
        >
          {view === "hub" && (
            <>
              <header className="play-mode-modal__header">
                <h2 id="multiplayer-title">Multiplayer</h2>
                <p className="play-mode-modal__lead">
                  Play online versus like-minded players, or challenge your friends.
                </p>
                <p className="play-mode-modal__hint">Your Rating: {elo}</p>
              </header>
              <div className="play-mode-modal__body multiplayer-hub">
                <button
                  type="button"
                  className="multiplayer-hub__card multiplayer-hub__card--quick"
                  onClick={() => {
                    setView("quick");
                    setError(null);
                  }}
                >
                  <span className="multiplayer-hub__tag">Quick play</span>
                  <strong>Find a match</strong>
                  <span>Random opponent near your Rating · ⚡1</span>
                </button>
                <button
                  type="button"
                  className="multiplayer-hub__card multiplayer-hub__card--friend"
                  onClick={() => setView("friends")}
                >
                  <span className="multiplayer-hub__tag">Friends</span>
                  <strong>Challenge a friend</strong>
                  <span>Pick someone from your list · ⚡1 each</span>
                </button>
              </div>
              <footer className="play-mode-modal__footer">
                <button type="button" className="btn scores-close" onClick={onClose}>
                  Close
                </button>
              </footer>
            </>
          )}

          {view === "quick" && status === "matched" && matched && (
            <>
              <header className="play-mode-modal__header">
                <h2 id="multiplayer-title">Match ready</h2>
                <p className="play-mode-modal__lead">
                  vs {opponentName ?? "opponent"} · {formatLevelId(matched.level)}
                </p>
              </header>
              <div className="play-mode-modal__body">
                <div className="quick-find quick-find--ready" style={{ backgroundImage: `url(${blue.base})` }}>
                  <span
                    className="quick-find__glow"
                    aria-hidden
                    style={{ backgroundImage: `url(${blue.glow})` }}
                  />
                  <div className="quick-find__icon-wrap" aria-hidden>
                    <span
                      className="quick-find__ring"
                      style={{ backgroundImage: `url(${blue.circle})` }}
                    />
                    <img className="quick-find__icon" src={blue.icon} alt="" width={88} height={88} />
                  </div>
                  <img className="quick-find__label" src={blue.label} alt="Multiplayer" />
                  <p>Same seeded board. Best stars win — then fewest moves, then score.</p>
                  <p className="quick-find__sub">Rating updates when both results are in.</p>
                </div>
                <button type="button" className="btn-primary" onClick={playMatched}>
                  Play now
                </button>
              </div>
              <footer className="play-mode-modal__footer">
                <button type="button" className="btn scores-close" onClick={onClose}>
                  Later
                </button>
              </footer>
            </>
          )}

          {view === "quick" && status !== "matched" && (
            <>
              {finding ? (
                <>
                  <header className="play-mode-modal__header">
                    <h2 id="multiplayer-title">Finding an opponent</h2>
                    <p className="play-mode-modal__lead">
                      Looking for a player near your Rating…
                    </p>
                  </header>
                  <div className="play-mode-modal__body">
                    {error && <p className="play-mode-modal__error">{error}</p>}
                    <div
                      className="quick-find quick-find--searching"
                      style={{ backgroundImage: `url(${blue.base})` }}
                    >
                      <span
                        className="quick-find__glow"
                        aria-hidden
                        style={{ backgroundImage: `url(${blue.glow})` }}
                      />
                      <div className="quick-find__icon-wrap quick-find__icon-wrap--pulse" aria-hidden>
                        <span
                          className="quick-find__ring"
                          style={{ backgroundImage: `url(${blue.circle})` }}
                        />
                        <img className="quick-find__icon" src={blue.icon} alt="" width={96} height={96} />
                      </div>
                      <img className="quick-find__label" src={blue.label} alt="Multiplayer" />
                      <p className="quick-find__status">Finding an opponent…</p>
                      <p className="quick-find__sub">Your Rating: {elo}</p>
                    </div>
                    <button
                      type="button"
                      className="btn scores-close"
                      disabled={cancelling}
                      onClick={() => void cancelQueue()}
                    >
                      {cancelling ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <header className="play-mode-modal__header">
                    <h2 id="multiplayer-title">Quick play</h2>
                    <p className="play-mode-modal__lead">
                      Matched vs a similar Rating. Same board — better stars / moves wins.
                    </p>
                    <p className="play-mode-modal__hint">Your Rating: {elo}</p>
                  </header>
                  <div className="play-mode-modal__body">
                    {error && <p className="play-mode-modal__error">{error}</p>}
                    <div
                      className="quick-find quick-find--idle"
                      style={{ backgroundImage: `url(${blue.base})` }}
                    >
                      <span
                        className="quick-find__glow"
                        aria-hidden
                        style={{ backgroundImage: `url(${blue.glow})` }}
                      />
                      <div className="quick-find__icon-wrap" aria-hidden>
                        <span
                          className="quick-find__ring"
                          style={{ backgroundImage: `url(${blue.circle})` }}
                        />
                        <img className="quick-find__icon" src={blue.icon} alt="" width={88} height={88} />
                      </div>
                      <img className="quick-find__label" src={blue.label} alt="Multiplayer" />
                      <p className="quick-find__sub">Costs 1 ⚡ to enter the queue</p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => setConfirmQuick(true)}
                    >
                      Find match · ⚡1
                    </button>
                  </div>
                  <footer className="play-mode-modal__footer">
                    <button
                      type="button"
                      className="btn scores-close"
                      onClick={() => {
                        void cancelQueue();
                        setView("hub");
                      }}
                    >
                      Back
                    </button>
                  </footer>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {confirmQuick && (
        <div className="modal-overlay scores-overlay" role="presentation">
          <div className="modal scores-modal" role="dialog" aria-labelledby="mp-energy-title">
            <h2 id="mp-energy-title">Spend 1 energy and find match?</h2>
            <div className="play-mode-modal__actions" style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn-primary" onClick={startQuickWithEnergy}>
                Find match
              </button>
              <button type="button" className="btn scores-close" onClick={() => setConfirmQuick(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showOutOfEnergy && (
        <OutOfEnergyModal
          onClose={() => setShowOutOfEnergy(false)}
          onRefilled={() => setShowOutOfEnergy(false)}
          onOpenTreasury={() => setShowOutOfEnergy(false)}
        />
      )}
    </>
  );
}
