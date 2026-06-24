import { describe, it, expect } from 'vitest';
import { currentWeekKey, isCurrentWeek, effectiveWeeklyXp } from './weeklyXp';

describe('currentWeekKey', () => {
  it('formats as YYYY-Www', () => {
    expect(currentWeekKey(new Date(2026, 5, 23))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('puts Jan 1 2026 (Thursday) in ISO week 1', () => {
    expect(currentWeekKey(new Date(2026, 0, 1))).toBe('2026-W01');
  });

  it('rolls late-December dates into the next ISO year', () => {
    // Mon Dec 29 2025 belongs to ISO week 1 of 2026 (week containing Jan 4 2026).
    expect(currentWeekKey(new Date(2025, 11, 29))).toBe('2026-W01');
  });

  it('advances to week 2 the following Monday', () => {
    expect(currentWeekKey(new Date(2026, 0, 5))).toBe('2026-W02');
  });

  it('gives the same key for every day within one ISO week', () => {
    const mon = currentWeekKey(new Date(2026, 0, 5));
    const sun = currentWeekKey(new Date(2026, 0, 11));
    expect(mon).toBe(sun);
  });
});

describe('isCurrentWeek / effectiveWeeklyXp', () => {
  const now = new Date(2026, 0, 7); // somewhere in 2026-W02
  const thisWeek = currentWeekKey(now);

  it('treats matching week keys as current', () => {
    expect(isCurrentWeek(thisWeek, now)).toBe(true);
    expect(isCurrentWeek('2025-W40', now)).toBe(false);
    expect(isCurrentWeek(null, now)).toBe(false);
    expect(isCurrentWeek(undefined, now)).toBe(false);
  });

  it('zeroes out stale buckets for ranking', () => {
    expect(effectiveWeeklyXp(120, thisWeek, now)).toBe(120);
    expect(effectiveWeeklyXp(120, '2025-W40', now)).toBe(0);
    expect(effectiveWeeklyXp(undefined, thisWeek, now)).toBe(0);
  });
});
