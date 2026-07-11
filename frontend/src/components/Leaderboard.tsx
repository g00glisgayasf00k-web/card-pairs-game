import { useEffect, useState } from "react";
import { fetchLeaderboards, type LeaderboardLevelRow } from "../lib/api";
import { getUsername } from "../lib/session";

const PODIUM_CLASS = ["podium-card--gold", "podium-card--silver", "podium-card--bronze"] as const;

function displayName(username: string): string {
  const me = getUsername();
  return me && username === me ? "You" : username;
}

function StarsBoard({ rows }: { rows: LeaderboardLevelRow[] }) {
  if (!rows.length) {
    return <p className="muted">No stars synced yet — clear levels while signed in!</p>;
  }

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <>
      <div className="leaderboard-podium">
        {top3.map((row, i) => (
          <div key={`${row.user_id}-${i}`} className={`podium-card ${PODIUM_CLASS[i] ?? ""}`}>
            <div className="podium-rank">
              <span className="podium-rank__crown" aria-hidden>
                {i === 0 ? "★" : "☆"}
              </span>
              <span className="podium-rank__num">{i + 1}</span>
            </div>
            <div className="podium-player">
              <span className="podium-player__name">{displayName(row.username)}</span>
              <span className="podium-player__hand">Level {row.level}</span>
            </div>
            <span className="podium-score">{row.stars_total.toLocaleString()}★</span>
          </div>
        ))}
      </div>
      {rest.length > 0 && (
        <ol className="leaderboard-list">
          {rest.map((row, i) => (
            <li key={`${row.user_id}-${i + 3}`}>
              <span className="rank-num">{i + 4}</span>
              <span className="name">{displayName(row.username)}</span>
              <span className="pts">{row.stars_total.toLocaleString()}★</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardLevelRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboards(20)
      .then((data) => setRows(data.most_stars ?? data.highest_level ?? []))
      .catch(() => setError("Could not load leaderboard"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!rows) return <p className="muted">Loading leaderboard…</p>;

  return (
    <div className="leaderboard-royal">
      <div className="royal-frame">
        <span className="royal-frame__crown" aria-hidden>
          ★
        </span>
        <h3 className="royal-frame__title">Most stars</h3>
        <p className="royal-frame__sub">Campaign stars earned across all levels</p>
      </div>
      <StarsBoard rows={rows} />
    </div>
  );
}
