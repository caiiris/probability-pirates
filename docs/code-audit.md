# Code Audit — Pascal ("Probability Pirates")

**Date:** 2026-06-24
**Scope:** Full application source under `src/` (excludes vendored `tools/` tooling).
**Method:** File-by-function review grounded in `docs/prd.md`, `docs/specs/*`, `docs/design-iterations.md`, `docs/bugs.md`, `docs/issues.md`, `docs/data-schema.md`, and `firebase/firestore.rules`.
**Constraint:** No code was changed during this audit. All findings were verified against the live source.

## Baseline health

At time of audit the codebase is green:

- `tsc --noEmit` — clean (0 errors)
- `eslint` — clean
- `vitest` — **193/193 tests pass** across 26 files

So nothing below represents a _currently failing_ build or test; these are latent correctness, dead-code, and efficiency issues found by reading.

## How to read this document

Each finding lists **severity**, **location**, the **evidence** (with file:line), **why it matters**, a **recommended fix**, and whether it is **already tracked** in `docs/bugs.md` / `docs/issues.md`. Several items a naive audit would flag are intentional and already documented — those are called out explicitly so they are not re-chased.

Severity legend:

- 🔴 **HIGH** — data-integrity bug, security gap, or fully-dead module
- 🟠 **MEDIUM** — real defect with a narrow blast radius
- 🟢 **LOW** — dead leftover / cosmetic / micro-optimization

---

## 🔴 HIGH severity

### H1 — A completed lesson can be re-completed → duplicate XP + inflated `lessonsCompleted`

**Type:** Bug (data integrity)
**Location:** `src/features/lesson/LessonPlayer.tsx` (`LessonPlayerInner`), with the only guard living in `src/features/course/LessonNode.tsx`.
**Tracked:** Partially — the _card-layer_ version of this was fixed as B003/B009, but the fix did not move to the engine. Related to open issue I009 (browser-back behavior unspecified).

**Evidence**

`LessonPlayerInner` has no guard against entering a lesson whose progress `state === 'completed'`. The only protection is at the tap layer:

```33:45:src/features/course/LessonNode.tsx
  function handleTap() {
    if (locked) { /* toast + return */ return; }
    if (completed) {
      navigate(`/lesson/${lesson.id}?mode=review`);
      return;
    }
    navigate(`/lesson/${lesson.id}`);
  }
```

`isReview` is derived purely from the URL query param (`LessonPlayer.tsx:112`), and the completion path in `handleContinue` runs whenever the final slot's Continue is pressed in non-review mode:

```328:333:src/features/lesson/LessonPlayer.tsx
      const saved = await markLessonCompleted(uid, lesson.id);
      if (!saved.ok) {
        toast(ERROR_COPY.progress.saveCompletion);
        setSubmitting(false);
        return;
      }
```

```349:356:src/features/lesson/LessonPlayer.tsx
      if (profile) {
        const habitResult = await applyLessonCompletion(
          uid,
          profile,
          xpEarned,
          isNewStreakDayRef.current,
          completionSummary,
        );
```

`applyLessonCompletion` is **not idempotent** — it unconditionally does `xp: increment(50)`, `lessonsCompleted: increment(1)`, and a `weeklyXp` increment:

```200:212:src/features/habit/habitService.ts
    batch.update(userRef, {
      xp: increment(LESSON_COMPLETION_BONUS),
      lessonsCompleted: increment(1),
      weeklyXp: sameWeek ? increment(LESSON_COMPLETION_BONUS) : LESSON_COMPLETION_BONUS,
      weekKey,
      ...
```

**Reachability (confirmed):** The normal completion flow navigates `/lesson/:id` → `/celebration/:id` → (CTA) `/`. Pressing the **browser Back button** twice from Home returns to `/celebration/:id` and then to `/lesson/:id` in _non-review_ mode. For a completed lesson, `slotIndex` is the final (wrap) slot, so the footer shows **Continue**; pressing it re-runs `markLessonCompleted` + `applyLessonCompletion`, awarding another +50 XP and another `lessonsCompleted` increment. A manually typed/bookmarked `/lesson/:id` URL reaches the same state. `startReplay()` (the only legitimate progress-reset path) is never called anywhere (see L5), so review mode is the _only_ intended re-entry — and it bypasses this hole, which is exactly why the hole is easy to miss.

**Why it matters:** Inflates `xp`, `lessonsCompleted`, and `weeklyXp` (leaderboard), and re-evaluates milestones/achievements. Violates PRD §9.3 AC #7 (completion is recorded once, server-authoritatively).

**Recommended fix:** At the top of `LessonPlayerInner`, once progress is `ready`, if `progress.state === 'completed' && !isReview`, redirect to review (or Home):

```tsx
if (progressState.status === 'ready' && progressState.data.state === 'completed' && !isReview) {
  return <Navigate to={`/lesson/${lesson.id}?mode=review`} replace />;
}
```

Place it after the loading guard so hooks order stays stable. This makes the engine authoritative instead of relying on every navigation entry point passing `?mode=review`.

---

### H2 — Coin awards are client-trusted and can be minted by a tampering client

**Type:** Security / economy integrity
**Location:** `src/features/social/socialService.ts` (`follow`, `sendKudos`); also `src/features/habit/habitService.ts`; enforced (or not) by `firebase/firestore.rules`.
**Tracked:** Partially — B051/B034 document the "can't fully stop a determined client inflating their own **XP**" gap and accept it for MVP. The docs frame it as XP-only; it also applies to **coins**, which is not called out.

**Evidence**

The "first follow / first kudos" achievement + coin award is gated solely by a **client-supplied** array:

```84:94:src/features/social/socialService.ts
    const earnsFirst = !(myAchievements ?? []).includes('new-connection');
    if (earnsFirst) {
      const union = arrayUnion('new-connection');
      batch.set(
        doc(db, 'users', me.uid),
        { achievements: union, coins: increment(COINS_PER_ACHIEVEMENT) },
        { merge: true },
      );
      batch.set(doc(db, 'publicProfiles', me.uid), { achievements: union }, { merge: true });
    }
```

`sendKudos` has the identical shape (`socialService.ts:198-208`). The Firestore rules allow `coins` in the `users/{uid}` update allowlist with no server-side check that the achievement was actually first-time, so a client that omits the achievement from `myAchievements` (or calls the write directly) can repeatedly grant `coins`.

**Why it matters:** Coins gate the Streak Freeze purchase and cosmetic shop. Unlike the XP gap, this is a spendable currency, so the integrity story is stronger than the documented XP-only framing. There is no real money involved (per D83), so MVP-accepting it is defensible — but it should be documented accurately as a coin/economy gap, not just XP.

**Recommended fix (post-MVP):** Move coin/achievement granting behind a Cloud Function or `firestore.rules` that derives "first time" server-side (e.g. only allow `coins` increments as a function of verified state transitions). Short term: update `docs/bugs.md` to note coins are in the same client-trust bucket as XP.

---

### H3 — `src/lib/practiceXp.ts` is a fully-dead module

**Type:** Dead code
**Location:** `src/lib/practiceXp.ts` (+ `practiceXp.test.ts`)
**Tracked:** Anticipatory by design (D85); flagged here because it is currently 100% unreferenced by app code.

**Evidence:** `grantPracticeXp`, `practiceXpForResult`, `practiceXpRemainingToday`, `PRACTICE_XP_PER_CORRECT`, `PRACTICE_DAILY_XP_CAP`, and `PracticeXpState` are imported only by their own test file. `src/features/practice/PracticePage.tsx` is a locked "Arriving soon" stub with no solve loop, so none of this logic runs in production. `src/lib/levels.ts` references it only in a doc comment.

**Why it matters:** ~89 lines of tested-but-unreachable logic. It's harmless but is the single largest block of dead code and can mislead future readers into thinking practice XP is wired.

**Recommended fix:** Keep if Practice is imminent (it is documented as planned). Otherwise move under a clearly-labeled `*.future.ts` or delete until the feature lands. No action needed if the roadmap is near-term — just be aware it is dead today.

---

## 🟠 MEDIUM severity

### M1 — `EmailVerificationBanner` promises gating that doesn't exist

**Type:** Copy / behavior conflict (minor design-token drift)
**Location:** `src/components/EmailVerificationBanner.tsx`
**Tracked:** No.

**Evidence:** The banner reads _"Please verify your email address to unlock all features"_ (`:34`), but nothing in the app is gated on `user.emailVerified` — no route, lesson, or social action checks it. It also uses raw Tailwind palette utilities (`bg-amber-50 border-amber-200 text-amber-800`, `:31`) instead of the three-layer design tokens the design overhaul standardized on (`design-iterations.md`, "recolored emerald/rose → tokens").

**Why it matters:** The copy makes a promise the product doesn't keep, and the hard-coded `amber-*` classes are an inconsistency with the token system (will not respond to theme changes).

**Recommended fix:** Soften copy to something truthful (e.g. "Verify your email to secure your account"), or actually gate a feature behind verification. Swap `amber-*` for a token (e.g. a `--warning` surface token) for consistency.

### M2 — `weeklyXp` can be clobbered at a week boundary under snapshot lag

**Type:** Bug (narrow edge case)
**Location:** `src/features/habit/habitService.ts` (`applyLessonCompletion`)
**Tracked:** No (the adjacent XP-achievement lag is acknowledged, but it self-heals; this one loses data).

**Evidence**

```195:203:src/features/habit/habitService.ts
    const weekKey = currentWeekKey();
    const sameWeek = profile.weekKey === weekKey;
    ...
      weeklyXp: sameWeek ? increment(LESSON_COMPLETION_BONUS) : LESSON_COMPLETION_BONUS,
```

`sameWeek` is computed from the **snapshot** `profile.weekKey`. The per-check writes earlier in the same lesson (`applyAttemptOutcome`) already advanced `weekKey`/`weeklyXp` server-side, but if the live `profile` snapshot hasn't caught up, `sameWeek` is false and `weeklyXp` is **overwritten** with `50` rather than incremented — discarding the weekly XP this lesson already earned.

**Why it matters:** Loses leaderboard XP in a real (if uncommon) lag/week-rollover window. The XP-achievement path two lines down tolerates lag because it's idempotent; this assignment is not.

**Recommended fix:** Prefer an `increment(LESSON_COMPLETION_BONUS)` and let a separate, idempotent weekly-reset path own the rollover, or recompute `sameWeek` from a fresh read inside a transaction. Lowest-risk: always `increment` here and handle week reset where `weekKey` is first observed to change.

---

## 🟢 LOW severity — dead code

### L1 — `tap-outcomes` interaction is unreachable in production

**Location:** `src/features/lesson/interactions/TapOutcomes.tsx`, plus the `'tap-outcomes'` arms in `checkAnswer.ts`, `ProblemSlotView.tsx`, and `LessonPlayer.tsx:455`.
**Tracked:** Yes — L1 was converted to multiple-choice (`design-iterations.md`, "Sample-space slot"); the `'duplicate'` wrong-key is B045.
**Evidence:** No shipped lesson sets `interactionKind: 'tap-outcomes'` (confirmed via search of `src/content/lessons`). The renderer is imported and dispatched but never instantiated; the `'duplicate'` branch in `checkAnswer` is doubly unreachable.
**Recommendation:** Retain if the interaction will return; otherwise remove the renderer + type arm. Intentional today.

### L2 — `src/components/illustrations/Coin3D.tsx` is never mounted

**Tracked:** Yes (`design-iterations.md`, "3D coin un-mounted same day").
**Evidence:** No importer anywhere in `src/`.
**Recommendation:** Delete or keep as a deliberately-parked asset. Dead today.

### L3 — `recordAttempt`'s `nextSlotIndex` parameter and its branch are dead

**Location:** `src/features/progress/progressService.ts:121,151-153`
**Tracked:** Yes (B034 — split-write design; slot advance is owned by `advanceSlot`).
**Evidence:** No caller passes `nextSlotIndex` (the only caller, `LessonPlayer.handleCheck`, omits it), so `if (wasCorrect && nextSlotIndex !== undefined)` never executes.
**Recommendation:** Remove the param and branch to reduce confusion. Behavior-neutral.

### L4 — `isYesterday` is unused in production

**Location:** `src/lib/streak.ts:12`
**Evidence:** Referenced only by `streak.test.ts`. Streak rollover uses `daysBetween`/`nextStreak` instead.
**Recommendation:** Remove the function and its test, or wire it where intended. Behavior-neutral.

### L5 — `startReplay` is exported but never called

**Location:** `src/features/progress/progressService.ts:212`
**Tracked:** No.
**Evidence:** Searching `src/` finds `startReplay` only in its own definition. The completed-lesson re-entry flow uses read-only `?mode=review` (which does not reset progress), so the progress-resetting replay path is unreachable.
**Why it matters:** Minor, but its absence is relevant to H1: there is no legitimate way to re-open a completed lesson's _write_ path, which makes the back-button hole the only one — and easy to overlook.
**Recommendation:** Either wire a "Replay (reset progress)" affordance to it, or delete it. Note: do **not** wire replay without also fixing H1.

---

## 🟢 LOW severity — inefficiencies / refactors (all safe to defer)

### E1 — Per-Check Firestore fan-out (up to 3 commits per answer)

**Location:** `LessonPlayer.handleCheck` → `recordAttempt` (batch) + `applyAttemptOutcome` (batch) + occasionally `recordVariantSelection`; plus `advanceSlot` on Continue.
**Tracked:** Yes (B034 / B046 — MVP-accepted).
**Why it matters:** Extra round-trips and a partial-failure window (attempt saved, habit not). A single transaction would be atomic and cheaper.
**Recommendation:** Consolidate into one `runTransaction` post-MVP. Documented trade-off; no action required now.

### E2 — `dailyGoalDone` recomputes the timezone inside its loop

**Location:** `src/features/course/recommendations.ts:56-62`
**Evidence:**

```56:62:src/features/course/recommendations.ts
  for (const prog of progressMap.values()) {
    if (prog.completedAt) {
      const completedDate = new Date(prog.completedAt.seconds * 1000)
        .toLocaleDateString('en-CA', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      if (completedDate === today) return true;
    }
  }
```

`Intl.DateTimeFormat().resolvedOptions().timeZone` is recomputed for every completed lesson.
**Recommendation:** Hoist the timezone (and ideally a single `Intl.DateTimeFormat` instance) above the loop. Micro-optimization.

### E3 — `levelFromXp` is O(level²) and computes the rank twice

**Location:** `src/lib/levels.ts`
**Evidence:** `xpToReachLevel` loops from 1 each call (`:23-27`); `levelFromXp`'s `while` calls it once per level (`:80`), making the level scan quadratic. The return block calls `rankForLevel(level)` twice (`:91-92`). `CelebrationScreen` then calls `levelFromXp` twice more for level-up detection (`CelebrationScreen.tsx:120-121`).
**Why it matters:** Negligible at realistic XP totals (level ~13 end-game), but trivially avoidable.
**Recommendation:** Compute the cumulative threshold incrementally inside `levelFromXp` (O(level)) and call `rankForLevel(level)` once into a local. Pure refactor.

### E4 — Confetti re-randomizes on every render

**Location:** `src/features/habit/CelebrationScreen.tsx:57-62`
**Tracked:** Yes (B047, downgraded).
**Evidence:** `ConfettiParticle` calls `Math.random()` for `x`, `y`, `rotate`, `size` during render, so any re-render of `Confetti` re-scatters particles mid-animation.
**Recommendation:** Memoize per-particle params with `useMemo`/`useRef` keyed on mount. Cosmetic.

---

## Verified correct (do not re-chase)

The following were specifically checked and are sound:

- **Firestore rules vs. writes:** the `users/{uid}` update allowlist covers every field written by `habitService`, `coinService`, and `socialService` (`activityDates`, `weeklyXp`, `weekKey`, `coins`, `claimedChests`, `streakFreezes`, `achievements`, cosmetics). No rules/writes mismatch.
- **Streak math** (`nextStreak`, freeze consumption), **`newMilestonesFor` / `newAchievementsFor` idempotency**, **`checkAnswer` per-kind correctness**, **`selectVariant` determinism**, and **coin transactions** (`runTransaction` re-reads, no overspend) all hold.
- **Roadmap stub IDs ↔ `chapters.ts` mapping** and the `trophyGroupIdx` placement logic are consistent. (Stub lesson IDs that coincide with slot IDs in shipped lessons live in separate namespaces — confusing but not a bug.)
- **AuthProvider listener teardown** (B001), **`useSlotState` reset-on-slot**, the **variant-pick ref race** fix (B013), and the **review-mode sandbox** (no writes, no XP) are all correct.

## Suggested priority order

1. **H1** — one-line guard; real data-integrity bug reachable via the Back button. _Fix first._
2. **M2** — small, prevents weekly-XP loss at week boundaries.
3. **H2** — document accurately now; engineer server-side enforcement post-MVP.
4. **M1** — quick copy + token fix.
5. **L1–L5, E1–E4** — clean up opportunistically; none affect correctness today.
