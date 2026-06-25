# WP-0 — Relocate `checkAnswer` to `src/lib/`

> **Type:** prep refactor. **Depends on:** nothing. **Blocks:** WP-6 (practice reuses the grader). **Server/AI:** no.
>
> Tiny, mechanical, self-contained. Do this first; it touches only import paths.

## Goal

Move the pure grader `checkAnswer` out of the lesson feature into shared `src/lib/` so the practice loop can import it without depending on the lesson feature folder. Behavior is unchanged.

## Why

`checkAnswer(variant, payload)` is already pure and framework-free, but lives in `src/features/lesson/`. WP-6 (practice) needs it. A shared lib location keeps feature folders from importing each other.

## Files

- **Move:** `src/features/lesson/checkAnswer.ts` -> `src/lib/checkAnswer.ts` (content unchanged).
- **Move:** `src/features/lesson/checkAnswer.test.ts` -> `src/lib/checkAnswer.test.ts` (update the import path inside).
- **Edit imports** in every file that imports `checkAnswer` — currently:
  - `src/features/lesson/LessonPlayer.tsx` (`import { checkAnswer } from './checkAnswer'` -> `from '@/lib/checkAnswer'`).
  - Any other importer found by search (see step 1).

## Steps (loop until green)

1. Search the repo for `checkAnswer` imports: `rg "from '.*checkAnswer'"`. Record every file.
2. Move the two files to `src/lib/`. Keep the file contents identical except the test's import of the source.
3. Update every importer to `@/lib/checkAnswer`.
4. Run `npm run typecheck` and `npm test -- checkAnswer`. Fix any missed import.

## Test plan / Definition of Done

- `npm run typecheck` is clean.
- `npm test -- checkAnswer` passes (the moved test runs from its new location).
- `rg "features/lesson/checkAnswer"` returns no matches (no stale imports).
- No behavior change: the grader's logic is byte-for-byte the same.

## Boundaries (do NOT touch)

- Do not change any grading logic.
- Do not change `checkAnswer`'s signature or return type (`CheckResult`).
- Do not touch interaction renderers or `useSlotState`.
