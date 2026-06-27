/**
 * Template family: committee-with-constraint
 *
 * Topic: permutations-combinations | Skills: combinations, multiplication-principle
 * Retrieval form: application | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: { g, b, k, j }
 *   g girls ∈ {4, 5, 6}, b boys ∈ {4, 5, 6}, committee size k ∈ {3, 4},
 *   exactly j girls with 1 ≤ j ≤ k-1, j ≤ g, and (k - j) ≤ b.
 *
 * Solve: { kind: 'int', value: C(g, j) × C(b, k - j) }
 *   Choose j girls AND (k - j) boys — two independent unordered selections
 *   combined by the multiplication principle.
 *
 * The "single combined choice" trap C(g + b, k) is nudged via feedbackByWrongAnswer.
 */

import type { Template } from '../types';
import { nCr } from '@/lib/probability/exact';

type Params = { g: number; b: number; k: number; j: number };

/** All (g, b, k, j) satisfying the constraints. */
function validCombos(): Params[] {
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

const COMBOS = validCombos();

export const committeeWithConstraintTemplate: Template<Params> = {
  id: 'committee-with-constraint',
  topic: 'permutations-combinations',
  skills: ['combinations', 'multiplication-principle'],
  retrievalForm: 'application',

  rate({ g, b, k }) {
    return 1350 + (g + b) * 10 + k * 15;
  },

  sample(rng) {
    return COMBOS[Math.floor(rng() * COMBOS.length)];
  },

  solve({ g, b, k, j }) {
    // C(g, j) × C(b, k - j) is the single source of truth for the count.
    return { kind: 'int' as const, value: Number(nCr(g, j) * nCr(b, k - j)) };
  },

  render(params) {
    const { g, b, k, j } = params;
    const correct = Number(nCr(g, j) * nCr(b, k - j));
    const ignoreConstraint = Number(nCr(g + b, k)); // trap: ignored the "exactly j girls" rule

    const feedbackByWrongAnswer: Record<string, string> = {};
    if (ignoreConstraint !== correct) {
      feedbackByWrongAnswer[String(ignoreConstraint)] =
        `That counts every committee of ${k} from all ${g + b} people, ignoring the rule. ` +
        `You need exactly ${j} girls: choose ${j} of ${g} girls AND ${k - j} of ${b} boys, then multiply.`;
    }

    return {
      id: `committee-with-constraint:g=${g},b=${b},k=${k},j=${j}`,
      interactionKind: 'number-fill',
      prompt:
        `A club has ${g} girls and ${b} boys. A committee of ${k} members is formed with exactly ${j} ` +
        `girl${j === 1 ? '' : 's'} (and the rest boys). How many different committees are possible?`,
      answer: correct,
      answerLabel: 'committees',
      feedbackByWrongAnswer,
      feedbackCorrect: `Correct! C(${g},${j}) × C(${b},${k - j}) = ${correct} committees.`,
      feedbackDefault:
        `Split it: choose the girls AND choose the boys, then multiply the two counts.`,
      skills: ['combinations', 'multiplication-principle'],
    };
  },

  explain({ g, b, k, j }) {
    const girls = Number(nCr(g, j));
    const boys = Number(nCr(b, k - j));
    const correct = girls * boys;
    return {
      title: `Committee of ${k} with exactly ${j} girl${j === 1 ? '' : 's'}`,
      steps: [
        `The committee must have exactly ${j} girls and ${k - j} boys.`,
        `Choose the girls: C(${g}, ${j}) = ${girls} ways (order does not matter).`,
        `Choose the boys: C(${b}, ${k - j}) = ${boys} ways.`,
        `These are independent choices, so multiply: ${girls} × ${boys} = ${correct}.`,
      ],
    };
  },
};
