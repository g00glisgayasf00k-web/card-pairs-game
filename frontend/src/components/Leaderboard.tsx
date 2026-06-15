import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../lib/api";
import { getUsername } from "../lib/session";
import { HAND_DISPLAY, type HandLabel } from "../lib/pokerHands";

type Row = { username: string; points: number; best_hand: string };

const PODIUM_CLASS = ["podium-card--gold", "podium-card--silver", "podium-card--bronze"] as const;

function PodiumCard({ row, rank }: { row: Row; rank: number }) {
  const me = getUsername();
  const isMe = me && row.username === me;

  return (
    <div className={`podium-card ${PODIUM_CLASS[rank - 1] ?? ""}`}>
      <div className="podium-rank">
        <span className="podium-rank__crown">{rank === 1 ? "👑" : "♛"}</span>
        <span className="podium-rank__num">{rank}</span>
      </div>
      <div className="podium-player">
        <span className="podium-player__name">
          {isMe ? "You" : row.username}
        </span>
        <span className="podium-player__hand">
          {HAND_DISPLAY[row.best_hand as HandLabel] ?? row.best_hand}
        </span>
      </div>
      <span className="podium-score">{row.points.toLocaleString()}</span>
    </div>
  );
}

export function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard()
      .then((d) => setRows(d.leaderboard))
      .catch(() => setError("Could not load leaderboard"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!rows.length) return <p className="muted">No scores yet — be the first!</p>;

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="leaderboard-royal">
      <div className="royal-frame">
        <span className="royal-frame__crown" aria-hidden>
          👑
        </span>
        <h3 className="royal-frame__title">Top scores</h3>
        <p className="royal-frame__sub">Compete & climb the royal table</p>
      </div>

      <div className="leaderboard-podium">
        {top3.map((r, i) => (
          <PodiumCard key={`${r.username}-${i}`} row={r} rank={i + 1} />
        ))}
      </div>

      {rest.length > 0 && (
        <ol className="leaderboard-list">
          {rest.map((r, i) => (
            <li key={`${r.username}-${i + 3}`}>
              <span className="rank-num">{i + 4}</span>
              <span className="name">{r.username}</span>
              <span className="pts">{r.points.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
