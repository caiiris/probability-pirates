# WP-6c — Practice XP, daily cap, and session signals

> **Type:** integration + polish. **Depends on:** WP-6b, WP-8 (rules for `practiceXp`), existing `practiceXp.ts` + habit XP write path. **Server/AI:** no.

## Goal

Wire practice into the reward loop with the already-built daily-capped XP policy, and add lightweight session signals (count solved, current correct-streak, rating trend). Practice XP feeds levels + weekly XP but never the daily streak and never counts as a completed lesson (per [`spec-practice`](../spec-practice.md)).

## Files

- **Add** `src/features/practice/usePracticeXp.ts` — reads/writes `users/{uid}/practiceXp/today` (the `PracticeXpState` from [`practiceXp.ts`](../../../src/lib/practiceXp.ts)); on a correct answer calls `grantPracticeXp(prev, todayLocalDate(), true)` and, if `granted > 0`, increments `users/{uid}.xp` + `weeklyXp` via the existing habit XP write path (those fields are already in the `users` update allowlist — no rules change).
- **Add** `src/features/practice/SessionSignals.tsx` — shows count solved this session, current correct-in-a-row, and a small rating-trend indicator.
- **Edit** `PracticeSession.tsx` — call `usePracticeXp` on correct answers; render `SessionSignals`; show a subtle "daily practice XP cap reached" note when `grantPracticeXp` returns `capReached` (non-blocking).

## Steps (loop until green)

1. `usePracticeXp`: load today's state; expose `award(wasCorrect): { granted, capReached }`. Reuse `grantPracticeXp` (pure, already tested) and `todayLocalDate()` from `@/lib/streak` (confirm the export name; reuse, don't reimplement date logic).
2. On a correct practice answer: award XP (capped), persist `practiceXp/today`, and increment `users/{uid}.xp`/`weeklyXp` through the existing habit service helper (reuse — do not write a new XP increment path; if the existing helper isn't reusable as-is, add a thin `awardPracticeXp` in `habitService` limited to `xp`/`weeklyXp`/`weekKey` fields).
3. Build `SessionSignals` (pure presentational; counts live in `PracticeSession` state).
4. Verify XP does NOT touch streak fields and does NOT mark any lesson complete.
5. `npm run typecheck`; `npm run build`; manual check XP rises on correct, caps at the daily limit, streak untouched.

## Test plan / Definition of Done

- A correct answer grants `PRACTICE_XP_PER_CORRECT` (5) until the daily cap (100), then 0 with a non-blocking "cap reached" note (assert via `grantPracticeXp` wiring test).
- Practice XP increments total `xp` + `weeklyXp` but never `currentStreak`/`lastActiveDate`/`lessonsCompleted` (assert the write payload's affected keys).
- Session signals update live (solved count, correct-streak, rating trend).
- `npm run typecheck` + `npm run build` clean; no AI / `/api` calls.

## Boundaries (do NOT touch)

- Do not let practice tick the daily streak or count as a lesson completion.
- Do not exceed the `users` update allowlist (`xp`, `weeklyXp`, `weekKey` only for the XP increment).
- Do not reimplement `grantPracticeXp` or streak date math — reuse the tested pure functions.
- No AI.
