import { describe, it, expect } from 'vitest';
import { inclusionExclusionTwoEventsTemplate as t } from './inclusion-exclusion-two-events';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, eqF } from '@/lib/probability/exact';

describe('inclusion-exclusion-two-events', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('matches a hand-computed case (class of 20, 8 play X, 7 play Y, 3 both)', () => {
    // A = c + x = 3 + 5 = 8, B = c + y = 3 + 4 = 7, union = 5 + 4 + 3 = 12, over 20 → 3/5.
    const answer = t.solve({ N: 20, c: 3, x: 5, y: 4, flavor: 0 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind !== 'fraction') return;
    expect(Number(answer.value.num)).toBe(3);
    expect(Number(answer.value.den)).toBe(5);
  });

  it('is tagged to the inclusion-exclusion category and stays in Elo range', () => {
    expect(t.topic).toBe('inclusion-exclusion');
    const rng = (() => {
      let s = 0x51ab;
      return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    })();
    for (let i = 0; i < 200; i++) {
      const params = t.sample(rng);
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('trap tag: forgot_overlap present with correct value for N=20, c=3, x=5, y=4', () => {
    // A=8, B=7; trap = (8+7)/20 = 15/20 = 3/4; correct = 12/20 = 3/5
    const variant = t.render({ N: 20, c: 3, x: 5, y: 4, flavor: 0 });
    expect(variant.interactionKind).toBe('fill-fraction');
    if (variant.interactionKind !== 'fill-fraction') return;
    const tags = variant.misconceptionByFraction;
    expect(tags).toBeDefined();
    expect(tags!.length).toBeGreaterThanOrEqual(1);
    const tag = tags!.find((e) => e.key === 'forgot_overlap');
    expect(tag).toBeDefined();
    // trap = frac(15, 20) = 3/4
    const trapFrac = frac(15, 20);
    expect(tag!.num).toBe(Number(trapFrac.num));
    expect(tag!.den).toBe(Number(trapFrac.den));
    // trap must differ from the correct answer
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(frac(tag!.num, tag!.den), correct)).toBe(false);
  });
});
