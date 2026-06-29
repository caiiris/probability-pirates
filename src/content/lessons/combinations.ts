import type { Lesson } from '../types';

/**
 * "Combinations" (Unit 3, Counting Techniques). D102.
 *
 * Audience: 8–15 year olds. Voice matches L1–L9: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: count selections where order does NOT matter. This is
 * the direct sequel to permutations: the permutation count over-counts
 * each group once per ordering, so divide by k!. That gives
 * C(n, k) = n! ÷ (k! × (n − k)!).
 *
 *   1. welcome       — callback: permutations counted order; teams, hands,
 *                       and committees do not care about order
 *   2. the-puzzle    — commit-once MCQ: pick a 3-person committee from 5.
 *                       Trap 60 (the ordered count); correct 10.
 *   3. resolve       — concept: the 60 ordered picks count each committee
 *                       3! = 6 times, so divide 60 ÷ 6 = 10
 *   4. the-rule      — theorem (C(n,k) = n!/(k!(n−k)!)) + definition box
 *                       for the "n choose k" notation
 *   5. toppings      — fill-text: choose 2 of 4 toppings = 6
 *   6. p-vs-c        — concept: same 5 people, gold/silver (20, order) vs
 *                       2-person team (10, no order). Divide by 2!.
 *   7. handshakes    — MCQ: 6 people, one handshake per pair = C(6,2) = 15.
 *                       Trap 30 (ordered), 36 (repeats).
 *   8. recognition   — MCQ: which scenario is a combination (order does
 *                       not matter)?
 *   9. challenge-stars-bars — CHALLENGE MCQ: 6 identical lollipops to 3
 *                       children = C(8,2) = 28 (stars and bars).
 *  10. wrap          — close the counting-techniques toolkit; no segue
 *                       (next stub is unauthored)
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (same as L2, L4–L9).
 *   - The "n choose k" symbol is the new notation → blue definition; the
 *     formula is a derivable claim → violet theorem (theorem-first layout).
 *   - Built directly on permutations: combinations = permutations ÷ k!.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const combinations: Lesson = {
  id: 'combinations',
  number: 14,
  title: 'Combinations',
  blurb: 'Count selections where the order does not matter.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'When order stops mattering',
      body: [
        'Permutations counted arrangements, where gold then silver is different from silver then gold. But plenty of choices do not care about order at all.',
        'A three-person committee is the same committee no matter who you name first. A hand of cards is the same hand however it was dealt. This lesson counts selections like these, where only the group matters, not its order.',
      ],
    },

    // Commit-once trap. Right after permutations, the reflex is to multiply
    // down (5 × 4 × 3 = 60). That counts each committee many times; the
    // resolve slot turns the over-count into the discovery.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'committee-of-three',
          interactionKind: 'multiple-choice',
          prompt:
            'A teacher picks 3 students from a group of 5 to form a committee. The three roles are equal. How many different committees are possible?',
          options: [
            { id: 'ordered', label: '60' },
            { id: 'correct', label: '10' },
            { id: 'product', label: '15' },
            { id: 'added', label: '8' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Picking in order gives 5 × 4 × 3 = 60, but a committee does not care about order, so each one is counted several times. The next page shows how to undo that.',
          feedbackDefault:
            'Order does not matter for a committee. The same three students are one committee no matter who you name first.',
          feedbackByOption: {
            ordered:
              '60 is 5 × 4 × 3, the number of ordered picks. But the committee {Ana, Ben, Cleo} is the same as {Cleo, Ben, Ana}, so 60 counts each committee more than once.',
            product: '15 is 5 × 3, which does not match either the ordered count (5 × 4 × 3) or the committee count. Walk through the next page.',
            added: '8 is 5 + 3. Choosing a group is not an add-the-counts problem.',
          },
          explanation:
            'There are 5 × 4 × 3 = 60 ordered ways to pick 3 of 5, but each committee of 3 can be ordered 3! = 6 ways. So the number of committees is 60 ÷ 6 = 10.',
          skills: ['combinations'],
        },
      ],
    },

    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Undo the over-count',
      prompt:
        'The ordered count is too big by exactly the number of orderings each group has.',
      body: [
        'Picking 3 students from 5 in order gives 5 × 4 × 3 = 60. But the committee {Ana, Ben, Cleo} shows up many times in that list: ABC, ACB, BAC, BCA, CAB, CBA are all the same committee.',
        'That is 3! = 6 orderings for every single committee. To count committees instead of orderings, divide the 60 by 6: there are 60 ÷ 6 = 10 committees.',
      ],
    },

    // The rule. Theorem (formula, violet) leads; definition (the "n choose
    // k" notation, blue) follows, using the theorem-first dual-box layout.
    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'Take the arrangement count, then divide away the orderings.',
      theorem: {
        name: 'Combinations',
        statement:
          'To choose k items from n when order does not matter, divide the arrangement count by k!: C(n, k) = n! ÷ (k! × (n − k)!).',
      },
      definition: {
        name: 'n choose k',
        statement:
          'C(n, k) is read "n choose k." It counts the number of unordered groups of k items taken from n. For the committee, C(5, 3) = 60 ÷ 6 = 10.',
      },
      body: [
        'The k! on the bottom is the fix from the last page: it removes the orderings the arrangement count added. The (n − k)! handles the items you did not pick.',
        'Order matters? Use a permutation. Order does not matter? Take that permutation count and divide by k! to get the combination.',
      ],
    },

    {
      id: 'toppings',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'choose-two-toppings',
          interactionKind: 'fill-text',
          prompt:
            'A pizza has 4 toppings to choose from. You pick 2 of them for one pizza. How many different topping pairs are possible? Type the number.',
          context: 'Mushroom and onion is the same pizza as onion and mushroom, so order does not matter.',
          placeholder: 'a number',
          maxLength: 8,
          acceptRegex: '6',
          feedbackCorrect:
            'Right. Ordered, it is 4 × 3 = 12, but each pair is counted twice (2! = 2), so 12 ÷ 2 = 6 pairs.',
          feedbackDefault:
            'Count the ordered picks (4 × 3), then divide by 2! because each pair of toppings can be named two ways.',
          feedbackByWrongAnswer: {
            '12': '12 is the ordered count, 4 × 3. Each pair of toppings is the same pizza either way around, so divide by 2! = 2.',
            '8': '8 is 4 + 4 or 4 × 2, neither of which counts pairs. Use 4 × 3 ÷ 2.',
            '4': '4 is the number of toppings, not the number of pairs you can form from them.',
            '16': '16 is 4 × 4, which lets a topping be picked twice. You pick 2 different toppings, and order does not matter: 4 × 3 ÷ 2 = 6.',
            empty: 'Type how many different pairs of toppings you can choose.',
          },
          explanation:
            'C(4, 2) = (4 × 3) ÷ 2! = 12 ÷ 2 = 6 topping pairs.',
          skills: ['combinations'],
        },
      ],
    },

    {
      id: 'p-vs-c',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Same people, two questions',
      prompt: 'The only difference between a permutation and a combination is whether order counts.',
      body: [
        'Take 5 runners and pick 2 of them. "How many ways to award gold and silver?" is a permutation: gold then silver is different from silver then gold, so 5 × 4 = 20.',
        '"How many 2-person relay teams, where both run equally?" is a combination: the team {Ana, Ben} is the same as {Ben, Ana}. Each team was counted 2! = 2 times in the 20, so 20 ÷ 2 = 10 teams.',
        'Same 5 people, same 2 picks. The permutation is 20, the combination is 10, and the only difference is dividing by 2!.',
      ],
    },

    {
      id: 'handshakes',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'six-handshakes',
          interactionKind: 'multiple-choice',
          prompt:
            'Six people meet, and every pair shakes hands exactly once. How many handshakes happen?',
          context: 'A handshake between Ana and Ben is the same as one between Ben and Ana.',
          options: [
            { id: 'ordered', label: '30' },
            { id: 'correct', label: '15' },
            { id: 'repeats', label: '36' },
            { id: 'doubled', label: '12' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Each handshake is a pair, so C(6, 2) = (6 × 5) ÷ 2 = 15.',
          feedbackDefault:
            'A handshake is an unordered pair of people. Count ordered pairs (6 × 5), then divide by 2.',
          feedbackByOption: {
            ordered:
              '30 is 6 × 5, which counts Ana-shakes-Ben and Ben-shakes-Ana as two. A handshake is one pair, so divide by 2.',
            repeats: '36 is 6 × 6, which lets a person shake their own hand. Each handshake is two different people.',
            doubled: '12 is 6 × 2. The number of handshakes per person is not 2, and you would also be double-counting each shake.',
          },
          explanation:
            'Each handshake is an unordered pair of the 6 people: C(6, 2) = (6 × 5) ÷ 2! = 15.',
          skills: ['combinations'],
        },
      ],
    },

    {
      id: 'recognition',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'which-is-combination',
          interactionKind: 'multiple-choice',
          prompt:
            'In which of these does order NOT matter, making it a combination?',
          context: 'Order does not matter when rearranging the same chosen items gives the same result.',
          options: [
            {
              id: 'podium',
              label: 'Awarding 1st, 2nd, and 3rd place to 3 of 8 racers',
            },
            {
              id: 'team',
              label: 'Choosing 4 players from 10 for a (role-free) team',
            },
            {
              id: 'pin',
              label: 'Setting a 4-digit PIN on a lock',
            },
            {
              id: 'lineup',
              label: 'Deciding the batting order of 9 players',
            },
          ],
          correctOptionId: 'team',
          feedbackCorrect:
            'Right. A team is the same team no matter what order you list the four players, so order does not matter. That is a combination.',
          feedbackDefault:
            'Ask: if you shuffle the chosen items, is it the same result? If yes, it is a combination.',
          feedbackByOption: {
            podium:
              'First, second, and third are different places, so the order of the three racers matters. That is a permutation.',
            pin: 'A PIN of 1-2-3-4 is different from 4-3-2-1, so order matters. That is a permutation (with repeats allowed).',
            lineup:
              'A batting order is an order by definition, so rearranging the players changes it. That is a permutation.',
          },
          explanation:
            'Order does not matter only when shuffling the chosen items leaves the result unchanged. A role-free team is the same group either way, so it is a combination. Places, PINs, and batting orders all depend on order, so they are permutations.',
          skills: ['ordered-vs-unordered'],
        },
      ],
    },

    // Challenge: stars and bars. Distributing identical items into distinct
    // groups is a combination in disguise: 6 lollipops + 2 dividers laid in a
    // row, choose which 2 of the 8 spots are dividers, C(8,2) = 28. The
    // commit-once + challenge flag signals it is a stretch; the explanation
    // teaches the stars-and-bars picture.
    {
      id: 'challenge-stars-bars',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      challenge: true,
      variants: [
        {
          id: 'lollipops',
          interactionKind: 'multiple-choice',
          prompt:
            'You have 6 identical lollipops to hand out to 3 children. Any child can get any number, even zero. How many different ways can you hand them out?',
          context:
            'The lollipops are identical, so only how many each child gets matters, not which lollipop is which.',
          options: [
            { id: 'correct', label: '28' },
            { id: 'choose', label: '20' },
            { id: 'product', label: '18' },
            { id: 'distinct', label: '729' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Brilliant. Lay the 6 lollipops in a row and drop in 2 dividers to split them among the 3 children. Choosing where the 2 dividers go among 8 spots is C(8, 2) = 28.',
          feedbackDefault:
            'Picture the 6 lollipops as a row of stars, and use 2 dividers to break them into 3 groups. How many ways can you place the dividers?',
          feedbackByOption: {
            choose: '20 is C(6, 3), as if you were choosing 3 lollipops. Here you are splitting 6 identical lollipops into 3 groups, which uses dividers, not a plain choose.',
            product: '18 is 6 × 3. That does not count the ways to split the lollipops; the divider picture does.',
            distinct: '729 is 3^6, the count if the lollipops were all different (each one picks a child). They are identical, so many of those are the same handout.',
          },
          explanation:
            'Write the 6 lollipops as 6 stars and use 2 bars to cut them into 3 groups, one per child: for example, **|***|* means 2, 3, 1. Every handout is one arrangement of 6 stars and 2 bars, which is choosing 2 bar-positions out of 8: C(8, 2) = 28. This trick is called stars and bars.',
          skills: ['combinations'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Order, or no order',
      body:
        'You now have the whole counting toolkit. When order matters, count arrangements with a permutation. When it does not, take that count and divide by k! to get a combination: C(n, k) = n! ÷ (k! × (n − k)!).\n\nThese counts are what feed the probability formula. When every outcome is equally likely, P(event) = k/N, and combinations are often exactly how you find a k or an N too big to list by hand.',
      mascotLine: 'Order matters? Permutation. If not? Divide by k!.',
    },
  ],
};
