# WP-3 — Template engine (Template type + practiceEngine)

> **Type:** pure library + tests. **Depends on:** WP-1 (exact/ExactAnswer), WP-2 (SkillId/Topic). **Blocks:** WP-4 (families implement the type), WP-6 (UI consumes the engine). **Server/AI:** no.
>
> Defines the frozen `Template` contract and the serving/generation logic. No template content lives here (that's WP-4) — only the interface + engine + glue.

## Goal

Implement contracts [C5](wp-contracts.md#c5-template-contract-owned-by-wp-3-implemented-by-wp-4-consumed-by-wp-6) and [C6](wp-contracts.md#c6-practiceinstance--engine-owned-by-wp-3-consumed-by-wp-6): the `Template<P>` type, `PracticeInstance`, `answerToPayload`, `generateInstance`, `pickNextTemplate`, and the `TEMPLATES` registry.

## Files

- `src/features/practice/templates/types.ts` — `Template<P>`, `RetrievalForm` per C5.
- `src/features/practice/practiceEngine.ts` — `PracticeInstance`, `answerToPayload`, `generateInstance`, `pickNextTemplate`, `TEMPLATES` per C6.
- `src/features/practice/practiceEngine.test.ts` — engine tests (use 1-2 tiny stub templates defined in the test file, not WP-4 content).

## Steps (loop until green)

1. Write `types.ts` exactly per C5. Export `Template`, `RetrievalForm`.
2. `answerToPayload(answer, variant)`:
   - `choice` -> `{ optionId: answer.optionId }`
   - `fraction` -> `{ numerator: Number(answer.value.num), denominator: Number(answer.value.den) }`
   - `int` -> depends on the variant kind; for a `multiple-choice` int answer, throw (templates must use `choice` for MC); for `fill-fraction`, treat int `v` as `{ numerator: v, denominator: 1 }`. Document the mapping in a comment.
3. `generateInstance(template, rng)`:
   - `const params = template.sample(rng)`
   - `const answer = template.solve(params)`
   - `const variant = template.render(params)`
   - `instanceId = \`${template.id}:${fnv1a32(JSON.stringify(params))}\``
   - assemble `PracticeInstance` (copy `topic`, `skills`, `difficulty = template.rate(params)`, `explanation = template.explain(params)`).
4. `pickNextTemplate({ topic, ratingForTopic, recentTemplateIds, rng })`:
   - Candidates = `TEMPLATES.filter(t => t.topic === topic && !recentTemplateIds.includes(t.id))`.
   - For each candidate compute a representative difficulty by sampling once (or use a `t.rate` on a sampled params); keep those with difficulty in `[ratingForTopic-50, ratingForTopic+100]`.
   - If empty, widen the window by +/-100 repeatedly until non-empty or the window covers all candidates; if still empty (all recently seen), fall back to the full topic set.
   - Pick uniformly at random via `rng`. Return the `Template`.
5. `TEMPLATES`: export an array. WP-4 files each export a template; this registry imports and lists them. To keep WP-3 buildable before WP-4 exists, initialize `TEMPLATES: Template[] = []` and add a comment `// WP-4 families are appended here as they land`. WP-4's spec includes registering each family.
6. Run `npm test -- practiceEngine`; `npm run typecheck`.

## Test plan / Definition of Done

- `generateInstance` with a stub template produces a `PracticeInstance` whose `variant` grades correct against `answerToPayload(instance.answer, instance.variant)` via `checkAnswer` (import from `@/lib/checkAnswer`).
- `instanceId` is stable for the same params, different for different params.
- `pickNextTemplate` never returns a template in `recentTemplateIds` unless that's the only option; respects the rating window when candidates exist; is deterministic given a seeded rng.
- `answerToPayload` round-trips each `ExactAnswer` kind into a payload that `checkAnswer` accepts.
- `npm run typecheck` clean; no React/Firebase imports in these files.

## Boundaries (do NOT touch)

- Do not author probability templates here (WP-4 owns content). Stubs in the test file only.
- Do not import from `src/features/lesson/*` except types; grading uses `@/lib/checkAnswer` (WP-0).
- Do not change the `Variant` type (that's WP-2).
- Keep `rate()` outputs on the Elo scale (~700-2000) — document this in `types.ts` so WP-4 authors comply.
