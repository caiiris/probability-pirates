import { describe, it, expect } from 'vitest';
import { circularPermutationsTemplate as t } from './circular-permutations';
import { expectExactEnumeration } from '../testUtils';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { factorial } from '@/lib/probability/exact';

function allParams(): Array<{ n: number }> {
  const out: Array<{ n: number }> = [];
  for (let n = 4; n <= 7; n++) out.push({ n });
  return out;
}

describe('circular-permutations', () => {
  it('solve = (n-1)! and render round-trips through checkAnswer', () => {
    expect(() =>
      expectExactEnumeration(t, allParams(), (params, answer) => {
        if (answer.kind !== 'int') return false;
        if (answer.value !== Number(factorial(params.n - 1))) return false;
        const variant = t.render(params);
        return checkAnswer(variant, answerToPayload(answer, variant)).wasCorrect;
      }),
    ).not.toThrow();
  });

  it('matches a hand-computed case: n=5 → 4! = 24', () => {
    const answer = t.solve({ n: 5 });
    expect(answer).toEqual({ kind: 'int', value: 24 });
    const variant = t.render({ n: 5 });
    expect(variant.interactionKind).toBe('number-fill');
    expect(checkAnswer(variant, { value: 24 }).wasCorrect).toBe(true);
  });

  it('answer stays under the 9999 input cap for every sampled param', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      if (answer.kind !== 'int') throw new Error('expected int');
      expect(answer.value).toBeLessThan(9999);
    }
  });

  it('grades the linear-arrangement trap n! as wrong', () => {
    for (const { n } of allParams()) {
      const variant = t.render({ n });
      const linear = Number(factorial(n));
      expect(checkAnswer(variant, { value: linear }).wasCorrect).toBe(false);
    }
  });

  it('rate stays within the Elo range [700, 2000]', () => {
    for (const params of allParams()) {
      const r = t.rate(params);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });
});
