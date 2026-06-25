/**
 * Template family: sum-of-two-dice
 *
 * Topic: counting | Skills: sample-space-enumeration, equally-likely-outcomes
 * Retrieval form: operation | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: k ∈ {2..12} (desired sum)
 * Solve:      enumerate pairs (a,b) ∈ {1..6}^2 with a+b=k; return count/36 reduced
 * Rate:       k=7 (6 pairs) → ~800 easy; k=2 or 12 (1 pair) → ~1300 hard
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { k: number };

/** Number of ordered pairs (a,b) ∈ {1..6}² with a+b = k. */
function pairsForSum(k: number): number {
  let count = 0;
  for (let a = 1; a <= 6; a++) {
    const b = k - a;
    if (b >= 1 && b <= 6) count++;
  }
  return count;
}

/** Human-readable list of pairs that produce sum k. */
function pairsList(k: number): string {
  const list: string[] = [];
  for (let a = 1; a <= 6; a++) {
    const b = k - a;
    if (b >= 1 && b <= 6) list.push(`(${a},${b})`);
  }
  return list.join(', ');
}

export const sumOfTwoDiceTemplate: Template<Params> = {
  id: 'sum-of-two-dice',
  topic: 'counting',
  skills: ['sample-space-enumeration', 'equally-likely-outcomes'],
  retrievalForm: 'operation',

  rate({ k }) {
    // 6 pairs at k=7 → rate 800; 1 pair at k=2/12 → rate 1300
    return 800 + (6 - pairsForSum(k)) * 100;
  },

  sample(rng) {
    return { k: 2 + Math.floor(rng() * 11) }; // k ∈ {2..12}
  },

  solve({ k }) {
    return { kind: 'fraction', value: frac(pairsForSum(k), 36) };
  },

  render(params) {
    const { k } = params;
    const count = pairsForSum(k);
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    return {
      id: `sum-of-two-dice:k=${k}`,
      interactionKind: 'fill-fraction',
      prompt: `You roll two fair six-sided dice. What is the probability the sum equals ${k}?`,
      numerator: Number(num),
      denominator: Number(den),
      numeratorLabel: `ways to get sum ${k}`,
      denominatorLabel: 'total equally-likely outcomes',
      feedbackCorrect: `Correct! There ${count === 1 ? 'is' : 'are'} ${count} pair${count !== 1 ? 's' : ''} summing to ${k} out of 36 equally-likely outcomes.`,
      feedbackDefault: `List every ordered pair (a, b) with a, b ∈ {1–6} and a+b=${k}: ${pairsList(k)}. That's ${count} out of 36.`,
      skills: ['sample-space-enumeration', 'equally-likely-outcomes'],
    };
  },

  explain({ k }) {
    const count = pairsForSum(k);
    const f = frac(count, 36);
    const isReduced = Number(f.den) !== 36;
    return {
      title: `P(sum = ${k}) by enumeration`,
      steps: [
        `Rolling two dice produces 6 × 6 = 36 equally-likely ordered outcomes.`,
        `Pairs (a, b) with a + b = ${k}: ${pairsList(k)}.`,
        `Favorable outcomes: ${count}.`,
        isReduced
          ? `P(sum = ${k}) = ${count}/36 = ${Number(f.num)}/${Number(f.den)}.`
          : `P(sum = ${k}) = ${count}/36.`,
      ],
    };
  },

  simulate({ k }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      const a = 1 + Math.floor(rng() * 6);
      const b = 1 + Math.floor(rng() * 6);
      if (a + b === k) hits++;
    }
    return hits / trials;
  },
};
