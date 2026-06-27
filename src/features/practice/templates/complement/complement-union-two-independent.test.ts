/**
 * Vetting test for complement-union-two-independent template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check + render-consistency
 * 2. Hand-computed exact case
 * 3. Rate stays within the Elo range for every sampled param
 */

import { describe, it, expect } from 'vitest';
import { complementUnionTwoIndependentTemplate as t } from './complement-union-two-independent';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, mulF, eqF, toNumber } from '@/lib/probability/exact';
import type { FillFractionVariant } from '@/content/types';

describe('complement-union-two-independent', () => {
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

  it('solve: a=2, b=2 → P(A∪B) = 3/4', () => {
    const a = t.solve({ a: 2, b: 2 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(3);
    expect(Number(a.value.den)).toBe(4);
  });

  it('rate stays within [700, 2000] and num/den under 9999 for every param', () => {
    for (const a of [2, 3, 4]) {
      for (const b of [2, 3, 4, 5]) {
        const r = t.rate({ a, b });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
        const ans = t.solve({ a, b });
        expect(ans.kind).toBe('fraction');
        if (ans.kind !== 'fraction') return;
        expect(Number(ans.value.num)).toBeLessThan(9999);
        expect(Number(ans.value.den)).toBeLessThan(9999);
        const p = toNumber(ans.value);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    }
  });

  it('misconceptionByFraction: trap = P(neither) with key complement_inversion, differs from correct answer', () => {
    const params = { a: 2, b: 3 };
    const variant = t.render(params) as FillFractionVariant;
    expect(variant.misconceptionByFraction).toBeDefined();
    const trap = frac(variant.misconceptionByFraction![0].num, variant.misconceptionByFraction![0].den);
    const expectedTrap = mulF(frac(params.a - 1, params.a), frac(params.b - 1, params.b));
    expect(eqF(trap, expectedTrap)).toBe(true);
    expect(variant.misconceptionByFraction![0].key).toBe('complement_inversion');
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(trap, correct)).toBe(false);
  });
});
