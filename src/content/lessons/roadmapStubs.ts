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
 * Unit count: 6 — the course is **classical probability**, ending on expected
 * value applied to real games and decisions. D89 merged "Likelihood" into
 * "Sample Spaces" → "Defining Probability"; D90 narrowed the final unit to
 * expected value only and dropped the original "Famous Distributions" unit
 * because RV-as-formal-abstraction, variance, binomial, normal, CLT, and
 * Monte Carlo sit on the statistics side of the HS taxonomy, not classical
 * probability. D99 dropped the standalone Events unit (its material is
 * covered in Unit 1) and kept only the complement rule, moved into Counting
 * Techniques. Those dropped lessons would belong in a future Statistics
 * course, not here.
 *
 * The per-unit `practice-*` and `review-*` nodes were removed from the path:
 * standalone adaptive practice lives at `/practice`, and spaced retrieval runs
 * before each new lesson at `/warmup`, so dedicated path nodes were redundant.
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
];

// Unit 2 — Compound experiments (counting outcomes).
//
// D95: `addition-principle` moved here from Unit 4, directly after
// `multiplication-principle` (AND/OR twin pair).
//
// D98: dropped the `two-coins` and `two-dice` intro stubs and moved
// `tree-diagrams` to the conditional-probability unit.
//
// D99: added `compound-experiments` as the chapter opener. It introduces
// the structure of a compound experiment (each outcome an ordered
// combination, systematic listing) and ends on the "this grows fast"
// tension that the multiplication principle resolves.
const unit2: Lesson[] = [
  stub(
    6,
    'compound-experiments',
    'Compound experiments',
    'Stack experiments together and list every combination.',
  ),
  stub(
    7,
    'multiplication-principle',
    'The multiplication principle',
    'Why independent choices multiply.',
  ),
  stub(
    8,
    'addition-principle',
    'The addition principle',
    "Add the ways when choices don't overlap.",
  ),
];

// Unit 3 — Counting techniques. D95 moved `addition-principle` out to
// Unit 2; inclusion-exclusion is the meaningful "what if cases overlap?"
// follow-up.
//
// D99: the old standalone Events unit (event-as-set, p-event-by-counting,
// practice-events, review-events) was dropped — that material is already
// covered in Unit 1 (`sample-space` defines event/sample space and states
// k/N; `equally-likely-outcomes` drills it). Its one survivor, the
// `complement-rule`, moved here and now opens the unit as the first
// "count the smart way" tool, ahead of inclusion-exclusion.
const unit3: Lesson[] = [
  stub(
    11,
    'complement-rule',
    'The complement rule',
    'When counting the opposite is the faster path.',
  ),
  stub(
    12,
    'inclusion-exclusion',
    'Inclusion and exclusion',
    'Fix double-counting when choices overlap.',
  ),
  stub(13, 'permutations', 'Permutations', 'Count arrangements where order matters.'),
  stub(14, 'combinations', 'Combinations', "Count selections where order doesn't matter."),
  // D103: dropped `divide-by-k-factorial` — its derivation ("why divide by
  // k!") is now taught directly inside the `combinations` lesson.
];

// Unit 4 — Probabilities of multiple events.
//
// D103: dropped `at-least-one` (the complement-rule lesson already teaches
// "at least one" via the complement) and `mutually-exclusive` (inclusion-
// exclusion already covers P(A or B) = P(A) + P(B) as the disjoint special
// case; the exclusive→add contrast will live inside `independent-events`).
const unit4: Lesson[] = [
  stub(
    17,
    'independent-events',
    'Independent events',
    "Multiply probabilities when events don't affect each other.",
  ),
  stub(
    18,
    'birthday-paradox',
    'The birthday paradox',
    'A surprising collision that counting explains.',
  ),
];

// Unit 5 — Conditional probability. D113 dropped the standalone
// `tree-diagrams` lesson: conditioning, independence, and Bayes carry the
// unit, and tree-style "multiply along, add across" reasoning is already
// exercised inside the independence and Bayes lessons without needing a
// dedicated branching-diagram lesson.
const unit5: Lesson[] = [
  stub(
    21,
    'conditional-intuition',
    'Given that X happened',
    'How new information reshapes the sample space.',
  ),
  stub(22, 'conditional-formula', 'The conditional formula', 'P(A given B), made precise.'),
  stub(
    23,
    'independence-revisited',
    'Independence revisited',
    'When conditioning changes nothing.',
  ),
  stub(24, 'bayes-theorem', "Bayes' theorem", 'Flip a conditional probability around.'),
  stub(25, 'monty-hall', 'Monty Hall', 'The switch-or-stay puzzle, settled by simulation.'),
];

// Unit 6 — Expected Value (the probability capstone). D90 narrowed this from
// the original "Random variables and expected value" / "Famous distributions"
// scope: random-variable-as-formal-abstraction, variance, binomial, normal,
// CLT, Monte Carlo, and the capstone problem set were all dropped because
// they sit on the statistics side of the HS taxonomy, not classical
// probability. The course now ends on expected value applied to fair games
// and real-world gambles/insurance — the natural payoff of "given a
// probability, what payoff do you expect?"
const unit6: Lesson[] = [
  stub(
    29,
    'expected-value-intuition',
    'Expected value',
    'The long-run average payoff of a chance event.',
  ),
  stub(
    30,
    'computing-expected-value',
    'Computing E(X)',
    'Weighted sums on dice, spinners, and cards.',
  ),
  stub(31, 'fair-games', 'Fair games', 'When is a bet fair? E(X) = 0 says break-even.'),
];

export const roadmapStubLessons: Lesson[] = [
  ...unit1,
  ...unit2,
  ...unit3,
  ...unit4,
  ...unit5,
  ...unit6,
];
