/**
 * Template family: inclusion-exclusion-two-events
 *
 * Topic: inclusion-exclusion | Skills: inclusion-exclusion, favorable-over-total
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: N (class size), c (both), x (only X), y (only Y).
 *   A = c + x students play sport X, B = c + y play sport Y.
 * Solve:      P(plays X or Y) = (x + y + c) / N  via P(A∪B) = P(A)+P(B)−P(A∩B).
 * Rate:       Medium band — the two-set overlap subtraction in a word problem.
 *
 * The classic trap is adding A + B and forgetting to subtract the overlap c;
 * feedbackDefault names the subtraction explicitly.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { N: number; c: number; x: number; y: number; flavor: number };

const N_VALUES = [20, 24, 25, 30, 40] as const;

const FLAVORS = [
  { x: 'soccer', y: 'tennis' },
  { x: 'chess', y: 'debate' },
  { x: 'piano', y: 'violin' },
] as const;

export const inclusionExclusionTwoEventsTemplate: Template<Params> = {
  id: 'inclusion-exclusion-two-events',
  topic: 'inclusion-exclusion',
  skills: ['inclusion-exclusion', 'favorable-over-total'],
  retrievalForm: 'application',

  rate({ N, c }) {
    // Medium band (~1080–1260): larger classes and bigger overlaps read harder.
    return 1080 + Math.min(120, N * 3) + c * 12;
  },

  sample(rng) {
    const N = N_VALUES[Math.floor(rng() * N_VALUES.length)];
    const c = 1 + Math.floor(rng() * 4); // both: 1..4
    const x = 2 + Math.floor(rng() * 7); // only X: 2..8
    const y = 2 + Math.floor(rng() * 7); // only Y: 2..8
    const flavor = Math.floor(rng() * FLAVORS.length);
    return { N, c, x, y, flavor };
  },

  solve({ N, c, x, y }) {
    return { kind: 'fraction', value: frac(x + y + c, N) };
  },

  render(params) {
    const { N, c, x, y, flavor } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const a = c + x;
    const b = c + y;
    const sport = FLAVORS[flavor];
    const union = x + y + c;
    const trapNum = a + b; // omits overlap subtraction: A+B instead of A+B−c
    const misconceptionByFraction: { num: number; den: number; key: 'forgot_overlap' }[] = [];
    if (trapNum !== union) {
      const tf = frac(trapNum, N);
      misconceptionByFraction.push({ num: Number(tf.num), den: Number(tf.den), key: 'forgot_overlap' });
    }
    return {
      id: `inclusion-exclusion-two-events:N=${N},c=${c},x=${x},y=${y},f=${flavor}`,
      interactionKind: 'fill-fraction',
      prompt:
        `In a class of ${N} students, ${a} play ${sport.x}, ${b} play ${sport.y}, ` +
        `and ${c} play both. One student is chosen at random. ` +
        `What is the probability they play ${sport.x} or ${sport.y}?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! (${a} + ${b} − ${c}) / ${N} = ${union}/${N}.`,
      feedbackDefault:
        `Add the two groups, then subtract the ${c} who were counted in both: ` +
        `(${a} + ${b} − ${c}) / ${N} (inclusion–exclusion).`,
      skills: ['inclusion-exclusion', 'favorable-over-total'],
      ...(misconceptionByFraction.length > 0 ? { misconceptionByFraction } : {}),
    };
  },

  explain({ N, c, x, y }) {
    const a = c + x;
    const b = c + y;
    const union = x + y + c;
    const f = frac(union, N);
    return {
      title: `P(plays X or Y) in a class of ${N}`,
      steps: [
        `${a} play the first sport and ${b} play the second, but ${c} were counted in BOTH groups.`,
        `Inclusion–exclusion: |X ∪ Y| = ${a} + ${b} − ${c} = ${union}.`,
        `P = ${union}/${N} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ N, c, x, y }, trials, rng) {
    const union = x + y + c; // favorable students out of N
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (Math.floor(rng() * N) < union) hits++;
    }
    return hits / trials;
  },
};
