import { describe, it, expect } from 'vitest';
import { singleEventProbTemplate as t } from './single-event-prob';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';

describe('single-event-prob', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 25000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let red = 1; red <= 5; red++) {
      for (let blue = 1; blue <= 5; blue++) {
        const r = t.rate({ red, blue });
        expect(r).toBeGreaterThanOrEqual(700);
        expect(r).toBeLessThanOrEqual(2000);
      }
    }
  });
});
