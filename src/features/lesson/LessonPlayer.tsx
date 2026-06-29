import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLessonProgress } from '@/features/progress/useLessonProgress';
import {
  getOrCreateProgress,
  recordAttempt,
  recordVariantSelection,
  markLessonCompleted,
  advanceSlot,
} from '@/features/progress/progressService';
import {
  applyAttemptOutcome,
  applyLessonCompletion,
  applySlotAdvance,
} from '@/features/habit/habitService';
import { checkAnswer } from '@/lib/checkAnswer';
import { xpForAttempt, LESSON_COMPLETION_BONUS } from '@/lib/xp';
import { useSlotState } from './useSlotState';
import { LessonHeader } from './LessonHeader';
import { LessonFooter } from './LessonFooter';
import { ConceptSlotView } from './ConceptSlotView';
import { WrapSlotView } from './WrapSlotView';
import { ProblemSlotView } from './ProblemSlotView';
import { CaptainPascal } from '@/features/captain/CaptainPascal';
import { useLessonById, useLessons } from '@/features/flags/useLessons';
import { useDueReviews } from '@/features/review/useDueReviews';
import { seedReviewSkills } from '@/features/review/reviewService';
import { lessonSkills } from '@/features/review/lessonSkills';
import { recordLessonExposure } from '@/features/learner/learnerModelService';
import { buildReportCard } from '@/features/learner/learnerModel';
import type { SlotFirstTry } from '@/features/learner/learnerModel';
import { diagnoseWrongAnswer } from '@/features/practice/diagnoseWrongAnswer';
import type { AttemptPayload } from '@/features/progress/progressService';
import type { Lesson } from '@/content/types';
import type { UserProfile } from '@/features/auth/AuthProvider';
import type { MilestoneId } from '@/lib/milestones';
import { ACHIEVEMENT_BY_ID } from '@/lib/achievements';
import type { AchievementId } from '@/lib/achievements';
import { MOTION } from '@/lib/motion';
import { track } from '@/lib/analytics';
import { ERROR_COPY } from '@/lib/errors';

// ---------------------------------------------------------------------------
// ReviewBanner — thin strip under the header so the read-only nature of
// review mode stays visible while the regular LessonFooter drives the CTA.
// ---------------------------------------------------------------------------

function ReviewBanner() {
  return (
    <div role="status" className="shrink-0 border-b bg-muted/40 px-4 py-1.5 text-center">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Review · retries don&apos;t affect XP or progress
      </span>
    </div>
  );
}

/** Surface newly-earned achievements as lightweight toasts. */
function toastAchievements(ids: AchievementId[]): void {
  for (const id of ids) {
    const def = ACHIEVEMENT_BY_ID[id];
    if (def) toast(`Achievement unlocked: ${def.title}`, { icon: '🏆' });
  }
}

// ---------------------------------------------------------------------------
// ComingSoonRedirect — shows toast in effect (not during render)
// ---------------------------------------------------------------------------
function ComingSoonRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    toast(ERROR_COPY.progress.lessonNotReady);
    navigate('/', { replace: true });
  }, [navigate]);
  return null;
}

// ---------------------------------------------------------------------------
// LessonLoadingSkeleton — shown while progress (or the warm-up gate decision)
// is still resolving.
// ---------------------------------------------------------------------------
function LessonLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-card">
      <Skeleton className="h-14 w-full rounded-none" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="h-32 w-32 rounded-xl" />
        <Skeleton className="h-6 w-64 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <Skeleton className="h-20 w-full rounded-none" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LessonPlayer — outer guard (hooks run unconditionally after this)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Slot transition direction
//
// When the learner advances (Continue / Forward arrow) we slide the new slot
// in from the right and exit the old one to the left — like turning a page
// forward. Going back reverses both. The `custom` prop carries the direction
// (+1 forward, -1 back) into the variants. Tracked with a ref so we have
// the value synchronously during render without an extra state flip.
// ---------------------------------------------------------------------------

type SlotDirection = 1 | -1;

const SLOT_VARIANTS = {
  enter: (dir: SlotDirection) => ({ x: 48 * dir, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: SlotDirection) => ({ x: -48 * dir, opacity: 0 }),
};

function useSlotDirection(displayIndex: number): SlotDirection {
  const lastIndex = useRef(displayIndex);
  const direction = useRef<SlotDirection>(1);
  if (displayIndex > lastIndex.current) direction.current = 1;
  else if (displayIndex < lastIndex.current) direction.current = -1;
  lastIndex.current = displayIndex;
  return direction.current;
}

export function LessonPlayer() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const auth = useAuth();
  const lessonById = useLessonById();

  const uid = auth.status === 'authenticated' ? auth.user.uid : '';
  const profile = auth.status === 'authenticated' ? auth.profile : null;

  const lesson = lessonById.get(lessonId);

  if (!lesson) return <Navigate to="/" replace />;
  if (lesson.comingSoon) return <ComingSoonRedirect />;

  return <LessonPlayerInner uid={uid} profile={profile} lesson={lesson} />;
}

// ---------------------------------------------------------------------------
// LessonPlayerInner
// ---------------------------------------------------------------------------
function LessonPlayerInner({
  uid,
  profile,
  lesson,
}: {
  uid: string;
  profile: UserProfile | null;
  lesson: Lesson;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Read-only review of a finished lesson: walk every step from the start,
  // nothing is written and no XP/completion is re-awarded.
  const isReview = searchParams.get('mode') === 'review';
  const progressState = useLessonProgress(uid, lesson.id);
  // Spaced-review warm-up gate status (spec-spaced-review). Fails open.
  const dueReviews = useDueReviews(uid);
  // Whole planned course as the denominator (live + locked roadmap stubs),
  // so the 'course-cleared' achievement only fires after every lesson — not
  // when the single currently-authored lesson is finished and the rest of
  // the path is still locked previews (D91; same fix as HomePage,
  // CelebrationScreen, PublicProfilePage).
  const courseTotal = useLessons().length;
  const [currentAnswer, setCurrentAnswer] = useState<AttemptPayload | null>(null);
  const pickedVariantIdRef = useRef('');
  const [pickedVariantId, setPickedVariantId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Track whether today was a new streak day (set on first correct check of day)
  const isNewStreakDayRef = useRef(false);
  // Achievement signals for this lesson session:
  //   allFirstTry — no problem was ever answered wrong (=> 'flawless')
  //   hadComeback — at least one correct answer followed a wrong one (=> 'bounce-back')
  const allFirstTryRef = useRef(true);
  const hadComebackRef = useRef(false);
  // Engine B (spec-learner-model): first-committed-attempt-per-slot results for
  // this lesson session, used to build the celebration report card and feed the
  // exposure/misconception model. `recordedSlotsRef` guards one entry per slot.
  const firstTriesRef = useRef<SlotFirstTry[]>([]);
  const recordedSlotsRef = useRef<Set<string>>(new Set());
  // Wall-clock start of this lesson session, for the `lesson_complete` event
  const sessionStartedAtRef = useRef<number>(Date.now());
  // Guard so `lesson_start` only fires once per mount (progress snapshot can
  // re-emit and we don't want duplicate events).
  const lessonStartLoggedRef = useRef(false);

  // Ensure progress doc exists on first visit — use effect, not render body (B010)
  useEffect(() => {
    if (!uid || !lesson.id) return;
    getOrCreateProgress(uid, lesson.id).catch((err) => {
      console.error('Failed to initialize progress:', err);
    });
  }, [uid, lesson.id]);

  // Fire lesson_start once we know whether this is a fresh attempt vs resume.
  useEffect(() => {
    if (lessonStartLoggedRef.current) return;
    if (progressState.status !== 'ready') return;
    const mode = progressState.data.slotIndex > 0 ? 'resume' : 'new';
    track('lesson_start', {
      lesson_id: lesson.id,
      lesson_number: lesson.number,
      mode,
    });
    sessionStartedAtRef.current = Date.now();
    lessonStartLoggedRef.current = true;
  }, [progressState, lesson.id, lesson.number]);

  const slotIndex = progressState.status === 'ready' ? progressState.data.slotIndex : 0;
  const slots = lesson.slots;

  // viewSlotIndex allows the learner to navigate back through completed slots
  // without changing Firestore progress. It tracks up to slotIndex. In review
  // mode we start at the very first step instead of the leading edge.
  const [viewSlotIndex, setViewSlotIndex] = useState(isReview ? 0 : slotIndex);

  // Keep viewSlotIndex at the leading edge when Firestore progress advances —
  // but never in review mode, where the learner drives navigation themselves.
  useEffect(() => {
    if (isReview) return;
    setViewSlotIndex((prev) => Math.max(prev, slotIndex));
  }, [slotIndex, isReview]);

  // In review mode every step is read-only; otherwise only steps behind the
  // leading edge are.
  const isReviewMode = isReview || viewSlotIndex < slotIndex;
  const displayIndex = Math.min(viewSlotIndex, slots.length - 1);
  const slot = slots[displayIndex];

  // Direction-aware slot transition: when the learner advances (forward arrow
  // / auto-advance) the new slot slides in from the right and the old one
  // slides out to the left, like turning a page forward. When they go back
  // (back arrow), it reverses. Subtle but it matches the cognitive direction
  // and stops every navigation from feeling identical. Tracked via ref so
  // the value is available synchronously during render.
  const slotDirection = useSlotDirection(displayIndex);

  const { state: slotState, dispatch } = useSlotState(slot.id);

  // Record variant selection the first time we see it. Review mode is purely
  // local — never persist a new selection (the original variant pick already
  // lives in `progress.selectedVariantIds`).
  const handleVariantPicked = useCallback(
    (variantId: string) => {
      if (!variantId || variantId === pickedVariantIdRef.current) return;
      pickedVariantIdRef.current = variantId;
      setPickedVariantId(variantId);
      if (isReview) return;
      const progress = progressState.status === 'ready' ? progressState.data : null;
      if (progress && !progress.selectedVariantIds[slot.id]) {
        recordVariantSelection(uid, lesson.id, slot.id, variantId).catch(console.error);
      }
    },
    [uid, lesson.id, slot.id, progressState, isReview],
  );

  // Review-mode "check" — local-only. Computes feedback via the same pure
  // `checkAnswer` and dispatches CORRECT/WRONG to the local slot reducer, but
  // never writes to Firestore, awards XP, touches streaks/achievements, or
  // fires analytics. The user can keep retrying as many times as they want;
  // their saved progress and stats stay exactly as they were.
  function handleCheckReview() {
    if (!currentAnswer || slot.kind !== 'problem' || submitting) return;
    const variant =
      slot.variants.find((v) => v.id === pickedVariantIdRef.current) ?? slot.variants[0];
    const result = checkAnswer(variant, currentAnswer);
    if (result.wasCorrect) {
      dispatch({ type: 'CORRECT', answer: currentAnswer });
    } else {
      dispatch({ type: 'WRONG', answer: currentAnswer });
    }
  }

  // Review-mode "continue" — local-only. Advances `viewSlotIndex` without
  // writing to Firestore. At the end, returns the learner to the home screen.
  function handleContinueReview() {
    if (submitting) return;
    const isLastSlot = viewSlotIndex >= slots.length - 1;
    if (isLastSlot) {
      navigate('/');
      return;
    }
    setCurrentAnswer(null);
    setViewSlotIndex(viewSlotIndex + 1);
  }

  async function handleCheck() {
    if (!currentAnswer || slot.kind !== 'problem' || submitting) return;
    setSubmitting(true);

    // Use ref for instant access — avoids stale state race (B013)
    const variant =
      slot.variants.find((v) => v.id === pickedVariantIdRef.current) ?? slot.variants[0];
    const result = checkAnswer(variant, currentAnswer);

    const attemptNumber = slotState.attemptNumber;
    const xpAwarded = xpForAttempt(attemptNumber, result.wasCorrect);

    // Record achievement signals for this lesson before mutating slot state.
    if (!result.wasCorrect) {
      allFirstTryRef.current = false; // any wrong attempt rules out 'flawless'
    } else if (attemptNumber > 1) {
      hadComebackRef.current = true; // correct after a wrong attempt => 'bounce-back'
    }

    // Engine B (spec-learner-model F3/F3b): capture the FIRST committed attempt
    // per slot — this is the durable lesson signal (review/no-bail-out grind is
    // excluded). Feeds the exposure/misconception model and the report card.
    if (!isReview && attemptNumber === 1 && !recordedSlotsRef.current.has(slot.id)) {
      recordedSlotsRef.current.add(slot.id);
      const skills = variant.skills ?? [];
      const misconceptionKey = !result.wasCorrect
        ? (diagnoseWrongAnswer(variant, currentAnswer) ?? undefined)
        : undefined;
      firstTriesRef.current.push({
        slotId: slot.id,
        skills,
        firstTryCorrect: result.wasCorrect,
        misconceptionKey,
      });
      if (uid) {
        void recordLessonExposure(uid, {
          skills,
          firstTryCorrect: result.wasCorrect,
          misconceptionKey: misconceptionKey ?? null,
        });
      }
    }

    // Show the verdict immediately, before any persistence. The Firestore
    // writes below still run (and still gate the Continue/Check button via
    // `submitting` until the attempt is saved), but the correct/wrong feedback
    // must never wait on the network — see PRD AC 9.2.7 ("persistence never
    // blocks feedback") and the <100ms feedback target. `attemptNumber` and
    // `xpAwarded` are read above, before this dispatch, so the values sent to
    // the writes are unaffected by the state transition.
    if (result.wasCorrect) {
      dispatch({ type: 'CORRECT', answer: currentAnswer });
    } else {
      dispatch({ type: 'WRONG', answer: currentAnswer });
    }

    const saved = await recordAttempt({
      uid,
      lessonId: lesson.id,
      slotId: slot.id,
      variantId: variant.id,
      attemptNumber,
      wasCorrect: result.wasCorrect,
      xpAwarded,
      answerPayload: currentAnswer,
    });

    if (!saved.ok) {
      toast(ERROR_COPY.progress.saveAnswer);
    }

    track('attempt_checked', {
      lesson_id: lesson.id,
      slot_id: slot.id,
      variant_id: variant.id,
      attempt_number: attemptNumber,
      was_correct: result.wasCorrect,
      xp_awarded: xpAwarded,
    });

    // The 2nd wrong attempt reveals variant.explanation via useSlotState
    // (state.attemptNumber >= 2 after WRONG dispatch). Fire once at the
    // moment of reveal so we can measure how often learners need the hint.
    if (!result.wasCorrect && attemptNumber === 2 && variant.explanation) {
      track('attempt_hinted', {
        lesson_id: lesson.id,
        slot_id: slot.id,
        variant_id: variant.id,
        attempt_number: attemptNumber,
      });
    }

    if (profile) {
      const habitResult = await applyAttemptOutcome(uid, profile, attemptNumber, result.wasCorrect);
      if (habitResult.ok && habitResult.result.isNewStreakDay) {
        isNewStreakDayRef.current = true;
      }
      if (habitResult.ok) {
        if (habitResult.result.streakFreezeUsed) {
          toast(
            `Streak Freeze used — your ${habitResult.result.currentStreak}-day streak is safe!`,
            { icon: '❄️' },
          );
        }
        toastAchievements(habitResult.result.newAchievements);
      }
    } else {
      // profile null while authenticated — warn but continue (B044)
      toast(ERROR_COPY.progress.profileUnavailable, { id: 'no-profile' });
    }

    setSubmitting(false);
  }

  async function handleContinue() {
    if (submitting) return;
    setSubmitting(true);

    const isLastSlot = viewSlotIndex >= slots.length - 1;

    if (isLastSlot) {
      // Idempotency guard: if this lesson is ALREADY completed (e.g. the learner
      // pressed browser Back from the celebration and tapped Continue again),
      // do NOT re-run the completion awards — that would double-count XP,
      // lessonsCompleted, stepsCompleted, and weeklyXp. Just return to the
      // (refresh-safe) celebration without awarding anything again.
      if (progressState.status === 'ready' && progressState.data.state === 'completed') {
        navigate(
          `/celebration/${lesson.id}?xp=0&streak=${profile?.currentStreak ?? 0}` +
            `&streakDelta=0&milestones=&completed=${profile?.lessonsCompleted ?? 0}` +
            `&total=${profile?.xp ?? 0}`,
        );
        return;
      }

      // Increment stepsCompleted for the final wrap slot (B008)
      if (slot.kind !== 'problem' && uid) {
        applySlotAdvance(uid).catch(console.error);
      }

      const saved = await markLessonCompleted(uid, lesson.id);
      if (!saved.ok) {
        toast(ERROR_COPY.progress.saveCompletion);
        setSubmitting(false);
        return;
      }

      // Spaced review (spec-spaced-review): schedule the skills this lesson
      // taught for future retrieval. Best-effort; never blocks completion.
      void seedReviewSkills(uid, lessonSkills(lesson));

      const progress = progressState.status === 'ready' ? progressState.data : null;
      const xpEarned = progress?.xpEarnedThisAttempt ?? 0;
      let xpEarnedThisLesson = xpEarned + LESSON_COMPLETION_BONUS;
      let celebrationParams = `xp=${xpEarnedThisLesson}&streak=0&streakDelta=0&milestones=&completed=1`;
      let finalCurrentStreak = 0;
      let finalIsNewStreakDay = false;
      let finalNewMilestones: MilestoneId[] = [];

      const completionSummary = {
        allFirstTry: allFirstTryRef.current,
        hadComeback: hadComebackRef.current,
        courseTotal,
      };

      if (profile) {
        const habitResult = await applyLessonCompletion(
          uid,
          profile,
          xpEarned,
          isNewStreakDayRef.current,
          completionSummary,
        );
        const apply = (r: typeof habitResult) => {
          if (!r.ok) return false;
          const {
            xpEarnedThisLesson: xp,
            newCurrentStreak,
            isNewStreakDay,
            newMilestones,
            newLessonsCompleted,
            newAchievements,
          } = r.result;
          xpEarnedThisLesson = xp;
          finalCurrentStreak = newCurrentStreak;
          finalIsNewStreakDay = isNewStreakDay;
          finalNewMilestones = newMilestones;
          toastAchievements(newAchievements);
          const streakDelta = isNewStreakDay ? 1 : 0;
          celebrationParams =
            `xp=${xp}&streak=${newCurrentStreak}` +
            `&streakDelta=${streakDelta}&milestones=${newMilestones.join(',')}` +
            `&completed=${newLessonsCompleted}`;
          return true;
        };

        if (!apply(habitResult)) {
          // Habit write failed — retry once
          const retry = await applyLessonCompletion(
            uid,
            profile,
            xpEarned,
            isNewStreakDayRef.current,
            completionSummary,
          );
          if (!apply(retry)) {
            toast(ERROR_COPY.progress.xpPartial, { duration: 5000 });
          }
        }
      } else {
        toast(ERROR_COPY.progress.completionProfileUnavailable, { id: 'no-profile' });
      }

      track('lesson_complete', {
        lesson_id: lesson.id,
        lesson_number: lesson.number,
        xp_earned: xpEarnedThisLesson,
        duration_sec: Math.round((Date.now() - sessionStartedAtRef.current) / 1000),
      });

      if (finalIsNewStreakDay) {
        track('daily_goal_complete', {
          lesson_id: lesson.id,
          new_streak: finalCurrentStreak,
        });
      }

      for (const milestone of finalNewMilestones) {
        track('streak_milestone_reached', {
          milestone_id: milestone,
          new_streak: finalCurrentStreak,
        });
      }

      // New running XP total → lets the celebration detect a level-up.
      // `profile.xp` already reflects the per-check XP written live during the
      // lesson (applyAttemptOutcome), so the only XP NOT yet in it is the
      // completion bonus added just above. Adding the full `xpEarnedThisLesson`
      // here would double-count the per-check XP and show an inflated level.
      const totalXpAfter = (profile?.xp ?? 0) + LESSON_COMPLETION_BONUS;
      // Engine B payoff (F3b): a Khan-style "what you nailed / worth a review"
      // recap built purely from this session's first-attempt results. Passed via
      // router state (not URL) — on a hard refresh the card is simply omitted.
      const reportCard =
        firstTriesRef.current.length > 0
          ? buildReportCard(lesson.id, firstTriesRef.current)
          : undefined;
      navigate(`/celebration/${lesson.id}?${celebrationParams}&total=${totalXpAfter}`, {
        state: reportCard ? { reportCard } : undefined,
      });
      return;
    }

    // Non-last slot: increment stepsCompleted for concept/wrap advances (B008)
    if (slot.kind !== 'problem' && uid) {
      applySlotAdvance(uid).catch(console.error);
    }

    const nextIndex = viewSlotIndex + 1;
    const advanced = await advanceSlot(uid, lesson.id, nextIndex);
    if (!advanced.ok) {
      toast(ERROR_COPY.progress.saveProgress);
    }

    setCurrentAnswer(null);
    setSubmitting(false);
    setViewSlotIndex(nextIndex);
  }

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------
  // Left = back a slot. Right = advance via the same path the Continue button
  // uses (concept/wrap freely, problem only once correct, review mode freely).
  // Suppressed while typing in inputs, with any modifier held, or with a
  // dialog open, so it never hijacks text entry or modal focus.
  const advanceRef = useRef<() => void>(() => {});
  useEffect(() => {
    advanceRef.current = () => {
      if (isReviewMode) handleContinueReview();
      else handleContinue();
    };
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      if (submitting) return;

      if (e.key === 'ArrowLeft') {
        if (displayIndex > 0) {
          e.preventDefault();
          setViewSlotIndex((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      // Right arrow: only fire when Continue would be available. Problem slots
      // require a correct answer first — except commit-once prediction slots,
      // where a single committed answer (right OR wrong) unlocks Continue.
      // Review mode lets you scroll freely.
      const committedWrong =
        slot.kind === 'problem' && slot.commitOnce === true && slotState.feedbackState === 'wrong';
      const continueVisible =
        slot.kind !== 'problem' || slotState.feedbackState === 'correct' || committedWrong;
      if (isReviewMode || continueVisible) {
        e.preventDefault();
        advanceRef.current();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [displayIndex, isReviewMode, slot.kind, slotState.feedbackState, submitting]);

  // -------------------------------------------------------------------------
  // Derive feedback copy
  // -------------------------------------------------------------------------

  let feedbackCorrectText: string | undefined;
  let feedbackWrongText: string | undefined;
  let explanationText: string | undefined;

  if (slot.kind === 'problem') {
    const variant = slot.variants.find((v) => v.id === pickedVariantId) ?? slot.variants[0];
    feedbackCorrectText = variant.feedbackCorrect;

    if (slotState.feedbackState === 'wrong' && slotState.lastAnswer) {
      const result = checkAnswer(variant, slotState.lastAnswer);
      if (!result.wasCorrect) {
        const key = result.matchedWrongKey;
        let hint: string | undefined;

        switch (variant.interactionKind) {
          case 'tap-outcomes':
            hint = variant.feedbackByWrongValue?.[key];
            break;
          case 'fill-fraction':
            hint = variant.feedbackByWrongAnswer?.[key];
            break;
          case 'tap-event':
            hint = variant.feedbackByWrongOutcome?.[key];
            break;
          case 'grid-event':
            hint = variant.feedbackByCell?.[key];
            break;
          case 'multiple-choice':
            hint = variant.feedbackByOption[key];
            break;
          case 'simulate-proportion':
            hint = variant.feedbackByWrongValue?.[key];
            break;
          case 'scrub-trials':
            hint = variant.feedbackByWrongValue?.[key];
            break;
          case 'fill-text':
            hint = variant.feedbackByWrongAnswer?.[key];
            break;
          case 'monty-hall':
            hint = variant.feedbackByWrongValue?.[key];
            break;
        }

        feedbackWrongText = hint ?? variant.feedbackDefault;
        explanationText = variant.explanation;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Loading state — treat 'empty' the same as 'loading' (B015)
  // -------------------------------------------------------------------------

  if (progressState.status === 'loading' || progressState.status === 'empty') {
    return <LessonLoadingSkeleton />;
  }

  const progress = progressState.status === 'ready' ? progressState.data : null;

  // Spaced-review warm-up gate (spec-spaced-review §6). Only a FRESH start of a
  // not-completed lesson is gated — never a resume, a review, or a replay
  // already in progress. On a fresh start we wait for the review status to
  // resolve so the lesson never flashes before redirecting; any error path
  // resolves to `due: []`, so the gate fails open and the lesson just opens.
  const isFreshStart =
    !isReview && progress?.state !== 'completed' && (progress?.slotIndex ?? 0) === 0;
  if (isFreshStart && dueReviews.status === 'loading') {
    return <LessonLoadingSkeleton />;
  }
  if (
    isFreshStart &&
    dueReviews.status === 'ready' &&
    !dueReviews.satisfiedToday &&
    dueReviews.due.length > 0
  ) {
    return (
      <Navigate
        to={`/warmup?next=${encodeURIComponent('/lesson/' + lesson.id)}`}
        replace
      />
    );
  }

  const streak = profile?.currentStreak ?? 0;
  const currentXp = profile?.xp ?? 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    // Lessons sit on a fresh-paper white surface (`bg-card` = #FFFFFF) instead
    // of the app-wide warm-paper background — the paper-grain noise + cream
    // tint is great for Home/Profile/Schedule chrome but reads as a yellow
    // wash inside a lesson where the learner is doing close reading.
    <div className="flex flex-col h-screen overflow-hidden bg-card">
      <LessonHeader
        slotIndex={displayIndex}
        totalSlots={slots.length}
        currentStreak={streak}
        currentXp={currentXp}
        canGoBack={displayIndex > 0}
        onBack={() => setViewSlotIndex((prev) => Math.max(0, prev - 1))}
        canGoForward={isReviewMode && displayIndex < slots.length - 1}
        onForward={() =>
          setViewSlotIndex((prev) => Math.min(isReview ? slots.length - 1 : slotIndex, prev + 1))
        }
      />

      {/* Review banner — keeps the read-only nature visible while the regular
          LessonFooter handles Check/Continue. */}
      {isReviewMode && <ReviewBanner />}

      {/* Captain Pascal cameo — a short briefing on the lesson's first beat */}
      {displayIndex === 0 && !isReviewMode && (
        <div className="border-b bg-[color:var(--primary-soft)]/50 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <CaptainPascal
              context="lessonIntro"
              name={profile?.displayUsername}
              title={lesson.title}
              compact
            />
          </div>
        </div>
      )}

      {/* Slot body */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full h-full">
          <AnimatePresence mode="wait" custom={slotDirection}>
            <motion.div
              key={slot.id}
              custom={slotDirection}
              variants={SLOT_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={MOTION.slide}
              className="h-full"
            >
              {slot.kind === 'concept' && <ConceptSlotView slot={slot} />}
              {slot.kind === 'wrap' && <WrapSlotView slot={slot} />}
              {slot.kind === 'problem' && progress && (
                <ProblemSlotView
                  slot={slot}
                  progress={progress}
                  uid={uid}
                  lessonId={lesson.id}
                  feedbackState={slotState.feedbackState}
                  attemptNumber={slotState.attemptNumber}
                  wrongTick={slotState.wrongTick}
                  onChange={setCurrentAnswer}
                  onVariantPicked={handleVariantPicked}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <LessonFooter
        slotKind={slot.kind}
        feedbackState={slotState.feedbackState}
        wrongTick={slotState.wrongTick}
        feedbackCorrectText={feedbackCorrectText}
        feedbackWrongText={feedbackWrongText}
        explanationText={explanationText}
        explanationRevealed={slotState.explanationRevealed}
        isReady={currentAnswer !== null}
        isSubmitting={submitting}
        allowContinueOnWrong={slot.kind === 'problem' && slot.commitOnce === true}
        onCheck={isReviewMode ? handleCheckReview : handleCheck}
        onContinue={isReviewMode ? handleContinueReview : handleContinue}
      />
    </div>
  );
}
