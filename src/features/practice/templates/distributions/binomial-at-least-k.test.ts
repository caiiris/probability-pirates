import { describe, it, expect } from 'vitest';
import { binomialAtLeastKTemplate as t } from './binomial-at-least-k';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { nCr } from '@/lib/probability/exact';

describe('binomial-at-least-k', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('solve equals the cumulative binomial tail for a known case', () => {
    // n=4, k=2 → C(4,2)+C(4,3)+C(4,4) = 6+4+1 = 11, over 16.
    const answer = t.solve({ n: 4, k: 2 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind !== 'fraction') return;
    expect(Number(answer.value.num)).toBe(11);
    expect(Number(answer.value.den)).toBe(16);
    // sanity: matches direct nCr sum
    const direct = Number(nCr(4, 2) + nCr(4, 3) + nCr(4, 4));
    expect(direct).toBe(11);
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let n = 4; n <= 7; n++) {
      for (let k = 2; k <= n - 1; k++) {
        const r = t.rate({ n, k });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
      }
    }
  });
});
