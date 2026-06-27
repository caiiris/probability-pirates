/**
 * Template family: monty-hall-n-doors
 *
 * Topic: conditional | Skills: monty-hall-reasoning, conditional-probability
 * Retrieval form: procedural | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: n ∈ {3, 4, 5, 6} doors, exactly one hides a car.
 *   You pick one door. The host opens exactly ONE other door revealing a
 *   goat (never the car, never your pick). You then SWITCH to one of the
 *   remaining unopened doors chosen uniformly at random.
 *
 * Solve:  P(win by switching) = (n-1) / (n(n-2))   (exact reduced fraction)
 *   Derivation:
 *     - P(initial pick is the car) = 1/n → switching always loses.
 *     - P(initial pick is a goat) = (n-1)/n → the car sits among the n-2
 *       remaining unopened doors, so the random switch wins with prob 1/(n-2).
 *     - Total = (n-1)/n × 1/(n-2) = (n-1)/(n(n-2)).
 *   Check: n=3 → 2/(3·1) = 2/3 (the classic answer).
 *
 * Rate: Hard band — the result is non-intuitive and varies with n.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = { n: number };

export const montyHallNDoorsTemplate: Template<Params> = {
  id: 'monty-hall-n-doors',
  topic: 'conditional',
  skills: ['monty-hall-reasoning', 'conditional-probability'],
  retrievalForm: 'procedural',

  rate({ n }) {
    // Smaller n is (slightly) more surprising; keep within the hard band ≤ 1650.
    return Math.min(1650, 1450 + (6 - n) * 20);
  },

  sample(rng) {
    const n = 3 + Math.floor(rng() * 4); // 3..6
    return { n };
  },

  solve({ n }) {
    return { kind: 'fraction', value: frac(n - 1, n * (n - 2)) };
  },

  render(params) {
    const { n } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    return {
      id: `monty-hall-n-doors:n=${n}`,
      interactionKind: 'fill-fraction',
      prompt:
        `There are ${n} doors; one hides a car and the rest hide goats. You pick a door. ` +
        `The host, who knows where the car is, opens exactly one other door to reveal a goat. ` +
        `You then switch to one of the remaining unopened doors, chosen at random. ` +
        `What is the probability you win the car?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! P(win) = (${n - 1})/(${n}·${n - 2}) = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Split on your first pick. If you first picked the car (prob 1/${n}) switching loses. ` +
        `Otherwise the car is behind one of the remaining unopened doors, and your random ` +
        `switch lands on it with probability 1/(${n} − 2).`,
      skills: ['monty-hall-reasoning', 'conditional-probability'],
    };
  },

  explain({ n }) {
    const f = frac(n - 1, n * (n - 2));
    return {
      title: `P(win by switching) with ${n} doors`,
      steps: [
        `Case A — your first pick is the car: probability 1/${n}. The car is your door, so the ${n - 2} remaining unopened doors are all goats and switching loses.`,
        `Case B — your first pick is a goat: probability ${n - 1}/${n}. The car is among the doors you did not pick; after the host opens one goat, ${n - 2} unopened doors remain and exactly one hides the car.`,
        `In Case B your random switch wins with probability 1/(${n} − 2) = 1/${n - 2}.`,
        `Combine: P(win) = (${n - 1}/${n}) × (1/${n - 2}) = (${n - 1})/(${n}·${n - 2}) = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate({ n }, trials, rng) {
    let wins = 0;
    for (let i = 0; i < trials; i++) {
      const car = Math.floor(rng() * n);
      const pick = Math.floor(rng() * n);

      // Host opens exactly one door that is neither the car nor your pick.
      const openable: number[] = [];
      for (let d = 0; d < n; d++) {
        if (d !== car && d !== pick) openable.push(d);
      }
      const opened = openable[Math.floor(rng() * openable.length)];

      // Switch to a uniformly random door that is neither your pick nor the opened one.
      const remaining: number[] = [];
      for (let d = 0; d < n; d++) {
        if (d !== pick && d !== opened) remaining.push(d);
      }
      const newPick = remaining[Math.floor(rng() * remaining.length)];

      if (newPick === car) wins++;
    }
    return wins / trials;
  },
};
