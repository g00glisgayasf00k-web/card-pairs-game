import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChallengeFriendModal } from "./ChallengeFriendModal";
import { HOME_ASSETS } from "./home/homeAssets";
import {
  fetchChallenges,
  joinQuickMatch,
  leaveQuickMatch,
  pollQuickMatch,
  type ChallengeDto,
} from "../lib/api";
import {
  countUnseenCompletedResults,
  markChallengeResultsSeen,
} from "../lib/challengeResultSeen";
import { hasEnergy, syncEnergyState, trySpendEnergyOnce } from "../lib/energy";
import { loadProgress } from "../lib/progress";
import { isQuickPlayUnlocked, quickPlayUnlockLabel } from "../lib/quickPlayUnlock";
import { OutOfEnergyModal } from "./OutOfEnergyModal";

type View = "hub" | "quick" | "results" | "friends";

interface Props {
  onClose: () => void;
  onPlayChallenge: (challenge: ChallengeDto) => void;
  friendRequestCount?: number;
  challengeCount?: number;
  onNotificationsChange?: () => void;
  initialView?: View;
}

function MpShell({
  children,
  onClose,
  rating,
  showRating = true,
}: {
  children: ReactNode;
  onClose: () => void;
  rating?: number;
  showRating?: boolean;
}) {
  const a = HOME_ASSETS;
  return (
    <div className="mp-kit-overlay" onClick={onClose} role="presentation">
      <div
        className="mp-kit"
        style={{ backgroundImage: `url(${a.background.main})` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="multiplayer-title"
      >
        <div className="mp-kit__veil" aria-hidden />
        <div className="mp-kit__inner">
          <div className="mp-kit__top">
            <div className="mp-kit__brand">
              <img className="mp-kit__brand-label" src={a.cards.blue.label} alt="Multiplayer" />
              {showRating && rating != null && (
                <span className="mp-kit__rating">
                  <img src={a.home.levelBadge} alt="" />
                  Rating {rating}
                </span>
              )}
            </div>
            <button type="button" className="mp-kit__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function MpHero({ title, lead }: { title: string; lead: string }) {
  const a = HOME_ASSETS;
  return (
    <div className="mp-kit__hero" style={{ backgroundImage: `url(${a.hero.panelBg})` }}>
      <span
        className="mp-kit__hero-particles"
        style={{ backgroundImage: `url(${a.hero.particlesGold})` }}
        aria-hidden
      />
      <img className="mp-kit__hero-cards" src={a.hero.cardsHand} alt="" />
      <img className="mp-kit__hero-chips" src={a.hero.chipsStack} alt="" />
      <div className="mp-kit__hero-copy">
        <h2 id="multiplayer-title">{title}</h2>
        <p>{lead}</p>
      </div>
    </div>
  );
}

function MpStage({
  pulse,
  title,
  sub,
  progress,
}: {
  pulse?: boolean;
  title: string;
  sub?: string;
  progress?: boolean;
}) {
  const blue = HOME_ASSETS.cards.blue;
  const ui = HOME_ASSETS.ui;
  return (
    <div className="mp-kit-stage" style={{ backgroundImage: `url(${blue.base})` }}>
      <span className="mp-kit-stage__glow" style={{ backgroundImage: `url(${blue.glow})` }} aria-hidden />
      <div
        className={`mp-kit-stage__icon-wrap${pulse ? " mp-kit-stage__icon-wrap--pulse" : ""}`}
        aria-hidden
      >
        <span className="mp-kit-stage__ring" style={{ backgroundImage: `url(${blue.circle})` }} />
        <img className="mp-kit-stage__icon" src={blue.icon} alt="" width={96} height={96} />
      </div>
      <img className="mp-kit-stage__label" src={blue.label} alt="" />
      <p className="mp-kit-stage__title">{title}</p>
      {sub && <p className="mp-kit-stage__sub">{sub}</p>}
      {progress && (
        <div className="mp-kit-progress" style={{ backgroundImage: `url(${ui.progressBg})` }} aria-hidden>
          <span
            className="mp-kit-progress__fill"
            style={{ backgroundImage: `url(${ui.progressFill})` }}
          />
        </div>
      )}
    </div>
  );
}

function myAttempt(c: ChallengeDto) {
  return c.you_are === "challenger" ? c.challenger_result : c.opponent_result;
}

function theirAttempt(c: ChallengeDto) {
  return c.you_are === "challenger" ? c.opponent_result : c.challenger_result;
}

function opponentName(c: ChallengeDto): string {
  return (c.you_are === "challenger" ? c.opponent?.username : c.challenger?.username) ?? "?";
}

function opponentRating(c: ChallengeDto): number | null {
  const elo = c.you_are === "challenger" ? c.opponent?.elo : c.challenger?.elo;
  return typeof elo === "number" ? elo : null;
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

function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatResultWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatRaceAttempt(
  a: NonNullable<ReturnType<typeof myAttempt>>
): string {
  if (a.forfeited) return "Forfeit";
  return `${a.moves} turns · ${formatDurationMs(a.duration_ms)}`;
}

function QuickResultCard({ c }: { c: ChallengeDto }) {
  const [open, setOpen] = useState(false);
  const mine = myAttempt(c);
  const theirs = theirAttempt(c);
  const other = opponentName(c);
  const otherRating = opponentRating(c);
  const outcome = challengeOutcome(c);
  const when = formatResultWhen(c.created_at);

  return (
    <li
      className={`challenge-results-card challenge-results-card--list${open ? " challenge-results-card--open" : ""}`}
    >
      <button
        type="button"
        className="challenge-results-card__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="challenge-results-card__summary">
          <strong>vs {other}</strong>
          <span className="challenge-results-card__when">
            {otherRating != null ? `Rating ${otherRating} · ` : ""}
            {when}
          </span>
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
          <p>You {mine ? formatRaceAttempt(mine) : "—"}</p>
          {theirs ? (
            <p>
              {other} {formatRaceAttempt(theirs)}
            </p>
          ) : (
            <p className="play-mode-modal__hint">Waiting for {other}…</p>
          )}
        </div>
      )}
    </li>
  );
}

export function MultiplayerModal({
  onClose,
  onPlayChallenge,
  friendRequestCount = 0,
  challengeCount = 0,
  onNotificationsChange,
  initialView = "hub",
}: Props) {
  const [view, setView] = useState<View>(initialView);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<ChallengeDto | null>(null);
  const [opponentElo, setOpponentElo] = useState<number | null>(null);
  const [quickResults, setQuickResults] = useState<ChallengeDto[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showOutOfEnergy, setShowOutOfEnergy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [elo, setElo] = useState(() => loadProgress()?.elo ?? 1000);
  const [resultsBadge, setResultsBadge] = useState(0);
  const pollingRef = useRef(false);
  const a = HOME_ASSETS;
  const blue = a.cards.blue;
  const friendBadge = friendRequestCount + challengeCount;
  const quickUnlocked = isQuickPlayUnlocked();
  const unlockLabel = quickPlayUnlockLabel();

  const loadQuickResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const r = await fetchChallenges();
      const quick = r.challenges.filter((c) => (c.kind ?? "friend") === "quick");
      const list = quick
        .filter((c) => {
          const mine = myAttempt(c);
          if (!mine) return false;
          return c.status === "completed" || c.status === "active" || c.status === "expired";
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setQuickResults(list);
      setResultsBadge(countUnseenCompletedResults(quick, "quick"));
    } catch {
      /* ignore */
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuickResults();
  }, [loadQuickResults]);

  useEffect(() => {
    return () => {
      pollingRef.current = false;
      void leaveQuickMatch().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (status !== "waiting") return;
    pollingRef.current = true;
    const id = window.setInterval(() => {
      void pollQuickMatch()
        .then((r) => {
          if (!pollingRef.current) return;
          if (r.status === "matched" && r.challenge) {
            setMatched(r.challenge);
            const oe =
              typeof (r as { opponent_elo?: number }).opponent_elo === "number"
                ? (r as { opponent_elo: number }).opponent_elo
                : opponentRating(r.challenge);
            setOpponentElo(oe);
            setStatus("matched");
            setBusy(false);
          } else if (r.status === "idle") {
            setStatus("idle");
            setBusy(false);
            setError("Match timed out — try again");
          }
        })
        .catch(() => undefined);
    }, 1500);
    return () => {
      window.clearInterval(id);
      pollingRef.current = false;
    };
  }, [status]);

  useEffect(() => {
    if (view !== "results" || quickResults.length === 0) return;
    const ids = quickResults.map((c) => c.id);
    const before = countUnseenCompletedResults(quickResults, "quick");
    markChallengeResultsSeen(ids);
    setResultsBadge(0);
    if (before > 0) onNotificationsChange?.();
  }, [view, quickResults, onNotificationsChange]);

  if (view === "friends") {
    return (
      <ChallengeFriendModal
        onClose={onClose}
        onBack={() => setView("hub")}
        onPlayChallenge={onPlayChallenge}
        friendRequestCount={friendRequestCount}
        challengeCount={challengeCount}
        onNotificationsChange={onNotificationsChange}
        kitShell
      />
    );
  }

  const findMatch = async () => {
    setBusy(true);
    setError(null);
    setMatched(null);
    setOpponentElo(null);
    setStatus("waiting");
    try {
      await leaveQuickMatch().catch(() => undefined);
      const r = await joinQuickMatch({ fresh: true });
      if (typeof (r as { elo?: number }).elo === "number") {
        setElo((r as { elo: number }).elo);
      }
      if (r.status === "matched" && r.challenge) {
        setMatched(r.challenge);
        const oe =
          typeof (r as { opponent_elo?: number }).opponent_elo === "number"
            ? (r as { opponent_elo: number }).opponent_elo
            : opponentRating(r.challenge);
        setOpponentElo(oe);
        setStatus("matched");
      } else {
        setStatus("waiting");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Matchmaking failed");
      setStatus("idle");
    } finally {
      setBusy(false);
    }
  };

  const startQuickWithEnergy = () => {
    if (!isQuickPlayUnlocked()) {
      setError(`Clear Solo ${unlockLabel} to unlock Quick play`);
      return;
    }
    syncEnergyState();
    if (!hasEnergy(1) || !trySpendEnergyOnce()) {
      setShowOutOfEnergy(true);
      return;
    }
    void findMatch();
  };

  const cancelQueue = async () => {
    setCancelling(true);
    try {
      await leaveQuickMatch();
    } catch {
      /* ignore */
    }
    setStatus("idle");
    setBusy(false);
    setCancelling(false);
  };

  const playMatched = () => {
    if (!matched) return;
    onClose();
    onPlayChallenge(matched);
  };

  const matchedOpponentName =
    matched == null
      ? null
      : matched.you_are === "challenger"
        ? matched.opponent?.username
        : matched.challenger?.username;

  const matchedOpponentRating =
    opponentElo ?? (matched ? opponentRating(matched) : null);

  const finding = status === "waiting";

  return (
    <>
      <MpShell onClose={onClose} rating={elo}>
        {view === "hub" && (
          <>
            <MpHero
              title="Multiplayer"
              lead="Play online versus similar players, or challenge your friends."
            />
            <div className="mp-kit__body">
              {error && <p className="mp-kit__error">{error}</p>}
              <div className="mp-kit__options">
                <button
                  type="button"
                  className={`mp-kit-card${quickUnlocked ? "" : " mp-kit-card--locked"}`}
                  style={{ backgroundImage: `url(${blue.base})` }}
                  onClick={() => {
                    if (!quickUnlocked) {
                      setError(`Clear Solo ${unlockLabel} to unlock Quick play`);
                      return;
                    }
                    setView("quick");
                    setError(null);
                  }}
                >
                  <span className="mp-kit-card__glow" style={{ backgroundImage: `url(${blue.glow})` }} aria-hidden />
                  <div className="mp-kit-card__body">
                    <img className="mp-kit-card__tag" src={blue.label} alt="" />
                    <span className="mp-kit-card__title">Quick play</span>
                    <span className="mp-kit-card__sub">
                      {quickUnlocked
                        ? "Match near your Rating"
                        : `Locked · clear Solo ${unlockLabel}`}
                    </span>
                    <span className="mp-kit-card__meta">
                      {quickUnlocked ? "⚡ 1 energy" : `Need ${unlockLabel}`}
                    </span>
                  </div>
                  <span className="mp-kit-card__icon-wrap" aria-hidden>
                    <span className="mp-kit-card__ring" style={{ backgroundImage: `url(${blue.circle})` }} />
                    <img className="mp-kit-card__icon" src={blue.icon} alt="" />
                  </span>
                  <img className="mp-kit-card__chev" src={a.ui.chevron} alt="" />
                </button>

                <button
                  type="button"
                  className="mp-kit-card"
                  style={{ backgroundImage: `url(${blue.base})` }}
                  onClick={() => {
                    setView("results");
                    void loadQuickResults();
                  }}
                >
                  {resultsBadge > 0 && (
                    <span className="mp-kit-card__badge">
                      {resultsBadge > 99 ? "99+" : resultsBadge}
                    </span>
                  )}
                  <span className="mp-kit-card__glow" style={{ backgroundImage: `url(${blue.glow})` }} aria-hidden />
                  <div className="mp-kit-card__body">
                    <img className="mp-kit-card__tag" src={blue.label} alt="" />
                    <span className="mp-kit-card__title">Match results</span>
                    <span className="mp-kit-card__sub">Your Quick Play history</span>
                    <span className="mp-kit-card__meta">Turns · time</span>
                  </div>
                  <span className="mp-kit-card__icon-wrap" aria-hidden>
                    <span className="mp-kit-card__ring" style={{ backgroundImage: `url(${blue.circle})` }} />
                    <img className="mp-kit-card__icon" src={blue.icon} alt="" />
                  </span>
                  <img className="mp-kit-card__chev" src={a.ui.chevron} alt="" />
                </button>

                <button
                  type="button"
                  className="mp-kit-card"
                  style={{ backgroundImage: `url(${blue.base})` }}
                  onClick={() => setView("friends")}
                >
                  {friendBadge > 0 && (
                    <span className="mp-kit-card__badge">{friendBadge > 99 ? "99+" : friendBadge}</span>
                  )}
                  <span className="mp-kit-card__glow" style={{ backgroundImage: `url(${blue.glow})` }} aria-hidden />
                  <div className="mp-kit-card__body">
                    <img className="mp-kit-card__tag" src={a.home.friendsLabel} alt="" />
                    <span className="mp-kit-card__title">Challenge a friend</span>
                    <span className="mp-kit-card__sub">Pick someone from your list</span>
                    <span className="mp-kit-card__meta">⚡ 1 each</span>
                  </div>
                  <span className="mp-kit-card__icon-wrap" aria-hidden>
                    <img className="mp-kit-card__icon mp-kit-card__icon--friends" src={a.home.friendsBadge} alt="" />
                  </span>
                  <img className="mp-kit-card__chev" src={a.ui.chevron} alt="" />
                </button>
              </div>
            </div>
            <div className="mp-kit__footer">
              <button type="button" className="mp-kit__ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}

        {view === "results" && (
          <>
            <div className="mp-kit__back-row">
              <button type="button" className="mp-kit__back" onClick={() => setView("hub")}>
                <img src={a.ui.chevron} alt="" /> Back
              </button>
            </div>
            <MpHero title="Match results" lead="Quick Play outcomes — fewest turns, then fastest time." />
            <div className="mp-kit__body">
              {resultsLoading && quickResults.length === 0 ? (
                <p className="mp-kit-stage__sub" style={{ textAlign: "center" }}>
                  Loading…
                </p>
              ) : quickResults.length === 0 ? (
                <p className="mp-kit-stage__sub" style={{ textAlign: "center" }}>
                  No Quick Play results yet. Finish a match to see it here.
                </p>
              ) : (
                <ul className="challenge-results-list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {quickResults.map((c) => (
                    <QuickResultCard key={c.id} c={c} />
                  ))}
                </ul>
              )}
            </div>
            <div className="mp-kit__footer">
              <button type="button" className="mp-kit__ghost" onClick={() => setView("hub")}>
                Back
              </button>
              <button type="button" className="mp-kit__ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}

        {view === "quick" && status === "matched" && matched && (
          <>
            <div className="mp-kit__back-row">
              <button type="button" className="mp-kit__back" onClick={onClose}>
                <img src={a.ui.chevron} alt="" /> Later
              </button>
            </div>
            <div className="mp-kit__body">
              <MpStage
                title="Match ready"
                sub={
                  matchedOpponentRating != null
                    ? `vs ${matchedOpponentName ?? "opponent"} · Rating ${matchedOpponentRating}`
                    : `vs ${matchedOpponentName ?? "opponent"}`
                }
              />
              <p className="mp-kit-stage__sub" style={{ textAlign: "center", margin: 0 }}>
                Fewest turns wins. Equal turns → fastest time. After one finishes, the other has 10 minutes or is DQed.
              </p>
            </div>
            <div className="mp-kit__footer">
              <button type="button" className="mp-kit__cta" onClick={playMatched}>
                Play now
              </button>
              <button type="button" className="mp-kit__ghost" onClick={onClose}>
                Later
              </button>
            </div>
          </>
        )}

        {view === "quick" && status !== "matched" && finding && (
          <>
            <div className="mp-kit__body">
              {error && <p className="mp-kit__error">{error}</p>}
              <MpStage pulse progress title="Looking for a player…" />
            </div>
            <div className="mp-kit__footer">
              <button
                type="button"
                className="mp-kit__ghost"
                disabled={cancelling}
                onClick={() => void cancelQueue()}
              >
                {cancelling ? "Cancelling…" : "Cancel"}
              </button>
            </div>
          </>
        )}

        {view === "quick" && status !== "matched" && !finding && (
          <>
            <div className="mp-kit__back-row">
              <button
                type="button"
                className="mp-kit__back"
                onClick={() => {
                  void cancelQueue();
                  setView("hub");
                }}
              >
                <img src={a.ui.chevron} alt="" /> Back
              </button>
            </div>
            <MpHero
              title="Quick play"
              lead={
                quickUnlocked
                  ? "Same board race. Fewest turns wins — time breaks ties. Quit = forfeit."
                  : `Clear Solo ${unlockLabel} in campaign to unlock.`
              }
            />
            <div className="mp-kit__body">
              {error && <p className="mp-kit__error">{error}</p>}
              <MpStage
                title={quickUnlocked ? "Ready when you are" : "Locked"}
                sub={
                  quickUnlocked
                    ? "Spend 1 energy to enter the queue."
                    : `Reach Solo ${unlockLabel} first.`
                }
              />
            </div>
            <div className="mp-kit__footer">
              <button
                type="button"
                className="mp-kit__cta"
                disabled={busy || !quickUnlocked}
                onClick={startQuickWithEnergy}
              >
                {quickUnlocked ? "Find match · ⚡1" : `Locked · ${unlockLabel}`}
              </button>
              <button
                type="button"
                className="mp-kit__ghost"
                onClick={() => {
                  void cancelQueue();
                  setView("hub");
                }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </MpShell>

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
