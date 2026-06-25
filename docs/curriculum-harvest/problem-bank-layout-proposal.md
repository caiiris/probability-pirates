# Problem Bank Layout Proposal

> **Approved direction (D99, 2026-06-25):** Track 1 runtime templates use topic
> folders under `src/features/practice/templates/<topic>/<id>.ts`, while the
> single WP-3 `TEMPLATES` registry remains flat. See
> [`alternatives.md`](../alternatives.md) D99 and
> [`wp-4-layout-handoff.md`](../specs/wp/wp-4-layout-handoff.md).

## Goals

The bank needs to support two different kinds of practice content:

1. **Track 1 templates** — code-generated, effectively unlimited problems.
   These are the Friday MVP path. Runtime source of truth is `sample -> render ->
   solve -> explain -> simulate`.
2. **Track 2 vetted static problems** — optional later bank of one-off problems
   generated or adapted offline, verified before publish, and stored as static
   records.

Both tracks must expose the same metadata to the practice loop:

- `topic` for topic picker and weak-topic suggestion,
- `skills` for learner-model Engine A mastery updates,
- `retrievalForm` for interleaving,
- `difficulty` for adaptive serving,
- `interactionKind` so the existing renderers can be reused,
- `misconception` metadata where a wrong answer maps to a known misconception,
- verification/provenance so no unvetted answer ships.

## Recommended Runtime Layout

```text
src/features/practice/
  problemBank/
    types.ts
    topics.ts
    registry.ts
    serving.ts
    README.md
  templates/
    complement/
      at-least-one-via-complement.ts
      at-least-one-via-complement.test.ts
    conditional/
      conditional-two-way-table.ts
      conditional-two-way-table.test.ts
      bayes-base-rate-tree.ts
      bayes-base-rate-tree.test.ts
    counting/
      sum-of-two-dice.ts
      sum-of-two-dice.test.ts
    long-run/
      gambler-fallacy-mc.ts
      gambler-fallacy-mc.test.ts
    distributions/
      k-heads-in-n.ts
      k-heads-in-n.test.ts
```

### Why This Shape

- `problemBank/` owns cross-cutting bank concepts: types, topics, registry,
  serving policy.
- `templates/<topic>/` keeps families grouped by Practice topic, matching the
  learner-model `Topic` values.
- Each template has its own test file so work can parallelize by family.
- The registry imports templates from topic folders and flattens them for the
  engine.
- Topic folders prevent `templates/` from becoming an undifferentiated list once
  the course grows past the first six families.

## Review / Harvest Layout

Keep research and review artifacts out of runtime code:

```text
docs/curriculum-harvest/
  generated-problems/
    cl-0001-at-least-one-via-complement.md
    cl-0001-at-least-one-via-complement.json
  template-briefs/
    cl-0001-at-least-one-via-complement.md
  clusters/
    cluster-map.md
```

These are for human review and provenance. They should not be imported by the
app.

## Future Static Bank Layout

Only create this when Track 2 exists:

```text
src/content/practiceProblems/
  complement/
    at-least-one-via-complement.seed.json
  conditional/
    bayes-base-rate-tree.seed.json
  manifest.ts
```

Static problem records should be boring data, not executable solvers. Each record
must include the verification result from the offline pipeline.

```ts
export type StaticPracticeProblem = {
  id: string;
  source: 'template-seed' | 'offline-vetted';
  topic: Topic;
  skills: SkillId[];
  retrievalForm: RetrievalForm;
  difficulty: number;
  interactionKind: Variant['interactionKind'];
  variant: Variant;
  answer: ExactAnswer;
  explanation: { title: string; steps: string[] };
  verification: {
    method: 'exact-enumeration' | 'solver-and-simulation' | 'human-reviewed';
    verifiedAt: string;
    sourceTemplateId?: string;
    sourceCandidateId?: string;
    wordingAuditPassed: boolean;
  };
};
```

## Core Types

`src/features/practice/problemBank/types.ts` should re-export or define the
shared runtime contracts:

```ts
export type ProblemSource = 'template' | 'static-vetted';

export type RetrievalForm = 'definition' | 'operation' | 'procedural' | 'application';

export type PracticeBankEntry = {
  id: string;
  source: ProblemSource;
  topic: Topic;
  skills: SkillId[];
  retrievalForm: RetrievalForm;
  difficulty: number;
  interactionKind: Variant['interactionKind'];
};
```

Templates remain richer than `PracticeBankEntry`:

```ts
export type PracticeTemplate<P = unknown> = PracticeBankEntry & {
  source: 'template';
  sample(rng: Rng): P;
  rate(params: P): number;
  solve(params: P): ExactAnswer;
  render(params: P): Variant;
  explain(params: P): { title: string; steps: string[] };
  simulate?(params: P, trials: number, rng: Rng): number;
};
```

## Topics

`src/features/practice/problemBank/topics.ts` should define the Practice topic
presentation layer separately from the skill taxonomy:

```ts
export const PRACTICE_TOPICS = {
  counting: {
    label: 'Counting',
    description: 'Sample spaces, grids, ordered and unordered outcomes.',
    skillIds: ['sample-space-enumeration', 'equally-likely-outcomes', 'favorable-over-total'],
  },
  complement: {
    label: 'Complements',
    description: 'Use "not" and "at least one" shortcuts.',
    skillIds: ['complement-rule', 'independence'],
  },
  conditional: {
    label: 'Conditional probability',
    description: 'Tables, trees, base rates, and new information.',
    skillIds: ['conditional-probability', 'base-rate', 'monty-hall-reasoning'],
  },
  longRun: {
    label: 'The long run',
    description: 'Simulation, independence, and gambler traps.',
    skillIds: ['long-run-vs-single-trial', 'frequentist-view', 'independence'],
  },
  distributions: {
    label: 'Distributions',
    description: 'Repeated trials and probability models.',
    skillIds: ['binomial-pmf'],
  },
} as const;
```

The values should map back to the closed `SkillId` taxonomy. If a harvested
problem needs a new skill, do not invent it inside the bank; update the taxonomy
through the WP-2 process.

## XP And Mastery

Problem records should **not** decide XP. XP is policy, owned by the practice
loop:

- correct practice attempt -> `grantPracticeXp`,
- daily cap applies globally,
- no streak credit,
- no completed-lesson credit.

Problem records should provide the signals needed by mastery:

- `skills`: learner-model Engine A updates these ratings after practice,
- `difficulty`: Elo expected-score math uses this,
- `misconceptionKey`: optional, only when a wrong answer maps cleanly,
- `topic`: topic state and recent-template avoidance use this.

This keeps content from hard-coding reward policy.

## CL-0001 Placement

If this layout is approved, CL-0001 should land here:

```text
src/features/practice/templates/complement/
  at-least-one-via-complement.ts
  at-least-one-via-complement.test.ts
```

The generated review problems stay here:

```text
docs/curriculum-harvest/generated-problems/
  cl-0001-at-least-one-via-complement.md
  cl-0001-at-least-one-via-complement.json
```

## Approval Questions

1. Should runtime templates be grouped by `topic` folders as proposed, or kept
   flat under `templates/` to match the original WP-4 file pattern?
   - **Decision:** topic folders. The original WP-4 flat path is superseded by
     D99.
2. Should static vetted problems live under `src/content/practiceProblems/` later,
   or under `src/features/practice/staticBank/`?
   - **Recommendation:** `src/content/practiceProblems/`, because static vetted
     problems are curriculum content, not engine code. Track 2 is future work.
3. Should review-generated JSON files remain in `docs/curriculum-harvest/`, or
   should approved review sets be promoted into a committed seed bank?
   - **Recommendation:** keep review JSON in `docs/curriculum-harvest/`; promote
     only intentionally static, product-ready problems later.
4. Should `PRACTICE_TOPICS` use the existing taxonomy topic ids exactly
   (`long-run`) or product-friendly object keys (`longRun`) with ids inside?
   - **Recommendation:** use exact taxonomy ids in data (`long-run`) to avoid
     aliasing bugs; UI can map labels separately.

