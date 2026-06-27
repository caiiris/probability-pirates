/**
 * Template family: binomial-at-least-k
 *
 * Topic: distributions | Skills: binomial-pmf, independence
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: n ∈ {4..7} fair-coin flips, k ∈ {2..n-1} (non-trivial threshold)
 * Solve:      P(≥k heads) = Σ_{i=k}^{n} C(n,i) / 2^n  (exact, reduced)
 * Rate:       Hard→Extreme band — a multi-term cumulative sum.
 */

import type { Template } from '../types';
import { frac, nCr } from '@/lib/probability/exact';

type Params = { n: number; k: number };

/** Σ_{i=k}^{n} C(n,i) as a bigint. */
function sumFrom(n: number, k: number): bigint {
  let total = 0n;
  for (let i = k; i <= n; i++) total += nCr(n, i);
  return total;
}

export const binomialAtLeastKTemplate: Template<Params> = {
  id: 'binomial-at-least-k',
  topic: 'distributions',
  skills: ['binomial-pmf', 'independence'],
  retrievalForm: 'procedural',

  rate({ n, k }) {
    // Hard→Extreme band (~1440–1700).
    return 1400 + (n - 4) * 60 + k * 20;
  },

  sample(rng) {
    const n = 4 + Math.floor(rng() * 4); // 4..7
    const k = 2 + Math.floor(rng() * (n - 2)); // 2..n-1
    return { n, k };
  },

  solve({ n, k }) {
    const num = sumFrom(n, k);
    const den = 1n << BigInt(n); // 2^n
    return { kind: 'fraction', value: frac(num, den) };
  },

  render(params) {
    const { n, k } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    return {
      id: `binomial-at-least-k:n=${n},k=${k}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A fair coin is flipped ${n} times. ` +
        `What is the probability of getting at least ${k} heads?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! Σ C(${n},i) for i = ${k}..${n} = ${Number(sumFrom(n, k))}, over 2^${n} = ${Number(1n << BigInt(n))} → ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `"At least ${k}" means ${k}, ${k + 1}, … up to ${n} heads. Add the counts C(${n},i) for each of those, then divide by the 2^${n} total sequences.`,
      skills: ['binomial-pmf', 'independence'],
    };
  },

  explain({ n, k }) {
    const terms: string[] = [];
    for (let i = k; i <= n; i++) terms.push(`C(${n},${i})`);
    const total = sumFrom(n, k);
    const denom = 1n << BigInt(n);
    const f = frac(total, denom);
    return {
      title: `P(at least ${k} heads in ${n} flips)`,
      steps: [
        `"At least ${k}" covers ${k} through ${n} heads.`,
        `Count favorable sequences: ${terms.join(' + ')} = ${Number(total)}.`,
        `Total sequences: 2^${n} = ${Number(denom)}.`,
        `P = ${Number(total)}/${Number(denom)} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ n, k }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      let heads = 0;
      for (let j = 0; j < n; j++) {
        if (rng() < 0.5) heads++;
      }
      if (heads >= k) hits++;
    }
    return hits / trials;
  },
};
