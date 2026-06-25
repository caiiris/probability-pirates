# WP-4 Handoff — Template Layout Conflict + Resolution

> Send this to the WP-4 implementation agent before it starts authoring practice
> template families. This document explains a small but important layout mismatch
> between the original WP-4 instructions and the approved problem-bank direction.
> Formal decision: alternatives **D99**.

## Executive Summary

WP-4's current behavior contract is still correct: implement practice `Template`s
that satisfy C5, test them with the WP-1 vetting helpers, and register them in
WP-3's `TEMPLATES` registry.

The only conflict is file layout:

- **WP-4 currently says:** put each family directly under
  `src/features/practice/templates/<id>.ts`.
- **Approved problem-bank direction says:** group runtime templates by topic:
  `src/features/practice/templates/<topic>/<id>.ts`.

This is **not** a frozen-contract conflict. It is an implementation-layout
conflict. The path of least resistance is to update WP-4 to use topic folders
while keeping C5/C6 untouched.

## What WP-4 Is Actually Responsible For

Read these first:

- `docs/specs/wp/wp-contracts.md` C5 and C6
- `docs/specs/wp/wp-3-template-engine.md`
- `docs/specs/wp/wp-4-template-families.md`
- `docs/specs/spec-practice.md` "Template schema" and "First template families"

WP-4 owns the six initial practice families:

| Template id | Topic | Skills | Retrieval form | Interaction |
| --- | --- | --- | --- | --- |
| `sum-of-two-dice` | `counting` | `sample-space-enumeration`, `equally-likely-outcomes` | operation | fill-fraction |
| `at-least-one-via-complement` | `complement` | `complement-rule`, `independence` | procedural | fill-fraction |
| `k-heads-in-n` | `distributions` | `binomial-pmf`, `independence` | operation | fill-fraction |
| `pick-k-of-n-unordered` | `counting` | `ordered-vs-unordered`, `combinations` | definition | multiple-choice |
| `conditional-bayes-2x2` | `conditional` | `conditional-probability`, `base-rate` | application | fill-fraction |
| `gambler-fallacy-mc` | `long-run` | `long-run-vs-single-trial`, `independence` | definition | multiple-choice |

For each family, WP-4 must:

1. Export a `Template` matching C5.
2. Implement deterministic `sample`, `rate`, `solve`, `render`, `explain`, and
   `simulate` where required.
3. Ensure `render(params)` derives answer fields from `solve(params)`, never from
   duplicated hardcoded answer values.
4. Add a sibling test that calls `expectTemplateAgrees` or the proper exact /
   structural verifier.
5. Register the template in WP-3's single `TEMPLATES` registry.
6. Avoid React, Firebase, or UI implementation work.

## The Conflict

`wp-4-template-families.md` currently says:

```text
src/features/practice/templates/<id>.ts
src/features/practice/templates/<id>.test.ts
```

The approved bank layout proposal says:

```text
src/features/practice/templates/<topic>/<id>.ts
src/features/practice/templates/<topic>/<id>.test.ts
```

Example:

```text
src/features/practice/templates/complement/at-least-one-via-complement.ts
src/features/practice/templates/complement/at-least-one-via-complement.test.ts
```

If WP-4 follows its original flat path, it will still compile, but it will diverge
from the problem-bank organization we want before the bank even starts. Later
agents will either add topic folders anyway or spend time moving files after tests
and imports already exist.

## Why This Does Not Break Frozen Contracts

C5 defines the `Template` shape. It does **not** require a flat file path.

C6 defines `PracticeInstance`, `generateInstance`, `pickNextTemplate`, and the
`TEMPLATES` registry. It does **not** require templates to live at a specific path.

WP-3's registry can import from either:

```ts
import { atLeastOneViaComplement } from './templates/at-least-one-via-complement';
```

or:

```ts
import { atLeastOneViaComplement } from './templates/complement/at-least-one-via-complement';
```

The runtime behavior is identical as long as the exported template object matches
C5 and is included in `TEMPLATES`.

## Path Of Least Resistance Resolution

Update WP-4's implementation path, not the contracts. This is the approved D99
resolution.

Use this layout:

```text
src/features/practice/templates/
  counting/
    sum-of-two-dice.ts
    sum-of-two-dice.test.ts
    pick-k-of-n-unordered.ts
    pick-k-of-n-unordered.test.ts
  complement/
    at-least-one-via-complement.ts
    at-least-one-via-complement.test.ts
  conditional/
    conditional-bayes-2x2.ts
    conditional-bayes-2x2.test.ts
  distributions/
    k-heads-in-n.ts
    k-heads-in-n.test.ts
  long-run/
    gambler-fallacy-mc.ts
    gambler-fallacy-mc.test.ts
```

Keep WP-3's single registry:

```text
src/features/practice/practiceEngine.ts
```

The registry should import from the topic folders and flatten into:

```ts
export const TEMPLATES: Template[] = [
  sumOfTwoDice,
  atLeastOneViaComplement,
  kHeadsInN,
  pickKOfNUnordered,
  conditionalBayes2x2,
  gamblerFallacyMc,
];
```

Do **not** create multiple registries per topic for v1. One registry keeps WP-6's
serving logic simple and unchanged.

## Why Topic Folders Are Better

Topic folders are better than the current flat WP-4 layout because:

- They match the learner-model topic groups: `counting`, `long-run`,
  `complement`, `conditional`, `distributions`.
- They scale beyond six templates. The harvest pipeline already has 20+ clusters;
  a flat `templates/` folder will become noisy quickly.
- They reduce parallel-agent collisions. Agents can work inside separate topic
  folders and only coordinate when updating the single registry.
- They make review easier. A reviewer can inspect all complement families or all
  conditional families together.
- They prepare for future static bank content without changing runtime contracts.

The current flat layout is only simpler for the first six files. It gets worse as
soon as CL-0002, CL-0003, and later harvested families land.

## What To Update Before Coding

Before implementing any templates, update these docs so future agents do not
fight each other:

1. `docs/specs/wp/wp-4-template-families.md`
   - Change the shared file rule from:
     `src/features/practice/templates/<id>.ts`
   - To:
     `src/features/practice/templates/<topic>/<id>.ts`
   - Add the topic-folder tree shown above.
   - Keep the rule that every family has a sibling test.
   - Keep the rule that every family registers in WP-3's `TEMPLATES`.

2. `docs/specs/spec-practice.md`
   - Replace references to `src/features/practice/templates/*.ts` with
     `src/features/practice/templates/<topic>/<id>.ts`.
   - In "Each family file pattern", mention topic folders.

3. Optional but recommended: `docs/curriculum-harvest/problem-bank-layout-proposal.md`
   - Mark the topic-folder decision as approved once the owner confirms.

Do not edit `wp-contracts.md` for this layout change. C5/C6 remain correct.

## Guardrails For Not Breaking Other Work

### Do Not Change C5/C6

Do not change `Template`, `PracticeInstance`, `answerToPayload`,
`generateInstance`, `pickNextTemplate`, or `TEMPLATES` signatures.

Any change there affects WP-3, WP-4, WP-6, and tests.

### Do Not Change Skill IDs

Use the existing closed taxonomy from `src/content/skills.ts`:

- `counting`
- `long-run`
- `complement`
- `conditional`
- `distributions`

If a harvested template seems to need a new skill id, stop and log it. Do not add
skills from inside WP-4.

### Do Not Move Existing Lesson Code

WP-4 is practice-template content only. Do not edit:

- `src/content/lessons/*`
- lesson renderers
- progress persistence
- learner-model services
- Firestore rules

### Do Not Wire UI

WP-4 should not unlock `/practice` or change `PracticePage`. WP-6 owns the
practice loop UI.

### Do Not Create Static Bank Runtime Yet

The proposed `src/content/practiceProblems/` static bank is Track 2 future work.
WP-4 is Track 1 templates only.

Review artifacts under `docs/curriculum-harvest/generated-problems/` are not
runtime content.

### Keep Tests Local To Each Family

Each template should have a sibling test in the same topic folder:

```text
src/features/practice/templates/complement/at-least-one-via-complement.test.ts
```

That test should import:

- its template file,
- `expectTemplateAgrees` from `src/features/practice/templates/testUtils.ts`,
- any injected `checkAnswer` / `answerToPayload` helpers once WP-0/WP-3 are
  present.

## Specific CL-0001 Starting Point

CL-0001 has a review set already:

```text
docs/curriculum-harvest/generated-problems/cl-0001-at-least-one-via-complement.md
docs/curriculum-harvest/generated-problems/cl-0001-at-least-one-via-complement.json
```

And a build brief:

```text
docs/curriculum-harvest/template-briefs/cl-0001-at-least-one-via-complement.md
```

If WP-4 starts with one family, start here:

```text
src/features/practice/templates/complement/at-least-one-via-complement.ts
src/features/practice/templates/complement/at-least-one-via-complement.test.ts
```

Implementation details:

- `topic`: `complement`
- `skills`: `['complement-rule', 'independence']`
- `retrievalForm`: `procedural`
- `interactionKind`: `fill-fraction`
- `solve`: exact `1 - ((pDen - pNum) / pDen)^n`
- `simulate`: `n` independent Bernoulli attempts; success if at least one hits
- `rate`: follow the brief's 900-1300 range
- `render`: derive `numerator` and `denominator` from `solve(params)`

## Acceptance Criteria For The Layout Resolution

This layout resolution is done when:

1. WP-4 doc points to topic-folder paths.
2. `spec-practice.md` points to topic-folder paths.
3. C5/C6 are unchanged.
4. Existing `testUtils.ts` stays in `src/features/practice/templates/` and still
   imports cleanly from tests inside topic subfolders.
5. A template inside a topic folder can be imported into the single WP-3
   `TEMPLATES` registry.

## Bottom Line

This is a low-risk layout correction. It does not alter the practice engine
contract, learner-model contract, XP behavior, Firestore data model, or UI
responsibilities. It only prevents WP-4 from creating a flat template folder that
we already know will not scale with the harvested problem bank.

