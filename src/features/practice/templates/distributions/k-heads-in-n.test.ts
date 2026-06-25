/**
 * Vetting test for k-heads-in-n template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check + render-consistency
 * 2. Rate monotonicity: larger n → harder
 * 3. Exact solve spot-checks
 */

import { describe, it, expect } from 'vitest';
import { kHeadsInNTemplate as t } from './k-heads-in-n';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';

describe('k-heads-in-n', () => {
  it('passes expectTemplateAgrees (Monte-Carlo + render-consistency)', () => {
    expect(() =>
      expectTemplateAgrees(t, {
        seed: 0xf11b_5eed,
        samples: 500,
        trials: 10_000,
        checkAnswer,
        answerToPayload,
      }),
    ).not.toThrow();
  });

  it('rate grows with n', () => {
    expect(t.rate({ n: 2, k: 1 })).toBeLessThan(t.rate({ n: 5, k: 2 }));
    expect(t.rate({ n: 5, k: 2 })).toBeLessThan(t.rate({ n: 8, k: 4 }));
  });

  it('rate stays within Elo range [700, 2000]', () => {
    for (let n = 2; n <= 8; n++) {
      const r = t.rate({ n, k: Math.floor(n / 2) });
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('solve: P(exactly 1 head in 2 flips) = 1/2', () => {
    const a = t.solve({ n: 2, k: 1 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(1);
    expect(Number(a.value.den)).toBe(2);
  });

  it('solve: P(exactly 3 heads in 4 flips) = 1/4', () => {
    // C(4,3) / 2^4 = 4/16 = 1/4
    const a = t.solve({ n: 4, k: 3 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(1);
    expect(Number(a.value.den)).toBe(4);
  });

  it('solve: P(0 heads in 8 flips) = 1/256', () => {
    const a = t.solve({ n: 8, k: 0 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(1);
    expect(Number(a.value.den)).toBe(256);
  });

  it('probabilities for all k sum to 1 for a given n', () => {
    for (let n = 2; n <= 6; n++) {
      let numSum = 0n;
      let den = 0n;
      for (let k = 0; k <= n; k++) {
        const a = t.solve({ n, k });
        if (a.kind !== 'fraction') throw new Error('expected fraction');
        if (den === 0n) den = a.value.den;
        numSum += a.value.num * (den / a.value.den);
      }
      // Sum of all P(k heads in n flips) should equal 1
      expect(Number(numSum)).toBe(Number(den));
    }
  });

  it('render derives numerator/denominator from solve', () => {
    const testCases: Array<{ n: number; k: number }> = [
      { n: 3, k: 1 }, { n: 5, k: 2 }, { n: 8, k: 4 },
    ];
    for (const params of testCases) {
      const answer = t.solve(params);
      const variant = t.render(params);
      if (answer.kind !== 'fraction') throw new Error('expected fraction');
      if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
      expect(Number(variant.numerator) * Number(answer.value.den))
        .toBe(Number(answer.value.num) * Number(variant.denominator));
    }
  });
});
