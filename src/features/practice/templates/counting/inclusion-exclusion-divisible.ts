/**
 * Template family: inclusion-exclusion-divisible
 *
 * Topic: counting | Skills: favorable-over-total, sample-space-enumeration
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: N (range size), a, b (two divisors, a ≠ b)
 * Solve:      P(divisible by a OR b) = (⌊N/a⌋ + ⌊N/b⌋ − ⌊N/lcm(a,b)⌋) / N
 * Rate:       Medium band — the classic inclusion–exclusion overlap subtraction.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { N: number; a: number; b: number };

const N_VALUES = [12, 18, 20, 24, 30] as const;
const A_VALUES = [2, 3] as const;
const B_VALUES = [3, 4, 5] as const;

function gcd(x: number, y: number): number {
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

function lcm(x: number, y: number): number {
  return (x * y) / gcd(x, y);
}

/** |{1..N} divisible by a or b| via inclusion–exclusion. */
function unionCount(N: number, a: number, b: number): number {
  return Math.floor(N / a) + Math.floor(N / b) - Math.floor(N / lcm(a, b));
}

export const inclusionExclusionDivisibleTemplate: Template<Params> = {
  id: 'inclusion-exclusion-divisible',
  topic: 'inclusion-exclusion',
  skills: ['inclusion-exclusion', 'favorable-over-total', 'sample-space-enumeration'],
  retrievalForm: 'procedural',

  rate({ N, a, b }) {
    // Medium band (~1050–1250); larger range and larger lcm read a touch harder.
    return 1050 + Math.min(120, N * 4) + lcm(a, b) * 4;
  },

  sample(rng) {
    const N = N_VALUES[Math.floor(rng() * N_VALUES.length)];
    const a = A_VALUES[Math.floor(rng() * A_VALUES.length)];
    let b = B_VALUES[Math.floor(rng() * B_VALUES.length)];
    if (b === a) b = a === 3 ? 4 : 3; // keep the two divisors distinct
    return { N, a, b };
  },

  solve({ N, a, b }) {
    return { kind: 'fraction', value: frac(unionCount(N, a, b), N) };
  },

  render(params) {
    const { N, a, b } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const correct = unionCount(N, a, b);
    const trapNum = Math.floor(N / a) + Math.floor(N / b); // omits lcm overlap subtraction
    const misconceptionByFraction: { num: number; den: number; key: 'forgot_overlap' }[] = [];
    if (trapNum !== correct) {
      const tf = frac(trapNum, N);
      misconceptionByFraction.push({ num: Number(tf.num), den: Number(tf.den), key: 'forgot_overlap' });
    }
    return {
      id: `inclusion-exclusion-divisible:N=${N},a=${a},b=${b}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A whole number is chosen at random from 1 to ${N}. ` +
        `What is the probability that it is divisible by ${a} or by ${b}?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! ⌊${N}/${a}⌋ + ⌊${N}/${b}⌋ − ⌊${N}/${lcm(a, b)}⌋ = ${unionCount(N, a, b)}, over ${N}.`,
      feedbackDefault:
        `Count multiples of ${a} and multiples of ${b}, but the multiples of ${lcm(a, b)} were counted twice — subtract them once (inclusion–exclusion).`,
      skills: ['inclusion-exclusion', 'favorable-over-total', 'sample-space-enumeration'],
      ...(misconceptionByFraction.length > 0 ? { misconceptionByFraction } : {}),
    };
  },

  explain({ N, a, b }) {
    const l = lcm(a, b);
    const ca = Math.floor(N / a);
    const cb = Math.floor(N / b);
    const cab = Math.floor(N / l);
    const f = frac(unionCount(N, a, b), N);
    return {
      title: `P(divisible by ${a} or ${b}) in 1..${N}`,
      steps: [
        `Multiples of ${a}: ⌊${N}/${a}⌋ = ${ca}. Multiples of ${b}: ⌊${N}/${b}⌋ = ${cb}.`,
        `Numbers divisible by BOTH are multiples of lcm(${a},${b}) = ${l}: ⌊${N}/${l}⌋ = ${cab}. These were counted twice.`,
        `Inclusion–exclusion: ${ca} + ${cb} − ${cab} = ${unionCount(N, a, b)} favorable.`,
        `P = ${unionCount(N, a, b)}/${N} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ N, a, b }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const x = 1 + Math.floor(rng() * N);
      if (x % a === 0 || x % b === 0) hits++;
    }
    return hits / trials;
  },
};
