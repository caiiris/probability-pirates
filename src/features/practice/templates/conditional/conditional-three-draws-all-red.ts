/**
 * Template family: conditional-three-draws-all-red
 *
 * Topic: conditional | Skills: conditional-probability, multiplication-principle
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: r ∈ {3..6} red, b ∈ {3..6} blue. Draw 3 WITHOUT replacement.
 *
 * Solve:  P(all three red)
 *           = r/(r+b) × (r-1)/(r+b-1) × (r-2)/(r+b-2)   (exact, reduced)
 *   Each draw shrinks both the red count and the total by one, so the
 *   conditional probabilities chain via the multiplication principle.
 *
 * Rate: Hard band — a three-step conditional chain.
 */

import type { Template } from '../types';
import { frac, mulF } from '@/lib/probability/exact';

type Params = { r: number; b: number };

export const conditionalThreeDrawsAllRedTemplate: Template<Params> = {
  id: 'conditional-three-draws-all-red',
  topic: 'conditional',
  skills: ['conditional-probability', 'multiplication-principle'],
  retrievalForm: 'procedural',

  rate({ r, b }) {
    return Math.min(1550, 1350 + (r + b) * 10);
  },

  sample(rng) {
    const r = 3 + Math.floor(rng() * 4); // 3..6
    const b = 3 + Math.floor(rng() * 4); // 3..6
    return { r, b };
  },

  solve({ r, b }) {
    const total = r + b;
    const value = mulF(
      mulF(frac(r, total), frac(r - 1, total - 1)),
      frac(r - 2, total - 2),
    );
    return { kind: 'fraction', value };
  },

  render(params) {
    const { r, b } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const total = r + b;
    // Trap: with-replacement value (r/(r+b))³ — the replacement_confusion error
    const trap = mulF(mulF(frac(r, total), frac(r, total)), frac(r, total));
    return {
      id: `conditional-three-draws-all-red:r=${r},b=${b}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A bag holds ${r} red and ${b} blue marbles. You draw three marbles one after ` +
        `another without replacement. What is the probability that all three are red?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! (${r}/${total}) × (${r - 1}/${total - 1}) × (${r - 2}/${total - 2}) = ` +
        `${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Each red you remove drops both the red count and the total by one. Multiply the ` +
        `three conditional probabilities for the first, second, and third draws.`,
      skills: ['conditional-probability', 'multiplication-principle'],
      misconceptionByFraction: [
        { num: Number(trap.num), den: Number(trap.den), key: 'replacement_confusion' },
      ],
    };
  },

  explain({ r, b }) {
    const total = r + b;
    const f = mulF(
      mulF(frac(r, total), frac(r - 1, total - 1)),
      frac(r - 2, total - 2),
    );
    return {
      title: `P(all three red): 3 draws, no replacement, ${r} red / ${b} blue`,
      steps: [
        `P(1st red) = ${r}/${total}.`,
        `Given the 1st was red, ${r - 1} red remain of ${total - 1}: P(2nd red) = ${r - 1}/${total - 1}.`,
        `Given the first two were red, ${r - 2} red remain of ${total - 2}: P(3rd red) = ${r - 2}/${total - 2}.`,
        `Multiply: (${r}/${total}) × (${r - 1}/${total - 1}) × (${r - 2}/${total - 2}) = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ r, b }, trials, rng) {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      let red = r;
      let total = r + b;
      let allRed = true;
      for (let draw = 0; draw < 3; draw++) {
        const isRed = Math.floor(rng() * total) < red;
        if (isRed) {
          red--;
        } else {
          allRed = false;
        }
        total--;
      }
      if (allRed) hits++;
    }
    return hits / trials;
  },
};
