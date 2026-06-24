import type { Lesson } from '../types';

const SUM_TO_SEVEN_CELLS: Array<[number, number]> = [
  [1, 6],
  [2, 5],
  [3, 4],
  [4, 3],
  [5, 2],
  [6, 1],
];

const SUM_TO_SIX_CELLS: Array<[number, number]> = [
  [1, 5],
  [2, 4],
  [3, 3],
  [4, 2],
  [5, 1],
];

// A short, non-adjacent diagonal used only as the comparison hint: it shows the
// "constant-sum diagonal" shape without pointing at the answer the learner is
// asked to find.
const SUM_TO_THREE_CELLS: Array<[number, number]> = [
  [1, 2],
  [2, 1],
];

export const lesson1: Lesson = {
  id: 'what-is-probability',
  number: 1,
  title: 'What is probability?',
  blurb: "Sample space, counting outcomes, and your first 'wait what?' moment.",
  estimatedMinutes: 7,
  slots: [
    // --- Act 1: one random thing ----------------------------------------

    {
      id: 'hook',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'How likely is a 4?',
      prompt: 'Roll a fair die once. What is the chance you get a 4?',
      body: [
        'Most people answer "one in six" without thinking. The interesting question is why that answer is right, and what to do when the question is harder than this one.',
        "Probability is a way of counting. Over the next few minutes you will build the count for yourself, and then watch it predict something that should feel surprising.",
      ],
    },

    {
      id: 'sample-space-def',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Outcomes and the sample space',
      prompt: 'An outcome is one thing that could happen. The sample space is the set of every outcome.',
      body: [
        'For a single roll of a fair die, the sample space is the set {1, 2, 3, 4, 5, 6}. Six outcomes, nothing else.',
        'When the sample space is small, the most useful thing you can do is list it.',
      ],
    },

    {
      id: 'sample-space',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'd6',
          interactionKind: 'multiple-choice',
          prompt: 'Roll one fair die. How large is the sample space?',
          context: 'Count the distinct outcomes that could happen on a single roll.',
          options: [
            { id: '1', label: '1' },
            { id: '2', label: '2' },
            { id: '6', label: '6' },
            { id: '12', label: '12' },
          ],
          correctOptionId: '6',
          feedbackCorrect: 'Six outcomes: the sample space is {1, 2, 3, 4, 5, 6}.',
          feedbackDefault: 'How many distinct faces does a fair die have?',
          feedbackByOption: {
            '1': 'A die can land more than one way; one is the count of rolls, not outcomes.',
            '2': 'Two is the sample space of a coin. A die has more faces.',
            '12': 'Twelve would be two dice. This is one roll of one die.',
          },
          explanation: 'Each face is one outcome and they are all distinct, so the sample space has 6 outcomes.',
        },
        {
          id: 'coin',
          interactionKind: 'multiple-choice',
          prompt: 'Flip one fair coin. How large is the sample space?',
          context: 'Count the distinct outcomes that could happen on a single flip.',
          options: [
            { id: '1', label: '1' },
            { id: '2', label: '2' },
            { id: '4', label: '4' },
            { id: '6', label: '6' },
          ],
          correctOptionId: '2',
          feedbackCorrect: 'Two outcomes: the sample space is {H, T}.',
          feedbackDefault: 'How many sides does a fair coin have?',
          feedbackByOption: {
            '1': 'A coin can land more than one way; one is the count of flips, not outcomes.',
            '4': 'Four is two coins (HH, HT, TH, TT). This is one flip of one coin.',
            '6': 'Six is for a die. A coin has fewer sides.',
          },
          explanation: 'Heads and tails are the only two outcomes, so the sample space has 2 outcomes.',
        },
      ],
    },

    {
      id: 'equally-likely',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Equally likely',
      prompt: 'Counting works when every outcome has the same chance.',
      body: [
        'A fair die is built so no face is favored. A fair coin is built the same way. We call these outcomes equally likely.',
        'When that assumption holds, probability becomes arithmetic: count the outcomes that count as a win, divide by the total.',
      ],
      theorem: {
        name: 'Equally-likely outcomes',
        statement:
          'If a sample space has N equally likely outcomes and an event A is the set of k of them, then P(A) = {k/N}. The rule fails the moment the outcomes stop being equally likely.',
      },
    },

    {
      id: 'single-outcome',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'roll-three',
          interactionKind: 'fill-fraction',
          prompt: 'What is P(rolling a 3) on a fair die? Enter numerator / denominator.',
          numerator: 1,
          denominator: 6,
          showDieContext: true,
          feedbackCorrect: 'One favorable face out of six.',
          feedbackDefault: 'Exactly one face is a 3. The sample space has six faces.',
          feedbackByWrongAnswer: {
            '1/3': 'Only one face is a 3, not two. The denominator is the total number of outcomes: 6.',
            '3/6': 'There is only one 3 on the die, not three. The numerator is 1.',
            '1/1': 'A 3 is one outcome out of six, not the whole sample space.',
          },
        },
        {
          id: 'tails',
          interactionKind: 'fill-fraction',
          prompt: 'What is P(tails) on a fair coin? Enter numerator / denominator.',
          numerator: 1,
          denominator: 2,
          feedbackCorrect: 'One favorable side out of two.',
          feedbackDefault: 'How many sides favor tails, and how many sides total?',
          feedbackByWrongAnswer: {
            '1/1': 'A coin has two sides; tails is only one of them.',
            '2/2': 'That would mean tails is guaranteed every flip.',
          },
        },
      ],
    },

    // --- Act 2: events --------------------------------------------------

    {
      id: 'event-def',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'An event is a set of outcomes',
      prompt: 'An event is a question about the outcome, answered as "yes, this counts" or "no, it does not".',
      body: [
        '"Rolled an even number" is an event. It groups the outcomes 2, 4, and 6 together: each of them counts as a yes; the rest count as no.',
        'To find the probability of an event, list which outcomes belong to it, count them, and divide by the size of the sample space.',
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
          prompt: 'The sample space is {1, 2, 3, 4, 5, 6}. Tap every outcome in the event "rolled an even number".',
          sampleSpace: ['1', '2', '3', '4', '5', '6'],
          correctOutcomes: ['2', '4', '6'],
          feedbackCorrect: 'Three outcomes belong to the event "even".',
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
          prompt: 'From one draw, the sample space is {♥, ♦, ♣, ♠}. Tap every outcome in the event "drew a red suit".',
          sampleSpace: ['♥', '♦', '♣', '♠'],
          correctOutcomes: ['♥', '♦'],
          feedbackCorrect: 'Two outcomes belong to the event "red". Hearts and diamonds.',
          feedbackDefault: 'Red suits are hearts and diamonds.',
          feedbackByWrongOutcome: {
            '♣': 'Clubs are black.',
            '♠': 'Spades are black.',
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
          prompt: 'You just picked the three even faces. What is P(even) on a fair die? Enter numerator / denominator.',
          numerator: 3,
          denominator: 6,
          showDieContext: true,
          feedbackCorrect: 'Three favorable faces out of six.',
          feedbackDefault: 'Count the favorable outcomes, then divide by the total in the sample space.',
          feedbackByWrongAnswer: {
            '1/6': 'That is one face out of six, but the event "even" contains three faces: 2, 4, and 6.',
            '2/6': 'Close on the numerator. There are three even faces, not two.',
            '6/6': 'That would mean every roll is even, which is not true.',
          },
        },
        {
          id: 'heads-coin',
          interactionKind: 'fill-fraction',
          prompt: 'What is P(heads) on a fair coin? Enter numerator / denominator.',
          numerator: 1,
          denominator: 2,
          feedbackCorrect: 'One favorable side out of two.',
          feedbackDefault: 'How many sides favor heads, and how many outcomes total?',
          feedbackByWrongAnswer: {
            '1/1': 'A coin has two sides; heads is only one of them.',
            '2/2': 'That would mean heads is guaranteed every flip.',
          },
        },
      ],
    },

    // --- Act 3: two dice (the payoff) -----------------------------------

    {
      id: 'two-dice-intro',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Two dice change the count',
      prompt: 'Roll two dice. Each outcome is an ordered pair: (first die, second die).',
      body: [
        'The first die can land in any of 6 ways. For each of those, the second die can also land in 6 ways. So the two rolls together produce 6 times 6 different ordered pairs.',
        'This is the multiplication principle: when one choice has m options and a second independent choice has n options, the two together have m times n combined outcomes.',
      ],
      derivation: {
        question: 'How large is the sample space when you roll two fair dice?',
        title: 'Sample space of two dice',
        steps: [
          'First die: 6 outcomes (one for each face).',
          'Second die: 6 outcomes, no matter what the first showed.',
          'Each ordered pair (first, second) is one outcome of the joint experiment.',
          'Total outcomes in the sample space: 6 × 6 = 36.',
          'Every pair is equally likely on fair dice.',
        ],
      },
    },

    {
      id: 'all-sums-equal',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'A common wrong guess',
      prompt: 'Most people, asked which sum of two dice is most likely, guess wrong.',
      body: [
        'A natural first thought: "the possible sums are 2 through 12, so they are all equally likely." That would make P(sum = 2) and P(sum = 7) the same.',
        'It is a clean guess, and it is wrong. The reason is that the equally-likely things are the 36 ordered pairs, not the 11 sums. Different sums are made of different numbers of pairs.',
      ],
    },

    {
      id: 'grid-sum',
      kind: 'problem',
      interactionKind: 'grid-event',
      variants: [
        {
          id: 'sum-seven',
          interactionKind: 'grid-event',
          prompt: 'On this 6 by 6 grid of ordered pairs, tap every cell where the two dice sum to 7.',
          rows: 6,
          cols: 6,
          correctCells: SUM_TO_SEVEN_CELLS,
          liveCounterTemplate: '{count} / 36',
          simulationEnabled: true,
          feedbackCorrect:
            '6 pairs out of 36. So P(sum = 7) = 6/36, which reduces to 1/6. Sum of 7 is the most likely sum.',
          feedbackDefault: 'Look for the diagonal where the first die goes up as the second die goes down.',
          hint: {
            highlightCells: SUM_TO_THREE_CELLS,
            label:
              'Pairs with the same sum line up on a diagonal. Shown here is sum = 3: only (1,2) and (2,1). Your target, sum = 7, is the longest diagonal of all.',
          },
        },
        {
          id: 'sum-six',
          interactionKind: 'grid-event',
          prompt: 'On this 6 by 6 grid of ordered pairs, tap every cell where the two dice sum to 6.',
          rows: 6,
          cols: 6,
          correctCells: SUM_TO_SIX_CELLS,
          liveCounterTemplate: '{count} / 36',
          simulationEnabled: true,
          feedbackCorrect: '5 pairs out of 36. So P(sum = 6) = 5/36.',
          feedbackDefault: 'List pairs that add to 6: (1,5), (2,4), (3,3), (4,2), (5,1).',
          hint: {
            highlightCells: SUM_TO_THREE_CELLS,
            label:
              'Pairs with the same sum line up on a diagonal. Shown here is sum = 3: only (1,2) and (2,1). Find the matching diagonal for sum = 6.',
          },
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
          context: 'Stuck? Open the hint to count the matching ordered pairs.',
          gridReference: {
            rows: 6,
            cols: 6,
            highlightCells: SUM_TO_SEVEN_CELLS,
            label: 'Sum = 7 cells highlighted',
          },
          options: [
            { id: 'sum-7', label: 'Sum = 7', subtext: '? ways out of 36' },
            { id: 'sum-2', label: 'Sum = 2', subtext: '? ways out of 36' },
          ],
          correctOptionId: 'sum-7',
          feedbackCorrect:
            'Sum = 7 has 6 pairs (6/36 = 1/6). Sum = 2 has 1: just (1,1). So sum = 7 is six times as likely.',
          feedbackDefault: 'Count how many cells on the grid match each sum.',
          feedbackByOption: {
            'sum-2': 'Sum = 2 only happens one way: (1,1). Sum = 7 has six ways.',
          },
        },
        {
          id: 'seven-vs-twelve',
          interactionKind: 'multiple-choice',
          prompt: 'Which is more likely when rolling two fair dice?',
          context: 'Stuck? Open the hint to count the matching ordered pairs.',
          gridReference: {
            rows: 6,
            cols: 6,
            highlightCells: SUM_TO_SEVEN_CELLS,
            label: 'Sum = 7 cells highlighted',
          },
          options: [
            { id: 'sum-7', label: 'Sum = 7', subtext: '? ways out of 36' },
            { id: 'sum-12', label: 'Sum = 12', subtext: '? ways out of 36' },
          ],
          correctOptionId: 'sum-7',
          feedbackCorrect:
            'Sum = 7 has 6 pairs (6/36 = 1/6). Sum = 12 has 1: just (6,6). So sum = 7 is six times as likely.',
          feedbackDefault: 'Count how many ordered pairs give each sum.',
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
        'When outcomes are equally likely, probability is just counting. For small cases you can list the sample space; for bigger cases the multiplication principle does the listing for you. Next: what happens when there are too many outcomes to count, and the count itself has to be estimated.',
      segueToLessonId: 'law-of-large-numbers',
    },
  ],
};
