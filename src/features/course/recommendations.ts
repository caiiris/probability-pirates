import type { Lesson } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';

/**
 * Returns the lesson the learner should work on next, or null if all real
 * lessons are completed.
 * Priority: in_progress > next not_started > null.
 */
export function nextRecommendedLesson(
  lessons: Lesson[],
  progressMap: Map<string, LessonProgress>,
): Lesson | null {
  const real = lessons.filter((l) => !l.comingSoon);

  // Prefer the in-progress one (most recently updated if multiple)
  const inProgress = real.filter(
    (l) => progressMap.get(l.id)?.state === 'in_progress',
  );
  if (inProgress.length > 0) {
    return inProgress.sort((a, b) => {
      const ua = progressMap.get(a.id)?.updatedAt?.seconds ?? 0;
      const ub = progressMap.get(b.id)?.updatedAt?.seconds ?? 0;
      return ub - ua;
    })[0];
  }

  // First not-started real lesson
  const notStarted = real.find((l) => !progressMap.has(l.id));
  return notStarted ?? null;
}

/**
 * Completed vs. total **planned** lessons in the course (live + locked roadmap
 * stubs). The denominator reflects the entire planned curriculum so the count
 * encodes scope alongside progress — e.g. with 1 authored lesson and ~40 locked
 * stubs visible on the path, "1 / 42 lessons" is the truthful read instead of
 * the misleading "1 / 1 done" we used to show.
 *
 * Reverses the older "available-only" denominator (the old comment cited PRD
 * §9.6 AC #2 / former `COURSE_SIZE=6`). That rationale assumed the unavailable
 * lessons were a one-off fluke. Today most of the path is *intentionally*
 * locked roadmap previews (D86 / D88), and the locked nodes are visible on the
 * path itself — so a denominator that includes them is consistent with what
 * the user can actually see, not a misleading claim of finality. Decision: D91.
 *
 * `completed` only counts lessons that are actually completed and not blank
 * stubs (a stale progress doc on a now-locked lesson contributes nothing).
 */
export function courseProgress(
  lessons: Lesson[],
  progressMap: Map<string, LessonProgress>,
): { completed: number; total: number } {
  const completed = lessons.filter(
    (l) => l.slots.length > 0 && progressMap.get(l.id)?.state === 'completed',
  ).length;
  return { completed, total: lessons.length };
}

/**
 * True if any lesson has been completed today (local tz).
 */
export function dailyGoalDone(
  progressMap: Map<string, LessonProgress>,
  today: string,
): boolean {
  for (const prog of progressMap.values()) {
    if (prog.completedAt) {
      const completedDate = new Date(prog.completedAt.seconds * 1000)
        .toLocaleDateString('en-CA', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      if (completedDate === today) return true;
    }
  }
  return false;
}
