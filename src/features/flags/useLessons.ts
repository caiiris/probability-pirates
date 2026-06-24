import { useMemo } from 'react';
import { lessons as rawLessons } from '@/content/index';
import type { Lesson } from '@/content/types';
import { useRemoteFlags } from './RemoteFlagsProvider';

/**
 * Returns the lesson catalog with `comingSoon` adjusted by Remote Config.
 *
 * Rules:
 *   - If a lesson has no slots (empty content), it is ALWAYS `comingSoon`.
 *     Remote Config cannot flip an empty lesson on; this is a safety net.
 *   - Otherwise, the lesson is `comingSoon` iff its id is NOT in the
 *     Remote Config `available_lesson_ids` list. The list defaults to
 *     ["how-likely"] until the first fetch resolves, matching the bundled
 *     state (D88). This means flipping a lesson on (or rolling it back)
 *     requires no redeploy, just a Remote Config update.
 */
export function useLessons(): Lesson[] {
  const { availableLessonIds } = useRemoteFlags();

  return useMemo(
    () =>
      rawLessons.map((lesson) => {
        const hasContent = lesson.slots.length > 0;
        const enabledByFlag = availableLessonIds.has(lesson.id);
        const comingSoon = !hasContent || !enabledByFlag;
        return comingSoon === !!lesson.comingSoon ? lesson : { ...lesson, comingSoon };
      }),
    [availableLessonIds],
  );
}

/** Same as useLessons, but as a Map for fast lookups by id. */
export function useLessonById(): Map<string, Lesson> {
  const lessons = useLessons();
  return useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);
}
