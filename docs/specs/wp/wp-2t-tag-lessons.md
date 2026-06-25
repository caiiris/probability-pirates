# WP-2T — Tag lessons + wire lesson exposure (Engine B)

> **Type:** content data edit (additive) + a small lesson-player wiring. **Depends on:** WP-2 (types + enums); the wiring also needs WP-5 (`recordLessonExposure`). **Blocks:** nothing. **Server/AI:** no.
>
> **Run on its own branch / working tree.** Mostly additive content tagging; plus one small, guarded hook in the lesson player. Isolating it on a branch keeps it from entangling with the engine WPs and makes review a focused diff. Merge independently when ready.

## Goal

Two things:
1. Add `skills: SkillId[]` to every problem variant in the live lessons, and `misconceptionByOption` to multiple-choice variants whose distractors map to a known misconception.
2. Wire **Engine B** (lesson exposure) per README open-question #7: on the **first committed attempt per slot** in a lesson (NOT review mode, NOT later retries), call `recordLessonExposure(...)` and collect the result for the WP-9 report card. **This never moves the practice Elo** (it calls `recordLessonExposure`, never `recordPracticeAttempt`).

## Files

Content (edit only):
- Every live lesson under `src/content/lessons/`: `01-what-is-probability.ts`, `how-likely.ts`, `long-run-frequency.ts`, `02-law-of-large-numbers.ts`, `03-counting-carefully.ts`, `04-counting-gets-hard.ts`, `05-conditional-probability.ts` (tag whichever are non-`comingSoon` with real slots; skip blank stubs and `06-distributions.ts` if stubbed).
- Update the matching `*.test.ts` only if a test asserts exact variant shape (most assert via `assertLessonInvariants`, which already tolerates the new fields).

Wiring (edit):
- `src/features/lesson/LessonPlayer.tsx` — record the FIRST committed attempt per slot for Engine B, and accumulate `SlotFirstTry[]` for the report card (handed to the celebration screen for WP-9).

## Steps (loop, one lesson at a time)

1. For each problem variant, choose 1-3 `SkillId`s from `SKILLS` that the problem actually exercises. Use the taxonomy labels as the guide. Examples:
   - sample-space / "tap every face" -> `['sample-space-enumeration']`
   - `P(even)` fill-fraction -> `['favorable-over-total', 'equally-likely-outcomes']`
   - sum=7 grid -> `['sample-space-enumeration', 'equally-likely-outcomes']`
   - long-run-frequency `the-puzzle` / `unknown-coin` -> `['long-run-vs-single-trial', 'frequentist-view']`
   - Monty Hall -> `['conditional-probability', 'monty-hall-reasoning']`
2. For multiple-choice variants, map any distractor option-id that corresponds to a misconception to its `MisconceptionKey`. Known existing ones:
   - `long-run-frequency` `the-puzzle`: `{ gambler: 'gambler' }` (the `gambler` option), and consider `biased`/`broken` (leave unmapped if no clean key).
3. After each lesson, run `npm test -- <lesson-basename>` and `npm run typecheck`.
4. Do NOT invent new skill ids or misconception keys. If a problem needs a skill not in `SKILLS`, log it in [`README.md`](README.md) §"Open questions" and consult the owner (the taxonomy is closed by design).

### Engine-B wiring in `LessonPlayer.tsx` (the only `src/features` edit)

5. Track first-attempts per slot: keep a `firstTryBySlotRef` (a `Set<string>` of slot ids already recorded). In `handleCheck` (the REAL one, not `handleCheckReview`), AFTER computing `result` and reading `attemptNumber`:
   - If `isReviewMode` -> do nothing (review never feeds the model).
   - If this slot id is NOT yet in `firstTryBySlotRef`: add it, then:
     - `const skills = variant.skills ?? []` (no-op when untagged).
     - `const misconceptionKey = !result.wasCorrect && variant.interactionKind === 'multiple-choice' ? variant.misconceptionByOption?.[result.matchedWrongKey] ?? null : null`.
     - fire-and-forget `recordLessonExposure(uid, { skills, firstTryCorrect: result.wasCorrect, misconceptionKey })` (best-effort; never await in a way that blocks feedback).
     - push a `SlotFirstTry` (`{ slotId, skills, firstTryCorrect, misconceptionKey: misconceptionKey ?? undefined }`) onto a `reportResultsRef` array.
6. On lesson completion (the `isLastSlot` branch of `handleContinue`), pass the accumulated `reportResultsRef.current` to the celebration route so WP-9 can render the report card (e.g. stash via router state or a session store — coordinate the exact handoff with WP-9; WP-2T provides the data, WP-9 renders it).
7. Reset the refs when a fresh lesson attempt starts (mirror how the existing achievement refs reset).

## Test plan / Definition of Done

- Every non-stub problem variant in the live lessons has a non-empty `skills` array.
- `assertLessonInvariants` passes for all lessons (no unknown skill ids / misconception keys).
- The lesson player records exposure on the FIRST attempt per slot only (a 2nd/3rd attempt on the same slot does NOT fire `recordLessonExposure` again); review mode never fires it; it calls `recordLessonExposure` and NEVER `recordPracticeAttempt`.
- A small unit test covers the first-attempt-dedupe + misconception-extraction logic (extract it into a pure helper so it's testable without mounting the player).
- All existing lesson tests pass; `npm run typecheck` clean.
- Content diff touches ONLY `src/content/lessons/*`; the only `src/features` edit is the guarded `LessonPlayer.tsx` wiring.

## Boundaries (do NOT touch)

- Do not edit `skills.ts` / `misconceptions.ts` (that's WP-2). If the taxonomy is missing something, log + consult — do not extend it here.
- Do not change any prompts, feedback copy, correctness fields, or slot ordering — additive tagging only.
- **Engine B only:** never call `recordPracticeAttempt` from the lesson player; lessons must not move the mastery Elo (README #7).
- Do not block correct/wrong feedback on the exposure write (fire-and-forget, like the existing habit writes).
