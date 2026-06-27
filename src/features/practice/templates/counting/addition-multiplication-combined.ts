/**
 * Template family: addition-multiplication-combined
 *
 * Topic: counting | Skills: multiplication-principle, sample-space-enumeration
 * Retrieval form: application | Interaction: number-fill (free response) | No simulate
 *
 * Parameters: teas a ∈ {2..4}, coffees c ∈ {2..4}, pastries p ∈ {2..4}
 * Solve:      (a + c) × p
 *   - addition: a tea OR a coffee → (a + c) drinks
 *   - multiplication: that drink AND a pastry → × p
 *
 * Two classic traps are nudged via feedbackByWrongAnswer:
 *   a×c×p (multiplied the two drink groups) and a+c+p (added everything).
 */

import type { Template } from '../types';

type Params = { a: number; c: number; p: number };

export const additionMultiplicationCombinedTemplate: Template<Params> = {
  id: 'addition-multiplication-combined',
  topic: 'counting',
  skills: ['addition-principle', 'multiplication-principle', 'sample-space-enumeration'],
  retrievalForm: 'application',

  rate({ a, c, p }) {
    // Easy→Medium band (~900–1080).
    return 900 + (a + c) * 12 + p * 18;
  },

  sample(rng) {
    const a = 2 + Math.floor(rng() * 3); // 2..4
    const c = 2 + Math.floor(rng() * 3); // 2..4
    const p = 2 + Math.floor(rng() * 3); // 2..4
    return { a, c, p };
  },

  solve({ a, c, p }) {
    return { kind: 'int' as const, value: (a + c) * p };
  },

  render(params) {
    const { a, c, p } = params;
    const correct = (a + c) * p;
    const multiplyAll = a * c * p; // treated tea/coffee as multiplication
    const addAll = a + c + p; // added the pastries instead of multiplying

    const feedbackByWrongAnswer: Record<string, string> = {};
    if (multiplyAll !== correct) {
      feedbackByWrongAnswer[String(multiplyAll)] =
        'You multiplied the teas and coffees, but you pick only ONE drink — tea OR coffee — so add those (a + c), then multiply by the pastry choices.';
    }
    if (addAll !== correct) {
      feedbackByWrongAnswer[String(addAll)] =
        'You added the pastries, but the pastry is a separate, independent choice paired with the drink — that step multiplies.';
    }

    const misconceptionByValue: Record<number, 'add_vs_multiply'> = {};
    if (multiplyAll !== correct) misconceptionByValue[multiplyAll] = 'add_vs_multiply';
    if (addAll !== correct) misconceptionByValue[addAll] = 'add_vs_multiply';

    return {
      id: `addition-multiplication-combined:a=${a},c=${c},p=${p}`,
      interactionKind: 'number-fill',
      prompt:
        `A café offers ${a} teas and ${c} coffees. You order one drink — a tea or a coffee — ` +
        `and pair it with one of ${p} pastries. How many different drink-and-pastry orders are possible?`,
      answer: correct,
      answerLabel: 'orders',
      feedbackByWrongAnswer,
      feedbackCorrect: `Correct! (${a} + ${c}) drinks × ${p} pastries = ${correct} orders.`,
      feedbackDefault:
        `Two steps: first the drink (a tea OR a coffee — that adds), then a pastry (a separate choice — that multiplies).`,
      skills: ['addition-principle', 'multiplication-principle', 'sample-space-enumeration'],
      ...(Object.keys(misconceptionByValue).length > 0 ? { misconceptionByValue } : {}),
    };
  },

  explain({ a, c, p }) {
    return {
      title: `Counting drink-and-pastry orders`,
      steps: [
        `Choosing the drink is an OR: a tea or a coffee → ${a} + ${c} = ${a + c} drink options (addition principle).`,
        `Then pair the chosen drink with a pastry: that is an independent AND → multiply by ${p} (multiplication principle).`,
        `Total = (${a} + ${c}) × ${p} = ${(a + c) * p}.`,
      ],
    };
  },
};
