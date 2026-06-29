import type { Lesson } from '../types';

/**
 * "Expected value" (Unit 7, Expected Value). D110.
 *
 * Audience: 8–15 year olds. Voice matches L1–L19: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: expected value is the long-run average payoff of a chance
 * game. Intuition first, formula later. This is the long-run idea from Unit 1
 * carried onto payoffs: play many times and your average per play settles on
 * a single number. Two misconceptions get hunted:
 *   1. expected value must be a possible outcome (it need not be: the EV of a
 *      die is 3.5, never rolled);
 *   2. "expected" means "most likely" (it is the weighted average, not the
 *      mode).
 *
 *   1. welcome        — frame: you can find probabilities; now, what payoff
 *                       should you expect? Callback to the long run.
 *   2. the-puzzle     — commit-once MCQ: win the number you roll in dollars;
 *                       long-run average per roll. Correct $3.50.
 *   3. long-run-avg   — concept: over 600 rolls you win about 2100 dollars,
 *                       so 2100/600 = 3.5 per roll; the average is the share
 *                       picture from Unit 1
 *   4. weighted       — concept: unequal chances get weighted; theorem
 *                       (intuitive): EV = sum of payoff times probability
 *   5. not-an-outcome — MCQ: 3.5 is the average, not a roll and not the mode
 *   6. expected-vs-likely — MCQ: scratch card, EV $0.50 even though the most
 *                       likely outcome is $0
 *   7. coin-game      — MCQ: heads +$3, tails -$1, average +$1 per flip
 *                       (introduces a negative payoff)
 *   8. wrap           — segue to computing-expected-value
 *
 * NOTE: there is no expected-value SkillId in content/skills.ts (the course
 * taxonomy ends at the conditional/counting topics), so variants here leave
 * `skills` unset on purpose. The invariant treats that as allowed (a
 * migration warning), not an error.
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (the die-average hook).
 *   - Intuition (long-run average) before the formula, which the next lesson
 *     names and drills.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const expectedValueIntuition: Lesson = {
  id: 'expected-value-intuition',
  number: 30,
  title: 'Expected value',
  blurb: "The average payoff you would see if you played a chance game over and over.",
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'What should you expect to win?',
      body: [
        'You can already find the probability of an event. Now comes the question every gambler, insurer, and game designer asks: if there is money on the line, what should you expect to walk away with?',
        'The answer reaches back to the very first unit. Probability was the share you would see over many tries. Expected value is the same idea, one step further: the average payoff you would see if you played the game over and over.',
      ],
    },

    // Commit-once trap. The die-average hook surfaces both the weighting idea
    // and the "3.5 is never rolled" surprise resolved on later slots.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'die-average',
          interactionKind: 'multiple-choice',
          prompt:
            'A game: roll a fair die and win that many dollars, so a 1 pays $1 and a 6 pays $6. If you play many, many times, about how much do you win per roll on average?',
          options: [
            { id: 'correct', label: '$3.50' },
            { id: 'middle', label: '$3' },
            { id: 'max', label: '$6' },
            { id: 'min', label: '$1' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Over many rolls each face shows up about a sixth of the time, so the average payoff is (1 + 2 + 3 + 4 + 5 + 6) divided by 6, which is $3.50.',
          feedbackDefault:
            'Think about the long run. Each face turns up about equally often, so average the six payoffs together.',
          feedbackByOption: {
            middle:
              'Close. The middle of 1 through 6 is not 3, though. Average all six: (1 + 2 + 3 + 4 + 5 + 6) divided by 6 = $3.50.',
            max:
              '$6 is the best you can do on one roll, not the long-run average. Most rolls pay less, and the average of all six payoffs is $3.50.',
            min:
              '$1 is the worst roll, not the typical one. Average the six equally likely payoffs to get $3.50.',
          },
          explanation:
            'Each of the six payoffs is equally likely, so the long-run average is their plain average: (1 + 2 + 3 + 4 + 5 + 6) divided by 6 = 21 divided by 6 = $3.50.',
        },
      ],
    },

    {
      id: 'long-run-avg',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The average over many plays',
      prompt: 'Expected value is just the long-run average, counted up.',
      example: {
        title: 'Roll the die-game 600 times',
        steps: [
          'Over 600 rolls, each face turns up about 100 times.',
          'Total winnings: about 100 times (1 + 2 + 3 + 4 + 5 + 6) = 100 times 21 = 2100 dollars.',
          'Per roll: 2100 divided by 600 = $3.50.',
          'The 600 cancels out, leaving (1 + 2 + 3 + 4 + 5 + 6) divided by 6 = $3.50.',
        ],
      },
      body: [
        'This is the share picture from Unit 1, now attached to dollars. Each outcome shows up at its long-run rate, and the average payoff settles on a single number.',
        'That settled number is the expected value. It is what one play is worth on average, even though any single play lands on a whole-dollar result.',
      ],
    },

    {
      id: 'weighted',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'When the chances are not equal',
      prompt: 'Outcomes that happen more often should count for more.',
      theorem: {
        name: 'Expected value',
        statement:
          'The expected value of a game is its long-run average payoff: multiply each payoff by its probability, then add those pieces up.',
      },
      body: [
        'The die game was easy because every face was equally likely, so a plain average worked. Most games are not so even, and then each payoff has to be weighted by how often it happens.',
        'Picture a spinner that pays $10 with probability {1/4} and $0 with probability {3/4}. A quarter of the time you collect $10, the rest you collect nothing, so the average is {1/4} times 10 plus {3/4} times 0 = $2.50. Weight each payoff by its chance, then add.',
      ],
    },

    {
      id: 'not-an-outcome',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'three-point-five',
          interactionKind: 'multiple-choice',
          prompt:
            'The expected value of one die roll is 3.5. Which statement is true?',
          context: 'Expected value is an average, not a prediction of a single roll.',
          options: [
            {
              id: 'correct',
              label: 'You can never roll a 3.5, but it is still the long-run average',
            },
            { id: 'wrong', label: '3.5 must be a mistake, since a die has no 3.5 face' },
            { id: 'mode', label: '3.5 is the most likely roll' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. An average does not have to be a possible outcome. No single roll is 3.5, yet the rolls average out to 3.5 over the long run.',
          feedbackDefault:
            'Expected value is the average of many plays, not a forecast of one. Can an average sit between the possible results?',
          feedbackByOption: {
            wrong:
              'It is not a mistake. Averages often land between the possible values. The six faces average to 3.5 even though no face shows 3.5.',
            mode:
              'Every face is equally likely, so there is no single most likely roll. 3.5 is the average of all six, not the most common one.',
          },
          explanation:
            'Expected value is a long-run average, and averages need not be achievable on a single try. The die averages to 3.5 even though 3.5 is never rolled, and every face is equally likely so there is no single most likely outcome.',
        },
      ],
    },

    {
      id: 'expected-vs-likely',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'scratch-card',
          interactionKind: 'multiple-choice',
          prompt:
            'A scratch card wins $50 with probability 1/100, and otherwise wins nothing. What is the expected payoff per card?',
          context: 'Weight each payoff by its chance: {1/100} for the $50, {99/100} for the $0.',
          options: [
            { id: 'correct', label: '$0.50' },
            { id: 'prize', label: '$50' },
            { id: 'likely', label: '$0' },
            { id: 'half-prize', label: '$25' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. {1/100} times 50 plus {99/100} times 0 = $0.50. The most likely result is $0, but the average payoff is fifty cents.',
          feedbackDefault:
            'Multiply each payoff by its probability and add. The $50 only happens one time in a hundred.',
          feedbackByOption: {
            prize:
              '$50 is the prize, not the average. It only lands once in a hundred cards, so the average per card is far lower: {1/100} times 50 = $0.50.',
            likely:
              '$0 is the most likely single result, but "expected" means the average, not the most likely. That average is {1/100} times 50 = $0.50.',
            'half-prize':
              '$25 would be the average if the two outcomes were equally likely. They are not: the $50 is one chance in a hundred, giving $0.50.',
          },
          explanation:
            'Expected value weights by probability: {1/100} times 50 plus {99/100} times 0 = $0.50. The most likely outcome ($0) and the expected value ($0.50) are different ideas.',
        },
      ],
    },

    {
      id: 'coin-game',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'heads-win-tails-lose',
          interactionKind: 'multiple-choice',
          prompt:
            'Flip a fair coin. Heads wins you $3, tails loses you $1. On average, how much do you gain per flip?',
          context: 'A loss counts as a negative payoff. Weight each by {1/2}.',
          options: [
            { id: 'correct', label: 'Gain $1' },
            { id: 'avg-size', label: 'Gain $2' },
            { id: 'even', label: 'Break even, $0' },
            { id: 'max', label: 'Gain $3' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. {1/2} times 3 plus {1/2} times (minus 1) = 1.5 minus 0.5 = $1 gained per flip on average.',
          feedbackDefault:
            'A loss is a negative payoff. Average +3 and minus 1, each with probability {1/2}.',
          feedbackByOption: {
            'avg-size':
              '$2 averages the sizes 3 and 1 but ignores that one is a loss. Keep the sign: {1/2} times 3 plus {1/2} times (minus 1) = $1.',
            even:
              'It is not a break-even game. The $3 win outweighs the $1 loss, so the average is {1/2} times 3 plus {1/2} times (minus 1) = $1.',
            max:
              '$3 is the best single flip, not the average. Half the time you instead lose $1, so the average is $1 per flip.',
          },
          explanation:
            'Treat the loss as a payoff of minus 1: {1/2} times 3 plus {1/2} times (minus 1) = 1.5 minus 0.5 = $1 gained per flip on average.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Expected value is the long-run average',
      body:
        'Expected value is what one play is worth on average, found by weighting each payoff by its probability and adding the pieces up. It does not have to be a possible outcome, and it is not the same as the most likely result.\n\nYou have been computing it in your head already. Next you will write it down as a clean formula and run it on dice, spinners, and cards.',
      mascotLine: 'Expected value is the average, not the jackpot.',
      segueToLessonId: 'computing-expected-value',
    },
  ],
};
