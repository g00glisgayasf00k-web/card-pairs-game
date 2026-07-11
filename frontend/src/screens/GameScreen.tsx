import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { submitScore } from "../lib/api";
import {
  HAND_DISPLAY,
  HAND_RANK_ORDER,
  HAND_SCORE_LIST,
  SPECIALS_EARN_BY_HAND,
  SPECIALS_GUIDE,
  type FullHandResult,
  type HandLabel,
} from "../lib/pokerHands";
import { campaignLeaderboardPoints, campaignLeaderboardPointsFromProgress, computeLevelStars, challengeKey, challengeProgress, formatChallenge, formatChallengeLabel, applyHandToChallengeCounts, getLevelConfig, levelPointsMet, levelRequirementsMet, movesRemaining, MAX_LEVEL, outOfMoves, type HandCounts } from "../lib/levels";
import {
  canAffordMovesPack,
  HINT_COST,
  MOVES_PACKS,
  SHUFFLE_COST,
} from "../lib/credits";
import {
  MAX_ENERGY,
  clearEnergyPaidLevel,
  syncEnergyState,
  trySpendEnergyForRetry,
} from "../lib/energy";
import { beginLevelAttempt, levelAttemptCostsEnergy } from "../lib/levelAttempt";
import {
  blockerIntroContent,
  blockersGuideText,
  markBlockerIntroSeen,
  pendingBlockerIntro,
  type BlockerIntroKind,
} from "../lib/blockers";
import {
  clearProgress,
  defaultProgress,
  loadProgress,
  PROGRESS_IMPORTED_EVENT,
  saveProgress,
} from "../lib/progress";
import {
  getLevel1SeedBoard,
  getTutorialStepConfig,
  isLevel1TutorialActive,
  TUTORIAL_FREE_STEP,
} from "../lib/tutorialLevel1";
import { SpecialArt } from "../components/SpecialArt";
import {
  buildFreshRunForLevel,
  markLevelComplete,
  shouldResumeSavedRun,
} from "../lib/levelProgress";
import { formatLevelId } from "../lib/levelMap";
import { GameBoard, type GameBoardHandle } from "../components/GameBoard";
import { ProfileModal } from "../components/ProfileModal";
import { GemShopModal } from "../components/GemShopModal";
import { OutOfEnergyModal } from "../components/OutOfEnergyModal";

interface Props {
  username: string | null;
  /** Global level from map (e.g. 1-3 → 3). Omit to resume saved campaign. */
  startLevel?: number;
  onMenu: () => void;
  onSignOut?: () => void;
}

type Phase = "playing" | "round_complete" | "campaign_complete" | "moves_failed";

interface RunState {
  level: number;
  levelScore: number;
  levelHands: number;
  levelHandCounts: HandCounts;
  lifetimeHandCounts: HandCounts;
  handsCleared: number;
  bestHand: HandLabel;
  credits: number;
  /** Extra moves bought this attempt (not persisted). */
  bonusMoves: number;
  tutorialStep: number;
}

const ROUND_COMPLETE_MS = 2200;

function gamePortal(node: ReactNode) {
  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}

function initRunState(startLevel?: number): RunState {
  const saved = loadProgress();

  if (startLevel === undefined) {
    if (saved) {
      return {
        level: saved.level,
        levelScore: saved.levelScore,
        levelHands: saved.levelHands,
        levelHandCounts: saved.levelHandCounts ?? {},
        lifetimeHandCounts: saved.lifetimeHandCounts ?? {},
        handsCleared: saved.handsCleared,
        bestHand: saved.bestHand,
        credits: saved.credits,
        bonusMoves: 0,
        tutorialStep: saved.tutorialStep ?? 0,
      };
    }
    const defaults = defaultProgress();
    return { ...defaults, bonusMoves: 0 } as RunState;
  }

  if (saved && shouldResumeSavedRun(startLevel, saved)) {
    return {
      level: saved.level,
      levelScore: saved.levelScore,
      levelHands: saved.levelHands,
      levelHandCounts: saved.levelHandCounts ?? {},
      lifetimeHandCounts: saved.lifetimeHandCounts ?? {},
      handsCleared: saved.handsCleared,
      bestHand: saved.bestHand,
      credits: saved.credits,
      bonusMoves: 0,
      tutorialStep: saved.tutorialStep ?? 0,
    };
  }

  const fresh = buildFreshRunForLevel(startLevel, saved);
  return {
    ...fresh,
    handsCleared: saved?.handsCleared ?? 0,
    lifetimeHandCounts: saved?.lifetimeHandCounts ?? {},
    bestHand: saved?.bestHand ?? "pair",
    credits: saved?.credits ?? defaultProgress().credits,
    bonusMoves: 0,
  };
}

export function GameScreen({ username, startLevel, onMenu, onSignOut }: Props) {
  const savedSnapshot = useRef(loadProgress());
  const isReplaySession = useRef(
    startLevel !== undefined &&
      ((savedSnapshot.current?.completedLevels.includes(startLevel) ?? false) ||
        startLevel < (savedSnapshot.current?.highestUnlocked ?? 1))
  );

  const [run, setRun] = useState<RunState>(() => initRunState(startLevel));
  const { level, levelScore, levelHands, levelHandCounts, handsCleared, bestHand, credits, bonusMoves, tutorialStep } = run;

  const [phase, setPhase] = useState<Phase>("playing");
  const [completedLevel, setCompletedLevel] = useState<number | null>(null);
  const [completedStats, setCompletedStats] = useState<{
    score: number;
    hands: number;
    stars: number;
    handCounts: HandCounts;
  } | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [showSpecials, setShowSpecials] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGemShop, setShowGemShop] = useState(false);
  const [gemShopEnergyFocus, setGemShopEnergyFocus] = useState(false);
  const [walletTick, setWalletTick] = useState(0);
  const [energyBlocked, setEnergyBlocked] = useState(false);
  const [showOutOfEnergy, setShowOutOfEnergy] = useState(false);
  const energyBlockedActionRef = useRef<"start" | "advance" | "retry" | null>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [boardFeedback, setBoardFeedback] = useState<{ text: string; hint?: boolean } | null>(null);
  const [blockerIntro, setBlockerIntro] = useState<BlockerIntroKind | null>(null);
  const [confirmSpend, setConfirmSpend] = useState<"hint" | "shuffle" | "restart" | null>(null);
  const levelScoreRef = useRef(levelScore);
  const levelHandsRef = useRef(levelHands);
  const levelHandCountsRef = useRef<HandCounts>(levelHandCounts);
  const handsClearedRef = useRef(handsCleared);
  const bestHandRef = useRef(bestHand);
  const levelRef = useRef(level);
  const advancingRef = useRef(false);

  const boardRef = useRef<GameBoardHandle>(null);
  const boardFeedbackTimer = useRef<number | null>(null);
  const refreshWallet = useCallback(() => setWalletTick((t) => t + 1), []);

  levelScoreRef.current = levelScore;
  levelHandsRef.current = levelHands;
  levelHandCountsRef.current = levelHandCounts;
  handsClearedRef.current = handsCleared;
  bestHandRef.current = bestHand;
  levelRef.current = level;

  const cfg = getLevelConfig(level);
  const effectiveMoveLimit = cfg.moveLimit + bonusMoves;
  const pointsMet = levelScore >= cfg.targetPoints;
  const nextCfg = getLevelConfig(level + 1);

  const starMoveTarget = cfg.starMoveLimits.three;
  const twoStarMoveTarget = cfg.starMoveLimits.two;
  const oneStarMoveTarget = cfg.starMoveLimits.one;
  const effectiveThreeStarLimit = starMoveTarget + bonusMoves;
  const movesLeft = movesRemaining(effectiveMoveLimit, levelHands);
  const movesLeftFor3 = movesRemaining(effectiveThreeStarLimit, levelHands);
  const threeStarBudgetLost = levelHands > effectiveThreeStarLimit;
  const movesLow = movesLeftFor3 <= 2 && movesLeftFor3 > 0;
  const movesCritical = movesLeft === 0;
  const movesOverStar = threeStarBudgetLost && movesLeft > 0;
  const movesEfficientFor2 = levelHands <= twoStarMoveTarget;
  const movesEfficientFor3 = levelHands <= starMoveTarget;
  const challengesComplete = cfg.challenges.every(
    (c) => challengeProgress(levelHandCounts, c) >= c.minCount
  );

  const tutorialActive = isLevel1TutorialActive(level, tutorialStep);
  const tutorialConfig = tutorialActive ? getTutorialStepConfig(tutorialStep) : null;
  const level1SeedBoard = level === 1 ? getLevel1SeedBoard(tutorialStep) : undefined;
  const tutorialFreePlay = level === 1 && tutorialStep >= TUTORIAL_FREE_STEP;
  const showChallengeUi = level > 1 || tutorialFreePlay;
  const challengesDone = cfg.challenges.filter(
    (c) => challengeProgress(levelHandCounts, c) >= c.minCount
  ).length;
  const challengesTotal = cfg.challenges.length;

  const completedCfg = completedLevel ? getLevelConfig(completedLevel) : null;

  const persistRun = useCallback((next: RunState) => {
    const saved = loadProgress() ?? defaultProgress();
    const onFrontier = next.level === saved.highestUnlocked;

    saveProgress({
      highestUnlocked: saved.highestUnlocked,
      completedLevels: saved.completedLevels,
      levelStars: saved.levelStars,
      level: onFrontier ? next.level : saved.level,
      levelScore: onFrontier ? next.levelScore : saved.levelScore,
      levelHands: onFrontier ? next.levelHands : saved.levelHands,
      levelHandCounts: onFrontier ? next.levelHandCounts : saved.levelHandCounts,
      lifetimeHandCounts: next.lifetimeHandCounts,
      handsCleared: next.handsCleared,
      bestHand: next.bestHand,
      credits: next.credits,
      energy: saved.energy,
      energyRegenAt: saved.energyRegenAt,
      energyPaidLevel: saved.energyPaidLevel ?? null,
      streak: 0,
      tutorialStep: next.level === 1 ? next.tutorialStep : saved.tutorialStep,
    });
  }, []);

  useEffect(() => {
    persistRun(run);
  }, [run, persistRun]);

  useEffect(() => {
    const syncWalletFromCloud = () => {
      const saved = loadProgress();
      if (!saved) return;
      setRun((prev) => ({ ...prev, credits: saved.credits }));
      refreshWallet();
    };
    window.addEventListener(PROGRESS_IMPORTED_EVENT, syncWalletFromCloud);
    return () => window.removeEventListener(PROGRESS_IMPORTED_EVENT, syncWalletFromCloud);
  }, [refreshWallet]);

  useEffect(
    () => () => {
      if (boardFeedbackTimer.current) window.clearTimeout(boardFeedbackTimer.current);
    },
    []
  );

  const handleBoardFeedback = useCallback((message: string | null, hint = false) => {
    if (boardFeedbackTimer.current) window.clearTimeout(boardFeedbackTimer.current);
    if (!message) {
      setBoardFeedback(null);
      return;
    }
    setBoardFeedback({ text: message, hint });
    if (!hint) {
      boardFeedbackTimer.current = window.setTimeout(() => setBoardFeedback(null), 1500);
    }
  }, []);

  const dismissBoardFeedback = useCallback(() => {
    if (boardFeedbackTimer.current) window.clearTimeout(boardFeedbackTimer.current);
    setBoardFeedback(null);
  }, []);

  const revealHintNow = useCallback((): boolean => {
    const unmet = cfg.challenges.filter(
      (c) => challengeProgress(levelHandCounts, c) < c.minCount
    );
    const priorityHands = unmet.map((c) => c.hand);
    const result = boardRef.current?.revealHint(priorityHands);
    if (!result) {
      handleBoardFeedback("No helpful hand found — try shuffle", true);
      return false;
    }
    const target = unmet.find((c) => c.hand === result.hand);
    const label = target
      ? formatChallengeLabel(target)
      : HAND_DISPLAY[result.hand] ?? result.hand.replace(/_/g, " ");
    handleBoardFeedback(`Start here for ${label}`, true);
    return true;
  }, [cfg.challenges, levelHandCounts, handleBoardFeedback]);

  const advanceLevel = useCallback(() => {
    advancingRef.current = false;
    clearEnergyPaidLevel();
    const nextLevel = levelRef.current + 1;
    if (!beginLevelAttempt(nextLevel)) {
      energyBlockedActionRef.current = "advance";
      setShowOutOfEnergy(true);
      setEnergyBlocked(true);
      return;
    }
    setEnergyBlocked(false);
    levelScoreRef.current = 0;
    levelHandsRef.current = 0;
    levelHandCountsRef.current = {};
    setRun((prev) => ({
      ...prev,
      level: prev.level + 1,
      levelScore: 0,
      levelHands: 0,
      levelHandCounts: {},
      bonusMoves: 0,
      tutorialStep: 0,
    }));
    setBoardFeedback(null);
    setBoardKey((k) => k + 1);
    setCompletedLevel(null);
    setCompletedStats(null);
    setPhase("playing");
  }, []);

  const retryLevel = useCallback(() => {
    advancingRef.current = false;
    if (!trySpendEnergyForRetry(level)) {
      energyBlockedActionRef.current = "retry";
      setShowOutOfEnergy(true);
      return;
    }
    refreshWallet();
    setRun((prev) => ({
      ...prev,
      levelScore: 0,
      levelHands: 0,
      levelHandCounts: {},
      bonusMoves: 0,
      tutorialStep:
        level === 1
          ? tutorialStep < TUTORIAL_FREE_STEP
            ? 0
            : TUTORIAL_FREE_STEP
          : prev.tutorialStep,
    }));
    levelScoreRef.current = 0;
    levelHandsRef.current = 0;
    levelHandCountsRef.current = {};
    setPhase("playing");
    setBoardKey((k) => k + 1);
  }, [level, tutorialStep, refreshWallet]);

  const resumeAfterEnergy = useCallback(() => {
    setShowOutOfEnergy(false);
    setShowGemShop(false);
    refreshWallet();
    const saved = loadProgress();
    if (saved) setRun((prev) => ({ ...prev, credits: saved.credits }));
    const action = energyBlockedActionRef.current;
    energyBlockedActionRef.current = null;
    setEnergyBlocked(false);
    if (action === "advance") {
      advanceLevel();
    } else if (action === "retry") {
      retryLevel();
    } else if (action === "start" && startLevel !== undefined) {
      beginLevelAttempt(startLevel);
    }
  }, [refreshWallet, advanceLevel, retryLevel, startLevel]);

  const resolveConfirmSpend = useCallback(() => {
    const action = confirmSpend;
    if (!action) return;
    setConfirmSpend(null);

    if (action === "restart") {
      // retryLevel spends 1 energy (and opens the shop if empty).
      retryLevel();
      return;
    }

    const cost = action === "hint" ? HINT_COST : SHUFFLE_COST;
    if (credits < cost) {
      setGemShopEnergyFocus(false);
      setShowGemShop(true);
      return;
    }
    let performed = true;
    if (action === "hint") {
      performed = revealHintNow();
    } else {
      boardRef.current?.shuffle();
    }
    if (performed) {
      setRun((prev) => ({ ...prev, credits: Math.max(0, prev.credits - cost) }));
      refreshWallet();
    }
  }, [confirmSpend, credits, revealHintNow, refreshWallet, retryLevel]);

  useEffect(() => {
    if (phase !== "round_complete") return;
    if (isReplaySession.current) {
      const id = window.setTimeout(onMenu, ROUND_COMPLETE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(advanceLevel, ROUND_COMPLETE_MS);
    return () => window.clearTimeout(id);
  }, [phase, advanceLevel, onMenu]);

  useEffect(() => {
    if (phase !== "playing") return;
    const kind = pendingBlockerIntro(getLevelConfig(level).blockers, getLevelConfig(level).fixedObstacles);
    if (kind) {
      markBlockerIntroSeen(kind);
      setBlockerIntro(kind);
    }
  }, [level, phase]);

  const tryAdvanceLevel = useCallback(
    (score: number, handCounts: HandCounts, hands: number) => {
      if (phase !== "playing" || advancingRef.current) return false;
      if (level === 1 && tutorialStep < TUTORIAL_FREE_STEP) return false;
      if (!levelRequirementsMet(score, handCounts, cfg)) return false;

      advancingRef.current = true;
      setBoardFeedback(null);
      const stars = markLevelComplete(
        level,
        computeLevelStars(score, handCounts, hands, cfg)
      );
      savedSnapshot.current = loadProgress();
      setCompletedLevel(level);
      setCompletedStats({ score, hands, stars, handCounts: { ...handCounts } });

      if (level >= MAX_LEVEL) {
        setPhase("campaign_complete");
      } else {
        setPhase("round_complete");
      }
      return true;
    },
    [cfg, level, phase, tutorialStep]
  );

  const handleTutorialStepComplete = useCallback(() => {
    setRun((prev) => {
      const nextStep = Math.min(TUTORIAL_FREE_STEP, prev.tutorialStep + 1);
      return { ...prev, tutorialStep: nextStep };
    });
  }, []);

  const handleHand = useCallback(
    (result: FullHandResult) => {
      const pts = result.totalPoints;
      const nextHands = levelHandsRef.current + 1;
      const nextScore = levelScoreRef.current + pts;
      const nextHandCounts = applyHandToChallengeCounts(
        levelHandCountsRef.current,
        cfg.challenges,
        result
      );
      levelHandsRef.current = nextHands;
      levelScoreRef.current = nextScore;
      levelHandCountsRef.current = nextHandCounts;

      setRun((prev) => {
        const nextBest =
          HAND_RANK_ORDER[result.hand] > HAND_RANK_ORDER[prev.bestHand]
            ? result.hand
            : prev.bestHand;
        const prevLifetime = prev.lifetimeHandCounts ?? {};
        const nextLifetime: HandCounts = {
          ...prevLifetime,
          [result.hand]: (prevLifetime[result.hand] ?? 0) + 1,
        };
        bestHandRef.current = nextBest;
        handsClearedRef.current = prev.handsCleared + 1;
        return {
          ...prev,
          handsCleared: prev.handsCleared + 1,
          levelHands: nextHands,
          levelScore: nextScore,
          levelHandCounts: nextHandCounts,
          lifetimeHandCounts: nextLifetime,
          bestHand: nextBest,
        };
      });
      const advanced = tryAdvanceLevel(nextScore, nextHandCounts, nextHands);
      if (
        !advanced &&
        !levelPointsMet(nextScore, cfg) &&
        outOfMoves(effectiveMoveLimit, nextHands)
      ) {
        setPhase("moves_failed");
      }
    },
    [tryAdvanceLevel, cfg, effectiveMoveLimit]
  );

  const handleBuyMoves = useCallback((packId: string) => {
    setRun((prev) => {
      const pack = MOVES_PACKS.find((p) => p.id === packId);
      if (!pack || prev.credits < pack.cost) return prev;
      return {
        ...prev,
        credits: prev.credits - pack.cost,
        bonusMoves: prev.bonusMoves + pack.moves,
      };
    });
    setPhase("playing");
  }, []);

  const handleActivation = useCallback(
    (pts: number) => {
      const nextScore = levelScoreRef.current + pts;
      levelScoreRef.current = nextScore;
      setRun((prev) => ({
        ...prev,
        levelScore: nextScore,
      }));
      tryAdvanceLevel(nextScore, levelHandCountsRef.current, levelHandsRef.current);
    },
    [tryAdvanceLevel]
  );

  const submitRunScore = () => {
    if (levelHandsRef.current <= 0 && levelScoreRef.current <= 0) return;
    const saved = loadProgress();
    if (!saved) return;
    const pts = campaignLeaderboardPointsFromProgress(saved);
    if (pts <= 0) return;
    submitScore({
      points: pts,
      hands_cleared: saved.handsCleared,
      best_hand: saved.bestHand,
    }).catch(() => {});
  };

  const handleExit = () => {
    submitRunScore();
    onMenu();
  };

  const finishCampaign = () => {
    submitRunScore();
    clearProgress();
    onMenu();
  };

  const boardLocked = phase !== "playing" || energyBlocked;

  const energyState = syncEnergyState();
  const energy = energyState.energy;
  void walletTick;

  useEffect(() => {
    if (energy >= MAX_ENERGY) return;
    const id = window.setInterval(() => refreshWallet(), 60_000);
    return () => window.clearInterval(id);
  }, [energy, refreshWallet]);

  useEffect(() => {
    if (startLevel === undefined) return;
    refreshWallet();
    if (!levelAttemptCostsEnergy(startLevel)) return;
    if (!beginLevelAttempt(startLevel)) {
      energyBlockedActionRef.current = "start";
      setEnergyBlocked(true);
      setShowOutOfEnergy(true);
    }
  }, [startLevel, refreshWallet]);

  const handleWalletChange = useCallback(() => {
    refreshWallet();
    const saved = loadProgress();
    if (saved) {
      setRun((prev) => ({ ...prev, credits: saved.credits }));
    }
    if (energyBlockedActionRef.current && hasEnergyFromSync()) {
      resumeAfterEnergy();
    }
  }, [refreshWallet, resumeAfterEnergy]);

  function hasEnergyFromSync(): boolean {
    return syncEnergyState().energy >= 1;
  }

  return (
    <div className="game-screen">
      <div className="mobile-shell mobile-shell--framed">
        <header className={`game-hud${tutorialActive || tutorialFreePlay ? " game-hud--lesson" : ""}`}>
          <div
            className={`moves-banner${movesLow ? " moves-banner--low" : ""}${movesOverStar ? " moves-banner--over-star" : ""}${movesCritical || phase === "moves_failed" ? " moves-banner--critical" : ""}`}
            role="status"
            aria-live="polite"
            title={
              threeStarBudgetLost
                ? `3★ budget used — ${movesLeft} move${movesLeft === 1 ? "" : "s"} left to clear the level`
                : `${movesLeftFor3} of ${effectiveThreeStarLimit} moves left for 3★ (${movesLeft} total remaining)`
            }
          >
            <div className="moves-banner__row">
              <button
                type="button"
                className="game-back-btn"
                onClick={handleExit}
                aria-label="Back to menu"
                title="Back to menu"
              >
                ←
              </button>
              <div className="moves-banner__main">
                <div className="moves-banner__head">
                  {threeStarBudgetLost ? (
                    <>
                      <span className="moves-banner__label moves-banner__label--warn">3★ budget used</span>
                      <span className="moves-banner__limit">
                        · {movesLeft} move{movesLeft === 1 ? "" : "s"} to clear
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="moves-banner__count">{movesLeftFor3}</span>
                      <span className="moves-banner__label">
                        move{movesLeftFor3 === 1 ? "" : "s"} left for 3★
                      </span>
                      <span className="moves-banner__limit">/ {effectiveThreeStarLimit}</span>
                    </>
                  )}
                  <button
                    type="button"
                    className="moves-banner__gems"
                    onClick={() => {
                      setGemShopEnergyFocus(false);
                      setShowGemShop(true);
                    }}
                    title="Gems — tap to buy more"
                  >
                    <span className="moves-banner__gems-icon" aria-hidden>💎</span>
                    <span className="moves-banner__gems-val">{credits}</span>
                  </button>
                </div>
                <div className="moves-banner__track">
                  <div
                    className="moves-banner__fill"
                    style={{ width: `${Math.max(0, (movesLeftFor3 / effectiveThreeStarLimit) * 100)}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                className="moves-banner__profile hud-chip-btn hud-labeled-chip"
                onClick={() => setShowProfile(true)}
                title={username ? "Your profile" : "Guest profile"}
              >
                <span className="hud-labeled-chip__label">Profile</span>
                <span className="hud-labeled-chip__body moves-banner__profile-icon" aria-hidden>
                  👤
                </span>
              </button>
            </div>
          </div>

          <div className="game-hud__row">
            <div
              className="level-badge hud-labeled-chip"
              title={`Level ${level} of ${MAX_LEVEL} · ${cfg.label}`}
            >
              <span className="hud-labeled-chip__label">Level</span>
              <span className="hud-labeled-chip__body">
                <span className="level-badge__num">{formatLevelId(level)}</span>
              </span>
            </div>

            <div className="score-chip score-chip--compact score-chip--target hud-labeled-chip" title={`Target: ${levelScore.toLocaleString()} / ${cfg.targetPoints.toLocaleString()} points`}>
              <span className="hud-labeled-chip__label">Target</span>
              <span className="hud-labeled-chip__body">
                <span className="score-chip__icon" aria-hidden>💰</span>
                <span className="score-chip__value">{levelScore.toLocaleString()}</span>
                <span className="score-chip__sep">/</span>
                <span className="score-chip__target">{cfg.targetPoints.toLocaleString()}</span>
              </span>
            </div>

            <button
              type="button"
              className="energy-chip hud-chip-btn hud-labeled-chip"
              onClick={() => {
                setGemShopEnergyFocus(true);
                setShowGemShop(true);
              }}
              title="Energy — max 12, +1 every 2 hours"
            >
              <span className="hud-labeled-chip__label">Energy</span>
              <span className="hud-labeled-chip__body">
                <span className="energy-chip__icon" aria-hidden>⚡</span>
                <span className="energy-chip__val">{energy}/{MAX_ENERGY}</span>
              </span>
            </button>

          </div>

          {tutorialActive && tutorialConfig && (
            <div className="tutorial-banner tutorial-banner--compact">
              <div className="tutorial-banner__summary-row">
                <span className="tutorial-banner__tag">🎓 Lesson {tutorialConfig.lesson}/3</span>
                <span className="tutorial-banner__title">{tutorialConfig.title}</span>
              </div>
              <p className="tutorial-banner__summary">{tutorialConfig.summary}</p>
              <details className="tutorial-banner__details">
                <summary className="tutorial-banner__more">Show More Info</summary>
                <p className="tutorial-banner__text">{tutorialConfig.message}</p>
              </details>
            </div>
          )}
        </header>

        {showChallengeUi && cfg.challenges.length > 0 && (
          <div className="game-goalbar" aria-label="Level goals">
            <div className="game-goalbar__goals">
                {cfg.challenges.map((c) => {
                  const have = challengeProgress(levelHandCounts, c);
                  const done = have >= c.minCount;
                  return (
                    <span
                      key={challengeKey(c)}
                      className={`tutorial-goal-chip${done ? " tutorial-goal-chip--done" : ""}`}
                    >
                      {done ? "✓" : "○"} {formatChallengeLabel(c)} ({Math.min(have, c.minCount)}/{c.minCount})
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        <div className="mobile-shell__play">
          <nav className="action-bar action-bar--bottom" aria-label="Game actions">
            <button
              type="button"
              className="action-btn action-btn--restart"
              onClick={() => setConfirmSpend("restart")}
              disabled={boardLocked || tutorialActive}
              title={tutorialActive ? "Finish the lesson first" : "Restart this level — costs 1 energy"}
            >
              <span className="action-btn__icon">↺</span>
              <span className="action-btn__label">Restart</span>
              <span className="action-btn__cost action-btn__cost--energy">⚡1</span>
            </button>
            <button
              type="button"
              className="action-btn action-btn--hint"
              onClick={() => setConfirmSpend("hint")}
              disabled={boardLocked || tutorialActive}
              title={tutorialActive ? "Finish the lesson first" : `Show a card to start toward a goal hand — costs ${HINT_COST} gem`}
            >
              <span className="action-btn__icon">💡</span>
              <span className="action-btn__label">Hint</span>
              <span className="action-btn__cost action-btn__cost--gem">💎{HINT_COST}</span>
            </button>
            <button
              type="button"
              className="action-btn action-btn--shuffle"
              onClick={() => setConfirmSpend("shuffle")}
              disabled={boardLocked || tutorialActive}
              title={tutorialActive ? "Finish the lesson first" : `Shuffle the board — costs ${SHUFFLE_COST} gem`}
            >
              <span className="action-btn__icon">🔀</span>
              <span className="action-btn__label">Shuffle</span>
              <span className="action-btn__cost action-btn__cost--gem">💎{SHUFFLE_COST}</span>
            </button>
            <button
              type="button"
              className="action-btn action-btn--specials"
              onClick={() => setShowSpecials(true)}
              title="How arrow, bomb, joker, and rainbow power-ups work"
            >
              <span className="action-btn__icon">✨</span>
              <span className="action-btn__label">Powers</span>
            </button>
            <button
              type="button"
              className="action-btn action-btn--scores"
              onClick={() => setShowScores(true)}
              title="Points awarded for each poker hand"
            >
              <span className="action-btn__icon">📋</span>
              <span className="action-btn__label">Payouts</span>
            </button>
            {showChallengeUi && (
              <button
                type="button"
                className={`action-btn action-btn--goals${pointsMet && !challengesComplete ? " action-btn--goals-alert" : ""}`}
                onClick={() => setShowChallenges(true)}
                title="Mission goals — point target and hand challenges"
              >
                <span className="action-btn__icon">🎯</span>
                <span className="action-btn__label">Goals</span>
                <span className="action-btn__cost">
                  {challengesDone}/{challengesTotal}
                </span>
              </button>
            )}
          </nav>

        <main className={`board-stage${boardLocked ? " board-stage--locked" : ""}`}>
          <div className="board-stage__glow" aria-hidden />
          <div className="board-stage__frame">
            <GameBoard
              ref={boardRef}
              key={boardKey}
              embedded
              locked={boardLocked}
              seedBoard={level1SeedBoard}
              guidedPath={tutorialConfig?.guidedPath}
              tutorialExpectedHand={tutorialConfig?.expectedHand}
              tutorialWrongSwipeHint={tutorialConfig?.wrongSwipeHint}
              onTutorialStepComplete={tutorialActive ? handleTutorialStepComplete : undefined}
              blockerConfig={cfg.blockers}
              fixedObstacles={cfg.fixedObstacles}
              onHand={handleHand}
              onActivation={handleActivation}
              onFeedback={handleBoardFeedback}
            />
          </div>

          {boardFeedback && (
            boardFeedback.hint ? (
              <div className="board-hint-banner" role="status" aria-live="polite">
                <p className="board-hint-banner__text">{boardFeedback.text}</p>
                <button
                  type="button"
                  className="board-hint-banner__dismiss"
                  onClick={dismissBoardFeedback}
                  aria-label="Dismiss hint message"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="board-hand-toast" role="status" aria-live="polite">
                {boardFeedback.text}
              </div>
            )
          )}
        </main>
        </div>
      </div>

      {phase === "round_complete" && completedLevel !== null && completedCfg &&
        gamePortal(
        <div className="modal-overlay levelup-overlay round-complete-overlay">
          <div className="modal levelup-modal round-complete-modal">
            <div className="levelup-badge round-complete-badge">ROUND COMPLETE!</div>
            <h2>Level {completedLevel} cleared</h2>
            <p className="levelup-label">{completedCfg.label}</p>
            <div className="round-complete-stars" aria-label={`${completedStats?.stars ?? 0} of 3 stars`}>
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`round-complete-star${i <= (completedStats?.stars ?? 0) ? " round-complete-star--lit" : ""}`}
                  aria-hidden
                >
                  ★
                </span>
              ))}
            </div>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{completedStats?.score.toLocaleString() ?? 0} pts this round</span>
              </div>
              <div className="perk">
                <span className="perk-icon">🃏</span>
                <span>{completedStats?.hands ?? 0} hands cleared</span>
              </div>
              {completedCfg.challenges.map((c) => {
                const have = completedStats
                  ? challengeProgress(completedStats.handCounts, c)
                  : 0;
                const done = have >= c.minCount;
                return (
                  <div className="perk" key={challengeKey(c)}>
                    <span className="perk-icon">{done ? "✓" : "○"}</span>
                    <span>{formatChallenge(c)}</span>
                  </div>
                );
              })}
              {(completedStats?.stars ?? 0) < 3 && (
                <div className="perk perk--hint">
                  <span className="perk-icon">💡</span>
                  <span>
                    {(completedStats?.stars ?? 0) < 2
                      ? `Hit ${completedCfg.targetPoints.toLocaleString()} pts with milestones in ≤${twoStarMoveTarget} moves for 2★`
                      : `Hit ${completedCfg.targetPoints.toLocaleString()} pts with milestones in ≤${starMoveTarget} moves for 3★`}
                  </span>
                </div>
              )}
              <div className="perk">
                <span className="perk-icon">⭐</span>
                <span>Up next: {nextCfg.label}</span>
              </div>
            </div>
            <p className="round-complete-hint">Starting level {level + 1}…</p>
            <button type="button" className="btn ghost" onClick={advanceLevel}>
              Continue now →
            </button>
          </div>
        </div>
        )}

      {phase === "moves_failed" &&
        gamePortal(
        <div className="modal-overlay levelup-overlay">
          <div className="modal levelup-modal moves-failed-modal game-over-modal">
            <div className="levelup-badge moves-failed-badge game-over-badge">OUT OF MOVES</div>
            <h2>Keep going?</h2>
            <p className="levelup-label">
              Level {formatLevelId(level)} — used all {effectiveMoveLimit} hands.
              {levelHands > starMoveTarget && (
                <> You&apos;re over the {starMoveTarget}-move budget for 3★.</>
              )}
            </p>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{levelScore.toLocaleString()} / {cfg.targetPoints.toLocaleString()} pts</span>
              </div>
              <div className="perk">
                <span className="perk-icon">⭐</span>
                <span>
                  3★ needs ≤{starMoveTarget} moves · you used {levelHands}
                </span>
              </div>
              <div className="perk">
                <span className="perk-icon">💎</span>
                <span>{credits} gems available</span>
              </div>
            </div>

            <p className="moves-failed-buy-title">Buy more moves with gems</p>
            <ul className="moves-pack-list">
              {MOVES_PACKS.map((pack) => {
                const affordable = canAffordMovesPack(credits, pack.id);
                return (
                  <li key={pack.id}>
                    <button
                      type="button"
                      className={`moves-pack-btn${affordable ? "" : " moves-pack-btn--disabled"}`}
                      onClick={() => handleBuyMoves(pack.id)}
                      disabled={!affordable}
                    >
                      <span className="moves-pack-btn__moves">{pack.label}</span>
                      <span className="moves-pack-btn__cost">{pack.cost} 💎</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!MOVES_PACKS.some((p) => canAffordMovesPack(credits, p.id)) && (
              <p className="moves-failed-hint">Not enough gems — tap 💎 in the HUD to buy more.</p>
            )}

            <button type="button" className="btn btn-restart-level" onClick={retryLevel}>
              Restart level
            </button>
            <button type="button" className="btn ghost" onClick={onMenu}>
              Back to levels
            </button>
          </div>
        </div>
        )}

      {phase === "campaign_complete" &&
        gamePortal(
        <div className="modal-overlay levelup-overlay">
          <div className="modal levelup-modal">
            <div className="levelup-badge">YOU WIN!</div>
            <h2>All {MAX_LEVEL} levels cleared</h2>
            <p className="levelup-label">Ultimate champion</p>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{campaignLeaderboardPoints(level, levelScore).toLocaleString()} campaign pts</span>
              </div>
              <div className="perk">
                <span className="perk-icon">🃏</span>
                <span>{handsCleared} hands cleared</span>
              </div>
              <div className="perk">
                <span className="perk-icon">👑</span>
                <span>Best: {HAND_DISPLAY[bestHand]}</span>
              </div>
            </div>
            <button type="button" className="btn" onClick={finishCampaign}>
              Finish →
            </button>
          </div>
        </div>
        )}

      {confirmSpend &&
        gamePortal(
          (() => {
            const isEnergy = confirmSpend === "restart";
            const cost =
              confirmSpend === "hint"
                ? HINT_COST
                : confirmSpend === "shuffle"
                  ? SHUFFLE_COST
                  : 1;
            const icon =
              confirmSpend === "hint" ? "💡" : confirmSpend === "shuffle" ? "🔀" : "↺";
            const title =
              confirmSpend === "hint"
                ? "Get a hint?"
                : confirmSpend === "shuffle"
                  ? "Shuffle the board?"
                  : "Restart this level?";
            const desc =
              confirmSpend === "hint"
                ? "Reveal a card to start a goal hand."
                : confirmSpend === "shuffle"
                  ? "Reshuffle every card on the board."
                  : "Start this level over with a fresh board.";
            const currencyIcon = isEnergy ? "⚡" : "💎";
            const currencyName = isEnergy ? "energy" : "gem";
            const balance = isEnergy ? energy : credits;
            const balanceUnit = isEnergy ? "energy" : "gems";
            const canAfford = balance >= cost;
            const confirmLabel = canAfford
              ? `Use ${currencyIcon} ${cost}`
              : isEnergy
                ? "Get energy"
                : "Get gems";
            return (
              <div
                className="modal-overlay scores-overlay"
                onClick={() => setConfirmSpend(null)}
                role="presentation"
              >
                <div
                  className="modal scores-modal spend-confirm-modal"
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-labelledby="spend-confirm-title"
                >
                  <div className="spend-confirm__icon" aria-hidden>
                    {icon}
                  </div>
                  <h2 id="spend-confirm-title">{title}</h2>
                  <p className="scores-note spend-confirm__note">
                    {desc}{" "}
                    This costs{" "}
                    <strong>
                      {currencyIcon} {cost} {currencyName}
                    </strong>
                    .
                  </p>
                  <p className="spend-confirm__balance">
                    You have {currencyIcon} {balance} {balanceUnit}
                  </p>
                  <div className="spend-confirm__actions">
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setConfirmSpend(null)}
                    >
                      Cancel
                    </button>
                    <button type="button" className="btn" onClick={resolveConfirmSpend}>
                      {confirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        )}

      {blockerIntro &&
        gamePortal(
        <div
          className="modal-overlay scores-overlay"
          onClick={() => setBlockerIntro(null)}
          role="presentation"
        >
          <div
            className="modal scores-modal blocker-intro-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="blocker-intro-title"
          >
            <div className="blocker-intro__icon" aria-hidden>
              {blockerIntroContent(blockerIntro).icon}
            </div>
            <h2 id="blocker-intro-title">{blockerIntroContent(blockerIntro).title}</h2>
            <ul className="blocker-intro__list">
              {blockerIntroContent(blockerIntro).lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button type="button" className="btn" onClick={() => setBlockerIntro(null)}>
              Got it
            </button>
          </div>
        </div>
        )}

      {showChallenges && (
        <div
          className="modal-overlay scores-overlay"
          onClick={() => setShowChallenges(false)}
          role="presentation"
        >
          <div
            className="modal scores-modal challenges-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="challenges-title"
          >
            <h2 id="challenges-title">Mission goals</h2>
            <p className="scores-note">
              Level {formatLevelId(level)} · {cfg.label}
            </p>

            <div className="challenges-modal__points">
              <span className="challenges-modal__points-label">Main goal</span>
              <span className="challenges-modal__points-val">
                Score {cfg.targetPoints.toLocaleString()} pts within {oneStarMoveTarget} moves
              </span>
              <span className="challenges-modal__points-sub">
                3★ budget: {effectiveThreeStarLimit} moves · {movesLeftFor3} left for 3★
                {movesLeft !== movesLeftFor3
                  ? ` · ${movesLeft} total to clear`
                  : ""}
                {cfg.challenges.length > 0
                  ? ` · ${cfg.challenges.length} milestone hand${cfg.challenges.length === 1 ? "" : "s"} along the way`
                  : ""}
              </span>
            </div>

            <h3 className="specials-subtitle">Star rating — score target and move budget</h3>
            <ul className="star-criteria-list star-criteria-list--modal">
              <li
                className={`star-criteria${pointsMet && challengesComplete && levelHands <= oneStarMoveTarget ? " star-criteria--done" : ""}`}
              >
                <span className="star-criteria__stars">★</span>
                <span>
                  <strong>Clear the level</strong> — score {cfg.targetPoints.toLocaleString()} pts, hit every
                  milestone hand, within {oneStarMoveTarget} moves.
                </span>
              </li>
              <li
                className={`star-criteria${pointsMet && challengesComplete && movesEfficientFor2 ? " star-criteria--done" : ""}`}
              >
                <span className="star-criteria__stars">★★</span>
                <span>
                  <strong>Speed run</strong> — hit {cfg.targetPoints.toLocaleString()} pts and milestones in{" "}
                  {twoStarMoveTarget} moves or fewer.
                </span>
              </li>
              <li
                className={`star-criteria${pointsMet && movesEfficientFor3 && challengesComplete ? " star-criteria--done" : ""}`}
              >
                <span className="star-criteria__stars">★★★</span>
                <span>
                  <strong>Perfect run</strong> — hit {cfg.targetPoints.toLocaleString()} pts and milestones in{" "}
                  {starMoveTarget} moves or fewer.
                </span>
              </li>
            </ul>

            {cfg.challenges.length > 0 && (
              <>
                <h3 className="specials-subtitle">Milestone hands</h3>
                <ul className="challenge-list challenge-list--modal">
                  {cfg.challenges.map((c) => {
                    const have = challengeProgress(levelHandCounts, c);
                    const done = have >= c.minCount;
                    return (
                      <li
                        key={challengeKey(c)}
                        className={`challenge-item challenge-item--modal${done ? " challenge-item--done" : ""}`}
                      >
                        <span className="challenge-item__mark">{done ? "✓" : "○"}</span>
                        <span className="challenge-item__text">{formatChallenge(c)}</span>
                        <span className="challenge-item__prog">
                          {have}/{c.minCount}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {(cfg.blockers || cfg.fixedObstacles.length > 0) && (
              <p className="scores-note scores-note--blockers">
                🧊 {blockersGuideText(cfg.fixedObstacles.length > 0)}
              </p>
            )}

            {pointsMet && !challengesComplete && (
              <p className="challenges-modal__warn">
                Points reached — finish the milestone hands below to clear the level.
              </p>
            )}

            <button
              type="button"
              className="btn scores-close"
              onClick={() => setShowChallenges(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showScores && (
        <div
          className="modal-overlay scores-overlay"
          onClick={() => setShowScores(false)}
          role="presentation"
        >
          <div
            className="modal scores-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="scores-title"
          >
            <h2 id="scores-title">Hand payouts</h2>
            <p className="scores-note">Every hand uses exactly 5 cards — base points shown below.</p>
            <ul className="scores-list">
              {HAND_SCORE_LIST.map(({ hand, points }) => (
                <li key={hand} className="scores-row">
                  <span className="scores-hand">{HAND_DISPLAY[hand]}</span>
                  <span className="scores-pts">{points.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn scores-close"
              onClick={() => setShowScores(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSpecials && (
        <div
          className="modal-overlay scores-overlay"
          onClick={() => setShowSpecials(false)}
          role="presentation"
        >
          <div
            className="modal scores-modal specials-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="specials-title"
          >
            <h2 id="specials-title">Power-ups</h2>
            <p className="scores-note">Earned by clearing big hands — spawn where you started the swipe</p>
            {(cfg.blockers || cfg.fixedObstacles.length > 0) && (
              <p className="scores-note scores-note--blockers">
                🧊 {blockersGuideText(cfg.fixedObstacles.length > 0)}
              </p>
            )}
            <ul className="specials-list">
              {SPECIALS_GUIDE.map((sp) => (
                <li key={sp.name} className="specials-card">
                  <div className="specials-card__head">
                    <SpecialArt type={sp.type} className="special-art--guide" />
                    <span className="specials-card__name">{sp.name}</span>
                  </div>
                  <p className="specials-card__earn">{sp.earn}</p>
                  <p className="specials-card__effect">{sp.effect}</p>
                </li>
              ))}
            </ul>
            <h3 className="specials-subtitle">Rewards by hand</h3>
            <ul className="scores-list">
              {SPECIALS_EARN_BY_HAND.map(({ hand, types }) => (
                <li key={hand} className="scores-row">
                  <span className="scores-hand">{HAND_DISPLAY[hand]}</span>
                  <span className="specials-icons">
                    {types.map((t, i) => (
                      <SpecialArt key={`${hand}-${i}`} type={t} className="special-art--tiny" />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn scores-close"
              onClick={() => setShowSpecials(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showProfile && (
        <ProfileModal
          username={username}
          onClose={() => setShowProfile(false)}
          onSignOut={onSignOut}
        />
      )}

      {showGemShop && (
        <GemShopModal
          emphasizeEnergy={gemShopEnergyFocus}
          onClose={() => setShowGemShop(false)}
          onBalanceChange={handleWalletChange}
        />
      )}

      {showOutOfEnergy && !showGemShop && (
        <OutOfEnergyModal
          onClose={() => setShowOutOfEnergy(false)}
          onRefilled={resumeAfterEnergy}
          onOpenTreasury={() => {
            setShowOutOfEnergy(false);
            setGemShopEnergyFocus(true);
            setShowGemShop(true);
          }}
        />
      )}
    </div>
  );
}
