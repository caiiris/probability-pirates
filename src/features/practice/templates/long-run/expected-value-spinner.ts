/**
 * Template family: expected-value-spinner
 *
 * Topic: long-run | Skills: long-run-vs-single-trial, frequentist-view
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: payoffs — k ∈ {3, 4} DISTINCT integers in [1, 10], sum ≤ 40.
 *             The spinner has k equally likely regions.
 * Solve:      E[winnings] = (Σ payoffs) / k  (exact, reduced)
 * Rate:       Medium band — averaging equally likely payoffs.
 *
 * NOTE: the answer is an expected value (a mean payout, not a probability in
 * [0,1]). `expectTemplateAgrees` only Monte-Carlo-checks probabilities, so the
 * sibling test verifies `simulate` (the sample mean) against the exact value
 * directly. `simulate` here returns the estimated MEAN, not a probability.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { payoffs: number[] };

export const expectedValueSpinnerTemplate: Template<Params> = {
  id: 'expected-value-spinner',
  topic: 'long-run',
  skills: ['long-run-vs-single-trial', 'frequentist-view'],
  retrievalForm: 'application',

  rate({ payoffs }) {
    const k = payoffs.length;
    return 1050 + k * 30;
  },

  sample(rng) {
    // Choose k ∈ {3, 4}.
    const k = 3 + Math.floor(rng() * 2);
    // Draw distinct integers in [1, 10], keeping the running sum ≤ 40.
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const payoffs: number[] = [];
    let sum = 0;
    // Deterministic guarded selection: walk a shuffled pool and take values
    // that keep us within the sum cap until we have k of them.
    while (payoffs.length < k && pool.length > 0) {
      const idx = Math.floor(rng() * pool.length);
      const candidate = pool.splice(idx, 1)[0];
      if (sum + candidate <= 40) {
        payoffs.push(candidate);
        sum += candidate;
      }
    }
    // Fallback (should not trigger given [1..10] and cap 40): fill from smallest.
    if (payoffs.length < k) {
      for (let v = 1; v <= 10 && payoffs.length < k; v++) {
        if (!payoffs.includes(v) && sum + v <= 40) {
          payoffs.push(v);
          sum += v;
        }
      }
    }
    return { payoffs };
  },

  solve({ payoffs }) {
    const sum = payoffs.reduce((a, b) => a + b, 0);
    // E = (Σ payoffs) / k
    return { kind: 'fraction', value: frac(sum, payoffs.length) };
  },

  render(params) {
    const { payoffs } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const k = payoffs.length;
    const list = payoffs.join(', ');
    return {
      id: `expected-value-spinner:payoffs=${payoffs.join('-')}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A spinner is divided into ${k} equally likely regions worth ` +
        `${list} gold coins. On average, how many coins do you expect to win ` +
        `per spin? (Answer as a fraction.)`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect: `Correct! E = (${payoffs.join(' + ')}) / ${k} = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Each of the ${k} regions is equally likely, so average the payoffs: ` +
        `add them up and divide by ${k}.`,
      skills: ['long-run-vs-single-trial', 'frequentist-view'],
    };
  },

  explain({ payoffs }) {
    const k = payoffs.length;
    const sum = payoffs.reduce((a, b) => a + b, 0);
    const f = frac(sum, k);
    return {
      title: `Expected winnings on a ${k}-region spinner`,
      steps: [
        `Each region is equally likely, with probability 1/${k}.`,
        `E = (${payoffs.join(' + ')}) / ${k}.`,
        `The payoffs sum to ${sum}, so E = ${sum}/${k} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  // Returns the estimated MEAN payout (not a probability). The sibling test
  // compares this directly to the exact expected value.
  simulate({ payoffs }, trials, rng) {
    const k = payoffs.length;
    let sum = 0;
    for (let i = 0; i < trials; i++) {
      const idx = Math.floor(rng() * k);
      sum += payoffs[idx];
    }
    return sum / trials;
  },
};
