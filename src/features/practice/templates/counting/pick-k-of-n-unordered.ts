/**
 * Template family: pick-k-of-n-unordered
 *
 * Topic: counting | Skills: ordered-vs-unordered, combinations
 * Retrieval form: definition | Interaction: multiple-choice | No simulate
 *
 * Parameters: n ∈ {3..8}, k ∈ {2..min(n-1, 5)}
 * Solve:      { kind: 'choice', optionId: 'combo' } — the option whose label is nCr(n,k)
 *
 * I-WP-H fix (WP-6b, risk R2): changed from { kind:'int' } to { kind:'choice' } so
 * answerToPayload + checkAnswer round-trip correctly for this multiple-choice family.
 * nCr(n,k) remains the numeric source of truth; render derives correctOptionId from solve.
 *
 * Distractors include nPr(n,k) (the ordered-count trap, mapped to the
 * `ordered_vs_unordered` misconception) plus two other plausible wrong answers.
 */

import type { Template } from '../types';
import { nCr, nPr, factorial } from '@/lib/probability/exact';
import type { MisconceptionKey } from '@/content/misconceptions';

type Params = { n: number; k: number };

type OptionSpec = { id: string; label: string; misconception?: MisconceptionKey };

/**
 * Build exactly 3 distinct distractors for the given (n,k).
 * Always tries nPr(n,k) first as the ordered-count trap.
 * Falls back through several candidates to guarantee 3 unique values.
 */
function buildDistractors(n: number, k: number, correct: number): OptionSpec[] {
  const seen = new Set<number>([correct]);
  const result: OptionSpec[] = [];

  const candidates: OptionSpec[] = [
    { id: 'perm', label: '', misconception: 'ordered_vs_unordered' as MisconceptionKey },
    { id: 'd1', label: '' },
    { id: 'd2', label: '' },
    { id: 'd3', label: '' },
    { id: 'd4', label: '' },
  ];

  const rawValues = [
    Number(nPr(n, k)),                     // ordered count trap
    correct + 1,                            // off-by-one high
    n * k,                                  // product (common wrong guess)
    correct - 1 > 0 ? correct - 1 : -1,    // off-by-one low (skip if ≤ 0)
    k >= 2 ? Number(nCr(n, k - 1)) : -1,   // one fewer selection
    Number(nCr(n, k + 1 <= n ? k + 1 : k)), // one more selection
  ];

  for (let i = 0; i < rawValues.length && result.length < 3; i++) {
    const v = rawValues[i];
    if (v > 0 && !seen.has(v)) {
      seen.add(v);
      const spec = { ...candidates[result.length] };
      if (i === 0) {
        spec.misconception = 'ordered_vs_unordered';
        spec.id = 'perm';
      }
      spec.label = String(v);
      result.push(spec);
    }
  }

  // Guarantee 3 distractors with arbitrary fallback values
  let fallback = correct + 10;
  while (result.length < 3) {
    while (seen.has(fallback)) fallback++;
    seen.add(fallback);
    result.push({ id: `d${result.length}`, label: String(fallback) });
    fallback++;
  }

  return result;
}

export const pickKOfNUnorderedTemplate: Template<Params> = {
  id: 'pick-k-of-n-unordered',
  topic: 'counting',
  skills: ['ordered-vs-unordered', 'combinations'],
  retrievalForm: 'definition',

  rate({ n, k }) {
    // n=3,k=2 → ~940; n=8,k=5 → ~1460
    return 900 + (n - 3) * 80 + (k - 1) * 40;
  },

  sample(rng) {
    const n = 3 + Math.floor(rng() * 6);         // n ∈ {3..8}
    const maxK = Math.min(n - 1, 5);
    const k = 2 + Math.floor(rng() * (maxK - 1)); // k ∈ {2..maxK}; ensures k ≥ 2 so nCr ≠ nPr
    return { n, k };
  },

  solve(_params: Params) {
    // The correct option id is always 'combo'; the numeric value nCr(n,k) lives
    // in render() as the option label. answerToPayload maps { kind:'choice' } to
    // { optionId } so checkAnswer round-trips correctly for this MC family.
    return { kind: 'choice' as const, optionId: 'combo' };
  },

  render(params) {
    const { n, k } = params;
    // nCr(n,k) is the numeric source of truth; solve references 'combo' (the option
    // whose label is this count), keeping solve/render in sync.
    const correct = Number(nCr(n, k));

    const distractors = buildDistractors(n, k, correct);
    const options = [
      { id: 'combo', label: String(correct) },
      ...distractors.map(({ id, label }) => ({ id, label })),
    ];

    const misconceptionByOption: Record<string, MisconceptionKey> = {};
    for (const d of distractors) {
      if (d.misconception) misconceptionByOption[d.id] = d.misconception;
    }

    const feedbackByOption: Record<string, string> = {
      combo: 'Correct! Order does not matter here, so we use combinations C(n,k) = n!/(k!(n−k)!).',
    };
    for (const d of distractors) {
      if (d.id === 'perm') {
        feedbackByOption[d.id] =
          `That's the number of ordered selections P(${n},${k}) = ${d.label}. ` +
          `Since the committee has no ranking, order doesn't matter — use C(${n},${k}) instead.`;
      } else {
        feedbackByOption[d.id] =
          `Not quite. The correct count is C(${n},${k}) = ${correct}, which counts unordered subsets.`;
      }
    }

    return {
      id: `pick-k-of-n-unordered:n=${n},k=${k}`,
      interactionKind: 'multiple-choice',
      prompt:
        `A committee of ${k} people is chosen from a group of ${n}. ` +
        `How many different committees are possible? (Order does not matter.)`,
      options,
      correctOptionId: 'combo',
      feedbackByOption,
      misconceptionByOption,
      feedbackCorrect: `Correct! C(${n},${k}) = ${correct} unordered committees.`,
      feedbackDefault: `Use combinations: C(${n},${k}) = ${n}!/(${k}!·${n - k}!) = ${correct}.`,
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
        `Order doesn't matter — {A,B} and {B,A} count as one committee.`,
        `Ordered selections (permutations): P(${n},${k}) = ${n}!/(${n}−${k})! = ${ordered}.`,
        `Each unordered subset appears in ${k}! = ${kFact} orderings, so divide by ${k}!.`,
        `C(${n},${k}) = P(${n},${k}) / ${k}! = ${ordered} / ${kFact} = ${correct}.`,
      ],
    };
  },
};
