import { useEffect, useRef, useState } from 'react';
import { Check, Map as MapIcon, Snowflake, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAllLessonProgress } from '@/features/progress/useAllLessonProgress';
import { pruneStaleProgress } from '@/features/progress/progressService';
import { useLessons } from '@/features/flags/useLessons';
import { courseProgress, dailyGoalDone, nextRecommendedLesson } from './recommendations';
import { HeroCard } from './HeroCard';
import { CaptainsLog } from '@/features/captain/CaptainsLog';
import { CoursePath } from './CoursePath';
import { ScheduleReminder } from '@/features/schedule/ScheduleReminder';
import { todayLocalDate } from '@/lib/streak';

const GOAL_DONE_DISMISS_KEY = 'home.goalDonePill.dismissedFor';

function readGoalPillDismissed(today: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(GOAL_DONE_DISMISS_KEY) === today;
  } catch {
    return false;
  }
}

export function HomePage() {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : '';
  const profile = auth.status === 'authenticated' ? auth.profile : null;
  const progressState = useAllLessonProgress(uid);
  const lessons = useLessons();

  // Prune stale progress for lessons that are blank stubs in the current
  // catalog (D91). This handles the case where a lesson was authored on a
  // branch, completed by the user, and then re-locked when the catalog
  // shifted — leaving a Firestore progress doc that no longer corresponds
  // to playable content. The visual guard in LessonNode handles the render
  // side; this cleans up the data behind it. Best-effort, idempotent.
  // Pruned ids are tracked in a ref so we never re-fire on a snapshot
  // re-emit (the Firestore deletion will trigger an updated snapshot, which
  // would otherwise re-run the effect with a now-empty stale set).
  //
  // ⚠️ This hook MUST stay above the early return below — moving it after
  // the conditional return would break React's Rules of Hooks (the hook
  // count would change between renders).
  const prunedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!uid) return;
    if (progressState.status !== 'ready') return;
    const staleIds = lessons
      .filter((l) => l.slots.length === 0 && progressState.data.has(l.id))
      .map((l) => l.id)
      .filter((id) => !prunedRef.current.has(id));
    if (staleIds.length === 0) return;
    staleIds.forEach((id) => prunedRef.current.add(id));
    pruneStaleProgress(uid, staleIds);
  }, [uid, progressState, lessons]);

  if (auth.status === 'loading' || progressState.status === 'loading') {
    return <HomePageSkeleton />;
  }

  const progressMap = progressState.status === 'ready' ? progressState.data : new Map();

  const { completed, total } = courseProgress(lessons, progressMap);
  const freezes = profile?.streakFreezes ?? 0;
  const today = todayLocalDate();
  const goalDone = dailyGoalDone(progressMap, today);

  const recommendation = nextRecommendedLesson(lessons, progressMap);
  const isNewUser = progressMap.size === 0 && (profile?.stepsCompleted ?? 0) === 0;

  // Course-complete celebration only fires when the *whole* planned course is
  // done — not when the single currently-authored lesson is finished and the
  // rest of the path is still locked roadmap previews.
  const allCompleted =
    lessons.length > 0 && lessons.every((l) => progressMap.get(l.id)?.state === 'completed');

  return (
    <div
      // Page-wide ocean gradient — same stops as the OceanScene card around
      // the course path, so the page and the path read as one continuous sea
      // instead of "card sitting on a paler page." The OceanScene's identical
      // gradient compresses to its smaller card height (top→middle band),
      // while the page version stretches across the whole scroll area.
      className="min-h-full"
      style={{
        background:
          'linear-gradient(180deg, #EAF5FF 0%, #CCE6FB 30%, #9DCDF0 65%, #74B5E0 100%)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Today's unfinished schedule items — pops at most once per day */}
        {uid ? <ScheduleReminder uid={uid} /> : null}

        {/* "Done today" is now a one-time-per-day dismissable popup that ONLY
            appears when the daily goal is met. The old always-on "Today's goal"
            label was filler when undone (the path's current node already calls
            the learner to action), and the "Done today" pill that stayed forever
            once met was a permanent victory lap. Show, celebrate, dismiss. */}
        <GoalDonePopup goalDone={goalDone} today={today} freezes={freezes} />

        {/* Hero card — only for states the path can't express on its own: the
            first-time welcome and the all-caught-up message. For the normal
            returning case the path's current node is the single primary focus,
            so we don't stack a second "Up next" CTA on top of it. */}
        {isNewUser || allCompleted ? (
          <HeroCard
            lessons={lessons}
            progressMap={progressMap}
            uid={uid}
            displayUsername={profile?.displayUsername ?? ''}
            isNewUser={isNewUser}
          />
        ) : (
          <CaptainsLog />
        )}

        {/* Course path.
            Header used to be a `Path` h2 + `X / N lessons` stat row at
            max-w-md, which read as a dry dashboard label disconnected from
            the playful islands below. Replaced with a single small "voyage
            progress" chip styled as a translucent map-label that sits over
            the ocean gradient — it shares the same visual world as the path
            instead of floating above it on the plain page bg. The chip is
            decorative-meets-functional: it shows the progress number without
            stacking a second column of headings above each Chapter banner
            (which already does the framing). */}
        <section aria-label="Course path" className="pt-2 space-y-3">
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/65 px-3.5 py-1.5 text-xs font-semibold text-foreground/85 shadow-soft backdrop-blur-sm"
              aria-label={`${completed} of ${total} lessons complete`}
            >
              <MapIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="num text-foreground">{completed}</span>
              <span className="text-muted-foreground">of</span>
              <span className="num text-foreground">{total}</span>
              <span className="text-muted-foreground">islands explored</span>
            </div>
          </div>
          <CoursePath
            lessons={lessons}
            progressMap={progressMap}
            currentLessonId={recommendation?.id ?? null}
            uid={uid}
            claimedChests={profile?.claimedChests ?? []}
          />
        </section>
      </div>
    </div>
  );
}

/**
 * Celebratory pill that appears only when the daily goal is met (one lesson
 * complete today) AND the learner hasn't already dismissed it today. Stores
 * dismissal in localStorage keyed by today's local date, so closing it hides
 * it for the rest of the day but tomorrow's accomplishment shows fresh.
 *
 * Streak Freeze chip rides along (still always-on when freezes are owned)
 * because it's a status indicator, not a celebration.
 */
function GoalDonePopup({
  goalDone,
  today,
  freezes,
}: {
  goalDone: boolean;
  today: string;
  freezes: number;
}) {
  const [dismissed, setDismissed] = useState<boolean>(() => readGoalPillDismissed(today));

  if (!goalDone && freezes === 0) return null;

  function handleDismiss() {
    try {
      window.localStorage.setItem(GOAL_DONE_DISMISS_KEY, today);
    } catch {
      // Private mode: in-memory dismiss still hides it for the session.
    }
    setDismissed(true);
  }

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {goalDone && !dismissed && (
        <span
          className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium border bg-[color:var(--green-soft)] text-[color:var(--green-deep)] border-transparent"
          aria-label="Daily goal complete"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />
          Done today
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss daily goal pill"
            className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-[color:var(--green-deep)]/60 transition-colors hover:bg-[color:var(--green-deep)]/10 hover:text-[color:var(--green-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      )}
      {freezes > 0 ? (
        <span
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-[color:var(--blue-soft)] text-[color:var(--blue-deep)] shadow-soft"
          aria-label={`${freezes} streak freeze${freezes === 1 ? '' : 's'} ready`}
          title="Streak Freeze ready — protects your streak on a missed day"
        >
          <Snowflake className="w-4 h-4" aria-hidden="true" />
          {freezes > 1 ? <span className="text-xs font-bold leading-none">{freezes}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Tuned to match the loaded HomePage layout: ocean-gradient background, an
 * optional hero/Captain's Log card, the centered voyage-progress chip, and
 * the weaving course path. Previously this skeleton used two pill chips at
 * the top that no longer correspond to anything on the live page (was the
 * old "Today's goal" / "Done today" pills) — kept the path skeleton intact.
 */
function HomePageSkeleton() {
  return (
    <div
      className="min-h-full"
      style={{
        background:
          'linear-gradient(180deg, #EAF5FF 0%, #CCE6FB 30%, #9DCDF0 65%, #74B5E0 100%)',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero / Captain's Log placeholder */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Voyage progress chip */}
        <div className="flex justify-center">
          <Skeleton className="h-7 w-56 rounded-full" />
        </div>

        {/* Path nodes — same weaving fractions as the real CoursePath */}
        <div className="mx-auto max-w-md flex flex-col gap-10 pt-2">
          {[0.5, 0.74, 0.5, 0.26, 0.5, 0.74].map((f, i) => (
            <div key={i} className="w-full">
              <div
                className="-translate-x-1/2 flex flex-col items-center gap-2"
                style={{ marginInlineStart: `${f * 100}%`, width: 140 }}
              >
                <Skeleton className="w-[68px] h-[68px] rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
