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
import { gamblerFallacyMcTemplate } from './long-run/gambler-fallacy-mc';
import type { Template } from './types';

/** All WP-4 template families, in the order they were implemented. */
export const ALL_TEMPLATES: Template[] = [
  sumOfTwoDiceTemplate,
  atLeastOneViaComplementTemplate,
  kHeadsInNTemplate,
  pickKOfNUnorderedTemplate,
  conditionalBayes2x2Template,
  gamblerFallacyMcTemplate,
];
