/**
 * Template contract for the probability practice engine.
 *
 * Implements C5 from docs/specs/wp/wp-contracts.md.
 * Owned by WP-3; implemented by WP-4 families; consumed by WP-6 (UI).
 *
 * IMPORTANT — Elo scale constraint for WP-4 authors:
 *   `rate(params)` MUST return a value on the same Elo scale as learner ratings.
 *   Valid range: ~700 (very easy) to ~2000 (very hard). Default learner rating: 1000.
 *   The adaptive engine uses this to match problem difficulty to learner ability.
 *   Do NOT return raw percentages, z-scores, or arbitrary integers here.
 */

import type { Variant } from '@/content/types';
import type { SkillId, Topic } from '@/content/skills';
import type { ExactAnswer } from '@/lib/probability/exact';
import type { Rng } from '@/lib/simulations';

export type { ExactAnswer, Rng };

// ---------------------------------------------------------------------------
// RetrievalForm — cognitive kind of the question (C5)
// ---------------------------------------------------------------------------

/**
 * The retrieval form classifies the cognitive demand of a practice question:
 * - 'definition'   — recall or recognise a concept ("What is a sample space?")
 * - 'operation'    — apply a single rule or formula ("Compute 5C2")
 * - 'procedural'   — multi-step procedure ("Find P(A∩B) using the multiplication rule")
 * - 'application'  — contextual word problem requiring problem setup
 */
export type RetrievalForm = 'definition' | 'operation' | 'procedural' | 'application';

// ---------------------------------------------------------------------------
// Template<P> — the frozen contract every WP-4 family must satisfy (C5)
// ---------------------------------------------------------------------------

export type Template<P = unknown> = {
  /** Kebab-case; unique across all templates in the TEMPLATES registry. */
  id: string;

  /** The probability topic this template belongs to (from TOPICS). */
  topic: Topic;

  /** Skill ids this template exercises. Must have at least one entry; each must exist in SKILLS. */
  skills: SkillId[];

  /** Cognitive retrieval form of the question. */
  retrievalForm: RetrievalForm;

  /**
   * Difficulty on the Elo scale shared with learner ratings (see C7).
   * Range: ~700 (very easy) to ~2000 (very hard); default learner rating is 1000.
   * WP-4 authors: this MUST stay on the Elo scale — see file-level comment.
   */
  rate(params: P): number;

  /**
   * Draw a valid parameter set deterministically from the supplied rng.
   * Must be pure and reproducible: same rng sequence → same params.
   */
  sample(rng: Rng): P;

  /**
   * The deterministic correct answer. SINGLE SOURCE OF TRUTH for correctness.
   * `render` must derive its correctness fields from this, never independently.
   */
  solve(params: P): ExactAnswer;

  /**
   * Build a Variant for the existing renderers.
   * MUST derive all correctness fields (correctOptionId / numerator+denominator /
   * etc.) from `solve(params)` so the rendered problem and the solver never disagree.
   */
  render(params: P): Variant;

  /** Worked solution in the DerivationCard shape. */
  explain(params: P): { title: string; steps: string[] };

  /**
   * Monte-Carlo estimator. REQUIRED for templates whose answer is a probability
   * (so the vetting test in WP-1 can cross-check exact vs. simulated).
   * OMIT for purely combinatorial-count or conceptual-choice templates
   * (those are vetted by exact enumeration / structural assertions instead).
   */
  simulate?(params: P, trials: number, rng: Rng): number;
};
