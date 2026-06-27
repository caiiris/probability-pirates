/**
 * Vetting test for at-least-one-win-raffle template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check + render-consistency
 * 2. Hand-computed exact case
 * 3. Rate stays within the Elo range for every sampled param
 */

import { describe, it, expect } from 'vitest';
import { atLeastOneWinRaffleTemplate as t } from './at-least-one-win-raffle';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, mulF, eqF, toNumber } from '@/lib/probability/exact';
import type { FillFractionVariant } from '@/content/types';

/** Local powF for test assertions (same logic as the template). */
function powF(base: ReturnType<typeof frac>, exp: number): ReturnType<typeof frac> {
  let result = frac(1);
  for (let i = 0; i < exp; i++) result = mulF(result, base);
  return result;
}

describe('at-least-one-win-raffle', () => {
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

  it('solve: s=6, n=4 → 1 − (5/6)^4 = 671/1296', () => {
    const a = t.solve({ s: 6, n: 4 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(671);
    expect(Number(a.value.den)).toBe(1296);
  });

  it('rate stays within [700, 2000] and num/den under 9999 for every param', () => {
    for (const s of [3, 4, 5, 6]) {
      for (const n of [2, 3, 4]) {
        const r = t.rate({ s, n });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
        const ans = t.solve({ s, n });
        expect(ans.kind).toBe('fraction');
        if (ans.kind !== 'fraction') return;
        expect(Number(ans.value.num)).toBeLessThan(9999);
        expect(Number(ans.value.den)).toBeLessThan(9999);
        const p = toNumber(ans.value);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
      }
    }
  });

  it('misconceptionByFraction: trap = P(all miss) with key complement_inversion, differs from correct answer', () => {
    const params = { s: 6, n: 4 };
    const variant = t.render(params) as FillFractionVariant;
    expect(variant.misconceptionByFraction).toBeDefined();
    const trap = frac(variant.misconceptionByFraction![0].num, variant.misconceptionByFraction![0].den);
    const expectedTrap = powF(frac(params.s - 1, params.s), params.n);
    expect(eqF(trap, expectedTrap)).toBe(true);
    expect(variant.misconceptionByFraction![0].key).toBe('complement_inversion');
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(trap, correct)).toBe(false);
  });
});
