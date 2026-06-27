/**
 * Template family: pick-k-of-n-unordered
 *
 * Topic: counting | Skills: ordered-vs-unordered, combinations
 * Retrieval form: definition | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: n ∈ {3..8}, k ∈ {2..min(n-1, 5)}
 * Solve:      { kind: 'int', value: nCr(n,k) } — the count of unordered committees
 *
 * F2: converted from multiple-choice to free-response `number-fill` so the
 * learner computes the count instead of picking from options (no guessing).
 * The ordered-count trap nPr(n,k) is still captured: if the learner types that
 * value, `misconceptionByValue` flags `ordered_vs_unordered` for the learner
 * model — preserving the pedagogy the old MC distractor provided.
 */

import type { Template } from '../types';
import { nCr, nPr, factorial } from '@/lib/probability/exact';

type Params = { n: number; k: number };

export const pickKOfNUnorderedTemplate: Template<Params> = {
  id: 'pick-k-of-n-unordered',
  topic: 'permutations-combinations',
  skills: ['ordered-vs-unordered', 'combinations'],
  retrievalForm: 'definition',

  rate({ n, k }) {
    // Current non-creative bank is intentionally labeled Easy (<950).
    // Preserve relative difficulty while keeping all generated cases easy.
    return 760 + (n - 3) * 20 + (k - 1) * 15;
  },

  sample(rng) {
    const n = 3 + Math.floor(rng() * 6);         // n ∈ {3..8}
    const maxK = Math.min(n - 1, 5);
    const k = 2 + Math.floor(rng() * (maxK - 1)); // k ∈ {2..maxK}; ensures k ≥ 2 so nCr ≠ nPr
    return { n, k };
  },

  solve({ n, k }) {
    // nCr(n,k) is the single source of truth for the count.
    return { kind: 'int' as const, value: Number(nCr(n, k)) };
  },

  render(params) {
    const { n, k } = params;
    const correct = Number(nCr(n, k));
    const ordered = Number(nPr(n, k)); // the ordered-count trap (always > correct for k ≥ 2)

    return {
      id: `pick-k-of-n-unordered:n=${n},k=${k}`,
      interactionKind: 'number-fill',
      prompt:
        `A committee of ${k} people is chosen from a group of ${n}. ` +
        `How many different committees are possible? (Order does not matter.)`,
      answer: correct,
      answerLabel: 'committees',
      // Typing the permutation count reveals the ordered-vs-unordered misconception.
      misconceptionByValue: { [ordered]: 'ordered_vs_unordered' },
      feedbackByWrongAnswer: {
        [String(ordered)]:
          'That counts ordered selections (permutations). Swapping the same people into a different order does not make a new committee.',
      },
      feedbackCorrect: `Correct! C(${n},${k}) = ${correct} unordered committees.`,
      feedbackDefault: `Order does not matter here. Watch out for counting the same committee more than once.`,
      skills: ['ordered-vs-unordered', 'combinations'],
    };
  },

  explain({ n, k }) {
    const correct = Number(nCr(n, k));
    const ordered = Number(nPr(n, k));
    const kFact = Number(factorial(k));
    return {
      title: `Choosing ${k} from ${n} (unordered)`,
      steps: [
        `We want to count subsets of size ${k} from ${n} elements.`,
        `Order does not matter. {A,B} and {B,A} count as one committee.`,
        `Ordered selections (permutations): P(${n},${k}) = ${n}!/(${n}−${k})! = ${ordered}.`,
        `Each unordered subset appears in ${k}! = ${kFact} orderings, so divide by ${k}!.`,
        `C(${n},${k}) = P(${n},${k}) / ${k}! = ${ordered} / ${kFact} = ${correct}.`,
      ],
    };
  },
};
