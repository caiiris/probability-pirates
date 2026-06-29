import type { Lesson } from '../types';

/**
 * "The complement rule" (Unit 4, Counting Techniques). D99.
 *
 * Audience: 8–15 year olds. Voice matches L1–L6: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: P(not A) = 1 − P(A). When the event you want is
 * annoying to count head-on, count the opposite and subtract. The killer
 * application is "at least one", whose opposite ("none") is almost always
 * a single, easy outcome to count.
 *
 * Placement (D99): moved out of the old Events unit (which was otherwise
 * dropped, its event/sample-space material already covered in Unit 1) and
 * into Counting Techniques, where "count the smart way" is the theme it
 * shares with inclusion-exclusion.
 *
 *   1. welcome          — frame: sometimes the opposite is easier to count
 *   2. the-puzzle       — commit-once MCQ: P(at least one 6 in two rolls)?
 *                          The add-the-probabilities trap (1/3) is the
 *                          canonical miss; the rule resolves it later.
 *   3. define-complement — definition callout: the complement of A
 *   4. the-rule         — theorem callout: P(not A) = 1 − P(A), because A
 *                          and its complement fill the sample space
 *   5. not-a-six        — fill-fraction: P(not 6) = 5/6, checked two ways
 *   6. at-least-one     — concept: the killer app; resolve the opening
 *                          puzzle with the complement (11/36)
 *   7. three-coins      — MCQ: P(at least one head in 3 flips) = 7/8
 *   8. spot-complement  — MCQ: name the complement of "at least one head"
 *   9. challenge-overlap — CHALLENGE MCQ: hearts OR queens (13 + 4 − 1 = 16).
 *                          Surfaces the double-count-on-overlap idea without
 *                          naming it, teeing up the next lesson.
 *  10. wrap             — close; segue to inclusion-exclusion
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (same as L2, L4, L5, L6).
 *   - "Complement" is a new word, so it gets the blue definition callout;
 *     the rule itself is a derivable claim, so it gets the violet theorem
 *     callout. One word, one claim, two slots.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const complementRule: Lesson = {
  id: 'complement-rule',
  number: 11,
  title: 'The complement rule',
  blurb: 'When counting an event head-on is hard, count the opposite and subtract from 1.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Count the opposite',
      body: [
        'Some events are a chore to count directly. "At least one six in two dice rolls" means one six, or two sixes, on either die, and adding all those cases up by hand is fiddly.',
        'There is a trick. Instead of counting the event, count everything that is NOT the event. This lesson turns that trick into a rule.',
      ],
    },

    // Commit-once trap. The learner has no complement tool yet, so this is
    // a prediction. The add-the-probabilities miss (1/6 + 1/6 = 1/3) is
    // the canonical wrong move; the at-least-one slot resolves it cleanly.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'at-least-one-six',
          interactionKind: 'multiple-choice',
          prompt:
            'You roll two fair dice. What is the probability of getting at least one six?',
          context: 'The sample space is the 36 ordered pairs (first die, second die).',
          options: [
            { id: 'add', label: '1/3' },
            { id: 'correct', label: '11/36' },
            { id: 'one-six', label: '1/6' },
            { id: 'two-only', label: '1/36' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right, and there is a clean way to get it. The opposite of "at least one six" is "no sixes," which is much easier to count. You will see it in a moment.',
          feedbackDefault:
            'Adding 1/6 and 1/6 double-counts the pair (6, 6) and overshoots. There is a tidier path through the opposite event.',
          feedbackByOption: {
            add: '1/3 is 1/6 + 1/6. That counts the pair (6, 6) twice and ignores that the two events overlap. The complement rule avoids the whole mess.',
            'one-six': '1/6 is the chance a single die shows a six. With two dice there are more ways to get at least one six.',
            'two-only': '1/36 is the chance of two sixes, the pair (6, 6) only. "At least one" also includes exactly one six.',
          },
          explanation:
            'Eleven of the 36 pairs contain at least one six, so the answer is 11/36. The next pages show how to get that without listing all eleven.',
          skills: ['complement-rule'],
        },
      ],
    },

    {
      id: 'define-complement',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The complement of an event',
      prompt:
        'Every event splits the sample space in two: the outcomes in the event, and all the rest.',
      definition: {
        name: 'Complement',
        statement:
          'The complement of an event A is the set of all outcomes in the sample space that are not in A. It is the event "A does not happen."',
      },
      body: [
        'Roll one die. If A is "rolling a six," the complement of A is "rolling 1, 2, 3, 4, or 5." Every outcome is in exactly one of the two: a roll is either a six or it is not.',
        'Together, an event and its complement cover the whole sample space, with no overlap and nothing left out.',
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'The rule, named',
      prompt:
        'Because an event and its complement fill the sample space, their probabilities have to add to 1.',
      theorem: {
        name: 'Complement rule',
        statement:
          'For any event A, P(not A) = 1 − P(A). Equivalently, P(A) + P(not A) = 1.',
      },
      body: [
        'Something is certain to happen on each try: either A or not A. A certain event has probability 1, so the two pieces split that 1 between them.',
        'That gives you a choice. Whenever the event A is hard to count but its opposite is easy, find P(not A) first and subtract from 1.',
      ],
    },

    {
      id: 'not-a-six',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'p-not-six',
          interactionKind: 'fill-fraction',
          prompt: 'You roll one fair die. What is the probability of NOT rolling a six?',
          context: 'Five of the six faces are not a six. Type the count as k over N.',
          numerator: 5,
          denominator: 6,
          numeratorLabel: 'k = faces that are not a six',
          denominatorLabel: 'N = faces in total',
          feedbackCorrect:
            'Right. Five faces are not a six, so P(not 6) = 5/6. The rule agrees: 1 − 1/6 = 5/6.',
          feedbackDefault:
            'Count the faces that are not a six (that is k) over all six faces (that is N).',
          feedbackByWrongAnswer: {
            '1/6':
              '1/6 is P(rolling a six), the event itself. You want its complement, the chance of NOT a six.',
            '1/5':
              'The denominator is the whole sample space, which has 6 faces, not 5.',
            '6/6':
              'That would say every face is "not a six," but one face is a six. Five faces qualify, not six.',
          },
          explanation:
            'Five of the six faces are not a six, so P(not 6) = 5/6. This matches the rule: 1 − P(6) = 1 − 1/6 = 5/6.',
          afterNote: 'P(not 6) = 1 − 1/6 = 5/6.',
          skills: ['complement-rule', 'favorable-over-total'],
        },
      ],
    },

    {
      id: 'at-least-one',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Where it shines: "at least one"',
      prompt:
        'The opposite of "at least one" is "none," and "none" is usually a single, easy case.',
      body: [
        'Back to the opening puzzle: at least one six in two rolls. Counting that head-on means juggling one-six and two-six cases. The opposite is simpler: "no sixes at all."',
        'For no sixes, each die must land on one of its five non-six faces. Listing those pairs gives 5 rows of 5, which is 25 of the 36 outcomes. So P(no six) = 25/36.',
        'Now use the rule: P(at least one six) = 1 − P(no six) = 1 − 25/36 = 11/36. That is the answer from the start of the lesson, reached without listing all eleven winning pairs.',
      ],
    },

    {
      id: 'three-coins',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'at-least-one-head',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip three fair coins. What is the probability of getting at least one head?',
          context: 'The sample space has 8 outcomes, from HHH to TTT.',
          options: [
            { id: 'none', label: '1/8' },
            { id: 'half', label: '1/2' },
            { id: 'three', label: '3/8' },
            { id: 'correct', label: '7/8' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The opposite of "at least one head" is "no heads," which is only TTT. P = 1 − 1/8 = 7/8.',
          feedbackDefault:
            'What is the opposite of "at least one head"? How many outcomes is that, out of 8?',
          feedbackByOption: {
            none: '1/8 is P(no heads), the outcome TTT on its own. That is the complement. Subtract it from 1 to get the event itself.',
            half: '1/2 would be the chance of a single coin showing heads. With three coins, "at least one head" is much more likely.',
            three: '3/8 counts the outcomes with exactly one head. "At least one" includes two heads and three heads as well.',
          },
          explanation:
            'Only TTT has no heads, so P(no heads) = 1/8. By the complement rule, P(at least one head) = 1 − 1/8 = 7/8.',
          skills: ['complement-rule'],
        },
      ],
    },

    {
      id: 'spot-complement',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'name-the-complement',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip three coins. Which event is the complement of "at least one head"?',
          options: [
            { id: 'no-heads', label: 'No heads at all (TTT)' },
            { id: 'all-heads', label: 'All heads (HHH)' },
            { id: 'one-head', label: 'Exactly one head' },
            { id: 'at-most-one', label: 'At most one head' },
          ],
          correctOptionId: 'no-heads',
          feedbackCorrect:
            'Right. "At least one head" fails only when there are zero heads, which is TTT.',
          feedbackDefault:
            'The complement is everything where "at least one head" does NOT happen. When does the event fail?',
          feedbackByOption: {
            'all-heads':
              'All heads certainly has at least one head, so it is inside the event, not its complement.',
            'one-head':
              'Exactly one head is also "at least one head," so it is part of the event itself.',
            'at-most-one':
              'At most one head includes the outcomes with exactly one head, and those have a head, so they are in the event, not the complement.',
          },
          explanation:
            'An event fails exactly when none of its outcomes happen. "At least one head" fails only at zero heads, so its complement is "no heads," the single outcome TTT.',
          skills: ['complement-rule'],
        },
      ],
    },

    // Challenge teaser for the next lesson. Surfaces the overlap /
    // double-count problem with the deck the addition-principle wrap
    // flagged ("the queen of hearts is both a heart AND a queen"),
    // without naming inclusion-exclusion. The slot-level `challenge`
    // flag renders the Captain Pascal banner.
    {
      id: 'challenge-overlap',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      challenge: true,
      variants: [
        {
          id: 'hearts-or-queens',
          interactionKind: 'multiple-choice',
          prompt:
            'A standard deck has 13 hearts and 4 queens. How many cards are a heart OR a queen?',
          context: 'Add carefully. Watch for any card that lands in both groups.',
          options: [
            { id: 'hearts', label: '13' },
            { id: 'correct', label: '16' },
            { id: 'add', label: '17' },
            { id: 'all', label: '52' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Sharp. Adding gives 13 + 4 = 17, but the queen of hearts is a heart AND a queen, so that one card got counted twice. Take it off once: 17 − 1 = 16.',
          feedbackDefault:
            'Add the hearts and the queens, then check whether any single card belongs to both groups.',
          feedbackByOption: {
            hearts: 'That is only the hearts. The other three queens are hearts-or-queens too.',
            add: 'So close. 13 + 4 = 17 counts the queen of hearts twice, once as a heart and once as a queen. How many cards sit in both groups?',
            all: '52 is the whole deck. Only the hearts and the queens qualify, not every card.',
          },
          explanation:
            'There are 13 hearts and 4 queens, but the queen of hearts sits in both groups. Adding 13 + 4 counts it twice, so subtract the one shared card: 13 + 4 − 1 = 16. Whenever two groups share members, plain addition over-counts the overlap. The next lesson turns that fix into a rule.',
          skills: ['inclusion-exclusion'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Counting the opposite',
      body:
        'The complement rule, P(not A) = 1 − P(A), turns a hard count into an easy one whenever the opposite event is simpler. Reach for it on any "at least one" question, where the opposite is the single case "none."\n\nYou also just met a different trap. When two groups overlap, like hearts and queens, plain addition double-counts the cards in both. The next lesson turns the fix into a rule.',
      mascotLine: 'Hard to count? Count the opposite.',
      segueToLessonId: 'inclusion-exclusion',
    },
  ],
};
