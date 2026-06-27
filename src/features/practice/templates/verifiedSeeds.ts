/**
 * Verified seed-backed practice templates.
 *
 * These load the human-reviewed, solver-verified parameter sets from
 * `src/content/practiceProblems/verifiedTemplateSeeds.ts` into the same runtime
 * bank as generated templates. The answer path still delegates to the base
 * template's solve/render/explain/simulate methods.
 */

import {
  ADDITION_MULTIPLICATION_COMBINED_SEEDS,
  AT_LEAST_ONE_VIA_COMPLEMENT_SEEDS,
  BINOMIAL_AT_LEAST_K_SEEDS,
  CONDITIONAL_BAYES_2X2_SEEDS,
  EXPECTED_VALUE_DIE_GAME_SEEDS,
  GAMBLER_FALLACY_MC_SEEDS,
  GEOMETRIC_FIRST_SUCCESS_SEEDS,
  INCLUSION_EXCLUSION_DIVISIBLE_SEEDS,
  INCLUSION_EXCLUSION_TWO_EVENTS_SEEDS,
  K_HEADS_IN_N_SEEDS,
  PERMUTATIONS_ARRANGE_K_OF_N_SEEDS,
  PICK_K_OF_N_UNORDERED_SEEDS,
  SINGLE_EVENT_PROB_SEEDS,
  SUM_OF_TWO_DICE_SEEDS,
  WITHOUT_REPLACEMENT_TWO_DRAWS_SEEDS,
  type VerifiedTemplateSeed,
} from '@/content/practiceProblems/verifiedTemplateSeeds';
import { atLeastOneViaComplementTemplate } from './complement/at-least-one-via-complement';
import { conditionalBayes2x2Template } from './conditional/conditional-bayes-2x2';
import { withoutReplacementTwoDrawsTemplate } from './conditional/without-replacement-two-draws';
import { additionMultiplicationCombinedTemplate } from './counting/addition-multiplication-combined';
import { inclusionExclusionDivisibleTemplate } from './counting/inclusion-exclusion-divisible';
import { inclusionExclusionTwoEventsTemplate } from './counting/inclusion-exclusion-two-events';
import { permutationsArrangeTemplate } from './counting/permutations-arrange-k-of-n';
import { pickKOfNUnorderedTemplate } from './counting/pick-k-of-n-unordered';
import { singleEventProbTemplate } from './counting/single-event-prob';
import { sumOfTwoDiceTemplate } from './counting/sum-of-two-dice';
import { binomialAtLeastKTemplate } from './distributions/binomial-at-least-k';
import { geometricFirstSuccessTemplate } from './distributions/geometric-first-success';
import { kHeadsInNTemplate } from './distributions/k-heads-in-n';
import { expectedValueDieGameTemplate } from './long-run/expected-value-die-game';
import { gamblerFallacyMcTemplate } from './long-run/gambler-fallacy-mc';
import type { Template } from './types';

type SeedFor<P> = Omit<VerifiedTemplateSeed, 'params'> & { params: P };

function typedSeeds<P>(seeds: readonly VerifiedTemplateSeed[]): readonly SeedFor<P>[] {
  return seeds as readonly SeedFor<P>[];
}

function makeSeedTemplate<P>(base: Template<P>, seed: SeedFor<P>): Template<P> {
  return {
    id: `verified-${seed.id}`,
    topic: base.topic,
    skills: base.skills,
    retrievalForm: base.retrievalForm,
    rate: () => base.rate(seed.params),
    sample: () => seed.params,
    solve: (params) => base.solve(params),
    render: (params) => base.render(params),
    explain: (params) => base.explain(params),
    simulate:
      base.simulate === undefined
        ? undefined
        : (params, trials, rng) => base.simulate?.(params, trials, rng) ?? 0,
  };
}

function makeSeedTemplates<P>(
  base: Template<P>,
  seeds: readonly VerifiedTemplateSeed[],
): Template<P>[] {
  return typedSeeds<P>(seeds).map((seed) => makeSeedTemplate(base, seed));
}

export const VERIFIED_SEED_TEMPLATES: Template[] = [
  ...makeSeedTemplates(sumOfTwoDiceTemplate, SUM_OF_TWO_DICE_SEEDS),
  ...makeSeedTemplates(atLeastOneViaComplementTemplate, AT_LEAST_ONE_VIA_COMPLEMENT_SEEDS),
  ...makeSeedTemplates(kHeadsInNTemplate, K_HEADS_IN_N_SEEDS),
  ...makeSeedTemplates(pickKOfNUnorderedTemplate, PICK_K_OF_N_UNORDERED_SEEDS),
  ...makeSeedTemplates(conditionalBayes2x2Template, CONDITIONAL_BAYES_2X2_SEEDS),
  ...makeSeedTemplates(gamblerFallacyMcTemplate, GAMBLER_FALLACY_MC_SEEDS),
  ...makeSeedTemplates(singleEventProbTemplate, SINGLE_EVENT_PROB_SEEDS),
  ...makeSeedTemplates(permutationsArrangeTemplate, PERMUTATIONS_ARRANGE_K_OF_N_SEEDS),
  ...makeSeedTemplates(withoutReplacementTwoDrawsTemplate, WITHOUT_REPLACEMENT_TWO_DRAWS_SEEDS),
  ...makeSeedTemplates(geometricFirstSuccessTemplate, GEOMETRIC_FIRST_SUCCESS_SEEDS),
  ...makeSeedTemplates(binomialAtLeastKTemplate, BINOMIAL_AT_LEAST_K_SEEDS),
  ...makeSeedTemplates(expectedValueDieGameTemplate, EXPECTED_VALUE_DIE_GAME_SEEDS),
  ...makeSeedTemplates(inclusionExclusionDivisibleTemplate, INCLUSION_EXCLUSION_DIVISIBLE_SEEDS),
  ...makeSeedTemplates(inclusionExclusionTwoEventsTemplate, INCLUSION_EXCLUSION_TWO_EVENTS_SEEDS),
  ...makeSeedTemplates(additionMultiplicationCombinedTemplate, ADDITION_MULTIPLICATION_COMBINED_SEEDS),
];

