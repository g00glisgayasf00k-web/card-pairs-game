import { useCallback, useEffect, useState } from "react";
import {
  acceptChallenge,
  acceptFriend,
  createChallenge,
  declineChallenge,
  declineFriend,
  fetchChallenges,
  fetchFriends,
  negotiateChallenge,
  rejectChallengeOffer,
  requestFriend,
  type ChallengeDto,
  type FriendshipItem,
} from "../lib/api";
import {
  countUnseenCompletedResults,
  markChallengeResultsSeen,
} from "../lib/challengeResultSeen";
import {
  WAGER_MAX,
  WAGER_MIN,
  WAGER_PRESETS,
  challengeFeeGems,
  clampWager,
} from "../lib/challengeWager";
import { loadProgress, applyServerCredits } from "../lib/progress";
import { flushProgressSync } from "../lib/progressSync";

interface Props {
  onClose: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  friendRequestCount?: number;
  challengeCount?: number;
  /** Called after Results are marked seen so home badges can clear. */
  onNotificationsChange?: () => void;
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
          {c.wager_gems > 0 && (
            <span className="challenge-results-card__when">{c.wager_gems}💎 pot</span>
          )}
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
}: Props) {
  const [tab, setTab] = useState<Tab>("play");
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [incoming, setIncoming] = useState<FriendshipItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendshipItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);
  const [friendId, setFriendId] = useState<number | null>(null);
  const [wagerPreset, setWagerPreset] = useState<number | "custom">(5);
  const [customWager, setCustomWager] = useState("10");
  const [negotiateId, setNegotiateId] = useState<number | null>(null);
  const [negotiatePreset, setNegotiatePreset] = useState<number | "custom">(25);
  const [negotiateCustom, setNegotiateCustom] = useState("25");
  const [addName, setAddName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [seenTick, setSeenTick] = useState(0);

  const wagerGems =
    wagerPreset === "custom" ? clampWager(Number(customWager) || 0) : wagerPreset;
  const feeGems = challengeFeeGems(wagerGems);
  const createCost = wagerGems + feeGems;
  const gemBalance = loadProgress()?.credits ?? 0;
  const negotiateWager =
    negotiatePreset === "custom"
      ? clampWager(Number(negotiateCustom) || 0)
      : negotiatePreset;
  const negotiateFee = challengeFeeGems(negotiateWager);

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

  const applyCreditsIfPresent = (res: {
    credits?: number;
    client_updated_at?: number;
  }) => {
    if (typeof res.credits === "number") {
      applyServerCredits(res.credits, res.client_updated_at);
    }
  };

  const sendChallenge = async () => {
    if (friendId == null) {
      setError("Pick a friend first");
      return;
    }
    if (wagerGems < WAGER_MIN) {
      setError(`Wager must be at least ${WAGER_MIN} gem`);
      return;
    }
    if (gemBalance < createCost) {
      setError(`Not enough gems — need ${createCost} (${wagerGems} wager + ${feeGems} fee)`);
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await flushProgressSync();
      const res = await createChallenge(friendId, wagerGems);
      applyCreditsIfPresent(res);
      setInfo(
        `Challenge sent for ${wagerGems}💎 (fee ${feeGems}💎). Waiting for your friend to accept, reject, or negotiate.`
      );
      await reload();
      setTab("inbox");
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
            Wager gems on a shared-board duel. Your friend can accept, reject, or negotiate
            the stake (fee is 5%, min 1💎, paid by the challenger).
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
                <h3 className="play-mode-modal__section">Wager</h3>
                <div className="play-mode-wagers" role="group" aria-label="Wager amount">
                  {WAGER_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`play-mode-wager${wagerPreset === amount ? " play-mode-wager--on" : ""}`}
                      onClick={() => setWagerPreset(amount)}
                    >
                      {amount}💎
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`play-mode-wager${wagerPreset === "custom" ? " play-mode-wager--on" : ""}`}
                    onClick={() => setWagerPreset("custom")}
                  >
                    Custom
                  </button>
                </div>
                {wagerPreset === "custom" && (
                  <label className="play-mode-custom-wager">
                    <span>Custom wager</span>
                    <input
                      type="number"
                      min={WAGER_MIN}
                      max={WAGER_MAX}
                      value={customWager}
                      onChange={(e) => setCustomWager(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                )}
                <p className="play-mode-modal__hint play-mode-modal__hint--energy">
                  You stake {wagerGems}💎 + {feeGems}💎 fee ({createCost}💎 total). Friend matches{" "}
                  {wagerGems}💎. Winner takes {wagerGems * 2}💎. You have {gemBalance.toLocaleString()}💎.
                </p>
              </section>

              <section className="play-mode-section">
                <h3 className="play-mode-modal__section">How it works</h3>
                <p className="play-mode-modal__hint">
                  You both play the identical board and clear the same goals. Best stars win —
                  if tied, fewest moves, then highest score.
                </p>
              </section>

              <button
                type="button"
                className="btn-primary"
                disabled={busy || friendId == null || gemBalance < createCost}
                onClick={() => void sendChallenge()}
              >
                Send challenge · {createCost}💎
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
                    const wager = c.wager_gems || 0;
                    const fee = c.fee_gems ?? challengeFeeGems(wager);
                    const proposed = c.proposed_wager_gems ?? null;
                    const proposedFee = c.proposed_fee_gems ?? (proposed ? challengeFeeGems(proposed) : null);
                    const proposedByMe = c.proposed_by === c.you_are;
                    const hasOpenOffer = proposed != null && c.proposed_by != null;
                    const canRespondToOffer = hasOpenOffer && !proposedByMe;
                    const isNegotiating = negotiateId === c.id;
                    const pendingIncoming = c.status === "pending" && c.you_are === "opponent" && !hasOpenOffer;
                    const pendingOutgoing =
                      c.status === "pending" && c.you_are === "challenger" && !hasOpenOffer;
                    const waitingOnMyOffer = c.status === "pending" && hasOpenOffer && proposedByMe;

                    return (
                      <li key={c.id} className="challenge-inbox-item challenge-inbox-item--stack">
                        <div>
                          <strong>vs {other}</strong>
                          <span className="challenge-inbox-item__meta">
                            {c.status}
                            {wager > 0 ? ` · ${wager}💎` : ""}
                            {fee > 0 ? ` · fee ${fee}💎` : ""}
                          </span>
                          {hasOpenOffer && (
                            <span className="challenge-inbox-item__meta challenge-inbox-item__meta--offer">
                              {proposedByMe ? "Your offer" : "Their offer"}: {proposed}💎
                              {proposedFee != null ? ` (fee ${proposedFee}💎)` : ""}
                            </span>
                          )}
                        </div>

                        <div className="challenge-inbox-item__actions">
                          {pendingIncoming && (
                            <>
                              <button
                                type="button"
                                className="play-mode-wager play-mode-wager--on"
                                disabled={busy}
                                onClick={() => {
                                  void (async () => {
                                    setBusy(true);
                                    setError(null);
                                    try {
                                      await flushProgressSync();
                                      const r = await acceptChallenge(c.id);
                                      applyCreditsIfPresent(r);
                                      onPlayChallenge(r.challenge);
                                    } catch (e) {
                                      setError(
                                        e instanceof Error ? e.message : "Could not accept"
                                      );
                                    } finally {
                                      setBusy(false);
                                    }
                                  })();
                                }}
                              >
                                Accept · {wager}💎
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  setNegotiateId(c.id);
                                  setNegotiatePreset(
                                    WAGER_PRESETS.includes(wager as (typeof WAGER_PRESETS)[number])
                                      ? (wager as (typeof WAGER_PRESETS)[number])
                                      : "custom"
                                  );
                                  setNegotiateCustom(String(wager || 25));
                                }}
                              >
                                Negotiate
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  void declineChallenge(c.id).then((r) => {
                                    applyCreditsIfPresent(r);
                                    return reload();
                                  });
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {canRespondToOffer && (
                            <>
                              <button
                                type="button"
                                className="play-mode-wager play-mode-wager--on"
                                disabled={busy}
                                onClick={() => {
                                  void (async () => {
                                    setBusy(true);
                                    setError(null);
                                    try {
                                      await flushProgressSync();
                                      const r = await acceptChallenge(c.id);
                                      applyCreditsIfPresent(r);
                                      setNegotiateId(null);
                                      onPlayChallenge(r.challenge);
                                    } catch (e) {
                                      setError(
                                        e instanceof Error ? e.message : "Could not accept offer"
                                      );
                                    } finally {
                                      setBusy(false);
                                    }
                                  })();
                                }}
                              >
                                Accept offer · {proposed}💎
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  void rejectChallengeOffer(c.id).then((r) => {
                                    applyCreditsIfPresent(r);
                                    return reload();
                                  });
                                }}
                              >
                                Reject offer
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  setNegotiateId(c.id);
                                  setNegotiatePreset(25);
                                  setNegotiateCustom("25");
                                }}
                              >
                                Counter
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  void declineChallenge(c.id).then((r) => {
                                    applyCreditsIfPresent(r);
                                    setNegotiateId(null);
                                    return reload();
                                  });
                                }}
                              >
                                Reject challenge
                              </button>
                            </>
                          )}

                          {waitingOnMyOffer && (
                            <>
                              <span className="challenge-inbox-item__meta">Waiting for reply…</span>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  setNegotiateId(c.id);
                                  setNegotiatePreset(
                                    proposed != null &&
                                      WAGER_PRESETS.includes(proposed as (typeof WAGER_PRESETS)[number])
                                      ? (proposed as (typeof WAGER_PRESETS)[number])
                                      : "custom"
                                  );
                                  setNegotiateCustom(String(proposed ?? 25));
                                }}
                              >
                                Change offer
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  void declineChallenge(c.id).then((r) => {
                                    applyCreditsIfPresent(r);
                                    setNegotiateId(null);
                                    return reload();
                                  });
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {pendingOutgoing && (
                            <>
                              <span className="challenge-inbox-item__meta">
                                Waiting for accept / negotiate…
                              </span>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => {
                                  void declineChallenge(c.id).then((r) => {
                                    applyCreditsIfPresent(r);
                                    return reload();
                                  });
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
                              Play{wager > 0 ? ` · ${wager}💎` : ""}
                            </button>
                          )}
                        </div>

                        {isNegotiating && (
                          <div className="challenge-negotiate">
                            <p className="play-mode-modal__hint">
                              Propose a wager — fee is 5% (min 1💎). Creator pays the fee.
                            </p>
                            <div className="play-mode-wagers" role="group" aria-label="Negotiate wager">
                              {WAGER_PRESETS.map((amount) => (
                                <button
                                  key={amount}
                                  type="button"
                                  className={`play-mode-wager${negotiatePreset === amount ? " play-mode-wager--on" : ""}`}
                                  onClick={() => setNegotiatePreset(amount)}
                                >
                                  {amount}💎
                                </button>
                              ))}
                              <button
                                type="button"
                                className={`play-mode-wager${negotiatePreset === "custom" ? " play-mode-wager--on" : ""}`}
                                onClick={() => setNegotiatePreset("custom")}
                              >
                                Custom
                              </button>
                            </div>
                            {negotiatePreset === "custom" && (
                              <label className="play-mode-custom-wager">
                                <span>Custom wager</span>
                                <input
                                  type="number"
                                  min={WAGER_MIN}
                                  max={WAGER_MAX}
                                  value={negotiateCustom}
                                  onChange={(e) => setNegotiateCustom(e.target.value)}
                                  inputMode="numeric"
                                />
                              </label>
                            )}
                            <p className="play-mode-modal__hint">
                              Offer {negotiateWager}💎 · fee {negotiateFee}💎 · pot {negotiateWager * 2}💎
                            </p>
                            <div className="challenge-inbox-item__actions">
                              <button
                                type="button"
                                className="play-mode-wager play-mode-wager--on"
                                disabled={busy || negotiateWager < WAGER_MIN}
                                onClick={() => {
                                  void (async () => {
                                    setBusy(true);
                                    setError(null);
                                    try {
                                      const r = await negotiateChallenge(c.id, negotiateWager);
                                      applyCreditsIfPresent(r);
                                      setNegotiateId(null);
                                      setInfo(`Offer sent: ${negotiateWager}💎`);
                                      await reload();
                                    } catch (e) {
                                      setError(
                                        e instanceof Error ? e.message : "Could not send offer"
                                      );
                                    } finally {
                                      setBusy(false);
                                    }
                                  })();
                                }}
                              >
                                Send offer
                              </button>
                              <button
                                type="button"
                                className="play-mode-wager"
                                disabled={busy}
                                onClick={() => setNegotiateId(null)}
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        )}
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
