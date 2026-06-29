import type { Lesson } from '../types';

/**
 * Lesson 4 — "Equally likely outcomes" (Unit 1.3).
 *
 * Audience: 8–15 year olds. Voice matches L1–L3: declarative, grounded,
 * no em dashes, no AI-isms (no "let's", "buckle up", staccato fragment
 * lists). Sentences flow.
 *
 * Pedagogical job: stress-test P(event) = k/N. The formula sits on a
 * quiet assumption (all outcomes in the sample space must be equally
 * likely), and the rest of probability is full of traps where that
 * assumption fails by accident. The lesson surfaces the HT-vs-TH
 * granularity trap up front so the rule lands as a fix, not a fact.
 *
 *   1. welcome       — name the hidden assumption in P = k/N
 *   2. the-puzzle    — commit-once MCQ: 2 coins, P(exactly one heads)?
 *                       Most learners pick 1/3 (the granularity trap).
 *   3. resolve       — concept + two-coins-grid figure: walk through why
 *                       {0H, 1H, 2H} is a tempting but unequal sample
 *                       space; the four-pair sample space is the right
 *                       one.
 *   4. the-rule      — concept + theorem callout: equally-likely is the
 *                       precondition. "When in doubt, drop down."
 *   5. sum-of-seven  — fill-fraction: P(sum=7) on two dice. The 36-pair
 *                       sample space (k = 6, N = 36) is the equally-
 *                       likely one; the 11 sums are not.
 *   6. spotting-wheel     — yes/no: uneven spinner is not equally likely.
 *   7. spotting-thumbtack — yes/no: a biased object is not equally likely.
 *   8. spotting-deck      — MCQ: a shuffled deck is equally likely at every
 *                           grain (52 cards, 4 suits, 13 ranks). "All of the
 *                           above."
 *   9. spotting-dice-sum  — MCQ: the sample space of sums has 11 items
 *                           (callback: those 11 are not equally likely).
 *  10. spotting-dice-equal — fill-text: the equally likely sample space is
 *                            the 36 ordered pairs (6 × 6).
 *  11. wrap          — segue to multiplication-principle: when N gets
 *                       too big to list, you need to count without
 *                       listing.
 *
 * Design pattern:
 *   - The puzzle is *commit-once* (D86): the learner sees feedback for
 *     their pick but does not get to redo, so the concept slot that
 *     follows is teaching, not consolation. This is the same pattern as
 *     `long-run-frequency`'s "the-puzzle" slot.
 *   - The theorem ("Equally likely is required") is a derivable claim
 *     about WHEN the formula applies, so it lives in the violet
 *     `theorem` callout, not the blue `definition` callout. The L3
 *     "Probability of an event" definition is being conditioned, not
 *     renamed.
 *   - The two-coins-grid figure is reused from `sample-space` on the
 *     resolve slot. The four-pair sample space is exactly what makes
 *     the granularity trap visible.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const equallyLikelyOutcomes: Lesson = {
  id: 'equally-likely-outcomes',
  number: 4,
  title: 'Equally likely outcomes',
  blurb: 'Counting outcomes only works when each one is equally likely. Here is what to do when they are not.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'How to use probability correctly',
      body: [
        'In Lesson 3 you saw P(event) = k/N, where k is the size of the event and N is the size of the sample space.',
        'This formula assumes that every outcome in the sample space is equally likely to occur. In this lesson, you\'ll learn how to tackle problems where this assumption does not hold.',
      ],
    },

    // Commit-once trap. Most learners pick 1/3 (the granularity trap).
    // The next two slots resolve whatever they chose, so the wrong-answer
    // feedback here does not need to "teach" — it just signals that the
    // next page explains.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'two-coins-one-head',
          interactionKind: 'multiple-choice',
          prompt: 'You flip two fair coins. What is the probability of exactly one heads?',
          options: [
            { id: 'one-third', label: '1/3' },
            { id: 'one-half', label: '1/2' },
            { id: 'one-fourth', label: '1/4' },
            { id: 'three-fourths', label: '3/4' },
          ],
          correctOptionId: 'one-half',
          feedbackCorrect:
            'Right. Two of the four pairs have exactly one heads, HT and TH, so P = 2/4 = 1/2.',
          feedbackDefault:
            'Each flip is heads or tails. Write out the four pairs of two flips and count which ones have exactly one heads.',
          feedbackByOption: {
            'one-third':
              '1/3 is the tempting answer if you group outcomes by "how many heads." It turns out those groups are not equally likely. The next slide shows the catch.',
            'one-fourth':
              'There is more than one way to get exactly one heads. You may be counting HT but forgetting TH, or counting TH but forgetting HT.',
            'three-fourths':
              '3/4 is the probability of *at least* one heads. The question asked for *exactly* one heads, which is a smaller event.',
          },
          explanation:
            'The four equally-likely pairs of two flips are HH, HT, TH, and TT. Of those, two have exactly one heads (HT and TH), so P(exactly one heads) = 2/4 = 1/2.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    // Resolve the puzzle. Re-uses the autonomous two-coins-grid figure
    // from `sample-space` to anchor the four equally-likely pairs.
    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Three buckets, but not equal-sized',
      prompt:
        'Many people answer 1/3, by grouping outcomes into how many heads came up: 0, 1, or 2.',
      body: [
        'The trouble is that those three cases don\'t occur with equal probability. P(0 heads), P(1 head), and P(2 heads) are 1/4, 2/4, and 1/4. Those add to 1, so the three groups do cover every case. But they are not equally likely, so the formula P = k/N cannot use {0H, 1H, 2H} as its sample space.', 
        'The correct sample space for this problem is {HH, HT, TH, TT}. Then, counting posisbilities gives P(one head) = 1/2.',
      ],
      figure: {
        kind: 'two-coins-grid',
        caption: 'The four equally-likely outcomes of two coin flips.',
      },
    },

    // The rule, stated cleanly with a theorem callout. This is a CLAIM
    // about when the L3 definition applies, not a new term, so it earns
    // the violet `theorem` callout, not the blue `definition` callout.
    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'When the formula works',
      theorem: {
        name: 'Equally likely is required',
        statement:
          'P(event) = k/N is valid only when every outcome in the sample space has the same chance of occurring. Make sure to use a sample space where every single outcome appears the same number of times!',
      },
      body: [
        'In the two-coin puzzle, the fix was to drop down from three buckets ({0 heads, 1 head, 2 heads}) to four pairs ({HH, HT, TH, TT}). The four pairs are equally likely; the three buckets are not.',
        'When in doubt, drop down to the most specific list of outcomes you can. If you find yourself combining outcomes to count, those outcomes are probably not equally likely.',
      ],
    },

    // P(sum=7) on two dice — the canonical second trap. The 11 sums
    // are NOT equally likely, but the 36 ordered pairs ARE. This is
    // also a callback to the 6x6 grid from L1's tap-event practice,
    // so the geometry is familiar.
    {
      id: 'sum-of-seven',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'p-sum-seven',
          interactionKind: 'fill-fraction',
          prompt: 'You roll two fair dice. What is the probability that the sum is 7?',
          numerator: 6,
          denominator: 36,
          numeratorLabel: 'k = pairs summing to 7',
          denominatorLabel: 'N = pairs in the sample space',
          feedbackCorrect:
            'Yes. Six pairs sum to 7: (1,6), (2,5), (3,4), (4,3), (5,2), and (6,1). P(sum=7) = 6/36 = 1/6.',
          feedbackDefault:
            'k is the count of pairs (first die, second die) that add to 7. N is the count of all such pairs.',
          feedbackByWrongAnswer: {
            '1/11':
              'You counted 7 as one of the 11 sums (2 through 12). But not every sum is equally likely, so the 11 sums cannot be the sample space.',
            '6/11':
              'Six is the right count for k. But N here is the count of equally-likely outcomes — pairs of dice — not the count of distinct sums.',
            '1/36':
              'k counts every pair that sums to 7, not just one. How many of the 36 pairs add up to 7?',
            '11/36':
              'There are 11 possible sums, but the question asked for the chance of sum 7. How many pairs make that one sum?',
          },
          explanation:
            'The 36 equally-likely pairs are (d1, d2) for d1, d2 in 1..6. The pairs summing to 7 are (1,6), (2,5), (3,4), (4,3), (5,2), and (6,1). So P(sum=7) = 6/36 = 1/6.',
          afterNote: 'P(sum=7) = k/N = 6/36 = 1/6.',
          skills: ['equally-likely-outcomes', 'favorable-over-total'],
        },
      ],
    },

    // Recognition, split into four focused checks (D97). Rather than one
    // four-option "spot the safe one" MCQ, each canonical failure mode gets
    // its own question so the learner commits to a judgment on each:
    //   1. wheel    — uneven sectors are NOT equally likely (area, not count)
    //   2. thumbtack — a biased object is NOT equally likely (needs L2 method)
    //   3. deck     — a shuffled deck IS equally likely, at every grain
    //                 (52 cards, 4 suits, 13 ranks)
    //   4. dice-sum — the sample space of sums has 11 items, but they are
    //                 not equally likely (callback to the previous slide)
    {
      id: 'spotting-wheel',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'wheel-equal',
          interactionKind: 'multiple-choice',
          prompt:
            'A wheel has one big sector for red (270°) and one small sector for blue (90°). For the sample space {red, blue}, is every outcome equally likely?',
          options: [
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ],
          correctOptionId: 'no',
          feedbackCorrect:
            'Right. Red covers 270° and blue covers 90°, so red is three times as likely. Probability here goes by area, not by counting the two outcomes.',
          feedbackDefault: 'Compare the sizes of the two sectors. Are they the same?',
          feedbackByOption: {
            yes: 'The two sectors are different sizes (270° vs 90°), so red and blue are not equally likely. Probability here goes by area, not by count.',
          },
          explanation:
            'There are two outcomes, but they are not equally likely: red is 270/360 = 3/4 and blue is 90/360 = 1/4.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    {
      id: 'spotting-thumbtack',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'thumbtack-equal',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip an ordinary thumbtack that lands point-up or point-down. For the sample space {up, down}, is every outcome equally likely?',
          options: [
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ],
          correctOptionId: 'no',
          feedbackCorrect:
            'Right. A thumbtack is lopsided, so one way is more likely than the other. You cannot assume 1/2 each; you would have to flip it many times to estimate the chances (the Lesson 2 method).',
          feedbackDefault:
            'Two outcomes does not mean two equal chances. Does a thumbtack favor one side?',
          feedbackByOption: {
            yes: 'A thumbtack does not land each way with equal probability. Its shape favors one side, and you cannot tell which without flipping it many times (the Lesson 2 method).',
          },
          explanation:
            'A thumbtack is not symmetric, so {up, down} are not equally likely. Only repeated trials reveal the real split.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    {
      id: 'spotting-deck',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'deck-grains',
          interactionKind: 'multiple-choice',
          prompt:
            'You draw one card from a well-shuffled standard deck. Which of these are lists of equally likely outcomes?',
          options: [
            { id: 'cards', label: 'The 52 cards' },
            { id: 'suits', label: 'The 4 suits' },
            { id: 'ranks', label: 'The 13 ranks (A, 2, 3, ... K)' },
            { id: 'all', label: 'All of the above' },
          ],
          correctOptionId: 'all',
          feedbackCorrect:
            'Right. A shuffle makes the 52 cards equally likely. Each suit holds 13 cards, so the 4 suits are equally likely too. Each rank has 4 cards, so the 13 ranks are equally likely as well.',
          feedbackDefault:
            'A fair shuffle spreads the cards evenly. Check whether each suit holds the same number of cards, and whether each rank does too.',
          feedbackByOption: {
            cards:
              'The 52 cards are equally likely, but so are the suits and the ranks. Each suit has 13 cards and each rank has 4, so those lists are even too.',
            suits:
              'The 4 suits are equally likely (13 cards each), but that is not the only even list. The 52 cards and the 13 ranks are equally likely too.',
            ranks:
              'The 13 ranks are equally likely (4 cards each), but that is not the only even list. The 52 cards and the 4 suits are equally likely too.',
          },
          explanation:
            'A shuffle makes all 52 cards equally likely. Grouping them by suit (13 each) or by rank (4 each) keeps the groups equal, so every one of these lists is equally likely.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    {
      id: 'spotting-dice-sum',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'sum-sample-size',
          interactionKind: 'multiple-choice',
          prompt:
            'You roll two six-sided dice and read the sum. How many items are in this sample space of sums?',
          context: 'Count the distinct sums you could get, from the smallest to the largest.',
          options: [
            { id: 'one-die', label: '6' },
            { id: 'sums', label: '11' },
            { id: 'max', label: '12' },
            { id: 'pairs', label: '36' },
          ],
          correctOptionId: 'sums',
          feedbackCorrect:
            'Right. The sums run from 2 to 12, which is 11 values. Remember though: those 11 sums are not equally likely, so this is not the sample space to use for k/N.',
          feedbackDefault:
            'What is the smallest possible sum? The largest? Count every whole number in between.',
          feedbackByOption: {
            'one-die': '6 is the number of faces on one die. The question asks how many distinct sums two dice can make.',
            max: '12 is the largest sum, but the sums start at 2, not 1. Counting 2, 3, 4, ..., 12 gives 11 values.',
            pairs:
              '36 is the number of ordered pairs (first die, second die). That is the equally-likely sample space, but the question asks how many distinct sums there are.',
          },
          explanation:
            'The possible sums are 2 through 12, which is 11 values. They are not equally likely, but there are 11 of them.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    {
      id: 'spotting-dice-equal',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'equal-sample-size',
          interactionKind: 'fill-text',
          prompt:
            'Now suppose you are forced to build a sample space where every outcome IS equally likely. How many items would be in it?',
          context: 'Each die has 6 equally likely faces. Record the two dice separately.',
          placeholder: 'a number',
          maxLength: 6,
          acceptRegex: '36',
          feedbackCorrect:
            'Right. Recording each die separately gives 6 × 6 = 36 ordered pairs, and those 36 pairs are all equally likely.',
          feedbackDefault:
            'How many faces can the first die show? The second? Each pair (first, second) is one equally likely outcome.',
          feedbackByWrongAnswer: {
            '11': 'The 11 sums are not equally likely, so they cannot be the equal sample space. Track each die separately instead.',
            '6': '6 is one die only. You roll two dice, so pair each face of the first with each face of the second.',
            '12': '12 would be 6 + 6. The two dice combine by multiplying their options, not adding them.',
            empty: 'Type how many equally likely outcomes there are when you record both dice.',
          },
          explanation:
            'The equally likely sample space is the 36 ordered pairs (first die, second die), since 6 × 6 = 36.',
          skills: ['equally-likely-outcomes'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You found the fine print',
      body:
        'You can spot when every outcome is equally likely and when it is not (the two-coin or two-dice trap). When in doubt, drop down to the most specific sample space, where the outcomes really are interchangeable.\n\nIn the next lesson, we run into a different problem: when the sample space is too big to list.',
      mascotLine: 'When in doubt, draw it out.',
      segueToLessonId: 'multiplication-principle',
    },
  ],
};
