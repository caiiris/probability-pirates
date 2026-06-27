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

/**
 * Default base XP for one correct practice problem when no difficulty is known.
 * Equals the Medium band so callers that don't pass a difficulty keep the
 * original flat-5 behaviour (and all existing tests stay valid).
 */
export const PRACTICE_XP_PER_CORRECT = 5;

/** Max practice XP that can count toward levels/leaderboard in a single local
 *  day. ~one lesson's worth, i.e. ~20 correct problems — enough to feel like
 *  real progress, bounded so it can't dwarf the path. */
export const PRACTICE_DAILY_XP_CAP = 100;

// ── Difficulty-scaled base (D100) ──────────────────────────────────────────────

/** Coarse difficulty bands, shared with the learner-facing label. */
export type DifficultyBand = 'Easy' | 'Medium' | 'Hard' | 'Extreme';

/**
 * Base XP per difficulty band. Harder problems are worth more so the reward
 * tracks the effort. Capped at the daily ceiling like everything else.
 * (Spec D100; "Extreme" is the expert tier.)
 */
export const PRACTICE_XP_BY_BAND: Record<DifficultyBand, number> = {
  Easy: 3,
  Medium: 5,
  Hard: 8,
  Extreme: 12,
};

/**
 * Map a problem's Elo difficulty (~700–2000) to a band.
 *
 * IMPORTANT: these cutoffs MUST stay in sync with `difficultyLabel()` in
 * src/features/practice/practiceDifficulty.ts so the on-screen badge and the
 * XP award always agree. Duplicated here (rather than imported) to keep this
 * lib module free of any feature-layer dependency.
 */
export function practiceBandForElo(elo: number): DifficultyBand {
  if (elo < 950) return 'Easy';
  if (elo < 1250) return 'Medium';
  if (elo < 1500) return 'Hard';
  return 'Extreme';
}

/** Difficulty-scaled base XP for a problem at the given Elo. */
export function practiceXpBaseForDifficulty(elo: number): number {
  return PRACTICE_XP_BY_BAND[practiceBandForElo(elo)];
}

/**
 * Per-try XP multiplier for the 3-try hint ladder (F2):
 *   try 1 → full, try 2 → half, try 3 → quarter, reveal/4+ → nothing.
 * Solving it yourself sooner is worth more; a reveal earns no XP.
 */
export function practiceTryMultiplier(tryNumber: number): number {
  if (tryNumber <= 1) return 1;
  if (tryNumber === 2) return 0.5;
  if (tryNumber === 3) return 0.25;
  return 0;
}

/** Options that scale a single award: difficulty band base × per-try decay. */
export type PracticeXpOpts = {
  /** Problem Elo difficulty; selects the band base. Omit → Medium base (5). */
  difficulty?: number;
  /** 1-based try the answer was solved on; decays the award. Omit → 1 (full). */
  tryNumber?: number;
  /**
   * Extra multiplier in [0,1] for conceptual problems whose reasoning was
   * flagged (F2). Omit → 1 (no reasoning penalty). Only ever reduces.
   */
  reasoningMultiplier?: number;
};

/**
 * Base XP a correct practice answer is *worth* before the daily cap.
 * With no opts this returns the flat default (5) for back-compat; with a
 * difficulty and/or tryNumber it applies the band base and per-try decay, and
 * an optional reasoning multiplier for conceptual problems.
 */
export function practiceXpForResult(wasCorrect: boolean, opts: PracticeXpOpts = {}): number {
  if (!wasCorrect) return 0;
  const base =
    opts.difficulty === undefined
      ? PRACTICE_XP_PER_CORRECT
      : practiceXpBaseForDifficulty(opts.difficulty);
  const reasoning = Math.min(1, Math.max(0, opts.reasoningMultiplier ?? 1));
  const granted = base * practiceTryMultiplier(opts.tryNumber ?? 1) * reasoning;
  return Math.round(granted);
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
 * @param opts   optional difficulty/tryNumber scaling (D100, F2) and `cap`
 *               override. Omitting opts preserves the original flat-5,
 *               full-credit behaviour.
 */
export function grantPracticeXp(
  prev: PracticeXpState | undefined,
  today: string,
  wasCorrect: boolean,
  opts: PracticeXpOpts & { cap?: number } = {},
): PracticeXpGrant {
  const cap = opts.cap ?? PRACTICE_DAILY_XP_CAP;

  // Reset the counter when the day rolls over (or there's no prior state).
  const earnedToday = prev && prev.date === today ? Math.max(0, prev.earnedToday) : 0;

  const award = practiceXpForResult(wasCorrect, opts);
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
