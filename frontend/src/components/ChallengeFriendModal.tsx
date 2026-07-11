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
import { getCurrentLevel } from "../lib/levelProgress";
import { formatLevelId } from "../lib/levelMap";

interface Props {
  onClose: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
}

type Tab = "play" | "friends" | "inbox";

export function ChallengeFriendModal({ onClose, onPlayChallenge }: Props) {
  const [tab, setTab] = useState<Tab>("play");
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [incoming, setIncoming] = useState<FriendshipItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);
  const [friendId, setFriendId] = useState<number | null>(null);
  const [level, setLevel] = useState(() => getCurrentLevel());
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
      setChallenges(c.challenges);
      if (friendId == null && f.friends[0]) setFriendId(f.friends[0].user.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load friends");
    }
  }, [friendId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pendingInbox = challenges.filter(
    (c) =>
      (c.status === "pending" && c.you_are === "opponent") ||
      c.status === "active" ||
      (c.status === "completed" &&
        Date.now() - new Date(c.created_at).getTime() < 7 * 24 * 60 * 60 * 1000)
  );

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
      const { challenge } = await createChallenge(friendId, level);
      setInfo(`Challenge sent — level ${formatLevelId(level)}`);
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
        className="modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="challenge-title"
      >
        <h2 id="challenge-title">Challenge a friend</h2>
        <p className="play-mode-modal__lead">
          Same seeded board. Best stars win — fewest moves, then score.
        </p>

        <div className="play-mode-tabs" role="tablist">
          {(["play", "friends", "inbox"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`play-mode-tab${tab === t ? " play-mode-tab--on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "play" ? "New" : t === "friends" ? "Friends" : `Inbox (${pendingInbox.length})`}
            </button>
          ))}
        </div>

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
              <>
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
              </>
            )}

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

            {outgoing.length > 0 && (
              <>
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
              </>
            )}
          </div>
        )}

        {tab === "play" && (
          <div className="play-mode-panel">
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
                      <span className="challenge-friend__level">Select</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="play-mode-modal__section">Level</h3>
            <div className="challenge-level-row">
              <label htmlFor="challenge-level">Campaign level</label>
              <input
                id="challenge-level"
                type="number"
                min={1}
                max={500}
                value={level}
                onChange={(e) => setLevel(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              />
              <span className="play-mode-modal__hint">{formatLevelId(level)}</span>
            </div>

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
              <p className="play-mode-modal__hint">No challenges yet.</p>
            ) : (
              <ul className="challenge-inbox-list">
                {pendingInbox.map((c) => {
                  const other =
                    c.you_are === "challenger" ? c.opponent?.username : c.challenger?.username;
                  return (
                    <li key={c.id} className="challenge-inbox-item">
                      <div>
                        <strong>
                          vs {other ?? "?"} · {formatLevelId(c.level)}
                        </strong>
                        <span className="challenge-inbox-item__meta">
                          {c.status}
                          {c.challenger_result || c.opponent_result
                            ? " · results in"
                            : ""}
                        </span>
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
                        {c.status === "completed" && (
                          <button
                            type="button"
                            className="play-mode-wager"
                            onClick={() => onPlayChallenge(c)}
                          >
                            View
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

        <button type="button" className="btn scores-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
