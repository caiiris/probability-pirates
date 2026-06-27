/**
 * Pascal Remote Config flags. Centralized here so that:
 *   - The defaults match what the app ships with on a cold start (no fetch).
 *   - The parameter names live in one place — anyone adding a flag updates
 *     this file and the Remote Config template stays in sync.
 *
 * Param: `available_lesson_ids`
 *   JSON array of lesson IDs that should be playable. A lesson is treated
 *   as "comingSoon" iff its id is NOT in this list, OR its slots array is
 *   empty (safety net, a lesson without content is never playable).
 *
 *   Default: the authored lessons on the live path. `how-likely` is the course
 *   opener (D88); `long-run-frequency` is the long-run / frequentist lesson
 *   (D92); `sample-space` names the toolkit and introduces events as subsets
 *   (D93); `equally-likely-outcomes` stress-tests the k/N formula (D94);
 *   `multiplication-principle` is the first scalable counting tool (D94);
 *   `addition-principle` pairs with multiplication as the OR-rule (D95).
 *   Every other unit lesson is still a blank, locked stub. Flip a lesson on
 *   or off by updating Remote Config (no redeploy required); the empty-slots
 *   safety net in `useLessons` still prevents a contentless lesson from
 *   going live, so only lessons that have authored content can be enabled.
 */

export const REMOTE_CONFIG_DEFAULTS = {
  available_lesson_ids: JSON.stringify([
    'how-likely',
    'long-run-frequency',
    'sample-space',
    'equally-likely-outcomes',
    'multiplication-principle',
    'addition-principle',
  ]),
} as const;

/** How long Remote Config values are cached client-side. Per Firebase docs,
 *  fetches throttle to 5/hour in dev — we use 1 hour in prod (default) and
 *  10s during local dev so iterating on flags is fast. */
export const REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS = import.meta.env.DEV ? 10_000 : 60 * 60 * 1000;

export function parseAvailableLessonIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}
