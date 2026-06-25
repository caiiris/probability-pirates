/**
 * Vetting test for sum-of-two-dice template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check (exact vs. simulate) + render-consistency
 * 2. Rate monotonicity: rarer sums (closer to 2/12) are rated harder than common sums (7)
 */

import { describe, it, expect } from 'vitest';
import { sumOfTwoDiceTemplate } from './sum-of-two-dice';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';

describe('sum-of-two-dice', () => {
  it('passes expectTemplateAgrees (Monte-Carlo + render-consistency)', () => {
    expect(() =>
      expectTemplateAgrees(sumOfTwoDiceTemplate, {
        seed: 0xd1ce_d1ce,
        samples: 500,
        trials: 10_000,
        checkAnswer,
        answerToPayload,
      }),
    ).not.toThrow();
  });

  it('rate is higher for rarer sums (k=7 easiest, k=2 hardest)', () => {
    const r7 = sumOfTwoDiceTemplate.rate({ k: 7 });
    const r9 = sumOfTwoDiceTemplate.rate({ k: 9 });
    const r11 = sumOfTwoDiceTemplate.rate({ k: 11 });
    const r12 = sumOfTwoDiceTemplate.rate({ k: 12 });
    expect(r7).toBeLessThan(r9);
    expect(r9).toBeLessThan(r11);
    expect(r11).toBeLessThan(r12);
  });

  it('rate stays within Elo range [700, 2000]', () => {
    for (let k = 2; k <= 12; k++) {
      const r = sumOfTwoDiceTemplate.rate({ k });
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('solve returns the correct reduced fraction for all k ∈ {2..12}', () => {
    const expected: Record<number, [number, number]> = {
      2: [1, 36], 3: [1, 18], 4: [1, 12], 5: [1, 9], 6: [5, 36], 7: [1, 6],
      8: [5, 36], 9: [1, 9], 10: [1, 12], 11: [1, 18], 12: [1, 36],
    };
    for (const [k, [num, den]] of Object.entries(expected)) {
      const answer = sumOfTwoDiceTemplate.solve({ k: Number(k) });
      if (answer.kind !== 'fraction') throw new Error('expected fraction');
      expect(Number(answer.value.num)).toBe(num);
      expect(Number(answer.value.den)).toBe(den);
    }
  });

  it('render derives numerator/denominator from solve', () => {
    for (let k = 2; k <= 12; k++) {
      const answer = sumOfTwoDiceTemplate.solve({ k });
      const variant = sumOfTwoDiceTemplate.render({ k });
      if (answer.kind !== 'fraction') throw new Error('expected fraction');
      if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
      // Cross-multiply check: variant.num / variant.den == answer.num / answer.den
      expect(Number(variant.numerator) * Number(answer.value.den))
        .toBe(Number(answer.value.num) * Number(variant.denominator));
    }
  });
});
