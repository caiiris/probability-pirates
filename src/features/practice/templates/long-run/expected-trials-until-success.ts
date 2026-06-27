/**
 * Template family: expected-trials-until-success
 *
 * Topic: long-run | Skills: long-run-vs-single-trial, independence
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: m ∈ {4, 6, 8, 10}, k ∈ {1, 2, 3} with k < m.
 *             Each independent trial succeeds with probability p = k/m.
 * Solve:      E[trials until first success] = 1/p = m/k  (geometric mean).
 * Rate:       Medium band — reasoning about a long-run average wait time.
 *
 * NOTE: the answer is an expected value (a mean count, not a probability in
 * [0,1]). `expectTemplateAgrees` only Monte-Carlo-checks probabilities, so the
 * sibling test verifies `simulate` (the sample mean) against the exact value
 * directly. `simulate` here returns the estimated MEAN, not a probability.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { m: number; k: number };

const M_VALUES = [4, 6, 8, 10] as const;
const K_VALUES = [1, 2, 3] as const;

// Safety bound per simulated run; with p ≥ 1/10 the chance of exceeding this
// is astronomically small, so it only guards against pathological RNG.
const MAX_TRIALS_PER_RUN = 100_000;

export const expectedTrialsUntilSuccessTemplate: Template<Params> = {
  id: 'expected-trials-until-success',
  topic: 'long-run',
  skills: ['long-run-vs-single-trial', 'independence'],
  retrievalForm: 'procedural',

  rate({ m, k }) {
    const r = 1250 + (m / k) * 15;
    return Math.min(r, 1450);
  },

  sample(rng) {
    const m = M_VALUES[Math.floor(rng() * M_VALUES.length)];
    // Pick k ∈ {1,2,3} with k < m. All m here are ≥ 4, so any k qualifies.
    const k = K_VALUES[Math.floor(rng() * K_VALUES.length)];
    return { m, k };
  },

  solve({ m, k }) {
    // E[trials until first success] = 1/p = 1/(k/m) = m/k.
    return { kind: 'fraction', value: frac(m, k) };
  },

  render(params) {
    const { m, k } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    return {
      id: `expected-trials-until-success:m=${m},k=${k}`,
      interactionKind: 'fill-fraction',
      prompt:
        `Each independent attempt succeeds with probability ${k}/${m}. ` +
        `On average, how many attempts do you expect to make until your ` +
        `first success? (Answer as a fraction.)`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect: `Correct! E = 1 / (${k}/${m}) = ${m}/${k} = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `For repeated independent trials with success probability p, the ` +
        `expected number of trials until the first success is 1/p. Here p = ${k}/${m}.`,
      skills: ['long-run-vs-single-trial', 'independence'],
    };
  },

  explain({ m, k }) {
    const f = frac(m, k);
    return {
      title: `Expected attempts until the first success`,
      steps: [
        `Each attempt independently succeeds with probability p = ${k}/${m}.`,
        `The number of trials until the first success is geometric, with mean 1/p.`,
        `So E = 1 / (${k}/${m}) = ${m}/${k} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  // Returns the estimated MEAN number of trials (not a probability). The
  // sibling test compares this directly to the exact expected value.
  simulate({ m, k }, trials, rng) {
    const p = k / m;
    let total = 0;
    for (let i = 0; i < trials; i++) {
      let count = 0;
      while (count < MAX_TRIALS_PER_RUN) {
        count++;
        if (rng() < p) break;
      }
      total += count;
    }
    return total / trials;
  },
};
