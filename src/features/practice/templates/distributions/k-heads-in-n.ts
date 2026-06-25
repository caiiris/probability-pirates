/**
 * Template family: k-heads-in-n
 *
 * Topic: distributions | Skills: binomial-pmf, independence
 * Retrieval form: operation | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: n ∈ {2..8} (flips), k ∈ {0..n} (target heads)
 * Solve:      nCr(n,k) / 2^n  (exact bigint fraction, always reduced)
 * Rate:       grows with n; larger n → more demanding calculation
 */

import type { Template } from '../types';
import { frac, nCr } from '@/lib/probability/exact';

type Params = { n: number; k: number };

export const kHeadsInNTemplate: Template<Params> = {
  id: 'k-heads-in-n',
  topic: 'distributions',
  skills: ['binomial-pmf', 'independence'],
  retrievalForm: 'operation',

  rate({ n }) {
    // n=2 → ~900 (easy), n=8 → ~1500 (hard)
    return 700 + n * 100;
  },

  sample(rng) {
    const n = 2 + Math.floor(rng() * 7);  // n ∈ {2..8}
    const k = Math.floor(rng() * (n + 1)); // k ∈ {0..n}
    return { n, k };
  },

  solve({ n, k }) {
    const num = nCr(n, k);           // bigint
    const den = 1n << BigInt(n);     // 2^n as bigint
    return { kind: 'fraction', value: frac(num, den) };
  },

  render(params) {
    const { n, k } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const headsWord = k === 1 ? 'head' : 'heads';
    return {
      id: `k-heads-in-n:n=${n},k=${k}`,
      interactionKind: 'fill-fraction',
      prompt: `A fair coin is flipped ${n} times. What is the probability of getting exactly ${k} ${headsWord}?`,
      numerator: Number(num),
      denominator: Number(den),
      numeratorLabel: `ways to get exactly ${k} ${headsWord}`,
      denominatorLabel: `total equally-likely outcomes (2^${n})`,
      feedbackCorrect: `Correct! C(${n},${k}) = ${Number(nCr(n, k))} favorable sequences out of 2^${n} = ${Number(1n << BigInt(n))}.`,
      feedbackDefault:
        `Use the binomial formula: C(n,k) / 2^n. ` +
        `C(${n},${k}) = ${Number(nCr(n, k))}, and 2^${n} = ${Number(1n << BigInt(n))}.`,
      skills: ['binomial-pmf', 'independence'],
    };
  },

  explain({ n, k }) {
    const comb = nCr(n, k);
    const total = 1n << BigInt(n);
    const f = frac(comb, total);
    return {
      title: `P(exactly ${k} heads in ${n} flips)`,
      steps: [
        `Each flip is independent with P(heads) = 1/2.`,
        `Total equally-likely sequences: 2^${n} = ${Number(total)}.`,
        `Sequences with exactly ${k} heads: C(${n}, ${k}) = ${Number(comb)}.`,
        `P(exactly ${k} heads) = ${Number(comb)}/${Number(total)} = ${Number(f.num)}/${Number(f.den)}.`,
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
      if (heads === k) hits++;
    }
    return hits / trials;
  },
};
