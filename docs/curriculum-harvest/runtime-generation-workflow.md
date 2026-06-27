# Runtime Problem Generation Workflow

> Reproducibility notes for the WP-4/WP-6 practice bank. This documents how the
> generated review problems were produced and how the live `/practice` route loads
> the template bank.

## Runtime Source Of Truth

The generated Markdown/JSON files in `docs/curriculum-harvest/generated-problems/`
are review artifacts. Once a review set is approved, its verified parameter sets
can be promoted into the runtime static seed bank:

```text
src/content/practiceProblems/verifiedTemplateSeeds.ts
```

Those seeds are runtime content. The app still does not import Markdown/JSON from
`docs/`; it imports verified params from `src/content/practiceProblems/`.

The runtime Track 1 bank is the registered template list:

```text
src/features/practice/templates/index.ts      // ALL_TEMPLATES
src/features/practice/practiceEngine.ts       // TEMPLATES, generateInstance, pickNextTemplate
src/content/practiceProblems/verifiedTemplateSeeds.ts
src/features/practice/templates/verifiedSeeds.ts
src/features/practice/templates/creative/creative-hard.ts
```

Each template lives in the D99 topic-folder layout:

```text
src/features/practice/templates/<topic>/<id>.ts
```

The live app generates a fresh instance with:

```ts
const template = pickNextTemplate({
  topic,
  ratingForTopic,
  recentTemplateIds,
  rng,
});

const instance = generateInstance(template, rng);
```

The instance contains:

- `variant` — rendered by `InteractionDispatch` using existing lesson interaction renderers.
- `answer` — exact source of truth from `template.solve(params)`.
- `explanation` — worked solution from `template.explain(params)`.
- `difficulty`, `topic`, `skills` — used by adaptive serving and learner-model writes.

## Current Practice UI Loading Path

`PracticePage`:

1. Reads the signed-in user id from `useAuth`.
2. Renders `TopicPicker` with all `TOPICS`.
3. Owns the per-topic practice state so the Bounty chip can render in the header.
4. Passes `topic`, `uid`, rating state, and event callbacks to `PracticeSession`.

`TopicPicker`:

1. Shows one chip per taxonomy topic.
2. Uses `subscribeLearnerModel` to suggest the learner's weakest practiced topic
   once model data exists.
3. Falls back to the first topic if no model exists.

`PracticeSession`:

1. Reads per-topic practice state with `usePracticeState(uid, topic)`.
2. Picks a template with `pickNextTemplate`.
3. Generates a `PracticeInstance`.
4. Renders `instance.variant` through `InteractionDispatch`.
5. Grades with `checkAnswer(instance.variant, currentAnswer)`.
6. Uses a 3-try ladder:
   - wrong try 1 or 2: show a nudge, keep the learner on the problem,
   - correct answer: reveal the worked solution and allow next,
   - wrong try 3: reveal the worked solution with no XP.
7. On graded answers:
   - awards daily-capped practice XP through `usePracticeXp`,
   - records per-topic state through `recordResult`,
   - records per-skill Engine A mastery through `recordPracticeAttempt`.
8. "Next problem" repeats the generation loop.

`PracticePage` also owns a progress popup:

- grouped by topic,
- grouped within each topic by Easy / Medium / Hard / Extreme,
- shows tried out of loaded counts,
- persists in `localStorage` by user id or guest.

No generated review artifact is needed at runtime.

## Verified Static Seeds

Approved generated problems are loaded as seed-backed templates:

```text
src/features/practice/templates/verifiedSeeds.ts
```

Each seed-backed template fixes `sample()` to one verified parameter set, then
delegates to the base template's `solve`, `render`, `explain`, and `simulate`.
This means the runtime answer path still comes from code, not copied answer
strings.

Regenerate the seed file from approved review JSON:

```bash
npm run harvest:write-seed-bank
```

## Verified Creative Templates

Creative/harder candidates are verified separately:

```bash
npm run harvest:verify-creative
```

The current creative runtime templates live at:

```text
src/features/practice/templates/creative/creative-hard.ts
```

They are fixed-parameter templates, not generated families yet. Each one was
math-verified in `docs/curriculum-harvest/generated-problems/creative-hard-verified.md`
before being registered.

## Review Artifact Generation

To generate one review set for all registered templates:

```bash
npm run harvest:generate-runtime-reviews
```

This writes:

```text
docs/curriculum-harvest/generated-problems/runtime-templates/README.md
docs/curriculum-harvest/generated-problems/runtime-templates/<template-id>.md
docs/curriculum-harvest/generated-problems/runtime-templates/<template-id>.json
```

The generator is:

```text
scripts/curriculum-harvest/generate-runtime-template-reviews.ts
```

For each non-fixed template, it:

1. Samples five unique parameter sets using a deterministic seeded RNG.
2. Calls `template.solve(params)`.
3. Calls `template.render(params)`.
4. Converts the exact answer with `answerToPayload`.
5. Verifies that `checkAnswer(variant, payload)` returns correct.
6. Calls `template.explain(params)`.
7. If `template.simulate` exists and the answer is a numeric probability, runs a
   Monte Carlo check against the exact answer:

```text
|estimate - exact| < 5 * sqrt(p * (1 - p) / trials)
```

8. If no simulator exists, records a structural verification note instead.

Seed-backed and creative fixed templates generate one review item each because
their `sample()` method intentionally returns one verified parameter set.

## Review Commands

Run these before asking for content review:

```bash
npm test -- templates
npm test -- registry practiceEngine PracticeSession templates
npm test -- hint useAiHint PracticeSession templates
npm run harvest:audit-wording -- docs/curriculum-harvest/generated-problems/runtime-templates
npm run harvest:audit-wording -- docs/curriculum-harvest/generated-problems/creative-hard-verified.md
npm run typecheck
npm run lint
```

The wording audit compares generated review text against harvested source chunks
so copied textbook wording is caught before content ships.

## Design Decisions Logged

- D99: topic-folder runtime template layout.
- D104: verified review examples enter the app as seed-backed templates.
- D105: Bounty cannot decrease on below-level practice.
- D106: practice hints use a 3-try no-spoiler ladder.
- Runtime templates are executable Track 1 bank content.
- Review Markdown/JSON stays in `docs/curriculum-harvest/`.
- Future static Track 2 problems should live under `src/content/practiceProblems/`
  only after a separate vetted-bank implementation.

## Known Review Notes

- Non-creative starter templates are intentionally rated inside the `Easy` bucket
  (`difficulty < 950`). Creative/harder templates are loaded with higher ratings.
- `conditional-bayes-2x2` now uses a neutral "rare signal" context rather than a
  medical disease context. This keeps the math structure while avoiding sensitive
  learner-facing copy.
- `gambler-fallacy-mc` uses `1/6` for die streaks and `1/2` for coin/free-throw
  streaks.
- Runtime prompts should not contain Markdown emphasis markers because the
  existing interaction renderers display prompt strings as plain text.
- Practice rendering strips fraction labels and multiple-choice subtext so
  hints/options do not give away the structure before the learner answers.
- AI hint prompts for try 1 and 2 do not include the correct answer.

