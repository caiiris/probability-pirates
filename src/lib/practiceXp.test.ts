import { describe, it, expect } from 'vitest';
import {
  grantPracticeXp,
  practiceXpRemainingToday,
  practiceXpForResult,
  practiceXpBaseForDifficulty,
  practiceBandForElo,
  practiceTryMultiplier,
  PRACTICE_DAILY_XP_CAP,
  PRACTICE_XP_PER_CORRECT,
  PRACTICE_XP_BY_BAND,
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

// ---------------------------------------------------------------------------
// Difficulty-scaled base + per-try decay (D100, F2)
// ---------------------------------------------------------------------------

describe('practiceBandForElo', () => {
  it('maps Elo onto the same bands as the difficulty label', () => {
    expect(practiceBandForElo(800)).toBe('Easy');
    expect(practiceBandForElo(949)).toBe('Easy');
    expect(practiceBandForElo(950)).toBe('Medium');
    expect(practiceBandForElo(1249)).toBe('Medium');
    expect(practiceBandForElo(1250)).toBe('Hard');
    expect(practiceBandForElo(1499)).toBe('Hard');
    expect(practiceBandForElo(1500)).toBe('Extreme');
    expect(practiceBandForElo(2000)).toBe('Extreme');
  });
});

describe('practiceXpBaseForDifficulty', () => {
  it('awards 3 / 5 / 8 / 12 across the four bands', () => {
    expect(practiceXpBaseForDifficulty(800)).toBe(PRACTICE_XP_BY_BAND.Easy);
    expect(practiceXpBaseForDifficulty(1100)).toBe(PRACTICE_XP_BY_BAND.Medium);
    expect(practiceXpBaseForDifficulty(1400)).toBe(PRACTICE_XP_BY_BAND.Hard);
    expect(practiceXpBaseForDifficulty(1700)).toBe(PRACTICE_XP_BY_BAND.Extreme);
  });

  it('the Medium base equals the legacy flat default', () => {
    expect(practiceXpBaseForDifficulty(1100)).toBe(PRACTICE_XP_PER_CORRECT);
  });
});

describe('practiceTryMultiplier', () => {
  it('decays full → half → quarter → zero', () => {
    expect(practiceTryMultiplier(1)).toBe(1);
    expect(practiceTryMultiplier(2)).toBe(0.5);
    expect(practiceTryMultiplier(3)).toBe(0.25);
    expect(practiceTryMultiplier(4)).toBe(0);
    expect(practiceTryMultiplier(0)).toBe(1); // guard: treat <1 as first try
  });
});

describe('practiceXpForResult — scaled', () => {
  it('returns 0 for a wrong answer regardless of opts', () => {
    expect(practiceXpForResult(false, { difficulty: 1700, tryNumber: 1 })).toBe(0);
  });

  it('uses the band base on the first try', () => {
    expect(practiceXpForResult(true, { difficulty: 1700 })).toBe(12); // Extreme, full
    expect(practiceXpForResult(true, { difficulty: 800 })).toBe(3); // Easy, full
  });

  it('decays a Hard problem (base 8) across tries and rounds', () => {
    expect(practiceXpForResult(true, { difficulty: 1400, tryNumber: 1 })).toBe(8);
    expect(practiceXpForResult(true, { difficulty: 1400, tryNumber: 2 })).toBe(4);
    expect(practiceXpForResult(true, { difficulty: 1400, tryNumber: 3 })).toBe(2);
    // Extreme base 12, third try → 3.
    expect(practiceXpForResult(true, { difficulty: 1700, tryNumber: 3 })).toBe(3);
  });

  it('preserves the flat default when no difficulty is given', () => {
    expect(practiceXpForResult(true)).toBe(PRACTICE_XP_PER_CORRECT);
  });

  it('applies the conceptual reasoning multiplier (flagged why halves the award)', () => {
    // Hard base 8, first try, reasoning flagged → 8 × 1 × 0.5 = 4.
    expect(practiceXpForResult(true, { difficulty: 1400, reasoningMultiplier: 0.5 })).toBe(4);
    // Clamped to [0,1]; a value > 1 cannot inflate the award.
    expect(practiceXpForResult(true, { difficulty: 1400, reasoningMultiplier: 2 })).toBe(8);
  });
});

describe('grantPracticeXp — scaled opts', () => {
  const DAY = '2026-06-24';

  it('grants the difficulty-scaled, try-decayed amount under the cap', () => {
    const g = grantPracticeXp(undefined, DAY, true, { difficulty: 1700, tryNumber: 2 });
    expect(g.granted).toBe(6); // Extreme base 12 × ½
    expect(g.state.earnedToday).toBe(6);
  });

  it('grants 0 on a reveal (tryNumber past the ladder)', () => {
    const g = grantPracticeXp(undefined, DAY, true, { difficulty: 1700, tryNumber: 4 });
    expect(g.granted).toBe(0);
  });

  it('still respects the daily cap with scaled awards', () => {
    const near: { date: string; earnedToday: number } = {
      date: DAY,
      earnedToday: PRACTICE_DAILY_XP_CAP - 5,
    };
    const g = grantPracticeXp(near, DAY, true, { difficulty: 1700, tryNumber: 1 }); // wants 12
    expect(g.granted).toBe(5); // only 5 room left
    expect(g.capReached).toBe(true);
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
