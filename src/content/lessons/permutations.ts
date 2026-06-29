import type { Lesson } from '../types';

/**
 * "Permutations" (Unit 3, Counting Techniques). D101.
 *
 * Audience: 8–15 year olds. Voice matches L1–L8: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: count arrangements, where order matters. This is the
 * multiplication principle applied to a special, very common shape:
 * filling a row of spots from a pool that shrinks by one each time.
 * Arranging all n distinct items is n! (factorial, the new notation).
 * Arranging k of n is n × (n−1) × ... for k descending factors.
 *
 *   1. welcome      — frame: order is the whole point (a race finish)
 *   2. the-puzzle   — commit-once MCQ: 3 friends in a photo line = 6.
 *                      Trap 3 (counted people), 9 (3 × 3, repeats).
 *   3. resolve      — concept: multiplication principle. 3 spots, the pool
 *                      shrinks 3 → 2 → 1, so 3 × 2 × 1 = 6.
 *   4. factorial    — theorem (arrange n distinct items = n!) + definition
 *                      box introducing the n! notation. Uses the new
 *                      theorem-before-definition dual-callout layout.
 *   5. line-four    — multiply-steps: arrange 4 people one spot at a time
 *                      (4 → 3 → 2 → 1), product builds to 24.
 *   6. partial      — concept: arrange k of n the intuitive way. 8 runners,
 *                      3 medals, 8 × 7 × 6 = 336 (k descending factors).
 *   7. partial-formula — concept: the nPk = n!/(n−k)! formula, derived with
 *                      a flippable "winners and non-winners" derivation card
 *                      (arrange all n, divide out the (n−k)! leftovers).
 *   8. medals       — MCQ: 10 runners, gold/silver/bronze = 720. Trap 1,000
 *                      (10^3, repeats allowed), 13, 30.
 *   9. order-matters — MCQ: recognition. Which scenario is a permutation
 *                      (order matters)? Tees up combinations without
 *                      naming them.
 *  10–13. circle challenge (4-page walkthrough, pirate-themed, challenge
 *                      banner on every page):
 *        - circle-intro   : is a round table different from a line? (yes/no)
 *        - circle-explore : circle-builder figure, discover (n−1)! by hand
 *        - circle-why     : derive (n−1)! (rotations collapse; pin one pirate)
 *        - circle-answer  : fill-text, 5 pirates = (5−1)! = 24
 *  14. wrap         — close; preview combinations (order does NOT matter);
 *                      no segue (combinations is an authored lesson, but the
 *                      established rule keeps the segue off until linked).
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (same as L2, L4–L8).
 *   - Factorial is a new word → blue definition callout; the arrangement
 *     count is a derivable claim → violet theorem callout. Two slots use
 *     both boxes (theorem first, definition second).
 *   - Builds explicitly on the multiplication principle so the formula is
 *     felt, not memorized.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const permutations: Lesson = {
  id: 'permutations',
  number: 13,
  title: 'Permutations',
  blurb: 'Count arrangements, where the order is the whole point.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'When order is the point',
      body: [
        'Three runners cross the finish line. Gold, silver, and bronze depend not just on who finished, but in what order. Ana then Ben then Cleo is a different result from Cleo then Ben then Ana.',
        'An arrangement is an ordering of items. This lesson counts how many arrangements are possible, which is the multiplication principle applied to one very common shape.',
      ],
    },

    // Commit-once trap. Order-matters counting is new, so this is a
    // prediction. 3 (counted the friends) and 9 (3 × 3, as if a spot could
    // repeat a person) are the canonical misses.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'three-in-a-row',
          interactionKind: 'multiple-choice',
          prompt:
            'Ana, Ben, and Cleo line up for a photo. How many different orders can the three of them stand in?',
          options: [
            { id: 'count', label: '3' },
            { id: 'correct', label: '6' },
            { id: 'square', label: '9' },
            { id: 'two', label: '5' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. There are 6 orders: ABC, ACB, BAC, BCA, CAB, CBA. The next page shows how to count them without listing.',
          feedbackDefault:
            'Try listing a few orders. The left spot can be any of the three, but once it is filled, fewer people are left for the next spot.',
          feedbackByOption: {
            count: '3 is the number of people, not the number of orders. Each person can stand in several different positions.',
            square: '9 is 3 × 3, which would let the same person fill more than one spot. Once Ana takes the first spot, she cannot also take the second.',
            two: '5 is close to nothing here. Walk through the spots: 3 choices, then 2, then 1.',
          },
          explanation:
            'Three people fill three spots. The first spot has 3 choices, the second has 2 left, the third has 1. That is 3 × 2 × 1 = 6 orders.',
          skills: ['permutations'],
        },
      ],
    },

    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'The pool shrinks by one',
      prompt:
        'Filling a row of spots is just the multiplication principle, with one twist: each spot you fill removes a choice from the next.',
      body: [
        'Picture three empty spots in the photo line. The first spot can go to any of the 3 friends. Once that person is placed, only 2 are left for the second spot. After that, just 1 remains for the last spot.',
        'By the multiplication principle, multiply the choices at each spot: 3 × 2 × 1 = 6. The shrinking pool is what makes arrangements multiply down to 1. Try building the orders yourself below, and watch them add up to 6.',
      ],
      figure: {
        kind: 'order-builder',
        caption: 'Line up Ana, Ben, and Cleo. There are 3 × 2 × 1 = 6 different orders in all.',
      },
    },

    // Factorial: new word (definition, blue) + arrangement claim (theorem,
    // violet). Theorem renders first now, so the rule leads and the notation
    // box supports it.
    {
      id: 'factorial',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Factorials',
      prompt: 'Arranging all of a group has its own name and its own symbol.',
      theorem: {
        name: 'Arranging n items',
        statement:
          'n distinct items can be arranged in n × (n−1) × ... × 2 × 1 different orders.',
      },
      definition: {
        name: 'Factorial',
        statement:
          'That product has a name: n factorial, written n!. So n! = n × (n−1) × ... × 2 × 1. For example, 4! = 4 × 3 × 2 × 1 = 24.',
      },
      body: [
        'The exclamation point is the factorial symbol, not excitement. 3! = 6 is the photo-line answer. 5! = 120. Factorials grow fast: 10! is already over three million.',
      ],
    },

    {
      id: 'line-four',
      kind: 'problem',
      interactionKind: 'multiply-steps',
      variants: [
        {
          id: 'arrange-four',
          interactionKind: 'multiply-steps',
          prompt:
            'Four people stand in a line. Work out how many different orders are possible, one spot at a time.',
          resultNoun: 'orders',
          steps: [
            {
              prompt: 'How many people could stand in the first spot?',
              answer: 4,
              hint: 'No one is placed yet, so all four people could take the first spot.',
            },
            {
              prompt: 'One person is now placed. How many are left for the second spot?',
              answer: 3,
              hint: 'One of the four is already in the first spot, so count who is left.',
            },
            {
              prompt: 'How many remain for the third spot?',
              answer: 2,
              hint: 'Two people are placed, so two remain.',
            },
            {
              prompt: 'And the last spot?',
              answer: 1,
              hint: 'Only one person is left, so there is just one choice.',
            },
          ],
          feedbackCorrect: 'Right. 4 × 3 × 2 × 1 = 4! = 24 orders.',
          feedbackDefault: 'Multiply the choices at each spot: 4 × 3 × 2 × 1.',
          explanation:
            'Four people fill four spots: 4 × 3 × 2 × 1 = 4! = 24 different orders.',
          skills: ['permutations', 'multiplication-principle'],
        },
      ],
    },

    // Partial permutations, part 1: the intuitive method. Just keep
    // multiplying descending factors, one per spot, and stop when the spots
    // run out. No formula yet — that is the next slot's job.
    {
      id: 'partial',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Arranging only some',
      prompt:
        'Sometimes there are more items than spots. You still multiply down, but you stop once the spots are full.',
      theorem: {
        name: 'Arranging k of n',
        statement:
          'To fill k ordered spots from n distinct items, multiply k descending factors starting at n: n × (n−1) × ... down for k terms.',
      },
      body: [
        'Eight runners race, but only three medals are given: gold, silver, bronze. The gold spot has 8 choices, the silver spot has 7 left, the bronze spot has 6. Stop there, because the other 5 runners win nothing.',
        'So the number of medal orders is 8 × 7 × 6 = 336. One factor per spot, and you stop when the spots run out. The next page shows a formula for this, and exactly why it works.',
      ],
    },

    // Partial permutations, part 2: the formula and WHY. The compact form
    // nPk = n!/(n−k)! is opaque on its own, so this slot derives it with the
    // "winners and non-winners" split: arrange all n (n!), then divide out
    // the (n−k)! orderings of the leftovers that do not change the result.
    // The reasoning lives in a flippable derivation card.
    {
      id: 'partial-formula',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'A formula, and why it works',
      prompt:
        'Here is the same count written as a formula, with the reason it holds.',
      theorem: {
        name: 'Permutations of k from n',
        statement:
          'nPk = n! ÷ (n − k)!. It counts the ways to fill k ordered spots from n distinct items.',
      },
      derivation: {
        question: 'Why does 8 × 7 × 6 equal 8! ÷ 5!?',
        title: 'Split into winners and non-winners',
        steps: [
          'Line up all 8 runners in order. There are 8! ways to do that.',
          'Call the first 3 the winners (gold, silver, bronze) and the last 5 the non-winners.',
          'Shuffling the 5 non-winners among themselves does not change who got which medal. That is 5! = 120 line-ups for every single medal result.',
          'So 8! counts each medal result 120 times. Divide that out: 8! ÷ 5! = 336.',
          'In general, the n − k leftovers can be arranged (n − k)! ways, so nPk = n! ÷ (n − k)!.',
        ],
      },
      body: [
        'The formula and the "multiply k factors" method always agree. The (n − k)! on the bottom cancels every factor below the top k, leaving exactly n × (n − 1) × ... for k terms. For the medals, 8! ÷ 5! cancels down to 8 × 7 × 6.',
      ],
    },

    {
      id: 'medals',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'eight-runners',
          interactionKind: 'multiple-choice',
          prompt:
            'Ten runners race for gold, silver, and bronze. How many different ways can the three medals be awarded?',
          context: 'Each runner can win at most one medal, and the order of the medals matters.',
          options: [
            { id: 'correct', label: '720' },
            { id: 'repeats', label: '1,000' },
            { id: 'added', label: '13' },
            { id: 'product-small', label: '30' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. 10 × 9 × 8 = 720. Ten choices for gold, nine left for silver, eight for bronze.',
          feedbackDefault:
            'Fill the medals in order. Gold has 10 choices, then silver has one fewer, then bronze one fewer again.',
          feedbackByOption: {
            repeats: '1,000 is 10 × 10 × 10, which lets one runner win more than one medal. After gold is awarded, only 9 runners are left for silver.',
            added: '13 is 10 + 3. The three medal spots multiply, they do not add.',
            'product-small': '30 is 10 × 3. The 3 is the number of medals, but each medal spot has its own shrinking pool: 10 × 9 × 8.',
          },
          explanation:
            'Three ordered medal spots from 10 runners: 10 × 9 × 8 = 720.',
          skills: ['permutations'],
        },
      ],
    },

    {
      id: 'order-matters',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'which-is-permutation',
          interactionKind: 'multiple-choice',
          prompt:
            'In which of these does the order matter, making it a permutation?',
          context:
            'Look past whether things happen in a sequence. Order matters only if rearranging the chosen items gives a genuinely different result.',
          options: [
            {
              id: 'roles',
              label: 'Assigning the roles of captain, vice-captain, and treasurer to 3 of 20 club members',
            },
            {
              id: 'lottery',
              label: 'Picking the 6 winning lottery numbers, which are then drawn one at a time',
            },
            {
              id: 'playlist-shuffle',
              label: 'Choosing 8 songs to load onto a playlist that always plays on shuffle',
            },
            {
              id: 'committee',
              label: 'Forming a 5-person committee from a class of 30, with no titles',
            },
          ],
          correctOptionId: 'roles',
          feedbackCorrect:
            'Right. Captain, vice-captain, and treasurer are different jobs, so who lands in which role changes the outcome. Swapping two people gives a new result, which makes it a permutation.',
          feedbackDefault:
            'A sequence in the story does not always mean order matters. Ask: if you shuffle the chosen items, do you get a genuinely different result?',
          feedbackByOption: {
            lottery:
              'Tempting, because the balls are drawn one at a time. But you win on the set of 6 numbers, not the draw order. Reorder the draw and it is the same ticket, so order does not matter.',
            'playlist-shuffle':
              'The songs will play in a random order, but the playlist itself is the same set of 8 songs no matter how you added them. You are choosing a set, so order does not matter.',
            committee:
              'With no titles, a committee is the same group however you list its members, so order does not matter. (Add distinct roles and it would become a permutation.)',
          },
          explanation:
            'Order matters only when rearranging the chosen items changes the outcome. Distinct roles (captain vs treasurer) do that, so the role assignment is a permutation. A lottery ticket, a shuffled playlist, and a title-free committee are each the same no matter the order, so they are combinations even though some of them happen in a sequence.',
          skills: ['ordered-vs-unordered'],
        },
      ],
    },

    // Challenge: circular arrangements, walked through across four pages
    // (D109). A round table has no fixed first seat, so rotations collapse and
    // the count is (n − 1)!, not n!. The challenge banner runs across all
    // four pages (concept pages carry the `challenge` flag too).
    //   1. circle-intro    — pirate framing; is this different from a line?
    //   2. circle-explore  — circle-builder figure; find the pattern by hand
    //   3. circle-why      — derive (n − 1)! (rotations collapse / fix one)
    //   4. circle-answer   — fill-text: 5 pirates = (5 − 1)! = 24
    {
      id: 'circle-intro',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      challenge: true,
      variants: [
        {
          id: 'circle-vs-line',
          interactionKind: 'multiple-choice',
          prompt:
            'You and four of your pirate crew drop anchor and gather around a round table to divvy up the loot. You start wondering how many different ways the five of you could be seated. Is counting seats around a round table a different kind of question than lining up on the deck?',
          context: 'Picture spinning the whole table versus shuffling a line on the deck.',
          options: [
            { id: 'correct', label: 'Yes, a round table is different from a line' },
            { id: 'same', label: 'No, it is exactly the same as a line' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Aye. A line has a first and last spot, but a round table has no head. Spin the table and the same crew can look like a brand new line-up. The next pages dig into what that does to the count.',
          feedbackDefault:
            'Think about the ends. A line has a front and a back; a circle does not. Does that change which seatings count as the same?',
          feedbackByOption: {
            same: 'Not quite. On a circle there are no ends, so spinning everyone around gives a seating that looks the same. That is the twist a line does not have.',
          },
          explanation:
            'A round table has no first or last seat, so rotating the whole crew gives the same seating. That makes it a different counting question than a line, which is what the next pages explore.',
          skills: ['permutations'],
        },
      ],
    },

    {
      id: 'circle-explore',
      kind: 'concept',
      illustration: { kind: 'coin' },
      challenge: true,
      title: 'Start small and look for a pattern',
      prompt: 'Seat the pirates around the table yourself. Two seatings that are just spins of each other count as the same.',
      body: [
        'One pirate alone has just one seating. Two pirates also have just one, since swapping them is only a spin of the table.',
        'Now try three pirates, then four, using the table below. Each time you log a seating that is really a new circle, the count ticks up. Do you see a pattern in those totals?',
      ],
      figure: {
        kind: 'circle-builder',
        caption: '1 pirate: 1 way. 2 pirates: 1 way. 3 pirates: 2 ways. 4 pirates: 6 ways.',
      },
    },

    {
      id: 'circle-why',
      kind: 'concept',
      illustration: { kind: 'die' },
      challenge: true,
      title: 'Why it is (n − 1)!',
      prompt: 'A line and a circle count differently because of the ends.',
      theorem: {
        name: 'Seating around a circle',
        statement: 'n people can be seated around a circle in (n − 1)! ways.',
      },
      body: [
        'In a line, all n! orders are different, because the front and back of the line are real, fixed spots.',
        'Around a circle there are no ends. Every seating can be spun into n different line-ups (one for each rotation) that are all the same circle. So the n! line orders collapse into n! ÷ n = (n − 1)! circle seatings.',
      ],
      derivation: {
        question: 'Why does dividing n! by n give (n − 1)!?',
        title: 'Pin one pirate down',
        steps: [
          'Pick any one pirate and fix them in a seat. This stops the table from spinning, because there is now a reference point.',
          'Everyone else is seated relative to that fixed pirate.',
          'The remaining n − 1 pirates fill the other seats in (n − 1)! ways.',
          'So there are (n − 1)! circle seatings, which is exactly n! ÷ n.',
        ],
      },
    },

    {
      id: 'circle-answer',
      kind: 'problem',
      interactionKind: 'fill-text',
      challenge: true,
      variants: [
        {
          id: 'five-around-table',
          interactionKind: 'fill-text',
          prompt:
            'Back to the question: how many different ways can you and your four pirate friends sit around the round table? Type the number.',
          context: 'Five pirates around a circle. Use (n − 1)!.',
          placeholder: 'a number',
          maxLength: 8,
          acceptRegex: '24',
          feedbackCorrect: 'Aye, 24. Five pirates around a circle: (5 − 1)! = 4! = 24 seatings.',
          feedbackDefault: 'Five pirates around a circle is (5 − 1)!. What is 4!?',
          feedbackByWrongAnswer: {
            '120': '120 is 5!, the count for a line on the deck. Around a circle you divide by the 5 rotations: 120 ÷ 5 = 24.',
            '25': '25 is 5 × 5. Seats cannot repeat a pirate. Use (5 − 1)! = 4!.',
            '20': '20 is 5 × 4. Close, but the full count of the remaining four is 4! = 4 × 3 × 2 × 1 = 24.',
            '4': '4 is n − 1, but you still arrange those four: 4! = 24.',
            empty: 'Type how many ways five pirates can sit around the round table.',
          },
          explanation:
            'Five pirates around a circle: fix one, then arrange the other four in 4! = 24 ways. So (5 − 1)! = 24.',
          skills: ['permutations'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You can count arrangements',
      body:
        'A permutation is an arrangement, where order matters. Fill the spots one at a time and multiply: all n items give n!, and k of n gives k descending factors from n.\n\nThere is a twist coming. Often the order does NOT matter, like the members of a team or the cards in a hand. Counting those the permutation way over-counts every group many times. The next lesson, combinations, fixes that.',
      mascotLine: 'Order matters? Multiply it down.',
    },
  ],
};
