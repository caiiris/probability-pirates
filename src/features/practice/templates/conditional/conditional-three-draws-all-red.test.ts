import { describe, it, expect } from 'vitest';
import { conditionalThreeDrawsAllRedTemplate as t } from './conditional-three-draws-all-red';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, mulF, eqF } from '@/lib/probability/exact';

describe('conditional-three-draws-all-red', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('hand-computed case: r=3,b=3 → (3/6)(2/5)(1/4) = 1/20', () => {
    const answer = t.solve({ r: 3, b: 3 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind === 'fraction') {
      expect(eqF(answer.value, frac(1, 20))).toBe(true);
    }
  });

  it('input cap: reduced numerator and denominator both < 9999', () => {
    for (let r = 3; r <= 6; r++) {
      for (let b = 3; b <= 6; b++) {
        const total = r + b;
        const expected = mulF(
          mulF(frac(r, total), frac(r - 1, total - 1)),
          frac(r - 2, total - 2),
        );
        const answer = t.solve({ r, b });
        if (answer.kind !== 'fraction') throw new Error('expected fraction');
        expect(eqF(answer.value, expected)).toBe(true);
        expect(Number(answer.value.num)).toBeLessThan(9999);
        expect(Number(answer.value.den)).toBeLessThan(9999);
      }
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let r = 3; r <= 6; r++) {
      for (let b = 3; b <= 6; b++) {
        const rate = t.rate({ r, b });
        expect(rate).toBeGreaterThanOrEqual(700);
        expect(rate).toBeLessThanOrEqual(2000);
      }
    }
  });

  it('misconceptionByFraction: replacement_confusion trap equals (r/(r+b))³ for r=3,b=3', () => {
    // r=3, b=3, total=6
    // trap = (3/6)³ = (1/2)³ = 1/8
    // correct = (3/6)(2/5)(1/4) = 1/20 — must differ
    const params = { r: 3, b: 3 };
    const variant = t.render(params);
    if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
    const tags = variant.misconceptionByFraction ?? [];
    const trapTag = tags.find(e => e.key === 'replacement_confusion');
    expect(trapTag).toBeDefined();
    if (!trapTag) return;

    const expectedTrap = mulF(mulF(frac(3, 6), frac(3, 6)), frac(3, 6)); // 1/8
    expect(eqF({ num: BigInt(trapTag.num), den: BigInt(trapTag.den) }, expectedTrap)).toBe(true);

    const correct = t.solve(params); // 1/20
    if (correct.kind !== 'fraction') throw new Error('expected fraction');
    expect(eqF({ num: BigInt(trapTag.num), den: BigInt(trapTag.den) }, correct.value)).toBe(false);
  });
});
