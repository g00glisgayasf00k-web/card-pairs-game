import { useCallback, useState } from "react";
import { submitScore } from "./lib/api";
import { HAND_DISPLAY, type HandLabel } from "./lib/pokerHands";
import { AuthPanel } from "./components/AuthPanel";
import { GameBoard } from "./components/GameBoard";
import { Leaderboard } from "./components/Leaderboard";

type Tab = "play" | "scores" | "help";

export default function App() {
  const [tab, setTab] = useState<Tab>("play");
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username")
  );
  const [liveScore, setLiveScore] = useState(0);
  const [liveHands, setLiveHands] = useState(0);
  const [liveBest, setLiveBest] = useState<HandLabel>("pair");
  const [gameOver, setGameOver] = useState<{
    score: number;
    hands: number;
    best: HandLabel;
  } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [playId, setPlayId] = useState(0);

  const onAuth = (u: string, token: string) => {
    localStorage.setItem("username", u);
    localStorage.setItem("token", token);
    setUsername(u);
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
  };

  const onScoreChange = useCallback(
    (score: number, hands: number, best: HandLabel) => {
      setLiveScore(score);
      setLiveHands(hands);
      setLiveBest(best);
    },
    []
  );

  const handleGameOver = async (final: {
    score: number;
    hands: number;
    best: HandLabel;
  }) => {
    setGameOver(final);
    try {
      const res = await submitScore({
        points: final.score,
        hands_cleared: final.hands,
        best_hand: final.best,
      });
      setSaveMsg(
        res.saved
          ? "Score saved to leaderboard!"
          : "Log in to save your score"
      );
    } catch {
      setSaveMsg("Could not reach server — play again when online");
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Poker Pairs</h1>
        <p className="tagline">Swipe poker hands off the board</p>
        <AuthPanel username={username} onAuth={onAuth} onLogout={onLogout} />
      </header>

      <nav className="tabs main-tabs">
        {(["play", "scores", "help"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "play" ? "Play" : t === "scores" ? "Scores" : "How to play"}
          </button>
        ))}
      </nav>

      <main>
        {tab === "play" && (
          <>
            {gameOver && (
              <div className="modal-overlay">
                <div className="modal">
                  <h2>Game over</h2>
                  <p>
                    Score: <strong>{gameOver.score}</strong>
                  </p>
                  <p>Best hand: {HAND_DISPLAY[gameOver.best]}</p>
                  {saveMsg && <p className="toast">{saveMsg}</p>}
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setGameOver(null);
                      setSaveMsg(null);
                      setPlayId((id) => id + 1);
                    }}
                  >
                    Play again
                  </button>
                </div>
              </div>
            )}
            <GameBoard
              key={playId}
              onScoreChange={onScoreChange}
              onGameOver={handleGameOver}
            />
          </>
        )}
        {tab === "scores" && (
          <section>
            <h2>Leaderboard</h2>
            {username && (
              <p className="muted">
                Current run: {liveScore} pts · {liveHands} hands · best{" "}
                {HAND_DISPLAY[liveBest]}
              </p>
            )}
            <Leaderboard />
          </section>
        )}
        {tab === "help" && (
          <section className="help">
            <h2>How to play</h2>
            <ul>
              <li>
                <strong>Swipe</strong> across touching cards (up, down, left,
                right).
              </li>
              <li>
                <strong>Pair</strong> — two cards of the same rank (e.g. two
                Aces side by side).
              </li>
              <li>
                <strong>Straight</strong> — five ranks in a row (e.g. 10-J-Q-K-A).
                You must start on the <em>10 or Ace</em> end and swipe through
                all five.
              </li>
              <li>
                Higher hands: flush (5 same suit), full house, four of a kind,
                straight flush, royal flush.
              </li>
              <li>Matched cards pop away and new random cards appear.</li>
              <li>Score from pairs (low) up to royal flush (highest).</li>
            </ul>
            <table className="score-table">
              <thead>
                <tr>
                  <th>Hand</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["pair", 100],
                    ["two_pair", 250],
                    ["three_of_a_kind", 400],
                    ["straight", 600],
                    ["flush", 800],
                    ["full_house", 1200],
                    ["four_of_a_kind", 1800],
                    ["straight_flush", 3000],
                    ["royal_flush", 5000],
                  ] as [HandLabel, number][]
                ).map(([h, pts]) => (
                  <tr key={h}>
                    <td>{HAND_DISPLAY[h]}</td>
                    <td>{pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
