/**
 * Vetting test for at-least-one-via-complement template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check + render-consistency
 * 2. Rate monotonicity: larger n → harder; larger m → harder
 * 3. Exact solve spot-checks
 */

import { describe, it, expect } from 'vitest';
import { atLeastOneViaComplementTemplate as t } from './at-least-one-via-complement';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { toNumber } from '@/lib/probability/exact';

describe('at-least-one-via-complement', () => {
  it('passes expectTemplateAgrees (Monte-Carlo + render-consistency)', () => {
    expect(() =>
      expectTemplateAgrees(t, {
        seed: 0xc0_ffee_ab,
        samples: 500,
        trials: 10_000,
        checkAnswer,
        answerToPayload,
      }),
    ).not.toThrow();
  });

  it('rate grows with n (fixed m=2)', () => {
    expect(t.rate({ m: 2, n: 2 })).toBeLessThan(t.rate({ m: 2, n: 3 }));
    expect(t.rate({ m: 2, n: 3 })).toBeLessThan(t.rate({ m: 2, n: 5 }));
  });

  it('rate grows with m (fixed n=3)', () => {
    expect(t.rate({ m: 2, n: 3 })).toBeLessThan(t.rate({ m: 4, n: 3 }));
    expect(t.rate({ m: 4, n: 3 })).toBeLessThan(t.rate({ m: 6, n: 3 }));
  });

  it('rate stays within Elo range [700, 2000]', () => {
    for (const m of [2, 4, 6]) {
      for (let n = 2; n <= 5; n++) {
        const r = t.rate({ m, n });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
      }
    }
  });

  it('solve: P(at least one head in 2 flips) = 3/4', () => {
    const a = t.solve({ m: 2, n: 2 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(3);
    expect(Number(a.value.den)).toBe(4);
  });

  it('solve: P(at least one 6 in 4 rolls) = 671/1296', () => {
    // 1 - (5/6)^4 = 1 - 625/1296 = 671/1296
    const a = t.solve({ m: 6, n: 4 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(671);
    expect(Number(a.value.den)).toBe(1296);
  });

  it('solve: exact probability is in (0, 1) for all valid params', () => {
    for (const m of [2, 4, 6]) {
      for (let n = 2; n <= 5; n++) {
        const a = t.solve({ m, n });
        expect(a.kind).toBe('fraction');
        if (a.kind !== 'fraction') return;
        const p = toNumber(a.value);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
      }
    }
  });
});
