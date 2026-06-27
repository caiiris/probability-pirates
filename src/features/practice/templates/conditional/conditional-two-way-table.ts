/**
 * Template family: conditional-two-way-table
 *
 * Topic: conditional | Skills: conditional-probability
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: no
 *
 * Parameters: a 2×2 contingency table of counts {a, b, c, d}, each ∈ [6, 30]
 *   a = Group 1 AND Yes
 *   b = Group 1 AND No
 *   c = Group 2 AND Yes
 *   d = Group 2 AND No
 *
 * Solve:  P(Yes | Group 1) = a / (a + b)  (exact reduced fraction)
 * Rate:   Easy–medium band; grows with the total table size.
 *
 * This is an EXACT ratio of given counts (no randomness), so there is NO
 * simulate; it is vetted by exact enumeration + a checkAnswer round-trip.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { a: number; b: number; c: number; d: number };

export const conditionalTwoWayTableTemplate: Template<Params> = {
  id: 'conditional-two-way-table',
  topic: 'conditional',
  skills: ['conditional-probability'],
  retrievalForm: 'application',

  rate({ a, b, c, d }) {
    const base = 1050 + (a + b + c + d) * 2;
    return Math.min(1300, Math.max(700, base));
  },

  sample(rng) {
    const a = 6 + Math.floor(rng() * 25); // 6..30
    const b = 6 + Math.floor(rng() * 25); // 6..30
    const c = 6 + Math.floor(rng() * 25); // 6..30
    const d = 6 + Math.floor(rng() * 25); // 6..30
    return { a, b, c, d };
  },

  solve({ a, b }) {
    return { kind: 'fraction', value: frac(a, a + b) };
  },

  render(params) {
    const { a, b, c, d } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const g1 = a + b;
    return {
      id: `conditional-two-way-table:${a},${b},${c},${d}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A member is chosen at random from Group 1. What is the probability that ` +
        `their response is "Yes"?`,
      context:
        `A survey split respondents into two groups and recorded a Yes/No response:\n` +
        `\n` +
        `              Yes     No\n` +
        `  Group 1:     ${a}      ${b}\n` +
        `  Group 2:     ${c}      ${d}`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! Group 1 has ${a} + ${b} = ${g1} members, of whom ${a} answered "Yes": ` +
        `P = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `"Chosen from Group 1" restricts the denominator to Group 1's row total, not the ` +
        `whole survey. Count only Group 1's members.`,
      skills: ['conditional-probability'],
    };
  },

  explain({ a, b, c, d }) {
    const g1 = a + b;
    const f = frac(a, g1);
    return {
      title: `P(Yes | Group 1) from a 2×2 table`,
      steps: [
        `Total surveyed: ${a + b + c + d}. We are told the member is in Group 1, so only Group 1 matters.`,
        `Group 1 row total: ${a} (Yes) + ${b} (No) = ${g1}.`,
        `Condition on Group 1: P(Yes | Group 1) = ${a} / ${g1}.`,
        `Reduced: ${Number(f.num)} / ${Number(f.den)}.`,
      ],
    };
  },
};
