import { describe, it, expect } from 'vitest';
import { newMilestonesFor } from './milestones';

describe('newMilestonesFor', () => {
  it('returns all eligible milestones for a new streak', () => {
    const result = newMilestonesFor(7, []);
    expect(result).toEqual(['streak-3', 'streak-7']);
  });

  it('skips already-reached milestones', () => {
    const result = newMilestonesFor(7, ['streak-3']);
    expect(result).toEqual(['streak-7']);
  });

  it('returns empty when all are already reached', () => {
    const result = newMilestonesFor(7, ['streak-3', 'streak-7']);
    expect(result).toEqual([]);
  });

  it('is idempotent — calling twice gives same result', () => {
    const first = newMilestonesFor(30, []);
    const second = newMilestonesFor(30, first);
    expect(second).toEqual([]);
  });

  it('returns empty for streak below first threshold', () => {
    expect(newMilestonesFor(2, [])).toEqual([]);
  });

  it('returns all 6 milestones at streak 100', () => {
    const result = newMilestonesFor(100, []);
    expect(result).toHaveLength(6);
    expect(result).toEqual([
      'streak-3',
      'streak-7',
      'streak-14',
      'streak-30',
      'streak-60',
      'streak-100',
    ]);
  });
});
