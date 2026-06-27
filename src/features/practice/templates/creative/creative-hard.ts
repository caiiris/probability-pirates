import type { Template } from '../types';
import { frac, type Fraction } from '@/lib/probability/exact';

function optionTemplate<P>(input: {
  id: string;
  topic: Template<P>['topic'];
  skills: Template<P>['skills'];
  retrievalForm: Template<P>['retrievalForm'];
  difficulty: number;
  params: P;
  prompt: string;
  correctLabel: string;
  distractors: string[];
  explanation: { title: string; steps: string[] };
}): Template<P> {
  return {
    id: input.id,
    topic: input.topic,
    skills: input.skills,
    retrievalForm: input.retrievalForm,
    rate: () => input.difficulty,
    sample: () => input.params,
    solve: () => ({ kind: 'choice', optionId: 'correct' }),
    render: () => ({
      id: `${input.id}:seed`,
      interactionKind: 'multiple-choice',
      prompt: input.prompt,
      options: [
        { id: 'correct', label: input.correctLabel },
        ...input.distractors.map((label, index) => ({ id: `d${index + 1}`, label })),
      ],
      correctOptionId: 'correct',
      feedbackByOption: {
        correct: 'Correct.',
        d1: 'Not quite.',
        d2: 'Not quite.',
        d3: 'Not quite.',
      },
      feedbackCorrect: 'Correct.',
      feedbackDefault: 'Not quite. Identify the structure of the problem before calculating.',
      skills: input.skills,
    }),
    explain: () => input.explanation,
  };
}

function fractionTemplate<P>(input: {
  id: string;
  topic: Template<P>['topic'];
  skills: Template<P>['skills'];
  retrievalForm: Template<P>['retrievalForm'];
  difficulty: number;
  params: P;
  prompt: string;
  answer: Fraction;
  explanation: { title: string; steps: string[] };
}): Template<P> {
  return {
    id: input.id,
    topic: input.topic,
    skills: input.skills,
    retrievalForm: input.retrievalForm,
    rate: () => input.difficulty,
    sample: () => input.params,
    solve: () => ({ kind: 'fraction', value: input.answer }),
    render: () => ({
      id: `${input.id}:seed`,
      interactionKind: 'fill-fraction',
      prompt: input.prompt,
      numerator: Number(input.answer.num),
      denominator: Number(input.answer.den),
      feedbackCorrect: 'Correct.',
      feedbackDefault: 'Not quite. Identify the structure of the problem before calculating.',
      skills: input.skills,
    }),
    explain: () => input.explanation,
  };
}

const nonlinearExpectedRevenue = optionTemplate({
  id: 'creative-nonlinear-payoff-expected-value',
  topic: 'distributions',
  skills: ['binomial-pmf'],
  retrievalForm: 'application',
  difficulty: 1320,
  params: { kind: 'gem-packs' },
  prompt:
    'A shop sells gem packs. A 12-pack has a discount, so revenue is not just count times unit price. What is the expected revenue per customer?',
  correctLabel: '$2.01',
  distractors: ['$2.04', '$3.53', '$1.80'],
  explanation: {
    title: 'Expected payoff after converting outcomes',
    steps: [
      'Convert each possible purchase into revenue first.',
      'Compute 80(1/2) + 160(1/5) + 240(3/20) + 480(1/10) + 900(1/20).',
      'The expected revenue is 201 cents, or $2.01.',
    ],
  },
});

const couponCollector = fractionTemplate({
  id: 'creative-coupon-collector-small-set',
  topic: 'distributions',
  skills: ['binomial-pmf'],
  retrievalForm: 'application',
  difficulty: 1340,
  params: { stickerTypes: 4 },
  prompt:
    'There are 4 sticker types. Each pack has one random sticker. What is the expected number of packs needed to complete the set?',
  answer: frac(25, 3),
  explanation: {
    title: 'Wait times for new stickers',
    steps: [
      'The first new sticker takes 1 draw on average.',
      'The next new sticker has chance 3/4 each draw, so it takes 4/3 draws on average.',
      'Then the wait times are 2 and 4.',
      'Total expected draws: 1 + 4/3 + 2 + 4 = 25/3.',
    ],
  },
});

const ballotLead = fractionTemplate({
  id: 'creative-ballot-lead-probability',
  topic: 'counting',
  skills: ['combinations'],
  retrievalForm: 'application',
  difficulty: 1620,
  params: { a: 5, b: 3 },
  prompt:
    'A finishes with 5 votes and B with 3. If the votes are revealed in random order, what is the chance A is always ahead?',
  answer: frac(1, 4),
  explanation: {
    title: 'Ballot lead by enumeration',
    steps: [
      'There are 56 possible reveal orders.',
      'In 14 of them, A stays strictly ahead after every revealed vote.',
      'So the probability is 14/56 = 1/4.',
    ],
  },
});

const oddsEvens = fractionTemplate({
  id: 'creative-odds-evens-fairness',
  topic: 'counting',
  skills: ['sample-space-enumeration', 'multiplication-principle'],
  retrievalForm: 'application',
  difficulty: 1180,
  params: { evens: 3, odds: 4 },
  prompt:
    'A bag has 3 even tokens and 4 odd tokens. Two tokens are drawn. What is the probability their sum is even?',
  answer: frac(3, 7),
  explanation: {
    title: 'Same parity makes an even sum',
    steps: [
      'An even sum comes from two evens or two odds.',
      'Favorable pairs: C(3,2) + C(4,2) = 3 + 6 = 9.',
      'All pairs: C(7,2) = 21.',
      'The probability is 9/21 = 3/7.',
    ],
  },
});

const inverseSpinner = optionTemplate({
  id: 'creative-inverse-spinner-model',
  topic: 'long-run',
  skills: ['frequentist-view'],
  retrievalForm: 'application',
  difficulty: 1330,
  params: { counts: [24, 17, 9] },
  prompt:
    'A spinner produced counts 24, 17, and 9 over 50 spins. Which spinner most likely generated it?',
  correctLabel: 'Spinner A: 1/2, 1/3, 1/6',
  distractors: ['Spinner B: 1/3, 1/3, 1/3', 'Spinner C: 2/3, 1/6, 1/6', 'Not enough information'],
  explanation: {
    title: 'Compare the observed frequencies',
    steps: [
      'The observed shares are 24/50, 17/50, and 9/50.',
      'These are closest to 1/2, 1/3, and 1/6.',
      'That makes Spinner A the best match.',
    ],
  },
});

const lastOneStanding = optionTemplate({
  id: 'creative-last-one-standing-streak',
  topic: 'distributions',
  skills: ['independence', 'complement-rule', 'binomial-pmf'],
  retrievalForm: 'application',
  difficulty: 1370,
  params: { players: 30, streak: 5 },
  prompt:
    '30 players each try for 5 heads in a row. What is the probability at least one player succeeds?',
  correctLabel: 'About 0.61',
  distractors: ['About 0.16', 'About 0.31', 'About 0.94'],
  explanation: {
    title: 'Use the complement across players',
    steps: [
      'One player gets 5 heads in a row with probability 1/32.',
      'One player misses that streak with probability 31/32.',
      'All 30 players miss with probability (31/32)^30.',
      'At least one succeeds with probability 1 - (31/32)^30, about 0.61.',
    ],
  },
});

const nonTransitiveDice = optionTemplate({
  id: 'creative-non-transitive-dice',
  topic: 'counting',
  skills: ['sample-space-enumeration', 'favorable-over-total'],
  retrievalForm: 'application',
  difficulty: 1650,
  params: { dice: 'A-B-C' },
  prompt:
    'Three custom dice have this cycle: A beats B, B beats C, and C beats A. What is the pairwise win probability in each matchup?',
  correctLabel: '5/9',
  distractors: ['1/2', '2/3', '3/4'],
  explanation: {
    title: 'Enumerate the 36 pair outcomes',
    steps: [
      'Compare each pair of dice by listing the 36 possible rolls.',
      'A beats B in 20 of 36 outcomes.',
      'The same count holds for B over C and C over A.',
      '20/36 = 5/9.',
    ],
  },
});

export const CREATIVE_VERIFIED_TEMPLATES: Template[] = [
  nonlinearExpectedRevenue,
  couponCollector,
  ballotLead,
  oddsEvens,
  inverseSpinner,
  lastOneStanding,
  nonTransitiveDice,
];

