/**
 * Vetting test for conditional-bayes-2x2 template.
 *
 * 1. expectTemplateAgrees: Monte-Carlo cross-check + render-consistency
 * 2. Rate monotonicity: lower P(disease|test+) → harder
 * 3. Exact solve spot-checks
 */

import { describe, it, expect } from 'vitest';
import { conditionalBayes2x2Template as t } from './conditional-bayes-2x2';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';

describe('conditional-bayes-2x2', () => {
  it('passes expectTemplateAgrees (Monte-Carlo + render-consistency)', () => {
    expect(() =>
      expectTemplateAgrees(t, {
        seed: 0xba_7e_542,
        samples: 500,
        trials: 10_000,
        checkAnswer,
        answerToPayload,
      }),
    ).not.toThrow();
  });

  it('rate is higher when P(disease|test+) is low (harder = more counterintuitive)', () => {
    // High precision: tp=20, fp=10 → P=20/30≈0.67 → moderate
    const rHigh = t.rate({ tp: 20, fp: 10, fn: 5, tn: 100 });
    // Low precision: tp=5, fp=95 → P=5/100=0.05 → very hard
    const rLow = t.rate({ tp: 5, fp: 95, fn: 5, tn: 100 });
    expect(rLow).toBeGreaterThan(rHigh);
  });

  it('rate stays within Elo range [700, 2000]', () => {
    const cases = [
      { tp: 1, fp: 1, fn: 1, tn: 1 },    // p = 0.5
      { tp: 1, fp: 99, fn: 1, tn: 899 },  // p ≈ 0.01 (very hard)
      { tp: 50, fp: 1, fn: 1, tn: 100 },  // p ≈ 0.98 (easy)
    ];
    for (const params of cases) {
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('solve: P(disease|test+) = tp/(tp+fp) reduced', () => {
    // tp=10, fp=10 → 10/20 = 1/2
    const a = t.solve({ tp: 10, fp: 10, fn: 5, tn: 100 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(1);
    expect(Number(a.value.den)).toBe(2);
  });

  it('solve: tp=3, fp=9 → 3/12 = 1/4', () => {
    const a = t.solve({ tp: 3, fp: 9, fn: 2, tn: 50 });
    expect(a.kind).toBe('fraction');
    if (a.kind !== 'fraction') return;
    expect(Number(a.value.num)).toBe(1);
    expect(Number(a.value.den)).toBe(4);
  });

  it('render derives numerator/denominator from solve', () => {
    const cases = [
      { tp: 5, fp: 15, fn: 3, tn: 77 },
      { tp: 12, fp: 48, fn: 8, tn: 132 },
    ];
    for (const params of cases) {
      const answer = t.solve(params);
      const variant = t.render(params);
      if (answer.kind !== 'fraction') throw new Error('expected fraction');
      if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
      expect(Number(variant.numerator) * Number(answer.value.den))
        .toBe(Number(answer.value.num) * Number(variant.denominator));
    }
  });
});
