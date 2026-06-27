import { describe, it, expect } from 'vitest';
import { inclusionExclusionThreeDivisorsTemplate as t } from './inclusion-exclusion-three-divisors';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, eqF } from '@/lib/probability/exact';

describe('inclusion-exclusion-three-divisors', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('matches a hand-computed case (1..30, divisible by 2, 3, or 5)', () => {
    // ⌊30/2⌋+⌊30/3⌋+⌊30/5⌋ − ⌊30/6⌋−⌊30/10⌋−⌊30/15⌋ + ⌊30/30⌋
    // = 15+10+6 − 5−3−2 + 1 = 22, over 30 → 11/15.
    const answer = t.solve({ N: 30, a: 2, b: 3, c: 5 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind !== 'fraction') return;
    expect(Number(answer.value.num)).toBe(11);
    expect(Number(answer.value.den)).toBe(15);
  });

  it('always picks three distinct divisors and stays in Elo range', () => {
    const rng = (() => {
      let s = 0x1234;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    })();
    for (let i = 0; i < 200; i++) {
      const params = t.sample(rng);
      const { a, b, c } = params;
      expect(new Set([a, b, c]).size).toBe(3);
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('trap tag: forgot_overlap present with correct value for N=30, a=2, b=3, c=5', () => {
    // trap = (15+10+6)/30 = 31/30; correct = 22/30 = 11/15
    const variant = t.render({ N: 30, a: 2, b: 3, c: 5 });
    expect(variant.interactionKind).toBe('fill-fraction');
    if (variant.interactionKind !== 'fill-fraction') return;
    const tags = variant.misconceptionByFraction;
    expect(tags).toBeDefined();
    expect(tags!.length).toBeGreaterThanOrEqual(1);
    const tag = tags!.find((e) => e.key === 'forgot_overlap');
    expect(tag).toBeDefined();
    // trap = frac(31, 30) = 31/30 (already reduced)
    const trapFrac = frac(31, 30);
    expect(tag!.num).toBe(Number(trapFrac.num));
    expect(tag!.den).toBe(Number(trapFrac.den));
    // trap must differ from the correct answer
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(frac(tag!.num, tag!.den), correct)).toBe(false);
  });
});
