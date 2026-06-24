import type { Lesson } from '../types';

export const lesson3: Lesson = {
  id: 'counting-carefully',
  number: 3,
  title: 'Counting carefully',
  blurb:
    'Multiplication, permutations, combinations, and the complement trick. The four moves that count anything.',
  estimatedMinutes: 7,
  slots: [
    // --- Hook -----------------------------------------------------------

    {
      id: 'hook',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'When listing stops working',
      prompt:
        'In Lesson 1 you listed every outcome. A five-card poker hand has more than 2.5 million outcomes. You will not be listing those.',
      body: [
        'The fix is not to count faster, it is to count without listing. There are four moves that do that, and almost every counting problem you will meet uses one or two of them.',
        'You already saw the first one without a name: rolling two dice gave 6 x 6 = 36 ordered pairs. That trick has a name.',
      ],
    },

    // --- Multiplication principle --------------------------------------

    {
      id: 'multiplication-principle',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The multiplication principle',
      prompt:
        'If one choice has m options and a second independent choice has n options, the two together have m × n outcomes.',
      body: [
        'Each m-option pairs with every n-option, so the total fans out as a grid (or a tree, if you draw it that way).',
        'This extends to as many stages as you want. Three stages with a, b, c options each give a × b × c outcomes.',
      ],
      theorem: {
        name: 'Multiplication principle',
        statement:
          'Suppose a procedure has k stages, the i-th stage has m_i possible outcomes, and the count m_i does not depend on which outcomes occurred at earlier stages. Then the total number of outcomes for the whole procedure is m_1 × m_2 × … × m_k.',
      },
      example: {
        title: 'Outfits in a closet',
        steps: [
          'Shirts: 3 choices.',
          'Pants: 2 choices.',
          'Shoes: 2 choices.',
          'Total outfits: 3 × 2 × 2 = 12.',
        ],
      },
    },

    {
      id: 'multiply-problem',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'dinner-menu',
          interactionKind: 'multiple-choice',
          prompt:
            'A restaurant offers 4 entrees and 3 desserts. How many different two-course dinners can you order?',
          context: 'Each entree pairs with each dessert.',
          options: [
            { id: '7', label: '7' },
            { id: '12', label: '12' },
            { id: '24', label: '24' },
            { id: '34', label: '34' },
          ],
          correctOptionId: '12',
          feedbackCorrect: '4 entrees times 3 desserts is 12 different dinners.',
          feedbackDefault:
            'Each entree pairs with every dessert. That is multiplication, not addition.',
          feedbackByOption: {
            '7': 'That is 4 + 3. Adding gives the size of one menu, not the number of pairings.',
            '24': 'Closer to the order of magnitude, but the count is 4 x 3 = 12, not 4 x 6 or 8 x 3.',
            '34': 'That is 4 x 3 with the digits rearranged. Multiply: 4 x 3 = 12.',
          },
          explanation:
            'Two independent stages: 4 options then 3 options. By the multiplication principle, 4 x 3 = 12.',
        },
        {
          id: 'plate-prefix',
          interactionKind: 'multiple-choice',
          prompt:
            'A license plate prefix is one letter followed by three digits. How many different prefixes are possible?',
          context: '26 letters, 10 digits per position, repeats allowed.',
          options: [
            { id: '36', label: '36' },
            { id: '260', label: '260' },
            { id: '2600', label: '2600' },
            { id: '26000', label: '26,000' },
          ],
          correctOptionId: '26000',
          feedbackCorrect: '26 x 10 x 10 x 10 = 26,000.',
          feedbackDefault:
            'Four stages: a letter, then a digit, then a digit, then a digit. Multiply.',
          feedbackByOption: {
            '36': 'That is 26 + 10. Adding gives the number of symbols in one slot, not the number of plates.',
            '260':
              'That is 26 x 10, which would be one letter and one digit. There are three digits, not one.',
            '2600':
              'That is 26 x 10 x 10, which is one letter and two digits. There are three digits.',
          },
          explanation: 'Four independent slots: 26 x 10 x 10 x 10 = 26,000.',
        },
      ],
    },

    // --- Addition principle ---------------------------------------------

    {
      id: 'addition-principle',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The addition principle',
      prompt:
        'If the choices are mutually exclusive (either-or, not both), the total is the sum, not the product.',
      body: [
        'Multiplication is for stages: one choice, then another, then another. Addition is for alternatives: this group of options, or that group, but not both at once.',
        'The simplest test: is the second choice a new stage in the same outcome (multiply), or a different bucket of possible outcomes (add)?',
      ],
      theorem: {
        name: 'Addition principle',
        statement:
          'If you must perform exactly one of k tasks, the i-th task has m_i possible outcomes, and no outcome belongs to more than one task, then the total number of outcomes across all tasks is m_1 + m_2 + … + m_k.',
      },
      example: {
        title: 'Bus or train',
        steps: [
          'Take the bus: 3 routes available.',
          'Take the train: 2 routes available.',
          'You take exactly one of bus or train.',
          'Total ways to commute: 3 + 2 = 5.',
        ],
      },
    },

    {
      id: 'add-vs-multiply',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'ice-cream-or-pastry',
          interactionKind: 'multiple-choice',
          prompt:
            'A cafe sells 6 ice creams and 4 pastries. You will buy exactly one item. How many choices do you have?',
          context: 'You are not building a meal, you are picking one item.',
          options: [
            { id: '10', label: '10' },
            { id: '24', label: '24' },
            { id: '2', label: '2' },
            { id: '64', label: '64' },
          ],
          correctOptionId: '10',
          feedbackCorrect: '6 + 4 = 10. You pick one item from either group.',
          feedbackDefault: 'Two mutually exclusive groups, one item bought. That is addition.',
          feedbackByOption: {
            '24': '6 x 4 would count ice-cream-and-pastry pairs, but you are buying one item, not two.',
            '2': '2 is the number of groups (ice cream, pastry), not the number of choices.',
            '64': 'That is 6 + 4 with the digits jammed together. The answer is 6 + 4 = 10.',
          },
          explanation: 'Either-or with no overlap. Add the counts: 6 + 4 = 10.',
        },
        {
          id: 'two-course-or-one',
          interactionKind: 'multiple-choice',
          prompt:
            'A diner offers 5 sandwiches and a separate menu of 3 soup-and-salad combos. You will order exactly one option from one menu. How many choices?',
          context: 'You order one item: either a sandwich or a combo, not both.',
          options: [
            { id: '8', label: '8' },
            { id: '15', label: '15' },
            { id: '2', label: '2' },
            { id: '53', label: '53' },
          ],
          correctOptionId: '8',
          feedbackCorrect: '5 + 3 = 8. Two menus, one pick, so add.',
          feedbackDefault:
            'You are not building stages. You are choosing one item from one of two menus.',
          feedbackByOption: {
            '15': '5 x 3 would count sandwich-and-combo pairs, but you are ordering one thing.',
            '2': '2 is the number of menus, not the number of options.',
            '53': 'That is the two digits concatenated. The answer is 5 + 3 = 8.',
          },
          explanation: 'Mutually exclusive menus, one pick total. Add: 5 + 3 = 8.',
        },
      ],
    },

    // --- Permutations ---------------------------------------------------

    {
      id: 'permutations',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Permutations: order matters',
      prompt:
        'A permutation is an arrangement of distinct things in order. Three people in a row can be arranged in 3 × 2 × 1 = 6 ways.',
      body: [
        'Pick the first slot: 3 choices. The second slot has 2 left. The third slot has 1. By multiplication, 3 × 2 × 1.',
        'That product has a name: 3 factorial, written 3! With n distinct things, there are n! ways to put them in order. If you only fill k of the n slots, you stop the product after k terms.',
      ],
      theorem: {
        name: 'Permutations',
        statement:
          'There are n! = n × (n−1) × … × 2 × 1 ways to arrange n distinct objects in a row. The number of ways to fill k ordered slots from n distinct objects (no repeats) is nPk = n × (n−1) × … × (n−k+1) = {n!/(n−k)!}.',
      },
      example: {
        title: 'All 6 arrangements of A, B, C',
        steps: [
          'ABC, ACB, BAC, BCA, CAB, CBA.',
          'Six arrangements, and 3! = 3 × 2 × 1 = 6.',
          'For 4 people: 4! = 4 × 3 × 2 × 1 = 24.',
          'For 5 people: 5! = 120.',
        ],
      },
    },

    {
      id: 'permute-problem',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'race-order',
          interactionKind: 'multiple-choice',
          prompt: 'In how many different orders can 4 runners finish a race? (Assume no ties.)',
          context: 'Every finishing order is a different outcome.',
          options: [
            { id: '4', label: '4' },
            { id: '12', label: '12' },
            { id: '16', label: '16' },
            { id: '24', label: '24' },
          ],
          correctOptionId: '24',
          feedbackCorrect: '4! = 4 x 3 x 2 x 1 = 24 finishing orders.',
          feedbackDefault: 'You are arranging all 4 runners in order. That is 4!.',
          feedbackByOption: {
            '4': 'That is the number of runners, not the number of orders.',
            '12': 'That is 4 x 3, which counts only the first two places. There are four places.',
            '16': '4 x 4 would let a runner finish twice. Each runner can only take one spot.',
          },
          explanation: 'All 4 runners arranged in order: 4! = 24.',
        },
        {
          id: 'podium',
          interactionKind: 'multiple-choice',
          prompt:
            'From 5 runners, how many different gold-silver-bronze podiums are possible? (Top 3 only, in order.)',
          context: 'Order matters: gold then silver then bronze.',
          options: [
            { id: '10', label: '10' },
            { id: '15', label: '15' },
            { id: '60', label: '60' },
            { id: '125', label: '125' },
          ],
          correctOptionId: '60',
          feedbackCorrect: '5 x 4 x 3 = 60 podiums.',
          feedbackDefault: 'Three slots, in order, no repeats. Multiply: 5 x 4 x 3.',
          feedbackByOption: {
            '10': '10 would count unordered groups of 3 (combinations), but the podium positions are ordered.',
            '15': 'Close shape, wrong arithmetic. 5 x 4 x 3 = 60.',
            '125':
              '5 x 5 x 5 would let one runner take all three medals. Each runner can only finish once.',
          },
          explanation: 'Three slots filled in order from 5 distinct runners: 5 x 4 x 3 = 60.',
        },
      ],
    },

    // --- Combinations (the proof beat) ----------------------------------

    {
      id: 'combinations',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Combinations: order does not matter',
      prompt:
        'When order is irrelevant, divide a permutation by the ways its members can rearrange.',
      body: [
        'Pick 2 of 4 friends to sit together. There are 4 × 3 = 12 ordered pairs (A then B, B then A, A then C, …). But the pair {A, B} and the pair {B, A} are the same unordered pair, so each pair is counted twice. Divide by 2: there are 6 unordered pairs.',
        'In general, choosing k things from n when order does not matter is "n choose k", written nCk. It equals nPk divided by k! (the number of orderings of the k chosen).',
      ],
      theorem: {
        name: 'Combinations',
        statement:
          'The number of ways to choose k objects from n distinct objects when order does not matter is nCk = {n!/(k! (n−k)!)}. Equivalently, nCk = nPk / k!: the ordered count divided by the orderings of any chosen group.',
      },
      derivation: {
        title: 'Why we divide by k!',
        steps: [
          'Count first with order: nPk = {n!/(n−k)!} ordered selections.',
          'Each unordered group of k items appears in that list in every possible order: k! times.',
          'So unordered count = ordered count ÷ k! = {nPk / k!}.',
          'Substituting nPk: nCk = {n! / (k! (n−k)!)}.',
          'Sanity check (k = 2, n = 4): {4!/(2! 2!)} = {24/4} = 6. Matches the 4 × 3 ÷ 2 we got by hand.',
        ],
      },
    },

    {
      id: 'combine-problem',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'ice-cream-trio',
          interactionKind: 'multiple-choice',
          prompt:
            'A shop has 5 flavors. You pick 3 different flavors for a sundae. The flavors are mixed together, so order does not matter. How many different sundaes are possible?',
          context:
            'A sundae of vanilla, chocolate, strawberry is the same as strawberry, chocolate, vanilla.',
          options: [
            { id: '10', label: '10' },
            { id: '15', label: '15' },
            { id: '20', label: '20' },
            { id: '60', label: '60' },
          ],
          correctOptionId: '10',
          feedbackCorrect: '5C3 = 10. Ten different unordered trios.',
          feedbackDefault: 'Choose 3 from 5, order irrelevant. Use the combination formula.',
          feedbackByOption: {
            '15': 'Wrong arithmetic. 5C3 = (5 x 4 x 3) / (3 x 2 x 1) = 10.',
            '20': '20 would be the ordered count divided by 2!. You need to divide by 3! because three flavors can be arranged 6 ways.',
            '60': '60 is 5 x 4 x 3, the ordered count. Divide by 3! = 6 to get 10.',
          },
          explanation: '5C3 = 5! / (3! 2!) = 120 / (6 x 2) = 10.',
        },
        {
          id: 'handshakes',
          interactionKind: 'multiple-choice',
          prompt:
            "Six people at a party each shake every other person's hand once. How many handshakes happen in total?",
          context: 'A handshake between A and B is the same handshake as B and A.',
          options: [
            { id: '6', label: '6' },
            { id: '12', label: '12' },
            { id: '15', label: '15' },
            { id: '36', label: '36' },
          ],
          correctOptionId: '15',
          feedbackCorrect: '6C2 = 15. Fifteen handshakes.',
          feedbackDefault: 'Each handshake is an unordered pair of people. Choose 2 from 6.',
          feedbackByOption: {
            '6': 'That is the number of people, not the number of handshakes.',
            '12': '12 = 6 + 6, which is not the right structure. Try the combination formula.',
            '36': '6 x 6 lets a person shake their own hand and double-counts each handshake. Divide and subtract: 6C2 = (6 x 5) / 2 = 15.',
          },
          explanation: '6C2 = (6 x 5) / (2 x 1) = 15.',
        },
      ],
    },

    // --- Order vs no order ----------------------------------------------

    {
      id: 'order-or-not',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Order or not?',
      prompt:
        'The first decision in a counting problem is almost always: does the order of the chosen items matter?',
      body: [
        'A quick test: take any two items in the outcome and swap them. If the outcome is now different, order matters and you want a permutation. If it is the same, order does not matter and you want a combination.',
        'Get this wrong and the answer is off by a factor of k!, which is exactly the kind of mistake that compounds in larger problems.',
      ],
    },

    {
      id: 'which-is-it',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'lottery-ticket',
          interactionKind: 'multiple-choice',
          prompt:
            'You pick 3 different numbers from 1 to 49 for a lottery ticket. The ticket {7, 23, 41} wins the same prize as {41, 7, 23}. Does order matter?',
          options: [
            { id: 'ordered', label: 'Order matters (permutation)' },
            { id: 'unordered', label: 'Order does not matter (combination)' },
          ],
          correctOptionId: 'unordered',
          feedbackCorrect: 'Right. Same numbers, same ticket, same prize. Count with 49C3.',
          feedbackDefault: 'If swapping two numbers gives the same ticket, order does not matter.',
          feedbackByOption: {
            ordered:
              'The two arrangements pay the same prize, which means the lottery treats them as the same ticket. Order does not matter.',
          },
          explanation:
            'The prize is determined by the set of numbers, not the order. Combination: 49C3.',
        },
        {
          id: 'race-vs-team',
          interactionKind: 'multiple-choice',
          prompt:
            'A coach picks 5 of 12 players for a starting basketball team. Does order matter when counting possible starting fives?',
          context: 'The team plays together regardless of who was picked first.',
          options: [
            { id: 'ordered', label: 'Order matters (permutation)' },
            { id: 'unordered', label: 'Order does not matter (combination)' },
          ],
          correctOptionId: 'unordered',
          feedbackCorrect: 'Right. A starting five is a set of players. Count with 12C5.',
          feedbackDefault:
            'If swapping two picks gives the same team on the floor, order does not matter.',
          feedbackByOption: {
            ordered:
              'Players have positions, but the question asks how many starting fives are possible, not how many seating orders. The team is a set.',
          },
          explanation:
            'The team is determined by which 5 players, not the pick order. Combination: 12C5.',
        },
      ],
    },

    // --- Complement counting --------------------------------------------

    {
      id: 'complement',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Count what you do not want',
      prompt:
        'Sometimes the outcomes you want are a tangle, but the outcomes you do not want are a single clean case. Count the bad case, subtract from 1.',
      body: [
        'P(event happens) = 1 minus P(event does not happen). It looks small, but it is the trick that cracks the birthday paradox in the next lesson.',
        'Use it whenever "at least one" appears in a question. The complement of "at least one" is "none", which is usually much easier to count.',
      ],
      theorem: {
        name: 'Complement rule',
        statement:
          'For any event A, the event "A does not happen" is called the complement of A. Their probabilities sum to 1: P(A) + P(not A) = 1. So P(A) = 1 − P(not A). When the complement is easier to count, count it.',
      },
      example: {
        title: 'At least one head in 3 flips',
        steps: [
          'Easier complement: "no heads at all" means three tails in a row.',
          'P(three tails) = {1/2} × {1/2} × {1/2} = {1/8}.',
          'P(at least one head) = 1 − {1/8} = {7/8}.',
          'Listing the 7 winning cases out of 8 would have worked. The complement was faster.',
        ],
      },
    },

    {
      id: 'complement-problem',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'at-least-one-six',
          interactionKind: 'fill-fraction',
          prompt:
            'Roll two fair dice. What is P(at least one six)? Enter the fraction in lowest terms or as it falls out of the calculation.',
          numerator: 11,
          denominator: 36,
          feedbackCorrect: '1 - (5/6)^2 = 1 - 25/36 = 11/36.',
          feedbackDefault:
            'Complement: "no sixes at all". Each die avoids the six with probability 5/6.',
          feedbackByWrongAnswer: {
            '1/6':
              'That is P(six) on one die. Two dice with "at least one six" needs the complement of "no sixes on either".',
            '2/6':
              'Adding the two single-die probabilities double-counts the case where both dice show a six. Use the complement instead.',
            '25/36': 'That is P(no sixes), the complement. Subtract from 1: 1 - 25/36 = 11/36.',
            '1/36':
              'That is P(both sixes). "At least one" includes both-sixes plus exactly-one-six.',
          },
          explanation:
            'P(no six on either die) = (5/6)(5/6) = 25/36. P(at least one six) = 1 - 25/36 = 11/36.',
        },
        {
          id: 'no-clubs',
          interactionKind: 'fill-fraction',
          prompt: 'Flip a fair coin 4 times. What is P(at least one head)?',
          numerator: 15,
          denominator: 16,
          feedbackCorrect: '1 - (1/2)^4 = 1 - 1/16 = 15/16.',
          feedbackDefault: 'Complement: "no heads at all", i.e. four tails in a row.',
          feedbackByWrongAnswer: {
            '1/2':
              'That is P(heads) on one flip. Four flips with "at least one" needs the complement.',
            '1/16': 'That is P(four tails), the complement. Subtract from 1: 1 - 1/16 = 15/16.',
            '4/16':
              'Four single-flip probabilities cannot just be added, that overcounts overlaps. Use the complement.',
            '1/4':
              'That is P(heads) over 4 flips treated independently, which is not how probability works for "at least one".',
          },
          explanation: 'P(no heads) = (1/2)^4 = 1/16. P(at least one head) = 1 - 1/16 = 15/16.',
        },
      ],
    },

    // --- Wrap -----------------------------------------------------------

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Four moves that count anything',
      body: 'Multiplication for stages. Addition for either-or. Permutations when order matters, combinations when it does not. And complements when the bad case is the clean one. Next: the most counterintuitive counting result in probability. Twenty-three people, 253 pairs, and the birthday paradox.',
      segueToLessonId: 'counting-gets-hard',
    },
  ],
};
