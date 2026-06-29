import { describe, it, expect } from 'vitest';
import { wagerXpForScore } from './wagerXp';

describe('wagerXpForScore', () => {
  it.each([
    [0, 5],
    [49, 5],
    [50, 10],
    [79, 10],
    [80, 20],
    [100, 20],
  ])('score %i → %i XP', (score, expected) => {
    expect(wagerXpForScore(score)).toBe(expected);
  });
});
