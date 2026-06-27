/**
 * Practice engine — instance generation, answer normalisation, and adaptive
 * template selection.
 *
 * Implements contract C6 from docs/specs/wp/wp-contracts.md.
 * Owned by WP-3; consumed by WP-6 (UI) and the WP-1 vetting harness.
 *
 * Pure TypeScript — no React, no Firebase.
 */

import type { Variant } from '@/content/types';
import type { Topic } from '@/content/skills';
import type { ExactAnswer } from '@/lib/probability/exact';
import type { AttemptPayload } from '@/features/progress/progressService';
import type { Rng } from '@/lib/simulations';
import { fnv1a32 } from '@/lib/hash';
import type { Template } from './templates/types';
import type { SkillId } from '@/content/skills';
import { ALL_TEMPLATES } from './templates/index';

// ---------------------------------------------------------------------------
// PracticeInstance (C6)
// ---------------------------------------------------------------------------

export type PracticeInstance = {
  /** `${templateId}:${fnv1a32(JSON.stringify(params))}` */
  instanceId: string;
  templateId: string;
  topic: Topic;
  skills: SkillId[];
  /** Difficulty on the Elo scale (~700-2000). Equal to template.rate(params). */
  difficulty: number;
  /** Ready for the existing interaction renderers and checkAnswer. */
  variant: Variant;
  /** The single source of truth for the correct answer. Equal to template.solve(params). */
  answer: ExactAnswer;
  explanation: { title: string; steps: string[] };
};

// ---------------------------------------------------------------------------
// answerToPayload (C6)
//
// Mapping summary:
//   ExactAnswer kind  | variant interactionKind      | AttemptPayload produced
//   ------------------|------------------------------|-----------------------------------
//   'choice'          | any                          | { optionId: answer.optionId }
//   'fraction'        | any                          | { numerator: Number(num), denominator: Number(den) }
//   'int'             | 'number-fill'                | { value: v }
//   'int'             | 'fill-fraction'              | { numerator: v, denominator: 1 }
//   'int'             | 'multiple-choice'            | throws — templates MUST use 'choice' for MC
//   'int'             | anything else                | throws — unsupported combination
// ---------------------------------------------------------------------------

/**
 * Convert a solved `ExactAnswer` into the `AttemptPayload` that the given
 * `variant` expects, for use with `checkAnswer` (grading) and the WP-1
 * vetting harness.
 */
export function answerToPayload(answer: ExactAnswer, variant: Variant): AttemptPayload {
  switch (answer.kind) {
    case 'choice':
      return { optionId: answer.optionId };

    case 'fraction':
      return {
        numerator: Number(answer.value.num),
        denominator: Number(answer.value.den),
      };

    case 'int': {
      if (variant.interactionKind === 'number-fill') {
        // Free-response integer input — graded by exact equality.
        return { value: answer.value };
      }
      if (variant.interactionKind === 'fill-fraction') {
        // An integer count v maps to the fraction v/1 for the fill-fraction renderer.
        return { numerator: answer.value, denominator: 1 };
      }
      if (variant.interactionKind === 'multiple-choice') {
        throw new Error(
          `answerToPayload: 'int' answer kind is not valid for 'multiple-choice' variants. ` +
            `Templates must use { kind: 'choice', optionId } for multiple-choice problems.`,
        );
      }
      throw new Error(
        `answerToPayload: 'int' answer kind has no mapping for variant interactionKind '${variant.interactionKind}'. ` +
          `Use 'fill-fraction' (produces numerator/1) or 'choice' for other renderers.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// generateInstance (C6)
// ---------------------------------------------------------------------------

/**
 * Generate one ready-to-serve practice problem from a template using the
 * supplied rng. The rng is consumed deterministically: `sample` → `solve` →
 * `render` → `explain`. The `instanceId` is stable for the same params
 * regardless of which rng produced them.
 */
export function generateInstance<P>(template: Template<P>, rng: Rng): PracticeInstance {
  const params = template.sample(rng);
  const answer = template.solve(params);
  const variant = template.render(params);
  const explanation = template.explain(params);
  const difficulty = template.rate(params);
  const instanceId = `${template.id}:${fnv1a32(JSON.stringify(params))}`;

  return {
    instanceId,
    templateId: template.id,
    topic: template.topic,
    skills: template.skills,
    difficulty,
    variant,
    answer,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// pickNextTemplate (C6)
// ---------------------------------------------------------------------------

/**
 * Pick the next template for a learner.
 *
 * Algorithm:
 * 1. Candidates = templates for `topic` that are NOT in `recentTemplateIds`.
 * 2. If empty (all topic templates recently seen), fall back to the full topic set.
 * 3. For each candidate, sample params once to get a representative difficulty.
 * 4. Keep candidates with difficulty in [ratingForTopic-50, ratingForTopic+100].
 * 5. If empty, widen the window by ±100 repeatedly until non-empty or the
 *    window spans the full difficulty range of the candidates.
 * 6. Pick uniformly at random via rng.
 *
 * Throws if no templates are registered for the requested topic.
 */
export function pickNextTemplate(input: {
  topic: Topic;
  ratingForTopic: number;
  recentTemplateIds: string[];
  rng: Rng;
}): Template {
  const { topic, ratingForTopic, recentTemplateIds, rng } = input;

  // Step 1: exclude recently-seen templates
  let candidates: Template[] = TEMPLATES.filter(
    (t) => t.topic === topic && !recentTemplateIds.includes(t.id),
  );

  // Step 2: fall back to the full topic set if all were recently seen
  if (candidates.length === 0) {
    candidates = TEMPLATES.filter((t) => t.topic === topic);
  }

  if (candidates.length === 0) {
    throw new Error(
      `pickNextTemplate: no templates found for topic "${topic}". ` +
        `Register at least one template in TEMPLATES before calling this function.`,
    );
  }

  // Step 3: sample a representative difficulty for each candidate
  const withDiff = candidates.map((t) => ({
    template: t,
    difficulty: t.rate(t.sample(rng)),
  }));

  // Step 4-5: window-based filtering with progressive widening
  const minDiff = Math.min(...withDiff.map((c) => c.difficulty));
  const maxDiff = Math.max(...withDiff.map((c) => c.difficulty));

  let lo = ratingForTopic - 50;
  let hi = ratingForTopic + 100;
  let inWindow = withDiff.filter((c) => c.difficulty >= lo && c.difficulty <= hi);

  // Widen until non-empty or the window covers the full candidate difficulty range
  while (inWindow.length === 0 && !(lo <= minDiff && hi >= maxDiff)) {
    lo -= 100;
    hi += 100;
    inWindow = withDiff.filter((c) => c.difficulty >= lo && c.difficulty <= hi);
  }

  // If still empty (all difficulties outside even the full-coverage window — shouldn't
  // be reachable after loop exits, but guard for safety), use the full candidate pool.
  const pool = inWindow.length > 0 ? inWindow : withDiff;

  // Step 6: uniform random pick
  const idx = Math.floor(rng() * pool.length);
  return pool[idx].template;
}

// ---------------------------------------------------------------------------
// TEMPLATES registry (C6)
// ---------------------------------------------------------------------------

/**
 * All registered practice templates.
 * WP-4 family files each export a Template and append it here when they land.
 * Starts empty so WP-3 is buildable before any WP-4 content exists.
 *
 * WP-4 authors: push your exported template(s) into this array at module load.
 * Example (in a WP-4 file):
 *   import { TEMPLATES } from '@/features/practice/practiceEngine';
 *   TEMPLATES.push(myTemplate);
 */
// WP-4 families are registered here via the templates/index.ts barrel.
export const TEMPLATES: Template[] = [];
TEMPLATES.push(...ALL_TEMPLATES);
