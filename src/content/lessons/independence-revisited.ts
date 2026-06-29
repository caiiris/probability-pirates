import type { Lesson } from '../types';

/**
 * "Independence revisited" (Unit 6, Conditional Probability). D108.
 *
 * Audience: 8–15 year olds. Voice matches L1–L17: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: define independence precisely now that the learner has
 * conditional probability. A and B are independent exactly when conditioning
 * changes nothing: P(A | B) = P(A). That is the same idea as the earlier
 * "independent events multiply" rule (Unit 4), seen from the conditioning
 * side. The lesson hunts down two famous confusions:
 *   1. mutually exclusive is NOT independent (disjoint events are extreme
 *      dependence: if one happens, the other becomes impossible);
 *   2. "without replacement" is NOT independent (the pool changes).
 *
 *   1. welcome        — recall the multiply rule; now name what independence
 *                       really means using conditioning
 *   2. the-puzzle     — commit-once MCQ: are "heart" and "spade" on one card
 *                       independent? They feel separate but are mutually
 *                       exclusive, so they are dependent. Correct = "not
 *                       independent."
 *   3. the-rule       — definition (P(A|B) = P(A)) + theorem (three
 *                       equivalent tests)
 *   4. resolve        — concept: mutually exclusive is the opposite of
 *                       independent (P(spade | heart) = 0, not 1/4)
 *   5. table-test     — MCQ: P(pizza | instrument) = P(pizza), so independent
 *   6. dependent-draw — MCQ: without replacement is dependent
 *                       (replacement_confusion on the "yes" trap)
 *   7. product-test   — MCQ: P(A and B) = P(A) × P(B) confirms independence
 *   8. wrap           — segue to bayes-theorem
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (the disjoint/independent confusion).
 *   - "Independence" gets a sharper blue definition; the three equivalent
 *     tests are the violet theorem (theorem-first dual-box layout).
 *
 * Misconception tagging notes:
 *   - Slot 2: "mutually exclusive equals independent" has no dedicated key in
 *     misconceptions.ts, so misconceptionByOption is intentionally omitted
 *     rather than mislabeled (same call as conditional-formula slot 2).
 *   - Slot 6: the "draws are independent" trap is replacement_confusion.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const independenceRevisited: Lesson = {
  id: 'independence-revisited',
  number: 25,
  title: 'Independence revisited',
  blurb: 'Independent means knowing one event tells you nothing about the other.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'What independence really means',
      body: [
        'Back in the combining unit, you multiplied independent events: P(A and B) = P(A) times P(B). You used it before you had a clean way to say what "independent" even means.',
        'Now you do. With conditional probability in hand, independence has a sharp definition: learning that one event happened does not change the chance of the other. This lesson makes that precise and clears up two traps that fool almost everyone.',
      ],
    },

    // Commit-once trap. Mutually exclusive events feel "separate" and people
    // call them independent. They are the opposite: learning it is a heart
    // forces P(spade) to 0. No clean misconception key, so none tagged.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'heart-or-spade',
          interactionKind: 'multiple-choice',
          prompt:
            'You draw one card. Event A is "it is a heart." Event B is "it is a spade." Are A and B independent?',
          context: 'Independent means learning that one happened does not change the other\u2019s chance.',
          options: [
            { id: 'yes-separate', label: 'Independent, they are different suits' },
            {
              id: 'correct',
              label: 'Not independent, a heart cannot also be a spade',
            },
            { id: 'yes-equal', label: 'Independent, every card is equally likely' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The moment you learn the card is a heart, the chance it is a spade drops to 0. Learning one changed the other completely, so they are dependent.',
          feedbackDefault:
            'Ask what happens to P(spade) once you are told the card is a heart. If that number moves, the events are not independent.',
          feedbackByOption: {
            'yes-separate':
              'Different suits feel separate, but that is the trap. A single card cannot be both, so learning it is a heart makes a spade impossible. That is dependence, not independence.',
            'yes-equal':
              'Equally likely cards do not make events independent. Knowing the card is a heart sends P(spade) from {1/4} all the way to 0, so the events are dependent.',
          },
          explanation:
            'P(spade) is {1/4} on its own, but P(spade | heart) = 0, because one card cannot be two suits. The conditional probability changed, so heart and spade are dependent. Events that cannot both happen are the most dependent of all.',
          skills: ['independence', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'Independence is a statement about conditioning: it changes nothing.',
      theorem: {
        name: 'Three equivalent tests',
        statement:
          'A and B are independent exactly when any one of these holds, and then all three do: P(A | B) = P(A); P(B | A) = P(B); P(A and B) = P(A) × P(B).',
      },
      definition: {
        name: 'Independence',
        statement:
          'Two events are independent when learning one happened leaves the other\u2019s chance unchanged: P(A | B) = P(A).',
      },
      body: [
        'The first two tests say conditioning does nothing: the bar leaves the probability alone. The third is the multiply rule you already used.',
        'They are the same fact wearing different clothes. If conditioning does not move the chance, then P(A and B) collapses to P(A) times P(B), and that is why independent events multiply.',
      ],
    },

    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Mutually exclusive is not independent',
      prompt: 'Events that cannot both happen are the opposite of independent.',
      theorem: {
        name: 'Disjoint means dependent',
        statement:
          'If two events cannot both happen, then learning one occurred forces the other to be impossible. Conditioning swings the chance to 0, the strongest dependence there is.',
      },
      body: [
        'It is easy to hear "separate" and think "independent." But "cannot happen together" is a powerful link, not the absence of one. Heart and spade cannot share a card, so each one rules the other out.',
        'Independent events are different: they CAN happen together, and one happening does not nudge the other. A coin landing heads and a die landing six can both occur, and neither one changes the other.',
      ],
    },

    {
      id: 'table-test',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'pizza-instrument',
          interactionKind: 'multiple-choice',
          prompt:
            'Out of 200 students, 120 like pizza. Among the 80 who play an instrument, 48 like pizza. Is liking pizza independent of playing an instrument?',
          context: 'Compare P(pizza) for everyone with P(pizza | plays an instrument).',
          options: [
            {
              id: 'correct',
              label: 'Independent, 48/80 equals 120/200',
            },
            { id: 'no-sizes', label: 'Not independent, the groups are different sizes' },
            { id: 'cant-tell', label: 'Cannot tell without more information' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. P(pizza) = {120/200} = {3/5}, and P(pizza | instrument) = {48/80} = {3/5}. Conditioning changed nothing, so they are independent.',
          feedbackDefault:
            'Work out P(pizza) for the whole group, then P(pizza) among instrument players. If they match, the events are independent.',
          feedbackByOption: {
            'no-sizes':
              'Group sizes do not decide it. The test is whether the proportions match: {48/80} = {3/5} is the same as {120/200} = {3/5}, so they are independent.',
            'cant-tell':
              'You have enough. P(pizza) = {120/200} = {3/5} and P(pizza | instrument) = {48/80} = {3/5}. Equal proportions mean independent.',
          },
          explanation:
            'P(pizza) = {120/200} = {3/5}. P(pizza | instrument) = {48/80} = {3/5}. Since P(pizza | instrument) = P(pizza), liking pizza is independent of playing an instrument.',
          skills: ['independence', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'dependent-draw',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'no-replacement',
          interactionKind: 'multiple-choice',
          prompt:
            'You draw two cards from a deck and do not put the first one back. Is the second draw independent of the first?',
          context: 'Independent means the first draw leaves the second draw\u2019s chances unchanged.',
          options: [
            {
              id: 'correct',
              label: 'No, removing the first card changes what is left',
            },
            { id: 'yes-equal', label: 'Yes, every card is equally likely' },
            { id: 'yes-separate', label: 'Yes, the two cards do not touch each other' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The first card is gone, so the deck has 51 cards with a different mix. The second draw\u2019s chances shifted, so the draws are dependent.',
          feedbackDefault:
            'After the first card leaves, is the deck the same for the second draw? If the chances move, the draws are dependent.',
          feedbackByOption: {
            'yes-equal':
              'The cards left are still equally likely among themselves, but there are only 51 now, and the mix has changed. That shift is exactly what dependence means.',
            'yes-separate':
              'Physical separateness is not the test. Removing the first card changes the pool the second draw comes from, so the second draw\u2019s probabilities change.',
          },
          misconceptionByOption: {
            'yes-equal': 'replacement_confusion',
            'yes-separate': 'replacement_confusion',
          },
          explanation:
            'Without replacement, the first draw changes the deck. For example P(second is an ace) depends on whether the first card was an ace, so the draws are dependent. With replacement, the deck resets and the draws would be independent.',
          skills: ['independence', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'product-test',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'product-check',
          interactionKind: 'multiple-choice',
          prompt:
            'For two events, P(A) = 1/2, P(B) = 1/3, and P(A and B) = 1/6. Are A and B independent?',
          context: 'Use the product test: independent exactly when P(A and B) = P(A) times P(B).',
          options: [
            {
              id: 'correct',
              label: 'Independent, since 1/2 times 1/3 equals 1/6',
            },
            { id: 'no', label: 'Not independent' },
            { id: 'need-cond', label: 'You need P(A given B) to decide' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. {1/2} times {1/3} = {1/6}, which matches P(A and B). The product test passes, so they are independent.',
          feedbackDefault:
            'Multiply P(A) by P(B) and compare to P(A and B). If they match, the events are independent.',
          feedbackByOption: {
            no:
              'Check the product: {1/2} times {1/3} = {1/6}, and that is exactly P(A and B). When they match, the events ARE independent.',
            'need-cond':
              'You already have enough. The product test, P(A and B) = P(A) times P(B), is one of the three equivalent tests. {1/2} times {1/3} = {1/6} passes it.',
          },
          explanation:
            'P(A) times P(B) = {1/2} times {1/3} = {1/6}, which equals P(A and B). By the product test, A and B are independent. The same conclusion follows from P(A | B) = {1/6} divided by {1/3} = {1/2} = P(A).',
          skills: ['independence', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Independence, made precise',
      body:
        'Two events are independent when conditioning changes nothing: P(A | B) = P(A). That single idea has three faces, P(A | B) = P(A), P(B | A) = P(B), and P(A and B) = P(A) times P(B), and they always travel together.\n\nWatch the two traps. Mutually exclusive events are not independent, they are deeply dependent, and draws made without replacement are dependent too. Next you will use conditioning in reverse, flipping P(B given A) into P(A given B) with Bayes\u2019 theorem.',
      mascotLine: 'Independent? The bar changes nothing.',
      segueToLessonId: 'bayes-theorem',
    },
  ],
};
