import type { StudyEvent } from './scheduleService';

/**
 * Pure logic for the home-screen "you have something today" reminder.
 *
 * Kept free of React/Firebase so the decisions (what counts as pending, has it
 * been dismissed today) are unit-testable. The popup only ever concerns *today*:
 * once the day passes, today's events no longer match and the reminder is gone —
 * we never nag about yesterday.
 */

const DISMISS_KEY_PREFIX = 'pp:scheduleReminderDismissed:';

/** Local-time YYYY-MM-DD for `d` (defaults to now). Matches StudyEvent.date. */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Today's unfinished events, sorted with timed events first (by time) then
 * untimed ones. Anything not dated exactly `today`, or already completed, is
 * excluded.
 */
export function pendingToday(events: StudyEvent[], today: string): StudyEvent[] {
  return events
    .filter((e) => e.date === today && !e.completed)
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
}

function dismissKey(uid: string): string {
  return `${DISMISS_KEY_PREFIX}${uid}`;
}

/** True if the reminder was already dismissed for `today` (read from storage). */
export function wasDismissedToday(uid: string, today: string): boolean {
  if (!uid) return false;
  try {
    return localStorage.getItem(dismissKey(uid)) === today;
  } catch {
    return false;
  }
}

/** Record that the reminder has been handled for `today` so it won't re-pop. */
export function markDismissedToday(uid: string, today: string): void {
  if (!uid) return;
  try {
    localStorage.setItem(dismissKey(uid), today);
  } catch {
    // storage unavailable (private mode, etc.) — reminder simply re-shows; fine.
  }
}
