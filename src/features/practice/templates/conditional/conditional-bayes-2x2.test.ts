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
import { frac, eqF } from '@/lib/probability/exact';

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

  it('misconceptionByFraction: base_rate_neglect trap equals sensitivity tp/(tp+fn) for tp=10,fp=10,fn=5', () => {
    // correct = 10/(10+10) = 1/2
    // trap    = 10/(10+5)  = 2/3  — must differ from correct
    const params = { tp: 10, fp: 10, fn: 5, tn: 100 };
    const variant = t.render(params);
    if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
    const tags = variant.misconceptionByFraction ?? [];
    const trapTag = tags.find(e => e.key === 'base_rate_neglect');
    expect(trapTag).toBeDefined();
    if (!trapTag) return;

    const expectedTrap = frac(10, 15); // 2/3
    expect(eqF({ num: BigInt(trapTag.num), den: BigInt(trapTag.den) }, expectedTrap)).toBe(true);

    const correct = t.solve(params); // 1/2
    if (correct.kind !== 'fraction') throw new Error('expected fraction');
    expect(eqF({ num: BigInt(trapTag.num), den: BigInt(trapTag.den) }, correct.value)).toBe(false);
  });

  it('misconceptionByFraction: no trap when sensitivity equals PPV', () => {
    // tp/(tp+fp) = tp/(tp+fn) when fp === fn
    // tp=6, fp=4, fn=4, tn=50 → correct=6/10=3/5; trap=6/10=3/5 — same, so tag omitted
    const params = { tp: 6, fp: 4, fn: 4, tn: 50 };
    const variant = t.render(params);
    if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
    const tags = variant.misconceptionByFraction ?? [];
    const trapTag = tags.find(e => e.key === 'base_rate_neglect');
    expect(trapTag).toBeUndefined();
  });
});
