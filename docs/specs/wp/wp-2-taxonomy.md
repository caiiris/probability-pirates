# WP-2 — Skill & misconception taxonomy + content-model additions

> **Type:** pure data + type additions. **Depends on:** nothing. **Blocks:** WP-2T, WP-3, WP-4, WP-5, WP-7. **Server/AI:** no.
>
> Small and isolated: defines the enums and adds two OPTIONAL fields to the content model. Must not break any existing lesson.

## Goal

Create the closed skill + misconception taxonomies and add the optional `skills?` / `misconceptionByOption?` fields to the content model. Implements contracts [C3](wp-contracts.md#c3-skill--misconception-taxonomy-owned-by-wp-2-consumed-by-wp-3-wp-4-wp-5-wp-7) and [C4](wp-contracts.md#c4-content-model-additions-owned-by-wp-2-consumed-by-wp-2t-wp-4-wp-5).

## Files

- `src/content/skills.ts` — `SKILLS`, `SkillId`, `Topic`, `TOPICS` exactly per C3.
- `src/content/misconceptions.ts` — `MISCONCEPTIONS`, `MisconceptionKey` exactly per C3.
- `src/content/skills.test.ts` — invariants (see test plan).
- **Edit** `src/content/types.ts` — add `skills?: SkillId[]` to `BaseVariant`; add `misconceptionByOption?: Record<string, MisconceptionKey>` to `MultipleChoiceVariant`. Import the types from `@/content/skills` / `@/content/misconceptions`.
- **Edit** `src/content/assertLessonInvariants.ts` — when a problem variant has a `skills` array, assert every id exists in `SKILLS` (throw with `lesson.id/slot.id/variant.id` pointer). When `skills` is ABSENT, `console.warn` once per variant id (do not throw — optional during migration). When `misconceptionByOption` is present, assert each value is a key of `MISCONCEPTIONS` and each option-id key exists in the variant's `options`.

## Steps (loop until green)

1. Create `skills.ts` and `misconceptions.ts` verbatim from C3 (the `as const` shape is load-bearing — it derives the union types).
2. Add the two optional fields to `types.ts`. Confirm the project still typechecks with zero changes to lesson files (the fields are optional).
3. Extend `assertLessonInvariants` with the skill-id and misconception checks above.
4. Write `skills.test.ts`.
5. `npm run typecheck`; `npm test -- skills`; `npm test -- assertLessonInvariants` (existing suite must still pass).

## Test plan / Definition of Done

- `skills.test.ts`: every `SKILLS[id].topic` is a member of `TOPICS`; `SkillId` count >= 15; no duplicate labels; every `MISCONCEPTIONS[k].relatedSkills` entry is a valid `SkillId`.
- A fabricated variant with `skills: ['not-a-skill']` makes `assertLessonInvariants` throw (add this as a test).
- A fabricated MC variant with `misconceptionByOption: { x: 'not-a-key' }` throws.
- All existing content tests still pass unchanged (no lesson file edited in this WP).
- `npm run typecheck` clean.

## Boundaries (do NOT touch)

- Do **not** edit any file in `src/content/lessons/*` — tagging lessons is WP-2T.
- Do **not** make `skills` required (keep it optional; flipping to required is a later, separate decision).
- Do not add runtime behavior beyond the invariant checks.
