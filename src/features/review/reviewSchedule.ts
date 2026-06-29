/**
 * Spaced-review scheduler — pure math (no Firebase, no React).
 *
 * Implements the Leitner / expanding-interval schedule from
 * docs/specs/spec-spaced-review.md §4. A skill enters the schedule when a lesson
 * that teaches it is completed; each subsequent review promotes (interval grows)
 * on a correct recall and demotes to the shortest box on a miss — keeping every
 * review at a "desirable difficulty" (just hard to recall).
 */

import type { SkillId } from '@/content/skills';

export type ReviewEntry = {
  /** Leitner box 0..5; higher = longer interval, more durable. */
  box: number;
  /** Epoch ms. The skill is due for review when `dueAt <= now`. */
  dueAt: number;
  lastReviewedAt: number;
  /** Times demoted back to box 0 (diagnostic only). */
  lapses: number;
};

export type ReviewSchedule = {
  entries: Partial<Record<SkillId, ReviewEntry>>;
  /**
   * Local day ('YYYY-MM-DD') the learner last satisfied the warm-up gate, by
   * either completing a warm-up or tapping "Skip today". The gate fires at most
   * once per local day, so this prevents a re-gate loop when more skills are due
   * than a single warm-up serves.
   */
  satisfiedOnDate: string | null;
  updatedAt: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Expanding intervals per Leitner box, in days (~2.2x growth). The first
 * interval (~2 days) targets the steep early forgetting curve; later boxes
 * stretch toward long-term retention. See spec §4.
 */
export const INTERVALS_DAYS = [2, 4, 9, 21, 45, 90] as const;
export const MAX_BOX = INTERVALS_DAYS.length - 1;

export function emptyReviewSchedule(now: number): ReviewSchedule {
  return { entries: {}, satisfiedOnDate: null, updatedAt: now };
}

function clampBox(box: number): number {
  if (box < 0) return 0;
  if (box > MAX_BOX) return MAX_BOX;
  return box;
}

/** Interval in ms for a given box (clamped to the valid range). */
export function intervalMsForBox(box: number): number {
  return INTERVALS_DAYS[clampBox(box)] * DAY_MS;
}

/**
 * Seed the given skills into the schedule if they are not already tracked.
 * Returns a NEW schedule (pure). Existing entries are left untouched — a lesson
 * completion is teaching reinforcement, not a scheduled review, so it must not
 * reset an already-scheduled skill's interval.
 */
export function seedSkills(
  schedule: ReviewSchedule,
  skills: readonly SkillId[],
  now: number,
): ReviewSchedule {
  const entries = { ...schedule.entries };
  let changed = false;
  for (const skill of skills) {
    if (entries[skill]) continue;
    entries[skill] = {
      box: 0,
      dueAt: now + intervalMsForBox(0),
      lastReviewedAt: now,
      lapses: 0,
    };
    changed = true;
  }
  if (!changed) return schedule;
  return { ...schedule, entries, updatedAt: now };
}

/**
 * Apply one review outcome to a single entry. Correct → promote one box and
 * push `dueAt` out by the new (longer) interval. Wrong → demote to box 0 (the
 * shortest interval) and increment `lapses`. Pure.
 */
export function applyReviewResult(
  entry: ReviewEntry,
  correct: boolean,
  now: number,
): ReviewEntry {
  if (correct) {
    const box = clampBox(entry.box + 1);
    return { box, dueAt: now + intervalMsForBox(box), lastReviewedAt: now, lapses: entry.lapses };
  }
  return { box: 0, dueAt: now + intervalMsForBox(0), lastReviewedAt: now, lapses: entry.lapses + 1 };
}

/** Convenience: apply a review result for a skill within a whole schedule. */
export function recordResultInSchedule(
  schedule: ReviewSchedule,
  skill: SkillId,
  correct: boolean,
  now: number,
): ReviewSchedule {
  const entry = schedule.entries[skill];
  if (!entry) return schedule;
  return {
    ...schedule,
    entries: { ...schedule.entries, [skill]: applyReviewResult(entry, correct, now) },
    updatedAt: now,
  };
}

/**
 * Skills that are due for review now (`dueAt <= now`), most-overdue first.
 * `restrictTo`, when given, keeps only skills in that allow-list (e.g. skills
 * whose topic has at least one practice template to generate an item from).
 */
export function dueSkills(
  schedule: ReviewSchedule,
  now: number,
  restrictTo?: ReadonlySet<SkillId>,
): SkillId[] {
  return (Object.keys(schedule.entries) as SkillId[])
    .filter((skill) => {
      const entry = schedule.entries[skill];
      if (!entry) return false;
      if (restrictTo && !restrictTo.has(skill)) return false;
      return entry.dueAt <= now;
    })
    .sort((a, b) => (schedule.entries[a]!.dueAt - schedule.entries[b]!.dueAt));
}

/** Whether the warm-up gate has already been satisfied for `todayLocalDate`. */
export function isSatisfiedToday(schedule: ReviewSchedule, todayLocalDate: string): boolean {
  return schedule.satisfiedOnDate === todayLocalDate;
}

/** Mark the gate satisfied for the given local day (pure). */
export function markSatisfied(schedule: ReviewSchedule, todayLocalDate: string, now: number): ReviewSchedule {
  return { ...schedule, satisfiedOnDate: todayLocalDate, updatedAt: now };
}
