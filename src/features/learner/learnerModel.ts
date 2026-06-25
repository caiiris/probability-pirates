/**
 * WP-5 — Learner model: pure math (no Firebase, no React).
 *
 * TWO ENGINES:
 *   Engine A — applyPracticeAttempt: moves Elo rating. Fed by practice only.
 *   Engine B — applyLessonExposure:  tracks exposure/struggle. NEVER moves Elo.
 */

import type { SkillId } from '@/content/skills';
import type { MisconceptionKey } from '@/content/misconceptions';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_RATING = 1000;
export const ELO_K = 24;
export const ACC_ALPHA = 0.2;

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Types (C7) ───────────────────────────────────────────────────────────────

/** Engine A — per-skill mastery, from PRACTICE only. */
export type SkillStat = {
  rating: number;
  attempts: number;
  correct: number;
  /** [0,1] recency-weighted accuracy; bootstrapped at 0.5. */
  recentCorrect: number;
  lastSeenAt: number;
  firstSeenAt: number;
};

/** Engine B — per-skill exposure, from LESSONS only. */
export type ExposureStat = {
  introducedAt: number;
  lessonFirstTries: number;
  lessonFirstTryStruggles: number;
  lastSeenAt: number;
};

export type LearnerModel = {
  /** Engine A (practice — owns mastery). */
  skills: Partial<Record<SkillId, SkillStat>>;
  /** Engine B (lessons — owns exposure). */
  exposure: Partial<Record<SkillId, ExposureStat>>;
  /** Bumped by either engine. */
  misconceptions: Partial<Record<MisconceptionKey, { count: number; lastSeenAt: number }>>;
  /** Top 3 Engine-A practiced skills by lowest rating. Never includes lesson-only skills. */
  weakestSkills: SkillId[];
  /** Top 3 Engine-A practiced skills by highest rating. Never includes lesson-only skills. */
  strongestSkills: SkillId[];
  updatedAt: number;
};

// ─── C7b types ────────────────────────────────────────────────────────────────

export type SlotFirstTry = {
  slotId: string;
  skills: SkillId[];
  firstTryCorrect: boolean;
  misconceptionKey?: MisconceptionKey;
};

export type LessonReportCard = {
  lessonId: string;
  /** Skills whose every slot was first-try-correct. */
  nailed: SkillId[];
  /** Skills with >= 1 first-try miss. */
  review: SkillId[];
  /** Distinct misconception keys observed in the lesson. */
  misconceptions: MisconceptionKey[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recompute top-3 weakest/strongest over Engine-A `skills` only. */
function computeTopSkills(skills: Partial<Record<SkillId, SkillStat>>): {
  weakestSkills: SkillId[];
  strongestSkills: SkillId[];
} {
  const entries = Object.entries(skills) as [SkillId, SkillStat][];

  // Sort ascending by rating, tie-break by attempts desc → weakest first.
  const asc = [...entries].sort((a, b) => {
    const diff = a[1].rating - b[1].rating;
    return diff !== 0 ? diff : b[1].attempts - a[1].attempts;
  });

  // Sort descending by rating, tie-break by attempts desc → strongest first.
  const desc = [...entries].sort((a, b) => {
    const diff = b[1].rating - a[1].rating;
    return diff !== 0 ? diff : b[1].attempts - a[1].attempts;
  });

  return {
    weakestSkills: asc.slice(0, 3).map(([id]) => id),
    strongestSkills: desc.slice(0, 3).map(([id]) => id),
  };
}

/** Bump a misconception counter. */
function bumpMisconception(
  misconceptions: Partial<Record<MisconceptionKey, { count: number; lastSeenAt: number }>>,
  key: MisconceptionKey,
  now: number,
): Partial<Record<MisconceptionKey, { count: number; lastSeenAt: number }>> {
  const existing = misconceptions[key];
  return {
    ...misconceptions,
    [key]: { count: (existing?.count ?? 0) + 1, lastSeenAt: now },
  };
}

// ─── emptyModel ───────────────────────────────────────────────────────────────

export function emptyModel(now: number): LearnerModel {
  return {
    skills: {},
    exposure: {},
    misconceptions: {},
    weakestSkills: [],
    strongestSkills: [],
    updatedAt: now,
  };
}

// ─── Engine A: applyPracticeAttempt ──────────────────────────────────────────

/**
 * Engine A — apply one PRACTICE attempt.
 * Moves the Elo rating for each tagged skill. Pure; deterministic given `now`.
 */
export function applyPracticeAttempt(
  model: LearnerModel,
  input: {
    skills: SkillId[];
    wasCorrect: boolean;
    difficulty?: number;
    misconceptionKey?: MisconceptionKey | null;
    now: number;
  },
): LearnerModel {
  const { skills: skillIds, wasCorrect, difficulty = DEFAULT_RATING, misconceptionKey, now } = input;
  const actual = wasCorrect ? 1 : 0;

  const newSkills = { ...model.skills };

  for (const skillId of skillIds) {
    const existing = newSkills[skillId];

    // Read old lastSeenAt BEFORE bootstrapping — if missing, no retrieval gap.
    const oldLastSeenAt = existing?.lastSeenAt;
    const daysSinceLastSeen = oldLastSeenAt !== undefined ? (now - oldLastSeenAt) / DAY_MS : 0;

    const stat: SkillStat = existing ?? {
      rating: DEFAULT_RATING,
      attempts: 0,
      correct: 0,
      recentCorrect: 0.5,
      firstSeenAt: now,
      lastSeenAt: now,
    };

    // Delayed-retrieval bonus: only on correct answers (correct after a gap = stronger signal).
    const bonus = wasCorrect ? Math.min(1 + daysSinceLastSeen / 10, 1.5) : 1;
    const expected = 1 / (1 + Math.pow(10, (difficulty - stat.rating) / 400));
    const newRating = stat.rating + ELO_K * bonus * (actual - expected);
    const newRecentCorrect = ACC_ALPHA * actual + (1 - ACC_ALPHA) * stat.recentCorrect;

    newSkills[skillId] = {
      ...stat,
      rating: newRating,
      recentCorrect: newRecentCorrect,
      attempts: stat.attempts + 1,
      correct: stat.correct + actual,
      lastSeenAt: now,
    };
  }

  let newMisconceptions = { ...model.misconceptions };
  if (misconceptionKey) {
    newMisconceptions = bumpMisconception(newMisconceptions, misconceptionKey, now);
  }

  const { weakestSkills, strongestSkills } = computeTopSkills(newSkills);

  return {
    ...model,
    skills: newSkills,
    misconceptions: newMisconceptions,
    weakestSkills,
    strongestSkills,
    updatedAt: now,
  };
}

// ─── Engine B: applyLessonExposure ───────────────────────────────────────────

/**
 * Engine B — apply one LESSON first-attempt outcome.
 * Updates exposure/struggle and misconceptions ONLY.
 * NEVER touches `skills` (Engine A) or moves the Elo rating.
 * NEVER recomputes weakestSkills / strongestSkills (those are Engine A only).
 * Pure; deterministic given `now`.
 */
export function applyLessonExposure(
  model: LearnerModel,
  input: {
    skills: SkillId[];
    firstTryCorrect: boolean;
    misconceptionKey?: MisconceptionKey | null;
    now: number;
  },
): LearnerModel {
  const { skills: skillIds, firstTryCorrect, misconceptionKey, now } = input;

  const newExposure = { ...model.exposure };

  for (const skillId of skillIds) {
    const existing = newExposure[skillId];
    const stat: ExposureStat = existing ?? {
      introducedAt: now,
      lessonFirstTries: 0,
      lessonFirstTryStruggles: 0,
      lastSeenAt: now,
    };

    newExposure[skillId] = {
      ...stat,
      lessonFirstTries: stat.lessonFirstTries + 1,
      lessonFirstTryStruggles: firstTryCorrect
        ? stat.lessonFirstTryStruggles
        : stat.lessonFirstTryStruggles + 1,
      lastSeenAt: now,
    };
  }

  let newMisconceptions = { ...model.misconceptions };
  if (misconceptionKey) {
    newMisconceptions = bumpMisconception(newMisconceptions, misconceptionKey, now);
  }

  // Do NOT touch model.skills, model.weakestSkills, model.strongestSkills.
  return {
    ...model,
    exposure: newExposure,
    misconceptions: newMisconceptions,
    updatedAt: now,
  };
}

// ─── C7b: buildReportCard ─────────────────────────────────────────────────────

/**
 * Pure: fold a lesson's first-try results into a report card.
 * A skill is `nailed` if every slot touching it was first-try-correct;
 * otherwise it goes to `review`. Mutually exclusive.
 */
export function buildReportCard(lessonId: string, results: SlotFirstTry[]): LessonReportCard {
  // Map skillId -> whether it has been missed at least once.
  const skillMissed = new Map<SkillId, boolean>();

  for (const slot of results) {
    for (const skillId of slot.skills) {
      const wasMissed = skillMissed.get(skillId) ?? false;
      skillMissed.set(skillId, wasMissed || !slot.firstTryCorrect);
    }
  }

  const nailed: SkillId[] = [];
  const review: SkillId[] = [];

  for (const [skillId, missed] of skillMissed.entries()) {
    if (missed) {
      review.push(skillId);
    } else {
      nailed.push(skillId);
    }
  }

  // Collect distinct misconception keys in insertion order.
  const seen = new Set<MisconceptionKey>();
  const misconceptions: MisconceptionKey[] = [];
  for (const slot of results) {
    if (slot.misconceptionKey && !seen.has(slot.misconceptionKey)) {
      seen.add(slot.misconceptionKey);
      misconceptions.push(slot.misconceptionKey);
    }
  }

  return { lessonId, nailed, review, misconceptions };
}
