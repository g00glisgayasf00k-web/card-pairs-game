import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../lib/api";
import { HAND_DISPLAY, type HandLabel } from "../lib/pokerHands";

export function Leaderboard() {
  const [rows, setRows] = useState<
    { username: string; points: number; best_hand: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard()
      .then((d) => setRows(d.leaderboard))
      .catch(() => setError("Could not load leaderboard"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!rows.length) return <p className="muted">No scores yet — be the first!</p>;

  return (
    <ol className="leaderboard">
      {rows.map((r, i) => (
        <li key={`${r.username}-${i}`}>
          <span className="rank-num">{i + 1}</span>
          <span className="name">{r.username}</span>
          <span className="pts">{r.points.toLocaleString()}</span>
          <span className="hand">
            {HAND_DISPLAY[r.best_hand as HandLabel] ?? r.best_hand}
          </span>
        </li>
      ))}
    </ol>
  );
}
