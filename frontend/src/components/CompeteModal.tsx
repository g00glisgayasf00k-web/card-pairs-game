import { useState } from "react";

type Ladder = "daily" | "quick";

const DAILY_ROWS = [
  { rank: 1, name: "FlushKing", stars: 3, moves: 11, score: "4,820" },
  { rank: 2, name: "NightOwl", stars: 3, moves: 12, score: "4,610" },
  { rank: 3, name: "You", stars: 2, moves: 14, score: "4,100", you: true },
  { rank: 4, name: "Lowball", stars: 2, moves: 15, score: "3,990" },
];

const QUEUE = [
  { name: "NightOwl", rating: 1280, region: "EU" },
  { name: "FlushKing", rating: 1410, region: "US" },
  { name: "Lowball", rating: 1195, region: "EU" },
];

interface Props {
  onClose: () => void;
  onPlaySolo: () => void;
}

export function CompeteModal({ onClose, onPlaySolo }: Props) {
  const [ladder, setLadder] = useState<Ladder>("daily");
  const [ready, setReady] = useState(false);

  return (
    <div className="modal-overlay scores-overlay home-menu-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="compete-title"
      >
        {!ready ? (
          <>
            <h2 id="compete-title">Compete</h2>
            <p className="play-mode-modal__lead">
              No friends needed — race on a shared seed or queue a quick match.
            </p>

            <div className="play-mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={ladder === "daily"}
                className={`play-mode-tab${ladder === "daily" ? " play-mode-tab--on" : ""}`}
                onClick={() => setLadder("daily")}
              >
                Daily board
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ladder === "quick"}
                className={`play-mode-tab${ladder === "quick" ? " play-mode-tab--on" : ""}`}
                onClick={() => setLadder("quick")}
              >
                Quick match
              </button>
            </div>

            {ladder === "daily" ? (
              <div className="play-mode-panel">
                <div className="play-mode-stats">
                  <div>
                    <span className="play-mode-stats__val">12h 14m</span>
                    <span className="play-mode-stats__label">Resets in</span>
                  </div>
                  <div>
                    <span className="play-mode-stats__val">1,842</span>
                    <span className="play-mode-stats__label">Players today</span>
                  </div>
                  <div>
                    <span className="play-mode-stats__val">#128</span>
                    <span className="play-mode-stats__label">Your rank</span>
                  </div>
                </div>
                <p className="play-mode-modal__hint">
                  One seeded board worldwide. Ranking = stars, then moves, then score.
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
                <button type="button" className="btn btn-primary" onClick={() => setReady(true)}>
                  Play today&apos;s board
                </button>
              </div>
            ) : (
              <div className="play-mode-panel">
                <p className="play-mode-modal__hint">
                  Match vs a nearby rating. Same seed for both — better stars / moves wins.
                </p>
                <table className="play-mode-table">
                  <thead>
                    <tr>
                      <th>In queue</th>
                      <th>Rating</th>
                      <th>Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUEUE.map((q) => (
                      <tr key={q.name}>
                        <td>{q.name}</td>
                        <td>{q.rating}</td>
                        <td>{q.region}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="play-mode-stats play-mode-stats--2">
                  <div>
                    <span className="play-mode-stats__val">1,240</span>
                    <span className="play-mode-stats__label">Your rating</span>
                  </div>
                  <div>
                    <span className="play-mode-stats__val">~8s</span>
                    <span className="play-mode-stats__label">Est. wait</span>
                  </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => setReady(true)}>
                  Find match
                </button>
              </div>
            )}

            <button type="button" className="btn scores-close" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <h2 id="compete-title">Match ready</h2>
            <p className="play-mode-modal__lead">
              {ladder === "daily" ? "Daily board — attempt queued" : "Matched vs FlushKing"}
            </p>
            <div className="play-mode-setup">
              <div className="play-mode-setup__card">
                <span className="play-mode-setup__label">Goals</span>
                <strong>Pair of K&apos;s · 56789</strong>
                <span className="play-mode-setup__hint">Target pts + 3★ move budget</span>
              </div>
              <div className="play-mode-setup__card">
                <span className="play-mode-setup__label">Rules</span>
                <strong>Seeded · fair</strong>
                <span className="play-mode-setup__hint">Assists marked</span>
              </div>
            </div>
            <div className="play-mode-sent">
              <p>
                Live ladders and matchmaking are next. Jump into Solo to keep playing while ranked tables
                go live.
              </p>
            </div>
            <div className="play-mode-modal__actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  onPlaySolo();
                }}
              >
                Play Solo instead
              </button>
              <button type="button" className="btn scores-close" onClick={() => setReady(false)}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
