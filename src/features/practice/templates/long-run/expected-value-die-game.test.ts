import { describe, it, expect } from 'vitest';
import { expectedValueDieGameTemplate as t } from './expected-value-die-game';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { mulberry32 } from '@/lib/simulations';
import { toNumber } from '@/lib/probability/exact';

const DIE_SIDES = [4, 6, 8, 10, 12];

describe('expected-value-die-game', () => {
  it('exact E equals (s+1)/2 and the simulated mean agrees', () => {
    const sim = t.simulate;
    expect(sim).toBeDefined();
    for (const s of DIE_SIDES) {
      const answer = t.solve({ s });
      expect(answer.kind).toBe('fraction');
      if (answer.kind !== 'fraction') continue;
      const exact = toNumber(answer.value);
      expect(exact).toBe((s + 1) / 2);

      const rng = mulberry32(0xabcd + s);
      const mean = sim!({ s }, 200_000, rng);
      // SE of a single die mean over 200k rolls is < 0.01; 0.1 is a safe band.
      expect(Math.abs(mean - exact)).toBeLessThan(0.1);
    }
  });

  it('render round-trips through checkAnswer', () => {
    for (const s of DIE_SIDES) {
      const answer = t.solve({ s });
      const variant = t.render({ s });
      const payload = answerToPayload(answer, variant);
      expect(checkAnswer(variant, payload).wasCorrect).toBe(true);
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (const s of DIE_SIDES) {
      const r = t.rate({ s });
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });
});
