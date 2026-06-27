import { describe, it, expect } from 'vitest';
import { conditionalTwoWayTableTemplate as t } from './conditional-two-way-table';
import { expectExactEnumeration } from '../testUtils';
import { checkAnswer } from '@/lib/checkAnswer';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { frac, eqF } from '@/lib/probability/exact';

type Params = { a: number; b: number; c: number; d: number };

const REPRESENTATIVE: Params[] = [
  { a: 6, b: 6, c: 6, d: 6 },
  { a: 30, b: 30, c: 30, d: 30 },
  { a: 6, b: 30, c: 12, d: 18 },
  { a: 30, b: 6, c: 18, d: 12 },
  { a: 12, b: 18, c: 24, d: 6 },
  { a: 15, b: 15, c: 7, d: 29 },
  { a: 20, b: 10, c: 13, d: 11 },
  { a: 7, b: 21, c: 30, d: 6 },
];

describe('conditional-two-way-table', () => {
  it('exact solver matches a/(a+b) over a representative param list', () => {
    expect(() =>
      expectExactEnumeration(t, REPRESENTATIVE, ({ a, b }, answer) => {
        if (answer.kind !== 'fraction') throw new Error('expected fraction');
        if (!eqF(answer.value, frac(a, a + b))) throw new Error('mismatch');
        // INPUT CAP: reduced numerator and denominator both < 9999.
        if (Number(answer.value.num) >= 9999 || Number(answer.value.den) >= 9999) {
          throw new Error('input cap exceeded');
        }
        return true;
      }),
    ).not.toThrow();
  });

  it('render round-trips through checkAnswer for each representative param', () => {
    for (const params of REPRESENTATIVE) {
      const variant = t.render(params);
      const answer = t.solve(params);
      const payload = answerToPayload(answer, variant);
      const result = checkAnswer(variant, payload);
      expect(result.wasCorrect).toBe(true);
    }
  });

  it('hand-computed case: a=6,b=6 → 1/2', () => {
    const answer = t.solve({ a: 6, b: 6, c: 10, d: 20 });
    expect(answer.kind).toBe('fraction');
    if (answer.kind === 'fraction') {
      expect(eqF(answer.value, frac(1, 2))).toBe(true);
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (let a = 6; a <= 30; a++) {
      for (let b = 6; b <= 30; b++) {
        const rate = t.rate({ a, b, c: 6, d: 30 });
        expect(rate).toBeGreaterThanOrEqual(700);
        expect(rate).toBeLessThanOrEqual(2000);
      }
    }
  });
});
