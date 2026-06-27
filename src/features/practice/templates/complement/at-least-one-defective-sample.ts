/**
 * Template family: at-least-one-defective-sample (HARD, cross-concept)
 *
 * Topic: complement | Skills: complement-rule, combinations
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: N ∈ {8,10,12}, d ∈ {2,3} defective, k ∈ {2,3,4} drawn WITHOUT
 *             replacement, with the guarantee k ≤ N − d.
 * Solve:      P(at least one defective) = 1 − C(N−d, k) / C(N, k)
 *             den = C(N, k) ≤ C(12,4) = 495, well under the 9999 input cap.
 * Rate:       more defectives and a larger draw → harder
 */

import type { Template } from '../types';
import { frac, nCr } from '@/lib/probability/exact';

type Params = { N: number; d: number; k: number };

const N_VALUES = [8, 10, 12] as const;
const D_VALUES = [2, 3] as const;
const K_VALUES = [2, 3, 4] as const;

export const atLeastOneDefectiveSampleTemplate: Template<Params> = {
  id: 'at-least-one-defective-sample',
  topic: 'complement',
  skills: ['complement-rule', 'combinations'],
  retrievalForm: 'application',

  rate({ d, k }) {
    return 1300 + d * 30 + k * 30;
  },

  sample(rng) {
    const N = N_VALUES[Math.floor(rng() * N_VALUES.length)];
    const d = D_VALUES[Math.floor(rng() * D_VALUES.length)];
    const k = K_VALUES[Math.floor(rng() * K_VALUES.length)];
    // For every combination above, N − d ≥ 8 − 3 = 5 ≥ k, so k ≤ N − d always holds.
    return { N, d, k };
  },

  solve({ N, d, k }) {
    // P(at least one defective) = 1 − C(N−d, k)/C(N, k)
    // Build as (C(N,k) − C(N−d,k)) / C(N,k); subtract bigints before frac.
    const total = nCr(N, k);
    const noneDefective = nCr(N - d, k);
    return { kind: 'fraction', value: frac(total - noneDefective, total) };
  },

  render(params) {
    const { N, d, k } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const trap = frac(nCr(N - d, k), nCr(N, k));
    return {
      id: `at-least-one-defective-sample:N=${N},d=${d},k=${k}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A box holds ${N} components, of which ${d} are defective. ` +
        `You draw ${k} of them at random without replacement. ` +
        `What is the probability that at least one of the drawn components is defective?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! P(at least one defective) = 1 − C(${N - d},${k})/C(${N},${k}) = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `"At least one" is easiest via the complement: find the chance that ALL ${k} drawn are non-defective, then subtract from 1.`,
      skills: ['complement-rule', 'combinations'],
      misconceptionByFraction: [
        { num: Number(trap.num), den: Number(trap.den), key: 'complement_inversion' },
      ],
    };
  },

  explain({ N, d, k }) {
    const total = nCr(N, k);
    const noneDefective = nCr(N - d, k);
    const answerNum = total - noneDefective;
    const reduced = frac(answerNum, total);
    return {
      title: `P(at least one defective in ${k} draws)`,
      steps: [
        `Complement rule: P(at least one defective) = 1 − P(no defective drawn).`,
        `Total ways to choose ${k} from ${N}: C(${N},${k}) = ${total.toString()}.`,
        `Ways to choose ${k} from the ${N - d} non-defective components: C(${N - d},${k}) = ${noneDefective.toString()}.`,
        `P(no defective) = ${noneDefective.toString()}/${total.toString()}, so P(at least one defective) = 1 − ${noneDefective.toString()}/${total.toString()} = ${Number(reduced.num)}/${Number(reduced.den)}.`,
      ],
    };
  },

  simulate({ N, d, k }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      // Items 0..d-1 are defective. Draw k distinct items via partial Fisher–Yates.
      const pool: number[] = [];
      for (let j = 0; j < N; j++) pool.push(j);
      let anyDefective = false;
      for (let draw = 0; draw < k; draw++) {
        const swap = draw + Math.floor(rng() * (N - draw));
        const tmp = pool[draw];
        pool[draw] = pool[swap];
        pool[swap] = tmp;
        if (pool[draw] < d) anyDefective = true;
      }
      if (anyDefective) hits++;
    }
    return hits / trials;
  },
};
