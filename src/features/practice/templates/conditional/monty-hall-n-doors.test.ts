import { describe, it, expect } from 'vitest';
import { montyHallNDoorsTemplate as t } from './monty-hall-n-doors';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, eqF } from '@/lib/probability/exact';

describe('monty-hall-n-doors', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('hand-computed case: n=3 → 2/3 (classic Monty Hall)', () => {
    const answer = t.solve({ n: 3 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind === 'fraction') {
      expect(eqF(answer.value, frac(2, 3))).toBe(true);
    }
  });

  it('input cap: reduced numerator and denominator both < 9999', () => {
    for (let n = 3; n <= 6; n++) {
      const answer = t.solve({ n });
      if (answer.kind !== 'fraction') throw new Error('expected fraction');
      expect(Number(answer.value.num)).toBeLessThan(9999);
      expect(Number(answer.value.den)).toBeLessThan(9999);
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let n = 3; n <= 6; n++) {
      const rate = t.rate({ n });
      expect(rate).toBeGreaterThanOrEqual(700);
      expect(rate).toBeLessThanOrEqual(2000);
    }
  });
});
