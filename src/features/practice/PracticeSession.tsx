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
import { difficultyLabel } from '@/features/practice/practiceDifficulty';
import { practiceXpBaseForDifficulty } from '@/lib/practiceXp';
import { useAiHint } from '@/features/ai/useAiHint';
import type { HintRequest } from '@/features/ai/useAiHint';
import { recordPracticeAttempt } from '@/features/learner/learnerModelService';
import type { AttemptPayload } from '@/features/progress/progressService';
import type { PracticeInstance } from '@/features/practice/practiceEngine';
import type { ExactAnswer } from '@/lib/probability/exact';
import type { Topic } from '@/content/skills';
import type { Variant } from '@/content/types';
import { InteractionDispatch } from '@/features/practice/InteractionDispatch';
import { ConceptualRound } from '@/features/practice/ConceptualRound';
import { pickConceptualProblem } from '@/features/practice/conceptual';
import { diagnoseWrongAnswer } from '@/features/practice/diagnoseWrongAnswer';
import type { ConceptualProblem } from '@/content/conceptual/types';

// ─── Ground-truth helpers (for the AI hint request) ─────────────────────────────

/**
 * Render the code-verified answer as a plain string for the hint `ground`.
 * The model is *told* the answer so it can avoid revealing it; for MC we pass
 * the correct option's label (more meaningful to the model than an option id).
 */
function formatExactAnswer(answer: ExactAnswer, variant: Variant): string {
  switch (answer.kind) {
    case 'int':
      return String(answer.value);
    case 'fraction':
      return `${answer.value.num}/${answer.value.den}`;
    case 'choice': {
      if (variant.interactionKind === 'multiple-choice') {
        return variant.options.find((o) => o.id === answer.optionId)?.label ?? answer.optionId;
      }
      return answer.optionId;
    }
  }
}

/** How many wrong tries before the canonical solution is revealed (F2). */
const MAX_TRIES = 3;

/** Drop in a matching-topic concept-check after this many template problems. */
const INTERLEAVE_EVERY = 4;

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
  /** Reports a checked answer to the page-level progress popup. */
  onAnswered: (event: { topic: Topic; difficulty: number; wasCorrect: boolean }) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PracticeSession({
  topic,
  uid,
  rating,
  recentTemplateIds,
  recordResult,
  onRatingDelta,
  onAnswered,
}: Props) {
  const counterRef = useRef(0);

  // Daily-capped XP for practice (WP-6c).
  const { award: awardXp, capReached: xpCapReached } = usePracticeXp(uid);

  // F2 — personalized hint ladder (degrades to authored copy when AI is off).
  const { requestHint } = useAiHint();

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
  // `resolved` = this problem is finished (solved, or revealed after 3 misses).
  const [resolved, setResolved] = useState(false);
  // The current ladder hint to show between tries (null = none yet).
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  // F2 interleave — when set, this round is a two-part concept-check instead of
  // a template problem. Streak counts consecutive template problems served.
  const [conceptual, setConceptual] = useState<ConceptualProblem | null>(null);
  const templateStreakRef = useRef(1); // the initial problem is a template
  const recentConceptualRef = useRef<string[]>([]);

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
    setConceptual(null);
    templateStreakRef.current = 1;
    recentConceptualRef.current = [];
    setCurrentAnswer(null);
    setResolved(false);
    setHint(null);
    setHintLoading(false);
  }, [topic]);

  const { state, dispatch } = useSlotState(instance.instanceId);

  /** Build the AI-hint request from the current instance + the learner's answer. */
  function buildHintRequest(tryNumber: 1 | 2): HintRequest {
    const ctx = (instance.variant as { context?: string }).context;
    return {
      mode: 'computational',
      tryNumber,
      problem: { prompt: instance.variant.prompt, context: ctx },
      learnerAnswer: (currentAnswer ?? {}) as Record<string, unknown>,
      ground: {
        // Code-verified answer + canonical steps as ground truth. The model is
        // told the answer ONLY so it can steer around it; it must not reveal it.
        answer: formatExactAnswer(instance.answer, instance.variant),
        canonicalWhy: instance.explanation.steps.join(' '),
      },
    };
  }

  /**
   * Finalize the problem: reveal the canonical solution, record all signals,
   * and award difficulty-scaled, try-decayed XP (a reveal earns nothing).
   */
  function resolve(wasCorrect: boolean, solvedOnTry: number) {
    setResolved(true);
    setHint(null);

    // Derive the misconception key from the wrong answer via the centralized
    // diagnoseWrongAnswer helper (C-MC2). Covers number-fill, multiple-choice,
    // and fill-fraction trap matching; returns null when no trap matches.
    const diagnosedKey =
      !wasCorrect && currentAnswer
        ? diagnoseWrongAnswer(instance.variant, currentAnswer)
        : null;

    onAnswered({ topic, difficulty: instance.difficulty, wasCorrect });

    // Surface the per-topic Elo change up to PracticePage (the Bounty chip
    // flashes this). recordResult applies the same formula internally.
    onRatingDelta(applyElo(rating, instance.difficulty, wasCorrect) - rating);

    // WP-6c + D100/F2: daily-capped, difficulty-scaled, try-decayed practice XP.
    // Only a correct solve earns XP; a reveal after 3 misses earns 0.
    if (wasCorrect) {
      awardXp(true, { difficulty: instance.difficulty, tryNumber: solvedOnTry });
    }

    // Engine B (per-topic state, C8 doc) — optimistic, background Firestore write.
    recordResult(wasCorrect, instance.difficulty, instance.templateId);

    // Engine A (per-skill learner model) — background write, never throws.
    if (uid) {
      void recordPracticeAttempt(uid, {
        skills: instance.skills,
        wasCorrect,
        difficulty: instance.difficulty,
        misconceptionSignal: diagnosedKey ? { key: diagnosedKey, source: 'trap' } : null,
      });
    }
  }

  /**
   * 3-try hint ladder (F2): a wrong answer on try 1–2 fetches an escalating
   * hint and lets the learner retry WITHOUT revealing the answer; the 3rd miss
   * (or any correct answer) resolves the problem and reveals the worked solution.
   */
  async function handleCheck() {
    if (!currentAnswer || resolved || hintLoading) return;

    const thisTry = state.attemptNumber; // 1-based try being used right now
    const wasCorrect = checkAnswer(instance.variant, currentAnswer).wasCorrect;

    if (wasCorrect) {
      dispatch({ type: 'CORRECT', answer: currentAnswer });
      resolve(true, thisTry);
      return;
    }

    // Wrong — advance the try counter.
    dispatch({ type: 'WRONG', answer: currentAnswer });

    // Out of tries → reveal the canonical solution (no XP).
    if (thisTry >= MAX_TRIES) {
      resolve(false, thisTry);
      return;
    }

    // Tries 1–2 → fetch an escalating hint; the API never reveals the answer.
    // Any failure (AI off, network, rate-limited) falls back to authored copy.
    setHint(null);
    setHintLoading(true);
    const result = await requestHint(buildHintRequest(thisTry as 1 | 2));
    setHintLoading(false);
    setHint(result.fallbackUsed || !result.text ? instance.variant.feedbackDefault : result.text);
  }

  /**
   * Advance to the next round. After every `INTERLEAVE_EVERY` template problems
   * we try to serve a matching-topic concept-check; if the topic has none, we
   * stay on templates. Concept-checks render via <ConceptualRound>.
   */
  function handleNext() {
    setCurrentAnswer(null);
    setResolved(false);
    setHint(null);
    setHintLoading(false);

    const seed = Date.now() ^ (++counterRef.current * 0x9e3779b9);
    const rng = mulberry32(seed);

    if (templateStreakRef.current >= INTERLEAVE_EVERY) {
      const cp = pickConceptualProblem({
        topic,
        recentIds: recentConceptualRef.current,
        rng,
      });
      if (cp) {
        templateStreakRef.current = 0;
        recentConceptualRef.current = [cp.id, ...recentConceptualRef.current].slice(0, 3);
        setConceptual(cp);
        return;
      }
    }

    // Template round.
    templateStreakRef.current += 1;
    setConceptual(null);
    setInstance(newInstance());
  }

  const floodClass =
    state.feedbackState === 'correct'
      ? 'border-[color:var(--green-base)]/40 bg-[color:var(--green-soft)]/60'
      : state.feedbackState === 'wrong'
        ? 'border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/50'
        : 'border-border bg-card';

  // Concept-check round — a self-contained two-part problem with its own ladder.
  if (conceptual) {
    return (
      <ConceptualRound
        problem={conceptual}
        uid={uid}
        topic={topic}
        awardXp={awardXp}
        onAnswered={onAnswered}
        onNext={handleNext}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/*
       * Vertical centering pattern (`min-h-full` + `my-auto`): when the problem
       * + worked-solution combined height is shorter than the available area,
       * the auto-margins balance and the content sits in the visual middle.
       * Once it overflows (a long DerivationCard pushes things tall) the auto
       * margins collapse to 0 and the area scrolls from the top — same pattern
       * the lesson player uses for concept slots.
       */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          <div className="my-auto flex flex-col items-stretch gap-5 py-6">
            {/* Per-problem difficulty + XP-on-offer badge. */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                {difficultyLabel(instance.difficulty)}
              </span>
              <span className="num rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 font-semibold text-primary">
                +{practiceXpBaseForDifficulty(instance.difficulty)} XP
              </span>
            </div>

            <InteractionDispatch
              variant={instance.variant}
              attemptNumber={state.attemptNumber}
              feedbackState={state.feedbackState}
              wrongTick={state.wrongTick}
              onChange={setCurrentAnswer}
            />

            {resolved && (
              <div className="mx-auto max-w-sm w-full px-4">
                <DerivationCard derivation={instance.explanation} />
              </div>
            )}
          </div>
        </div>
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

          {/* Ladder hint — wrong but still has tries left. */}
          {state.feedbackState === 'wrong' && !resolved && (
            <motion.div
              key={`hint-${state.wrongTick}`}
              className="flex flex-col gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: SHAKE_KEYFRAMES.x }}
              transition={SHAKE_KEYFRAMES.transition}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--coral-deep)]">
                Try {Math.min(state.attemptNumber, MAX_TRIES)} of {MAX_TRIES}
              </p>
              <p className="text-sm font-medium text-foreground">
                {hintLoading ? 'Thinking…' : (hint ?? instance.variant.feedbackDefault)}
              </p>
            </motion.div>
          )}

          {/* Out of tries — solution revealed below; show the authored nudge. */}
          {state.feedbackState === 'wrong' && resolved && (
            <motion.p
              key="revealed"
              className="text-sm font-medium text-[color:var(--coral-deep)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
            >
              {instance.variant.feedbackDefault}
            </motion.p>
          )}
        </AnimatePresence>

        {resolved ? (
          <Button size="lg" className="w-full" onClick={handleNext}>
            Next problem
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!currentAnswer || hintLoading}
            onClick={handleCheck}
          >
            {hintLoading ? 'Checking…' : 'Check'}
          </Button>
        )}
      </div>
    </div>
  );
}
