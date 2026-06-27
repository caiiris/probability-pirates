/**
 * Template family: permutations-arrange-k-of-n
 *
 * Topic: counting | Skills: permutations, ordered-vs-unordered
 * Retrieval form: operation | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: n ∈ {4..8}, k ∈ {2..min(n-1, 4)}
 * Solve:      { kind: 'int', value: nPr(n,k) } — ordered arrangements
 *
 * The mirror image of pick-k-of-n-unordered: here order DOES matter. Typing the
 * combination count nCr(n,k) (treating an ordered arrangement as unordered) flags
 * the `ordered_vs_unordered` misconception via misconceptionByValue.
 */

import type { Template } from '../types';
import { nPr, nCr } from '@/lib/probability/exact';

type Params = { n: number; k: number };

export const permutationsArrangeTemplate: Template<Params> = {
  id: 'permutations-arrange-k-of-n',
  topic: 'permutations-combinations',
  skills: ['permutations', 'ordered-vs-unordered'],
  retrievalForm: 'operation',

  rate({ n, k }) {
    // Medium band (~980–1180).
    return 980 + (n - 4) * 25 + (k - 2) * 30;
  },

  sample(rng) {
    const n = 4 + Math.floor(rng() * 5); // 4..8
    const maxK = Math.min(n - 1, 4);
    const k = 2 + Math.floor(rng() * (maxK - 1)); // 2..maxK (k ≥ 2 so nPr ≠ nCr)
    return { n, k };
  },

  solve({ n, k }) {
    return { kind: 'int' as const, value: Number(nPr(n, k)) };
  },

  render(params) {
    const { n, k } = params;
    const correct = Number(nPr(n, k));
    const unordered = Number(nCr(n, k)); // combinations = the order-doesn't-matter trap
    return {
      id: `permutations-arrange-k-of-n:n=${n},k=${k}`,
      interactionKind: 'number-fill',
      prompt:
        `In how many ways can you arrange ${k} of ${n} distinct books in a row on a shelf? ` +
        `(Order matters.)`,
      answer: correct,
      answerLabel: 'arrangements',
      misconceptionByValue: { [unordered]: 'ordered_vs_unordered' },
      feedbackByWrongAnswer: {
        [String(unordered)]:
          'That counts unordered selections (combinations). Here the order on the shelf matters, so each ordering counts separately.',
      },
      feedbackCorrect: `Correct! P(${n},${k}) = ${correct} ordered arrangements.`,
      feedbackDefault:
        `Order matters here. Count the choices for the first position, then the next, and so on.`,
      skills: ['permutations', 'ordered-vs-unordered'],
    };
  },

  explain({ n, k }) {
    const correct = Number(nPr(n, k));
    const factors: number[] = [];
    for (let i = 0; i < k; i++) factors.push(n - i);
    return {
      title: `Arranging ${k} of ${n} (ordered)`,
      steps: [
        `Order matters, so this is a permutation: P(${n},${k}).`,
        `Fill the positions one at a time: ${factors.join(' × ')}.`,
        `P(${n},${k}) = ${factors.join(' × ')} = ${correct}.`,
      ],
    };
  },
};
