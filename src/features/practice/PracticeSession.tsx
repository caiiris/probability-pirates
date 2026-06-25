/**
 * PracticeSession — adaptive Alcumus-style solve loop.
 *
 * Owns the per-problem state (current instance, learner's pending answer,
 * solution-revealed flag, session signals) and the daily-capped XP grant.
 *
 * Does NOT own:
 *   - The per-topic adaptive rating (`usePracticeState`) — that lives on
 *     PracticePage so the rating can render in the page header (the "Bounty"
 *     chip). PracticeSession receives `rating` + `recordResult` as props and
 *     reports each per-answer delta back up via `onRatingDelta` for the chip's
 *     +/- indicator.
 *
 * After each graded answer:
 *   1. recordResult(wasCorrect, difficulty, templateId) — updates per-topic
 *      Elo rating + recent template list (C8 doc).
 *   2. recordPracticeAttempt(uid, …) — Engine A: moves per-skill Elo in
 *      learnerModel/state.
 *   3. awardXp(true) — daily-capped XP grant (WP-6c), background write.
 *
 * misconceptionKey is derived from variant.misconceptionByOption?.[chosenOptionId]
 * when the answer was wrong and the variant is multiple-choice.
 *
 * Footer note: LessonFooter is NOT reused here. See WP-6a comment.
 */

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';
import { mulberry32 } from '@/lib/simulations';
import {
  generateInstance,
  pickNextTemplate,
} from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { useSlotState } from '@/features/lesson/useSlotState';
import { DerivationCard } from '@/features/lesson/DerivationCard';
import { Button } from '@/components/ui/button';
import { MOTION, SHAKE_KEYFRAMES } from '@/lib/motion';
import { applyElo } from '@/features/practice/usePracticeState';
import { usePracticeXp } from '@/features/practice/usePracticeXp';
import { SessionSignals } from '@/features/practice/SessionSignals';
import { difficultyLabel } from '@/features/practice/practiceDifficulty';
import { recordPracticeAttempt } from '@/features/learner/learnerModelService';
import type { AttemptPayload } from '@/features/progress/progressService';
import type { PracticeInstance } from '@/features/practice/practiceEngine';
import type { Topic } from '@/content/skills';
import type { MultipleChoiceVariant } from '@/content/types';
import { InteractionDispatch } from '@/features/practice/InteractionDispatch';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  topic: Topic;
  uid: string | null | undefined;
  /** Current per-topic Elo rating, owned by PracticePage. */
  rating: number;
  /** Last 3 templateIds served in this topic (for anti-repeat). */
  recentTemplateIds: string[];
  /** Apply one Elo update + persist to Firestore (background). */
  recordResult: (wasCorrect: boolean, difficulty: number, templateId: string) => void;
  /** Reports the most recent rating change up so the header chip can flash. */
  onRatingDelta: (delta: number) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PracticeSession({
  topic,
  uid,
  rating,
  recentTemplateIds,
  recordResult,
  onRatingDelta,
}: Props) {
  const counterRef = useRef(0);

  // Daily-capped XP for practice (WP-6c).
  const { award: awardXp, capReached: xpCapReached } = usePracticeXp(uid);

  // Session signals: count solved, correct-in-a-row, last-5 results for trend.
  const [solved, setSolved] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [recentResults, setRecentResults] = useState<boolean[]>([]);

  // Keep fresh refs to avoid stale closures in newInstance().
  const ratingRef = useRef(rating);
  const recentRef = useRef(recentTemplateIds);
  ratingRef.current = rating;
  recentRef.current = recentTemplateIds;

  function newInstance(): PracticeInstance {
    const seed = Date.now() ^ (++counterRef.current * 0x9e3779b9);
    const rng = mulberry32(seed);
    const template = pickNextTemplate({
      topic,
      ratingForTopic: ratingRef.current,
      recentTemplateIds: recentRef.current,
      rng,
    });
    return generateInstance(template, rng);
  }

  const [instance, setInstance] = useState<PracticeInstance>(() => newInstance());
  const [currentAnswer, setCurrentAnswer] = useState<AttemptPayload | null>(null);
  const [solutionRevealed, setSolutionRevealed] = useState(false);

  // Reset the loop whenever the topic changes (controlled by PracticePage).
  useEffect(() => {
    const seed = Date.now() ^ (++counterRef.current * 0x9e3779b9);
    const rng = mulberry32(seed);
    const template = pickNextTemplate({
      topic,
      ratingForTopic: ratingRef.current,
      recentTemplateIds: [],
      rng,
    });
    setInstance(generateInstance(template, rng));
    setCurrentAnswer(null);
    setSolutionRevealed(false);
  }, [topic]);

  const { state, dispatch } = useSlotState(instance.instanceId);

  const isChecked = state.feedbackState !== 'idle';

  function handleCheck() {
    if (!currentAnswer) return;
    const result = checkAnswer(instance.variant, currentAnswer);
    const wasCorrect = result.wasCorrect;

    if (wasCorrect) {
      dispatch({ type: 'CORRECT', answer: currentAnswer });
    } else {
      dispatch({ type: 'WRONG', answer: currentAnswer });
    }
    setSolutionRevealed(true);

    // Derive misconceptionKey from the wrong option when the variant is MC.
    let misconceptionKey: string | null = null;
    if (
      !wasCorrect &&
      instance.variant.interactionKind === 'multiple-choice' &&
      'optionId' in currentAnswer
    ) {
      const mcVariant = instance.variant as MultipleChoiceVariant;
      misconceptionKey = mcVariant.misconceptionByOption?.[currentAnswer.optionId] ?? null;
    }

    // Session signals — update live counts.
    setRecentResults((prev) => [...prev, wasCorrect].slice(-5));
    if (wasCorrect) {
      setSolved((n) => n + 1);
      setCorrectStreak((n) => n + 1);
    } else {
      setCorrectStreak(0);
    }

    // Surface the per-topic Elo change up to PracticePage (the Bounty chip
    // flashes this). recordResult applies the same formula internally.
    onRatingDelta(applyElo(rating, instance.difficulty, wasCorrect) - rating);

    // WP-6c: daily-capped practice XP — optimistic, background Firestore writes.
    // award() only writes xp/weeklyXp/weekKey; never touches streak or lessonsCompleted.
    if (wasCorrect) {
      awardXp(true);
    }

    // Engine B (per-topic state, C8 doc) — optimistic, background Firestore write.
    recordResult(wasCorrect, instance.difficulty, instance.templateId);

    // Engine A (per-skill learner model) — background write, never throws.
    if (uid) {
      void recordPracticeAttempt(uid, {
        skills: instance.skills,
        wasCorrect,
        difficulty: instance.difficulty,
        misconceptionKey: misconceptionKey as Parameters<typeof recordPracticeAttempt>[1]['misconceptionKey'],
      });
    }
  }

  function handleNext() {
    setInstance(newInstance());
    setCurrentAnswer(null);
    setSolutionRevealed(false);
  }

  const floodClass =
    state.feedbackState === 'correct'
      ? 'border-[color:var(--green-base)]/40 bg-[color:var(--green-soft)]/60'
      : state.feedbackState === 'wrong'
        ? 'border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/50'
        : 'border-border bg-card';

  return (
    <div className="flex flex-col min-h-full">
      {/* Live session stats — only shown once the user has answered at least one problem. */}
      <SessionSignals solved={solved} correctStreak={correctStreak} recentResults={recentResults} />

      <div className="flex-1 overflow-y-auto">
        {/* Per-problem difficulty + XP-on-offer badge. */}
        <div className="flex items-center justify-center gap-2 pt-3 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
            {difficultyLabel(instance.difficulty)}
          </span>
          <span className="num rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 font-semibold text-primary">
            +5 XP
          </span>
        </div>

        <InteractionDispatch
          variant={instance.variant}
          attemptNumber={state.attemptNumber}
          feedbackState={state.feedbackState}
          wrongTick={state.wrongTick}
          onChange={setCurrentAnswer}
        />

        {solutionRevealed && (
          <div className="mx-auto max-w-sm w-full px-4 pb-6">
            <DerivationCard derivation={instance.explanation} />
          </div>
        )}
      </div>

      {/*
       * Minimal practice footer — same flood/animation patterns as LessonFooter
       * but with "Next problem" instead of "Continue".
       */}
      <div
        className={`shrink-0 border-t px-4 py-4 space-y-3 transition-colors duration-200 ${floodClass}`}
      >
        <AnimatePresence mode="wait">
          {state.feedbackState === 'correct' && (
            <motion.div
              key="correct"
              className="flex flex-col gap-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="flex items-start gap-2 text-sm font-medium text-[color:var(--green-deep)]"
                role="status"
                aria-live="polite"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={MOTION.pop}
                  className="mt-0.5 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </motion.span>
                <span>{instance.variant.feedbackCorrect}</span>
              </div>

              {/* Non-blocking cap-reached note (WP-6c). */}
              {xpCapReached && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                  <Star className="w-3 h-3 shrink-0" aria-hidden="true" />
                  Daily practice XP cap reached — come back tomorrow for more!
                </p>
              )}
            </motion.div>
          )}

          {state.feedbackState === 'wrong' && (
            <motion.p
              key={`wrong-${state.wrongTick}`}
              className="text-sm font-medium text-[color:var(--coral-deep)]"
              initial={{ opacity: 0 }}
              animate={SHAKE_KEYFRAMES}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
            >
              {instance.variant.feedbackDefault}
            </motion.p>
          )}
        </AnimatePresence>

        {isChecked ? (
          <Button size="lg" className="w-full" onClick={handleNext}>
            Next problem
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!currentAnswer}
            onClick={handleCheck}
          >
            Check
          </Button>
        )}
      </div>
    </div>
  );
}
