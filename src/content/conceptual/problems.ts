/**
 * Seed conceptual problem bank — 4 hand-authored problems.
 *
 * Each problem has a code-verifiable Part-1 answer (ExactAnswer) and a
 * rubric for Part-2 "why" judgment.  All misconception keys are drawn
 * exclusively from the closed set in src/content/misconceptions.ts.
 *
 * If you need a misconception key that does not exist in that file, STOP
 * and add a flag comment here — do NOT invent a key.
 */

import { frac } from '../../lib/probability/exact';
import type { ConceptualProblem } from './types';

export const conceptualProblems: ConceptualProblem[] = [
  // -------------------------------------------------------------------------
  // CP-001 — Gambler's fallacy
  // -------------------------------------------------------------------------
  {
    id: 'cp-001-gamblers-fallacy',
    topic: 'long-run',
    skills: ['long-run-vs-single-trial', 'independence'],
    prompt:
      'A fair coin is flipped 10 times and lands heads every time. ' +
      'What is the probability that the 11th flip lands tails? ' +
      'Express your answer as a fraction.',
    answer: { kind: 'fraction', value: frac(1, 2) },
    rubricKeyPoints: [
      'Each flip is an independent event — the coin has no memory of past results.',
      'The probability of tails on any single flip of a fair coin is always 1/2, regardless of prior outcomes.',
      'The streak of 10 heads does not make tails "overdue"; it does not change the sample space for the next flip.',
    ],
    misconceptions: ['gambler'],
    canonicalWhy:
      'A fair coin has no memory. Each flip is an independent event: the outcome of previous flips cannot influence the next one. ' +
      'The probability of tails on flip 11 is exactly 1/2 — the same as it was on flip 1. ' +
      'Feeling that tails is "overdue" after a streak is the gambler\'s fallacy: the law of large numbers describes averages over many trials, not a short-run correction.',
  },

  // -------------------------------------------------------------------------
  // CP-002 — Base-rate neglect (medical test / Bayes)
  //
  // Setup: disease prevalence 1%, test sensitivity 90%, false-positive rate 10%.
  // P(disease | positive) = (0.01 × 0.90) / (0.01 × 0.90 + 0.99 × 0.10)
  //                       = 0.009 / (0.009 + 0.099)
  //                       = 0.009 / 0.108
  //                       = 9 / 108
  //                       = 1 / 12   ✓ (exact, fully reduced)
  // -------------------------------------------------------------------------
  {
    id: 'cp-002-base-rate-neglect',
    topic: 'conditional',
    skills: ['base-rate', 'conditional-probability'],
    prompt:
      'A disease affects 1% of the population. A diagnostic test has a ' +
      '90% true-positive rate (sensitivity) and a 10% false-positive rate. ' +
      'A randomly chosen person tests positive. ' +
      'What is the probability they actually have the disease? ' +
      'Express your answer as a fraction.',
    answer: { kind: 'fraction', value: frac(1, 12) },
    rubricKeyPoints: [
      'The base rate (1% prevalence) must be incorporated — it is not safe to ignore it.',
      'Bayes\' theorem or a natural-frequency tree: multiply the prior probability by the likelihood, then divide by the total probability of a positive test.',
      'The false-positive rate inflates the denominator: many healthy people also test positive because the disease is rare.',
      'The answer (~8.3%) is far below the 90% accuracy figure because the base rate is very low.',
    ],
    misconceptions: ['base_rate_neglect'],
    canonicalWhy:
      'Use a frequency tree for 10,000 people: 100 have the disease, 9,900 do not. ' +
      'Of the 100 sick, 90 test positive (90% sensitivity). ' +
      'Of the 9,900 healthy, 990 also test positive (10% false-positive rate). ' +
      'Total positives = 90 + 990 = 1,080. Of those, only 90 are truly sick: P = 90/1080 = 1/12 ≈ 8.3%. ' +
      'The high accuracy sounds impressive, but the very low base rate means most positives are false alarms — ignoring the base rate is the core mistake.',
  },

  // -------------------------------------------------------------------------
  // CP-003 — Ordered vs. unordered (combinations)
  //
  // C(5, 3) = 10.  Learners often compute P(5, 3) = 60 by treating the
  // selection as ordered, which is the ordered_vs_unordered misconception.
  // -------------------------------------------------------------------------
  {
    id: 'cp-003-ordered-vs-unordered',
    topic: 'permutations-combinations',
    skills: ['ordered-vs-unordered', 'combinations'],
    prompt:
      'A teacher wants to choose 3 students from a class of 5 to form a study group. ' +
      'The group has no designated roles — every arrangement of the same 3 students counts as the same group. ' +
      'How many different study groups are possible?',
    answer: { kind: 'int', value: 10 },
    rubricKeyPoints: [
      'Because the order of selection does not matter, this is a combination, not a permutation.',
      'C(5, 3) = 5! / (3! × 2!) = 10.',
      'Counting each ordering separately (permutations: 5 × 4 × 3 = 60) over-counts: every group of 3 has 3! = 6 orderings, so 60 / 6 = 10.',
    ],
    misconceptions: ['ordered_vs_unordered'],
    canonicalWhy:
      'When order does not matter, use combinations: C(5, 3) = 10. ' +
      'A common mistake is to count permutations (5 × 4 × 3 = 60), which treats "Alice, Bob, Carol" as different from "Bob, Alice, Carol." ' +
      'Since the study group has no roles, those are the same group. ' +
      'Dividing by 3! = 6 (the number of ways to arrange any 3 people) corrects the over-count: 60 / 6 = 10.',
  },

  // -------------------------------------------------------------------------
  // CP-004 — Complement inversion
  //
  // P(not rolling a 6 on a fair 6-sided die) = 5/6.
  // The complement_inversion misconception leads learners to think the
  // complement is 1/6 (same as the event) or to add rather than subtract.
  // -------------------------------------------------------------------------
  {
    id: 'cp-004-complement-inversion',
    topic: 'complement',
    skills: ['complement-rule'],
    prompt:
      'A fair six-sided die is rolled once. ' +
      'What is the probability of NOT rolling a 6? ' +
      'Express your answer as a fraction.',
    answer: { kind: 'fraction', value: frac(5, 6) },
    rubricKeyPoints: [
      'The complement rule: P(not A) = 1 − P(A).',
      'P(rolling a 6) = 1/6, so P(not rolling a 6) = 1 − 1/6 = 5/6.',
      'The five outcomes {1, 2, 3, 4, 5} are all equally likely and each has probability 1/6, confirming 5/6.',
      'Confusing the event with its complement gives 1/6, which is the probability of rolling a 6, not of avoiding it.',
    ],
    misconceptions: ['complement_inversion'],
    canonicalWhy:
      'The complement rule states P(not A) = 1 − P(A). ' +
      'P(rolling a 6) = 1/6 (one favorable outcome out of six equally likely outcomes). ' +
      'Therefore P(not rolling a 6) = 1 − 1/6 = 5/6. ' +
      'Equivalently, five outcomes ({1, 2, 3, 4, 5}) satisfy "not 6," each with probability 1/6, summing to 5/6.',
  },
];

/**
 * Taxonomy flag log — keys needed by problem authors but ABSENT from misconceptions.ts:
 * (none at time of authoring — all four problems use only existing keys)
 */
