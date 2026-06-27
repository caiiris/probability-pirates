/**
 * Conceptual practice — pure logic for the two-part (answer + why) problems.
 *
 * Correctness split (F2): Part 1 (the answer) is graded HERE, in code, by exact
 * value; it is the only thing that moves mastery/XP. Part 2 (the "why") is
 * graded by the LLM against a closed rubric/misconception set in /api/hint and
 * only ever *reduces* XP and feeds the misconception signal — never certifies
 * the number. No React, no Firebase.
 */

import { frac, eqF, toNumber } from '@/lib/probability/exact';
import type { ExactAnswer } from '@/lib/probability/exact';
import type { Rng } from '@/lib/simulations';
import type { Topic } from '@/content/skills';
import { conceptualProblems } from '@/content/conceptual/problems';
import type { ConceptualProblem } from '@/content/conceptual/types';

/** Floating-point slack for comparing equivalent exact forms (1/2 == 2/4 == 0.5). */
const EPS = 1e-9;

type Parsed = { kind: 'fraction'; num: number; den: number } | { kind: 'number'; value: number };

/**
 * Parse a learner's Part-1 answer string into a comparable value, accepting
 * fractions ("3/6"), integers ("10"), and decimals ("0.5"). Returns null when
 * the input is empty or not a recognisable number.
 */
export function parseAnswerString(raw: string): Parsed | null {
  const s = raw.trim();
  if (s === '') return null;

  const fractionMatch = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(s);
  if (fractionMatch) {
    const num = Number(fractionMatch[1]);
    const den = Number(fractionMatch[2]);
    if (den === 0) return null;
    return { kind: 'fraction', num, den };
  }

  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) {
    return { kind: 'number', value: Number(s) };
  }

  return null;
}

/** The numeric value of an exact answer (for tolerant comparison). */
function answerToNumber(answer: ExactAnswer): number | null {
  switch (answer.kind) {
    case 'fraction':
      return toNumber(answer.value);
    case 'int':
      return answer.value;
    case 'choice':
      return null; // conceptual problems never use choice answers
  }
}

/**
 * Grade Part 1 against the code-verified answer, accepting any equivalent form.
 * Pure value comparison: "1/2", "2/4", and "0.5" all match a 1/2 answer.
 */
export function gradeConceptualAnswer(answer: ExactAnswer, raw: string): boolean {
  const parsed = parseAnswerString(raw);
  if (!parsed) return false;

  // Exact rational vs rational when both sides are fractions.
  if (answer.kind === 'fraction' && parsed.kind === 'fraction') {
    return eqF(answer.value, frac(parsed.num, parsed.den));
  }

  const target = answerToNumber(answer);
  if (target === null) return false;

  const value = parsed.kind === 'fraction' ? parsed.num / parsed.den : parsed.value;
  return Math.abs(value - target) < EPS;
}

// ── Reasoning (Part 2) → XP penalty ─────────────────────────────────────────────

/**
 * XP multiplier applied when the LLM flags the reasoning. A code-correct answer
 * still earns mastery and *some* XP, but a flagged "why" costs half — "right
 * number, shaky reason". Only the confident negative classifications penalize;
 * 'correct-reasoning' and an absent/unjudged classification (AI off, fallback)
 * never reduce XP, so we never punish on no signal.
 */
export const REASONING_PENALTY = 0.5;

export function reasoningMultiplier(classification: string | null | undefined): number {
  if (classification === 'misconception' || classification === 'irrelevant') {
    return REASONING_PENALTY;
  }
  return 1;
}

// ── Serving ─────────────────────────────────────────────────────────────────────

/**
 * Pick a conceptual problem for `topic`, avoiding recently-served ids. Returns
 * null when the topic has no conceptual problems (the loop then stays on
 * template problems for that topic).
 */
export function pickConceptualProblem(input: {
  topic: Topic;
  recentIds: string[];
  rng: Rng;
}): ConceptualProblem | null {
  const forTopic = conceptualProblems.filter((p) => p.topic === input.topic);
  if (forTopic.length === 0) return null;

  let pool = forTopic.filter((p) => !input.recentIds.includes(p.id));
  if (pool.length === 0) pool = forTopic;

  return pool[Math.floor(input.rng() * pool.length)];
}
