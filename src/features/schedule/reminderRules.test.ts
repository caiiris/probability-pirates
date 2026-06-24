import { describe, it, expect, beforeEach } from 'vitest';
import type { StudyEvent } from './scheduleService';
import {
  pendingToday,
  wasDismissedToday,
  markDismissedToday,
  localDateString,
} from './reminderRules';

const ev = (over: Partial<StudyEvent>): StudyEvent => ({
  id: 'x',
  title: 'Thing',
  date: '2026-06-23',
  eventType: 'study',
  completed: false,
  ...over,
});

describe('pendingToday', () => {
  const today = '2026-06-23';

  it('keeps only unfinished events dated today', () => {
    const events = [
      ev({ id: 'a', date: today }),
      ev({ id: 'b', date: today, completed: true }), // done -> excluded
      ev({ id: 'c', date: '2026-06-22' }),           // past -> excluded
      ev({ id: 'd', date: '2026-06-24' }),           // future -> excluded
    ];
    expect(pendingToday(events, today).map((e) => e.id)).toEqual(['a']);
  });

  it('returns nothing once the day has passed (event dated yesterday)', () => {
    const events = [ev({ id: 'a', date: '2026-06-22' })];
    expect(pendingToday(events, today)).toEqual([]);
  });

  it('sorts timed events first, by time, then untimed', () => {
    const events = [
      ev({ id: 'late', date: today, time: '15:00' }),
      ev({ id: 'none', date: today }),
      ev({ id: 'early', date: today, time: '08:30' }),
    ];
    expect(pendingToday(events, today).map((e) => e.id)).toEqual(['early', 'late', 'none']);
  });
});

describe('dismissal persistence', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the dismissed date per uid', () => {
    expect(wasDismissedToday('u1', '2026-06-23')).toBe(false);
    markDismissedToday('u1', '2026-06-23');
    expect(wasDismissedToday('u1', '2026-06-23')).toBe(true);
  });

  it('re-shows on a new day', () => {
    markDismissedToday('u1', '2026-06-23');
    expect(wasDismissedToday('u1', '2026-06-24')).toBe(false);
  });

  it('is scoped per uid', () => {
    markDismissedToday('u1', '2026-06-23');
    expect(wasDismissedToday('u2', '2026-06-23')).toBe(false);
  });

  it('no-ops without a uid', () => {
    markDismissedToday('', '2026-06-23');
    expect(wasDismissedToday('', '2026-06-23')).toBe(false);
  });
});

describe('localDateString', () => {
  it('formats as YYYY-MM-DD with zero padding', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
