/**
 * WP-5 — Learner model: pure math (no Firebase, no React).
 *
 * TWO ENGINES:
 *   Engine A — applyPracticeAttempt: moves Elo rating. Fed by practice only.
 *   Engine B — applyLessonExposure:  tracks exposure/struggle. NEVER moves Elo.
 */

import { MISCONCEPTIONS } from '@/content/misconceptions';
import type { SkillId } from '@/content/skills';
import type { MisconceptionKey } from '@/content/misconceptions';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_RATING = 1000;
export const ELO_K = 24;
export const ACC_ALPHA = 0.2;

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── C-MC3 — Misconception confidence model ───────────────────────────────────

export type MisconceptionSource = 'trap' | 'chip' | 'llm';

/**
 * Source weights for a single misconception observation, by signal reliability.
 *
 * Tuning rationale — slip vs. systematic error (see spec-misconception-capture
 * §10 D-MC5/D-MC6): a SINGLE observation of ANY kind must not assert a
 * misconception. A wrong answer can be a careless *slip* (Norman, 1981) rather
 * than a stable faulty rule, so even the strongest single signal — a
 * deterministic code-`trap` match — contributes 0.7 < SURFACE_THRESHOLD (1.0).
 * Surfacing therefore requires REPETITION (≥2 trap hits = 1.4) or CORROBORATION
 * (trap + recognition `chip` = 1.3; chip + chip = 1.2; …). A misconception is by
 * definition systematic; a one-off is treated as a slip and stays latent.
 */
export const SOURCE_WEIGHT: Record<MisconceptionSource, number> = {
  trap: 0.7,
  chip: 0.6,
  llm: 0.5,
};

/** A misconception surfaces once its accumulated score reaches this bar. */
export const SURFACE_THRESHOLD = 1.0;

/**
 * Mastery-aware slip guard. When the learner is ALREADY strong on the skill a
 * problem exercises, a wrong answer landing on the trap is far more likely a
 * slip than a stable bug, so the `trap` weight is multiplied by this discount
 * (0.7 → 0.35) at RECORD time.
 *
 * Why record-time, not surface-time: mastery is read from the model BEFORE this
 * attempt's update. Judging it at surface time would be self-defeating — the
 * recency-weighted accuracy (`recentCorrect`) is dragged down by the very miss
 * we are evaluating, so a previously-strong learner would no longer read as
 * strong exactly when the guard should fire.
 */
export const SLIP_DISCOUNT = 0.5;
/** recentCorrect at/above which a practiced skill counts as "strong". */
export const MASTERY_STRONG_ACC = 0.8;
/** Minimum practice attempts before the mastery signal is trusted. */
export const MASTERY_MIN_ATTEMPTS = 3;

/**
 * Per-key misconception record. `score` is optional to support back-compat:
 * persisted Firestore docs written before C-MC3 will lack `score`.
 * The normalizer reads `score ?? count * SOURCE_WEIGHT.trap` wherever the
 * computed score is needed.
 */
export type MisconceptionStat = {
  count: number;
  /** Weighted accumulator (Σ source weights). Optional for back-compat. */
  score?: number;
  lastSeenAt: number;
};

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
  misconceptions: Partial<Record<MisconceptionKey, MisconceptionStat>>;
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

/**
 * Bump a misconception counter, accumulating a weighted score.
 * Back-compat: if the existing record has no `score`, seeds it from
 * `count * SOURCE_WEIGHT.trap` before adding the new weight.
 */
/**
 * True if the learner is already "strong" on ANY of the given skills, judged
 * from the model BEFORE the current attempt is applied (slip guard). A wrong
 * answer on a skill the learner reliably gets right is treated as a likely slip.
 */
function isStrongBefore(model: LearnerModel, skillIds: SkillId[]): boolean {
  return skillIds.some((s) => {
    const stat = model.skills[s];
    return (
      stat !== undefined &&
      stat.attempts >= MASTERY_MIN_ATTEMPTS &&
      stat.recentCorrect >= MASTERY_STRONG_ACC
    );
  });
}

function bumpMisconception(
  misconceptions: Partial<Record<MisconceptionKey, MisconceptionStat>>,
  key: MisconceptionKey,
  now: number,
  weight: number,
): Partial<Record<MisconceptionKey, MisconceptionStat>> {
  const existing = misconceptions[key];
  const priorScore = existing?.score ?? ((existing?.count ?? 0) * SOURCE_WEIGHT.trap);
  return {
    ...misconceptions,
    [key]: {
      count: (existing?.count ?? 0) + 1,
      score: priorScore + weight,
      lastSeenAt: now,
    },
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
 *
 * Accepts either the new `misconceptionSignal` field (C-MC3) or the legacy
 * `misconceptionKey` field (back-compat, treated as source `'trap'`). When
 * both are supplied, `misconceptionSignal` takes precedence.
 */
export function applyPracticeAttempt(
  model: LearnerModel,
  input: {
    skills: SkillId[];
    wasCorrect: boolean;
    difficulty?: number;
    /** Legacy back-compat field — treated as source 'trap'. */
    misconceptionKey?: MisconceptionKey | null;
    /** Preferred C-MC3 field. If present, overrides misconceptionKey. */
    misconceptionSignal?: { key: MisconceptionKey; source: MisconceptionSource } | null;
    now: number;
  },
): LearnerModel {
  const {
    skills: skillIds,
    wasCorrect,
    difficulty = DEFAULT_RATING,
    misconceptionKey,
    misconceptionSignal,
    now,
  } = input;
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

  // Resolve the effective signal: misconceptionSignal takes precedence over
  // the legacy misconceptionKey (back-compat).
  const effectiveSignal: { key: MisconceptionKey; source: MisconceptionSource } | null =
    misconceptionSignal ??
    (misconceptionKey ? { key: misconceptionKey, source: 'trap' } : null);

  let newMisconceptions = { ...model.misconceptions };
  if (effectiveSignal) {
    let weight = SOURCE_WEIGHT[effectiveSignal.source];
    // Slip guard: a trap match from a learner already strong on this problem's
    // skill (measured from the pre-attempt model) is more likely a slip than a
    // stable bug, so its weight is discounted.
    if (effectiveSignal.source === 'trap' && isStrongBefore(model, skillIds)) {
      weight *= SLIP_DISCOUNT;
    }
    newMisconceptions = bumpMisconception(newMisconceptions, effectiveSignal.key, now, weight);
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
 *
 * Lesson misconceptions are treated as source 'trap' (weight 1.0) for
 * back-compat with existing behaviour; score is written on every bump.
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
    newMisconceptions = bumpMisconception(
      newMisconceptions,
      misconceptionKey,
      now,
      SOURCE_WEIGHT.trap,
    );
  }

  // Do NOT touch model.skills, model.weakestSkills, model.strongestSkills.
  return {
    ...model,
    exposure: newExposure,
    misconceptions: newMisconceptions,
    updatedAt: now,
  };
}

// ─── C-MC3: surfacedMisconceptions ────────────────────────────────────────────

/**
 * Returns misconception keys whose (normalised) score >= threshold, sorted by
 * score descending then lastSeenAt descending. Only keys that exist in the
 * closed MISCONCEPTIONS taxonomy are included (guards against stale keys in
 * old Firestore docs).
 *
 * Back-compat normalisation: a stored record without `score` is treated as
 * `score = count * SOURCE_WEIGHT.trap`.
 */
export function surfacedMisconceptions(
  model: LearnerModel,
  threshold = SURFACE_THRESHOLD,
): MisconceptionKey[] {
  return (
    Object.entries(model.misconceptions ?? {}) as [MisconceptionKey, MisconceptionStat][]
  )
    .filter(([key]) => key in MISCONCEPTIONS)
    .map(([key, stat]) => ({
      key,
      score: stat.score ?? stat.count * SOURCE_WEIGHT.trap,
      lastSeenAt: stat.lastSeenAt,
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score || b.lastSeenAt - a.lastSeenAt)
    .map(({ key }) => key);
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
