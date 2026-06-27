import { describe, it, expect } from 'vitest';
import { committeeWithConstraintTemplate as t } from './committee-with-constraint';
import { expectExactEnumeration } from '../testUtils';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { nCr } from '@/lib/probability/exact';

type Params = { g: number; b: number; k: number; j: number };

function allParams(): Params[] {
  const out: Params[] = [];
  for (const g of [4, 5, 6]) {
    for (const b of [4, 5, 6]) {
      for (const k of [3, 4]) {
        for (let j = 1; j <= k - 1; j++) {
          if (j <= g && k - j <= b) out.push({ g, b, k, j });
        }
      }
    }
  }
  return out;
}

describe('committee-with-constraint', () => {
  it('solve = C(g,j)·C(b,k-j) and render round-trips through checkAnswer', () => {
    expect(() =>
      expectExactEnumeration(t, allParams(), (params, answer) => {
        if (answer.kind !== 'int') return false;
        const expected = Number(nCr(params.g, params.j) * nCr(params.b, params.k - params.j));
        if (answer.value !== expected) return false;
        const variant = t.render(params);
        return checkAnswer(variant, answerToPayload(answer, variant)).wasCorrect;
      }),
    ).not.toThrow();
  });

  it('matches a hand-computed case: g=6,b=6,k=4,j=2 → C(6,2)·C(6,2) = 15·15 = 225', () => {
    const answer = t.solve({ g: 6, b: 6, k: 4, j: 2 });
    expect(answer).toEqual({ kind: 'int', value: 225 });
    const variant = t.render({ g: 6, b: 6, k: 4, j: 2 });
    expect(variant.interactionKind).toBe('number-fill');
    expect(checkAnswer(variant, { value: 225 }).wasCorrect).toBe(true);
  });

  it('all answers stay under the 9999 input cap', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      if (answer.kind !== 'int') throw new Error('expected int');
      expect(answer.value).toBeLessThan(9999);
    }
  });

  it('respects parameter constraints (1 ≤ j ≤ k-1, j ≤ g, k-j ≤ b)', () => {
    for (const { g, b, k, j } of allParams()) {
      expect(j).toBeGreaterThanOrEqual(1);
      expect(j).toBeLessThanOrEqual(k - 1);
      expect(j).toBeLessThanOrEqual(g);
      expect(k - j).toBeLessThanOrEqual(b);
    }
  });

  it('rate stays within the Elo range [700, 2000] and ≤ 1600', () => {
    for (const params of allParams()) {
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(1600);
    }
  });
});
