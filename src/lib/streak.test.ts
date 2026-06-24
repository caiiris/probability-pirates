import { describe, it, expect } from 'vitest';
import { nextStreak, isYesterday } from './streak';

describe('isYesterday', () => {
  it('returns true when a is one day before b', () => {
    expect(isYesterday('2026-06-22', '2026-06-23')).toBe(true);
  });
  it('returns false when a is two days before b', () => {
    expect(isYesterday('2026-06-21', '2026-06-23')).toBe(false);
  });
  it('returns false when a === b', () => {
    expect(isYesterday('2026-06-23', '2026-06-23')).toBe(false);
  });
  it('returns false when a is null', () => {
    expect(isYesterday(null, '2026-06-23')).toBe(false);
  });
});

describe('nextStreak', () => {
  const TODAY = '2026-06-23';
  const YESTERDAY = '2026-06-22';
  const TWO_DAYS_AGO = '2026-06-21';

  it('does not change streak when already counted today', () => {
    const result = nextStreak({
      currentStreak: 5,
      bestStreak: 5,
      lastActiveDate: TODAY,
      todayLocalDate: TODAY,
    });
    expect(result.currentStreak).toBe(5);
    expect(result.isNewStreakDay).toBe(false);
  });

  it('increments streak when last active was yesterday', () => {
    const result = nextStreak({
      currentStreak: 4,
      bestStreak: 4,
      lastActiveDate: YESTERDAY,
      todayLocalDate: TODAY,
    });
    expect(result.currentStreak).toBe(5);
    expect(result.isNewStreakDay).toBe(true);
  });

  it('resets streak to 1 when a day was missed', () => {
    const result = nextStreak({
      currentStreak: 10,
      bestStreak: 10,
      lastActiveDate: TWO_DAYS_AGO,
      todayLocalDate: TODAY,
    });
    expect(result.currentStreak).toBe(1);
    expect(result.isNewStreakDay).toBe(true);
  });

  it('starts streak at 1 for new account (null lastActiveDate)', () => {
    const result = nextStreak({
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      todayLocalDate: TODAY,
    });
    expect(result.currentStreak).toBe(1);
    expect(result.isNewStreakDay).toBe(true);
  });

  it('updates bestStreak when currentStreak exceeds it', () => {
    const result = nextStreak({
      currentStreak: 9,
      bestStreak: 9,
      lastActiveDate: YESTERDAY,
      todayLocalDate: TODAY,
    });
    expect(result.bestStreak).toBe(10);
  });

  it('does not decrease bestStreak on reset', () => {
    const result = nextStreak({
      currentStreak: 10,
      bestStreak: 20,
      lastActiveDate: TWO_DAYS_AGO,
      todayLocalDate: TODAY,
    });
    expect(result.bestStreak).toBe(20);
    expect(result.currentStreak).toBe(1);
  });

  it('consumes 0 freezes on a normal consecutive day', () => {
    const result = nextStreak({
      currentStreak: 4,
      bestStreak: 4,
      lastActiveDate: YESTERDAY,
      todayLocalDate: TODAY,
      freezesAvailable: 2,
    });
    expect(result.currentStreak).toBe(5);
    expect(result.freezesConsumed).toBe(0);
  });

  it('spends one freeze to bridge a single missed day', () => {
    const result = nextStreak({
      currentStreak: 10,
      bestStreak: 10,
      lastActiveDate: TWO_DAYS_AGO, // missed exactly one day
      todayLocalDate: TODAY,
      freezesAvailable: 1,
    });
    expect(result.currentStreak).toBe(11);
    expect(result.freezesConsumed).toBe(1);
    expect(result.isNewStreakDay).toBe(true);
  });

  it('spends multiple freezes for multiple missed days', () => {
    const result = nextStreak({
      currentStreak: 7,
      bestStreak: 7,
      lastActiveDate: '2026-06-20', // 3-day gap => 2 missed days
      todayLocalDate: TODAY,
      freezesAvailable: 2,
    });
    expect(result.currentStreak).toBe(8);
    expect(result.freezesConsumed).toBe(2);
  });

  it('resets (and wastes no freeze) when there are too few to cover the gap', () => {
    const result = nextStreak({
      currentStreak: 7,
      bestStreak: 7,
      lastActiveDate: '2026-06-20', // 2 missed days
      todayLocalDate: TODAY,
      freezesAvailable: 1, // not enough
    });
    expect(result.currentStreak).toBe(1);
    expect(result.freezesConsumed).toBe(0);
  });
});
