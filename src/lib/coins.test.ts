import { describe, it, expect } from 'vitest';
import {
  chestReward,
  coinsForAchievements,
  CHEST_REWARD,
  TROPHY_REWARD,
  COINS_PER_ACHIEVEMENT,
  STREAK_FREEZE_COST,
  MAX_STREAK_FREEZES,
} from './coins';

describe('chestReward', () => {
  it('gives the chest reward for a normal chapter', () => {
    expect(chestReward(false)).toBe(CHEST_REWARD);
  });

  it('gives the larger trophy reward for the final chapter', () => {
    expect(chestReward(true)).toBe(TROPHY_REWARD);
    expect(TROPHY_REWARD).toBeGreaterThan(CHEST_REWARD);
  });
});

describe('coinsForAchievements', () => {
  it('scales with the number of achievements', () => {
    expect(coinsForAchievements(0)).toBe(0);
    expect(coinsForAchievements(1)).toBe(COINS_PER_ACHIEVEMENT);
    expect(coinsForAchievements(3)).toBe(3 * COINS_PER_ACHIEVEMENT);
  });

  it('never returns negative coins', () => {
    expect(coinsForAchievements(-2)).toBe(0);
  });
});

describe('streak freeze economy', () => {
  it('has a positive price and a sane stockpile cap', () => {
    expect(STREAK_FREEZE_COST).toBeGreaterThan(0);
    expect(MAX_STREAK_FREEZES).toBeGreaterThanOrEqual(1);
  });
});
