/**
 * Template family: at-least-one-via-complement
 *
 * Topic: complement | Skills: complement-rule, independence
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: m ∈ {2, 4, 6} (die sides / event denominator), n ∈ {2..5} (trials)
 * Solve:      1 - ((m-1)/m)^n  via exact fraction arithmetic
 * Rate:       larger n and larger m → harder
 */

import type { Template } from '../types';
import { frac, subF, mulF } from '@/lib/probability/exact';
import type { Fraction } from '@/lib/probability/exact';

type Params = { m: number; n: number };

const M_VALUES = [2, 4, 6] as const;

/** Exact (base)^exp using repeated mulF. */
function powF(base: Fraction, exp: number): Fraction {
  let result = frac(1);
  for (let i = 0; i < exp; i++) {
    result = mulF(result, base);
  }
  return result;
}

/** Human-readable scenario noun and event based on m. */
function scenario(m: number): {
  thing: string;
  verb: string;
  trialPlural: string;
  eventPrompt: string;
  eventTitle: string;
} {
  if (m === 2) {
    return {
      thing: 'fair coin',
      verb: 'flipped',
      trialPlural: 'flips',
      eventPrompt: 'heads',
      eventTitle: 'head',
    };
  }
  if (m === 4) {
    return {
      thing: 'fair 4-sided die',
      verb: 'rolled',
      trialPlural: 'rolls',
      eventPrompt: 'a 1',
      eventTitle: '1',
    };
  }
  return {
    thing: 'fair six-sided die',
    verb: 'rolled',
    trialPlural: 'rolls',
    eventPrompt: 'a 6',
    eventTitle: '6',
  };
}

export const atLeastOneViaComplementTemplate: Template<Params> = {
  id: 'at-least-one-via-complement',
  topic: 'complement',
  skills: ['complement-rule', 'independence'],
  retrievalForm: 'procedural',

  rate({ m, n }) {
    // Base ~900; harder for more trials (n) and larger denominator (m)
    const mBonus = m === 2 ? 0 : m === 4 ? 50 : 100;
    return 900 + (n - 2) * 100 + mBonus;
  },

  sample(rng) {
    const m = M_VALUES[Math.floor(rng() * 3)];
    const n = 2 + Math.floor(rng() * 4); // n ∈ {2..5}
    return { m, n };
  },

  solve({ m, n }) {
    // 1 - ((m-1)/m)^n
    const missOneF = frac(m - 1, m);
    const missAllF = powF(missOneF, n);
    return { kind: 'fraction', value: subF(frac(1), missAllF) };
  },

  render(params) {
    const { m, n } = params;
    const sc = scenario(m);
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const missAll = powF(frac(m - 1, m), n);
    return {
      id: `at-least-one-via-complement:m=${m},n=${n}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A ${sc.thing} is ${sc.verb} ${n} times independently. ` +
        `What is the probability of getting ${sc.eventPrompt} at least once?`,
      numerator: Number(num),
      denominator: Number(den),
      numeratorLabel: 'favorable outcomes',
      denominatorLabel: 'total equally-likely outcomes',
      feedbackCorrect:
        `Correct! Using the complement: 1 − (${m - 1}/${m})^${n} = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Use the complement rule: P(at least one) = 1 − P(none). ` +
        `P(miss on one trial) = ${m - 1}/${m}, so P(miss all ${n}) = (${m - 1}/${m})^${n} = ${Number(missAll.num)}/${Number(missAll.den)}.`,
      skills: ['complement-rule', 'independence'],
    };
  },

  explain({ m, n }) {
    const sc = scenario(m);
    const missOne = frac(m - 1, m);
    const missAll = powF(missOne, n);
    const hit = subF(frac(1), missAll);
    return {
      title: `P(at least one ${sc.eventTitle} in ${n} ${sc.trialPlural})`,
      steps: [
        `Complement rule: P(at least one) = 1 − P(zero occurrences).`,
        `P(miss on a single trial) = 1 − 1/${m} = ${m - 1}/${m}.`,
        `Trials are independent, so P(miss all ${n}) = (${m - 1}/${m})^${n} = ${Number(missAll.num)}/${Number(missAll.den)}.`,
        `P(at least one) = 1 − ${Number(missAll.num)}/${Number(missAll.den)} = ${Number(hit.num)}/${Number(hit.den)}.`,
      ],
    };
  },

  simulate({ m, n }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      let atLeastOne = false;
      for (let j = 0; j < n; j++) {
        // P(success on one trial) = 1/m; consume rng even after first hit to keep
        // each trial statistically independent and the rng stream consistent.
        if (Math.floor(rng() * m) === 0) atLeastOne = true;
      }
      if (atLeastOne) hits++;
    }
    return hits / trials;
  },
};
