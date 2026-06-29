import type { Lesson } from '../types';

/**
 * "The conditional formula" (Unit, Conditional probability).
 *
 * Audience: 8–15 year olds. Voice matches the rest of the course:
 * declarative, grounded, sparing on contractions, no em dashes in
 * user-facing copy, no chatty interjections.
 *
 * Pedagogical job: turn the restricted-sample-space counting from the
 * previous lesson into a precise formula. "Given B" means you throw away
 * every outcome where B is false and re-count inside what is left, so
 *
 *   P(A | B) = P(A and B) / P(B).
 *
 *   1. welcome      — recall that conditioning shrinks the world; now name
 *                     it with a formula.
 *   2. the-puzzle   — commit-once MCQ on the soccer/chess two-way table.
 *                     Trap 3/20 (the joint, dividing by the whole class)
 *                     vs correct 3/8 (divide by the 8 soccer players).
 *   3. the-rule     — theorem (the formula, violet) + definition box for
 *                     the bar notation "A | B" (blue).
 *   4. worked       — derive 3/8 on the soccer/chess numbers two ways:
 *                     by restricting to the 8 soccer players, and via the
 *                     formula with the 20s cancelling.
 *   5. marbles      — fill-fraction reinforcement: P(chipped | red) = 2/6.
 *   6. order-counts — concept: the bar is directional, P(A | B) is not the
 *                     same question as P(B | A).
 *   7. reverse-it   — MCQ contrasting P(cat | dog) vs P(dog | cat) on clean
 *                     two-way numbers (6/10 vs 6/12), with the joint 6/30
 *                     as the third trap.
 *   8. wrap         — segue to independence-revisited, where conditioning is
 *                     turned around to ask when it changes nothing.
 *
 * Misconception tagging notes:
 *   - Slot 2: the 3/20 trap is "used the joint instead of the conditional"
 *     (divided by the whole sample space rather than the restricted one).
 *     No key in misconceptions.ts names that error cleanly (base_rate_neglect
 *     is for ignoring base rates, conjunction is for over-rating a combined
 *     event), so misconceptionByOption is intentionally omitted rather than
 *     mislabeled.
 *   - Slot 7: the 6/12 trap is a reversal (computed P(dog | cat) instead of
 *     P(cat | dog)). That is a directionality slip, not base-rate neglect,
 *     so base_rate_neglect is deliberately NOT attached here.
 *
 * Rendering note: `renderInlineMath` only turns `{a/b}` into a stacked
 * fraction when neither side contains a nested slash, so derivations spell
 * the cancellation in prose (`{3/20}` divided by `{8/20}`) instead of
 * writing `{(3/20)/(8/20)}`, which would not match.
 */
export const conditionalFormula: Lesson = {
  id: 'conditional-formula',
  number: 15,
  title: 'The conditional formula',
  blurb: 'Write "given that B happened" as a formula: P(A | B) = P(A and B) / P(B).',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Naming the shrink',
      body: [
        'Last lesson you saw that learning something new can shrink the world of outcomes. Once you know an event B happened, every outcome where B is false is off the table, and you re-count inside what is left.',
        'That move has a name and a formula. This lesson writes "the chance of A, given that B happened" as one clean expression you can compute every time.',
      ],
    },

    // Commit-once trap. The reflex right after basic probability is to put
    // the favorable count over the whole class (3/20). The correct move is
    // to divide by the restricted world, the 8 soccer players (3/8). The
    // 3/20 trap is the joint probability; no misconception key fits it
    // cleanly, so misconceptionByOption is omitted (see header note).
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'soccer-chess',
          interactionKind: 'multiple-choice',
          prompt:
            'In a class of 20 students, 8 play soccer. Of those 8, 3 also play chess. You pick a soccer player at random. What is the chance they also play chess?',
          context:
            'You already know the student you picked plays soccer, so only the soccer players are in play.',
          options: [
            { id: 'joint', label: '3/20' },
            { id: 'correct', label: '3/8' },
            { id: 'rest', label: '3/12' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Knowing the student plays soccer shrinks the world from 20 to just the 8 soccer players. Of those 8, three play chess, so the chance is 3/8.',
          feedbackDefault:
            'You already know the student plays soccer. Count only inside the 8 soccer players, not the whole class of 20.',
          feedbackByOption: {
            joint:
              '3/20 is the chance a random student out of the whole class of 20 plays both soccer and chess. But you already know this one plays soccer, so the bottom should be the 8 soccer players, not 20.',
            rest:
              '3/12 puts the 3 over the 12 students who do not play soccer. You picked a soccer player, so you count inside the 8 who do, giving 3/8.',
          },
          explanation:
            'Given that the student plays soccer, the world shrinks to those 8 players. Three of them also play chess, so the chance is 3 out of 8.',
          skills: ['conditional-probability'],
        },
      ],
    },

    // The rule. Theorem (the formula, violet) leads; the definition (the
    // bar notation, blue) follows, matching the theorem-first dual-box
    // layout used elsewhere.
    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'The shrink-and-recount move is a formula you can write down.',
      theorem: {
        name: 'Conditional probability',
        statement:
          'For events A and B with P(B) > 0, P(A | B) = {P(A and B) / P(B)}: among the outcomes where B happens, the share that also have A.',
      },
      definition: {
        name: 'A given B',
        statement:
          'The bar in P(A | B) is read "A given B." It means you already know B happened, so you only look at the outcomes where B is true and ask how many of those also have A.',
      },
      body: [
        'The bottom, P(B), is the size of the shrunken world. The top, P(A and B), is how much of that world also has A. Dividing turns a count inside the whole sample space into a share inside B alone.',
      ],
    },

    {
      id: 'worked',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Why it gives 3/8',
      prompt: 'The formula and the by-hand count land on the same answer.',
      example: {
        title: 'Soccer player who also plays chess',
        steps: [
          'Forget the other 12 students. Knowing you picked a soccer player shrinks the world to just the 8 soccer players.',
          'Inside that world of 8, count how many also play chess. That is 3.',
          'So the chance is 3 out of 8, which is {3/8}.',
          'The formula agrees. Out of the whole class, P(soccer and chess) = {3/20} and P(soccer) = {8/20}.',
          'Dividing {3/20} by {8/20} cancels the 20s and leaves {3/8}, the same answer.',
        ],
      },
      body: [
        'Restricting to the 8 soccer players and dividing the two class-wide fractions are the same move written two ways. The division is what cancels the 20 and rescales the count to the smaller world.',
      ],
    },

    {
      id: 'marbles',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'chipped-given-red',
          interactionKind: 'fill-fraction',
          prompt:
            'Given that the marble is red, what is the chance it is chipped? Write it as a fraction.',
          context:
            'A jar has 10 marbles: 6 red and 4 blue. 2 of the red marbles are chipped, and no blue marbles are chipped.',
          numerator: 2,
          denominator: 6,
          numeratorLabel: 'chipped red marbles',
          denominatorLabel: 'red marbles',
          feedbackCorrect:
            'Right. Knowing the marble is red shrinks the world to the 6 red marbles. Two of those are chipped, so the chance is 2/6.',
          feedbackDefault:
            'You already know the marble is red, so count only inside the 6 red marbles. How many of those are chipped?',
          feedbackByWrongAnswer: {
            '2/10':
              '2/10 is the chance a random marble out of all 10 is both red and chipped. You already know it is red, so divide by the 6 red marbles, not 10.',
            '2/4':
              '4 is the number of blue marbles. You are told the marble is red, so the bottom is the 6 red marbles, giving 2/6.',
            '6/10':
              '6/10 is the chance a marble is red, which is the bottom of the formula, not the answer. You want the chipped share inside the red marbles: 2/6.',
            empty:
              'Type the fraction: chipped red marbles on top, red marbles on the bottom.',
          },
          explanation:
            'P(chipped | red) = P(chipped and red) / P(red) = {2/10} divided by {6/10} = 2/6. The 10s cancel, leaving the 2 chipped red marbles over the 6 red marbles.',
          afterNote: 'Given red, the world is just the 6 red marbles, and 2 of them are chipped.',
          skills: ['conditional-probability'],
        },
      ],
    },

    {
      id: 'order-counts',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'The bar points one way',
      prompt: 'P(A | B) and P(B | A) are different questions.',
      body: [
        'The bar is directional. P(A | B) shrinks the world to B and asks about A. P(B | A) shrinks the world to A and asks about B. The world you keep is whatever sits on the right of the bar.',
        'Because the two questions divide by different totals, they usually give different answers. "Given it is raining, the chance the ground is wet" is close to certain, but "given the ground is wet, the chance it is raining" is not, since sprinklers and hoses also wet the ground.',
      ],
    },

    // Contrast P(A|B) vs P(B|A) on clean two-way numbers. The 6/12 option is
    // the reversal P(dog | cat); 6/30 is the joint. The reversal is a
    // directionality slip, NOT base-rate neglect, so no misconception key is
    // attached (see header note).
    {
      id: 'reverse-it',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'cat-given-dog',
          interactionKind: 'multiple-choice',
          prompt:
            'You pick a dog owner at random. What is the chance they also own a cat?',
          context:
            'In a survey of 30 people, 10 own a dog and 12 own a cat. 6 people own both a dog and a cat.',
          options: [
            { id: 'correct', label: '6/10' },
            { id: 'reversed', label: '6/12' },
            { id: 'joint', label: '6/30' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Given a dog owner, the world shrinks to the 10 dog owners. Six of them own a cat, so P(cat | dog) = 6/10.',
          feedbackDefault:
            'You picked a dog owner, so divide by the 10 dog owners. How many of those also own a cat?',
          feedbackByOption: {
            reversed:
              '6/12 is the reversed question, P(dog | cat): among the 12 cat owners, the share who own a dog. You were asked about a dog owner, so the bottom is the 10 dog owners, giving 6/10.',
            joint:
              '6/30 is the chance a random person out of all 30 owns both a dog and a cat. You already know this person owns a dog, so restrict to the 10 dog owners.',
          },
          explanation:
            'P(cat | dog) = P(cat and dog) / P(dog) = {6/30} divided by {10/30} = 6/10. The reversed P(dog | cat) = 6/12 is a different question because it divides by the 12 cat owners instead.',
          skills: ['conditional-probability'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'One formula for "given"',
      body:
        'Conditioning on B means you throw away every outcome where B is false and re-count inside what is left. Written as a formula, that is P(A | B) = P(A and B) / P(B), with the bottom being the shrunken world and the top being the part of it that also has A.\n\nKeep the bar pointed the right way: P(A | B) is not the same question as P(B | A). Next you will turn this formula on its head to ask when conditioning changes nothing at all, which is exactly what it means for two events to be independent.',
      segueToLessonId: 'independence-revisited',
      mascotLine: 'Given B? Throw out the rest, then re-count.',
    },
  ],
};
