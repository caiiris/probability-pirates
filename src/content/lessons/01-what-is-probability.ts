import type { Lesson } from '../types';

/** Cells where two dice sum to 7 (1-indexed row, col). */
const SUM_TO_SEVEN_CELLS: Array<[number, number]> = [
  [1, 6],
  [2, 5],
  [3, 4],
  [4, 3],
  [5, 2],
  [6, 1],
];

/** Cells where two dice sum to 6 (1-indexed row, col). */
const SUM_TO_SIX_CELLS: Array<[number, number]> = [
  [1, 5],
  [2, 4],
  [3, 3],
  [4, 2],
  [5, 1],
];

export const lesson1: Lesson = {
  id: 'what-is-probability',
  number: 1,
  title: 'What is probability?',
  blurb: "Sample space, counting outcomes, and your first 'wait what?' moment.",
  estimatedMinutes: 4,
  slots: [
    {
      id: 'intro',
      kind: 'concept',
      prompt:
        'Probability is favorable outcomes divided by total outcomes, when every outcome is equally likely.',
      illustration: { kind: 'die' },
    },
    {
      id: 'sample-space',
      kind: 'problem',
      interactionKind: 'tap-outcomes',
      variants: [
        {
          id: 'd6',
          interactionKind: 'tap-outcomes',
          prompt: 'Tap every face of this die to build the sample space.',
          source: 'd6',
          expectedOutcomes: ['1', '2', '3', '4', '5', '6'],
          feedbackCorrect: 'Nice. 6 outcomes, all equally likely.',
          feedbackDefault: 'Tap each face once to list every outcome.',
          feedbackByWrongValue: {
            duplicate: 'You already tapped that face. Each outcome counts once.',
          },
        },
        {
          id: 'coin',
          interactionKind: 'tap-outcomes',
          prompt: 'Tap every face of this coin to build the sample space.',
          source: 'coin',
          expectedOutcomes: ['H', 'T'],
          feedbackCorrect: 'Right. 2 outcomes, equally likely.',
          feedbackDefault: 'Tap each side once, heads and tails.',
          feedbackByWrongValue: {
            duplicate: 'You already tapped that side.',
          },
        },
      ],
    },
    {
      id: 'compute-probability',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'even-d6',
          interactionKind: 'fill-fraction',
          prompt: 'What is P(rolling an even number on a fair die)? Enter numerator / denominator.',
          numerator: 3,
          denominator: 6,
          feedbackCorrect: 'Exactly. 3 even faces out of 6, which reduces to 1/2.',
          feedbackDefault: 'Count the favorable outcomes, then divide by the total in the sample space.',
          feedbackByWrongAnswer: {
            '1/6': 'That is one face out of six, but even numbers are 2, 4, and 6.',
            '2/6': 'Close on the numerator. How many even faces are there?',
            '6/6': 'That would mean every roll is even, which is not true.',
          },
        },
        {
          id: 'heads-coin',
          interactionKind: 'fill-fraction',
          prompt: 'What is P(heads) on a fair coin? Enter numerator / denominator.',
          numerator: 1,
          denominator: 2,
          feedbackCorrect: 'Yes. 1 favorable outcome out of 2.',
          feedbackDefault: 'How many sides favor heads, and how many outcomes total?',
          feedbackByWrongAnswer: {
            '1/1': 'A coin has two sides; heads is only one of them.',
            '2/2': 'That would mean heads is guaranteed every flip.',
          },
        },
      ],
    },
    {
      id: 'define-event',
      kind: 'problem',
      interactionKind: 'tap-event',
      variants: [
        {
          id: 'evens-d6',
          interactionKind: 'tap-event',
          prompt: 'The sample space is {1, 2, 3, 4, 5, 6}. Tap every outcome that is even.',
          sampleSpace: ['1', '2', '3', '4', '5', '6'],
          correctOutcomes: ['2', '4', '6'],
          feedbackCorrect: 'Perfect. The event "even" has 3 outcomes.',
          feedbackDefault: 'An even number is divisible by 2.',
          feedbackByWrongOutcome: {
            '1': '1 is odd.',
            '3': '3 is odd.',
            '5': '5 is odd.',
          },
        },
        {
          id: 'red-cards',
          interactionKind: 'tap-event',
          prompt:
            'From one draw, the sample space is {♥, ♦, ♣, ♠}. Tap every outcome that is red.',
          sampleSpace: ['♥', '♦', '♣', '♠'],
          correctOutcomes: ['♥', '♦'],
          feedbackCorrect: 'Right. Hearts and diamonds are the two red suits.',
          feedbackDefault: 'Red suits are hearts and diamonds.',
          feedbackByWrongOutcome: {
            '♣': 'Clubs are black.',
            '♠': 'Spades are black.',
          },
        },
      ],
    },
    {
      id: 'two-dice-intro',
      kind: 'concept',
      prompt:
        'Roll two dice. Each ordered pair (first die, second die) is one outcome. There are 6 × 6 = 36 equally likely outcomes.',
      illustration: { kind: 'die' },
    },
    {
      id: 'grid-sum',
      kind: 'problem',
      interactionKind: 'grid-event',
      variants: [
        {
          id: 'sum-seven',
          interactionKind: 'grid-event',
          prompt: 'Tap every cell where the two dice sum to 7.',
          rows: 6,
          cols: 6,
          correctCells: SUM_TO_SEVEN_CELLS,
          liveCounterTemplate: '{count} / 36',
          feedbackCorrect:
            'Yes. 6 cells out of 36, so P(sum = 7) = 1/6. Sum of 7 is the most likely sum.',
          feedbackDefault: 'Try the diagonal where one die goes up as the other goes down.',
        },
        {
          id: 'sum-six',
          interactionKind: 'grid-event',
          prompt: 'Tap every cell where the two dice sum to 6.',
          rows: 6,
          cols: 6,
          correctCells: SUM_TO_SIX_CELLS,
          liveCounterTemplate: '{count} / 36',
          feedbackCorrect: 'Correct. 5 cells out of 36, so P(sum = 6) = 5/36.',
          feedbackDefault: 'List pairs that add to 6: (1,5), (2,4), (3,3), (4,2), (5,1).',
        },
      ],
    },
    {
      id: 'which-more-likely',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'seven-vs-two',
          interactionKind: 'multiple-choice',
          prompt: 'Which is more likely when rolling two fair dice?',
          options: [
            { id: 'sum-7', label: 'Sum = 7' },
            { id: 'sum-2', label: 'Sum = 2' },
          ],
          correctOptionId: 'sum-7',
          feedbackCorrect:
            'Exactly. Sum = 7 has 6 ways; sum = 2 has only 1 way (double ones).',
          feedbackDefault: 'Count how many cells on the grid match each sum.',
          feedbackByOption: {
            'sum-2': 'Sum = 2 only happens one way: (1,1). Sum = 7 has six ways.',
          },
        },
        {
          id: 'seven-vs-twelve',
          interactionKind: 'multiple-choice',
          prompt: 'Which is more likely when rolling two fair dice?',
          options: [
            { id: 'sum-7', label: 'Sum = 7' },
            { id: 'sum-12', label: 'Sum = 12' },
          ],
          correctOptionId: 'sum-7',
          feedbackCorrect:
            'Right. Sum = 7 has 6 ways; sum = 12 only has 1 way: (6,6).',
          feedbackDefault: 'Think about how many ordered pairs give each sum.',
          feedbackByOption: {
            'sum-12': 'Sum = 12 only happens one way: (6,6). Sum = 7 has six ways.',
          },
        },
      ],
    },
    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You counted your first probabilities',
      body:
        'When outcomes are equally likely, probability is just counting. For small cases, build the sample space and count. Next up: what happens when there are too many outcomes to count by hand?',
      segueToLessonId: 'law-of-large-numbers',
    },
  ],
};
