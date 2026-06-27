/**
 * Template family: single-event-prob
 *
 * Topic: counting | Skills: favorable-over-total, equally-likely-outcomes
 * Retrieval form: operation | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: red ∈ {1..5}, blue ∈ {1..5}
 * Solve:      red / (red + blue)  (exact, reduced)
 * Rate:       Easy band — the foundational favorable/total skill.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { red: number; blue: number };

export const singleEventProbTemplate: Template<Params> = {
  id: 'single-event-prob',
  topic: 'counting',
  skills: ['favorable-over-total', 'equally-likely-outcomes'],
  retrievalForm: 'operation',

  rate({ red, blue }) {
    // Easy band (<950): a touch harder as the total grows.
    return 760 + Math.min(120, (red + blue) * 8);
  },

  sample(rng) {
    const red = 1 + Math.floor(rng() * 5); // 1..5
    const blue = 1 + Math.floor(rng() * 5); // 1..5
    return { red, blue };
  },

  solve({ red, blue }) {
    return { kind: 'fraction', value: frac(red, red + blue) };
  },

  render(params) {
    const { red, blue } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const total = red + blue;
    return {
      id: `single-event-prob:r=${red},b=${blue}`,
      interactionKind: 'fill-fraction',
      prompt:
        `A bag holds ${red} red and ${blue} blue marbles. ` +
        `You draw one marble at random. What is the probability it is red?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect: `Correct! ${red} red out of ${total} total = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Count the favorable outcomes (red marbles) over the total number of equally likely marbles.`,
      skills: ['favorable-over-total', 'equally-likely-outcomes'],
    };
  },

  explain({ red, blue }) {
    const total = red + blue;
    const f = frac(red, total);
    return {
      title: `P(red) from ${red} red and ${blue} blue`,
      steps: [
        `Every marble is equally likely to be drawn.`,
        `Favorable outcomes (red): ${red}. Total outcomes: ${red} + ${blue} = ${total}.`,
        `P(red) = ${red}/${total} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ red, blue }, trials, rng) {
    const total = red + blue;
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (Math.floor(rng() * total) < red) hits++;
    }
    return hits / trials;
  },
};
