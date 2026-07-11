import { useCallback, useEffect, useState } from "react";
import {
  acceptChallenge,
  acceptFriend,
  createChallenge,
  declineChallenge,
  declineFriend,
  fetchChallenges,
  fetchFriends,
  requestFriend,
  type ChallengeDto,
  type FriendshipItem,
} from "../lib/api";

interface Props {
  onClose: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  friendRequestCount?: number;
  challengeCount?: number;
}

type Tab = "play" | "friends" | "inbox" | "results";

function myAttempt(c: ChallengeDto) {
  return c.you_are === "challenger" ? c.challenger_result : c.opponent_result;
}

function theirAttempt(c: ChallengeDto) {
  return c.you_are === "challenger" ? c.opponent_result : c.challenger_result;
}

function challengeOutcome(c: ChallengeDto): string | null {
  if (c.status !== "completed") return null;
  const mine = myAttempt(c);
  const theirs = theirAttempt(c);
  if (!mine || !theirs) return null;
  const myId = c.you_are === "challenger" ? c.challenger?.id : c.opponent?.id;
  if (c.winner_user_id == null) return "Tie";
  return c.winner_user_id === myId ? "You win" : "You lose";
}

function opponentName(c: ChallengeDto): string {
  return (c.you_are === "challenger" ? c.opponent?.username : c.challenger?.username) ?? "?";
}

function ResultCard({ c }: { c: ChallengeDto }) {
  const mine = myAttempt(c);
  const theirs = theirAttempt(c);
  const other = opponentName(c);
  const outcome = challengeOutcome(c);

  return (
    <li className="challenge-results-card challenge-results-card--list">
      <div className="challenge-results-card__head">
        <strong>vs {other}</strong>
        {outcome ? (
          <span className="challenge-results-card__outcome">{outcome}</span>
        ) : (
          <span className="challenge-inbox-item__meta">Waiting</span>
        )}
      </div>
      <p>
        You {mine?.stars ?? 0}★ / {mine?.moves ?? 0}m / {(mine?.score ?? 0).toLocaleString()}
      </p>
      {theirs ? (
        <p>
          {other} {theirs.stars}★ / {theirs.moves}m / {theirs.score.toLocaleString()}
        </p>
      ) : (
        <p className="play-mode-modal__hint">Waiting for {other}…</p>
      )}
    </li>
  );
}

export function ChallengeFriendModal({
  onClose,
  onPlayChallenge,
  friendRequestCount = 0,
  challengeCount = 0,
}: Props) {
  const [tab, setTab] = useState<Tab>("play");
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [incoming, setIncoming] = useState<FriendshipItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);
  const [friendId, setFriendId] = useState<number | null>(null);
  const [addName, setAddName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [f, c] = await Promise.all([fetchFriends(), fetchChallenges()]);
      setFriends(f.friends);
      setIncoming(f.incoming);
      setOutgoing(f.outgoing);
      setChallenges(c.challenges.filter((ch) => (ch.kind ?? "friend") === "friend"));
      if (friendId == null && f.friends[0]) setFriendId(f.friends[0].user.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load friends");
    }
  }, [friendId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pendingInbox = challenges.filter((c) => {
    const mine = myAttempt(c);
    if (c.status === "pending" && c.you_are === "opponent") return true;
    if (mine) return false;
    return (
      c.status === "active" || (c.status === "pending" && c.you_are === "challenger")
    );
  });

  const resultsList = challenges
    .filter((c) => {
      const mine = myAttempt(c);
      if (!mine) return false;
      if (c.status === "completed" || c.status === "active") return true;
      return (
        c.status === "expired" &&
        Date.now() - new Date(c.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const friendsBadge = Math.max(friendRequestCount, incoming.length);
  const inboxBadge = Math.max(
    challengeCount,
    pendingInbox.length
  );
  const resultsBadge = resultsList.filter((c) => c.status === "completed").length;

  const sendFriendRequest = async () => {
    if (!addName.trim()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await requestFriend(addName.trim());
      setAddName("");
      setInfo("Friend request sent");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const sendChallenge = async () => {
    if (friendId == null) {
      setError("Pick a friend first");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { challenge } = await createChallenge(friendId);
      setInfo("Challenge sent — same board for both of you");
      await reload();
      setTab("inbox");
      onPlayChallenge(challenge);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create challenge");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay scores-overlay home-menu-overlay" onClick={onClose} role="presentation">
      <div
        className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal play-mode-modal--challenge"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="challenge-title"
      >
        <header className="play-mode-modal__header">
          <h2 id="challenge-title">Challenge your friends</h2>
          <p className="play-mode-modal__lead">
            Challenge your friends. Same starting board, same hands, same point goal —
            the winner finishes in the fewest moves.
          </p>
        </header>

        <div className="play-mode-tabs" role="tablist">
          {(["play", "friends", "inbox", "results"] as Tab[]).map((t) => {
            const badge =
              t === "friends"
                ? friendsBadge
                : t === "inbox"
                  ? inboxBadge
                  : t === "results"
                    ? resultsBadge
                    : 0;
            const label =
              t === "play" ? "New" : t === "friends" ? "Friends" : t === "inbox" ? "Inbox" : "Results";
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`play-mode-tab${tab === t ? " play-mode-tab--on" : ""}`}
                onClick={() => setTab(t)}
              >
                {label}
                {badge > 0 && (
                  <span className="play-mode-tab__badge" aria-hidden>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="play-mode-modal__body">
          {error && <p className="play-mode-modal__error">{error}</p>}
          {info && <p className="play-mode-modal__note">{info}</p>}

          {tab === "friends" && (
            <div className="play-mode-panel">
              <div className="challenge-add-friend">
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Username"
                  aria-label="Friend username"
                  maxLength={64}
                />
                <button type="button" className="btn-primary" disabled={busy} onClick={() => void sendFriendRequest()}>
                  Add
                </button>
              </div>

              {incoming.length > 0 && (
                <section className="play-mode-section">
                  <h3 className="play-mode-modal__section">Incoming</h3>
                  <ul className="challenge-friend-list">
                    {incoming.map((f) => (
                      <li key={f.id}>
                        <div className="challenge-friend challenge-friend--row">
                          <span className="challenge-friend__name">{f.user.username}</span>
                          <button
                            type="button"
                            className="play-mode-wager play-mode-wager--on"
                            disabled={busy}
                            onClick={() => void acceptFriend(f.id).then(reload)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="play-mode-wager"
                            disabled={busy}
                            onClick={() => void declineFriend(f.id).then(reload)}
                          >
                            Decline
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="play-mode-section">
                <h3 className="play-mode-modal__section">Friends</h3>
                {friends.length === 0 ? (
                  <p className="play-mode-modal__hint">No friends yet — add someone by username.</p>
                ) : (
                  <ul className="challenge-friend-list">
                    {friends.map((f) => (
                      <li key={f.id}>
                        <div className="challenge-friend">
                          <span className="challenge-friend__name">{f.user.username}</span>
                          <span className="challenge-friend__status challenge-friend__status--online">friend</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {outgoing.length > 0 && (
                <section className="play-mode-section">
                  <h3 className="play-mode-modal__section">Outgoing</h3>
                  <ul className="challenge-friend-list">
                    {outgoing.map((f) => (
                      <li key={f.id}>
                        <div className="challenge-friend">
                          <span className="challenge-friend__name">{f.user.username}</span>
                          <span className="challenge-friend__status">pending</span>
                          <button
                            type="button"
                            className="play-mode-wager"
                            disabled={busy}
                            onClick={() => void declineFriend(f.id).then(reload)}
                          >
                            Cancel
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {tab === "play" && (
            <div className="play-mode-panel">
              <section className="play-mode-section">
                <h3 className="play-mode-modal__section">Opponent</h3>
                {friends.length === 0 ? (
                  <p className="play-mode-modal__hint">Add a friend first (Friends tab).</p>
                ) : (
                  <ul className="challenge-friend-list">
                    {friends.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          className={`challenge-friend${friendId === f.user.id ? " challenge-friend--selected" : ""}`}
                          onClick={() => setFriendId(f.user.id)}
                        >
                          <span className="challenge-friend__name">{f.user.username}</span>
                          <span className="challenge-friend__level">
                            {friendId === f.user.id ? "Selected" : "Select"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="play-mode-section">
                <h3 className="play-mode-modal__section">Board</h3>
                <p className="play-mode-modal__hint">
                  Both of you get the same seeded board, matched from campaign progress.
                </p>
              </section>

              <button
                type="button"
                className="btn-primary"
                disabled={busy || friendId == null}
                onClick={() => void sendChallenge()}
              >
                Send &amp; play now
              </button>
            </div>
          )}

          {tab === "inbox" && (
            <div className="play-mode-panel">
              {pendingInbox.length === 0 ? (
                <p className="play-mode-modal__hint">
                  Nothing to play — check Results for finished matches.
                </p>
              ) : (
                <ul className="challenge-inbox-list">
                  {pendingInbox.map((c) => {
                    const other = opponentName(c);
                    return (
                      <li key={c.id} className="challenge-inbox-item">
                        <div>
                          <strong>vs {other}</strong>
                          <span className="challenge-inbox-item__meta">{c.status}</span>
                        </div>
                        <div className="challenge-inbox-item__actions">
                          {c.status === "pending" && c.you_are === "opponent" && (
                            <>
                              <button
                                type="button"
                                className="play-mode-wager play-mode-wager--on"
                                disabled={busy}
                                onClick={() =>
                                  void acceptChallenge(c.id).then((r) => {
                                    onPlayChallenge(r.challenge);
                                  })
                                }
                              >
                                Accept &amp; play
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => void declineChallenge(c.id).then(reload)}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {(c.status === "active" ||
                            (c.status === "pending" && c.you_are === "challenger")) && (
                            <button
                              type="button"
                              className="play-mode-wager play-mode-wager--on"
                              onClick={() => onPlayChallenge(c)}
                            >
                              Play
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {tab === "results" && (
            <div className="play-mode-panel">
              {resultsList.length === 0 ? (
                <p className="play-mode-modal__hint">
                  No results yet — finish a challenge to see scores here.
                </p>
              ) : (
                <ul className="challenge-results-list">
                  {resultsList.map((c) => (
                    <ResultCard key={c.id} c={c} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <footer className="play-mode-modal__footer">
          <button type="button" className="btn scores-close" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
