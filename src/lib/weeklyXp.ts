/**
 * Weekly XP bucket keying — pure, no Firebase, no React.
 *
 * The friends leaderboard ranks by XP earned *this week*, then resets. Weekly
 * resets give the "fresh-start effect": learners who fell behind get a clean
 * slate each week, which keeps more of them engaged than an all-time ranking
 * (Social Comparison Theory; cf. Duolingo-style leagues).
 *
 * We key buckets by ISO-8601 week (Monday-based, e.g. "2026-W26"). A stored
 * `weekKey` that does not match `currentWeekKey()` means the bucket is stale and
 * the `weeklyXp` value should be treated as 0 by readers.
 */

/** ISO-8601 week key for a date, e.g. "2026-W26". Uses the date's local Y/M/D. */
export function currentWeekKey(date: Date = new Date()): string {
  // Normalize to a UTC midnight built from the LOCAL calendar date so the
  // result tracks the user's local week regardless of runtime timezone.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO weekday: Mon=0 .. Sun=6. Shift to the Thursday of this week, which by
  // definition belongs to the ISO week-numbering year.
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const isoYear = d.getUTCFullYear();
  // Thursday of ISO week 1 is the one in the week containing Jan 4th.
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** True if a stored bucket key is the current week (i.e. its XP still counts). */
export function isCurrentWeek(weekKey: string | null | undefined, now: Date = new Date()): boolean {
  return !!weekKey && weekKey === currentWeekKey(now);
}

/**
 * The effective weekly XP for display/ranking: the stored value if the bucket is
 * for the current week, otherwise 0 (a stale bucket from a previous week).
 */
export function effectiveWeeklyXp(
  weeklyXp: number | undefined,
  weekKey: string | null | undefined,
  now: Date = new Date(),
): number {
  return isCurrentWeek(weekKey, now) ? (weeklyXp ?? 0) : 0;
}
