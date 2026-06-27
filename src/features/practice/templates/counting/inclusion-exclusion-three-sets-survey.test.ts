import { describe, it, expect } from 'vitest';
import { inclusionExclusionThreeSetsSurveyTemplate as t } from './inclusion-exclusion-three-sets-survey';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, eqF } from '@/lib/probability/exact';

describe('inclusion-exclusion-three-sets-survey', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('matches a hand-computed case', () => {
    // Regions: oa=2,ob=3,oc=1,ab=2,ac=1,bc=3,t=1,none=4
    // union = 2+3+1+2+1+3+1 = 13, N = 13+4 = 17 → 13/17.
    const answer = t.solve({ oa: 2, ob: 3, oc: 1, ab: 2, ac: 1, bc: 3, t: 1, none: 4 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind !== 'fraction') return;
    expect(Number(answer.value.num)).toBe(13);
    expect(Number(answer.value.den)).toBe(17);
  });

  it('stays in Elo range across sampled params', () => {
    const rng = (() => {
      let s = 0x1234;
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

  it('trap tag: forgot_overlap present with correct value for hand-computed case', () => {
    // Regions: oa=2,ob=3,oc=1,ab=2,ac=1,bc=3,t=1,none=4; N=17
    // sizeA = 2+2+1+1=6, sizeB = 3+2+3+1=9, sizeC = 1+1+3+1=6
    // trapNum = 6+9+6 = 21; trap = frac(21,17) = 21/17; correct = 13/17
    const params = { oa: 2, ob: 3, oc: 1, ab: 2, ac: 1, bc: 3, t: 1, none: 4 };
    const variant = t.render(params);
    expect(variant.interactionKind).toBe('fill-fraction');
    if (variant.interactionKind !== 'fill-fraction') return;
    const tags = variant.misconceptionByFraction;
    expect(tags).toBeDefined();
    expect(tags!.length).toBeGreaterThanOrEqual(1);
    const tag = tags!.find((e) => e.key === 'forgot_overlap');
    expect(tag).toBeDefined();
    // trap = frac(21, 17) = 21/17 (already reduced)
    const trapFrac = frac(21, 17);
    expect(tag!.num).toBe(Number(trapFrac.num));
    expect(tag!.den).toBe(Number(trapFrac.den));
    // trap must differ from the correct answer
    const correct = frac(variant.numerator, variant.denominator);
    expect(eqF(frac(tag!.num, tag!.den), correct)).toBe(false);
  });
});
