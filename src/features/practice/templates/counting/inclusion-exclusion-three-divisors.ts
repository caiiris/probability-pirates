/**
 * Template family: inclusion-exclusion-three-divisors
 *
 * Topic: inclusion-exclusion | Skills: inclusion-exclusion
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: N (range size), a, b, c (three DISTINCT divisors from {2,3,4,5}).
 * Solve:      P(divisible by a, b, OR c) in 1..N via 3-set inclusion–exclusion:
 *               |a|+|b|+|c| − |ab|−|ac|−|bc| + |abc|
 *             using floor counts ⌊N/d⌋ and ⌊N/lcm(...)⌋.
 * Rate:       Medium band — the full three-set overlap bookkeeping.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { N: number; a: number; b: number; c: number };

const N_VALUES = [20, 24, 30] as const;
const DIVISORS = [2, 3, 4, 5] as const;

function gcd(x: number, y: number): number {
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

function lcm(x: number, y: number): number {
  return (x * y) / gcd(x, y);
}

function lcm3(x: number, y: number, z: number): number {
  return lcm(lcm(x, y), z);
}

/** |{1..N} divisible by a, b, or c| via 3-set inclusion–exclusion. */
function unionCount(N: number, a: number, b: number, c: number): number {
  return (
    Math.floor(N / a) +
    Math.floor(N / b) +
    Math.floor(N / c) -
    Math.floor(N / lcm(a, b)) -
    Math.floor(N / lcm(a, c)) -
    Math.floor(N / lcm(b, c)) +
    Math.floor(N / lcm3(a, b, c))
  );
}

export const inclusionExclusionThreeDivisorsTemplate: Template<Params> = {
  id: 'inclusion-exclusion-three-divisors',
  topic: 'inclusion-exclusion',
  skills: ['inclusion-exclusion'],
  retrievalForm: 'procedural',

  rate({ N }) {
    // Medium band; larger ranges read a touch harder. Capped at 1600.
    return Math.min(1600, 1350 + N * 3);
  },

  sample(rng) {
    const N = N_VALUES[Math.floor(rng() * N_VALUES.length)];
    // Pick three distinct divisors from {2,3,4,5} via a partial shuffle.
    const pool = [...DIVISORS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const [a, b, c] = pool;
    return { N, a, b, c };
  },

  solve({ N, a, b, c }) {
    return { kind: 'fraction', value: frac(unionCount(N, a, b, c), N) };
  },

  render(params) {
    const { N, a, b, c } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const union = unionCount(N, a, b, c);
    const trapNum = Math.floor(N / a) + Math.floor(N / b) + Math.floor(N / c); // omits all pairwise/triple subtractions
    const misconceptionByFraction: { num: number; den: number; key: 'forgot_overlap' }[] = [];
    if (trapNum !== union) {
      const tf = frac(trapNum, N);
      misconceptionByFraction.push({ num: Number(tf.num), den: Number(tf.den), key: 'forgot_overlap' });
    }
    return {
      id: `inclusion-exclusion-three-divisors:N=${N},a=${a},b=${b},c=${c}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A whole number is chosen at random from 1 to ${N}. ` +
        `What is the probability that it is divisible by ${a}, ${b}, or ${c}?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! Inclusion–exclusion gives ${union} favorable numbers, over ${N}.`,
      feedbackDefault:
        `Add ⌊${N}/${a}⌋, ⌊${N}/${b}⌋, ⌊${N}/${c}⌋, subtract each pairwise lcm count, ` +
        `then add back the triple lcm count (inclusion–exclusion).`,
      skills: ['inclusion-exclusion'],
      ...(misconceptionByFraction.length > 0 ? { misconceptionByFraction } : {}),
    };
  },

  explain({ N, a, b, c }) {
    const ca = Math.floor(N / a);
    const cb = Math.floor(N / b);
    const cc = Math.floor(N / c);
    const lab = lcm(a, b);
    const lac = lcm(a, c);
    const lbc = lcm(b, c);
    const labc = lcm3(a, b, c);
    const cab = Math.floor(N / lab);
    const cac = Math.floor(N / lac);
    const cbc = Math.floor(N / lbc);
    const cabc = Math.floor(N / labc);
    const union = unionCount(N, a, b, c);
    const f = frac(union, N);
    return {
      title: `P(divisible by ${a}, ${b}, or ${c}) in 1..${N}`,
      steps: [
        `Singles: ⌊${N}/${a}⌋ = ${ca}, ⌊${N}/${b}⌋ = ${cb}, ⌊${N}/${c}⌋ = ${cc}.`,
        `Pairs (multiples of the lcm): ⌊${N}/${lab}⌋ = ${cab}, ⌊${N}/${lac}⌋ = ${cac}, ⌊${N}/${lbc}⌋ = ${cbc}.`,
        `Triple: multiples of lcm(${a},${b},${c}) = ${labc}: ⌊${N}/${labc}⌋ = ${cabc}.`,
        `Inclusion–exclusion: ${ca} + ${cb} + ${cc} − ${cab} − ${cac} − ${cbc} + ${cabc} = ${union}.`,
        `P = ${union}/${N} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ N, a, b, c }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const x = 1 + Math.floor(rng() * N);
      if (x % a === 0 || x % b === 0 || x % c === 0) hits++;
    }
    return hits / trials;
  },
};
