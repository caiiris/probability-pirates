import { describe, it, expect } from 'vitest';
import { levelFromXp } from './levels';

describe('levelFromXp', () => {
  it('starts everyone at level 1 / Stowaway with 0 XP', () => {
    const info = levelFromXp(0);
    expect(info.level).toBe(1);
    expect(info.rank.name).toBe('Stowaway');
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForLevel).toBe(100); // step 1→2 = 50 + 50*1
    expect(info.xpToNext).toBe(100);
    expect(info.progress).toBe(0);
  });

  it('reaches level 2 at exactly 100 XP', () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(100).rank.name).toBe('Deckhand');
  });

  it('reaches level 3 at 250 XP (100 + 150)', () => {
    expect(levelFromXp(249).level).toBe(2);
    expect(levelFromXp(250).level).toBe(3);
  });

  it('reports progress within the current level', () => {
    // Level 2 spans [100, 250): span 150. At 175 we are 75/150 = 0.5 through.
    const info = levelFromXp(175);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(75);
    expect(info.xpForLevel).toBe(150);
    expect(info.xpToNext).toBe(75);
    expect(info.progress).toBeCloseTo(0.5, 5);
  });

  it('assigns Sailor at level 4 and never exceeds 100% progress', () => {
    const info = levelFromXp(450); // reach(4) = 100+150+200
    expect(info.level).toBe(4);
    expect(info.rank.name).toBe('Sailor');
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(1);
  });

  it('handles negative / NaN XP gracefully', () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(Number.NaN).level).toBe(1);
  });
});
