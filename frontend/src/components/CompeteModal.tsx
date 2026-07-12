import { useEffect, useRef, useState } from "react";
import {
  joinQuickMatch,
  leaveQuickMatch,
  pollQuickMatch,
  type ChallengeDto,
} from "../lib/api";
import { formatLevelId } from "../lib/levelMap";
import { isQuickPlayUnlocked, quickPlayUnlockLabel } from "../lib/quickPlayUnlock";

type Ladder = "daily" | "quick";

const DAILY_ROWS = [
  { rank: 1, name: "FlushKing", stars: 3, moves: 11, score: "4,820" },
  { rank: 2, name: "NightOwl", stars: 3, moves: 12, score: "4,610" },
  { rank: 3, name: "You", stars: 2, moves: 14, score: "4,100", you: true },
  { rank: 4, name: "Lowball", stars: 2, moves: 15, score: "3,990" },
];

interface Props {
  onClose: () => void;
  onPlaySolo: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
}

export function CompeteModal({ onClose, onPlaySolo, onPlayChallenge }: Props) {
  const [ladder, setLadder] = useState<Ladder>("quick");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<ChallengeDto | null>(null);
  const pollingRef = useRef(false);

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

  const findMatch = async () => {
    if (!isQuickPlayUnlocked()) {
      setError(`Clear Solo ${quickPlayUnlockLabel()} to unlock Quick play`);
      return;
    }
    setBusy(true);
    setError(null);
    setMatched(null);
    try {
      const r = await joinQuickMatch();
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

  const cancelQueue = async () => {
    setBusy(true);
    try {
      await leaveQuickMatch();
    } catch {
      /* ignore */
    }
    setStatus("idle");
    setBusy(false);
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

  return (
    <div className="modal-overlay scores-overlay home-menu-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal play-mode-modal--compete"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="compete-title"
      >
        {status === "matched" && matched ? (
          <>
            <header className="play-mode-modal__header">
              <h2 id="compete-title">Match ready</h2>
              <p className="play-mode-modal__lead">
                vs {opponentName ?? "opponent"} · {formatLevelId(matched.level)}
              </p>
            </header>
            <div className="play-mode-modal__body">
              <div className="play-mode-sent">
                <p>Same seeded board. Best stars win — then fewest moves, then score.</p>
                <p className="play-mode-modal__hint">
                  The player who opens the match pays 1 ⚡ — the opponent plays free.
                </p>
              </div>
              <div className="play-mode-modal__actions">
                <button type="button" className="btn-primary" onClick={playMatched}>
                  Play now · ⚡1
                </button>
              </div>
            </div>
            <footer className="play-mode-modal__footer">
              <button type="button" className="btn scores-close" onClick={onClose}>
                Later
              </button>
            </footer>
          </>
        ) : (
          <>
            <header className="play-mode-modal__header">
              <h2 id="compete-title">Compete</h2>
              <p className="play-mode-modal__lead">
                No friends needed — race on a shared seed or queue a quick match.
              </p>
            </header>

            <div className="play-mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={ladder === "quick"}
                className={`play-mode-tab${ladder === "quick" ? " play-mode-tab--on" : ""}`}
                onClick={() => setLadder("quick")}
              >
                Quick match
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ladder === "daily"}
                className={`play-mode-tab${ladder === "daily" ? " play-mode-tab--on" : ""}`}
                onClick={() => setLadder("daily")}
              >
                Daily board
              </button>
            </div>

            <div className="play-mode-modal__body">
              {error && <p className="play-mode-modal__error">{error}</p>}

              {ladder === "daily" ? (
                <div className="play-mode-panel">
                  <div className="play-mode-stats">
                    <div>
                      <span className="play-mode-stats__val">Soon</span>
                      <span className="play-mode-stats__label">Resets in</span>
                    </div>
                    <div>
                      <span className="play-mode-stats__val">—</span>
                      <span className="play-mode-stats__label">Players today</span>
                    </div>
                    <div>
                      <span className="play-mode-stats__val">—</span>
                      <span className="play-mode-stats__label">Your rank</span>
                    </div>
                  </div>
                  <p className="play-mode-modal__hint">
                    One seeded board worldwide. Ranking = stars, then moves, then score. Coming soon —
                    try Quick match or Solo for now.
                  </p>
                  <table className="play-mode-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>★</th>
                        <th>Moves</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DAILY_ROWS.map((r) => (
                        <tr key={r.rank} className={r.you ? "play-mode-table__you" : undefined}>
                          <td>{r.rank}</td>
                          <td>{r.name}</td>
                          <td>{r.stars}</td>
                          <td>{r.moves}</td>
                          <td>{r.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      onClose();
                      onPlaySolo();
                    }}
                  >
                    Play Solo instead
                  </button>
                </div>
              ) : (
                <div className="play-mode-panel">
                  <p className="play-mode-modal__hint">
                    Matched vs a player near your campaign level. Same seed — better stars / moves wins.
                  </p>
                  {status === "waiting" ? (
                    <>
                      <div className="play-mode-sent">
                        <p>Searching for a similar-level opponent…</p>
                      </div>
                      <button
                        type="button"
                        className="btn scores-close"
                        disabled={busy}
                        onClick={() => void cancelQueue()}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => void findMatch()}
                    >
                      {busy ? "Finding…" : "Find match"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <footer className="play-mode-modal__footer">
              <button type="button" className="btn scores-close" onClick={onClose}>
                Close
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
