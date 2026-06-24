/**
 * Practice-mode XP policy (pure logic).
 *
 * Practice (`/practice`, the Alcumus-style endless set — spec-practice.md) is a
 * *secondary* signal: it should keep learners progressing on the off-days
 * between lessons without letting a grinder substitute practice for the core
 * path or run away with the leaderboard. So practice XP is:
 *
 *  - **smaller per problem** than a lesson's first-try correct (5 vs 10), and
 *  - **capped per local day** (`PRACTICE_DAILY_XP_CAP`), and
 *  - **feeds total XP (levels) and weekly XP (leaderboard)** — that's the point,
 *    it's how XP gains a payoff between content drops — but
 *  - **does NOT tick the daily streak** and is **not** counted as a completed
 *    lesson. The streak stays tied to the core daily goal (resolves the
 *    spec-practice "XP/streak interaction" open question).
 *
 * This module is deliberately framework-free so the practice solve loop (and its
 * Firestore write) can call it once it's built; it owns no I/O.
 */

/** XP for one correct practice problem (flat — smaller than a lesson first-try). */
export const PRACTICE_XP_PER_CORRECT = 5;

/** Max practice XP that can count toward levels/leaderboard in a single local
 *  day. ~one lesson's worth, i.e. ~20 correct problems — enough to feel like
 *  real progress, bounded so it can't dwarf the path. */
export const PRACTICE_DAILY_XP_CAP = 100;

/** Base XP a correct/incorrect practice answer is *worth* before the daily cap. */
export function practiceXpForResult(wasCorrect: boolean): number {
  return wasCorrect ? PRACTICE_XP_PER_CORRECT : 0;
}

/** Per-day practice-XP accounting, keyed by local date (YYYY-MM-DD). */
export type PracticeXpState = {
  /** Local date the counter applies to. */
  date: string;
  /** Practice XP already counted (toward the cap) on `date`. */
  earnedToday: number;
};

export type PracticeXpGrant = {
  /** XP that actually counts (after the daily cap) — add this to xp/weeklyXp. */
  granted: number;
  /** The state to persist for the user after this grant. */
  state: PracticeXpState;
  /** True when the cap blocked some or all of the award (for UI nudges). */
  capReached: boolean;
};

/**
 * Apply the daily cap to a single practice result.
 *
 * @param prev   the user's last-known practice-XP state (or undefined for a new
 *               user / first practice ever)
 * @param today  the current local date string (YYYY-MM-DD); the caller resolves
 *               the timezone so this stays pure/testable
 * @param wasCorrect whether the answer was correct
 */
export function grantPracticeXp(
  prev: PracticeXpState | undefined,
  today: string,
  wasCorrect: boolean,
  cap: number = PRACTICE_DAILY_XP_CAP,
): PracticeXpGrant {
  // Reset the counter when the day rolls over (or there's no prior state).
  const earnedToday = prev && prev.date === today ? Math.max(0, prev.earnedToday) : 0;

  const award = practiceXpForResult(wasCorrect);
  const room = Math.max(0, cap - earnedToday);
  const granted = Math.min(award, room);

  return {
    granted,
    state: { date: today, earnedToday: earnedToday + granted },
    capReached: granted < award,
  };
}

/** Remaining practice XP that can still count today (for a "cap reached" UI). */
export function practiceXpRemainingToday(
  prev: PracticeXpState | undefined,
  today: string,
  cap: number = PRACTICE_DAILY_XP_CAP,
): number {
  const earnedToday = prev && prev.date === today ? Math.max(0, prev.earnedToday) : 0;
  return Math.max(0, cap - earnedToday);
}
