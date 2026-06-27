/**
 * Template family: circular-permutations
 *
 * Topic: permutations-combinations | Skills: permutations
 * Retrieval form: operation | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: n ∈ {4, 5, 6, 7} — people seated around a round table.
 * Solve:      { kind: 'int', value: (n-1)! }
 *   Rotations that preserve the relative seating order count as identical, so we
 *   fix one person and arrange the remaining (n-1) → (n-1)! distinct arrangements.
 *
 * The linear-arrangement trap n! is nudged via feedbackByWrongAnswer.
 */

import type { Template } from '../types';
import { factorial } from '@/lib/probability/exact';

type Params = { n: number };

export const circularPermutationsTemplate: Template<Params> = {
  id: 'circular-permutations',
  topic: 'permutations-combinations',
  skills: ['permutations'],
  retrievalForm: 'operation',

  rate({ n }) {
    return 1050 + (n - 4) * 60;
  },

  sample(rng) {
    const n = 4 + Math.floor(rng() * 4); // n ∈ {4, 5, 6, 7}
    return { n };
  },

  solve({ n }) {
    // (n-1)! is the single source of truth for the count.
    return { kind: 'int' as const, value: Number(factorial(n - 1)) };
  },

  render(params) {
    const { n } = params;
    const correct = Number(factorial(n - 1));
    const linear = Number(factorial(n)); // the linear-arrangement trap

    const feedbackByWrongAnswer: Record<string, string> = {};
    if (linear !== correct) {
      feedbackByWrongAnswer[String(linear)] =
        `That counts ${n}! arrangements in a row. Around a round table, rotations of the same ` +
        `seating are identical — fix one person and arrange the other ${n - 1}, giving (${n}−1)!.`;
    }

    return {
      id: `circular-permutations:n=${n}`,
      interactionKind: 'number-fill',
      prompt:
        `${n} people are seated around a round table. Two seatings are considered the same if one ` +
        `is a rotation of the other (same relative order). How many distinct seating arrangements are there?`,
      answer: correct,
      answerLabel: 'arrangements',
      feedbackByWrongAnswer,
      feedbackCorrect: `Correct! Around a round table, the count is (${n}−1)! = ${correct}.`,
      feedbackDefault:
        `Rotations count as the same seating. Fix one person's seat, then arrange the rest.`,
      skills: ['permutations'],
    };
  },

  explain({ n }) {
    const correct = Number(factorial(n - 1));
    const linear = Number(factorial(n));
    return {
      title: `Seating ${n} people around a round table`,
      steps: [
        `In a row, ${n} people can be ordered in ${n}! = ${linear} ways.`,
        `Around a circle, every seating can be rotated into ${n} equivalent versions (same relative order).`,
        `Divide out those rotations: ${n}! / ${n} = (${n}−1)!.`,
        `(${n}−1)! = ${correct} distinct circular arrangements.`,
      ],
    };
  },
};
