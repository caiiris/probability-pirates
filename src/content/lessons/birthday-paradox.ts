import type { Lesson } from '../types';

/**
 * "The birthday paradox" (Unit: Complement & counting). The signature
 * surprise lesson: in a room of just 23 people, a shared birthday is already
 * better than even. The win is the complement move plus the multiplication
 * principle, and the reframe from counting people to counting pairs.
 *
 * Audience: 8–15 year olds. Voice matches the house style: declarative,
 * grounded, no em dashes in user-facing copy, fractions in statements and
 * derivation steps written with curly braces e.g. {365/365}, {343/365}.
 *
 * Suggested arc (harvested from the reservoir lesson 04-counting-gets-hard,
 * re-voiced into the granular house style):
 *   1. claim            — concept: 23 people, better than even; most guess ~180
 *   2. gut-check        — commit-once MCQ: how many for fifty-fifty? 23 (trap 183)
 *   3. count-pairs      — concept: count pairs, not people. 23 → 253 pairs
 *   4. sim-23           — simulate-proportion, birthday, roomSize 23, P≈0.507
 *   5. derivation       — concept: complement + multiplication principle,
 *                         theorem (complement rule) + the {365/365}…{343/365} steps
 *   6. near-certain     — MCQ: ~99% needs about 57 people (trap 183)
 *   7. sim-30           — simulate-proportion, birthday, roomSize 30, P≈0.706
 *   8. wrap             — counting hit a wall, complement rescued it; mascotLine
 *
 * Math (verified):
 *   - 23 people → P(shared) ≈ 0.507; C(23,2) = 253 pairs
 *   - 30 people → P(shared) ≈ 0.706; C(30,2) = 435 pairs
 *   - 57 people → P(shared) ≈ 0.99
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const birthdayParadox: Lesson = {
  id: 'birthday-paradox',
  number: 15,
  title: 'The birthday paradox',
  blurb: 'How a room of just 23 people is already better than even for a shared birthday.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'claim',
      kind: 'concept',
      illustration: { kind: 'calendar' },
      title: 'A room of 23',
      prompt:
        'Here is the most famous surprise in probability. In a room of just 23 people, the chance that two of them share a birthday is already better than even.',
      body: [
        'A year has 365 days, so most people guess you would need a big crowd, maybe 180 or more, before a shared birthday gets likely.',
        'The real answer is much smaller. By the end of this lesson you will see exactly why 23 is enough, and how the complement rule does the heavy lifting.',
      ],
    },

    // Commit-once gut-check. The payoff is the reveal on the next slots, not
    // getting it right first try. The trap (183) is half of 365, the guess
    // almost everyone makes.
    {
      id: 'gut-check',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      commitOnce: true,
      variants: [
        {
          id: 'fifty-fifty',
          interactionKind: 'multiple-choice',
          prompt:
            'About how many people do you need in a room for a better-than-even chance that two of them share a birthday?',
          context: 'Just go with your gut. The next pages will test it.',
          options: [
            { id: '23', label: '23' },
            { id: '57', label: '57' },
            { id: '183', label: '183' },
            { id: '366', label: '366' },
          ],
          correctOptionId: '23',
          feedbackCorrect:
            'Right, and it really is that low. Just 23 people already tips past 50%. The next pages show why.',
          feedbackDefault:
            'The answer is far smaller than half the calendar. Hold your guess and watch the simulation.',
          feedbackByOption: {
            '57': 'Fifty-seven is close to certain, about 99%. You cross the 50% mark much earlier than that.',
            '183':
              'That is about half of 365, the guess almost everyone makes. The true answer is far smaller. Watch the simulation.',
            '366': 'That many would guarantee a match, but you pass 50% long before the calendar fills.',
          },
          explanation:
            'The surprising answer is 23. The trick is to count pairs of people, not people, and to count the complement: rooms where everyone has a different birthday.',
          misconceptionByOption: {
            '183': 'complement_inversion',
          },
          skills: ['birthday-paradox', 'complement-rule'],
        },
      ],
    },

    {
      id: 'count-pairs',
      kind: 'concept',
      illustration: { kind: 'calendar' },
      title: 'Count pairs, not people',
      prompt:
        'The reason 23 feels too small is that you are picturing people, when what matters is pairs.',
      body: [
        'A shared birthday happens between two people, so every pair of people is its own chance for a match. With 23 people there are far more pairs than you might expect.',
        'Choosing 2 of 23 gives C(23, 2) = (23 × 22) / 2 = 253 pairs. That is 253 separate chances for a match hiding in a room that looks small.',
      ],
    },

    {
      id: 'sim-23',
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
            'Just 23 people, and the share settles just above 50%. Those 253 pairs give plenty of chances for a match.',
          feedbackDefault: 'Run more rooms. The share settles after about a hundred.',
          feedbackByWrongValue: {
            incomplete: 'Keep filling rooms. The surprise shows up clearly after about a hundred.',
          },
          explanation:
            'The running share lands near 0.507. It is easier to count the complement: the chance of no shared birthday is {365/365} × {364/365} × … × {343/365} ≈ 0.493, which is under one half, so a match is more likely than not.',
          skills: ['birthday-paradox', 'complement-rule'],
        },
      ],
    },

    {
      id: 'derivation',
      kind: 'concept',
      illustration: { kind: 'calendar' },
      title: 'Why 23 is enough',
      prompt:
        'The simulation showed it. Now count it. The complement rule and the multiplication principle do all the work.',
      theorem: {
        name: 'Complement rule',
        statement:
          'For any event A, P(A) = 1 − P(not A). Counting "at least one shared birthday" directly is messy, so count its opposite (everyone different) and subtract from 1.',
      },
      body: [
        'Counting "at least one shared birthday" head on is hard: a match can happen between any pair, and the pairs overlap. The complement is clean. Count rooms where every birthday is different, then subtract from 1.',
        'For independent, evenly spread birthdays, each new person just has to dodge every birthday already in the room. Multiply those probabilities together using the multiplication principle.',
      ],
      derivation: {
        title: 'P(no shared birthday in 23 people)',
        steps: [
          'Person 1: any of 365 days is fine. P = {365/365}.',
          'Person 2 must dodge person 1: P = {364/365}.',
          'Person 3 must dodge both: P = {363/365}.',
          '… continue, each new person must dodge one more day.',
          'Person 23 must dodge 22 others: P = {343/365}.',
          'Multiply all 23 factors: P(no match) = {365/365} × {364/365} × … × {343/365} ≈ 0.493.',
          'Complement rule: P(at least one match) = 1 − 0.493 ≈ 0.507.',
        ],
      },
    },

    {
      id: 'near-certain',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'ninety-nine',
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
          feedbackCorrect: 'Right. By 57 people a shared birthday is nearly certain, about 99%.',
          feedbackDefault: 'It is well below half the calendar. The odds climb fast past 23.',
          feedbackByOption: {
            '23': 'Twenty-three is the 50% mark, not 99%. The probability keeps climbing steeply above it.',
            '183': 'Half the calendar is still far more than you need. Near-certainty comes much sooner.',
            '365': 'You reach near-certainty long before 365. By 57 it is already about 99%.',
          },
          explanation:
            'The match probability rises sharply: 23 people give about 50.7%, and by 57 people the complement (no match) has shrunk to about 1%, so a shared birthday is about 99% likely.',
          misconceptionByOption: {
            '183': 'complement_inversion',
          },
          skills: ['birthday-paradox', 'complement-rule'],
        },
      ],
    },

    {
      id: 'sim-30',
      kind: 'problem',
      interactionKind: 'simulate-proportion',
      variants: [
        {
          id: 'room-30',
          interactionKind: 'simulate-proportion',
          prompt:
            'Now fill rooms with 30 people instead of 23. Watch the share of rooms with a shared birthday climb.',
          scenario: 'birthday',
          roomSize: 30,
          targetProbability: 0.706,
          targetLabel: 'Theory: about 70.6%',
          minTrials: 100,
          feedbackCorrect:
            'Thirty people pushes it past 70%. Seven extra people added a lot of pairs: C(30, 2) = 435, up from 253.',
          feedbackDefault: 'Run more rooms. The share needs about a hundred to settle.',
          feedbackByWrongValue: {
            incomplete: 'Keep filling rooms. The share settles after about a hundred.',
          },
          explanation:
            'Thirty people form C(30, 2) = 435 pairs. The complement (no match) drops to about 0.294, so by the complement rule P(shared) = 1 − 0.294 ≈ 0.706.',
          skills: ['birthday-paradox', 'complement-rule'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'When counting hit a wall',
      body:
        'Counting "at least one shared birthday" straight on was a mess, because matches can happen between any of the pairs and those pairs overlap. The complement rescued it: count the rooms where everyone is different, multiply the dodging probabilities, then subtract from 1.\n\nThat is the whole trick behind the paradox. Count pairs, not people, and when the event is tangled, count its opposite instead.',
      mascotLine: 'Event too tangled? Count its opposite, then subtract from 1.',
    },
  ],
};
