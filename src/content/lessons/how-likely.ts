import type { Lesson } from '../types';

// Grid constants for the two-dice act. Copied (not imported) from lesson 1 so
// that source lesson stays untouched as a reservoir for the later splits (D88).
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
// constant-sum diagonal shape without pointing at the answer the learner is
// asked to find.
const SUM_TO_THREE_CELLS: Array<[number, number]> = [
  [1, 2],
  [2, 1],
];

/**
 * The course opener (D88). A gentle on-ramp that defines probability by
 * counting: tap one die's faces, get a rigorous definition of probability
 * (favorable / total when outcomes are equally likely), then add a second die
 * and discover on the 6x6 grid that the totals are NOT equally likely. The
 * total count of 36 is derived AFTER the grid, by cases (first die 1 -> 6
 * rolls, first die 2 -> 6 rolls, ...), never by invoking the multiplication
 * principle (which is its own later lesson). Sits ahead of Unit 1 as the hook.
 */
export const howLikely: Lesson = {
  id: 'how-likely',
  number: 1,
  title: 'How likely is it?',
  blurb: 'Define probability by counting. Start with one die, then two, and see which total wins.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Welcome to probability!',
      quote: {
        text: 'One should always be a little improbable.',
        attribution: 'Oscar Wilde',
      },
      body: [
        'Probability is how we put a number on the future. It is the closest thing we have to telling what happens next.',
        'You start with a roll of the dice, and build toward the same ideas people use to forecast weather, price insurance, and weigh the biggest decisions of their lives.',
      ],
    },

    {
      id: 'big-questions',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Have you ever wondered...',
      prompt:
        'What are the chances that you win the lottery? That you meet your soulmate? Or that two people in your class share a birthday?',
      body: [
        "Every one of these is a probability question! Let's start simple, and work up to answering these hard questions.",
      ],
    },

    {
      id: 'one-die',
      kind: 'problem',
      interactionKind: 'tap-outcomes',
      variants: [
        {
          id: 'd6-faces',
          interactionKind: 'tap-outcomes',
          source: 'd6',
          prompt:
            'How many ways are there to roll a single six-sided die? Tap every face it can land on to count them.',
          expectedOutcomes: ['1', '2', '3', '4', '5', '6'],
          afterNote: 'There are six ways to roll a six-sided die.',
          feedbackCorrect:
            'On a fair die, each of those six faces is equally likely, one chance in six.',
          feedbackDefault: 'A die has six faces. Tap each one, 1 through 6.',
          feedbackByWrongValue: {
            incomplete: 'Keep going. A die has six faces, so tap all of them, 1 through 6.',
            duplicate:
              'Each face is one outcome. Tap a face once to collect it, or tap again to remove it.',
          },
          explanation:
            'Each face is one outcome, and a fair die favors none of them, so all six are equally likely.',
          skills: ['sample-space-enumeration'],
        },
      ],
    },

    {
      id: 'intuitive-def',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'What probability means',
      prompt:
        'Probability is how likely you are to get what you want, out of all the ways things could turn out.',
      body: [
        'You just counted all six ways a die can land. To measure how likely a result is, you compare the ways you want against all the ways in total.',
      ],
    },

    {
      id: 'p-five',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'five',
          interactionKind: 'fill-fraction',
          prompt: 'How likely are you to roll a 5?',
          numerator: 1,
          denominator: 6,
          showDieContext: true,
          numeratorLabel: 'ways to roll a 5',
          denominatorLabel: 'ways in total',
          afterNote:
            'This fraction you just worked out tells us how likely something is to happen.',
          feedbackCorrect: 'One face is a 5, out of six faces in total, so the fraction is 1/6.',
          feedbackDefault: 'Only one face shows a 5. How many faces are there in total?',
          feedbackByWrongAnswer: {
            '5/6': 'Check the top: how many faces actually show a 5?',
            '6/1':
              'That fraction is upside down. Favorable ways go on top, the total on the bottom.',
            '5/1':
              'That fraction is upside down. Favorable ways go on top, the total on the bottom.',
            '1/1': 'The bottom should be every way the die can land, not just the 5.',
          },
          explanation:
            'Just one face shows a 5, and a die has six faces in all. Count the faces that win for the top, then put the total on the bottom.',
          skills: ['favorable-over-total'],
        },
      ],
    },

    {
      id: 'p-even',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'even',
          interactionKind: 'fill-fraction',
          prompt: 'How likely are you to roll an even number?',
          numerator: 3,
          denominator: 6,
          showDieContext: true,
          numeratorLabel: 'ways to roll even',
          denominatorLabel: 'ways in total',
          feedbackCorrect:
            'Three even faces (2, 4, 6) out of six faces in total, so 3/6, which is the same as 1/2.',
          feedbackDefault:
            'Tap the even faces to count them: 2, 4, 6. Then divide by the total number of faces.',
          feedbackByWrongAnswer: {
            '1/6': 'More than one face is even. Count them again: which faces show 2, 4, or 6?',
            '2/6': 'Close, but recount the even faces: 2, 4, and 6. How many is that?',
            '6/6':
              'That would mean every roll is even, which is not true. Only some faces are even.',
          },
          explanation:
            'The even faces are 2, 4, and 6, and a die has six faces in all. Count the even faces for the top, then put the total on the bottom.',
          skills: ['favorable-over-total'],
        },
      ],
    },

    {
      id: 'compare-one-die',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'even-vs-five',
          interactionKind: 'multiple-choice',
          prompt: 'So which are you more likely to roll: an even number, or a 5?',
          context: 'Hint: you just worked out both!',
          options: [
            { id: 'even', label: 'An even number' },
            { id: 'five', label: 'A 5' },
            { id: 'equal', label: 'They are equally likely' },
          ],
          correctOptionId: 'even',
          feedbackCorrect:
            'Right. Three faces are even but only one is a 5, so even has more ways to happen. More ways means a bigger fraction, so it happens more often.',
          feedbackDefault: 'Compare the two fractions: which is bigger, 3 out of 6 or 1 out of 6?',
          feedbackByOption: {
            five: 'Only one face is a 5, but three faces are even. More ways to win means it happens more often.',
            equal:
              'Not equal: an even number has three favorable faces (2, 4, 6) while a 5 has just one.',
          },
          explanation:
            'More favorable faces means a bigger top number, so a bigger fraction, so it happens more often. Count how many faces are even, then how many are a 5, and see which has more.',
          skills: ['favorable-over-total'],
        },
      ],
    },

    {
      id: 'definition',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'A better definition of probability',
      body: [
        'Each separate way things can turn out is called an outcome. The six faces you tapped are six outcomes.',
        'The probability of a result is a number from 0 to 1: the share of the outcomes that give you that result, when every outcome is equally likely.',
      ],
      theorem: {
        name: 'Probability',
        statement:
          'When a situation has N equally likely outcomes and k of them count as a success, the probability of that success is {k/N}. In this case, k and N are nonnegative whole numbers and k is at most N.',
      },
    },

    {
      id: 'why-zero-to-one',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'A pattern in the numbers',
      prompt:
        'Every probability sits between 0 and 1. It is never less than 0, and never more than 1.',
      derivation: {
        question: 'Why is this the case?',
        title: 'Why probability stays between 0 and 1',
        steps: [
          'You can never have more favorable ways than total ways for something to happen, so the top of the fraction is never bigger than the bottom.',
          'When something can never happen, no way works (so k = 0), and the fraction is 0.',
          'When something always happens, every way works (so k = N), and the fraction is 1.',
          'Anything else falls between, so every probability sits between 0 and 1.',
        ],
      },
    },

    {
      id: 'p-three',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'greater-than-four',
          interactionKind: 'fill-fraction',
          prompt:
            'Now use the definition. What is the probability of rolling a number greater than 4 on one fair die?',
          numerator: 2,
          denominator: 6,
          numeratorLabel: 'ways to roll above 4',
          denominatorLabel: 'ways in total',
          feedbackCorrect:
            'Two faces are greater than 4 (the 5 and the 6) out of six in total, so 2/6, the same as 1/3.',
          feedbackDefault:
            'Which faces are greater than 4? Count them, then divide by the total number of faces.',
          feedbackByWrongAnswer: {
            '1/6': 'More than one face beats 4. Which faces are greater than 4?',
            '3/6': 'Careful: "greater than 4" does not include the 4 itself, only the 5 and the 6.',
            '4/6': 'Count only the faces above 4. A 4 is not greater than itself.',
            '6/2':
              'That fraction is upside down. Favorable ways go on top, the total on the bottom.',
          },
          explanation:
            'Only the 5 and the 6 beat a 4, and a die has six faces in all. Count the faces that win for the top, then put the total on the bottom.',
          skills: ['favorable-over-total'],
        },
      ],
    },

    {
      id: 'p-silly',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'd67-fourteen',
          interactionKind: 'fill-fraction',
          prompt:
            'Now imagine a wild 67-sided die, with faces numbered 1 to 67. What is the probability of rolling a 14?',
          numerator: 1,
          denominator: 67,
          numeratorLabel: 'ways to roll a 14',
          denominatorLabel: 'ways in total',
          feedbackCorrect:
            'One face is a 14, out of 67 faces in total, so 1/67. The formula does not care how big the die gets.',
          feedbackDefault: 'Only one face shows a 14. How many faces does this die have in total?',
          feedbackByWrongAnswer: {
            '14/67': 'Check the top: how many faces actually show a 14?',
            '1/14':
              'The 14 is the face you want, not the total. How many faces does this die have?',
            '67/1':
              'That fraction is upside down. Favorable ways go on top, the total on the bottom.',
            '14/1':
              'That fraction is upside down. Favorable ways go on top, the total on the bottom.',
            '1/6': 'This is not a normal 6-sided die. How many faces does it have?',
          },
          explanation:
            'Just one face shows a 14, and this die has 67 faces in all. Count the winning faces for the top, then put the total on the bottom.',
          skills: ['favorable-over-total'],
        },
      ],
    },

    {
      id: 'challenge',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      commitOnce: true,
      challenge: true,
      variants: [
        {
          id: 'fair-game',
          interactionKind: 'multiple-choice',
          prompt: 'Is this a fair game?',
          context:
            'Captain Pascal rolls two dice and adds them. He wins if the total is 7. You win if the total is 2.',
          showDiceRoller: true,
          options: [
            { id: 'fair', label: 'Yes, it is a fair game' },
            { id: 'unfair', label: 'No, it is not fair' },
          ],
          correctOptionId: 'unfair',
          feedbackCorrect: 'Good call. Let us prove it.',
          feedbackDefault: 'Think about how many ways each total can happen.',
          feedbackByOption: {
            fair: 'A lot of people say fair, since 2 and 7 are each just one total. Let us prove them wrong.',
          },
          explanation:
            'A total of 7 can happen many ways, but a total of 2 only one way, so Pascal would win far more often.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    {
      id: 'two-dice-principle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'what-to-count',
          interactionKind: 'multiple-choice',
          prompt:
            'To find the probability of rolling a total of 7, which fraction should you build?',
          options: [
            { id: 'totals', label: '1 over 11, since 7 is one of the totals from 2 to 12' },
            { id: 'faces', label: 'Rolls that total 7, over the 6 faces of one die' },
            {
              id: 'rolls',
              label: 'Rolls that total 7 (like 3 and 4), over every roll two dice can make',
            },
            { id: 'literal', label: '7 over 12' },
          ],
          correctOptionId: 'rolls',
          feedbackCorrect:
            'Yes. Favorable rolls on top, all the rolls on the bottom, the same move as one die. Go count the rolls that make 7.',
          feedbackDefault:
            'Favorable ways on top, all the ways on the bottom. What are the ways for two dice?',
          feedbackByOption: {
            totals:
              'The 11 totals are not equally likely, so you cannot count them as equal ways. The equal ways are the rolls of the two dice.',
            literal:
              'Those numbers do not match anything here. You want favorable rolls over all the rolls.',
            faces: 'Six is the count for one die. Two dice have many more rolls than six.',
          },
          explanation:
            'The equal outcomes are the rolls of the two dice. Count the rolls that total 7, then divide by all the rolls.',
          skills: ['equally-likely-outcomes', 'favorable-over-total'],
        },
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
          prompt:
            "Let's look at all the ways you can roll two dice. Tap every cell where the dice sum to 7.",
          rows: 6,
          cols: 6,
          correctCells: SUM_TO_SEVEN_CELLS,
          liveCounterTemplate: '{count} / 36',
          feedbackCorrect:
            '6 rolls make a total of 7. You will count the 36 rolls in a moment, so that is 6 out of 36. No other total fills a longer diagonal.',
          feedbackDefault: 'That pair does not add to 7. Check the two dice: they should sum to 7.',
          feedbackByCell: {
            incomplete: 'Those all add to 7. Keep going, the diagonal runs longer than that.',
          },
          hint: {
            highlightCells: SUM_TO_THREE_CELLS,
            label:
              'Rolls with the same total line up on a diagonal. Shown here are the two rolls that add to 3.',
          },
          skills: ['sample-space-enumeration'],
        },
        {
          id: 'sum-six',
          interactionKind: 'grid-event',
          prompt:
            "Let's look at all the ways you can roll two dice. Tap every cell where the dice sum to 6.",
          rows: 6,
          cols: 6,
          correctCells: SUM_TO_SIX_CELLS,
          liveCounterTemplate: '{count} / 36',
          feedbackCorrect:
            '5 rolls make a total of 6. Out of the 36 rolls you will count next, that is 5 out of 36.',
          feedbackDefault: 'That pair does not add to 6. Check the two dice: they should sum to 6.',
          feedbackByCell: {
            incomplete: 'Those all add to 6. Keep going, there is at least one more.',
          },
          hint: {
            highlightCells: SUM_TO_THREE_CELLS,
            label:
              'Rolls with the same total line up on a diagonal. Shown here is a total of 3: only (1,2) and (2,1). Find the matching diagonal for 6.',
          },
          skills: ['sample-space-enumeration'],
        },
      ],
    },

    {
      id: 'count-the-rolls',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Six ways out of how many?',
      prompt:
        'You found that 6 rolls make a total of 7. To turn that into a probability, and to settle Pascal\u2019s game, you need the total number of rolls.',
      body: ['Each result is a pair: what the first die shows, and what the second shows.'],
      derivation: {
        question: 'How many different rolls are there with two dice?',
        title: 'Counting the rolls by cases',
        steps: [
          'Say the first die shows 1. The second die can still be 1, 2, 3, 4, 5, or 6: that is 6 rolls.',
          'Say the first die shows 2. The second die again has 6 options: 6 more rolls.',
          'The same goes for the first die showing 3, 4, 5, and 6: 6 rolls each.',
          'Six cases, 6 rolls each: 6 + 6 + 6 + 6 + 6 + 6 = 36 rolls in all.',
          'All 36 are equally likely, so a total of 7 has probability {6/36}, which is {1/6}. A total of 2 has one roll, so {1/36}.',
        ],
      },
    },

    {
      id: 'wrap',
      kind: 'wrap',
      mascotLine: 'Drats! You saw right through my game.',
      title: 'Counting answered it',
      body: 'Two dice land 36 equally likely ways, but the totals are not equally likely. Therefore, you are more likely to get a 7, which settles Captain Pascal\u2019s game for good!\n\nIn the coming lessons, you\u2019ll pick up probability and counting principles that build up to the big questions we started with.',
      segueToLessonId: 'long-run-frequency',
    },
  ],
};
