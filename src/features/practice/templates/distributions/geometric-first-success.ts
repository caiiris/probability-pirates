/**
 * Template family: geometric-first-success
 *
 * Topic: distributions | Skills: independence, binomial-pmf
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: m ∈ {2..6} (success prob = 1/m), k ∈ {1..4} (target trial)
 * Solve:      P(first success on trial k) = ((m-1)/m)^(k-1) × (1/m)  (exact, reduced)
 * Rate:       Medium→Hard band.
 */

import type { Template } from '../types';
import { frac, mulF } from '@/lib/probability/exact';
import type { Fraction } from '@/lib/probability/exact';

type Params = { m: number; k: number };

/** Exact (base)^exp via repeated multiplication. */
function powF(base: Fraction, exp: number): Fraction {
  let result = frac(1);
  for (let i = 0; i < exp; i++) result = mulF(result, base);
  return result;
}

export const geometricFirstSuccessTemplate: Template<Params> = {
  id: 'geometric-first-success',
  topic: 'distributions',
  skills: ['independence', 'binomial-pmf'],
  retrievalForm: 'procedural',

  rate({ m, k }) {
    // Medium→Hard band (~1150–1370).
    return 1150 + (m - 2) * 20 + (k - 1) * 45;
  },

  sample(rng) {
    const m = 2 + Math.floor(rng() * 5); // 2..6
    const k = 1 + Math.floor(rng() * 4); // 1..4
    return { m, k };
  },

  solve({ m, k }) {
    // ((m-1)/m)^(k-1) × (1/m)
    const miss = powF(frac(m - 1, m), k - 1);
    return { kind: 'fraction', value: mulF(miss, frac(1, m)) };
  },

  render(params) {
    const { m, k } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const ord = k === 1 ? '1st' : k === 2 ? '2nd' : k === 3 ? '3rd' : `${k}th`;
    return {
      id: `geometric-first-success:m=${m},k=${k}`,
      interactionKind: 'fill-fraction',
      prompt:
        `On each spin, a wheel lands on gold with probability 1/${m} (independently each time). ` +
        `What is the probability that the first gold appears on the ${ord} spin?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! Miss ${k - 1} time(s), then hit: (${m - 1}/${m})^${k - 1} × (1/${m}) = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `The first ${k - 1} spins must miss, then the ${ord} must hit. Multiply the miss probability by itself ${k - 1} time(s), then by the hit probability.`,
      skills: ['independence', 'binomial-pmf'],
    };
  },

  explain({ m, k }) {
    const miss = powF(frac(m - 1, m), k - 1);
    const f = mulF(miss, frac(1, m));
    return {
      title: `P(first gold on spin ${k}), hit prob 1/${m}`,
      steps: [
        `Each spin is independent. P(miss) = ${m - 1}/${m}, P(hit) = 1/${m}.`,
        `The first ${k - 1} spin(s) miss and the ${k}th hits.`,
        `P = (${m - 1}/${m})^${k - 1} × (1/${m}) = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ m, k }, trials, rng) {
    let hits = 0;
    const CAP = 1000; // safety bound; P(no success in 1000 spins) is negligible
    for (let i = 0; i < trials; i++) {
      let firstSuccess = -1;
      for (let spin = 1; spin <= CAP; spin++) {
        if (Math.floor(rng() * m) === 0) {
          firstSuccess = spin;
          break;
        }
      }
      if (firstSuccess === k) hits++;
    }
    return hits / trials;
  },
};
