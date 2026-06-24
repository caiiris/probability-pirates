# Spec: Habit Loop

> Owns XP awarding, streak math, milestone detection, and the lesson completion celebration screen. Reads from `/users/{uid}` and `/users/{uid}/lessonProgress/*`. Mutates `/users/{uid}` (xp, streak, milestones) on every correct check.

## Purpose

Make finishing a lesson feel satisfying and make coming back tomorrow obvious. Implement the brief's mandate: _"streaks, milestones, and a sense of daily progress... the difference between an app people open once and one they open every day."_

## User-facing behavior

### XP

- Every problem slot awards XP on Check. The number depends on attempt count and outcome.
- XP is displayed in real time inside the lesson player (small chip near the streak flame) — increments visibly after each correct slot.
- Lifetime XP is shown on Profile.

### Streak

- "Streak" = consecutive calendar days with at least one _correct_ check.
- Streak increments on the first correct check of a new local-tz day.
- Missing a day → streak resets to 0 (no freezes in MVP).
- Best streak is updated when current exceeds it.

### Daily goal

- Shown in the Home header as a pill: "Complete a lesson today" (gray) → "Done for today" (amber).
- Flips on the _first lesson completion_ of the day (not first correct check). Rolls over at local midnight in the learner's detected timezone (per `docs/alternatives.md` D22 / D59).

### Milestones

- Crossing `{3, 7, 14, 30, 60, 100}` consecutive days unlocks a milestone. Each fires once ever (tracked in `milestonesReached`).
- The milestone celebration appears on the _next lesson completion_ after the streak crosses the threshold — bundled into the celebration screen.
- Milestone titles (the streak chip carries the day count; the title carries the sentiment):
  - `streak-3` → "Warming up"
  - `streak-7` → "On a roll"
  - `streak-14` → "Locked in"
  - `streak-30` → "Genuine habit"
  - `streak-60` → "Probability lifer"
  - `streak-100` → "Inevitable"

### Lesson completion celebration screen (`/celebration/:lessonId`)

Full-screen takeover after the wrap slot's Continue. Layout, top to bottom:

1. **Confetti burst** (Animbits component or Framer fallback).
2. **"Lesson 1 complete"** with the lesson title in larger text below. (No exclamation; the confetti, count-up, and color shift carry the joy.)
3. **XP earned this lesson** — large number with a count-up animation from 0 to `xpEarnedThisAttempt` (Animbits or Framer; ~600ms).
4. **Streak chip** — flame icon + `currentStreak` with a `+1` annotation if today was a new streak day.
5. **Milestone card** — only rendered if a milestone was newly reached. Trophy SVG + milestone title + one-line copy.
6. **Course progress bar** — `lessonsCompleted / 6` with the bar visibly animating from old → new value.
7. **Next-lesson recommendation card** — Lesson N+1 title + blurb + Coming soon lock (in MVP).
8. **"Back to Home" CTA** — full-width shadcn button at the bottom.

## Data model

This spec mutates `/users/{uid}`. The fields are owned by `spec-auth` (initialized at registration) and `spec-progress-persistence` (the `attemptId` is the seed for variant selection — irrelevant here).

| field on `/users/{uid}` | mutation rule                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `xp`                    | `xp + xpAwarded` on every recorded attempt                                                                         |
| `lessonsCompleted`      | `+1` on the transition `state: in_progress → completed`                                                            |
| `stepsCompleted`        | `+1` on every slot where the learner advances (per D55, advancement requires a correct answer; no "unlocked" path) |
| `currentStreak`         | see streak rule below                                                                                              |
| `bestStreak`            | `max(bestStreak, currentStreak)`                                                                                   |
| `lastActiveDate`        | set to today's local-tz date string on every correct check                                                         |
| `milestonesReached`     | append the new milestone id when reached                                                                           |

### XP rule (`src/lib/xp.ts`)

```ts
export function xpForAttempt(attemptNumber: number, wasCorrect: boolean): number {
  if (!wasCorrect) return 0; // per D55, learner cannot advance without correct; wrong = 0
  if (attemptNumber === 1) return 10; // first-try correct: full reward
  if (attemptNumber === 2) return 5; // second-try correct: half reward
  return 2; // third-try correct or later: persistence reward
}

export const LESSON_COMPLETION_BONUS = 50;
```

XP never decreases. Wrong answers always award 0 (no advancement without correctness). Lesson bonus is added once, on the transition to `'completed'`. Decision rationale: `docs/alternatives.md` D31 (with D55 update).

### Streak rule (`src/lib/streak.ts`)

```ts
// Pure function over (lastActiveDate, todayLocalDate) → next streak state
export function nextStreak(input: {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null; // 'YYYY-MM-DD'
  todayLocalDate: string; // 'YYYY-MM-DD'
}): { currentStreak: number; bestStreak: number; lastActiveDate: string; isNewStreakDay: boolean } {
  if (input.lastActiveDate === input.todayLocalDate) {
    // Already counted today; no change.
    return { ...input, lastActiveDate: input.todayLocalDate, isNewStreakDay: false };
  }
  const next = isYesterday(input.lastActiveDate, input.todayLocalDate)
    ? input.currentStreak + 1
    : 1;
  return {
    currentStreak: next,
    bestStreak: Math.max(input.bestStreak, next),
    lastActiveDate: input.todayLocalDate,
    isNewStreakDay: true,
  };
}
```

`isYesterday` and `todayLocalDate` derive from `Intl.DateTimeFormat().resolvedOptions().timeZone` (alternatives D22).

### Milestone rule (`src/lib/milestones.ts`)

```ts
export const MILESTONE_THRESHOLDS = [3, 7, 14, 30, 60, 100] as const;

export function newMilestonesFor(streak: number, alreadyReached: string[]): string[] {
  return MILESTONE_THRESHOLDS.filter(
    (t) => streak >= t && !alreadyReached.includes(`streak-${t}`),
  ).map((t) => `streak-${t}`);
}
```

The "celebrate on the next lesson completion" UX is achieved by computing `newMilestones = newMilestonesFor(currentStreak, milestonesReached)` at completion time, displaying a card for each, and writing them to `milestonesReached` in the same transaction so they never re-fire.

### Daily-goal-done check

```ts
export function dailyGoalDone(lastCompletionDate: string | null, today: string): boolean {
  return lastCompletionDate === today;
}
```

`lastCompletionDate` is derived from the most recent `lessonProgress.completedAt`; we don't denormalize it onto `/users/{uid}` for MVP. The Home header reads from `useAllLessonProgress`.

## Implementation outline

1. Create `src/lib/streak.ts` with `todayLocalDate()`, `isYesterday(a, b)`, `nextStreak(input)` — pure functions, no Firebase.
2. Create `src/lib/xp.ts` exporting `xpForAttempt`, `LESSON_COMPLETION_BONUS`.
3. Create `src/lib/milestones.ts` exporting `MILESTONE_THRESHOLDS`, `newMilestonesFor`, `MILESTONE_TITLES: Record<string, string>`.
4. Create `src/features/habit/habitService.ts` exporting:
   - `applyAttemptOutcome(uid, attemptNumber, wasCorrect)` → batched update of `/users/{uid}`: `xp += xpForAttempt(...)`, `stepsCompleted += 1` (only if `wasCorrect` per D55), streak fields per `nextStreak(...)` (only if `wasCorrect`).
   - `applyLessonCompletion(uid, lessonId, xpEarnedThisAttempt)` → batched update: `xp += LESSON_COMPLETION_BONUS`, `lessonsCompleted += 1`, compute new milestones, append to `milestonesReached`, return `{ newMilestones, newCurrentStreak, isNewStreakDay }` so the celebration screen knows what to show.
5. Wire `applyAttemptOutcome` into `progressService.recordAttempt` (via the lesson player) so XP/streak update server-side on every correct check.
6. Create `src/features/habit/CelebrationScreen.tsx` rendered at route `/celebration/:lessonId?xp=N&streakDelta=1&milestones=streak-7,streak-14`. (Pass via URL search params so a refresh shows the same celebration.)
7. Create `src/components/illustrations/Trophy.tsx` — geometric SVG.
8. Use Animbits `confetti` for the burst; fall back to a Framer particle snippet if the registry component doesn't fit. (See `docs/ui-stack.md` Rule 3.)
9. Use Animbits `count-up` for the XP number; fall back to a 30-line Framer `useMotionValue` snippet.
10. Tap "Back to Home" → `navigate('/')`.
11. Write Vitest tests for `xpForAttempt`, `nextStreak` (including "same day" and "missed a day" branches), `newMilestonesFor` (including idempotency on re-call).
12. Write a Firebase emulator integration test for `applyLessonCompletion`: complete a lesson, verify `xp`, `lessonsCompleted`, `currentStreak`, `milestonesReached` are all updated atomically.

## Edge cases

- **Two correct checks in the same second:** both writes hit `users/{uid}`; Firestore's increment semantics (via `FieldValue.increment(...)`) keep XP correct.
- **Clock change / DST:** `todayLocalDate()` reads fresh on each call; a learner who completes a slot at 11:59pm and another at 12:01am gets streak +1 on the second (correct).
- **Timezone change mid-day** (travel): `lastActiveDate` may equal "today" in new tz already; first correct check just no-ops on streak (no crash).
- **`lastActiveDate` is null** (brand new account): first correct check sets `currentStreak: 1, lastActiveDate: today, isNewStreakDay: true`.
- **Milestone crossed but lesson abandoned before wrap:** celebration doesn't fire. The milestone is _not_ recorded yet (only added at `applyLessonCompletion`). Next lesson completion fires it. Acceptable.
- **Multiple new milestones at once** (e.g. learner does 7 days in a row at signup): `newMilestonesFor` returns multiple; the celebration screen stacks them vertically.
- **Negative XP somehow** (defensive — should never happen): clamp to ≥ 0 in the update.
- **`xpEarnedThisAttempt` overflow on replay:** the field resets to 0 on `startReplay` (owned by `spec-progress-persistence`); no overflow in practice.

## Test plan

- Unit: `xpForAttempt(1, true) === 10`, `(2, true) === 5`, `(3, true) === 2`, `(5, true) === 2`, `(1, false) === 0`, `(2, false) === 0`, `(3, false) === 0`.
- Unit: `nextStreak`:
  - Same day: returns unchanged streak, `isNewStreakDay: false`.
  - Yesterday: returns `currentStreak + 1`, `isNewStreakDay: true`.
  - Two days ago: returns `1`, `isNewStreakDay: true`.
  - `lastActiveDate: null`: returns `1`, `isNewStreakDay: true`.
- Unit: `newMilestonesFor(7, []) === ['streak-3', 'streak-7']`. `newMilestonesFor(7, ['streak-3']) === ['streak-7']`. `newMilestonesFor(7, ['streak-3', 'streak-7']) === []`.
- Integration (emulator): complete a lesson, check `/users/{uid}.xp` increases by `xpEarnedThisAttempt + 50`, `lessonsCompleted += 1`, `milestonesReached` reflects new milestones, `currentStreak` and `lastActiveDate` updated.
- Manual: complete a lesson, see confetti + XP count-up + streak bump + course progress animation, all in one screen, under 2 seconds.

## Out of scope

- ~~Streak freezes / save items~~ — **shipped:** coin-bought Streak Freeze auto-consumes before reset (alternatives D79 supersedes D34).
- ~~XP leaderboards / friend comparison~~ — **shipped:** friends-only weekly XP leaderboard (alternatives D24 reversed; see [`spec-social.md`](spec-social.md)).
- Daily XP goals beyond "complete a lesson" (Phase 3).
- ~~Badges / trophies beyond streak milestones~~ — **partially shipped:** an achievement set + a trophy checkpoint now exist (see [`spec-social.md`](spec-social.md) and alternatives D83 for the coin payouts).
- Push notifications for streak risk (alternatives D27 — still out of scope; the in-app schedule reminder D82 is not a streak-risk push).
- "Comeback" celebration after breaking a long streak (Phase 3).
