/**
 * Template family: complement-union-three-independent
 *
 * Topic: complement | Skills: complement-rule, independence
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: a, b, c each ∈ {2,3,4}
 * Three INDEPENDENT events with probabilities 1/a, 1/b, 1/c.
 * Solve:      P(A∪B∪C) = 1 − (1−1/a)(1−1/b)(1−1/c)
 *             den = a*b*c ≤ 64, well under the 9999 input cap.
 * Rate:       larger a + b + c → harder
 */

import type { Template } from '../types';
import { frac, subF, mulF } from '@/lib/probability/exact';

type Params = { a: number; b: number; c: number };

const VALUES = [2, 3, 4] as const;

export const complementUnionThreeIndependentTemplate: Template<Params> = {
  id: 'complement-union-three-independent',
  topic: 'complement',
  skills: ['complement-rule', 'independence'],
  retrievalForm: 'procedural',

  rate({ a, b, c }) {
    return 1050 + (a + b + c) * 20;
  },

  sample(rng) {
    const a = VALUES[Math.floor(rng() * VALUES.length)];
    const b = VALUES[Math.floor(rng() * VALUES.length)];
    const c = VALUES[Math.floor(rng() * VALUES.length)];
    return { a, b, c };
  },

  solve({ a, b, c }) {
    // P(A∪B∪C) = 1 − (1−1/a)(1−1/b)(1−1/c)
    const neither = mulF(mulF(frac(a - 1, a), frac(b - 1, b)), frac(c - 1, c));
    return { kind: 'fraction', value: subF(frac(1), neither) };
  },

  render(params) {
    const { a, b, c } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const trap = mulF(mulF(frac(a - 1, a), frac(b - 1, b)), frac(c - 1, c));
    return {
      id: `complement-union-three-independent:a=${a},b=${b},c=${c}`,
      interactionKind: 'fill-fraction',
      prompt:
        `Three machines run independently. They jam with probabilities ` +
        `1/${a}, 1/${b}, and 1/${c} on a given day. ` +
        `What is the probability that at least one machine jams?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! P(at least one jam) = 1 − (${a - 1}/${a})(${b - 1}/${b})(${c - 1}/${c}) = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Use the complement: find the probability that NONE of the three jam, then subtract from 1.`,
      skills: ['complement-rule', 'independence'],
      misconceptionByFraction: [
        { num: Number(trap.num), den: Number(trap.den), key: 'complement_inversion' },
      ],
    };
  },

  explain({ a, b, c }) {
    const neither = mulF(mulF(frac(a - 1, a), frac(b - 1, b)), frac(c - 1, c));
    const union = subF(frac(1), neither);
    return {
      title: `P(at least one machine jams)`,
      steps: [
        `Complement rule: P(at least one jam) = 1 − P(no machine jams).`,
        `P(a given machine does not jam) = 1 − 1/x, giving ${a - 1}/${a}, ${b - 1}/${b}, and ${c - 1}/${c}.`,
        `The machines are independent, so P(none jam) = (${a - 1}/${a})(${b - 1}/${b})(${c - 1}/${c}) = ${Number(neither.num)}/${Number(neither.den)}.`,
        `P(at least one jam) = 1 − ${Number(neither.num)}/${Number(neither.den)} = ${Number(union.num)}/${Number(union.den)}.`,
      ],
    };
  },

  simulate({ a, b, c }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const aHit = Math.floor(rng() * a) === 0;
      const bHit = Math.floor(rng() * b) === 0;
      const cHit = Math.floor(rng() * c) === 0;
      if (aHit || bHit || cHit) hits++;
    }
    return hits / trials;
  },
};
