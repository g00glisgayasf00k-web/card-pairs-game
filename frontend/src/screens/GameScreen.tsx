import { useCallback, useEffect, useRef, useState } from "react";
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
import { campaignLeaderboardPoints, computeLevelStars, formatChallenge, getLevelConfig, levelPointsMet, movesRemaining, MAX_LEVEL, outOfMoves, STAR_MOVE_EFFICIENCY, type HandCounts } from "../lib/levels";
import {
  canAffordMovesPack,
  MOVES_PACK_COST,
  MOVES_PACK_SIZE,
  movesPackLabel,
} from "../lib/credits";
import { blockersGuideText } from "../lib/blockers";
import {
  clearProgress,
  defaultProgress,
  loadProgress,
  saveProgress,
} from "../lib/progress";
import {
  getLevel1SeedBoard,
  getTutorialStepConfig,
  isLevel1TutorialActive,
  TUTORIAL_FREE_STEP,
  tutorialFreePlayMessage,
} from "../lib/tutorialLevel1";
import { SpecialArt } from "../components/SpecialArt";
import {
  buildFreshRunForLevel,
  markLevelComplete,
  shouldResumeSavedRun,
} from "../lib/levelProgress";
import { formatLevelId } from "../lib/levelMap";
import { GameBoard, type GameBoardHandle } from "../components/GameBoard";

interface Props {
  username: string | null;
  /** Global level from map (e.g. 1-3 → 3). Omit to resume saved campaign. */
  startLevel?: number;
  onMenu: () => void;
}

type Phase = "playing" | "round_complete" | "campaign_complete" | "moves_failed";

interface RunState {
  level: number;
  levelScore: number;
  levelHands: number;
  levelHandCounts: HandCounts;
  handsCleared: number;
  bestHand: HandLabel;
  credits: number;
  /** Extra moves bought this attempt (not persisted). */
  bonusMoves: number;
  tutorialStep: number;
}

const HAND_BADGE: Record<HandLabel, string> = {
  pair: "2",
  two_pair: "2×2",
  three_of_a_kind: "3",
  straight: "5↔",
  flush: "♠",
  full_house: "🏠",
  four_of_a_kind: "4",
  straight_flush: "⚡",
  royal_flush: "👑",
};

const ROUND_COMPLETE_MS = 2200;

function missionBriefEligible(level: number, tutorialStep: number): boolean {
  return level > 1 || tutorialStep >= TUTORIAL_FREE_STEP;
}

function isFreshMissionStart(startLevel: number | undefined): boolean {
  const saved = loadProgress();
  if (startLevel === undefined) {
    if (!saved) return true;
    return saved.levelScore === 0 && saved.levelHands === 0;
  }
  return !shouldResumeSavedRun(startLevel, saved);
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
    bestHand: saved?.bestHand ?? "pair",
    credits: saved?.credits ?? defaultProgress().credits,
    bonusMoves: 0,
  };
}

export function GameScreen({ username, startLevel, onMenu }: Props) {
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
  const [boardKey, setBoardKey] = useState(0);
  const levelScoreRef = useRef(levelScore);
  const levelHandsRef = useRef(levelHands);
  const levelHandCountsRef = useRef<HandCounts>(levelHandCounts);
  const handsClearedRef = useRef(handsCleared);
  const bestHandRef = useRef(bestHand);
  const levelRef = useRef(level);
  const advancingRef = useRef(false);
  const briefOnNextBoardRef = useRef(isFreshMissionStart(startLevel));

  const boardRef = useRef<GameBoardHandle>(null);

  levelScoreRef.current = levelScore;
  levelHandsRef.current = levelHands;
  levelHandCountsRef.current = levelHandCounts;
  handsClearedRef.current = handsCleared;
  bestHandRef.current = bestHand;
  levelRef.current = level;

  const cfg = getLevelConfig(level);
  const effectiveMoveLimit = cfg.moveLimit + bonusMoves;
  const levelProgress = Math.min(1, levelScore / cfg.targetPoints);
  const pointsMet = levelScore >= cfg.targetPoints;
  const nextCfg = getLevelConfig(level + 1);

  const movesLeft = movesRemaining(effectiveMoveLimit, levelHands);
  const movesLow = movesLeft <= 3 && movesLeft > 0;
  const movesCritical = movesLeft === 0;
  const challengesComplete = cfg.challenges.every(
    (c) => (levelHandCounts[c.hand] ?? 0) >= c.minCount
  );

  const tutorialActive = isLevel1TutorialActive(level, tutorialStep);
  const tutorialConfig = tutorialActive ? getTutorialStepConfig(tutorialStep) : null;
  const level1SeedBoard = level === 1 ? getLevel1SeedBoard(tutorialStep) : undefined;
  const tutorialFreePlay = level === 1 && tutorialStep >= TUTORIAL_FREE_STEP;
  const showChallengeUi = level > 1 || tutorialFreePlay;
  const challengesDone = cfg.challenges.filter(
    (c) => (levelHandCounts[c.hand] ?? 0) >= c.minCount
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
      handsCleared: next.handsCleared,
      bestHand: next.bestHand,
      credits: next.credits,
      streak: 0,
      tutorialStep: next.level === 1 ? next.tutorialStep : saved.tutorialStep,
    });
  }, []);

  useEffect(() => {
    persistRun(run);
  }, [run, persistRun]);

  useEffect(() => {
    if (!briefOnNextBoardRef.current) return;
    briefOnNextBoardRef.current = false;
    if (missionBriefEligible(level, tutorialStep)) {
      setShowChallenges(true);
    }
  }, [level, boardKey, tutorialStep]);

  const advanceLevel = useCallback(() => {
    advancingRef.current = false;
    setCompletedLevel(null);
    setCompletedStats(null);
    briefOnNextBoardRef.current = true;
    setRun((prev) => {
      const next: RunState = {
        ...prev,
        level: prev.level + 1,
        levelScore: 0,
        levelHands: 0,
        levelHandCounts: {},
        bonusMoves: 0,
        tutorialStep: 0,
      };
      levelScoreRef.current = 0;
      levelHandsRef.current = 0;
      levelHandCountsRef.current = {};
      return next;
    });
    setPhase("playing");
    setBoardKey((k) => k + 1);
  }, []);

  const retryLevel = useCallback(() => {
    advancingRef.current = false;
    briefOnNextBoardRef.current = true;
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
  }, [level, tutorialStep]);

  useEffect(() => {
    if (phase !== "round_complete") return;
    if (isReplaySession.current) {
      const id = window.setTimeout(onMenu, ROUND_COMPLETE_MS);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(advanceLevel, ROUND_COMPLETE_MS);
    return () => window.clearTimeout(id);
  }, [phase, advanceLevel, onMenu]);

  const tryAdvanceLevel = useCallback(
    (score: number, handCounts: HandCounts, hands: number) => {
      if (phase !== "playing" || advancingRef.current) return false;
      if (level === 1 && tutorialStep < TUTORIAL_FREE_STEP) return false;
      if (!levelPointsMet(score, cfg)) return false;

      advancingRef.current = true;
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
      if (prev.level === 1 && nextStep === TUTORIAL_FREE_STEP) {
        briefOnNextBoardRef.current = true;
      }
      return { ...prev, tutorialStep: nextStep };
    });
    setBoardKey((k) => k + 1);
  }, []);

  const handleHand = useCallback(
    (result: FullHandResult) => {
      const pts = result.totalPoints;
      const nextHands = levelHandsRef.current + 1;
      const nextScore = levelScoreRef.current + pts;
      const nextHandCounts: HandCounts = {
        ...levelHandCountsRef.current,
        [result.hand]: (levelHandCountsRef.current[result.hand] ?? 0) + 1,
      };
      levelHandsRef.current = nextHands;
      levelScoreRef.current = nextScore;
      levelHandCountsRef.current = nextHandCounts;

      setRun((prev) => {
        const nextBest =
          HAND_RANK_ORDER[result.hand] > HAND_RANK_ORDER[prev.bestHand]
            ? result.hand
            : prev.bestHand;
        bestHandRef.current = nextBest;
        handsClearedRef.current = prev.handsCleared + 1;
        return {
          ...prev,
          handsCleared: prev.handsCleared + 1,
          levelHands: nextHands,
          levelScore: nextScore,
          levelHandCounts: nextHandCounts,
          bestHand: nextBest,
        };
      });
      tryAdvanceLevel(nextScore, nextHandCounts, nextHands);
      if (
        !levelPointsMet(nextScore, cfg) &&
        outOfMoves(effectiveMoveLimit, nextHands)
      ) {
        setPhase("moves_failed");
      }
    },
    [tryAdvanceLevel, cfg, effectiveMoveLimit]
  );

  const handleBuyMoves = useCallback(() => {
    setRun((prev) => {
      if (!canAffordMovesPack(prev.credits)) return prev;
      return {
        ...prev,
        credits: prev.credits - MOVES_PACK_COST,
        bonusMoves: prev.bonusMoves + MOVES_PACK_SIZE,
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
    const pts = campaignLeaderboardPoints(levelRef.current, levelScoreRef.current);
    if (handsClearedRef.current === 0 && pts === 0) return;
    submitScore({
      points: pts,
      hands_cleared: handsClearedRef.current,
      best_hand: bestHandRef.current,
      username,
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

  const boardLocked = phase !== "playing" || showChallenges;

  const canBuyMoves = canAffordMovesPack(credits);

  const starMoveTarget = Math.floor(cfg.moveLimit * STAR_MOVE_EFFICIENCY);

  return (
    <div className="game-screen">
      <div className="mobile-shell">
        <header className="game-hud">
          <div
            className={`moves-banner${movesLow ? " moves-banner--low" : ""}${movesCritical || phase === "moves_failed" ? " moves-banner--critical" : ""}`}
            role="status"
            aria-live="polite"
            title={`${movesLeft} of ${effectiveMoveLimit} hands remaining`}
          >
            <div className="moves-banner__head">
              <span className="moves-banner__label">Moves left</span>
              <span className="moves-banner__count">{movesLeft}</span>
              <span className="moves-banner__limit">/ {effectiveMoveLimit}</span>
            </div>
            <div className="moves-banner__track">
              <div
                className="moves-banner__fill"
                style={{ width: `${Math.max(0, (movesLeft / effectiveMoveLimit) * 100)}%` }}
              />
            </div>
          </div>

          <div className="game-hud__row">
            <div className="level-badge" title={cfg.label}>
              <span className="level-badge__icon">⭐</span>
              <span className="level-badge__num">{level}/{MAX_LEVEL}</span>
            </div>

            <div className="score-chip score-chip--compact" title={`Goal: ${cfg.targetPoints.toLocaleString()} pts`}>
              <span className="score-chip__icon">💰</span>
              <span className="score-chip__value">{levelScore.toLocaleString()}</span>
            </div>

            <div className="credits-chip" title="In-game credits — buy extra moves when you run out">
              <span className="credits-chip__icon">💎</span>
              <span className="credits-chip__val">{credits}</span>
            </div>

            <div className="rank-chip" title={cfg.label}>
              <span className="rank-chip__label">{formatLevelId(level)}</span>
            </div>
          </div>

          <div className="xp-track">
            <div
              className={`xp-fill${pointsMet && (tutorialFreePlay || level > 1) ? " xp-fill--done" : ""}`}
              style={{ width: `${levelProgress * 100}%` }}
            />
            <span className="xp-label">
              💰 {levelScore.toLocaleString()} / {cfg.targetPoints.toLocaleString()}
            </span>
          </div>

          {(tutorialActive || tutorialFreePlay) && (
            <div className={`tutorial-banner${tutorialFreePlay ? " tutorial-banner--free" : ""}`}>
              <span className="tutorial-banner__tag">
                {tutorialFreePlay ? "🎯 Your turn" : `🎓 Lesson ${tutorialConfig?.lesson ?? 1}/3`}
              </span>
              <p className="tutorial-banner__text">
                {tutorialFreePlay
                  ? tutorialFreePlayMessage()
                  : tutorialConfig?.message}
              </p>
              {tutorialConfig && (
                <span className="tutorial-banner__hand">{tutorialConfig.title}</span>
              )}
            </div>
          )}

          <div className="stat-chips">
            <div className="stat-chip" title="Total hands this run">
              <span className="stat-chip__icon">🎯</span>
              <span className="stat-chip__val">{handsCleared}</span>
            </div>
            <div className="stat-chip" title={`Best: ${HAND_DISPLAY[bestHand]}`}>
              <span className="stat-chip__icon">{HAND_BADGE[bestHand]}</span>
            </div>
            {username && (
              <div className="stat-chip stat-chip--user" title={username}>
                <span className="stat-chip__icon">👤</span>
              </div>
            )}
          </div>
        </header>

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
              onTutorialStepComplete={tutorialActive ? handleTutorialStepComplete : undefined}
              blockerConfig={cfg.blockers}
              onHand={handleHand}
              onActivation={handleActivation}
            />
          </div>
        </main>

        <nav className="action-bar">
          <button
            type="button"
            className="action-btn action-btn--restart"
            onClick={retryLevel}
            disabled={boardLocked || tutorialActive}
            title={tutorialActive ? "Finish the lesson first" : "Restart this level"}
          >
            <span className="action-btn__icon">↺</span>
            <span className="action-btn__label">Restart</span>
          </button>
          <button
            type="button"
            className="action-btn action-btn--shuffle"
            onClick={() => boardRef.current?.shuffle()}
            disabled={boardLocked || tutorialActive}
            title={tutorialActive ? "Finish the lesson first" : "Shuffle the board"}
          >
            <span className="action-btn__icon">🔀</span>
            <span className="action-btn__label">Shuffle</span>
          </button>
          <button
            type="button"
            className="action-btn action-btn--specials"
            onClick={() => setShowSpecials(true)}
            title="How bomb, star, and joker power-ups work"
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
          <button
            type="button"
            className="action-btn action-btn--menu"
            onClick={handleExit}
          >
            <span className="action-btn__icon">✕</span>
            <span className="action-btn__label">Exit</span>
          </button>
        </nav>
      </div>

      {phase === "round_complete" && completedLevel !== null && completedCfg && (
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
                const have = completedStats?.handCounts[c.hand] ?? 0;
                const done = have >= c.minCount;
                return (
                  <div className="perk" key={`${c.hand}-${c.minCount}`}>
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
                      ? `Use ≤${starMoveTarget} moves for 2★`
                      : "Finish all hand challenges for 3★"}
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

      {phase === "moves_failed" && (
        <div className="modal-overlay levelup-overlay">
          <div className="modal levelup-modal moves-failed-modal game-over-modal">
            <div className="levelup-badge moves-failed-badge game-over-badge">GAME OVER</div>
            <h2>Out of moves</h2>
            <p className="levelup-label">
              Level {formatLevelId(level)} — you used all {effectiveMoveLimit} hands.
            </p>
            <div className="levelup-perks">
              <div className="perk">
                <span className="perk-icon">💰</span>
                <span>{levelScore.toLocaleString()} / {cfg.targetPoints.toLocaleString()} pts</span>
              </div>
              <div className="perk">
                <span className="perk-icon">🎯</span>
                <span>0 moves left</span>
              </div>
              <div className="perk">
                <span className="perk-icon">💎</span>
                <span>{credits} credits · {movesPackLabel()}</span>
              </div>
            </div>
            <button type="button" className="btn btn-restart-level" onClick={retryLevel}>
              Restart level
            </button>
            <button
              type="button"
              className="btn btn-buy-moves"
              onClick={handleBuyMoves}
              disabled={!canBuyMoves}
            >
              Buy {MOVES_PACK_SIZE} moves ({MOVES_PACK_COST} 💎)
            </button>
            {!canBuyMoves && (
              <p className="moves-failed-hint">Not enough credits to buy more moves.</p>
            )}
            <button type="button" className="btn ghost" onClick={onMenu}>
              Back to levels
            </button>
          </div>
        </div>
      )}

      {phase === "campaign_complete" && (
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
              <span className="challenges-modal__points-label">Clear the level</span>
              <span className="challenges-modal__points-val">
                {cfg.targetPoints.toLocaleString()} pts · {cfg.moveLimit} moves
              </span>
            </div>

            {cfg.challenges.length > 0 && (
              <>
                <h3 className="specials-subtitle">For 3★ — hand challenges</h3>
                <ul className="challenge-list challenge-list--modal">
                  {cfg.challenges.map((c) => {
                    const have = levelHandCounts[c.hand] ?? 0;
                    const done = have >= c.minCount;
                    return (
                      <li
                        key={`${c.hand}-${c.minCount}`}
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

            {cfg.blockers && (
              <p className="scores-note scores-note--blockers">🧊 {blockersGuideText()}</p>
            )}

            {pointsMet && !challengesComplete && (
              <p className="challenges-modal__warn">
                Points reached — finish these for 3★.
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
            {cfg.blockers && (
              <p className="scores-note scores-note--blockers">🧊 {blockersGuideText()}</p>
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
    </div>
  );
}
