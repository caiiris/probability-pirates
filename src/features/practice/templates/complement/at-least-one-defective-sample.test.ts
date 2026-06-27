/**
 * Vetting test for at-least-one-defective-sample template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check + render-consistency
 * 2. Hand-computed exact case
 * 3. Rate stays within the Elo range (and ≤ 1600) for every sampled param,
 *    and the without-replacement constraint k ≤ N − d always holds.
 */

import { describe, it, expect } from 'vitest';
import { atLeastOneDefectiveSampleTemplate as t } from './at-least-one-defective-sample';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, nCr, eqF, toNumber } from '@/lib/probability/exact';
import type { FillFractionVariant } from '@/content/types';

describe('at-least-one-defective-sample', () => {
  it('passes expectTemplateAgrees (Monte-Carlo + render-consistency)', () => {
    expect(() =>
      expectTemplateAgrees(t, {
        samples: 120,
        trials: 30_000,
        checkAnswer,
        answerToPayload,
      }),
    ).not.toThrow();
  });

  it('solve: N=10, d=2, k=2 → 1 − C(8,2)/C(10,2) = 17/45', () => {
    // C(10,2)=45, C(8,2)=28, (45-28)/45 = 17/45
    const a = t.solve({ N: 10, d: 2, k: 2 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(17);
    expect(Number(a.value.den)).toBe(45);
  });

  it('rate within [700, 1600], num/den < 9999, and k ≤ N − d for every param', () => {
    for (const N of [8, 10, 12]) {
      for (const d of [2, 3]) {
        for (const k of [2, 3, 4]) {
          expect(k).toBeLessThanOrEqual(N - d);
          const r = t.rate({ N, d, k });
          expect(r).toBeGreaterThanOrEqual(700);
          expect(r).toBeLessThanOrEqual(1600);
          const ans = t.solve({ N, d, k });
          expect(ans.kind).toBe('fraction');
          if (ans.kind !== 'fraction') return;
          expect(Number(ans.value.num)).toBeLessThan(9999);
          expect(Number(ans.value.den)).toBeLessThan(9999);
          const p = toNumber(ans.value);
          expect(p).toBeGreaterThan(0);
          expect(p).toBeLessThan(1);
        }
      }
    }
  });

  it('misconceptionByFraction: trap = P(none defective) with key complement_inversion, differs from correct answer', () => {
    const params = { N: 10, d: 2, k: 2 };
    const variant = t.render(params) as FillFractionVariant;
    expect(variant.misconceptionByFraction).toBeDefined();
    const trap = frac(variant.misconceptionByFraction![0].num, variant.misconceptionByFraction![0].den);
    const expectedTrap = frac(nCr(params.N - params.d, params.k), nCr(params.N, params.k));
    expect(eqF(trap, expectedTrap)).toBe(true);
    expect(variant.misconceptionByFraction![0].key).toBe('complement_inversion');
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(trap, correct)).toBe(false);
  });
});
