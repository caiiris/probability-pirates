/**
 * WarmupPage — the spaced-retrieval "Daily Warm-up" (spec-spaced-review §6).
 *
 * A short (≤4 item) retrieval session served before a NEW lesson when skills the
 * learner has met are due for review. Every item is a code-verified practice
 * problem for a due skill's topic; answering updates the Leitner schedule, the
 * per-skill learner model (Engine A), and daily-capped practice XP.
 *
 * Soft gate: a "Skip today" control dismisses the warm-up for the rest of the
 * local day. Completing or skipping marks the day satisfied so it never loops.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { mulberry32 } from '@/lib/simulations';
import { generateInstance, pickNextTemplate } from '@/features/practice/practiceEngine';
import type { PracticeInstance } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { useSlotState } from '@/features/lesson/useSlotState';
import { DerivationCard } from '@/features/lesson/DerivationCard';
import { InteractionDispatch } from '@/features/practice/InteractionDispatch';
import { usePracticeXp } from '@/features/practice/usePracticeXp';
import { recordPracticeAttempt } from '@/features/learner/learnerModelService';
import { DEFAULT_RATING } from '@/features/learner/learnerModel';
import { SKILLS } from '@/content/skills';
import type { SkillId } from '@/content/skills';
import { todayLocalDate } from '@/lib/streak';
import { Button } from '@/components/ui/button';
import { MOTION, SHAKE_KEYFRAMES } from '@/lib/motion';
import {
  getReviewSchedule,
  recordReviewResult,
  markWarmupSatisfied,
  REVIEWABLE_SKILLS,
} from './reviewService';
import { dueSkills } from './reviewSchedule';
import type { AttemptPayload } from '@/features/progress/progressService';

const MAX_WARMUP_ITEMS = 4;

type WarmupItem = { skill: SkillId; instance: PracticeInstance };

/** Only allow internal redirect targets; ignore anything off-site. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

export function WarmupPage() {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : '';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get('next'));

  const { award } = usePracticeXp(uid);

  const [items, setItems] = useState<WarmupItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<AttemptPayload | null>(null);
  const [resolved, setResolved] = useState(false);

  // Leave the warm-up: mark today satisfied (so it does not re-fire) and go on
  // to the lesson the learner originally tapped.
  const leaveRef = useRef<() => void>(() => {});
  leaveRef.current = () => {
    if (uid) void markWarmupSatisfied(uid, todayLocalDate());
    navigate(next, { replace: true });
  };

  // Build the item set once from a snapshot of the due skills.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const schedule = await getReviewSchedule(uid);
      if (cancelled) return;
      const due = schedule
        ? dueSkills(schedule, Date.now(), REVIEWABLE_SKILLS).slice(0, MAX_WARMUP_ITEMS)
        : [];
      const built: WarmupItem[] = [];
      let counter = 0;
      for (const skill of due) {
        try {
          const topic = SKILLS[skill].topic;
          const rng = mulberry32(Date.now() ^ (++counter * 0x9e3779b9));
          const template = pickNextTemplate({
            topic,
            ratingForTopic: DEFAULT_RATING,
            recentTemplateIds: [],
            rng,
          });
          built.push({ skill, instance: generateInstance(template, rng) });
        } catch {
          // Skip a skill we cannot generate an item for (fails open).
        }
      }
      if (cancelled) return;
      if (due.length === 0) {
        // Nothing was due → the gate is genuinely satisfied for today.
        leaveRef.current();
        return;
      }
      if (built.length === 0) {
        // Items WERE due but none could be generated. Do NOT mark the day
        // satisfied (that would silently skip the review) — just continue to
        // the lesson so the learner isn't blocked; the gate retries next time.
        navigate(next, { replace: true });
        return;
      }
      setItems(built);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const item = items ? items[index] : null;
  const { state, dispatch } = useSlotState(item?.instance.instanceId ?? 'warmup-pending');

  function handleCheck() {
    if (!item || !currentAnswer || resolved) return;
    const correct = checkAnswer(item.instance.variant, currentAnswer).wasCorrect;
    dispatch({ type: correct ? 'CORRECT' : 'WRONG', answer: currentAnswer });
    setResolved(true);

    if (uid) {
      void recordReviewResult(uid, item.skill, correct);
      void recordPracticeAttempt(uid, {
        skills: [item.skill],
        wasCorrect: correct,
        difficulty: item.instance.difficulty,
        solvedOnTry: 1,
      });
    }
    if (correct) award(true, { difficulty: item.instance.difficulty, tryNumber: 1 });
  }

  function handleNext() {
    if (!items) return;
    if (index >= items.length - 1) {
      leaveRef.current();
      return;
    }
    setCurrentAnswer(null);
    setResolved(false);
    setIndex(index + 1);
  }

  // Loading the item set.
  if (!items || !item) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-card"
        role="status"
        aria-label="Loading warm-up"
      >
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const total = items.length;
  const floodClass =
    state.feedbackState === 'correct'
      ? 'border-[color:var(--green-base)]/40 bg-[color:var(--green-soft)]/60'
      : state.feedbackState === 'wrong'
        ? 'border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/50'
        : 'border-border bg-card';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-card">
      {/* Header — purpose + progress + skip */}
      <header className="shrink-0 border-b px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:var(--primary-soft)] text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Daily warm-up</p>
            <p className="text-xs text-muted-foreground">
              Quick refresher on skills you have learned. {index + 1} of {total}.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground"
            onClick={() => leaveRef.current()}
          >
            <X className="mr-1 h-4 w-4" aria-hidden="true" />
            Skip today
          </Button>
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-2 flex max-w-2xl gap-1">
          {items.map((it, i) => (
            <span
              key={it.instance.instanceId}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < index || (i === index && resolved)
                  ? 'bg-primary'
                  : i === index
                    ? 'bg-primary/40'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-2xl flex-col">
          <div className="my-auto flex flex-col items-stretch gap-5 px-4 py-6">
            <InteractionDispatch
              key={item.instance.instanceId}
              variant={item.instance.variant}
              attemptNumber={state.attemptNumber}
              feedbackState={state.feedbackState}
              wrongTick={state.wrongTick}
              onChange={setCurrentAnswer}
            />
            {resolved && (
              <div className="mx-auto w-full max-w-sm px-4">
                <DerivationCard derivation={item.instance.explanation} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className={`shrink-0 space-y-3 border-t px-4 py-4 transition-colors duration-200 ${floodClass}`}>
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            {resolved && state.feedbackState === 'correct' && (
              <motion.div
                key="correct"
                className="mb-3 flex items-start gap-2 text-sm font-medium text-[color:var(--green-deep)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="status"
                aria-live="polite"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={MOTION.pop}
                  className="mt-0.5 shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </motion.span>
                <span>{item.instance.variant.feedbackCorrect}</span>
              </motion.div>
            )}
            {resolved && state.feedbackState === 'wrong' && (
              <motion.p
                key="wrong"
                className="mb-3 text-sm font-medium text-[color:var(--coral-deep)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: SHAKE_KEYFRAMES.x }}
                transition={SHAKE_KEYFRAMES.transition}
                exit={{ opacity: 0 }}
                role="alert"
                aria-live="assertive"
              >
                {item.instance.variant.feedbackDefault}
              </motion.p>
            )}
          </AnimatePresence>

          {resolved ? (
            <Button size="lg" className="w-full" onClick={handleNext}>
              {index >= total - 1 ? 'Start lesson' : 'Next'}
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
    </div>
  );
}
