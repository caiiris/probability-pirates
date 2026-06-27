/**
 * Template family: complement-union-two-independent
 *
 * Topic: complement | Skills: complement-rule, independence
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: a ∈ {2,3,4}, b ∈ {2,3,4,5}
 * Two INDEPENDENT events A (prob 1/a) and B (prob 1/b).
 * Solve:      P(A∪B) = 1 − (1−1/a)(1−1/b)   via exact fraction arithmetic
 * Rate:       larger a + b → harder
 */

import type { Template } from '../types';
import { frac, subF, mulF } from '@/lib/probability/exact';

type Params = { a: number; b: number };

const A_VALUES = [2, 3, 4] as const;
const B_VALUES = [2, 3, 4, 5] as const;

export const complementUnionTwoIndependentTemplate: Template<Params> = {
  id: 'complement-union-two-independent',
  topic: 'complement',
  skills: ['complement-rule', 'independence'],
  retrievalForm: 'procedural',

  rate({ a, b }) {
    return 950 + (a + b) * 15;
  },

  sample(rng) {
    const a = A_VALUES[Math.floor(rng() * A_VALUES.length)];
    const b = B_VALUES[Math.floor(rng() * B_VALUES.length)];
    return { a, b };
  },

  solve({ a, b }) {
    // P(A∪B) = 1 − P(neither) = 1 − (1−1/a)(1−1/b)
    const neither = mulF(frac(a - 1, a), frac(b - 1, b));
    return { kind: 'fraction', value: subF(frac(1), neither) };
  },

  render(params) {
    const { a, b } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const trap = mulF(frac(a - 1, a), frac(b - 1, b));
    return {
      id: `complement-union-two-independent:a=${a},b=${b}`,
      interactionKind: 'fill-fraction',
      prompt:
        `Two archers shoot once, independently. The first hits the bullseye with ` +
        `probability 1/${a}, the second with probability 1/${b}. ` +
        `What is the probability that at least one of them hits the bullseye?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! P(at least one) = 1 − (${a - 1}/${a})(${b - 1}/${b}) = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `"At least one" is easiest via the complement: first find the chance that BOTH miss, then subtract from 1.`,
      skills: ['complement-rule', 'independence'],
      misconceptionByFraction: [
        { num: Number(trap.num), den: Number(trap.den), key: 'complement_inversion' },
      ],
    };
  },

  explain({ a, b }) {
    const missA = frac(a - 1, a);
    const missB = frac(b - 1, b);
    const neither = mulF(missA, missB);
    const union = subF(frac(1), neither);
    return {
      title: `P(at least one archer hits)`,
      steps: [
        `Complement rule: P(at least one hits) = 1 − P(both miss).`,
        `P(first misses) = 1 − 1/${a} = ${a - 1}/${a}; P(second misses) = 1 − 1/${b} = ${b - 1}/${b}.`,
        `The shots are independent, so P(both miss) = (${a - 1}/${a})(${b - 1}/${b}) = ${Number(neither.num)}/${Number(neither.den)}.`,
        `P(at least one hits) = 1 − ${Number(neither.num)}/${Number(neither.den)} = ${Number(union.num)}/${Number(union.den)}.`,
      ],
    };
  },

  simulate({ a, b }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const aHit = Math.floor(rng() * a) === 0;
      const bHit = Math.floor(rng() * b) === 0;
      if (aHit || bHit) hits++;
    }
    return hits / trials;
  },
};
