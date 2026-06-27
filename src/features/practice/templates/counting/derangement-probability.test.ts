import { describe, it, expect } from 'vitest';
import { derangementProbabilityTemplate as t } from './derangement-probability';
import { expectTemplateAgrees } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';

describe('derangement-probability', () => {
  it('exact solver agrees with Monte-Carlo and render round-trips', () => {
    expect(() =>
      expectTemplateAgrees(t, { samples: 120, trials: 30000, checkAnswer, answerToPayload }),
    ).not.toThrow();
  });

  it('matches hand-computed derangement cases (n=3 → 1/3, n=4 → 3/8)', () => {
    const a3 = t.solve({ n: 3 });
    expect(a3.kind).toBe('fraction');
    if (a3.kind !== 'fraction') return;
    expect(Number(a3.value.num)).toBe(1);
    expect(Number(a3.value.den)).toBe(3);

    const a4 = t.solve({ n: 4 });
    expect(a4.kind).toBe('fraction');
    if (a4.kind !== 'fraction') return;
    expect(Number(a4.value.num)).toBe(3);
    expect(Number(a4.value.den)).toBe(8);
  });

  it('stays in Elo range across the parameter space', () => {
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
});
