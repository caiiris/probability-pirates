import { describe, it, expect } from 'vitest';
import { withoutReplacementTwoDrawsTemplate as t } from './without-replacement-two-draws';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, mulF, eqF } from '@/lib/probability/exact';

describe('without-replacement-two-draws', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let r = 2; r <= 5; r++) {
      for (let b = 2; b <= 5; b++) {
        const rate = t.rate({ r, b });
        expect(rate).toBeGreaterThanOrEqual(700);
        expect(rate).toBeLessThanOrEqual(2000);
      }
    }
  });

  it('misconceptionByFraction: replacement_confusion trap equals (r/(r+b))² for r=2,b=3', () => {
    // r=2, b=3, total=5
    // trap = (2/5)² = 4/25
    // correct = (2/5)(1/4) = 1/10 — must differ
    const params = { r: 2, b: 3 };
    const variant = t.render(params);
    if (variant.interactionKind !== 'fill-fraction') throw new Error('expected fill-fraction');
    const tags = variant.misconceptionByFraction ?? [];
    const trapTag = tags.find(e => e.key === 'replacement_confusion');
    expect(trapTag).toBeDefined();
    if (!trapTag) return;

    const expectedTrap = mulF(frac(2, 5), frac(2, 5)); // 4/25
    expect(eqF({ num: BigInt(trapTag.num), den: BigInt(trapTag.den) }, expectedTrap)).toBe(true);

    const correct = t.solve(params);
    if (correct.kind !== 'fraction') throw new Error('expected fraction');
    expect(eqF({ num: BigInt(trapTag.num), den: BigInt(trapTag.den) }, correct.value)).toBe(false);
  });
});
