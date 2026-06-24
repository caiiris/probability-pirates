import { useEffect, useRef } from 'react';
import { Check, Snowflake } from 'lucide-react';
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
  // rest of the path is still locked roadmap previews. Pre-D91 this was
  // `realLessons.every(...)`, which prematurely declared "all caught up"
  // after one lesson on the new path layout.
  const allCompleted =
    lessons.length > 0 && lessons.every((l) => progressMap.get(l.id)?.state === 'completed');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Today's unfinished schedule items — pops at most once per day */}
      {uid ? <ScheduleReminder uid={uid} /> : null}

      {/* Today's nudge — streak / XP / coins now live in the persistent app bar;
          this row carries the home-specific daily-goal cue and any streak freezes.
          The pill states the actual goal when undone (per ui-directive.md:
          empty/idle states tell the user what to do), and reads as a quiet
          confirmation once done. */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
            goalDone
              ? 'bg-[color:var(--green-soft)] text-[color:var(--green-deep)] border-transparent'
              : 'bg-card text-foreground border-border'
          }`}
          aria-label={goalDone ? 'Daily goal complete' : "Today's goal: finish one lesson"}
        >
          {goalDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" /> : null}
          {goalDone ? 'Done today' : 'Finish 1 lesson today'}
        </span>
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

      {/* Course path */}
      <section aria-label="Course path" className="pt-2">
        <div className="mx-auto max-w-md flex items-baseline justify-between mb-6 px-1">
          <h2 className="font-display text-lg font-bold tracking-tight">Path</h2>
          {/* "X / Y lessons" reads as the user's share of the planned course
              (D91). The old "X / Y done" implied finality, which looked odd
              when only one lesson was authored ("1 / 1 done" while the path
              clearly continued below). */}
          <span
            className="text-sm text-muted-foreground"
            aria-label={`${completed} of ${total} lessons complete`}
          >
            <span className="num font-semibold text-foreground">{completed}</span> / {total} lessons
          </span>
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
  );
}

function HomePageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
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
  );
}
