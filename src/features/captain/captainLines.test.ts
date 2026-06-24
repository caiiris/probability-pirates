import { describe, it, expect } from 'vitest';
import { CAPTAIN_LINES, captainLine, dailyTipIndex, type CaptainContext } from './captainLines';

const CONTEXTS: CaptainContext[] = ['welcome', 'allCaught', 'courseComplete', 'lessonIntro', 'tip'];

describe('captainLines catalog', () => {
  it('has at least one line per context', () => {
    for (const ctx of CONTEXTS) {
      expect(CAPTAIN_LINES[ctx].length).toBeGreaterThan(0);
    }
  });
});

describe('captainLine', () => {
  it('interpolates the name when provided', () => {
    const line = captainLine('welcome', { name: 'Marina' });
    expect(line).toContain('Marina');
    expect(line).not.toContain('{name}');
  });

  it('never leaves a raw placeholder when name/title are missing', () => {
    for (const ctx of CONTEXTS) {
      for (let i = 0; i < CAPTAIN_LINES[ctx].length; i++) {
        const line = captainLine(ctx, { pick: i });
        expect(line).not.toContain('{name}');
        expect(line).not.toContain('{title}');
      }
    }
  });

  it('interpolates the lesson title for the lesson intro', () => {
    const line = captainLine('lessonIntro', { title: 'Counting Carefully', pick: 0 });
    expect(line).toContain('Counting Carefully');
    expect(line).not.toContain('{title}');
  });

  it('wraps pick index within range', () => {
    const lines = CAPTAIN_LINES.welcome;
    expect(captainLine('welcome', { pick: lines.length })).toBe(
      captainLine('welcome', { pick: 0 }),
    );
  });

  it('is deterministic (first line) with no pick', () => {
    expect(captainLine('allCaught', { name: 'Sam' })).toBe(
      captainLine('allCaught', { name: 'Sam', pick: 0 }),
    );
  });
});

describe('dailyTipIndex', () => {
  it('stays within the tip catalog range', () => {
    for (let d = 0; d < 366; d++) {
      const date = new Date(2026, 0, 1 + d);
      const idx = dailyTipIndex(date);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(CAPTAIN_LINES.tip.length);
    }
  });

  it('is stable within a day and changes across consecutive days', () => {
    const day1 = new Date(2026, 5, 23, 9, 0);
    const day1Later = new Date(2026, 5, 23, 21, 0);
    const day2 = new Date(2026, 5, 24, 9, 0);
    expect(dailyTipIndex(day1)).toBe(dailyTipIndex(day1Later));
    expect(dailyTipIndex(day2)).not.toBe(dailyTipIndex(day1));
  });
});
