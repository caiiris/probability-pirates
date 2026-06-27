/**
 * Template registry — collects all WP-4 template families into a single array.
 *
 * This file is imported by practiceEngine.ts so that the TEMPLATES registry
 * is populated at module load. Family files themselves do NOT import from
 * practiceEngine (avoids circular dependencies).
 *
 * Add new families here as they land.
 */

import { sumOfTwoDiceTemplate } from './counting/sum-of-two-dice';
import { atLeastOneViaComplementTemplate } from './complement/at-least-one-via-complement';
import { kHeadsInNTemplate } from './distributions/k-heads-in-n';
import { pickKOfNUnorderedTemplate } from './counting/pick-k-of-n-unordered';
import { conditionalBayes2x2Template } from './conditional/conditional-bayes-2x2';
import { CREATIVE_VERIFIED_TEMPLATES } from './creative/creative-hard';
import { gamblerFallacyMcTemplate } from './long-run/gambler-fallacy-mc';
// Wave 2 families (F2): broaden topic coverage + add Medium→Extreme difficulty.
import { singleEventProbTemplate } from './counting/single-event-prob';
import { permutationsArrangeTemplate } from './counting/permutations-arrange-k-of-n';
import { withoutReplacementTwoDrawsTemplate } from './conditional/without-replacement-two-draws';
import { geometricFirstSuccessTemplate } from './distributions/geometric-first-success';
import { binomialAtLeastKTemplate } from './distributions/binomial-at-least-k';
import { expectedValueDieGameTemplate } from './long-run/expected-value-die-game';
import { inclusionExclusionDivisibleTemplate } from './counting/inclusion-exclusion-divisible';
import { inclusionExclusionTwoEventsTemplate } from './counting/inclusion-exclusion-two-events';
import { additionMultiplicationCombinedTemplate } from './counting/addition-multiplication-combined';
// Wave 3 families (D-bank-breadth): bring every category to >= 5 distinct types,
// with creative / cross-concept problems in the harder bands.
import { complementUnionTwoIndependentTemplate } from './complement/complement-union-two-independent';
import { complementUnionThreeIndependentTemplate } from './complement/complement-union-three-independent';
import { atLeastOneWinRaffleTemplate } from './complement/at-least-one-win-raffle';
import { atLeastOneDefectiveSampleTemplate } from './complement/at-least-one-defective-sample';
import { conditionalTwoWayTableTemplate } from './conditional/conditional-two-way-table';
import { montyHallNDoorsTemplate } from './conditional/monty-hall-n-doors';
import { conditionalThreeDrawsAllRedTemplate } from './conditional/conditional-three-draws-all-red';
import { circularPermutationsTemplate } from './counting/circular-permutations';
import { permutationsWithRepetitionTemplate } from './counting/permutations-with-repetition';
import { committeeWithConstraintTemplate } from './counting/committee-with-constraint';
import { inclusionExclusionThreeDivisorsTemplate } from './counting/inclusion-exclusion-three-divisors';
import { derangementProbabilityTemplate } from './counting/derangement-probability';
import { inclusionExclusionThreeSetsSurveyTemplate } from './counting/inclusion-exclusion-three-sets-survey';
import { expectedValueSpinnerTemplate } from './long-run/expected-value-spinner';
import { expectedTrialsUntilSuccessTemplate } from './long-run/expected-trials-until-success';
import { VERIFIED_SEED_TEMPLATES } from './verifiedSeeds';
import type { Template } from './types';

/** All template families, in the order they were implemented. */
export const ALL_TEMPLATES: Template[] = [
  sumOfTwoDiceTemplate,
  atLeastOneViaComplementTemplate,
  kHeadsInNTemplate,
  pickKOfNUnorderedTemplate,
  conditionalBayes2x2Template,
  gamblerFallacyMcTemplate,
  // Wave 2
  singleEventProbTemplate,
  permutationsArrangeTemplate,
  withoutReplacementTwoDrawsTemplate,
  geometricFirstSuccessTemplate,
  binomialAtLeastKTemplate,
  expectedValueDieGameTemplate,
  inclusionExclusionDivisibleTemplate,
  inclusionExclusionTwoEventsTemplate,
  additionMultiplicationCombinedTemplate,
  // Wave 3 — complement
  complementUnionTwoIndependentTemplate,
  complementUnionThreeIndependentTemplate,
  atLeastOneWinRaffleTemplate,
  atLeastOneDefectiveSampleTemplate,
  // Wave 3 — conditional
  conditionalTwoWayTableTemplate,
  montyHallNDoorsTemplate,
  conditionalThreeDrawsAllRedTemplate,
  // Wave 3 — permutations & combinations
  circularPermutationsTemplate,
  permutationsWithRepetitionTemplate,
  committeeWithConstraintTemplate,
  // Wave 3 — inclusion-exclusion
  inclusionExclusionThreeDivisorsTemplate,
  derangementProbabilityTemplate,
  inclusionExclusionThreeSetsSurveyTemplate,
  // Wave 3 — long-run
  expectedValueSpinnerTemplate,
  expectedTrialsUntilSuccessTemplate,
  ...VERIFIED_SEED_TEMPLATES,
  ...CREATIVE_VERIFIED_TEMPLATES,
];
