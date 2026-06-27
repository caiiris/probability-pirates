/**
 * Template family: expected-value-die-game
 *
 * Topic: long-run | Skills: long-run-vs-single-trial, frequentist-view
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: s ∈ {4, 6, 8, 10, 12} (polyhedral die sides)
 * Solve:      E[roll] = (s + 1) / 2  (exact, reduced)
 * Rate:       Medium band — introduces expectation as a long-run average.
 *
 * NOTE: the answer is an expected value (a mean payout, not a probability in
 * [0,1]). `expectTemplateAgrees` only Monte-Carlo-checks probabilities, so the
 * sibling test verifies `simulate` (the sample mean) against the exact value
 * directly. `simulate` here returns the estimated MEAN, not a probability.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { s: number };

const DIE_SIDES = [4, 6, 8, 10, 12] as const;

export const expectedValueDieGameTemplate: Template<Params> = {
  id: 'expected-value-die-game',
  topic: 'long-run',
  skills: ['long-run-vs-single-trial', 'frequentist-view'],
  retrievalForm: 'application',

  rate({ s }) {
    // Medium band (~1000–1100).
    return 1000 + (s - 4) * 12;
  },

  sample(rng) {
    const s = DIE_SIDES[Math.floor(rng() * DIE_SIDES.length)];
    return { s };
  },

  solve({ s }) {
    // E[roll] = (1 + 2 + ... + s) / s = (s + 1) / 2
    return { kind: 'fraction', value: frac(s + 1, 2) };
  },

  render(params) {
    const { s } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    return {
      id: `expected-value-die-game:s=${s}`,
      interactionKind: 'fill-fraction',
      prompt:
        `You roll a fair ${s}-sided die and win that many gold coins. ` +
        `On average, how many coins do you expect to win per roll? (Answer as a fraction.)`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect: `Correct! E = (1 + … + ${s}) / ${s} = (${s} + 1)/2 = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Expected value weights each outcome by its probability. Each face 1..${s} is equally likely, so average them: add 1 through ${s} and divide by ${s}.`,
      skills: ['long-run-vs-single-trial', 'frequentist-view'],
    };
  },

  explain({ s }) {
    const f = frac(s + 1, 2);
    return {
      title: `Expected value of a fair ${s}-sided die`,
      steps: [
        `Each face 1, 2, …, ${s} is equally likely, with probability 1/${s}.`,
        `E = (1 + 2 + … + ${s}) / ${s}.`,
        `The sum 1 + … + ${s} = ${s}(${s}+1)/2, so E = (${s}+1)/2 = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  // Returns the estimated MEAN payout (not a probability). The sibling test
  // compares this directly to the exact expected value.
  simulate({ s }, trials, rng) {
    let sum = 0;
    for (let i = 0; i < trials; i++) {
      sum += 1 + Math.floor(rng() * s);
    }
    return sum / trials;
  },
};
