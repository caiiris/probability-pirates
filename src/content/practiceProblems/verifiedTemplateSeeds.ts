/**
 * Verified static seed parameters for the practice bank.
 *
 * Generated from docs/curriculum-harvest/generated-problems/runtime-templates.
 * These are params only: runtime still calls each template solve/render/explain.
 * Regenerate with: npm run harvest:write-seed-bank
 */

import type { Topic } from '@/content/skills';

export type VerifiedTemplateId =
  | "sum-of-two-dice"
  | "at-least-one-via-complement"
  | "k-heads-in-n"
  | "pick-k-of-n-unordered"
  | "conditional-bayes-2x2"
  | "gambler-fallacy-mc"
  | "single-event-prob"
  | "permutations-arrange-k-of-n"
  | "without-replacement-two-draws"
  | "geometric-first-success"
  | "binomial-at-least-k"
  | "expected-value-die-game"
  | "inclusion-exclusion-divisible"
  | "inclusion-exclusion-two-events"
  | "addition-multiplication-combined";

export type VerifiedTemplateSeed = {
  id: string;
  templateId: VerifiedTemplateId;
  params: unknown;
};

export const SUM_OF_TWO_DICE_SEEDS = [
  {
    id: "sum-of-two-dice-p01",
    templateId: "sum-of-two-dice",
    params: {"k":10},
  },
  {
    id: "sum-of-two-dice-p02",
    templateId: "sum-of-two-dice",
    params: {"k":8},
  },
  {
    id: "sum-of-two-dice-p03",
    templateId: "sum-of-two-dice",
    params: {"k":4},
  },
  {
    id: "sum-of-two-dice-p04",
    templateId: "sum-of-two-dice",
    params: {"k":3},
  },
  {
    id: "sum-of-two-dice-p05",
    templateId: "sum-of-two-dice",
    params: {"k":2},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const AT_LEAST_ONE_VIA_COMPLEMENT_SEEDS = [
  {
    id: "at-least-one-via-complement-p01",
    templateId: "at-least-one-via-complement",
    params: {"m":4,"n":5},
  },
  {
    id: "at-least-one-via-complement-p02",
    templateId: "at-least-one-via-complement",
    params: {"m":4,"n":2},
  },
  {
    id: "at-least-one-via-complement-p03",
    templateId: "at-least-one-via-complement",
    params: {"m":6,"n":3},
  },
  {
    id: "at-least-one-via-complement-p04",
    templateId: "at-least-one-via-complement",
    params: {"m":2,"n":4},
  },
  {
    id: "at-least-one-via-complement-p05",
    templateId: "at-least-one-via-complement",
    params: {"m":2,"n":2},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const K_HEADS_IN_N_SEEDS = [
  {
    id: "k-heads-in-n-p01",
    templateId: "k-heads-in-n",
    params: {"n":6,"k":5},
  },
  {
    id: "k-heads-in-n-p02",
    templateId: "k-heads-in-n",
    params: {"n":7,"k":7},
  },
  {
    id: "k-heads-in-n-p03",
    templateId: "k-heads-in-n",
    params: {"n":6,"k":6},
  },
  {
    id: "k-heads-in-n-p04",
    templateId: "k-heads-in-n",
    params: {"n":8,"k":3},
  },
  {
    id: "k-heads-in-n-p05",
    templateId: "k-heads-in-n",
    params: {"n":2,"k":0},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const PICK_K_OF_N_UNORDERED_SEEDS = [
  {
    id: "pick-k-of-n-unordered-p01",
    templateId: "pick-k-of-n-unordered",
    params: {"n":6,"k":4},
  },
  {
    id: "pick-k-of-n-unordered-p02",
    templateId: "pick-k-of-n-unordered",
    params: {"n":8,"k":2},
  },
  {
    id: "pick-k-of-n-unordered-p03",
    templateId: "pick-k-of-n-unordered",
    params: {"n":7,"k":5},
  },
  {
    id: "pick-k-of-n-unordered-p04",
    templateId: "pick-k-of-n-unordered",
    params: {"n":6,"k":2},
  },
  {
    id: "pick-k-of-n-unordered-p05",
    templateId: "pick-k-of-n-unordered",
    params: {"n":6,"k":5},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const CONDITIONAL_BAYES_2X2_SEEDS = [
  {
    id: "conditional-bayes-2x2-p01",
    templateId: "conditional-bayes-2x2",
    params: {"tp":3,"fp":25,"fn":6,"tn":422},
  },
  {
    id: "conditional-bayes-2x2-p02",
    templateId: "conditional-bayes-2x2",
    params: {"tp":11,"fp":83,"fn":14,"tn":441},
  },
  {
    id: "conditional-bayes-2x2-p03",
    templateId: "conditional-bayes-2x2",
    params: {"tp":20,"fp":78,"fn":19,"tn":248},
  },
  {
    id: "conditional-bayes-2x2-p04",
    templateId: "conditional-bayes-2x2",
    params: {"tp":24,"fp":40,"fn":10,"tn":438},
  },
  {
    id: "conditional-bayes-2x2-p05",
    templateId: "conditional-bayes-2x2",
    params: {"tp":12,"fp":60,"fn":4,"tn":182},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const GAMBLER_FALLACY_MC_SEEDS = [
  {
    id: "gambler-fallacy-mc-p01",
    templateId: "gambler-fallacy-mc",
    params: {"streakLen":8,"flavor":2},
  },
  {
    id: "gambler-fallacy-mc-p02",
    templateId: "gambler-fallacy-mc",
    params: {"streakLen":4,"flavor":1},
  },
  {
    id: "gambler-fallacy-mc-p03",
    templateId: "gambler-fallacy-mc",
    params: {"streakLen":3,"flavor":0},
  },
  {
    id: "gambler-fallacy-mc-p04",
    templateId: "gambler-fallacy-mc",
    params: {"streakLen":7,"flavor":2},
  },
  {
    id: "gambler-fallacy-mc-p05",
    templateId: "gambler-fallacy-mc",
    params: {"streakLen":6,"flavor":0},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const SINGLE_EVENT_PROB_SEEDS = [
  {
    id: "single-event-prob-p01",
    templateId: "single-event-prob",
    params: {"red":1,"blue":1},
  },
  {
    id: "single-event-prob-p02",
    templateId: "single-event-prob",
    params: {"red":3,"blue":2},
  },
  {
    id: "single-event-prob-p03",
    templateId: "single-event-prob",
    params: {"red":5,"blue":1},
  },
  {
    id: "single-event-prob-p04",
    templateId: "single-event-prob",
    params: {"red":2,"blue":4},
  },
  {
    id: "single-event-prob-p05",
    templateId: "single-event-prob",
    params: {"red":4,"blue":3},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const PERMUTATIONS_ARRANGE_K_OF_N_SEEDS = [
  {
    id: "permutations-arrange-k-of-n-p01",
    templateId: "permutations-arrange-k-of-n",
    params: {"n":5,"k":2},
  },
  {
    id: "permutations-arrange-k-of-n-p02",
    templateId: "permutations-arrange-k-of-n",
    params: {"n":6,"k":3},
  },
  {
    id: "permutations-arrange-k-of-n-p03",
    templateId: "permutations-arrange-k-of-n",
    params: {"n":7,"k":2},
  },
  {
    id: "permutations-arrange-k-of-n-p04",
    templateId: "permutations-arrange-k-of-n",
    params: {"n":8,"k":4},
  },
  {
    id: "permutations-arrange-k-of-n-p05",
    templateId: "permutations-arrange-k-of-n",
    params: {"n":4,"k":2},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const WITHOUT_REPLACEMENT_TWO_DRAWS_SEEDS = [
  {
    id: "without-replacement-two-draws-p01",
    templateId: "without-replacement-two-draws",
    params: {"r":2,"b":2},
  },
  {
    id: "without-replacement-two-draws-p02",
    templateId: "without-replacement-two-draws",
    params: {"r":3,"b":4},
  },
  {
    id: "without-replacement-two-draws-p03",
    templateId: "without-replacement-two-draws",
    params: {"r":5,"b":2},
  },
  {
    id: "without-replacement-two-draws-p04",
    templateId: "without-replacement-two-draws",
    params: {"r":4,"b":3},
  },
  {
    id: "without-replacement-two-draws-p05",
    templateId: "without-replacement-two-draws",
    params: {"r":2,"b":5},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const GEOMETRIC_FIRST_SUCCESS_SEEDS = [
  {
    id: "geometric-first-success-p01",
    templateId: "geometric-first-success",
    params: {"m":2,"k":1},
  },
  {
    id: "geometric-first-success-p02",
    templateId: "geometric-first-success",
    params: {"m":3,"k":2},
  },
  {
    id: "geometric-first-success-p03",
    templateId: "geometric-first-success",
    params: {"m":4,"k":3},
  },
  {
    id: "geometric-first-success-p04",
    templateId: "geometric-first-success",
    params: {"m":6,"k":1},
  },
  {
    id: "geometric-first-success-p05",
    templateId: "geometric-first-success",
    params: {"m":5,"k":4},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const BINOMIAL_AT_LEAST_K_SEEDS = [
  {
    id: "binomial-at-least-k-p01",
    templateId: "binomial-at-least-k",
    params: {"n":4,"k":2},
  },
  {
    id: "binomial-at-least-k-p02",
    templateId: "binomial-at-least-k",
    params: {"n":5,"k":3},
  },
  {
    id: "binomial-at-least-k-p03",
    templateId: "binomial-at-least-k",
    params: {"n":6,"k":2},
  },
  {
    id: "binomial-at-least-k-p04",
    templateId: "binomial-at-least-k",
    params: {"n":7,"k":4},
  },
  {
    id: "binomial-at-least-k-p05",
    templateId: "binomial-at-least-k",
    params: {"n":5,"k":2},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const EXPECTED_VALUE_DIE_GAME_SEEDS = [
  {
    id: "expected-value-die-game-p01",
    templateId: "expected-value-die-game",
    params: {"s":4},
  },
  {
    id: "expected-value-die-game-p02",
    templateId: "expected-value-die-game",
    params: {"s":6},
  },
  {
    id: "expected-value-die-game-p03",
    templateId: "expected-value-die-game",
    params: {"s":8},
  },
  {
    id: "expected-value-die-game-p04",
    templateId: "expected-value-die-game",
    params: {"s":10},
  },
  {
    id: "expected-value-die-game-p05",
    templateId: "expected-value-die-game",
    params: {"s":12},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const INCLUSION_EXCLUSION_DIVISIBLE_SEEDS = [
  {
    id: "inclusion-exclusion-divisible-p01",
    templateId: "inclusion-exclusion-divisible",
    params: {"N":30,"a":2,"b":3},
  },
  {
    id: "inclusion-exclusion-divisible-p02",
    templateId: "inclusion-exclusion-divisible",
    params: {"N":24,"a":2,"b":4},
  },
  {
    id: "inclusion-exclusion-divisible-p03",
    templateId: "inclusion-exclusion-divisible",
    params: {"N":18,"a":3,"b":4},
  },
  {
    id: "inclusion-exclusion-divisible-p04",
    templateId: "inclusion-exclusion-divisible",
    params: {"N":20,"a":2,"b":5},
  },
  {
    id: "inclusion-exclusion-divisible-p05",
    templateId: "inclusion-exclusion-divisible",
    params: {"N":12,"a":2,"b":3},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const INCLUSION_EXCLUSION_TWO_EVENTS_SEEDS = [
  {
    id: "inclusion-exclusion-two-events-p01",
    templateId: "inclusion-exclusion-two-events",
    params: {"N":20,"c":3,"x":5,"y":4,"flavor":0},
  },
  {
    id: "inclusion-exclusion-two-events-p02",
    templateId: "inclusion-exclusion-two-events",
    params: {"N":24,"c":2,"x":6,"y":4,"flavor":1},
  },
  {
    id: "inclusion-exclusion-two-events-p03",
    templateId: "inclusion-exclusion-two-events",
    params: {"N":25,"c":4,"x":3,"y":8,"flavor":2},
  },
  {
    id: "inclusion-exclusion-two-events-p04",
    templateId: "inclusion-exclusion-two-events",
    params: {"N":30,"c":1,"x":7,"y":2,"flavor":0},
  },
  {
    id: "inclusion-exclusion-two-events-p05",
    templateId: "inclusion-exclusion-two-events",
    params: {"N":40,"c":3,"x":8,"y":5,"flavor":1},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const ADDITION_MULTIPLICATION_COMBINED_SEEDS = [
  {
    id: "addition-multiplication-combined-p01",
    templateId: "addition-multiplication-combined",
    params: {"a":2,"c":3,"p":2},
  },
  {
    id: "addition-multiplication-combined-p02",
    templateId: "addition-multiplication-combined",
    params: {"a":3,"c":2,"p":4},
  },
  {
    id: "addition-multiplication-combined-p03",
    templateId: "addition-multiplication-combined",
    params: {"a":4,"c":4,"p":3},
  },
  {
    id: "addition-multiplication-combined-p04",
    templateId: "addition-multiplication-combined",
    params: {"a":2,"c":2,"p":4},
  },
  {
    id: "addition-multiplication-combined-p05",
    templateId: "addition-multiplication-combined",
    params: {"a":3,"c":3,"p":3},
  },
] as const satisfies readonly VerifiedTemplateSeed[];

export const VERIFIED_TEMPLATE_SEEDS = [
  ...SUM_OF_TWO_DICE_SEEDS,
  ...AT_LEAST_ONE_VIA_COMPLEMENT_SEEDS,
  ...K_HEADS_IN_N_SEEDS,
  ...PICK_K_OF_N_UNORDERED_SEEDS,
  ...CONDITIONAL_BAYES_2X2_SEEDS,
  ...GAMBLER_FALLACY_MC_SEEDS,
  ...SINGLE_EVENT_PROB_SEEDS,
  ...PERMUTATIONS_ARRANGE_K_OF_N_SEEDS,
  ...WITHOUT_REPLACEMENT_TWO_DRAWS_SEEDS,
  ...GEOMETRIC_FIRST_SUCCESS_SEEDS,
  ...BINOMIAL_AT_LEAST_K_SEEDS,
  ...EXPECTED_VALUE_DIE_GAME_SEEDS,
  ...INCLUSION_EXCLUSION_DIVISIBLE_SEEDS,
  ...INCLUSION_EXCLUSION_TWO_EVENTS_SEEDS,
  ...ADDITION_MULTIPLICATION_COMBINED_SEEDS,
] as const satisfies readonly VerifiedTemplateSeed[];

export const VERIFIED_SEED_COUNT_BY_TEMPLATE = VERIFIED_TEMPLATE_SEEDS.reduce(
  (counts, seed) => {
    counts[seed.templateId] = (counts[seed.templateId] ?? 0) + 1;
    return counts;
  },
  {} as Record<VerifiedTemplateId, number>,
);

export const VERIFIED_SEED_COUNT_BY_TOPIC: Partial<Record<Topic, number>> = {};
