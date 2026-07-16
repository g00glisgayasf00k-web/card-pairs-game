import { useEffect, useState } from "react";
import {
  fetchFriendsBoard,
  fetchLeaderboards,
  type LeaderboardFriendRow,
  type LeaderboardLevelRow,
  type LeaderboardRatingRow,
  type TournamentWinnerCup,
} from "../lib/api";
import { getUsername, isLoggedIn } from "../lib/session";

type ScoresTab = "stars" | "quick" | "friends" | "tournament";

const TABS: { id: ScoresTab; label: string }[] = [
  { id: "stars", label: "Most Stars" },
  { id: "quick", label: "Top Quick Play" },
  { id: "friends", label: "My Friends" },
  { id: "tournament", label: "Tournament Winners" },
];

const PODIUM_CLASS = ["podium-card--gold", "podium-card--silver", "podium-card--bronze"] as const;

function displayName(username: string, isYou?: boolean): string {
  if (isYou) return "You";
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

function RatingBoard({ rows }: { rows: LeaderboardRatingRow[] }) {
  if (!rows.length) {
    return <p className="muted">No Quick Play ratings yet — win a match to climb the board.</p>;
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
                {i === 0 ? "♛" : "☆"}
              </span>
              <span className="podium-rank__num">{i + 1}</span>
            </div>
            <div className="podium-player">
              <span className="podium-player__name">{displayName(row.username)}</span>
              <span className="podium-player__hand">{row.stars_total.toLocaleString()}★ campaign</span>
            </div>
            <span className="podium-score">{row.rating.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {rest.length > 0 && (
        <ol className="leaderboard-list">
          {rest.map((row, i) => (
            <li key={`${row.user_id}-${i + 3}`}>
              <span className="rank-num">{i + 4}</span>
              <span className="name">{displayName(row.username)}</span>
              <span className="pts">{row.rating.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function FriendsBoard({ rows }: { rows: LeaderboardFriendRow[] }) {
  if (!rows.length) {
    return (
      <p className="muted">
        Add friends from Head to Head to compare campaign stars here.
      </p>
    );
  }

  return (
    <ol className="leaderboard-list">
      {rows.map((row, i) => (
        <li key={`${row.user_id}-${i}`} className={row.is_you ? "leaderboard-list__you" : undefined}>
          <span className="rank-num">{i + 1}</span>
          <span className="name">{displayName(row.username, row.is_you)}</span>
          <span className="pts">{row.stars_total.toLocaleString()}★</span>
        </li>
      ))}
    </ol>
  );
}

function TournamentBoard({ cups }: { cups: TournamentWinnerCup[] }) {
  const any = cups.some((c) => c.winners.length > 0);
  if (!any) {
    return <p className="muted">No cup winners yet — enter a Tournament to claim the board.</p>;
  }

  return (
    <div className="leaderboard-cups">
      {cups.map((cup) => (
        <section key={cup.tier_id} className="leaderboard-cup">
          <h4 className="leaderboard-cup__title">{cup.name}</h4>
          {cup.winners.length === 0 ? (
            <p className="muted leaderboard-cup__empty">No runs yet</p>
          ) : (
            <ol className="leaderboard-list">
              {cup.winners.map((row) => (
                <li key={`${cup.tier_id}-${row.user_id}-${row.place}`}>
                  <span className="rank-num">{row.place}</span>
                  <span className="name">{displayName(row.username)}</span>
                  <span className="pts">{row.score.toLocaleString()} pts</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}

export function Leaderboard() {
  const [tab, setTab] = useState<ScoresTab>("stars");
  const [stars, setStars] = useState<LeaderboardLevelRow[] | null>(null);
  const [quick, setQuick] = useState<LeaderboardRatingRow[] | null>(null);
  const [friends, setFriends] = useState<LeaderboardFriendRow[] | null>(null);
  const [cups, setCups] = useState<TournamentWinnerCup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboards(20)
      .then((data) => {
        if (cancelled) return;
        setStars(data.most_stars ?? data.highest_level ?? []);
        setQuick(data.top_quick_play ?? []);
        setCups(data.tournament_winners ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load Top Scores");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tab !== "friends") return;
    if (!isLoggedIn()) {
      setFriends([]);
      setFriendsError("Sign in to see friends’ scores.");
      return;
    }
    let cancelled = false;
    setFriendsError(null);
    fetchFriendsBoard(20)
      .then((data) => {
        if (!cancelled) setFriends(data.friends);
      })
      .catch(() => {
        if (!cancelled) {
          setFriends([]);
          setFriendsError("Could not load friends board");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const lead =
    tab === "stars"
      ? "Campaign stars earned across all levels"
      : tab === "quick"
        ? "Highest Quick Play Rating"
        : tab === "friends"
          ? "Stars among you and your friends"
          : "Current top finishers in each cup";

  return (
    <div className="leaderboard-royal">
      <div className="royal-frame">
        <span className="royal-frame__crown" aria-hidden>
          ★
        </span>
        <h3 className="royal-frame__title">Top Scores</h3>
        <p className="royal-frame__sub">{lead}</p>
      </div>

      <div className="leaderboard-tabs" role="tablist" aria-label="Score boards">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`leaderboard-tabs__btn${tab === t.id ? " leaderboard-tabs__btn--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {tab === "stars" && (
        stars ? <StarsBoard rows={stars} /> : !error ? <p className="muted">Loading…</p> : null
      )}
      {tab === "quick" && (
        quick ? <RatingBoard rows={quick} /> : !error ? <p className="muted">Loading…</p> : null
      )}
      {tab === "friends" && (
        friendsError ? (
          <p className="muted">{friendsError}</p>
        ) : friends ? (
          <FriendsBoard rows={friends} />
        ) : (
          <p className="muted">Loading…</p>
        )
      )}
      {tab === "tournament" && (
        cups ? <TournamentBoard cups={cups} /> : !error ? <p className="muted">Loading…</p> : null
      )}
    </div>
  );
}
