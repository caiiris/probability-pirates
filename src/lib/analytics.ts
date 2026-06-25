/**
 * Pascal Analytics — a typed wrapper around firebase/analytics.
 *
 * Design notes:
 *   - All call sites are fire-and-forget. We never block the UI on a log
 *     event, and we never throw — analytics is observability, not a feature.
 *   - The full event catalog lives here so anyone adding an event sees the
 *     existing shape and doesn't drift schema. New event? Add it to
 *     `PascalEvent` below.
 *   - Snake_case names + snake_case params match the Google Analytics 4
 *     convention so the events render nicely in the GA dashboard.
 *
 * Standard GA4 events we reuse:
 *   - `login`   — user signs in (any provider)
 *   - `sign_up` — user creates a new account
 *
 * Custom Pascal events:
 *   - `lesson_start`             — learner opens a lesson (resume OR new attempt)
 *   - `attempt_checked`          — learner taps Check on a problem slot
 *   - `attempt_hinted`           — the `variant.explanation` hint just surfaced
 *                                  (D55 progressive hint, triggered by 2nd wrong attempt)
 *   - `lesson_complete`          — learner finishes the final slot of a lesson
 *   - `daily_goal_complete`      — first lesson finished today; streak ticked up
 *   - `streak_milestone_reached` — newly earned milestone (one event per milestone)
 *   - `study_event_added`        — learner saves a new entry in the schedule
 *                                  (test / homework / study session / other)
 */

import { getAnalyticsSafe } from './firebase';

// `firebase/analytics` is intentionally NOT imported statically — that would
// drag the whole Analytics SDK into the first-load bundle and defeat the lazy
// loading in `getAnalyticsSafe`. `logEvent` is pulled from the dynamic import
// inside `track` instead (it resolves from the module cache that
// `getAnalyticsSafe` already populated, so there is no second network fetch).

type PascalEventMap = {
  login: { method: 'email_password' | 'google' };
  sign_up: { method: 'email_password' | 'google' };

  lesson_start: {
    lesson_id: string;
    lesson_number: number;
    /** 'new' if this is a first attempt, 'resume' if the learner is
     *  continuing from a saved slotIndex. */
    mode: 'new' | 'resume';
  };

  attempt_checked: {
    lesson_id: string;
    slot_id: string;
    variant_id: string;
    /** 1-indexed per-slot, capped at 10 by Firestore rules. */
    attempt_number: number;
    was_correct: boolean;
    xp_awarded: number;
  };

  attempt_hinted: {
    lesson_id: string;
    slot_id: string;
    variant_id: string;
    /** The wrong-attempt number that triggered the hint (always 2 today,
     *  reserved for future tuning of the threshold). */
    attempt_number: number;
  };

  lesson_complete: {
    lesson_id: string;
    lesson_number: number;
    /** Total XP earned this session (slot rewards + completion bonus). */
    xp_earned: number;
    /** Wall-clock seconds between lesson_start and lesson_complete in this
     *  React session. Resets on reload — best-effort, not auth-tracked. */
    duration_sec: number;
  };

  daily_goal_complete: {
    lesson_id: string;
    /** New streak length after this completion (e.g. 1 = first day ever,
     *  3 = three-day streak). Pairs with streak_milestone_reached when the
     *  new streak crosses a milestone threshold. */
    new_streak: number;
  };

  streak_milestone_reached: {
    /** Stable string id from src/lib/milestones.ts (e.g. 'streak-3'). */
    milestone_id: string;
    /** Current streak when the milestone was awarded. */
    new_streak: number;
  };

  // --- Schedule ---
  study_event_added: {
    event_type: 'study' | 'test' | 'homework' | 'other';
    /** Whether the user linked the event to a specific lesson. */
    has_lesson: boolean;
    /** Whether the user set a clock time (vs all-day). */
    has_time: boolean;
    /** Days from today to the event date. Negative = past, 0 = today. */
    days_out: number;
  };

  // --- Social (spec-social) ---
  follow_user: { target_uid: string };
  unfollow_user: { target_uid: string };
  /** Fired when a username search returns; `result_count` aids relevance tuning. */
  user_search: { query_length: number; result_count: number };
  kudos_sent: { target_uid: string };
  /** A non-streak achievement was newly earned (src/lib/achievements.ts id). */
  achievement_earned: { achievement_id: string };
  leaderboard_view: { friend_count: number };

  /** The home-screen reminder popped with one or more unfinished events today. */
  schedule_reminder_shown: { pending_count: number };

  // --- Economy (coins) ---
  /** A checkpoint chest was opened. `reward` is 0 if it was already claimed. */
  chest_opened: { chest_id: string; reward: number };
  store_view: Record<string, never>;
};

export type PascalEvent = keyof PascalEventMap;

export function track<E extends PascalEvent>(event: E, params: PascalEventMap[E]): void {
  void getAnalyticsSafe()
    .then(async (analytics) => {
      if (!analytics) return;
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, event as never, params as never);
    })
    .catch((err) => {
      console.warn(`[analytics] failed to log ${event}:`, err);
    });
}
