import type { Lesson } from '../types';

/**
 * Lesson 5 — "Compound experiments" (Unit 2.1, chapter opener for
 * Compound Experiments). D99.
 *
 * Audience: 8–15 year olds. Voice matches L1–L4: declarative, grounded,
 * sparing on contractions ("is not" over "isn't"), no em dashes in
 * user-facing copy, no chatty interjections, sentences that flow.
 *
 * Pedagogical job: introduce the STRUCTURE of a compound experiment, the
 * thing the next two lessons (multiplication, addition) give shortcuts
 * for. So far every experiment has been a single act: one coin, one die,
 * one card. A compound experiment stacks acts together, and each outcome
 * records every part as an ordered combination. The sample space is the
 * set of all such combinations, and the way to find it without missing
 * anything is systematic listing.
 *
 * The discovery beat is the closing tension: listing always works, but it
 * grows fast (two dice → 36, ten coins → over a thousand). That sets up
 * the multiplication principle as the shortcut, which is the very next
 * lesson.
 *
 *   1. welcome        — frame: one experiment at a time, until now
 *   2. define-compound — definition callout: compound experiment; each
 *                        outcome is an ordered combination like (H, 4)
 *   3. recap-one-die  — tap-outcomes: list one die's sample space first
 *                        (anchor the "simple experiment" before stacking)
 *   4. build-coin-die — concept: list the 12 outcomes of (coin, die)
 *                        systematically so none are missed
 *   5. type-outcome   — fill-text: type one valid (coin, die) outcome
 *   6. count-outcomes — MCQ: count the sample space by listing (12)
 *   7. it-grows       — concept: listing works but explodes; is there a
 *                        shortcut? (sets up multiplication)
 *   8. wrap           — segue to multiplication-principle
 *
 * Deliberately NOT here (saved for the next lesson): the multiply rule
 * itself. This lesson counts by listing only. Naming "2 × 6" as a rule
 * would steal the multiplication-principle punchline, so the count slot
 * adds rows (6 + 6) rather than multiplying.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const compoundExperiments: Lesson = {
  id: 'compound-experiments',
  number: 5,
  title: 'Compound experiments',
  blurb: 'Stack two experiments together and list every combination that can come out.',
  estimatedMinutes: 5,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'More than one thing at once',
      body: [
        'Every experiment so far has been a single act: one coin flip, one die roll, one card drawn. You listed its outcomes and counted.',
        'Real questions often stack experiments together. You flip a coin and roll a die. You draw a card and then draw another. This lesson is about how to list the outcomes when more than one thing happens.',
      ],
    },

    {
      id: 'define-compound',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Compound experiment',
      prompt:
        'When you do two or more experiments together, each outcome has to record what happened in every part.',
      definition: {
        name: 'Compound experiment',
        statement:
          'A compound experiment is two or more experiments performed together. Each outcome is a combination that lists one result from each part, in order.',
      },
      body: [
        'Flip a coin and roll a die. One outcome might be heads on the coin and 4 on the die. We write that combination as (H, 4): the coin result first, the die result second.',
        'Order tells you which result is which. In (H, 4) the H is the coin and the 4 is the die. The combination is one single outcome of the compound experiment.',
      ],
    },

    {
      id: 'recap-one-die',
      kind: 'problem',
      interactionKind: 'tap-outcomes',
      variants: [
        {
          id: 'one-die-faces',
          interactionKind: 'tap-outcomes',
          source: 'd6',
          prompt:
            'Start with one part on its own. List the sample space for a single die roll by tapping every face it can land on.',
          expectedOutcomes: ['1', '2', '3', '4', '5', '6'],
          afterNote: 'One die has six outcomes: {1, 2, 3, 4, 5, 6}. Next we pair it with a coin.',
          feedbackCorrect:
            'Right. Six faces, six outcomes. That is the full sample space of one die roll.',
          feedbackDefault:
            'A die can land six ways. Tap each face to add it to the sample space.',
          feedbackByWrongValue: {
            incomplete: 'A die has more faces than that. Each one is its own outcome.',
            duplicate:
              'Each outcome goes in the set once. Tap a face again to remove a double.',
          },
          explanation:
            'The sample space of one die roll is {1, 2, 3, 4, 5, 6}: six outcomes, one per face.',
          skills: ['sample-space-enumeration'],
        },
      ],
    },

    {
      id: 'build-coin-die',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'List it without missing any',
      prompt:
        'To list a compound sample space, hold the first result fixed and run through every result of the second.',
      body: [
        'Flip a coin and roll a die. Start with heads, and pair it with each die face: (H, 1), (H, 2), (H, 3), (H, 4), (H, 5), (H, 6). That is six outcomes.',
        'Now do the same for tails: (T, 1), (T, 2), (T, 3), (T, 4), (T, 5), (T, 6). Six more.',
        'Working in this order means you never miss a combination and never repeat one. The sample space has all twelve of these pairs.',
      ],
    },

    {
      id: 'type-outcome',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'one-coin-die-outcome',
          interactionKind: 'fill-text',
          prompt:
            'Flip a coin and roll a die. Type one outcome from the sample space. Use H or T for the coin and a number 1 to 6 for the die.',
          context: 'Any valid combination is fine. Case and spaces do not matter.',
          placeholder: 'like H4',
          maxLength: 12,
          // Coin (H/T) then a die face (1-6), with optional parentheses,
          // comma, and whitespace. Matched case-insensitively against the
          // trimmed, lowercased input. "h7" is rejected: the die has no 7.
          acceptRegex: '\\(?\\s*[ht]\\s*,?\\s*[1-6]\\s*\\)?',
          feedbackCorrect:
            'Right. A coin result paired with a die face is one outcome of the compound experiment.',
          feedbackDefault:
            'Type one coin result (H or T) and one die face (1 to 6), like H4.',
          feedbackByWrongAnswer: {
            empty: 'Type a coin result and a die face, like H4 or T2.',
          },
          explanation:
            'A valid outcome is one coin result with one die face: (H, 1) through (T, 6). Any of the twelve pairs is correct.',
          skills: ['sample-space-enumeration'],
        },
      ],
    },

    {
      id: 'count-outcomes',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'coin-die-size',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip a coin and roll a die, recording both. How many outcomes are in the sample space?',
          context: 'Count the pairs you listed: the heads row and the tails row.',
          options: [
            { id: 'coin-only', label: '2' },
            { id: 'die-only', label: '6' },
            { id: 'added-wrong', label: '8' },
            { id: 'all', label: '12' },
          ],
          correctOptionId: 'all',
          feedbackCorrect:
            'Right. The heads row has 6 pairs and the tails row has 6 more, so the sample space has 12 outcomes.',
          feedbackDefault:
            'You listed two rows of six. How many pairs is that in total?',
          feedbackByOption: {
            'coin-only': 'You counted only the coin results. Each coin result pairs with all six die faces.',
            'die-only': 'You counted only the die faces. Each one can happen with heads or with tails.',
            'added-wrong':
              '8 would be 2 + 6, the coin outcomes plus the die outcomes. But each coin result pairs with all six die faces, so count the pairs: 6 in the heads row plus 6 in the tails row.',
          },
          explanation:
            'Listing gives two rows of six pairs each: 6 in the heads row and 6 in the tails row, for 12 outcomes in all.',
          skills: ['sample-space-enumeration'],
        },
      ],
    },

    {
      id: 'it-grows',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Listing works, but it piles up',
      prompt:
        'The systematic list never fails. The trouble is how fast it grows.',
      body: [
        'Two dice give 36 pairs. Three coins give 8 outcomes. A coin, a die, and a card drawn together run into the hundreds. You could list them all, but writing out the full sample space stops being practical very quickly.',
        'There is a faster way to count a compound sample space without writing every outcome. That shortcut is the next lesson.',
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You can combine experiments',
      body:
        'A compound experiment stacks two or more experiments together, and each outcome is a combination that records every part. List them in a fixed order and you catch every outcome exactly once.\n\nNext, you will find a way to count those combinations without listing them one by one.',
      mascotLine: 'One result from each part, every time.',
      segueToLessonId: 'multiplication-principle',
    },
  ],
};
