import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChallengeFriendModal } from "./ChallengeFriendModal";
import { HOME_ASSETS } from "./home/homeAssets";
import {
  joinQuickMatch,
  leaveQuickMatch,
  pollQuickMatch,
  type ChallengeDto,
} from "../lib/api";
import { formatLevelId } from "../lib/levelMap";
import { hasEnergy, syncEnergyState, trySpendEnergyOnce } from "../lib/energy";
import { loadProgress } from "../lib/progress";
import { OutOfEnergyModal } from "./OutOfEnergyModal";

type View = "hub" | "quick" | "friends";

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
  const [showOutOfEnergy, setShowOutOfEnergy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [elo, setElo] = useState(() => loadProgress()?.elo ?? 1000);
  const pollingRef = useRef(false);
  const a = HOME_ASSETS;
  const blue = a.cards.blue;
  const friendBadge = friendRequestCount + challengeCount;

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
    setStatus("waiting");
    try {
      const r = await joinQuickMatch();
      if (typeof (r as { elo?: number }).elo === "number") {
        setElo((r as { elo: number }).elo);
      }
      if (r.status === "matched" && r.challenge) {
        setMatched(r.challenge);
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

  const opponentName =
    matched == null
      ? null
      : matched.you_are === "challenger"
        ? matched.opponent?.username
        : matched.challenger?.username;

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
              <div className="mp-kit__options">
                <button
                  type="button"
                  className="mp-kit-card"
                  style={{ backgroundImage: `url(${blue.base})` }}
                  onClick={() => {
                    setView("quick");
                    setError(null);
                  }}
                >
                  <span className="mp-kit-card__glow" style={{ backgroundImage: `url(${blue.glow})` }} aria-hidden />
                  <div className="mp-kit-card__body">
                    <img className="mp-kit-card__tag" src={blue.label} alt="" />
                    <span className="mp-kit-card__title">Quick play</span>
                    <span className="mp-kit-card__sub">Match near your Rating</span>
                    <span className="mp-kit-card__meta">⚡ 1 energy</span>
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
                sub={`vs ${opponentName ?? "opponent"} · ${formatLevelId(matched.level)}`}
              />
              <p className="mp-kit-stage__sub" style={{ textAlign: "center", margin: 0 }}>
                Same seeded board. Best stars win — then fewest moves, then score.
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
            <MpHero title="Quick play" lead="Matched vs a similar Rating on the same board." />
            <div className="mp-kit__body">
              {error && <p className="mp-kit__error">{error}</p>}
              <MpStage title="Ready when you are" sub="Spend 1 energy to enter the queue." />
            </div>
            <div className="mp-kit__footer">
              <button
                type="button"
                className="mp-kit__cta"
                disabled={busy}
                onClick={startQuickWithEnergy}
              >
                Find match · ⚡1
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
