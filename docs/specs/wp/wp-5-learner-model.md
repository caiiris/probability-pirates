# WP-5 — Learner model (pure math + Firestore service)

> **Type:** pure library + thin Firestore writer + tests. **Depends on:** WP-2 (SkillId/MisconceptionKey), WP-8 (rules for the doc). **Blocks:** WP-6b (adaptive serving), WP-7 (strengths panel). **Server/AI:** no.
>
> Split into a pure module (fully unit-tested, no Firebase) and a thin writer. A small model builds the pure math from the test suite, then wires the trivial writer.

## Goal

Implement contract [C7](wp-contracts.md#c7-learner-model--two-engines-owned-by-wp-5-consumed-by-wp-3-serving-wp-6-wp-7-wp-9): the **two-engine** learner model. **Engine A** = per-skill Elo mastery from PRACTICE only. **Engine B** = per-skill exposure/struggle + misconceptions from LESSON first-attempts only (never moves the Elo). Plus the pure `buildReportCard` fold (C7b) used by WP-9. See [`spec-learner-model`](../spec-learner-model.md) for the full rationale.

## Files

- `src/features/learner/learnerModel.ts` — pure: `emptyModel`, `applyPracticeAttempt` (Engine A), `applyLessonExposure` (Engine B), `buildReportCard` (C7b), constants, all C7 types.
- `src/features/learner/learnerModel.test.ts` — pure-math tests.
- `src/features/learner/learnerModelService.ts` — `recordPracticeAttempt`, `recordLessonExposure` (both read-modify-write `users/{uid}/learnerModel/state`), `subscribeLearnerModel`.
- `scripts/rebuild-learner-model.ts` — optional support script that replays attempt history -> model (not deployed; include only if quick).

## Steps (loop until green)

1. `emptyModel(now)` -> `{ skills:{}, exposure:{}, misconceptions:{}, weakestSkills:[], strongestSkills:[], updatedAt: now }`.
2. **Engine A — `applyPracticeAttempt(model, input)`** (pure):
   - For each `skillId` in `input.skills`: bootstrap `SkillStat` if missing (`rating: DEFAULT_RATING`, `recentCorrect: 0.5`, `firstSeenAt: now`).
   - Elo: `expected = 1/(1+10^((difficulty - rating)/400))`; `rating += ELO_K * bonus * (actual - expected)`, `actual = wasCorrect?1:0`, `bonus = wasCorrect ? min(1 + daysSinceLastSeen/10, 1.5) : 1`.
   - `recentCorrect = ACC_ALPHA*actual + (1-ACC_ALPHA)*recentCorrect`; `attempts++`; `correct += actual`; `lastSeenAt = now`.
   - If `misconceptionKey`: bump `misconceptions[key]`.
   - Recompute `weakestSkills`/`strongestSkills` over `skills` (Engine A) ONLY: top 3 by rating asc/desc, tie-break `attempts` desc. `updatedAt = now`.
3. **Engine B — `applyLessonExposure(model, input)`** (pure):
   - For each `skillId`: bootstrap `ExposureStat` if missing (`introducedAt: now`, counters 0).
   - `lessonFirstTries++`; if `!firstTryCorrect` then `lessonFirstTryStruggles++`; `lastSeenAt = now`.
   - If `misconceptionKey`: bump `misconceptions[key]`.
   - **Do NOT touch `skills` (Engine A) or the rating.** Do NOT recompute weakest/strongest (those are Engine A only). `updatedAt = now`.
4. **`buildReportCard(lessonId, results)`** (pure, C7b): group `SlotFirstTry[]` by skill; a skill is `nailed` if every slot touching it was `firstTryCorrect`, else `review`; collect distinct `misconceptionKey`s. Return `LessonReportCard`.
5. `learnerModelService.ts`: `recordPracticeAttempt` / `recordLessonExposure` each `getDoc` -> parse or `emptyModel(Date.now())` -> apply the matching pure fn with `now: Date.now()` -> `setDoc` merge. Best-effort: try/catch, `console.warn`, never throw. `subscribeLearnerModel` = `onSnapshot` wrapper. Use the `db` singleton from `@/lib/firebase`.
6. `npm test -- learnerModel`; `npm run typecheck`.

## Test plan / Definition of Done

`learnerModel.test.ts`:
- **Engine A:** one correct practice attempt on `['combinations']` raises its `rating` above `DEFAULT_RATING`; a wrong one lowers it. `recentCorrect` moves toward 1/0, bootstrapped 0.5. Delayed-retrieval bonus: a correct attempt 5+ days since `lastSeenAt` raises rating MORE than one just seen. `attempts`/`correct` monotonic. `weakestSkills`/`strongestSkills` reflect ratings.
- **Engine B:** `applyLessonExposure` creates `exposure[skill]` with `introducedAt`, increments `lessonFirstTries`, and increments `lessonFirstTryStruggles` only on a first-try miss. **Assert it does NOT create or change any `skills[...]` rating** (Engine A untouched) and does NOT change `weakestSkills`/`strongestSkills`.
- **Separation:** a model with only lesson exposure has empty `skills` and empty `weakest/strongestSkills` (mastery requires practice).
- **Misconceptions** bump from either engine.
- **`buildReportCard`:** a lesson where `combinations` was first-try-correct in one slot and missed in another puts `combinations` in `review` (not `nailed`); an all-correct skill lands in `nailed`; misconceptions deduped.
- **Purity:** same inputs + same `now` -> identical output (no `Date.now()` inside pure fns).

DoD: pure tests green; `learnerModel.ts` has zero Firebase/React imports; service best-effort (never throws). `npm run typecheck` clean.

## Boundaries (do NOT touch)

- **`applyLessonExposure` must never move the Elo `rating` or the weakest/strongest arrays** — that is the whole point of the two-engine split (README #7).
- Do not call the recorders from the lesson player / practice loop here — wiring is owned by WP-2T (lessons) and WP-6b (practice). WP-5 only provides the API.
- Do not add public mirrors / leaderboard surfaces (private only).
- Keep all `apply*` / `buildReportCard` pure and deterministic (inject `now`).
