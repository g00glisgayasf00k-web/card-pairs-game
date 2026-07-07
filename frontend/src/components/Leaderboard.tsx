import { useEffect, useState } from "react";
import { fetchLeaderboards, type LeaderboardsPayload } from "../lib/api";
import { getUsername } from "../lib/session";
import { HAND_DISPLAY, HAND_SCORE_LIST, type HandLabel } from "../lib/pokerHands";

type View = "scores" | "level" | "hands";

const PODIUM_CLASS = ["podium-card--gold", "podium-card--silver", "podium-card--bronze"] as const;

function displayName(username: string): string {
  const me = getUsername();
  return me && username === me ? "You" : username;
}

function ScorePodium({
  rows,
}: {
  rows: LeaderboardsPayload["top_scores"];
}) {
  const top3 = rows.slice(0, 3);
  if (!top3.length) return <p className="muted">No scores yet — be the first!</p>;

  return (
    <>
      <div className="leaderboard-podium">
        {top3.map((row, i) => (
          <div key={`${row.username}-${i}`} className={`podium-card ${PODIUM_CLASS[i] ?? ""}`}>
            <div className="podium-rank">
              <span className="podium-rank__crown">{i === 0 ? "👑" : "♛"}</span>
              <span className="podium-rank__num">{i + 1}</span>
            </div>
            <div className="podium-player">
              <span className="podium-player__name">{displayName(row.username)}</span>
              <span className="podium-player__hand">
                {HAND_DISPLAY[row.best_hand as HandLabel] ?? row.best_hand}
              </span>
            </div>
            <span className="podium-score">{row.points.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {rows.length > 3 && (
        <ol className="leaderboard-list">
          {rows.slice(3).map((row, i) => (
            <li key={`${row.username}-${i + 3}`}>
              <span className="rank-num">{i + 4}</span>
              <span className="name">{displayName(row.username)}</span>
              <span className="pts">{row.points.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function LevelBoard({ rows }: { rows: LeaderboardsPayload["highest_level"] }) {
  if (!rows.length) {
    return <p className="muted">No campaign progress synced yet — play and sign in!</p>;
  }

  return (
    <ol className="leaderboard-list leaderboard-list--rich">
      {rows.map((row, i) => (
        <li key={`${row.user_id}-${i}`}>
          <span className="rank-num">{i + 1}</span>
          <span className="name">{displayName(row.username)}</span>
          <span className="leaderboard-list__meta">
            Level {row.level} · {row.completed} cleared · {row.stars_total}★
          </span>
        </li>
      ))}
    </ol>
  );
}

function HandBoard({ payload }: { payload: LeaderboardsPayload }) {
  return (
    <div className="leaderboard-hands-grid">
      {HAND_SCORE_LIST.map(({ hand }) => {
        const leaders = payload.hand_leaders[hand] ?? [];
        const top = leaders[0];
        return (
          <div key={hand} className="leaderboard-hand-card">
            <h4 className="leaderboard-hand-card__title">{HAND_DISPLAY[hand]}</h4>
            {top ? (
              <>
                <p className="leaderboard-hand-card__leader">{displayName(top.username)}</p>
                <p className="leaderboard-hand-card__count">{top.count.toLocaleString()} hands</p>
              </>
            ) : (
              <p className="muted">No data yet</p>
            )}
            {leaders.length > 1 && (
              <ol className="leaderboard-hand-card__rest">
                {leaders.slice(1, 4).map((row, i) => (
                  <li key={`${row.user_id}-${i}`}>
                    <span>{displayName(row.username)}</span>
                    <span>{row.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Leaderboard() {
  const [view, setView] = useState<View>("scores");
  const [data, setData] = useState<LeaderboardsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboards(12)
      .then(setData)
      .catch(() => setError("Could not load leaderboard"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading leaderboard…</p>;

  return (
    <div className="leaderboard-royal">
      <div className="royal-frame">
        <span className="royal-frame__crown" aria-hidden>
          👑
        </span>
        <h3 className="royal-frame__title">Top players</h3>
        <p className="royal-frame__sub">Scores, levels, and hand mastery</p>
      </div>

      <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard views">
        <button
          type="button"
          role="tab"
          className={`leaderboard-tabs__btn${view === "scores" ? " leaderboard-tabs__btn--active" : ""}`}
          onClick={() => setView("scores")}
        >
          Top scores
        </button>
        <button
          type="button"
          role="tab"
          className={`leaderboard-tabs__btn${view === "level" ? " leaderboard-tabs__btn--active" : ""}`}
          onClick={() => setView("level")}
        >
          Highest level
        </button>
        <button
          type="button"
          role="tab"
          className={`leaderboard-tabs__btn${view === "hands" ? " leaderboard-tabs__btn--active" : ""}`}
          onClick={() => setView("hands")}
        >
          Hand masters
        </button>
      </div>

      {view === "scores" && <ScorePodium rows={data.top_scores} />}
      {view === "level" && <LevelBoard rows={data.highest_level} />}
      {view === "hands" && <HandBoard payload={data} />}
    </div>
  );
}
