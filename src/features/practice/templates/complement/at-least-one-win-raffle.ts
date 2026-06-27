/**
 * Template family: at-least-one-win-raffle
 *
 * Topic: complement | Skills: complement-rule, independence
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: s ∈ {3,4,5,6} equally-likely sections, n ∈ {2,3,4} independent spins
 * One section is the single winning section.
 * Solve:      P(at least one win) = 1 − ((s−1)/s)^n   via exact fraction arithmetic
 *             den = s^n ≤ 1296, well under the 9999 input cap.
 * Rate:       larger n and larger s → harder
 */

import type { Template } from '../types';
import { frac, subF, mulF } from '@/lib/probability/exact';
import type { Fraction } from '@/lib/probability/exact';

type Params = { s: number; n: number };

const S_VALUES = [3, 4, 5, 6] as const;
const N_VALUES = [2, 3, 4] as const;

/** Exact (base)^exp using repeated mulF. */
function powF(base: Fraction, exp: number): Fraction {
  let result = frac(1);
  for (let i = 0; i < exp; i++) {
    result = mulF(result, base);
  }
  return result;
}

export const atLeastOneWinRaffleTemplate: Template<Params> = {
  id: 'at-least-one-win-raffle',
  topic: 'complement',
  skills: ['complement-rule', 'independence'],
  retrievalForm: 'procedural',

  rate({ s, n }) {
    return 900 + n * 40 + s * 20;
  },

  sample(rng) {
    const s = S_VALUES[Math.floor(rng() * S_VALUES.length)];
    const n = N_VALUES[Math.floor(rng() * N_VALUES.length)];
    return { s, n };
  },

  solve({ s, n }) {
    // 1 − ((s−1)/s)^n
    const missAll = powF(frac(s - 1, s), n);
    return { kind: 'fraction', value: subF(frac(1), missAll) };
  },

  render(params) {
    const { s, n } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const trap = powF(frac(s - 1, s), n);
    return {
      id: `at-least-one-win-raffle:s=${s},n=${n}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A prize wheel has ${s} equally-likely sections, exactly one of which wins. ` +
        `You spin it ${n} times independently. ` +
        `What is the probability that at least one spin lands on the winning section?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! P(at least one win) = 1 − (${s - 1}/${s})^${n} = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Think about the opposite: every spin misses the winning section. Find that probability, then subtract from 1.`,
      skills: ['complement-rule', 'independence'],
      misconceptionByFraction: [
        { num: Number(trap.num), den: Number(trap.den), key: 'complement_inversion' },
      ],
    };
  },

  explain({ s, n }) {
    const missOne = frac(s - 1, s);
    const missAll = powF(missOne, n);
    const win = subF(frac(1), missAll);
    return {
      title: `P(at least one winning spin in ${n} spins)`,
      steps: [
        `Complement rule: P(at least one win) = 1 − P(no spin wins).`,
        `P(a single spin misses) = 1 − 1/${s} = ${s - 1}/${s}.`,
        `The spins are independent, so P(all ${n} miss) = (${s - 1}/${s})^${n} = ${Number(missAll.num)}/${Number(missAll.den)}.`,
        `P(at least one win) = 1 − ${Number(missAll.num)}/${Number(missAll.den)} = ${Number(win.num)}/${Number(win.den)}.`,
      ],
    };
  },

  simulate({ s, n }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      let won = false;
      for (let j = 0; j < n; j++) {
        // The winning section is index 0; each spin is uniform over s sections.
        if (Math.floor(rng() * s) === 0) won = true;
      }
      if (won) hits++;
    }
    return hits / trials;
  },
};
