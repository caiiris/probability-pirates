import { describe, it, expect } from 'vitest';
import {
  grantPracticeXp,
  practiceXpRemainingToday,
  PRACTICE_DAILY_XP_CAP,
  PRACTICE_XP_PER_CORRECT,
} from './practiceXp';

const DAY = '2026-06-24';
const NEXT_DAY = '2026-06-25';

describe('grantPracticeXp', () => {
  it('awards per-correct XP for a first correct answer (no prior state)', () => {
    const g = grantPracticeXp(undefined, DAY, true);
    expect(g.granted).toBe(PRACTICE_XP_PER_CORRECT);
    expect(g.state).toEqual({ date: DAY, earnedToday: PRACTICE_XP_PER_CORRECT });
    expect(g.capReached).toBe(false);
  });

  it('awards nothing for a wrong answer', () => {
    const g = grantPracticeXp({ date: DAY, earnedToday: 20 }, DAY, false);
    expect(g.granted).toBe(0);
    expect(g.state.earnedToday).toBe(20);
  });

  it('accumulates across correct answers on the same day', () => {
    let state = grantPracticeXp(undefined, DAY, true).state;
    state = grantPracticeXp(state, DAY, true).state;
    expect(state).toEqual({ date: DAY, earnedToday: 2 * PRACTICE_XP_PER_CORRECT });
  });

  it('caps the daily total and reports capReached', () => {
    const justUnder = grantPracticeXp(
      { date: DAY, earnedToday: PRACTICE_DAILY_XP_CAP - 2 },
      DAY,
      true,
    );
    // Only 2 of the 5 fit under the cap.
    expect(justUnder.granted).toBe(2);
    expect(justUnder.state.earnedToday).toBe(PRACTICE_DAILY_XP_CAP);
    expect(justUnder.capReached).toBe(true);
  });

  it('grants zero once the cap is already reached', () => {
    const g = grantPracticeXp({ date: DAY, earnedToday: PRACTICE_DAILY_XP_CAP }, DAY, true);
    expect(g.granted).toBe(0);
    expect(g.capReached).toBe(true);
  });

  it('resets the counter when the local day rolls over', () => {
    const g = grantPracticeXp({ date: DAY, earnedToday: PRACTICE_DAILY_XP_CAP }, NEXT_DAY, true);
    expect(g.granted).toBe(PRACTICE_XP_PER_CORRECT);
    expect(g.state).toEqual({ date: NEXT_DAY, earnedToday: PRACTICE_XP_PER_CORRECT });
  });
});

describe('practiceXpRemainingToday', () => {
  it('is the full cap for a new user', () => {
    expect(practiceXpRemainingToday(undefined, DAY)).toBe(PRACTICE_DAILY_XP_CAP);
  });

  it('reflects XP already earned today', () => {
    expect(practiceXpRemainingToday({ date: DAY, earnedToday: 30 }, DAY)).toBe(
      PRACTICE_DAILY_XP_CAP - 30,
    );
  });

  it('is the full cap again after the day rolls over', () => {
    expect(practiceXpRemainingToday({ date: DAY, earnedToday: 80 }, NEXT_DAY)).toBe(
      PRACTICE_DAILY_XP_CAP,
    );
  });
});
