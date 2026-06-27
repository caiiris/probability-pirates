import { describe, it, expect } from 'vitest';
import { permutationsWithRepetitionTemplate as t } from './permutations-with-repetition';
import { expectExactEnumeration } from '../testUtils';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { checkAnswer } from '@/lib/checkAnswer';
import { factorial } from '@/lib/probability/exact';

const WORDS = ['BANANA', 'LEVEL', 'PEPPER', 'LETTER', 'SUCCESS'] as const;

/** Hand-verifiable expected answers from the spec. */
const EXPECTED: Record<string, number> = {
  BANANA: 60,
  LEVEL: 30,
  PEPPER: 60,
  LETTER: 180,
  SUCCESS: 420,
};

function distinctArrangements(word: string): number {
  const counts = new Map<string, number>();
  for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let denom = 1n;
  for (const c of counts.values()) denom *= factorial(c);
  return Number(factorial(word.length) / denom);
}

function allParams(): Array<{ wordIndex: number }> {
  return WORDS.map((_, wordIndex) => ({ wordIndex }));
}

describe('permutations-with-repetition', () => {
  it('solve = len! / ∏(letter counts)! and render round-trips through checkAnswer', () => {
    expect(() =>
      expectExactEnumeration(t, allParams(), (params, answer) => {
        if (answer.kind !== 'int') return false;
        const word = WORDS[params.wordIndex];
        if (answer.value !== distinctArrangements(word)) return false;
        const variant = t.render(params);
        return checkAnswer(variant, answerToPayload(answer, variant)).wasCorrect;
      }),
    ).not.toThrow();
  });

  it('matches the hand-computed answers for every word', () => {
    for (let wordIndex = 0; wordIndex < WORDS.length; wordIndex++) {
      const word = WORDS[wordIndex];
      const answer = t.solve({ wordIndex });
      expect(answer).toEqual({ kind: 'int', value: EXPECTED[word] });
    }
  });

  it('all answers stay under the 9999 input cap', () => {
    for (const params of allParams()) {
      const answer = t.solve(params);
      if (answer.kind !== 'int') throw new Error('expected int');
      expect(answer.value).toBeLessThan(9999);
    }
  });

  it('grades the "all letters distinct" trap len! as wrong', () => {
    for (const params of allParams()) {
      const word = WORDS[params.wordIndex];
      const variant = t.render(params);
      const allDistinct = Number(factorial(word.length));
      // every curated word has repeats, so len! ≠ the answer
      expect(checkAnswer(variant, { value: allDistinct }).wasCorrect).toBe(false);
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
