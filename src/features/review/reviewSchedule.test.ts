import { describe, it, expect } from 'vitest';
import {
  emptyReviewSchedule,
  seedSkills,
  applyReviewResult,
  recordResultInSchedule,
  dueSkills,
  isSatisfiedToday,
  markSatisfied,
  intervalMsForBox,
  INTERVALS_DAYS,
  MAX_BOX,
  type ReviewEntry,
} from './reviewSchedule';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_000_000_000_000;

describe('reviewSchedule — seeding', () => {
  it('seeds new skills at box 0, due after the first interval', () => {
    const s = seedSkills(emptyReviewSchedule(T0), ['combinations', 'permutations'], T0);
    expect(s.entries['combinations']).toEqual({
      box: 0,
      dueAt: T0 + INTERVALS_DAYS[0] * DAY,
      lastReviewedAt: T0,
      lapses: 0,
    });
    expect(s.entries['permutations']?.box).toBe(0);
  });

  it('is idempotent — re-seeding an existing skill does not reset its schedule', () => {
    const seeded = seedSkills(emptyReviewSchedule(T0), ['combinations'], T0);
    // Advance the skill to box 2 by two correct reviews.
    const advanced = recordResultInSchedule(
      recordResultInSchedule(seeded, 'combinations', true, T0 + DAY),
      'combinations',
      true,
      T0 + 5 * DAY,
    );
    const reSeeded = seedSkills(advanced, ['combinations'], T0 + 10 * DAY);
    expect(reSeeded.entries['combinations']?.box).toBe(2);
    // Same object returned when nothing changed.
    expect(reSeeded).toBe(advanced);
  });
});

describe('reviewSchedule — applyReviewResult', () => {
  const base: ReviewEntry = { box: 1, dueAt: T0, lastReviewedAt: T0 - DAY, lapses: 0 };

  it('promotes one box and lengthens the interval on a correct recall', () => {
    const next = applyReviewResult(base, true, T0);
    expect(next.box).toBe(2);
    expect(next.dueAt).toBe(T0 + intervalMsForBox(2));
    expect(next.lapses).toBe(0);
  });

  it('caps promotion at MAX_BOX', () => {
    const top: ReviewEntry = { box: MAX_BOX, dueAt: T0, lastReviewedAt: T0, lapses: 0 };
    expect(applyReviewResult(top, true, T0).box).toBe(MAX_BOX);
  });

  it('demotes to box 0 and increments lapses on a miss', () => {
    const next = applyReviewResult({ ...base, box: 4 }, false, T0);
    expect(next.box).toBe(0);
    expect(next.dueAt).toBe(T0 + intervalMsForBox(0));
    expect(next.lapses).toBe(1);
  });
});

describe('reviewSchedule — dueSkills', () => {
  it('returns only due skills, most-overdue first', () => {
    let s = emptyReviewSchedule(T0);
    s = seedSkills(s, ['combinations', 'permutations', 'base-rate'], T0);
    // Make combinations overdue by a lot, permutations overdue a little, base-rate not due.
    s = {
      ...s,
      entries: {
        combinations: { box: 0, dueAt: T0 - 10 * DAY, lastReviewedAt: T0, lapses: 0 },
        permutations: { box: 0, dueAt: T0 - 1 * DAY, lastReviewedAt: T0, lapses: 0 },
        'base-rate': { box: 0, dueAt: T0 + 5 * DAY, lastReviewedAt: T0, lapses: 0 },
      },
    };
    expect(dueSkills(s, T0)).toEqual(['combinations', 'permutations']);
  });

  it('respects the restrictTo allow-list (template-availability filter)', () => {
    let s = emptyReviewSchedule(T0);
    s = {
      ...s,
      entries: {
        combinations: { box: 0, dueAt: T0 - DAY, lastReviewedAt: T0, lapses: 0 },
        'monty-hall-reasoning': { box: 0, dueAt: T0 - DAY, lastReviewedAt: T0, lapses: 0 },
      },
    };
    expect(dueSkills(s, T0, new Set(['combinations']))).toEqual(['combinations']);
  });
});

describe('reviewSchedule — satisfied-today gate flag', () => {
  it('marks and reads the satisfied day', () => {
    const s = markSatisfied(emptyReviewSchedule(T0), '2026-06-28', T0);
    expect(isSatisfiedToday(s, '2026-06-28')).toBe(true);
    expect(isSatisfiedToday(s, '2026-06-29')).toBe(false);
  });
});
