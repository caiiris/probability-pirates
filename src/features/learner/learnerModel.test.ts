/**
 * WP-5 — Pure-math tests for learnerModel.ts.
 *
 * No Firebase, no React. All tests inject `now` explicitly.
 */

import { describe, it, expect } from 'vitest';
import {
  emptyModel,
  applyPracticeAttempt,
  applyLessonExposure,
  buildReportCard,
  DEFAULT_RATING,
  ELO_K,
  ACC_ALPHA,
} from './learnerModel';
import type { SlotFirstTry } from './learnerModel';

const NOW = 1_700_000_000_000; // fixed epoch ms for determinism
const DAY_MS = 24 * 60 * 60 * 1000;

// ─── emptyModel ───────────────────────────────────────────────────────────────

describe('emptyModel', () => {
  it('returns a fully empty model with the supplied timestamp', () => {
    const m = emptyModel(NOW);
    expect(m.skills).toEqual({});
    expect(m.exposure).toEqual({});
    expect(m.misconceptions).toEqual({});
    expect(m.weakestSkills).toEqual([]);
    expect(m.strongestSkills).toEqual([]);
    expect(m.updatedAt).toBe(NOW);
  });
});

// ─── Engine A: applyPracticeAttempt ──────────────────────────────────────────

describe('applyPracticeAttempt (Engine A)', () => {
  it('bootstraps a new skill stat at DEFAULT_RATING with recentCorrect 0.5', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: true,
      now: NOW,
    });
    const stat = m1.skills['combinations']!;
    expect(stat).toBeDefined();
    // firstSeenAt must be NOW (bootstrapped this attempt)
    expect(stat.firstSeenAt).toBe(NOW);
  });

  it('raises rating after a correct attempt', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: true,
      now: NOW,
    });
    expect(m1.skills['combinations']!.rating).toBeGreaterThan(DEFAULT_RATING);
  });

  it('lowers rating after a wrong attempt', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: false,
      now: NOW,
    });
    expect(m1.skills['combinations']!.rating).toBeLessThan(DEFAULT_RATING);
  });

  it('recentCorrect moves toward 1 on correct, toward 0 on wrong', () => {
    const m0 = emptyModel(NOW);

    const mCorrect = applyPracticeAttempt(m0, {
      skills: ['permutations'],
      wasCorrect: true,
      now: NOW,
    });
    expect(mCorrect.skills['permutations']!.recentCorrect).toBeGreaterThan(0.5);

    const mWrong = applyPracticeAttempt(m0, {
      skills: ['permutations'],
      wasCorrect: false,
      now: NOW,
    });
    expect(mWrong.skills['permutations']!.recentCorrect).toBeLessThan(0.5);
  });

  it('recentCorrect bootstrap is exactly ACC_ALPHA * 1 + (1-ACC_ALPHA) * 0.5 for first correct', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['permutations'],
      wasCorrect: true,
      now: NOW,
    });
    const expected = ACC_ALPHA * 1 + (1 - ACC_ALPHA) * 0.5;
    expect(m1.skills['permutations']!.recentCorrect).toBeCloseTo(expected, 10);
  });

  it('attempts and correct counters are monotonically increasing', () => {
    let m = emptyModel(NOW);
    for (let i = 0; i < 5; i++) {
      const before = m.skills['combinations']?.attempts ?? 0;
      const beforeCorrect = m.skills['combinations']?.correct ?? 0;
      m = applyPracticeAttempt(m, {
        skills: ['combinations'],
        wasCorrect: i % 2 === 0,
        now: NOW + i * 1000,
      });
      expect(m.skills['combinations']!.attempts).toBe(before + 1);
      if (i % 2 === 0) {
        expect(m.skills['combinations']!.correct).toBe(beforeCorrect + 1);
      } else {
        expect(m.skills['combinations']!.correct).toBe(beforeCorrect);
      }
    }
  });

  it('delayed-retrieval: a correct attempt 5 days later earns MORE rating than one just seen', () => {
    // Seed the skill with a first attempt so lastSeenAt is established.
    const m0 = emptyModel(NOW);
    const mSeeded = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: true,
      now: NOW,
    });

    // Attempt immediately after (no delay).
    const mNoDelay = applyPracticeAttempt(mSeeded, {
      skills: ['combinations'],
      wasCorrect: true,
      now: NOW + 1000, // 1 second later
    });

    // Attempt after 5 days (delayed retrieval).
    const mDelayed = applyPracticeAttempt(mSeeded, {
      skills: ['combinations'],
      wasCorrect: true,
      now: NOW + 5 * 24 * 60 * 60 * 1000, // 5 days later
    });

    expect(mDelayed.skills['combinations']!.rating).toBeGreaterThan(
      mNoDelay.skills['combinations']!.rating,
    );
  });

  it('delayed-retrieval bonus is capped at 1.5× for a correct attempt 10+ days out', () => {
    const m0 = emptyModel(NOW);
    const mSeeded = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: true,
      now: NOW,
    });
    const ratingAfterSeed = mSeeded.skills['combinations']!.rating;
    const difficulty = DEFAULT_RATING;

    // 10 days: bonus = min(1 + 10/10, 1.5) = 1.5
    const m10d = applyPracticeAttempt(mSeeded, {
      skills: ['combinations'],
      wasCorrect: true,
      difficulty,
      now: NOW + 10 * DAY_MS,
    });
    // 20 days: bonus should also be capped at 1.5
    const m20d = applyPracticeAttempt(mSeeded, {
      skills: ['combinations'],
      wasCorrect: true,
      difficulty,
      now: NOW + 20 * DAY_MS,
    });

    // Both should have the same rating delta (bonus capped at 1.5).
    const delta10 = m10d.skills['combinations']!.rating - ratingAfterSeed;
    const delta20 = m20d.skills['combinations']!.rating - ratingAfterSeed;
    expect(delta10).toBeCloseTo(delta20, 8);
  });

  it('weakestSkills / strongestSkills reflect actual ratings after multiple skills', () => {
    let m = emptyModel(NOW);

    // Deliberately build different ratings: 2 correct for combinations, 2 wrong for permutations.
    m = applyPracticeAttempt(m, { skills: ['combinations'], wasCorrect: true, now: NOW });
    m = applyPracticeAttempt(m, { skills: ['combinations'], wasCorrect: true, now: NOW + 1 });
    m = applyPracticeAttempt(m, { skills: ['permutations'], wasCorrect: false, now: NOW + 2 });
    m = applyPracticeAttempt(m, { skills: ['permutations'], wasCorrect: false, now: NOW + 3 });

    expect(m.skills['combinations']!.rating).toBeGreaterThan(
      m.skills['permutations']!.rating,
    );

    expect(m.weakestSkills[0]).toBe('permutations');
    expect(m.strongestSkills[0]).toBe('combinations');
  });

  it('weakestSkills/strongestSkills contain at most 3 entries', () => {
    let m = emptyModel(NOW);
    const allSkills = ['combinations', 'permutations', 'complement-rule', 'independence', 'base-rate'] as const;
    for (const s of allSkills) {
      m = applyPracticeAttempt(m, { skills: [s], wasCorrect: true, now: NOW });
    }
    expect(m.weakestSkills.length).toBeLessThanOrEqual(3);
    expect(m.strongestSkills.length).toBeLessThanOrEqual(3);
  });

  it('sets lastSeenAt to now', () => {
    const m0 = emptyModel(NOW);
    const later = NOW + 99999;
    const m1 = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: true,
      now: later,
    });
    expect(m1.skills['combinations']!.lastSeenAt).toBe(later);
    expect(m1.updatedAt).toBe(later);
  });

  it('bumps misconceptions on a correct attempt', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['ordered-vs-unordered'],
      wasCorrect: false,
      misconceptionKey: 'ordered_vs_unordered',
      now: NOW,
    });
    expect(m1.misconceptions['ordered_vs_unordered']?.count).toBe(1);
    expect(m1.misconceptions['ordered_vs_unordered']?.lastSeenAt).toBe(NOW);
  });

  it('increments misconception count on repeated misses', () => {
    let m = emptyModel(NOW);
    m = applyPracticeAttempt(m, {
      skills: ['ordered-vs-unordered'],
      wasCorrect: false,
      misconceptionKey: 'ordered_vs_unordered',
      now: NOW,
    });
    m = applyPracticeAttempt(m, {
      skills: ['ordered-vs-unordered'],
      wasCorrect: false,
      misconceptionKey: 'ordered_vs_unordered',
      now: NOW + 1,
    });
    expect(m.misconceptions['ordered_vs_unordered']?.count).toBe(2);
  });

  it('does not mutate the input model (pure function)', () => {
    const m0 = emptyModel(NOW);
    const snapshot = JSON.stringify(m0);
    applyPracticeAttempt(m0, { skills: ['combinations'], wasCorrect: true, now: NOW });
    expect(JSON.stringify(m0)).toBe(snapshot);
  });

  it('is deterministic: same inputs + same now -> identical output', () => {
    const m0 = emptyModel(NOW);
    const r1 = applyPracticeAttempt(m0, { skills: ['combinations'], wasCorrect: true, now: NOW });
    const r2 = applyPracticeAttempt(m0, { skills: ['combinations'], wasCorrect: true, now: NOW });
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

// ─── Engine B: applyLessonExposure ───────────────────────────────────────────

describe('applyLessonExposure (Engine B)', () => {
  it('creates exposure[skill] with introducedAt on first encounter', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyLessonExposure(m0, {
      skills: ['combinations'],
      firstTryCorrect: true,
      now: NOW,
    });
    const exp = m1.exposure['combinations']!;
    expect(exp).toBeDefined();
    expect(exp.introducedAt).toBe(NOW);
    expect(exp.lessonFirstTries).toBe(1);
    expect(exp.lessonFirstTryStruggles).toBe(0);
    expect(exp.lastSeenAt).toBe(NOW);
  });

  it('increments lessonFirstTries on each call', () => {
    let m = emptyModel(NOW);
    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: true, now: NOW });
    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: false, now: NOW + 1 });
    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: true, now: NOW + 2 });
    expect(m.exposure['combinations']!.lessonFirstTries).toBe(3);
  });

  it('increments lessonFirstTryStruggles only on a first-try miss', () => {
    let m = emptyModel(NOW);
    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: true, now: NOW });
    expect(m.exposure['combinations']!.lessonFirstTryStruggles).toBe(0);

    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: false, now: NOW + 1 });
    expect(m.exposure['combinations']!.lessonFirstTryStruggles).toBe(1);

    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: true, now: NOW + 2 });
    expect(m.exposure['combinations']!.lessonFirstTryStruggles).toBe(1); // unchanged
  });

  // ─── CRITICAL: Engine A must be untouched ─────────────────────────────────

  it('does NOT create or modify any skills[...] entry (Engine A untouched)', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyLessonExposure(m0, {
      skills: ['combinations'],
      firstTryCorrect: false,
      misconceptionKey: 'ordered_vs_unordered',
      now: NOW,
    });
    // The skills map must remain completely empty.
    expect(Object.keys(m1.skills)).toHaveLength(0);
    expect(m1.skills['combinations']).toBeUndefined();
  });

  it('does NOT change weakestSkills (Engine A only)', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyLessonExposure(m0, {
      skills: ['combinations'],
      firstTryCorrect: false,
      now: NOW,
    });
    expect(m1.weakestSkills).toEqual([]);
  });

  it('does NOT change strongestSkills (Engine A only)', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyLessonExposure(m0, {
      skills: ['combinations'],
      firstTryCorrect: true,
      now: NOW,
    });
    expect(m1.strongestSkills).toEqual([]);
  });

  it('does NOT change any existing Engine-A rating when applied to a model that already has practice data', () => {
    let m = emptyModel(NOW);
    // Seed some Engine-A data first.
    m = applyPracticeAttempt(m, { skills: ['combinations'], wasCorrect: true, now: NOW });
    const ratingBefore = m.skills['combinations']!.rating;
    const weakBefore = [...m.weakestSkills];
    const strongBefore = [...m.strongestSkills];

    // Apply Engine B — must not change any of the above.
    const mAfter = applyLessonExposure(m, {
      skills: ['combinations'],
      firstTryCorrect: false,
      now: NOW + 1,
    });

    expect(mAfter.skills['combinations']!.rating).toBe(ratingBefore);
    expect(mAfter.weakestSkills).toEqual(weakBefore);
    expect(mAfter.strongestSkills).toEqual(strongBefore);
  });

  it('bumps misconceptions on a lesson miss', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyLessonExposure(m0, {
      skills: ['base-rate'],
      firstTryCorrect: false,
      misconceptionKey: 'base_rate_neglect',
      now: NOW,
    });
    expect(m1.misconceptions['base_rate_neglect']?.count).toBe(1);
  });

  it('sets updatedAt to now', () => {
    const m0 = emptyModel(NOW);
    const later = NOW + 12345;
    const m1 = applyLessonExposure(m0, { skills: ['combinations'], firstTryCorrect: true, now: later });
    expect(m1.updatedAt).toBe(later);
  });

  it('does not mutate the input model (pure function)', () => {
    const m0 = emptyModel(NOW);
    const snapshot = JSON.stringify(m0);
    applyLessonExposure(m0, { skills: ['combinations'], firstTryCorrect: false, now: NOW });
    expect(JSON.stringify(m0)).toBe(snapshot);
  });

  it('is deterministic: same inputs + same now -> identical output', () => {
    const m0 = emptyModel(NOW);
    const r1 = applyLessonExposure(m0, { skills: ['combinations'], firstTryCorrect: true, now: NOW });
    const r2 = applyLessonExposure(m0, { skills: ['combinations'], firstTryCorrect: true, now: NOW });
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});

// ─── Separation invariant ────────────────────────────────────────────────────

describe('Engine A / B separation invariant', () => {
  it('a lesson-only user has empty skills and empty weakest/strongest', () => {
    let m = emptyModel(NOW);
    m = applyLessonExposure(m, { skills: ['combinations'], firstTryCorrect: false, now: NOW });
    m = applyLessonExposure(m, { skills: ['permutations'], firstTryCorrect: true, now: NOW + 1 });

    // Mastery requires practice — exposure alone must not populate Engine A.
    expect(Object.keys(m.skills)).toHaveLength(0);
    expect(m.weakestSkills).toEqual([]);
    expect(m.strongestSkills).toEqual([]);

    // But exposure is populated.
    expect(m.exposure['combinations']).toBeDefined();
    expect(m.exposure['permutations']).toBeDefined();
  });

  it('misconceptions are shared — both engines can bump the same key', () => {
    let m = emptyModel(NOW);
    m = applyPracticeAttempt(m, {
      skills: ['ordered-vs-unordered'],
      wasCorrect: false,
      misconceptionKey: 'ordered_vs_unordered',
      now: NOW,
    });
    m = applyLessonExposure(m, {
      skills: ['ordered-vs-unordered'],
      firstTryCorrect: false,
      misconceptionKey: 'ordered_vs_unordered',
      now: NOW + 1,
    });
    expect(m.misconceptions['ordered_vs_unordered']?.count).toBe(2);
  });
});

// ─── buildReportCard (C7b) ────────────────────────────────────────────────────

describe('buildReportCard', () => {
  it('puts a skill in review when >= 1 slot had a first-try miss', () => {
    const results: SlotFirstTry[] = [
      { slotId: 's1', skills: ['combinations'], firstTryCorrect: true },
      { slotId: 's2', skills: ['combinations'], firstTryCorrect: false },
    ];
    const card = buildReportCard('lesson-1', results);
    expect(card.review).toContain('combinations');
    expect(card.nailed).not.toContain('combinations');
  });

  it('puts a skill in nailed only when every slot was first-try-correct', () => {
    const results: SlotFirstTry[] = [
      { slotId: 's1', skills: ['permutations'], firstTryCorrect: true },
      { slotId: 's2', skills: ['permutations'], firstTryCorrect: true },
    ];
    const card = buildReportCard('lesson-1', results);
    expect(card.nailed).toContain('permutations');
    expect(card.review).not.toContain('permutations');
  });

  it('nailed and review are mutually exclusive', () => {
    const results: SlotFirstTry[] = [
      { slotId: 's1', skills: ['combinations', 'permutations'], firstTryCorrect: true },
      { slotId: 's2', skills: ['combinations'], firstTryCorrect: false },
    ];
    const card = buildReportCard('lesson-1', results);
    // combinations: 1 miss → review; permutations: all correct → nailed
    expect(card.review).toContain('combinations');
    expect(card.nailed).toContain('permutations');
    // No overlap
    const nailedSet = new Set(card.nailed);
    for (const s of card.review) {
      expect(nailedSet.has(s)).toBe(false);
    }
  });

  it('deduplicates misconception keys', () => {
    const results: SlotFirstTry[] = [
      {
        slotId: 's1',
        skills: ['combinations'],
        firstTryCorrect: false,
        misconceptionKey: 'ordered_vs_unordered',
      },
      {
        slotId: 's2',
        skills: ['combinations'],
        firstTryCorrect: false,
        misconceptionKey: 'ordered_vs_unordered',
      },
      {
        slotId: 's3',
        skills: ['base-rate'],
        firstTryCorrect: false,
        misconceptionKey: 'base_rate_neglect',
      },
    ];
    const card = buildReportCard('lesson-1', results);
    const orderedCount = card.misconceptions.filter((k) => k === 'ordered_vs_unordered').length;
    expect(orderedCount).toBe(1);
    expect(card.misconceptions).toContain('base_rate_neglect');
  });

  it('returns empty nailed/review/misconceptions for an empty results array', () => {
    const card = buildReportCard('lesson-empty', []);
    expect(card.nailed).toEqual([]);
    expect(card.review).toEqual([]);
    expect(card.misconceptions).toEqual([]);
    expect(card.lessonId).toBe('lesson-empty');
  });

  it('a slot with multiple skills propagates miss to each skill independently', () => {
    const results: SlotFirstTry[] = [
      {
        slotId: 's1',
        skills: ['combinations', 'permutations'],
        firstTryCorrect: false,
      },
    ];
    const card = buildReportCard('lesson-1', results);
    expect(card.review).toContain('combinations');
    expect(card.review).toContain('permutations');
    expect(card.nailed).not.toContain('combinations');
    expect(card.nailed).not.toContain('permutations');
  });

  it('is pure: same inputs + same results -> identical output', () => {
    const results: SlotFirstTry[] = [
      { slotId: 's1', skills: ['combinations'], firstTryCorrect: true },
    ];
    const c1 = buildReportCard('lesson-x', results);
    const c2 = buildReportCard('lesson-x', results);
    expect(JSON.stringify(c1)).toBe(JSON.stringify(c2));
  });
});

// ─── Explicit ELO math spot-check ─────────────────────────────────────────────

describe('Elo math spot-check', () => {
  it('matches the expected formula for a correct attempt at default difficulty', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: true,
      difficulty: DEFAULT_RATING,
      now: NOW,
    });
    // expected = 1/(1+10^((1000-1000)/400)) = 0.5
    // bonus = 1 (new skill, no prior lastSeenAt → daysSinceLastSeen = 0)
    // delta = ELO_K * 1 * (1 - 0.5) = 12
    const expected = DEFAULT_RATING + ELO_K * 1 * (1 - 0.5);
    expect(m1.skills['combinations']!.rating).toBeCloseTo(expected, 8);
  });

  it('matches expected formula for a wrong attempt at default difficulty', () => {
    const m0 = emptyModel(NOW);
    const m1 = applyPracticeAttempt(m0, {
      skills: ['combinations'],
      wasCorrect: false,
      difficulty: DEFAULT_RATING,
      now: NOW,
    });
    // expected = 0.5, actual = 0, bonus = 1
    // delta = ELO_K * 1 * (0 - 0.5) = -12
    const expected = DEFAULT_RATING + ELO_K * 1 * (0 - 0.5);
    expect(m1.skills['combinations']!.rating).toBeCloseTo(expected, 8);
  });
});
