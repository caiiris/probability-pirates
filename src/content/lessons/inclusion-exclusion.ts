import type { Lesson } from '../types';

/**
 * "Inclusion and exclusion" (Unit 3, Counting Techniques). D100.
 *
 * Audience: 8–15 year olds. Voice matches L1–L6: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: the addition principle (L6) counted "A OR B" only when
 * the two groups were disjoint. When they overlap, plain addition counts
 * the shared members twice. Inclusion-exclusion fixes it by subtracting
 * the overlap once: |A or B| = |A| + |B| − |A and B|. The complement-rule
 * lesson just before ends on a challenge (hearts OR queens) that surfaces
 * exactly this, and segues here.
 *
 *   1. welcome      — callback: addition assumed separate groups; overlap
 *                      breaks it
 *   2. the-puzzle   — commit-once MCQ: 12 soccer, 9 basketball, 5 both,
 *                      how many play at least one? Trap 21 = 12 + 9.
 *   3. resolve      — concept: why subtract; the both-players are counted
 *                      in each group, so once too often
 *   4. the-rule     — theorem callout (main): P(A or B) = P(A) + P(B) −
 *                      P(A and B), since the probability form is what the
 *                      learner already knows. A second definition box
 *                      introduces the |X| count notation and the
 *                      count-over-N form for when counting is easier.
 *   5. cards-count  — MCQ: hearts OR face cards = 13 + 12 − 3 = 22
 *   6. heart-or-queen — fill-fraction: P(heart or queen) = 16/52 (the
 *                      complement-rule challenge, now formalized)
 *   7. add-or-subtract — MCQ: recognition. Disjoint case (just add) vs
 *                      overlapping case (subtract)
 *   8. wrap         — close; preview permutations/combinations; no segue
 *                      (next stub is unauthored)
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (same as L2, L4, L5, L6).
 *   - Theorem callout, not definition: a derivable claim about how
 *     overlapping totals combine, not a new term.
 *   - The recognition slot contrasts inclusion-exclusion with the
 *     addition principle so the learner knows WHEN to subtract.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const inclusionExclusion: Lesson = {
  id: 'inclusion-exclusion',
  number: 12,
  title: 'Inclusion and exclusion',
  blurb: 'When two groups overlap, adding double-counts the shared members. Subtract them back.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'When groups overlap',
      body: [
        'The addition principle counted "one OR the other" by adding, but it had a condition: the two groups could not share any members. Sandwiches and salads are separate, so 3 + 5 is safe.',
        'Plenty of groups do overlap. In a deck, hearts and queens share the queen of hearts. In a class, the soccer players and the basketball players might include people who play both. This lesson is about counting "A OR B" when the groups overlap.',
      ],
    },

    // Commit-once trap. The learner is primed to add (addition principle),
    // and 12 + 9 = 21 is the canonical miss. The resolve slot turns the
    // double-count into the discovery.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'soccer-basketball',
          interactionKind: 'multiple-choice',
          prompt:
            'In a class, 12 students play soccer and 9 play basketball. Of those, 5 play both sports. How many students play at least one of the two sports?',
          options: [
            { id: 'add', label: '21' },
            { id: 'correct', label: '16' },
            { id: 'both-only', label: '5' },
            { id: 'one-sport', label: '11' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Adding gives 12 + 9 = 21, but the 5 who play both are in both counts, so they are counted twice. Subtract them once: 21 − 5 = 16.',
          feedbackDefault:
            'The 5 who play both sports are inside the 12 and inside the 9. What does adding 12 + 9 do to them?',
          feedbackByOption: {
            add: '21 is 12 + 9. But the 5 two-sport students were counted in the soccer group and again in the basketball group, so 21 counts them twice.',
            'both-only': '5 is just the students who play both. The question asks for everyone who plays at least one sport.',
            'one-sport':
              '11 looks like "exactly one sport" (16 − 5). The question asks for at least one, which includes the 5 who play both.',
          },
          explanation:
            'The 5 both-players sit in both the soccer count and the basketball count, so 12 + 9 = 21 counts them twice. Subtract the overlap once: 12 + 9 − 5 = 16 students play at least one sport.',
          skills: ['inclusion-exclusion'],
        },
      ],
    },

    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Why you subtract once',
      prompt:
        'Adding two group sizes counts every shared member twice, once in each group.',
      body: [
        'Picture the 12 soccer players and the 9 basketball players. The 5 who play both are standing in both lines. When you add 12 + 9, you count those 5 people once in the soccer total and a second time in the basketball total.',
        'To fix it, take the overlap out one time: 12 + 9 − 5 = 16. Now every student is counted exactly once, whether they play one sport or both.',
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'Add the two events, then subtract what they share.',
      theorem: {
        name: 'Inclusion-exclusion',
        statement:
          'P(A or B) = P(A) + P(B) − P(A and B). Add the chance of each event, then subtract the chance of both, which you counted twice.',
      },
      definition: {
        name: 'If counting is easier',
        statement:
          'The bars in |A| mean "the number of outcomes in A." When a probability is easier to count than to read off, count the winners over the total: P(A or B) = |A or B| ÷ N, where |A or B| = |A| + |B| − |A and B| and N is the size of the sample space.',
      },
      body: [
        'The name says the method: include both events, then exclude the part counted twice, the outcomes that are in both.',
        'The addition principle is the special case with no overlap. If A and B can never both happen, then P(A and B) is 0, the subtraction does nothing, and you are back to P(A) + P(B).',
      ],
    },

    {
      id: 'cards-count',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'heart-or-face',
          interactionKind: 'multiple-choice',
          prompt:
            'In a standard deck, 13 cards are hearts and 12 cards are face cards (J, Q, K). How many cards are a heart OR a face card?',
          context: 'The face cards of hearts (jack, queen, king of hearts) are in both groups.',
          options: [
            { id: 'add', label: '25' },
            { id: 'correct', label: '22' },
            { id: 'hearts', label: '13' },
            { id: 'faces', label: '12' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. 13 hearts + 12 face cards counts the 3 heart face cards twice, so subtract them once: 13 + 12 − 3 = 22.',
          feedbackDefault:
            'How many cards are BOTH a heart and a face card? Add the two groups, then subtract that shared count.',
          feedbackByOption: {
            add: '25 is 13 + 12. The jack, queen, and king of hearts are in both groups, so they are counted twice. Subtract those 3.',
            hearts: 'That is only the hearts. The other nine face cards (in clubs, diamonds, spades) count too.',
            faces: 'That is only the face cards. The other ten hearts count too.',
          },
          explanation:
            'There are 13 hearts and 12 face cards, but 3 cards (jack, queen, king of hearts) are in both. By inclusion-exclusion, 13 + 12 − 3 = 22.',
          skills: ['inclusion-exclusion'],
        },
      ],
    },

    {
      id: 'heart-or-queen',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'p-heart-or-queen',
          interactionKind: 'fill-fraction',
          prompt:
            'You draw one card from a standard 52-card deck. What is the probability it is a heart or a queen?',
          context:
            'There are 13 hearts and 4 queens, and the queen of hearts is in both. Type the count of winning cards over 52.',
          numerator: 16,
          denominator: 52,
          numeratorLabel: 'k = hearts or queens',
          denominatorLabel: 'N = cards in the deck',
          feedbackCorrect:
            'Right. 13 hearts + 4 queens − 1 shared card = 16 winning cards, so P(heart or queen) = 16/52, which simplifies to 4/13.',
          feedbackDefault:
            'Count the cards that are a heart or a queen using inclusion-exclusion: 13 + 4 − 1. Put that over 52.',
          feedbackByWrongAnswer: {
            '17/52':
              '17 forgets the overlap. The queen of hearts is a heart AND a queen, so 13 + 4 counts it twice. Subtract 1.',
            '13/52':
              'That is just the hearts. The other three queens are winning cards too.',
            '4/52':
              'That is just the queens. The other twelve hearts are winning cards too.',
          },
          explanation:
            'By inclusion-exclusion, the number of hearts or queens is 13 + 4 − 1 = 16. So P(heart or queen) = 16/52 = 4/13.',
          afterNote: 'P(heart or queen) = (13 + 4 − 1)/52 = 16/52 = 4/13.',
          skills: ['inclusion-exclusion', 'favorable-over-total'],
        },
      ],
    },

    {
      id: 'add-or-subtract',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'which-needs-subtraction',
          interactionKind: 'multiple-choice',
          prompt:
            'In which of these does counting "A or B" need you to subtract an overlap?',
          context: 'Subtract only when a single item can belong to both groups at once.',
          options: [
            {
              id: 'disjoint',
              label: 'Order one item: 3 sandwiches or 5 salads.',
            },
            {
              id: 'overlap',
              label: 'Draw one card that is a red card or a king.',
            },
            {
              id: 'coin',
              label: 'Flip one coin: heads or tails.',
            },
            {
              id: 'die',
              label: 'Roll one die: a 1 or a 2.',
            },
          ],
          correctOptionId: 'overlap',
          feedbackCorrect:
            'Right. The two red kings are red AND kings, so red cards and kings overlap. You subtract those 2 to avoid double-counting.',
          feedbackDefault:
            'Look for a case where one single outcome could be counted in both groups at the same time.',
          feedbackByOption: {
            disjoint:
              'A sandwich is never also a salad, so the groups do not overlap. Plain addition (the addition principle) is enough.',
            coin: 'A flip is heads or tails, never both at once. No overlap, so you just add.',
            die: 'A single roll cannot be both a 1 and a 2, so those groups do not overlap. Just add.',
          },
          explanation:
            'Subtraction is needed only when one outcome can sit in both groups. A red king is both red and a king, so "red or king" overlaps and needs inclusion-exclusion. The others are disjoint, so the addition principle handles them.',
          skills: ['inclusion-exclusion', 'addition-principle'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Add, then take back the overlap',
      body:
        'Inclusion-exclusion completes the OR story: |A or B| = |A| + |B| − |A and B|. Add both groups, then subtract whatever they share so nothing is counted twice. When the groups do not overlap, the subtraction is zero and you are back to the addition principle.\n\nNext, counting takes a new turn. Instead of OR and AND, you will count arrangements, where the order matters, and selections, where it does not.',
      mascotLine: 'Add both, subtract the overlap.',
    },
  ],
};
