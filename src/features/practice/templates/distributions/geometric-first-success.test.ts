import { describe, it, expect } from 'vitest';
import { geometricFirstSuccessTemplate as t } from './geometric-first-success';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';

describe('geometric-first-success', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let m = 2; m <= 6; m++) {
      for (let k = 1; k <= 4; k++) {
        const r = t.rate({ m, k });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
      }
    }
  });
});
