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
 * Completed vs. total **available** (non-coming-soon) lessons. The total is
 * derived from the actual content — not a hardcoded course size — so the UI
 * never shows an unreachable denominator (e.g. "5 / 6" when only 5 ship).
 * (Supersedes the old fixed COURSE_SIZE=6 from PRD §9.6 AC #2, per owner.)
 */
export function courseProgress(
  lessons: Lesson[],
  progressMap: Map<string, LessonProgress>,
): { completed: number; total: number } {
  const real = lessons.filter((l) => !l.comingSoon);
  const completed = real.filter(
    (l) => progressMap.get(l.id)?.state === 'completed',
  ).length;
  return { completed, total: real.length };
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
