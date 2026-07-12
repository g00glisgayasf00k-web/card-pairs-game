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
import {
  countUnseenCompletedResults,
  markChallengeResultsSeen,
} from "../lib/challengeResultSeen";
import { hasEnergy, syncEnergyState, trySpendEnergyOnce } from "../lib/energy";
import { OutOfEnergyModal } from "./OutOfEnergyModal";
import { HOME_ASSETS } from "./home/homeAssets";

interface Props {
  onClose: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  friendRequestCount?: number;
  challengeCount?: number;
  /** Called after Results are marked seen so home badges can clear. */
  onNotificationsChange?: () => void;
  /** If set, footer shows Back (calls onBack) in addition to Close. */
  onBack?: () => void;
  /** Use the Multiplayer UI-kit full-screen shell. */
  kitShell?: boolean;
}

type Tab = "play" | "friends" | "inbox" | "results";

type EnergyConfirm =
  | { kind: "send" }
  | { kind: "accept"; challengeId: number }
  | null;

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

function resultWhen(c: ChallengeDto): Date {
  const mine = myAttempt(c)?.submitted_at;
  const theirs = theirAttempt(c)?.submitted_at;
  const stamps = [mine, theirs, c.created_at].filter(Boolean) as string[];
  let best = 0;
  for (const s of stamps) {
    const t = new Date(s).getTime();
    if (!Number.isNaN(t) && t > best) best = t;
  }
  return new Date(best || Date.now());
}

function formatResultWhen(d: Date): string {
  try {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString();
  }
}

function ResultCard({ c }: { c: ChallengeDto }) {
  const [open, setOpen] = useState(false);
  const mine = myAttempt(c);
  const theirs = theirAttempt(c);
  const other = opponentName(c);
  const outcome = challengeOutcome(c);
  const when = formatResultWhen(resultWhen(c));

  return (
    <li className={`challenge-results-card challenge-results-card--list${open ? " challenge-results-card--open" : ""}`}>
      <button
        type="button"
        className="challenge-results-card__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="challenge-results-card__summary">
          <strong>vs {other}</strong>
          <span className="challenge-results-card__when">{when}</span>
        </span>
        <span className="challenge-results-card__side">
          {outcome ? (
            <span className="challenge-results-card__outcome">{outcome}</span>
          ) : (
            <span className="challenge-inbox-item__meta">Waiting</span>
          )}
          <span className="challenge-results-card__chevron" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </span>
      </button>
      {open && (
        <div className="challenge-results-card__body">
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
        </div>
      )}
    </li>
  );
}

export function ChallengeFriendModal({
  onClose,
  onPlayChallenge,
  friendRequestCount = 0,
  challengeCount = 0,
  onNotificationsChange,
  onBack,
  kitShell = false,
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
  const [seenTick, setSeenTick] = useState(0);
  const [energyConfirm, setEnergyConfirm] = useState<EnergyConfirm>(null);
  const [showOutOfEnergy, setShowOutOfEnergy] = useState(false);

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
  const inboxBadge = Math.max(challengeCount, pendingInbox.length);
  void seenTick;
  const resultsBadge = countUnseenCompletedResults(challenges);
  const resultIdsKey = resultsList.map((c) => c.id).sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (tab !== "results" || !resultIdsKey) return;
    const ids = resultIdsKey.split(",").map((n) => Number(n));
    const before = countUnseenCompletedResults(challenges);
    markChallengeResultsSeen(ids);
    setSeenTick((t) => t + 1);
    if (before > 0) onNotificationsChange?.();
  }, [tab, resultIdsKey, challenges, onNotificationsChange]);

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

  const spendEnergyOrShowModal = (): boolean => {
    syncEnergyState();
    if (!hasEnergy(1) || !trySpendEnergyOnce()) {
      setEnergyConfirm(null);
      setShowOutOfEnergy(true);
      return false;
    }
    return true;
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
      await createChallenge(friendId);
      setInfo("Challenge sent. Waiting for your friend to accept.");
      await reload();
      setTab("inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create challenge");
    } finally {
      setBusy(false);
    }
  };

  const doAcceptChallenge = async (challengeId: number) => {
    setBusy(true);
    setError(null);
    try {
      const r = await acceptChallenge(challengeId);
      onPlayChallenge(r.challenge);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnergyAction = () => {
    if (!energyConfirm) return;
    if (!spendEnergyOrShowModal()) return;
    const action = energyConfirm;
    setEnergyConfirm(null);
    if (action.kind === "send") {
      void sendChallenge();
    } else {
      void doAcceptChallenge(action.challengeId);
    }
  };

  return (
    <>
      <div
        className={kitShell ? "mp-kit-overlay" : "modal-overlay scores-overlay home-menu-overlay"}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={
            kitShell
              ? "mp-kit mp-kit--friends"
              : "modal scores-modal home-menu-modal home-menu-modal--wide play-mode-modal play-mode-modal--challenge"
          }
          style={kitShell ? { backgroundImage: `url(${HOME_ASSETS.background.main})` } : undefined}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="challenge-title"
        >
          {kitShell && <div className="mp-kit__veil" aria-hidden />}
          <div className={kitShell ? "mp-kit__inner" : undefined}>
            {kitShell && (
              <div className="mp-kit__top">
                <div className="mp-kit__brand">
                  <img
                    className="mp-kit__brand-label"
                    src={HOME_ASSETS.cards.blue.label}
                    alt="Multiplayer"
                  />
                </div>
                <button type="button" className="mp-kit__close" onClick={onClose} aria-label="Close">
                  ×
                </button>
              </div>
            )}

          <header className="play-mode-modal__header">
            <h2 id="challenge-title">Challenge a friend</h2>
            <p className="play-mode-modal__lead">
              Free multiplayer — each player spends 1 ⚡. No gems. Same board; best stars win.
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
                  <h3 className="play-mode-modal__section">How it works</h3>
                  <p className="play-mode-modal__hint">
                    You both play the identical board and clear the same goals. Best stars win —
                    if tied, fewest moves, then highest score. Each of you spends 1 ⚡.
                  </p>
                </section>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy || friendId == null}
                  onClick={() => setEnergyConfirm({ kind: "send" })}
                >
                  Send challenge · ⚡1
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
                      const pendingIncoming = c.status === "pending" && c.you_are === "opponent";
                      const pendingOutgoing = c.status === "pending" && c.you_are === "challenger";

                      return (
                        <li key={c.id} className="challenge-inbox-item challenge-inbox-item--stack">
                          <div>
                            <strong>vs {other}</strong>
                            <span className="challenge-inbox-item__meta">{c.status}</span>
                          </div>

                          <div className="challenge-inbox-item__actions">
                            {pendingIncoming && (
                              <>
                                <button
                                  type="button"
                                  className="play-mode-wager play-mode-wager--on"
                                  disabled={busy}
                                  onClick={() => setEnergyConfirm({ kind: "accept", challengeId: c.id })}
                                >
                                  Accept · ⚡1
                                </button>
                                <button
                                  type="button"
                                  className="play-mode-wager"
                                  disabled={busy}
                                  onClick={() => {
                                    void declineChallenge(c.id).then(() => reload());
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {pendingOutgoing && (
                              <>
                                <span className="challenge-inbox-item__meta">Waiting for accept…</span>
                                <button
                                  type="button"
                                  className="play-mode-wager"
                                  disabled={busy}
                                  onClick={() => {
                                    void declineChallenge(c.id).then(() => reload());
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {c.status === "active" && (
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

          <footer className={kitShell ? "mp-kit__footer" : "play-mode-modal__footer"}>
            {onBack && (
              <button
                type="button"
                className={kitShell ? "mp-kit__ghost" : "btn scores-close"}
                onClick={onBack}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className={kitShell ? "mp-kit__ghost" : "btn scores-close"}
              onClick={onClose}
            >
              Close
            </button>
          </footer>
          </div>
        </div>
      </div>

      {energyConfirm && (
        <div className="modal-overlay scores-overlay" role="presentation">
          <div className="modal scores-modal" role="dialog" aria-labelledby="challenge-energy-title">
            <h2 id="challenge-energy-title">
              {energyConfirm.kind === "send" ? "Send challenge?" : "Accept challenge?"}
            </h2>
            <p>This costs 1 ⚡</p>
            <div className="play-mode-modal__actions" style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn-primary" onClick={confirmEnergyAction}>
                Spend ⚡1 &amp; {energyConfirm.kind === "send" ? "send" : "accept"}
              </button>
              <button type="button" className="btn scores-close" onClick={() => setEnergyConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showOutOfEnergy && (
        <OutOfEnergyModal
          onClose={() => setShowOutOfEnergy(false)}
          onRefilled={() => setShowOutOfEnergy(false)}
          onOpenTreasury={() => setShowOutOfEnergy(false)}
        />
      )}
    </>
  );
}
