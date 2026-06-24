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
 * These do NOT change any shipped lesson. They sit *after* the live content
 * (Lessons 1–6) in the catalog and on the course path, so the existing
 * "Start here" lesson and all progress/reward behavior are unchanged. As real
 * content is authored, a stub gets its slots filled and is flipped on via
 * Remote Config (`available_lesson_ids`); until then it shows as a locked
 * node — a visible preview of where the course is going.
 *
 * Numbering continues from the six live lessons (7…), so the displayed
 * "Lesson N" stays monotonic down the path. Grouping into units lives in
 * `src/features/course/chapters.ts`.
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

// Unit 1 — Likelihood (pure intuition, no formulas)
const unit1: Lesson[] = [
  stub(7, 'likelihood-compare', 'Which is more likely?', 'Build a feel for chance before any formulas — just compare.'),
  stub(8, 'probability-scale', 'The probability scale', 'From impossible to certain: place events on the 0-to-1 line.'),
  stub(9, 'long-run-frequency', 'The long-run idea', "Probability as the share you'd see if you repeated forever."),
  stub(10, 'review-likelihood', 'Likelihood review', 'Mixed practice on the language of chance.', 5),
];

// Unit 2 — Listing outcomes (sample spaces)
const unit2: Lesson[] = [
  stub(11, 'sample-space', 'The sample space', 'List every outcome of a single experiment.'),
  stub(12, 'equally-likely-outcomes', 'Equally likely outcomes', 'When every outcome has the same chance, counting is everything.'),
  stub(13, 'practice-single-events', 'Practice: single events', 'Sharpen the favorable-over-total move.', 3),
  stub(14, 'review-sample-spaces', 'Sample space review', 'Mixed practice on listing and counting outcomes.', 5),
];

// Unit 3 — Compound experiments (counting outcomes)
const unit3: Lesson[] = [
  stub(15, 'two-coins', 'Two coins', 'Combine two experiments and watch the outcomes multiply.'),
  stub(16, 'two-dice', 'Two dice', 'The 6×6 grid and the sums it hides.'),
  stub(17, 'tree-diagrams', 'Tree diagrams', 'Draw branching choices to count them without missing any.'),
  stub(18, 'multiplication-principle', 'The multiplication principle', 'Why independent choices multiply.'),
  stub(19, 'practice-counting-outcomes', 'Practice: counting outcomes', 'Count compound outcomes with confidence.', 3),
  stub(20, 'review-compound', 'Compound experiments review', 'Mixed practice on combining experiments.', 5),
];

// Unit 4 — Events
const unit4: Lesson[] = [
  stub(21, 'event-as-set', 'An event is a set', 'Events are subsets of the sample space, not single outcomes.'),
  stub(22, 'p-event-by-counting', 'P(event) by counting', 'Apply favorable-over-total to whole events.'),
  stub(23, 'complement-rule', 'The complement rule', 'When counting the opposite is the faster path.'),
  stub(24, 'practice-events', 'Practice: events', 'Events on dice and cards.', 3),
  stub(25, 'review-events', 'Events review', 'Mixed practice on events and complements.', 5),
];

// Unit 5 — Counting techniques
const unit5: Lesson[] = [
  stub(26, 'addition-principle', 'The addition principle', "Add the ways when choices don't overlap."),
  stub(27, 'inclusion-exclusion', 'Inclusion and exclusion', 'Fix double-counting when choices overlap.'),
  stub(28, 'permutations', 'Permutations', 'Count arrangements where order matters.'),
  stub(29, 'combinations', 'Combinations', "Count selections where order doesn't matter."),
  stub(30, 'divide-by-k-factorial', 'Why divide by k!', 'The derivation behind the combinations formula.'),
  stub(31, 'practice-counting-techniques', 'Practice: counting techniques', 'Permutations and combinations word problems.', 3),
  stub(32, 'review-counting-techniques', 'Counting techniques review', 'Mixed practice on advanced counting.', 5),
];

// Unit 6 — Probabilities of multiple events
const unit6: Lesson[] = [
  stub(33, 'independent-events', 'Independent events', "Multiply probabilities when events don't affect each other."),
  stub(34, 'mutually-exclusive', 'Mutually exclusive events', "Add probabilities when events can't both happen."),
  stub(35, 'at-least-one', 'At least one', "Use the complement to handle 'at least one' cleanly."),
  stub(36, 'birthday-paradox', 'The birthday paradox', 'A surprising collision that counting explains.'),
  stub(37, 'practice-multi-event', 'Practice: multiple events', 'Multi-step compound probability.', 3),
  stub(38, 'review-combining', 'Combining probabilities review', 'Mixed practice on multi-event probability.', 5),
];

// Unit 7 — Conditional probability
const unit7: Lesson[] = [
  stub(39, 'conditional-intuition', 'Given that X happened', 'How new information reshapes the sample space.'),
  stub(40, 'conditional-formula', 'The conditional formula', 'P(A given B), made precise.'),
  stub(41, 'independence-revisited', 'Independence revisited', 'When conditioning changes nothing.'),
  stub(42, 'bayes-theorem', "Bayes' theorem", 'Flip a conditional probability around.'),
  stub(43, 'monty-hall', 'Monty Hall', 'The switch-or-stay puzzle, settled by simulation.'),
  stub(44, 'practice-conditional', 'Practice: conditional probability', 'Trees and Bayes problems.', 3),
  stub(45, 'review-conditional', 'Conditional probability review', 'Mixed practice on conditioning.', 5),
];

// Unit 8 — Random variables and expected value
const unit8: Lesson[] = [
  stub(46, 'random-variable', 'What is a random variable?', 'Attach a number to every outcome.'),
  stub(47, 'distributions-intro', 'Distributions', 'Uniform and Bernoulli, the simplest shapes.'),
  stub(48, 'expected-value-intuition', 'Expected value', 'The long-run average of a random number.'),
  stub(49, 'computing-expected-value', 'Computing E(X)', 'Weighted sums on gambles and insurance.'),
  stub(50, 'variance-spread', 'Variance and spread', 'How far outcomes scatter from the mean.'),
  stub(51, 'practice-expected-value', 'Practice: expected value', 'Expected-value word problems.', 3),
  stub(52, 'review-random-variables', 'Random variables review', 'Mixed practice on random variables and expectation.', 5),
];

// Unit 9 — Famous distributions
const unit9: Lesson[] = [
  stub(53, 'binomial-distribution', 'The binomial distribution', 'Count successes across many trials.'),
  stub(54, 'normal-distribution', 'The normal distribution', 'The bell curve and where it comes from.'),
  stub(55, 'central-limit-theorem', 'The central limit theorem', 'Why averages go normal.'),
  stub(56, 'monte-carlo', 'Monte Carlo methods', 'Solve hard problems by simulating them.'),
  stub(57, 'capstone-problem-set', 'Capstone problem set', 'Put the whole sequence to work.', 6),
];

export const roadmapStubLessons: Lesson[] = [
  ...unit1,
  ...unit2,
  ...unit3,
  ...unit4,
  ...unit5,
  ...unit6,
  ...unit7,
  ...unit8,
  ...unit9,
];
