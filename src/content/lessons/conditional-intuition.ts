import type { Lesson } from '../types';

/**
 * "Given that X happened" (Unit: Conditional probability, intuition).
 *
 * Audience: 8–15 year olds. Voice matches the authored lessons: declarative,
 * grounded, sparing on contractions, no em dashes in user-facing copy, no
 * chatty interjections, sentences that flow.
 *
 * Pedagogical job: build the pure intuition of conditioning BEFORE any
 * formula. The one idea: when you learn something true, you throw away the
 * outcomes that disagree with it and recount inside what is left. That
 * smaller "world" is why the probability changes. The formula
 * P(A | B) = P(A and B) / P(B) is deliberately NOT shown here; it is the
 * next lesson (`conditional-formula`).
 *
 *   1. welcome      — concept: new information can change the odds; the word
 *                     "conditional" names the chance of A once we know B
 *   2. the-puzzle   — commit-once MCQ: roll a fair die. Given the roll is
 *                     even, the chance it is a 6. Trap 1/6 (ignored the
 *                     condition); correct 1/3; foil 1/2
 *   3. resolve      — concept (theorem, violet): knowing "even" throws out
 *                     {1,3,5}; 6 is 1 of the 3 evens, so {1/3}. Names the
 *                     move: restrict to where the condition holds, recount
 *   4. keep-evens   — tap-event: tap the faces still possible once you know
 *                     the roll is even ({2,4,6}). The restrict step by hand
 *   5. six-of-evens — fill-fraction: among the evens, P(6 | even) = 1/3.
 *                     The recount step as a fraction
 *   6. the-card     — MCQ: one card from 52. Given it is a heart, the chance
 *                     it is the ace of hearts. Trap 1/52; correct 1/13
 *   7. everywhere   — concept (definition, blue): conditioning is everywhere;
 *                     the condition is the new, smaller world. Names
 *                     "conditional probability" in words, no formula
 *   8. marbles      — fill-fraction: 3 green, 2 yellow, 5 red. Given the draw
 *                     is not red, P(green) = 3/5. Trap 3/10
 *   9. wrap         — segue to the formula lesson, with a mascot line
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (matches the house exemplar).
 *   - "Restrict and recount" is a derivable claim → violet theorem; the
 *     phrase "conditional probability" is vocabulary → blue definition.
 *   - Tight concept → problem rhythm: restrict (tap) then recount (fraction).
 *
 * Misconceptions: the recurring trap here is "ignored the given condition"
 * (answering the unconditional probability). The closed misconception set
 * has no key that cleanly names that mistake — `base_rate_neglect` is about
 * ignoring how rare a condition is in a test, which is the opposite move, so
 * attaching it would mislabel. No misconception keys are attached.
 */
export const conditionalIntuition: Lesson = {
  id: 'conditional-intuition',
  number: 15,
  title: 'Given that X happened',
  blurb: 'Learning something true shrinks the world of outcomes and changes the odds.',
  estimatedMinutes: 5,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'When you learn something new',
      body: [
        'So far every question has had one fixed answer. A fair die lands on a 6 with chance 1 in 6, full stop. But real questions often come with a clue attached. Someone glances at the die and says it landed on an even number. Now what is the chance it is a 6?',
        'A clue like this can change the odds, and it usually does. The chance of one thing once you already know another thing is called a conditional probability. This lesson builds the feel for it. The formula comes next.',
      ],
    },

    // Commit-once trap. The reflex answer is 1/6, the plain chance of a 6,
    // which throws away the clue. The resolve slot turns that slip into the
    // discovery: the clue removes outcomes.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'even-then-six',
          interactionKind: 'multiple-choice',
          prompt:
            'Roll a fair die. A friend peeks and tells you the roll is even. Given that, what is the chance it is a 6?',
          context: 'The faces are 1, 2, 3, 4, 5, 6. Your friend only told you it is even.',
          options: [
            { id: 'unconditional', label: '1/6' },
            { id: 'correct', label: '1/3' },
            { id: 'half', label: '1/2' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The clue rules out the odd faces, so only 2, 4, and 6 are left. A 6 is one of those three, which is 1/3. The next page shows why the clue changes the count.',
          feedbackDefault:
            'The friend told you the roll is even, so 1, 3, and 5 are off the table. Count the 6 against only the faces that are still possible.',
          feedbackByOption: {
            unconditional:
              '1/6 is the chance of a 6 with no clue at all. But you were told the roll is even, which removes 1, 3, and 5. Recount the 6 against what is left.',
            half:
              '1/2 would be right if you were asking "is it a 6 or not" among two equal choices. There are three even faces still possible, and only one of them is the 6.',
          },
          explanation:
            'Knowing the roll is even leaves the three faces 2, 4, 6. Exactly one of them is a 6, so the chance is 1 out of 3.',
          skills: ['conditional-probability'],
        },
      ],
    },

    // Resolve: name the move. "Restrict and recount" is a claim about how
    // probability behaves, so it is a violet theorem. Fractions in the
    // statement use curly braces, matching the exemplar.
    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Throw out what the clue rules out',
      prompt:
        'A clue does not change the die. It changes the list of outcomes you are allowed to count.',
      theorem: {
        name: 'Restrict, then recount',
        statement:
          'When you learn a condition is true, keep only the outcomes where it holds and recount inside that smaller list. Among the even faces {2, 4, 6}, a 6 is 1 of 3 outcomes, so the chance is {1/3}.',
      },
      body: [
        'Before the clue, six faces were possible: 1, 2, 3, 4, 5, 6. The word "even" is true for 2, 4, and 6, and false for 1, 3, and 5. So learning "even" lets you cross out 1, 3, and 5 completely.',
        'Three faces remain, and they are equally likely. The 6 is one of them, so its chance is 1 out of 3. The whole move is two steps: restrict to the outcomes where the condition holds, then recount.',
      ],
    },

    // Restrict step, by hand. The learner taps the faces still possible.
    {
      id: 'keep-evens',
      kind: 'problem',
      interactionKind: 'tap-event',
      variants: [
        {
          id: 'tap-the-evens',
          interactionKind: 'tap-event',
          prompt:
            'Do the first step yourself. You know the roll is even. Tap every face that is still possible.',
          sampleSpace: ['1', '2', '3', '4', '5', '6'],
          correctOutcomes: ['2', '4', '6'],
          feedbackCorrect:
            'Yes. The even faces 2, 4, and 6 survive the clue, and the odd faces are gone. This shorter list is the new world to count in.',
          feedbackDefault:
            'Keep only the faces that match the clue. A face is even when it splits into two equal halves: 2, 4, and 6.',
          feedbackByWrongOutcome: {
            '1': '1 is odd, so the clue "even" rules it out. Leave it unselected.',
            '3': '3 is odd, so it cannot be the roll once you know the result is even.',
            '5': '5 is odd, so the clue removes it from the list.',
          },
          explanation:
            'The condition "even" is true only for 2, 4, and 6. Those three faces are the restricted list of possible outcomes.',
          skills: ['conditional-probability'],
        },
      ],
    },

    // Recount step, as a fraction. Same die, now expressed as P(6 | even).
    {
      id: 'six-of-evens',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'six-among-evens',
          interactionKind: 'fill-fraction',
          prompt:
            'Now the second step. Among the even faces that are left, write the chance the roll is a 6.',
          context: 'The faces still possible are 2, 4, and 6. One of them is the 6.',
          numerator: 1,
          denominator: 3,
          numeratorLabel: 'faces that are a 6',
          denominatorLabel: 'even faces left',
          feedbackCorrect:
            '1/3. One face out of the three that survived the clue is a 6.',
          feedbackDefault:
            'Count the 6 on top and all the even faces left on the bottom. There are three even faces, and one of them is the 6.',
          feedbackByWrongAnswer: {
            '1/6':
              '1/6 counts the 6 against all six faces, but the odd faces were ruled out. Use the three even faces as the bottom.',
            '1/2':
              '1/2 uses two on the bottom, but three even faces are still possible: 2, 4, and 6.',
            '3/3':
              'All three even faces are possible, but only one of them is the 6, so the top is 1, not 3.',
          },
          explanation:
            'Inside the restricted list {2, 4, 6}, exactly 1 of the 3 outcomes is a 6, so the chance is 1/3.',
          skills: ['conditional-probability'],
        },
      ],
    },

    // Second worked context: a card, where the trap (1/52) is the plain
    // unconditional answer and the clue ("heart") shrinks 52 down to 13.
    {
      id: 'the-card',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'heart-then-ace',
          interactionKind: 'multiple-choice',
          prompt:
            'Draw one card from a standard 52-card deck. You are told it is a heart. Given that, what is the chance it is the ace of hearts?',
          context: 'A deck has 4 suits of 13 cards each, so there are 13 hearts.',
          options: [
            { id: 'unconditional', label: '1/52' },
            { id: 'correct', label: '1/13' },
            { id: 'suit', label: '1/4' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The clue keeps only the 13 hearts. Exactly one of them is the ace of hearts, so the chance is 1/13.',
          feedbackDefault:
            'You already know it is a heart, so count the ace of hearts against the 13 hearts, not the whole deck.',
          feedbackByOption: {
            unconditional:
              '1/52 is the chance of the ace of hearts before any clue. But you were told it is a heart, which leaves only 13 cards to count in.',
            suit:
              '1/4 is the chance a random card is a heart, which is a different question. Here you already know it is a heart and want the chance it is one specific heart.',
          },
          explanation:
            'Knowing the card is a heart restricts the deck to its 13 hearts. One of those 13 is the ace of hearts, so the chance is 1/13.',
          skills: ['conditional-probability'],
        },
      ],
    },

    // Name the idea in words. "Conditional probability" is vocabulary, so it
    // is a blue definition. No formula appears.
    {
      id: 'everywhere',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'The clue is a smaller world',
      prompt:
        'Each clue draws a smaller world around the outcomes that agree with it, and you do all your counting inside it.',
      definition: {
        name: 'Conditional probability',
        statement:
          'The conditional probability of A given B is the chance of A once you already know B is true. You find it inside the smaller world of outcomes where B holds, not the original full list.',
      },
      body: [
        'This move is everywhere. A weather app reports the chance of rain given the clouds it already sees. A doctor reads a test result given who took the test. In each case a known fact shrinks the set of outcomes still in play.',
        'You have been doing it by hand: cross out the outcomes the clue rules out, then count inside what survives. The next lesson turns that picture into a formula so you can do it without listing every outcome.',
      ],
    },

    // Third practice context: marbles. The clue "not red" removes the red
    // marbles; the trap 3/10 ignores the clue and uses the full bag.
    {
      id: 'marbles',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'green-given-not-red',
          interactionKind: 'fill-fraction',
          prompt:
            'You draw one marble. A friend who saw it tells you it is not red. Given that, write the chance it is green.',
          context: 'The bag holds 3 green, 2 yellow, and 5 red marbles, 10 in all.',
          numerator: 3,
          denominator: 5,
          numeratorLabel: 'green marbles',
          denominatorLabel: 'marbles that are not red',
          feedbackCorrect:
            '3/5. The clue removes the 5 red marbles, leaving 5 marbles, and 3 of those are green.',
          feedbackDefault:
            'The clue "not red" throws out the 5 red marbles. Count the green marbles against only the ones that are left.',
          feedbackByWrongAnswer: {
            '3/10':
              '3/10 counts green against all 10 marbles, but the clue ruled out the 5 red ones. Use the 5 marbles that are not red as the bottom.',
            '2/5':
              '2/5 is the chance it is yellow among the marbles that are not red. The question asks about green, of which there are 3.',
            '3/7':
              '3/7 would be right if 7 marbles were left, but only 5 are not red: 3 green and 2 yellow.',
          },
          explanation:
            'Removing the 5 red marbles leaves 3 green and 2 yellow, so 5 marbles. Green is 3 of those 5, giving 3/5.',
          skills: ['conditional-probability'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'A clue shrinks the world',
      body:
        'Conditional probability is one simple move done well: when you learn a condition is true, throw out the outcomes that disagree with it and recount inside what is left. The smaller world is why the odds change. A 6 among all faces is 1/6, but a 6 among the even faces is 1/3.\n\nYou have been counting these by hand. Next you will name the same move with a formula, P(A given B), so you can find it even when the outcomes are too many to list.',
      segueToLessonId: 'conditional-formula',
      mascotLine: 'Learn a clue, cross out the rest, then recount.',
    },
  ],
};
