import type { Lesson } from '../types';

/**
 * "Independent events" (Unit 4, Probabilities of multiple events). D103.
 *
 * Audience: 8–15 year olds. Voice matches L1–L14: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: when one event does not change another's chance, the
 * probability that BOTH happen is the product P(A) × P(B). This is the
 * multiplication principle (Unit 2) carried from counting onto
 * probabilities. The hazard is the add/multiply mix-up, so the lesson
 * keeps contrasting independent AND (multiply) with disjoint OR (add).
 * It closes with the "at least one" complement shortcut, which leans on
 * both independence (to count "none") and the complement rule.
 *
 *   1. welcome           — independence: one outcome does not change the
 *                          other's chance (coin flips, separate dice)
 *   2. the-puzzle        — commit-once MCQ: P(heads twice) with two flips.
 *                          Trap 1/2 (single flip), 1/3 (mis-listing); 1/4.
 *   3. the-rule          — theorem (P(A and B) = P(A) × P(B), violet) +
 *                          definition of independence (blue)
 *   4. and-multiplies    — concept: same AND-multiplies logic as the
 *                          counting multiplication principle, on chances
 *   5. both-sixes        — fill-fraction: P(both dice six) = 1/36. The
 *                          add trap (1/3) is tagged add_vs_multiply.
 *   6. multiply-or-add   — MCQ: independent AND (multiply) vs disjoint OR
 *                          (add). The add answer is tagged add_vs_multiply.
 *   7. at-least-one      — concept: "at least one" via the complement,
 *                          using independence to count "none"
 *   8. at-least-one-head — fill-fraction: P(at least one head in two
 *                          flips) = 3/4. Forgetting to subtract from 1
 *                          (1/4) is tagged complement_inversion.
 *   9. wrap              — independence multiplies; segue to birthday-paradox
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (same as L2, L4–L14).
 *   - "Independence" is a new word → blue definition; the product rule is
 *     a derivable claim → violet theorem (theorem-first dual-box layout).
 *   - Built directly on the multiplication principle: AND multiplies.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const independentEvents: Lesson = {
  id: 'independent-events',
  number: 17,
  title: 'Independent events',
  blurb: "When one event does not change another's chance, multiply the probabilities.",
  estimatedMinutes: 7,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'When one flip forgets the last',
      body: [
        'Flip a fair coin and it lands heads. Flip it again. The coin has no memory, so the second flip is still a clean 1/2 chance, exactly as if the first flip never happened.',
        'Two separate dice work the same way. The number on one die does nothing to the number on the other. When one event does not change the chance of another, the two events are called independent, and this lesson shows how to combine them.',
      ],
    },

    // Commit-once trap. The reflex with no rule yet is to report a single
    // flip's chance (1/2) or to over-merge the four outcomes into three
    // (1/3). The product, 1/2 × 1/2 = 1/4, is the discovery the next
    // slots name. 1/2 is a "forgot the second flip" miss rather than a
    // clean add, so no add_vs_multiply tag here; the add trap lands on
    // both-sixes and multiply-or-add, where adding genuinely fits.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'heads-twice',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip a fair coin twice. What is the probability of getting heads both times?',
          options: [
            { id: 'single', label: '1/2' },
            { id: 'correct', label: '1/4' },
            { id: 'thirds', label: '1/3' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. The two flips do not affect each other, so multiply: 1/2 × 1/2 = 1/4. List them and you see it: HH, HT, TH, TT are four equally likely outcomes, and only HH is heads twice.',
          feedbackDefault:
            'Each flip is its own 1/2 chance, and the first flip does not change the second. The next pages show how to combine them.',
          feedbackByOption: {
            single:
              '1/2 is the chance of heads on a single flip. Getting heads on both flips is rarer than getting heads on one.',
            thirds:
              '1/3 would treat "two heads", "one head", and "no heads" as three equal cases, but they are not equal. List the outcomes: HH, HT, TH, TT are four equally likely results, and only HH wins.',
          },
          explanation:
            'Two flips have four equally likely outcomes: HH, HT, TH, TT. Exactly one is heads twice, so the probability is 1/4. That is 1/2 × 1/2, the two independent flips multiplied.',
          skills: ['independence', 'multiplication-principle'],
        },
      ],
    },

    // The rule. Theorem (the product, violet) leads; definition (the new
    // word "independence", blue) follows, theorem-first dual-box layout.
    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'You multiplied the two flips. Here is why that works, and when.',
      theorem: {
        name: 'Independent events',
        statement: 'If A and B are independent, then P(A and B) = {P(A) × P(B)}.',
      },
      definition: {
        name: 'Independence',
        statement:
          'Two events are independent when one happening does not change the chance of the other. A coin landing heads does not change the next flip, and two separate dice do not influence each other.',
      },
      body: [
        'The word "and" is the signal. To get the chance that A happens AND B happens, multiply their separate chances together.',
        'The catch is the independence condition. The rule needs the second chance to stay the same no matter how the first event turns out. Coin flips and separate dice pass that test; drawing cards and keeping them does not, because the deck changes after each draw.',
      ],
    },

    {
      id: 'and-multiplies',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The same AND, now on chances',
      prompt: 'You have multiplied across stages before, when you counted outcomes.',
      body: [
        'The multiplication principle said that if a first choice has a ways and a second choice has b ways, then together they have a × b combined outcomes. AND across stages multiplied the counts.',
        'Independent probabilities follow the very same pattern, one level up. Where counting multiplied the number of ways, probability multiplies the chances: P(A and B) = P(A) × P(B). It is one idea, AND multiplies, used first on counts and now on probabilities.',
      ],
    },

    {
      id: 'both-sixes',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'p-both-sixes',
          interactionKind: 'fill-fraction',
          prompt: 'You roll two fair dice. What is the probability that both land on six?',
          context:
            'Each die shows a six with probability 1/6, and the two dice do not affect each other.',
          numerator: 1,
          denominator: 36,
          numeratorLabel: 'six on first AND six on second',
          denominatorLabel: 'equally likely pairs (6 × 6)',
          feedbackCorrect:
            'Right. Each die shows a six with probability 1/6, and the rolls are independent, so 1/6 × 1/6 = 1/36.',
          feedbackDefault:
            'Multiply the chance of a six on the first die by the chance of a six on the second.',
          feedbackByWrongAnswer: {
            '1/3':
              '1/3 is 1/6 + 1/6, the two chances added. AND across independent events multiplies, it does not add: 1/6 × 1/6 = 1/36.',
            '2/36':
              'Only one of the 36 equally likely pairs is (6, 6), so the numerator is 1, not 2. "Both sixes" is an AND, so multiply: 1/6 × 1/6 = 1/36.',
            '1/6':
              '1/6 is the chance that one die shows a six. Both dice must show six, which is much rarer.',
            '1/12':
              '1/12 is 1/6 × 1/2, not 1/6 × 1/6. Each die has a 1/6 chance of a six, not 1/2.',
          },
          misconceptionByFraction: [{ num: 1, den: 3, key: 'add_vs_multiply' }],
          explanation:
            'The 36 ordered pairs are all equally likely, and only (6, 6) has both sixes, so the probability is 1/36. That equals 1/6 × 1/6, the two independent rolls multiplied.',
          afterNote: 'P(both six) = 1/6 × 1/6 = 1/36.',
          skills: ['independence', 'multiplication-principle'],
        },
      ],
    },

    {
      id: 'multiply-or-add',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'heads-and-six',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip a fair coin and roll a fair die. What is the probability of getting heads AND a six?',
          context: 'The flip and the roll are independent: neither one changes the other.',
          options: [
            { id: 'correct', label: '1/12' },
            { id: 'added', label: '2/3' },
            { id: 'die-only', label: '1/6' },
            { id: 'coin-only', label: '1/2' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Heads has probability 1/2, a six has probability 1/6, and they are independent, so 1/2 × 1/6 = 1/12.',
          feedbackDefault:
            'These are two separate experiments joined by AND. Multiply their probabilities together.',
          feedbackByOption: {
            added:
              '2/3 is 1/2 + 1/6. Adding is for OR across outcomes that cannot both happen, like rolling a 2 or a 5 on one die. Heads and a six can happen together, so multiply: 1/2 × 1/6 = 1/12.',
            'die-only':
              '1/6 is the chance of a six on its own. You also need heads, which makes the combined event rarer than either part.',
            'coin-only':
              '1/2 is the chance of heads on its own. You also need a six on the die.',
          },
          misconceptionByOption: { added: 'add_vs_multiply' },
          explanation:
            'Heads and a six come from two independent experiments joined by AND, so multiply: 1/2 × 1/6 = 1/12. Adding (1/2 + 1/6) is the move for disjoint OR events on a single experiment, such as a 2 or a 5 on one die, where the two cases cannot overlap.',
          skills: ['independence', 'multiplication-principle'],
        },
      ],
    },

    {
      id: 'at-least-one',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'At least one, the easy way',
      prompt:
        'To find the chance of at least one head, find the chance of no heads first, then subtract from 1.',
      body: [
        'Flip a coin twice. "At least one head" covers HT, TH, and HH, which is three cases to chase down. Its opposite is a single case: "no heads at all," which is just TT.',
        'The two flips are independent, so P(no heads) is a clean product: P(tails) × P(tails) = 1/2 × 1/2 = 1/4. The complement rule then finishes the job: P(at least one head) = 1 − 1/4 = 3/4.',
      ],
    },

    {
      id: 'at-least-one-head',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'p-at-least-one-head',
          interactionKind: 'fill-fraction',
          prompt: 'You flip a fair coin twice. What is the probability of getting at least one head?',
          context:
            'Start from the opposite. P(no heads) = 1/2 × 1/2 = 1/4, then subtract that from 1.',
          numerator: 3,
          denominator: 4,
          numeratorLabel: 'outcomes with at least one head',
          denominatorLabel: 'equally likely outcomes',
          feedbackCorrect:
            'Right. P(no heads) = 1/2 × 1/2 = 1/4, so P(at least one head) = 1 − 1/4 = 3/4.',
          feedbackDefault:
            'Find the chance of no heads at all (both tails), then subtract it from 1.',
          feedbackByWrongAnswer: {
            '1/4':
              '1/4 is P(no heads), the opposite event. The question asks for at least one head, so subtract from 1: 1 − 1/4 = 3/4.',
            '1/2':
              '1/2 is the chance of a head on a single flip. With two flips, at least one head is more likely than that.',
            '2/4':
              '2/4 is 1/2, the chance of a head on one flip. List the two flips: HT, TH, HH all have a head, so 3 of the 4 outcomes qualify.',
          },
          misconceptionByFraction: [{ num: 1, den: 4, key: 'complement_inversion' }],
          explanation:
            'The opposite of "at least one head" is "no heads," which is TT, with probability 1/2 × 1/2 = 1/4. By the complement rule, P(at least one head) = 1 − 1/4 = 3/4. Counting directly agrees: HT, TH, HH are 3 of the 4 equally likely outcomes.',
          afterNote: 'P(at least one head) = 1 − 1/4 = 3/4.',
          skills: ['independence', 'multiplication-principle', 'complement-rule'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'AND multiplies',
      body:
        "When two events are independent, one outcome does not change the other's chance, and the probability that both happen is the product: P(A and B) = P(A) × P(B). That is the same AND-multiplies logic you used to count outcomes, now working on probabilities. Watch the connecting word: independent AND multiplies, while disjoint OR adds.\n\nIndependence also unlocks the \"at least one\" shortcut. Find the chance that none of the events happen, multiply those clean pieces, then subtract from 1. Next you will aim this multiplying at a roomful of people and meet the birthday paradox, where the odds of a shared birthday climb far faster than intuition expects.",
      mascotLine: "Independent? Multiply. Want \"at least one\"? Subtract from 1.",
      segueToLessonId: 'birthday-paradox',
    },
  ],
};
