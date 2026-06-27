/**
 * Template family: without-replacement-two-draws
 *
 * Topic: conditional | Skills: conditional-probability, multiplication-principle
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: r ∈ {2..5} red, b ∈ {2..5} blue
 * Solve:      P(both red) = r/(r+b) × (r-1)/(r+b-1)  (exact, reduced)
 * Rate:       Hard band — the count AND total change after the first draw.
 */

import type { Template } from '../types';
import { frac, mulF } from '@/lib/probability/exact';

type Params = { r: number; b: number };

export const withoutReplacementTwoDrawsTemplate: Template<Params> = {
  id: 'without-replacement-two-draws',
  topic: 'conditional',
  skills: ['conditional-probability', 'multiplication-principle'],
  retrievalForm: 'procedural',

  rate({ r, b }) {
    // Hard band (~1280–1450).
    return 1280 + (r + b) * 12;
  },

  sample(rng) {
    const r = 2 + Math.floor(rng() * 4); // 2..5
    const b = 2 + Math.floor(rng() * 4); // 2..5
    return { r, b };
  },

  solve({ r, b }) {
    const total = r + b;
    return { kind: 'fraction', value: mulF(frac(r, total), frac(r - 1, total - 1)) };
  },

  render(params) {
    const { r, b } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const total = r + b;
    // Trap: with-replacement value (r/(r+b))² — the replacement_confusion error
    const trap = mulF(frac(r, total), frac(r, total));
    return {
      id: `without-replacement-two-draws:r=${r},b=${b}`,
      interactionKind: 'fill-fraction',
      prompt:
        `An urn has ${r} red and ${b} blue marbles. You draw two marbles one after another ` +
        `without replacement. What is the probability that both are red?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! (${r}/${total}) × (${r - 1}/${total - 1}) = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `After the first red is removed, both the red count and the total shrink by one. ` +
        `Multiply the first-draw probability by the conditional second-draw probability.`,
      skills: ['conditional-probability', 'multiplication-principle'],
      misconceptionByFraction: [
        { num: Number(trap.num), den: Number(trap.den), key: 'replacement_confusion' },
      ],
    };
  },

  explain({ r, b }) {
    const total = r + b;
    const f = mulF(frac(r, total), frac(r - 1, total - 1));
    return {
      title: `P(both red): 2 draws, no replacement, ${r} red / ${b} blue`,
      steps: [
        `P(first red) = ${r}/${total}.`,
        `Given the first was red, ${r - 1} red remain of ${total - 1}: P(second red | first red) = ${r - 1}/${total - 1}.`,
        `Multiply: (${r}/${total}) × (${r - 1}/${total - 1}) = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ r, b }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      let red = r;
      let total = r + b;
      const firstRed = Math.floor(rng() * total) < red;
      if (firstRed) red--;
      total--;
      const secondRed = Math.floor(rng() * total) < red;
      if (firstRed && secondRed) hits++;
    }
    return hits / trials;
  },
};
