import type { Lesson } from '../types';

export const lesson4: Lesson = {
  id: 'counting-gets-hard',
  number: 4,
  title: 'Counting gets hard',
  blurb: 'Combinations and the birthday paradox, when listing every outcome stops working.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'explosion',
      kind: 'concept',
      prompt:
        'Two dice gave 36 outcomes, few enough to draw in a grid. Real questions explode. A five-card hand from 52 cards has more than 2.5 million possibilities. You cannot list those.',
      illustration: { kind: 'cards' },
    },
    {
      id: 'combinations',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'pairs-of-4',
          interactionKind: 'multiple-choice',
          prompt:
            'From four friends A, B, C, D, how many different pairs can you choose to sit together? Order does not matter.',
          context: 'A pair like A with B is the same as B with A.',
          options: [
            { id: '4', label: '4' },
            { id: '6', label: '6' },
            { id: '8', label: '8' },
            { id: '12', label: '12' },
          ],
          correctOptionId: '6',
          feedbackCorrect: 'Right. AB, AC, AD, BC, BD, CD. Six pairs.',
          feedbackDefault: 'Each pair is two of the four friends, and AB is the same as BA.',
          feedbackByOption: {
            '4': 'There are more than four. Each of the four can pair with three others.',
            '8': 'Each pair is counted once, not once per seat.',
            '12': 'That counts AB and BA as different. Order does not matter here, so halve it.',
          },
          explanation:
            'Choosing 2 of 4 when order does not matter is a combination: (4 × 3) / 2 = 6.',
        },
        {
          id: 'pairs-of-5',
          interactionKind: 'multiple-choice',
          prompt:
            'From five players A, B, C, D, E, how many different pairs can you choose? Order does not matter.',
          context: 'A pair like A with B is the same as B with A.',
          options: [
            { id: '5', label: '5' },
            { id: '10', label: '10' },
            { id: '20', label: '20' },
            { id: '25', label: '25' },
          ],
          correctOptionId: '10',
          feedbackCorrect: 'Yes. Ten pairs from five players.',
          feedbackDefault:
            'Each player pairs with four others, but each pair gets counted twice that way.',
          feedbackByOption: {
            '5': 'Each player pairs with four others, so there are more than five pairs.',
            '20': 'That counts each pair twice, as AB and BA. Halve it.',
            '25': 'That is five times five, which double counts and includes pairing a player with themselves.',
          },
          explanation: 'Choosing 2 of 5 when order does not matter: (5 × 4) / 2 = 10.',
        },
      ],
    },
    {
      id: 'combos-grow',
      kind: 'concept',
      prompt:
        'When order does not matter, that grouping is a combination. The number of combinations grows fast as the pool gets bigger. By the time you reach a full deck, listing is hopeless.',
      illustration: { kind: 'cards' },
    },
    {
      id: 'why-formula',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'five-card-hand',
          interactionKind: 'multiple-choice',
          prompt:
            'Why do we switch from listing outcomes to a counting formula for a five-card hand?',
          options: [
            { id: 'millions', label: 'There are millions of hands, far too many to list' },
            { id: 'order', label: 'Because the cards have no order' },
            { id: 'random', label: 'Because the deck is shuffled randomly' },
          ],
          correctOptionId: 'millions',
          feedbackCorrect: 'Right. With millions of hands, you need a formula, not a list.',
          feedbackDefault: 'The issue is how many outcomes there are.',
          feedbackByOption: {
            order:
              'Order changes whether you multiply or divide, but the real problem is the sheer count.',
            random:
              'Shuffling sets the probabilities, but the count of hands is what makes listing impossible.',
          },
          explanation:
            'Counting by listing collapses when the number of outcomes is enormous. Combinatorics gives the count without writing every case out.',
        },
        {
          id: 'lottery',
          interactionKind: 'multiple-choice',
          prompt: "Why can't you check a lottery's odds by writing out every possible ticket?",
          options: [
            { id: 'millions', label: 'There are millions of tickets, far too many to write out' },
            { id: 'order', label: 'Because the numbers can repeat' },
            { id: 'random', label: 'Because the draw is random' },
          ],
          correctOptionId: 'millions',
          feedbackCorrect:
            'Yes. The count is astronomical, so you compute it instead of listing it.',
          feedbackDefault: 'The problem is the number of tickets.',
          feedbackByOption: {
            order: 'Whether numbers repeat changes the formula, but the count is the real wall.',
            random:
              'Randomness sets the odds, but it is the count of tickets that defeats listing.',
          },
          explanation:
            'When outcomes number in the millions, enumeration is impossible. A combinatorial formula gives the count directly.',
        },
      ],
    },
    {
      id: 'birthday-setup',
      kind: 'concept',
      prompt:
        'Here is the famous one. In a room of just 23 people, the chance that two share a birthday is already better than even. Most people guess you would need closer to 180. Let us test it.',
      illustration: { kind: 'calendar' },
    },
    {
      id: 'birthday-sim',
      kind: 'problem',
      interactionKind: 'simulate-proportion',
      variants: [
        {
          id: 'room-23',
          interactionKind: 'simulate-proportion',
          prompt:
            'Fill a room with 23 random birthdays, over and over. Watch the share of rooms that contain a shared birthday.',
          scenario: 'birthday',
          roomSize: 23,
          targetProbability: 0.507,
          targetLabel: 'Theory: about 50.7%',
          minTrials: 100,
          feedbackCorrect:
            'Just 23 people, and the share settles above 50%. With 23 people there are 253 possible pairs, plenty of chances for a match.',
          feedbackDefault: 'Run more rooms. The share settles after about a hundred.',
          feedbackByWrongValue: {
            incomplete: 'Keep filling rooms. The surprise shows up after about a hundred.',
          },
          explanation:
            'It is easier to count the complement. The chance of no shared birthday is 365/365 × 364/365 × ... × 343/365, which is under one half, so a match is more likely than not.',
        },
        {
          id: 'room-30',
          interactionKind: 'simulate-proportion',
          prompt: 'Now use rooms of 30 people. Watch the share of rooms with a shared birthday.',
          scenario: 'birthday',
          roomSize: 30,
          targetProbability: 0.706,
          targetLabel: 'Theory: about 70.6%',
          minTrials: 100,
          feedbackCorrect:
            'Thirty people pushes it past 70%. Each extra person adds more pairs, so matches get likely fast.',
          feedbackDefault: 'Run more rooms. The share needs about a hundred to settle.',
          feedbackByWrongValue: {
            incomplete: 'Keep filling rooms. The share settles after about a hundred.',
          },
          explanation:
            'Thirty people form 435 pairs. The complement (no match) drops below 0.3, so the chance of a shared birthday is above 70%.',
        },
      ],
    },
    {
      id: 'birthday-derivation',
      kind: 'concept',
      illustration: { kind: 'calendar' },
      title: 'Why 23 is enough',
      prompt:
        'The simulation showed it. Now count it. The complement rule and the multiplication principle do all the work.',
      body: [
        'Counting "at least one shared birthday" directly is messy: matches can happen between any pair, and pairs overlap. The complement is clean: count rooms where every birthday is different, then subtract from 1.',
        'For independent, uniform birthdays, each new person must dodge every birthday already in the room. Multiply those independent probabilities (multiplication principle, Lesson 3).',
      ],
      derivation: {
        title: 'P(no shared birthday in 23 people)',
        steps: [
          'Person 1: any of 365 days. P = {365/365}.',
          'Person 2 dodges person 1: P = {364/365}.',
          'Person 3 dodges both: P = {363/365}.',
          '… continue, each new person must dodge one more day.',
          'Person 23 dodges 22 others: P = {343/365}.',
          'Multiply all 23 factors: P(no match) = {365/365} × {364/365} × … × {343/365} ≈ 0.493.',
          'Complement rule: P(at least one match) = 1 − 0.493 ≈ 0.507.',
        ],
      },
    },
    {
      id: 'how-many-people',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'fifty-fifty',
          interactionKind: 'multiple-choice',
          prompt:
            'About how many people do you need in a room for a better-than-even chance that two share a birthday?',
          context: 'You just measured it.',
          options: [
            { id: '23', label: '23' },
            { id: '57', label: '57' },
            { id: '183', label: '183' },
            { id: '366', label: '366' },
          ],
          correctOptionId: '23',
          feedbackCorrect:
            'Yes. Just 23. The pairs, not the people, drive it: 23 people make 253 pairs.',
          feedbackDefault: 'It is much smaller than half of 365.',
          feedbackByOption: {
            '57': 'Fifty-seven gives about 99%. You cross 50% earlier than that.',
            '183':
              'That is about half of 365, the common wrong guess. The real answer is far smaller.',
            '366': 'That many guarantees a match, but you cross 50% long before then.',
          },
          explanation:
            'Count pairs, not people. 23 people form 253 pairs, enough to push the match probability just past one half.',
        },
        {
          id: 'near-certain',
          interactionKind: 'multiple-choice',
          prompt: 'Roughly how many people give about a 99% chance of a shared birthday?',
          context: 'The match probability climbs steeply once you pass 23.',
          options: [
            { id: '23', label: '23' },
            { id: '57', label: '57' },
            { id: '183', label: '183' },
            { id: '365', label: '365' },
          ],
          correctOptionId: '57',
          feedbackCorrect: 'Right. By 57 people a shared birthday is nearly certain.',
          feedbackDefault: 'It is well below half the calendar.',
          feedbackByOption: {
            '23': 'Twenty-three is the 50% mark, not 99%.',
            '183': 'Half the calendar is still overkill for 99%.',
            '365': 'You reach near-certainty long before 365.',
          },
          explanation:
            'The match probability rises sharply. By 57 people it is about 99%, long before the calendar fills.',
        },
      ],
    },
    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Counting hit a wall',
      body: 'Small sample spaces you can draw. Large ones you cannot, so you count with formulas or estimate by simulation. The birthday problem cracked open once you counted pairs instead of people and counted the complement. Next, the most famous puzzle in probability, where one new fact flips the odds: Monty Hall.',
      segueToLessonId: 'conditional-probability',
    },
  ],
};
