import type { Lesson } from '../types';

/**
 * "Computing expected value" (Unit 7, Expected Value). D111.
 *
 * Audience: 8–15 year olds. Voice matches L1–L20: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: turn the intuition into a reliable procedure. List the
 * outcomes, their payoffs, and their probabilities; multiply each payoff by
 * its probability; add the pieces. Drill it on dice, spinners, and cards.
 * Misconceptions hunted:
 *   1. averaging the payoffs without weighting by probability;
 *   2. forgetting the $0 or losing outcomes;
 *   3. sign errors when a payoff is a loss.
 *
 *   1. welcome         — the recipe in one line
 *   2. the-rule        — theorem (E = sum of payoff times probability) +
 *                        the requirement that probabilities add to 1
 *   3. worked          — a three-wedge spinner worked end to end
 *   4. dice-ev         — MCQ: die pays its number, but a 6 pays $0; E = 2.5
 *   5. weighted-spinner— MCQ: unequal wedges, E = $3 (unweighted-average trap)
 *   6. include-zero    — MCQ: a game with a loss, E = minus $1 (dropping the
 *                        loss term gives +$1.25)
 *   7. cards-ev        — fill-text: ace pays $13 else $0, E = $1
 *   8. wrap            — segue to fair-games
 *
 * NOTE: no expected-value SkillId exists in content/skills.ts, so variants
 * leave `skills` unset on purpose (allowed; logs a migration warning).
 *
 * Design pattern:
 *   - Recipe stated, worked once, then drilled across props (dice, spinner,
 *     cards) with the three classic slips each given their own trap option.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const computingExpectedValue: Lesson = {
  id: 'computing-expected-value',
  number: 31,
  title: 'Computing E(X)',
  blurb: 'Add up each payoff times its probability.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The recipe',
      body: [
        'Last lesson you felt your way to the expected value. Now you will compute it the same way every time, with a short recipe that never lets an outcome slip.',
        'List every outcome with its payoff and its probability. Multiply each payoff by its probability. Add the pieces. That sum is the expected value, written E(X).',
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'The rule, named',
      prompt: 'Every outcome contributes its payoff, weighted by how often it happens.',
      theorem: {
        name: 'Expected value',
        statement:
          'E(X) = sum over all outcomes of (payoff times its probability). Each term is one outcome weighted by its chance, and the probabilities must add up to 1.',
      },
      body: [
        'The "add up to 1" check is your safety net. If the probabilities of all the outcomes do not total 1, an outcome is missing or a chance is wrong, and the expected value will be off.',
        'Take the spinner that pays $10 with probability {1/4} and $0 with probability {3/4}. The chances add to 1, and E(X) = {1/4} times 10 plus {3/4} times 0 = $2.50.',
      ],
    },

    {
      id: 'worked',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'A spinner, worked through',
      prompt: 'One term per outcome, then add.',
      example: {
        title: 'Spinner: $6 half the time, $3 a third, $0 a sixth',
        steps: [
          'Check the chances: {1/2} + {1/3} + {1/6} = 1. Nothing is missing.',
          'The $6 wedge: 6 times {1/2} = 3.',
          'The $3 wedge: 3 times {1/3} = 1.',
          'The $0 wedge: 0 times {1/6} = 0.',
          'Add the terms: 3 + 1 + 0 = $4. So E(X) = $4.',
        ],
      },
      body: [
        'Notice the $0 wedge still earns its own line, even though it contributes nothing. Writing it keeps the probabilities adding to 1 and stops you from forgetting it lurks there.',
      ],
    },

    {
      id: 'dice-ev',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'die-six-zero',
          interactionKind: 'multiple-choice',
          prompt:
            'You roll a fair die and win the number in dollars, except a 6 pays nothing. What is the expected value?',
          context: 'Six outcomes, each with probability {1/6}. The 6 now pays $0.',
          options: [
            { id: 'correct', label: '$2.50' },
            { id: 'unchanged', label: '$3.50' },
            { id: 'forgot-divide', label: '$15' },
            { id: 'middle', label: '$3' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The payoffs are 1, 2, 3, 4, 5, and 0, each with chance {1/6}, so E(X) = (1 + 2 + 3 + 4 + 5 + 0) divided by 6 = 15 divided by 6 = $2.50.',
          feedbackDefault:
            'List the six payoffs with the 6 changed to $0, add them, and divide by 6.',
          feedbackByOption: {
            unchanged:
              '$3.50 is the normal die, where a 6 pays $6. Here the 6 pays $0, which lowers the total: (1 + 2 + 3 + 4 + 5 + 0) divided by 6 = $2.50.',
            'forgot-divide':
              '15 is the sum of the payoffs. You still have to divide by the 6 equally likely outcomes: 15 divided by 6 = $2.50.',
            middle:
              '$3 is a tempting round guess, but add carefully: the payoffs 1, 2, 3, 4, 5, 0 total 15, and 15 divided by 6 = $2.50.',
          },
          explanation:
            'Each face has probability {1/6}, and the payoffs are 1, 2, 3, 4, 5, 0. E(X) = (1 + 2 + 3 + 4 + 5 + 0) divided by 6 = 15 divided by 6 = $2.50.',
        },
      ],
    },

    {
      id: 'weighted-spinner',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'unequal-wedges',
          interactionKind: 'multiple-choice',
          prompt:
            'A spinner pays $0 with probability 1/2, $4 with probability 1/4, and $8 with probability 1/4. What is its expected value?',
          context: 'The wedges are not equal, so weight each payoff by its own chance.',
          options: [
            { id: 'correct', label: '$3' },
            { id: 'unweighted', label: '$4' },
            { id: 'prizes-only', label: '$6' },
            { id: 'sum', label: '$12' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. E(X) = {1/2} times 0 plus {1/4} times 4 plus {1/4} times 8 = 0 + 1 + 2 = $3.',
          feedbackDefault:
            'Multiply each payoff by its own probability, then add. The $0 takes up half the spinner.',
          feedbackByOption: {
            unweighted:
              '$4 is the plain average of 0, 4, and 8, as if each were equally likely. They are not: weight by the chances to get {1/2} times 0 plus {1/4} times 4 plus {1/4} times 8 = $3.',
            'prizes-only':
              '$6 averages just the two prizes and ignores the big $0 wedge. Include it: half the time you win nothing, giving E(X) = $3.',
            sum:
              '$12 is 4 + 8, the prizes added with no weighting. Expected value weights by probability: {1/2} times 0 plus {1/4} times 4 plus {1/4} times 8 = $3.',
          },
          explanation:
            'Weight each payoff by its chance: E(X) = {1/2} times 0 plus {1/4} times 4 plus {1/4} times 8 = 0 + 1 + 2 = $3.',
        },
      ],
    },

    {
      id: 'include-zero',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'win-or-lose',
          interactionKind: 'multiple-choice',
          prompt:
            'In a game you win $5 with probability 1/4 and lose $3 with probability 3/4. What is the expected value per play?',
          context: 'A loss is a negative payoff, and it still needs its own term.',
          options: [
            { id: 'correct', label: 'Minus $1' },
            { id: 'drop-loss', label: 'Plus $1.25' },
            { id: 'sign', label: 'Plus $1' },
            { id: 'avg', label: 'Plus $2' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. E(X) = {1/4} times 5 plus {3/4} times (minus 3) = 1.25 minus 2.25 = minus $1. The game loses you a dollar a play on average.',
          feedbackDefault:
            'Keep the loss negative and weight both terms: {1/4} times 5 plus {3/4} times (minus 3).',
          feedbackByOption: {
            'drop-loss':
              '$1.25 is just {1/4} times 5. You dropped the losing term, which happens three times out of four: {3/4} times (minus 3) = minus 2.25, giving minus $1 overall.',
            sign:
              'Watch the sign on the loss. It is minus 3, not plus 3: {1/4} times 5 plus {3/4} times (minus 3) = minus $1.',
            avg:
              '$2 is roughly the average of the sizes 5 and 3, but it ignores the probabilities and the loss. The weighted sum is minus $1.',
          },
          explanation:
            'Include every outcome with its sign and weight: E(X) = {1/4} times 5 plus {3/4} times (minus 3) = 1.25 minus 2.25 = minus $1 per play.',
        },
      ],
    },

    {
      id: 'cards-ev',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'ace-pays',
          interactionKind: 'fill-text',
          prompt:
            'You draw one card from a standard 52-card deck. An ace pays you $13, any other card pays $0. What is the expected value in dollars? Type the number.',
          context: 'There are 4 aces in 52 cards, so P(ace) = {4/52} = {1/13}.',
          placeholder: 'dollars',
          maxLength: 8,
          // Accepts 1, 1.0, $1, $1.00, with optional whitespace.
          acceptRegex: '\\$?\\s*1(\\.0+)?',
          feedbackCorrect:
            'Right. E(X) = {1/13} times 13 plus {12/13} times 0 = $1. The 13 and the {1/13} cancel cleanly.',
          feedbackDefault:
            'Multiply the $13 payoff by P(ace) = {1/13}, and add the $0 term for every other card.',
          feedbackByWrongAnswer: {
            '13': '13 is the prize for an ace, not the average. Weight it by P(ace) = {1/13}: 13 times {1/13} = $1.',
            '4': '4 is the number of aces, not the expected value. E(X) = {1/13} times 13 = $1.',
            '0.25': 'That looks like {4/52} times something, but the payoff is $13. E(X) = {4/52} times 13 = $1.',
            empty: 'Type the expected value in dollars. Compute {1/13} times 13.',
          },
          explanation:
            'P(ace) = {4/52} = {1/13}. E(X) = {1/13} times 13 plus {12/13} times 0 = $1.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You can compute E(X)',
      body:
        'The recipe is reliable: list every outcome with its payoff and probability, multiply each pair, and add. Check that the probabilities total 1, keep the losing terms negative, and never drop the $0 outcome.\n\nNow that you can put a number on what a game is worth, you can answer the question that started the unit. When is a bet fair, when does it favor you, and when is it quietly stacked against you?',
      mascotLine: 'Payoff times chance, summed. That is E(X).',
      segueToLessonId: 'fair-games',
    },
  ],
};
