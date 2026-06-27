/**
 * Template family: permutations-with-repetition
 *
 * Topic: permutations-combinations | Skills: permutations, ordered-vs-unordered
 * Retrieval form: procedural | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: wordIndex ∈ {0..4} indexing a curated word list.
 * Solve:      { kind: 'int', value: len! / ∏ (count of each letter)! }
 *   The number of distinct arrangements (anagrams) of a word with repeated letters.
 *
 * Curated words (all answers < 9999):
 *   BANANA = 60, LEVEL = 30, PEPPER = 60, LETTER = 180, SUCCESS = 420.
 *
 * The "treat all letters as distinct" trap len! is nudged via feedbackByWrongAnswer.
 */

import type { Template } from '../types';
import { factorial } from '@/lib/probability/exact';

type Params = { wordIndex: number };

const WORDS = ['BANANA', 'LEVEL', 'PEPPER', 'LETTER', 'SUCCESS'] as const;

/** Distinct arrangements of `word`: len! / ∏ (multiplicity of each letter)! */
function distinctArrangements(word: string): number {
  const counts = new Map<string, number>();
  for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let denom = 1n;
  for (const c of counts.values()) denom *= factorial(c);
  return Number(factorial(word.length) / denom);
}

export const permutationsWithRepetitionTemplate: Template<Params> = {
  id: 'permutations-with-repetition',
  topic: 'permutations-combinations',
  skills: ['permutations', 'ordered-vs-unordered'],
  retrievalForm: 'procedural',

  rate({ wordIndex }) {
    return 1150 + wordIndex * 30;
  },

  sample(rng) {
    const wordIndex = Math.floor(rng() * WORDS.length); // {0..4}
    return { wordIndex };
  },

  solve({ wordIndex }) {
    const word = WORDS[wordIndex];
    // len! / ∏ (letter multiplicities)! is the single source of truth.
    return { kind: 'int' as const, value: distinctArrangements(word) };
  },

  render(params) {
    const { wordIndex } = params;
    const word = WORDS[wordIndex];
    const correct = distinctArrangements(word);
    const allDistinct = Number(factorial(word.length)); // trap: ignored repeated letters

    const feedbackByWrongAnswer: Record<string, string> = {};
    if (allDistinct !== correct) {
      feedbackByWrongAnswer[String(allDistinct)] =
        `That is ${word.length}!, which treats every letter as distinct. ` +
        `Repeated letters create identical arrangements — divide by the factorial of each letter's count.`;
    }

    return {
      id: `permutations-with-repetition:word=${word}`,
      interactionKind: 'number-fill',
      prompt: `How many distinct arrangements of the letters in '${word}' are there?`,
      answer: correct,
      answerLabel: 'arrangements',
      feedbackByWrongAnswer,
      feedbackCorrect: `Correct! '${word}' has ${correct} distinct arrangements.`,
      feedbackDefault:
        `Start with (number of letters)!, then divide by the factorial of each repeated letter's count.`,
      skills: ['permutations', 'ordered-vs-unordered'],
    };
  },

  explain({ wordIndex }) {
    const word = WORDS[wordIndex];
    const correct = distinctArrangements(word);
    const counts = new Map<string, number>();
    for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    const repeated = [...counts.entries()].filter(([, c]) => c > 1);
    const denomParts = repeated.map(([ch, c]) => `${c}! (for ${ch})`);
    const denomValue = repeated.reduce((acc, [, c]) => acc * Number(factorial(c)), 1);

    return {
      title: `Arranging the letters of '${word}'`,
      steps: [
        `'${word}' has ${word.length} letters, so ${word.length}! = ${Number(factorial(word.length))} orderings if all were distinct.`,
        repeated.length
          ? `Repeated letters: ${repeated.map(([ch, c]) => `${ch}×${c}`).join(', ')}. Swapping identical letters does not make a new word.`
          : `No letter repeats, so nothing to divide out.`,
        repeated.length
          ? `Divide by ${denomParts.join(' × ')} = ${denomValue}.`
          : `The count is just ${word.length}!.`,
        `Distinct arrangements = ${Number(factorial(word.length))} / ${denomValue} = ${correct}.`,
      ],
    };
  },
};
