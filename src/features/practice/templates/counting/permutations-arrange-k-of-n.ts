/**
 * Template family: permutations-arrange-k-of-n
 *
 * Topic: counting | Skills: permutations, ordered-vs-unordered
 * Retrieval form: operation | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: n ∈ {4..8}, k ∈ {2..min(n-1, 4)}
 * Solve:      { kind: 'int', value: nPr(n,k) } — ordered arrangements
 *
 * The mirror image of pick-k-of-n-unordered: here order DOES matter. Two traps
 * are flagged via misconceptionByValue:
 *   - nCr(n,k)  → `ordered_vs_unordered`     (treated the arrangement as unordered)
 *   - k!        → `arrange_without_selecting` (only arranged the k, didn't choose
 *                                              which k of the n — e.g. "3! = 6" for 6P3)
 */

import type { Template } from '../types';
import { nPr, nCr, factorial } from '@/lib/probability/exact';

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

    // Build trap maps, guarding against value collisions (with the answer or each
    // other) so a single number never maps to two misconceptions.
    const misconceptionByValue: Record<number, 'ordered_vs_unordered' | 'arrange_without_selecting'> =
      {};
    const feedbackByWrongAnswer: Record<string, string> = {};

    // Trap 1: combinations — treated the ordered arrangement as unordered.
    if (unordered !== correct) {
      misconceptionByValue[unordered] = 'ordered_vs_unordered';
      feedbackByWrongAnswer[String(unordered)] =
        'That counts unordered selections (combinations). Here the order on the shelf matters, so each ordering counts separately.';
    }

    // Trap 2: ANY plausible factorial m! the learner might enter — they only
    // ARRANGED some items and skipped CHOOSING which k of the n. k! is the most
    // common (e.g. "3! = 6" for 6P3); n! ("arranged all of them") and the others
    // are caught too. Bounded by the number-fill input cap (9999).
    const INPUT_CAP = 9999;
    for (let m = 2; m <= n; m++) {
      const f = Number(factorial(m));
      if (f > INPUT_CAP) break; // factorials only grow — nothing larger can be entered
      if (f === correct || f in misconceptionByValue) continue;
      misconceptionByValue[f] = 'arrange_without_selecting';
      feedbackByWrongAnswer[String(f)] =
        `${f} is ${m}! — that only arranges ${m} items in order. You still have to CHOOSE which ${k} of the ${n} to place, so multiply ${n} × ${n - 1} × … for ${k} factors.`;
    }

    return {
      id: `permutations-arrange-k-of-n:n=${n},k=${k}`,
      interactionKind: 'number-fill',
      prompt:
        `In how many ways can you arrange ${k} of ${n} distinct books in a row on a shelf? ` +
        `(Order matters.)`,
      answer: correct,
      answerLabel: 'arrangements',
      misconceptionByValue,
      feedbackByWrongAnswer,
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
