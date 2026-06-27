import type { Lesson } from '../types';

/**
 * Roadmap stubs — the forward-looking probability curriculum from
 * `docs/curriculum-roadmap.md`, laid out as blank, locked lessons.
 *
 * Every lesson here is intentionally contentless (`slots: []`) and
 * `comingSoon: true`. Two independent mechanisms keep them locked:
 *   1. `comingSoon: true` here, and
 *   2. the empty-slots safety net in `useLessons` (a contentless lesson is
 *      never playable, regardless of Remote Config).
 *
 * As real content is authored, a stub gets its slots filled and is flipped on
 * via Remote Config (`available_lesson_ids`); until then it shows as a locked
 * node, a visible preview of where the course is going.
 *
 * These are the locked previews. The one authored, playable lesson is the
 * `how-likely` opener, which `content/index.ts` prepends ahead of these and
 * which re-numbers the whole catalog by position (D88). The numbers below are
 * therefore indicative; the catalog is the source of truth for display order.
 * Grouping into units lives in `src/features/course/chapters.ts`.
 *
 * Unit count: 7 — the course is **classical probability**, ending on expected
 * value applied to real games and decisions. D89 merged "Likelihood" into
 * "Sample Spaces" → "Defining Probability"; D90 narrowed Unit 7 to expected
 * value only and dropped the original Unit 8 ("Famous Distributions") because
 * RV-as-formal-abstraction, variance, binomial, normal, CLT, and Monte Carlo
 * sit on the statistics side of the HS taxonomy, not classical probability.
 * Those lessons would belong in a future Statistics course, not here.
 */

function stub(
  number: number,
  id: string,
  title: string,
  blurb: string,
  estimatedMinutes = 4,
): Lesson {
  return { id, number, title, blurb, estimatedMinutes, comingSoon: true, slots: [] };
}

// Unit 1 — Defining Probability (D89: merges the old Likelihood + Sample Spaces
// units). Two-step formalization of the intuition the `how-likely` opener
// builds: long-run frequency as the intuitive definition, then sample-space +
// favorable/total as the rigorous one. `likelihood-compare` and
// `probability-scale` were dropped — `how-likely` already covers comparative
// likelihood and probability-by-counting on a 0..1 scale, so they were
// redundant. `review-likelihood` was merged into `review-sample-spaces`.
const unit1: Lesson[] = [
  stub(
    1,
    'long-run-frequency',
    'The long-run idea',
    "Probability as the share you'd see if you repeated forever.",
  ),
  stub(2, 'sample-space', 'The sample space', 'List every outcome of a single experiment.'),
  stub(
    3,
    'equally-likely-outcomes',
    'Equally likely outcomes',
    'When every outcome has the same chance, counting is everything.',
  ),
  stub(
    4,
    'practice-single-events',
    'Practice: single events',
    'Sharpen the favorable-over-total move.',
    3,
  ),
  stub(
    5,
    'review-sample-spaces',
    'Defining probability review',
    'Mixed practice on listing and counting outcomes.',
    5,
  ),
];

// Unit 2 — Compound experiments (counting outcomes).
//
// D95: `addition-principle` moved here from Unit 4, directly after
// `multiplication-principle` (AND/OR twin pair).
//
// D98: dropped the `two-coins` and `two-dice` intro stubs and moved
// `tree-diagrams` to the conditional-probability unit. The 2-coin and
// 2-dice compound sample spaces are already built concretely in
// `equally-likely-outcomes` (HT/TH trap, the 6×6 = 36 grid), and
// `multiplication-principle` is discovery-first (outfit puzzle + road
// fork) so it does not need three warm-up lessons re-teaching the same
// ground. Tree diagrams earn their own lesson later, where branches
// actually change between stages (dependent draws, conditioning).
const unit2: Lesson[] = [
  stub(
    6,
    'multiplication-principle',
    'The multiplication principle',
    'Why independent choices multiply.',
  ),
  stub(
    7,
    'addition-principle',
    'The addition principle',
    "Add the ways when choices don't overlap.",
  ),
  stub(
    8,
    'practice-counting-outcomes',
    'Practice: counting outcomes',
    'Count compound outcomes with confidence.',
    3,
  ),
  stub(
    9,
    'review-compound',
    'Compound experiments review',
    'Mixed practice on combining experiments.',
    5,
  ),
];

// Unit 3 — Events
const unit3: Lesson[] = [
  stub(
    10,
    'event-as-set',
    'An event is a set',
    'Events are subsets of the sample space, not single outcomes.',
  ),
  stub(
    11,
    'p-event-by-counting',
    'P(event) by counting',
    'Apply favorable-over-total to whole events.',
  ),
  stub(
    12,
    'complement-rule',
    'The complement rule',
    'When counting the opposite is the faster path.',
  ),
  stub(13, 'practice-events', 'Practice: events', 'Events on dice and cards.', 3),
  stub(14, 'review-events', 'Events review', 'Mixed practice on events and complements.', 5),
];

// Unit 4 — Counting techniques. D95 moved `addition-principle` out to
// Unit 2 (paired with multiplication-principle); inclusion-exclusion
// is now the unit opener as the meaningful "what if cases overlap?"
// follow-up.
const unit4: Lesson[] = [
  stub(
    15,
    'inclusion-exclusion',
    'Inclusion and exclusion',
    'Fix double-counting when choices overlap.',
  ),
  stub(16, 'permutations', 'Permutations', 'Count arrangements where order matters.'),
  stub(17, 'combinations', 'Combinations', "Count selections where order doesn't matter."),
  stub(
    18,
    'divide-by-k-factorial',
    'Why divide by k!',
    'The derivation behind the combinations formula.',
  ),
  stub(
    19,
    'practice-counting-techniques',
    'Practice: counting techniques',
    'Permutations and combinations word problems.',
    3,
  ),
  stub(
    20,
    'review-counting-techniques',
    'Counting techniques review',
    'Mixed practice on advanced counting.',
    5,
  ),
];

// Unit 5 — Probabilities of multiple events
const unit5: Lesson[] = [
  stub(
    21,
    'independent-events',
    'Independent events',
    "Multiply probabilities when events don't affect each other.",
  ),
  stub(
    22,
    'mutually-exclusive',
    'Mutually exclusive events',
    "Add probabilities when events can't both happen.",
  ),
  stub(23, 'at-least-one', 'At least one', "Use the complement to handle 'at least one' cleanly."),
  stub(
    24,
    'birthday-paradox',
    'The birthday paradox',
    'A surprising collision that counting explains.',
  ),
  stub(
    25,
    'practice-multi-event',
    'Practice: multiple events',
    'Multi-step compound probability.',
    3,
  ),
  stub(
    26,
    'review-combining',
    'Combining probabilities review',
    'Mixed practice on multi-event probability.',
    5,
  ),
];

// Unit 6 — Conditional probability. D98 placed `tree-diagrams` here:
// branching diagrams are the natural tool for sequential, dependent
// choices, where the branches change at each stage (the conditional
// setting), not for the independent compound experiments of Unit 2.
const unit6: Lesson[] = [
  stub(
    27,
    'conditional-intuition',
    'Given that X happened',
    'How new information reshapes the sample space.',
  ),
  stub(28, 'conditional-formula', 'The conditional formula', 'P(A given B), made precise.'),
  stub(
    29,
    'tree-diagrams',
    'Tree diagrams',
    'Draw branching choices to track probabilities stage by stage.',
  ),
  stub(
    30,
    'independence-revisited',
    'Independence revisited',
    'When conditioning changes nothing.',
  ),
  stub(31, 'bayes-theorem', "Bayes' theorem", 'Flip a conditional probability around.'),
  stub(32, 'monty-hall', 'Monty Hall', 'The switch-or-stay puzzle, settled by simulation.'),
  stub(
    33,
    'practice-conditional',
    'Practice: conditional probability',
    'Trees and Bayes problems.',
    3,
  ),
  stub(
    34,
    'review-conditional',
    'Conditional probability review',
    'Mixed practice on conditioning.',
    5,
  ),
];

// Unit 7 — Expected Value (the probability capstone). D90 narrowed this from
// the original "Random variables and expected value" / "Famous distributions"
// scope: random-variable-as-formal-abstraction, variance, binomial, normal,
// CLT, Monte Carlo, and the capstone problem set were all dropped because
// they sit on the statistics side of the HS taxonomy, not classical
// probability. The course now ends on expected value applied to fair games
// and real-world gambles/insurance — the natural payoff of "given a
// probability, what payoff do you expect?"
const unit7: Lesson[] = [
  stub(
    35,
    'expected-value-intuition',
    'Expected value',
    'The long-run average payoff of a chance event.',
  ),
  stub(
    36,
    'computing-expected-value',
    'Computing E(X)',
    'Weighted sums on dice, spinners, and cards.',
  ),
  stub(37, 'fair-games', 'Fair games', 'When is a bet fair? E(X) = 0 says break-even.'),
  stub(
    38,
    'practice-expected-value',
    'Practice: gambles and insurance',
    'Lotteries, casinos, and insurance, settled by expected value.',
    3,
  ),
  stub(
    39,
    'review-expected-value',
    'Expected value review',
    'Mixed practice on expected value.',
    5,
  ),
];

export const roadmapStubLessons: Lesson[] = [
  ...unit1,
  ...unit2,
  ...unit3,
  ...unit4,
  ...unit5,
  ...unit6,
  ...unit7,
];
