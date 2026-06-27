/**
 * Template family: derangement-probability (the hat-check problem)
 *
 * Topic: inclusion-exclusion | Skills: inclusion-exclusion, permutations
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: n (number of people / hats), n ∈ {3,4,5,6}.
 * Solve:      P(no one gets their own hat) = D_n / n!, where D_n is the
 *             derangement count via D_0=1, D_1=0, D_k=(k-1)(D_{k-1}+D_{k-2}).
 *             (Inclusion–exclusion over the "person i gets their own hat" events.)
 * Rate:       Upper band — a creative, counter-intuitive counting problem.
 */

import type { Template } from '../types';
import { frac, factorial } from '@/lib/probability/exact';

type Params = { n: number };

const N_VALUES = [3, 4, 5, 6] as const;

/** Derangement count D_n via the standard recurrence, using bigint. */
function derangement(n: number): bigint {
  if (n === 0) return 1n;
  if (n === 1) return 0n;
  let prev2 = 1n; // D_0
  let prev1 = 0n; // D_1
  for (let k = 2; k <= n; k++) {
    const cur = BigInt(k - 1) * (prev1 + prev2);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}

export const derangementProbabilityTemplate: Template<Params> = {
  id: 'derangement-probability',
  topic: 'inclusion-exclusion',
  skills: ['inclusion-exclusion', 'permutations'],
  retrievalForm: 'application',

  rate({ n }) {
    return 1450 + (n - 3) * 30;
  },

  sample(rng) {
    const n = N_VALUES[Math.floor(rng() * N_VALUES.length)];
    return { n };
  },

  solve({ n }) {
    return { kind: 'fraction', value: frac(derangement(n), factorial(n)) };
  },

  render(params) {
    const { n } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const dn = derangement(n);
    return {
      id: `derangement-probability:n=${n}`,
      interactionKind: 'fill-fraction',
      prompt:
        `${n} people check identical-looking hats at a party. At the end of the night ` +
        `the hats are handed back at random, one to each person. ` +
        `What is the probability that NO one gets their own hat back?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! There are ${dn} derangements out of ${Number(factorial(n))} = ${n}! arrangements.`,
      feedbackDefault:
        `Count the arrangements with NO fixed point (a derangement). ` +
        `D_${n} = ${dn}, and there are ${n}! = ${Number(factorial(n))} total arrangements.`,
      skills: ['inclusion-exclusion', 'permutations'],
    };
  },

  explain({ n }) {
    const dn = derangement(n);
    const total = factorial(n);
    const f = frac(dn, total);
    return {
      title: `P(no one gets their own hat), ${n} people`,
      steps: [
        `Each way of handing back the hats is a permutation of ${n} items: ${n}! = ${Number(total)} total.`,
        `We need permutations with NO fixed point — a derangement.`,
        `Using D_k = (k−1)(D_{k−1} + D_{k−2}) with D_0 = 1, D_1 = 0: D_${n} = ${dn}.`,
        `P = ${dn}/${Number(total)} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ n }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      // Build a random permutation of [0..n) via Fisher-Yates.
      const perm = Array.from({ length: n }, (_, k) => k);
      for (let k = n - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1));
        [perm[k], perm[j]] = [perm[j], perm[k]];
      }
      // Hit if there are ZERO fixed points (no one gets their own hat).
      let fixed = false;
      for (let k = 0; k < n; k++) {
        if (perm[k] === k) {
          fixed = true;
          break;
        }
      }
      if (!fixed) hits++;
    }
    return hits / trials;
  },
};
