# Phase 2 — Frozen Interface Contracts

> **This file is the de-coupler.** Every work package (WP) builds against the signatures here, NOT against another WP's implementation. As long as a WP honors these exact types, the WPs can be built in any order / in parallel / by different agents without blocking each other.
>
> **Rule for implementers:** treat every signature in this file as frozen. If you believe a contract must change, STOP and log it in [`README.md`](README.md) §"Open questions" and consult the owner — do not silently diverge, or you will break a sibling WP.
>
> Companion specs: [`prd-phase2`](../../prd-phase2.md), [`spec-practice`](../spec-practice.md), [`spec-learner-model`](../spec-learner-model.md), [`spec-ai-assist`](../spec-ai-assist.md).

---

## C0. Conventions

- TypeScript strict mode (matches the repo). No `any` in exported signatures.
- Pure logic is framework-free (no React, no Firebase imports) so it is unit-testable in Vitest.
- Reuse existing primitives — do **not** re-implement:
  - `Rng` + `mulberry32(seed)` from [`src/lib/simulations.ts`](../../../src/lib/simulations.ts).
  - `fnv1a32(string)` from [`src/lib/hash.ts`](../../../src/lib/hash.ts).
  - `AttemptPayload` from [`src/features/progress/progressService.ts`](../../../src/features/progress/progressService.ts).
  - The interaction renderers in `src/features/lesson/interactions/*` and their `InteractionProps<V>`.
  - `grantPracticeXp` from [`src/lib/practiceXp.ts`](../../../src/lib/practiceXp.ts).

```ts
// Reused as-is (already exists):
export type Rng = () => number;                 // src/lib/simulations.ts
export function mulberry32(seed: number): Rng;  // src/lib/simulations.ts
```

---

## C1. Exact arithmetic (owned by WP-1, consumed by WP-3, WP-4)

File: `src/lib/probability/exact.ts`

```ts
/** Exact rational. Always stored reduced; `den > 0`. */
export type Fraction = { num: bigint; den: bigint };

/** Construct a reduced fraction. Throws if den === 0. Normalizes sign to numerator. */
export function frac(num: bigint | number, den?: bigint | number): Fraction;

/** Reduce to lowest terms (gcd), normalize sign. */
export function reduce(f: Fraction): Fraction;

export function addF(a: Fraction, b: Fraction): Fraction;
export function subF(a: Fraction, b: Fraction): Fraction;
export function mulF(a: Fraction, b: Fraction): Fraction;
export function divF(a: Fraction, b: Fraction): Fraction;

/** Structural equality after reduction (3/6 === 1/2). */
export function eqF(a: Fraction, b: Fraction): boolean;

/** For tolerance comparisons against Monte-Carlo estimates. */
export function toNumber(f: Fraction): number;

/** Combinatorics over bigint (exact). Throw on negative / n < k. */
export function factorial(n: number): bigint;
export function nPr(n: number, r: number): bigint;
export function nCr(n: number, r: number): bigint;
```

## C2. ExactAnswer (owned by WP-1, consumed by WP-3, WP-4, WP-6)

File: `src/lib/probability/exact.ts` (same file as C1).

```ts
export type ExactAnswer =
  | { kind: 'int'; value: number }
  | { kind: 'fraction'; value: Fraction }      // reduced
  | { kind: 'choice'; optionId: string };
```

---

## C3. Skill & misconception taxonomy (owned by WP-2, consumed by WP-3, WP-4, WP-5, WP-7)

File: `src/content/skills.ts`

```ts
export const SKILLS = {
  'sample-space-enumeration': { label: 'Listing outcomes',          topic: 'counting' },
  'equally-likely-outcomes':  { label: 'Equally likely outcomes',   topic: 'counting' },
  'favorable-over-total':     { label: 'Favorable / total',         topic: 'counting' },
  'long-run-vs-single-trial': { label: 'Long-run vs single trial',  topic: 'long-run' },
  'frequentist-view':         { label: 'Probability as a share',    topic: 'long-run' },
  'multiplication-principle': { label: 'Multiplication principle',  topic: 'counting' },
  'ordered-vs-unordered':     { label: 'Ordered vs unordered',      topic: 'counting' },
  'permutations':             { label: 'Permutations',              topic: 'counting' },
  'combinations':             { label: 'Combinations',              topic: 'counting' },
  'complement-rule':          { label: 'Complement rule',           topic: 'complement' },
  'independence':             { label: 'Independence',              topic: 'complement' },
  'birthday-paradox':         { label: 'Birthday paradox',          topic: 'counting' },
  'conditional-probability':  { label: 'Conditional probability',   topic: 'conditional' },
  'base-rate':                { label: 'Base rates',                topic: 'conditional' },
  'monty-hall-reasoning':     { label: 'Monty Hall reasoning',      topic: 'conditional' },
  'binomial-pmf':             { label: 'Binomial distribution',     topic: 'distributions' },
} as const;

export type SkillId = keyof typeof SKILLS;
export type Topic = (typeof SKILLS)[SkillId]['topic'];
export const TOPICS = ['counting', 'long-run', 'complement', 'conditional', 'distributions'] as const;
```

File: `src/content/misconceptions.ts`

```ts
export const MISCONCEPTIONS = {
  gambler:              { label: "Gambler's fallacy",                 relatedSkills: ['long-run-vs-single-trial', 'independence'] },
  ordered_vs_unordered: { label: 'Treats unordered as ordered',       relatedSkills: ['ordered-vs-unordered', 'combinations'] },
  conjunction:          { label: 'Conjunction fallacy',               relatedSkills: ['independence'] },
  base_rate_neglect:    { label: 'Ignores the base rate',             relatedSkills: ['base-rate', 'conditional-probability'] },
  complement_inversion: { label: 'Confuses event with complement',    relatedSkills: ['complement-rule'] },
} as const;

export type MisconceptionKey = keyof typeof MISCONCEPTIONS;
```

## C4. Content-model additions (owned by WP-2, consumed by WP-2T, WP-4, WP-5)

Edits to [`src/content/types.ts`](../../../src/content/types.ts). **Additive and optional — must not break existing lessons.**

```ts
// Added to BaseVariant:
  /** Phase 2 — skill ids this variant exercises (learner model). Optional during migration. */
  skills?: SkillId[];

// Added to MultipleChoiceVariant:
  /** Phase 2 — maps a wrong option id to a misconception key (learner model). */
  misconceptionByOption?: Record<string, MisconceptionKey>;
```

`SkillId` / `MisconceptionKey` imported from `@/content/skills` and `@/content/misconceptions`.

---

## C5. Template contract (owned by WP-3, implemented by WP-4, consumed by WP-6)

File: `src/features/practice/templates/types.ts`

```ts
import type { Variant } from '@/content/types';
import type { SkillId, Topic } from '@/content/skills';
import type { ExactAnswer, Rng } from '...'; // see C1/C0

export type RetrievalForm = 'definition' | 'operation' | 'procedural' | 'application';

export type Template<P = unknown> = {
  id: string;                         // kebab-case, unique across all templates
  topic: Topic;
  skills: SkillId[];                  // >= 1; must exist in SKILLS
  retrievalForm: RetrievalForm;

  /** Difficulty on the SAME Elo scale as learner ratings (see C7). Range ~700-2000. */
  rate(params: P): number;

  /** Draw a valid params set deterministically from rng. */
  sample(rng: Rng): P;

  /** The deterministic correct answer. SINGLE SOURCE OF TRUTH. */
  solve(params: P): ExactAnswer;

  /**
   * Build a Variant for the existing renderers. MUST derive its correctness
   * fields (correctOptionId / numerator+denominator / etc.) from `solve(params)`
   * so the rendered problem and the solver never disagree.
   */
  render(params: P): Variant;

  /** Worked solution (reuses the D77 derivation shape). */
  explain(params: P): { title: string; steps: string[] };

  /**
   * Monte-Carlo estimator. REQUIRED for templates whose answer is a probability
   * (so the vetting test can cross-check). OMIT for purely combinatorial-count
   * or conceptual-choice templates (those are vetted by exact enumeration /
   * structural assertions instead).
   */
  simulate?(params: P, trials: number, rng: Rng): number;
};
```

## C6. PracticeInstance + engine (owned by WP-3, consumed by WP-6)

File: `src/features/practice/practiceEngine.ts`

```ts
export type PracticeInstance = {
  instanceId: string;        // `${templateId}:${fnv1a32(JSON.stringify(params))}`
  templateId: string;
  topic: Topic;
  skills: SkillId[];
  difficulty: number;        // = template.rate(params), Elo scale
  variant: Variant;          // ready for the existing renderers + checkAnswer
  answer: ExactAnswer;       // = template.solve(params); single source of truth
  explanation: { title: string; steps: string[] };
};

/** Convert a solved answer into the AttemptPayload the variant expects (for grading + vetting). */
export function answerToPayload(answer: ExactAnswer, variant: Variant): AttemptPayload;

/** Generate one ready-to-serve problem from a template using rng. */
export function generateInstance(template: Template, rng: Rng): PracticeInstance;

/**
 * Pick the next template for a learner. Prefers `rate` in
 * [rating-50, rating+100] for the chosen topic; widens if none fit; avoids
 * templates in `recentTemplateIds`. `ratingByTopic` defaults to 1000.
 */
export function pickNextTemplate(input: {
  topic: Topic;
  ratingForTopic: number;
  recentTemplateIds: string[];
  rng: Rng;
}): Template;

/** All registered templates (WP-4 files register here). */
export const TEMPLATES: Template[];
```

## C7. Learner model — TWO ENGINES (owned by WP-5, consumed by WP-3 serving, WP-6, WP-7, WP-9)

> **Two-engine design (owner decision, README open-question #7):**
> - **Engine A — Mastery rating (Elo).** Updated ONLY by **practice** attempts (deliberate retrieval). Drives adaptive difficulty + topic targeting.
> - **Engine B — Exposure / struggle / misconceptions.** Updated by **lesson first-attempt** outcomes (review excluded, first committed attempt per slot only). Powers the lesson report card (WP-9), hint targeting, and the "Introduced vs Practiced" Strengths view. **Engine B never moves the Elo `rating`.**

File: `src/features/learner/learnerModelService.ts` (Firestore writer) + `src/features/learner/learnerModel.ts` (pure math).

```ts
// Pure (learnerModel.ts):
export const DEFAULT_RATING = 1000;
export const ELO_K = 24;
export const ACC_ALPHA = 0.2;

/** Engine A — per-skill mastery, from PRACTICE only. */
export type SkillStat = {
  rating: number; attempts: number; correct: number;
  recentCorrect: number;            // [0,1], exp-decayed
  lastSeenAt: number; firstSeenAt: number;  // epoch ms
};

/** Engine B — per-skill exposure, from LESSONS only. */
export type ExposureStat = {
  introducedAt: number;             // epoch ms of first lesson encounter
  lessonFirstTries: number;         // count of first-attempts seen in lessons
  lessonFirstTryStruggles: number;  // first-attempt-wrong count (struggle flag)
  lastSeenAt: number;
};

export type LearnerModel = {
  skills: Partial<Record<SkillId, SkillStat>>;          // Engine A (practice)
  exposure: Partial<Record<SkillId, ExposureStat>>;     // Engine B (lessons)
  misconceptions: Partial<Record<MisconceptionKey, { count: number; lastSeenAt: number }>>;
  weakestSkills: SkillId[];   // top 3 PRACTICED skills by lowest rating (Engine A only)
  strongestSkills: SkillId[]; // top 3 PRACTICED skills by highest rating (Engine A only)
  updatedAt: number;
};

export function emptyModel(now: number): LearnerModel;

/** Engine A — apply one PRACTICE attempt (moves Elo). Pure; deterministic given `now`. */
export function applyPracticeAttempt(model: LearnerModel, input: {
  skills: SkillId[];
  wasCorrect: boolean;
  difficulty?: number;          // defaults to DEFAULT_RATING
  misconceptionKey?: MisconceptionKey | null;
  now: number;
}): LearnerModel;

/** Engine B — apply one LESSON first-attempt outcome (exposure + struggle + misconception). NEVER moves Elo. Pure. */
export function applyLessonExposure(model: LearnerModel, input: {
  skills: SkillId[];
  firstTryCorrect: boolean;
  misconceptionKey?: MisconceptionKey | null;
  now: number;
}): LearnerModel;

// Firestore (learnerModelService.ts) — best-effort, never throws:
export function recordPracticeAttempt(uid: string, input: {
  skills: SkillId[]; wasCorrect: boolean; difficulty?: number;
  misconceptionKey?: MisconceptionKey | null;
}): Promise<void>;

export function recordLessonExposure(uid: string, input: {
  skills: SkillId[]; firstTryCorrect: boolean; misconceptionKey?: MisconceptionKey | null;
}): Promise<void>;

export function subscribeLearnerModel(uid: string, cb: (m: LearnerModel | null) => void): () => void;
```

### C7b. Lesson report-card data (owned by WP-9, produced in the lesson session)

The report card is computed from the lesson session's in-memory first-attempt results (no model read required). Shape passed to the celebration screen:

```ts
export type SlotFirstTry = {
  slotId: string;
  skills: SkillId[];
  firstTryCorrect: boolean;
  misconceptionKey?: MisconceptionKey;
};

export type LessonReportCard = {
  lessonId: string;
  nailed: SkillId[];        // skills whose slots were all first-try-correct
  review: SkillId[];        // skills with >= 1 first-try miss
  misconceptions: MisconceptionKey[];
};

/** Pure: fold a lesson's first-try results into a report card. */
export function buildReportCard(lessonId: string, results: SlotFirstTry[]): LessonReportCard;
```

## C8. Firestore paths (owned by WP-8; consumed by WP-5, WP-6)

```
users/{uid}/learnerModel/state         // single doc, owner-only r/w
users/{uid}/practiceState/{topicId}    // { rating, attempts, correct, lastSeenTemplateIds[], updatedAt }
users/{uid}/practiceXp/today           // { date, earnedToday }  (PracticeXpState from practiceXp.ts)
```

All owner-only, mirroring the existing `lessonProgress` / `stepAttempts` rules.

## C9. Reuse map (do not re-implement)

| Need | Use | Location |
| --- | --- | --- |
| Grade an answer payload | `checkAnswer(variant, payload)` | `src/lib/checkAnswer.ts` **(after WP-0 relocation)** |
| Render an interaction | the kind's component + `InteractionProps<V>` | `src/features/lesson/interactions/*` |
| Worked solution UI | `DerivationCard` (`{ derivation: { title, steps } }`) | `src/features/lesson/DerivationCard.tsx` |
| Feedback tray UI | `LessonFooter` | `src/features/lesson/LessonFooter.tsx` |
| Slot feedback state machine | `useSlotState` | `src/features/lesson/useSlotState.ts` |
| Practice XP cap | `grantPracticeXp` | `src/lib/practiceXp.ts` |
| Seeded RNG | `mulberry32` | `src/lib/simulations.ts` |
| Monte-Carlo generators | coin/die/birthday | `src/lib/simulations.ts` |
| String hash | `fnv1a32` | `src/lib/hash.ts` |
