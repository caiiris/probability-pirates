/**
 * Pure date/streak math — no Firebase, no React.
 * Timezone detection: Intl.DateTimeFormat().resolvedOptions().timeZone (per D22).
 */

export function todayLocalDate(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz }); // 'YYYY-MM-DD'
}

/** Returns true if `a` is exactly one calendar day before `b`. Both are 'YYYY-MM-DD'. */
export function isYesterday(a: string | null, b: string): boolean {
  if (!a) return false;
  return daysBetween(a, b) === 1;
}

/**
 * Whole calendar days from `a` to `b` (both 'YYYY-MM-DD'). Returns 0 if `a` is
 * null/empty. Uses noon to dodge DST edges, matching `isYesterday`.
 */
export function daysBetween(a: string | null, b: string): number {
  if (!a) return 0;
  const dateA = new Date(a + 'T12:00:00');
  const dateB = new Date(b + 'T12:00:00');
  const diffMs = dateB.getTime() - dateA.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export type StreakInput = {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  todayLocalDate: string;
  /** Streak Freezes the user owns; each can cover one missed day. Default 0. */
  freezesAvailable?: number;
};

export type StreakOutput = {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  isNewStreakDay: boolean;
  /** Freezes spent to bridge a gap this check (0 unless a lapse was covered). */
  freezesConsumed: number;
};

/**
 * Pure function: given the current streak state and today's date, returns the
 * updated streak state after a correct check.
 *
 * Streak Freeze: if a gap would normally reset the streak, owned freezes are
 * spent — one per missed day — to bridge it so the streak survives and still
 * ticks up for today. If there aren't enough freezes to cover every missed day,
 * none are spent and the streak resets (a freeze shouldn't be wasted on a lapse
 * it can't actually save).
 */
export function nextStreak(input: StreakInput): StreakOutput {
  const {
    currentStreak,
    bestStreak,
    lastActiveDate,
    todayLocalDate: today,
    freezesAvailable = 0,
  } = input;

  if (lastActiveDate === today) {
    // Already counted today — no change
    return {
      currentStreak,
      bestStreak,
      lastActiveDate: today,
      isNewStreakDay: false,
      freezesConsumed: 0,
    };
  }

  const gap = daysBetween(lastActiveDate, today);
  const missedDays = gap - 1; // gap===1 is consecutive (0 missed); <1 is a fresh start

  let next: number;
  let freezesConsumed = 0;
  if (gap === 1) {
    next = currentStreak + 1; // consecutive day
  } else if (missedDays >= 1 && freezesAvailable >= missedDays) {
    next = currentStreak + 1; // freeze(s) bridge the lapse
    freezesConsumed = missedDays;
  } else {
    next = 1; // fresh start or lapse we can't cover
  }

  return {
    currentStreak: next,
    bestStreak: Math.max(bestStreak, next),
    lastActiveDate: today,
    isNewStreakDay: true,
    freezesConsumed,
  };
}
