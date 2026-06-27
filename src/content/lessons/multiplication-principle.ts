import type { Lesson } from '../types';

/**
 * Lesson 5 — "The multiplication principle" (Unit 2.4).
 *
 * Pedagogical arc (D96 refresh):
 *   1. welcome           — sample spaces get too big to list
 *   2. outfit-puzzle     — commit-once fill-text + combinationPicker
 *   3. the-rule          — theorem callout (named before the road visual)
 *   4. resolve-with-road — autonomous road-fork animation (classic metaphor)
 *   5. road-routes       — MCQ: trail × lookout (2 × 4 = 8)
 *   6. look-back         — concept: L1 two dice, L3 two coins reframed
 *   7. two-dice-size     — MCQ transfer: 42 × 42 = 1,764
 *   8. bicycle-lock      — fill-text scaling (10^4)
 *   9. diner-meal        — three-stage MCQ (4 × 3 × 2)
 *  10. wrap
 *
 * Learning-science grounding (D96):
 *   - Concreteness fading: picker → road animation → named rule → abstract lock
 *   - Manipulative before symbol: combination picker lets learner BUILD pairs
 *   - Retrieval / transfer: look-back + two-dice reconnect L1 without re-teaching
 *   - Dual coding: road fork + tree named in prose (two metaphors, one structure)
 *   - Worked example + completion: road-routes applies the rule immediately
 */
export const multiplicationPrinciple: Lesson = {
  id: 'multiplication-principle',
  number: 5,
  title: 'The multiplication principle',
  blurb: 'Count outcomes without listing them one by one.',
  estimatedMinutes: 8,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'When listing gets out of hand',
      body: [
        'In the first four lessons you listed sample spaces by hand, such as the faces of a die, or pairs of two flips. The lists were small enough to fit on the page.',
        'Some sample spaces are too big to list. For example, there are more ways to shuffle a deck of cards than there are atoms in the observable universe. What then?',
      ],
    },

    {
      id: 'outfit-puzzle',
      kind: 'problem',
      interactionKind: 'fill-text',
      commitOnce: true,
      variants: [
        {
          id: 'outfit-count',
          interactionKind: 'fill-text',
          prompt:
            'You have 3 shirts and 2 pairs of pants. An outfit is one shirt with one pair of pants. How many different outfits can you make?',
          context: 'Use the picker to help you list combinations.',
          combinationPicker: {
            stageALabel: 'Pick a shirt',
            stageAOptions: ['Shirt 1', 'Shirt 2', 'Shirt 3'],
            stageBLabel: 'Pick pants',
            stageBOptions: ['Pants A', 'Pants B'],
            addButtonLabel: 'Add this outfit',
          },
          placeholder: 'a number',
          maxLength: 8,
          acceptRegex: '6',
          feedbackCorrect:
            'Right. Each shirt pairs with each pair of pants, so 3 × 2 = 6 outfits.',
          feedbackDefault:
            'Count the combinations you listed in the picker, or draw them out: for each shirt, list every pair of pants.',
          feedbackByWrongAnswer: {
            '5': 'Adding gives the total number of items in your closet (3 + 2 = 5), not the number of outfits. The next slide shows why outfits multiply instead.',
            '3': 'You counted shirts. An outfit is a shirt and a pair of pants, so each shirt is part of more than one outfit.',
            '2': 'You counted pants. An outfit is a shirt and a pair of pants, so each pair of pants belongs to more than one outfit.',
            empty: 'Type how many different outfits you can make.',
          },
          explanation:
            'Each of the 3 shirts can pair with either of the 2 pants, giving 3 × 2 = 6 outfits: (Shirt 1, Pants A), (Shirt 1, Pants B), and so on.',
        },
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The multiplication principle',
      prompt: 'You multiplied without listing every outfit. Here is the general rule.',
      theorem: {
        name: 'Multiplication principle',
        statement:
          'If you make n choices in a row, where choice 1 has a₁ options, choice 2 has a₂ options, and choice i has aᵢ options, the total number of combined outcomes is a₁ × a₂ × ... × aₙ.',
      },
      body: [
        'One factor per stage: a₁ for the first choice, a₂ for the second, and so on up to aₙ. Draw it as a tree or as a forking road: every branch at one stage gets every branch at the next.',
        'The catch is that each stage should offer the same number of options no matter what you picked before. When that holds, the multiplication principle counts for you.',
      ],
    },

    {
      id: 'resolve-with-road',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'A visual proof of the multiplication principle',
      body: [
        'Watch the animation below. From the start, the road splits into 3 routes. Each of those routes splits again into 2 branches Therefore, there are 3 × 2 = 6 endpoints.',
        'A tree diagram draws the same picture top-down instead of left-to-right. Either way, every choice at stage one gets its own copy of every choice at stage two.',
      ],
      figure: {
        kind: 'road-fork',
        stageA: { label: 'shirt', count: 3 },
        stageB: { label: 'pants', count: 2 },
        showProduct: true,
        caption: 'The multiplication principle',
      },
    },

    {
      id: 'road-routes',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'trail-lookout',
          interactionKind: 'multiple-choice',
          prompt:
            'You are at a trailhead. There are 2 trails you can hike on. On both trails, there are 4 lookout stops you can hike to. How many trail-and-lookout combinations are there?',
          options: [
            { id: 'add', label: '6' },
            { id: 'multiply', label: '8' },
            { id: 'trails', label: '2' },
            { id: 'lookouts', label: '4' },
          ],
          correctOptionId: 'multiply',
          feedbackCorrect: 'Right. 2 trails × 4 lookouts on each = 8 combinations.',
          feedbackDefault:
            'Each trail has 4 lookouts. How many lookouts are there across both trails together?',
          feedbackByOption: {
            add: '6 is 2 + 4, adding the counts. Each trail has all 4 lookouts: try using the multiplication principle.',
            trails: 'You counted trails. Each trail has 4 lookouts on it, so multiply.',
            lookouts: 'You counted lookouts on one trail. There are 2 trails, each with 4 lookouts.',
          },
          explanation:
            'Trail 1 has lookouts A, B, C, D. Trail 2 also has A, B, C, D. That is 2 × 4 = 8 trail-and-lookout pairs.',
        },
      ],
    },

    {
      id: 'look-back',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Problems you already solved',
      prompt: 'The multiplication principle can make listing all the outcomes of a problem much easier.',
      body: [
        'Lesson 1: Remember building a 6×6 grid for rolling two die? That was 6 options for the first die times 6 for the second: 6 × 6 = 36.',
        'Lesson 3: Remember how there are 4 possible outcomes for flipping two coins? Previosly you listed them; now you can multiply 2 x 2 = 4instead.',
      ],
    },

    {
      id: 'two-dice-size',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'pair-count',
          interactionKind: 'multiple-choice',
          prompt:
            'You roll two fair 42-sided dice and record each die separately. How many outcomes are in the sample space?',
          options: [
            { id: 'one-die', label: '42' },
            { id: 'added', label: '84' },
            { id: 'unordered', label: '882' },
            { id: 'pairs', label: '1,764' },
          ],
          correctOptionId: 'pairs',
          feedbackCorrect:
            'Yes. 42 faces on the first die × 42 on the second = 1,764 ordered pairs. You would never list them all; multiplication counts for you.',
          feedbackDefault:
            'How many choices for the first die? How many for the second, no matter what the first showed?',
          feedbackByOption: {
            unordered:
              '882 is {42 × 42}/2, as if every ordered pair has a twin. But (1, 1) and (2, 2) only appear once each, so halving the whole list is not correct. Recording each die separately means order matters: 42 × 42 = 1,764.',
            added: '84 is 42 + 42. Each die multiplies the count, it does not add to it.',
            'one-die': '42 is one die only. There are two dice, each with 42 faces.',
          },
          explanation:
            'Two independent choices with 42 options each: 42 × 42 = 1,764 ordered pairs.',
        },
      ],
    },

    {
      id: 'bicycle-lock',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'lock-codes',
          interactionKind: 'fill-text',
          prompt:
            'A bicycle lock has 4 dials, each with 10 digits (0 through 9). How many different 4-digit codes can you set on the lock?',
          context: 'Type the count as a single number. Commas are fine.',
          placeholder: 'a number',
          maxLength: 16,
          acceptRegex: '10,?000',
          feedbackCorrect:
            'Right. Four dials, each with 10 digits, so 10 × 10 × 10 × 10 = 10,000 codes.',
          feedbackDefault: 'Each dial multiplies the total by 10. There are 4 dials.',
          feedbackByWrongAnswer: {
            '40': 'You added the options across dials. Each dial multiplies the total, not adds to it.',
            '1000': 'That is the count for a 3-digit code. There are 4 dials, so multiply by 10 once more.',
            '100': 'That is the count for a 2-digit code. The lock has 4 dials.',
            '10': 'That is one dial worth of choices. The lock has 4 dials.',
            '4': 'You counted the dials. Each dial has 10 settings, so the code count is much bigger.',
            empty: 'Type the number of possible 4-digit codes. Each dial has 10 options.',
          },
          explanation:
            'Four dials, each independent and each with 10 digits, gives 10 × 10 × 10 × 10 = 10^4 = 10,000 codes.',
        },
      ],
    },

    {
      id: 'diner-meal',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'meal-count',
          interactionKind: 'multiple-choice',
          prompt:
            'A diner lets you build a meal from 4 sandwiches, 3 sides, and 2 drinks. You pick one item from each menu. How many different meals could you order?',
          options: [
            { id: 'add', label: '9' },
            { id: 'sandwich-side', label: '12' },
            { id: 'all-three', label: '24' },
            { id: 'biggest-menu', label: '4' },
          ],
          correctOptionId: 'all-three',
          feedbackCorrect:
            'Right. 4 sandwiches × 3 sides × 2 drinks = 24 meals. Each new choice adds a factor.',
          feedbackDefault:
            'Each menu is one stage of choice. Multiply the option counts together, one factor per stage.',
          feedbackByOption: {
            add: 'Adding (4 + 3 + 2 = 9) gives the total number of items on the menu, not the number of meals you can build by picking one from each list.',
            'sandwich-side':
              '12 is 4 × 3, which is sandwich × side. You also have to choose a drink, so one more factor of 2.',
            'biggest-menu':
              'You picked the largest single menu. A meal is a combination of items from all three menus, not just one.',
          },
          explanation:
            'Three independent choices: 4 sandwiches, 3 sides, 2 drinks. By the multiplication principle, 4 × 3 × 2 = 24 different meals.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You can count without listing',
      body:
        'Multiplication is the first counting tool that scales. Forks in a road, branches on a tree, cells on a grid: the structure is the same. Multiply the options at each stage and you have the total.\n\nNext up: the addition principle pairs with this one. AND multiplies, OR adds. Together they handle most counting word problems at this level.',
      mascotLine: 'Multiply, do not list.',
      segueToLessonId: 'addition-principle',
    },
  ],
};
