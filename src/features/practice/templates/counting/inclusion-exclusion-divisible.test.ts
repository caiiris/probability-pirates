import { describe, it, expect } from 'vitest';
import { inclusionExclusionDivisibleTemplate as t } from './inclusion-exclusion-divisible';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, eqF } from '@/lib/probability/exact';

describe('inclusion-exclusion-divisible', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('matches a hand-computed case (1..30, divisible by 2 or 3)', () => {
    // ⌊30/2⌋ + ⌊30/3⌋ − ⌊30/6⌋ = 15 + 10 − 5 = 20, over 30 → 2/3.
    const answer = t.solve({ N: 30, a: 2, b: 3 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind !== 'fraction') return;
    expect(Number(answer.value.num)).toBe(2);
    expect(Number(answer.value.den)).toBe(3);
  });

  it('always picks two distinct divisors and stays in Elo range', () => {
    const rng = (() => {
      let s = 0x1234;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    })();
    for (let i = 0; i < 200; i++) {
      const params = t.sample(rng);
      expect(params.a).not.toBe(params.b);
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('trap tag: forgot_overlap present with correct value for N=30, a=2, b=3', () => {
    // correct = 2/3 (= 20/30), trap = (15+10)/30 = 25/30 = 5/6
    const variant = t.render({ N: 30, a: 2, b: 3 });
    expect(variant.interactionKind).toBe('fill-fraction');
    if (variant.interactionKind !== 'fill-fraction') return;
    const tags = variant.misconceptionByFraction;
    expect(tags).toBeDefined();
    expect(tags!.length).toBeGreaterThanOrEqual(1);
    const tag = tags!.find((e) => e.key === 'forgot_overlap');
    expect(tag).toBeDefined();
    // trap = frac(25, 30) = 5/6
    const trapFrac = frac(25, 30);
    expect(tag!.num).toBe(Number(trapFrac.num));
    expect(tag!.den).toBe(Number(trapFrac.den));
    // trap must differ from the correct answer
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(frac(tag!.num, tag!.den), correct)).toBe(false);
  });
});
