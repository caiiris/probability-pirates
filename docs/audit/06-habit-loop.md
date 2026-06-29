# Audit 06 — Habit Loop (XP · streaks · milestones · celebration · report card)

**Auditor role:** learning scientist + software engineer
**Date:** 2026-06-28 (pre-deadline)
**Ground truth accepted:** `tsc` clean, `eslint` clean, `vitest` 1083/1083 (suite not re-run).
**Constraint:** read-only. No source/test files modified.
**Method:** function-by-function read of the feature's libs + service + UI, cross-checked against PRD §9.5 (10 ACs) and §10 (E3/E4), `spec-habit-loop.md`, `wp-9-lesson-report-card.md`, and alternatives D22/D28/D31/D32/D34/D55/D59/D79–D83. Prior `docs/code-audit.md` (dated 2026-06-24, 193 tests) was used as a cross-reference and its still-open items were re-verified against current source.

---

## 1. Overview — files + the XP/streak/milestone model

### Files in scope

| File | Role | Tested? |
| --- | --- | --- |
| `src/lib/xp.ts` | `xpForAttempt`, `LESSON_COMPLETION_BONUS` | ✅ unit |
| `src/lib/streak.ts` | `todayLocalDate`, `isYesterday`, `daysBetween`, `nextStreak` (+ freeze) | ✅ unit |
| `src/lib/milestones.ts` | `MILESTONE_THRESHOLDS`, `MILESTONE_TITLES`, `newMilestonesFor` | ✅ unit |
| `src/lib/levels.ts` | XP→level/rank curve (`levelFromXp`) | ✅ unit |
| `src/lib/weeklyXp.ts` | ISO-week bucket keying (`currentWeekKey`, `effectiveWeeklyXp`) | ✅ unit |
| `src/lib/achievements.ts` | achievement catalog + `newAchievementsFor` (idempotent) | ✅ unit |
| `src/lib/coins.ts` | cosmetic/forgiveness coin payout constants + math | ✅ unit |
| `src/lib/practiceXp.ts` | practice-XP policy (difficulty/try decay + daily cap) | ✅ unit, **dead in prod** |
| `src/features/habit/habitService.ts` | Firestore writes: `applyAttemptOutcome`, `applySlotAdvance`, `applyLessonCompletion`, `awardPracticeXp` | ❌ **no test** |
| `src/features/habit/CelebrationScreen.tsx` | `/celebration/:lessonId` takeover (confetti, count-up, streak, milestones, progress) | ❌ **no test** |
| `src/features/learner/learnerModel.ts` | `buildReportCard` (pure fold) lives here (C7b) | ✅ unit, **not surfaced** |
| `src/features/learner/topicSummary.ts` | per-topic practice rollup (Progress page, not celebration) | ✅ unit |
| `src/features/lesson/LessonPlayer.tsx` | the caller — wires the three habit hooks + builds celebration URL | partial |
| `src/features/lesson/LessonHeader.tsx` | in-lesson live XP + streak chips | — |
| `src/features/course/recommendations.ts` | `dailyGoalDone`, `courseProgress` (Home pill) | ✅ unit |

### The model (as implemented)

- **XP per correct check** — `xpForAttempt(n, correct)` → `10` (try 1), `5` (try 2), `2` (try 3+), `0` (wrong). Persistence reward is always `> 0` for any correct answer; wrong is always `0`; the function is monotone-safe (no negative branch). Written server-side with `increment()` per correct check inside `applyAttemptOutcome` (`habitService.ts:70`).
- **Lesson completion bonus** — flat `+50` (`LESSON_COMPLETION_BONUS`), added once in `applyLessonCompletion` on the wrap-slot Continue (`habitService.ts:199`). Per-check XP is *not* re-added here (bonus only), per the B-series fix history.
- **Streak** — `nextStreak()` over `(currentStreak, bestStreak, lastActiveDate, todayLocalDate, freezesAvailable)`: same local day → no-op; consecutive day (`gap === 1`) → `+1`; a coverable gap with enough Streak Freezes → `+1` and consumes one freeze per missed day (D79); otherwise → reset to `1`. `bestStreak = max(bestStreak, next)`. Dates are `YYYY-MM-DD` in the browser-detected tz (`Intl…timeZone`, D22), diffed at noon to dodge DST (`daysBetween`).
- **Milestones** — `newMilestonesFor(streak, alreadyReached)` returns the thresholds newly crossed; idempotent; written with `arrayUnion` into `milestonesReached` at completion so they fire once and bundle into the *next* celebration (D28/D32). **Thresholds in code: `[3, 7, 14, 30, 60]`.**
- **Adjacent reward sinks** — `achievements.ts` (mastery/persistence/progress/social badges, `arrayUnion`, idempotent), `coins.ts` (cosmetic + Streak-Freeze currency, never pay-to-learn — D83), `levels.ts` (XP→rank curve), `weeklyXp.ts` (friends leaderboard, ISO-week reset), `practiceXp.ts` (off-day practice XP, capped, never ticks streak).
- **Celebration** — `CelebrationScreen` reads *everything* from URL search params (`xp`, `streak`, `streakDelta`, `milestones`, `completed`, `total`) so a refresh reproduces the same screen. The lesson player assembles that URL in `LessonPlayer.handleContinue` (`:380`, `:428`).

---

## 2. What works (ACs verified + math checked)

All ten PRD §9.5 ACs are substantially met **except the report card**, which is a WP-9 deliverable surfaced *through* this feature and is not shipped (see §3).

| AC | Status | Evidence / math check |
| --- | --- | --- |
| **#1 XP per correct check** | ✅ | `xp.ts:5-10`. `xpForAttempt(1,true)=10`, `(2,true)=5`, `(3,true)=(5,true)=2`, `(*,false)=0`. First-try highest, later tries decay but `>0`, wrong `=0`. Persisted via `increment()` so XP never decreases. |
| **#2 Completion bonus once** | ✅ (with caveat) | `habitService.ts:199` adds `+50` only at completion. *Caveat:* not idempotent against re-completion — see Bug 1. |
| **#3 Streak math** | ✅ | `streak.ts:57-98`; `streak.test.ts` covers same-day no-op, yesterday `+1`, miss→`1`, null→`1`, plus freeze bridge/short cases. Consecutive-day logic is correct. |
| **#4 Best streak tracked** | ✅ | `streak.ts:92` `Math.max(bestStreak, next)`; `streak.test.ts:78` confirms `bestStreak` never decreases on reset. |
| **#5 Milestones fire once ever** | ⚠️ partial | Idempotency is correct (`milestones.ts:22`, `arrayUnion` at `habitService.ts:203`). **But only 5 of the spec'd 6 thresholds exist** — `streak-100` "Inevitable" is missing (see Bug 3). |
| **#6 Milestones on next completion** | ✅ | Computed at `applyLessonCompletion` from the live streak and rendered as cards (`CelebrationScreen.tsx:224`), not at the moment the streak crosses. |
| **#7 Celebration order** | ✅ | `CelebrationScreen.tsx`: confetti (`:133`) → "Lesson N complete" + title (`:137-149`) → XP count-up (`:164-174`) → streak chip (`:207-221`) → milestone cards (`:224-237`) → course progress bar (`:240-248`) → next-lesson preview (`:251-264`) → Back to Home (`:268`). Order matches the spec; level-up card and Captain Pascal (course-complete) are additive and acceptable. |
| **#8 Refresh-safe** | ✅ | All celebration state read from `useSearchParams` (`:96-122`); no reliance on router state or memory. Reloading the URL reproduces the screen. |
| **#9 Daily-goal pill** | ✅ (with caveat) | `dailyGoalDone(progressMap, today)` matches any `completedAt` to the local-tz date (`recommendations.ts:60-70`); `HomePage.tsx:67-68` uses `todayLocalDate()`. *Caveat:* rollover is render-time, not a live midnight timer — Bug 7. |
| **#10 Real-time lesson stats** | ✅ | `LessonHeader` is fed `currentXp={profile.xp}` / `currentStreak={profile.currentStreak}` (`LessonPlayer.tsx:574-591`), sourced from the `AuthProvider` `onSnapshot`, so chips increment as `applyAttemptOutcome` writes. |

**Other math verified sound:**

- `levels.ts` — curve `stepCost(L)=50+50L`; cumulative `xpToReachLevel(n)=25(n-1)(n+2)`. End-of-path ≈ 4,400 XP → level ≈ 12–13 (First Mate), matching the design comment. `progress`/`xpToNext` clamp correctly; `levelFromXp(0)` → level 1. Level-up detection on the celebration (`CelebrationScreen.tsx:124`) correctly compares `levelFromXp(total)` vs `levelFromXp(total - xp)`.
- `weeklyXp.ts` — `currentWeekKey` builds an ISO-8601 Monday-week from the **local** Y/M/D (normalized through UTC midnight to stay tz-stable), Thursday-anchored — correct ISO week-numbering. `effectiveWeeklyXp` treats a stale `weekKey` as 0 (the fresh-start effect).
- `achievements.ts` / `coins.ts` — `newAchievementsFor` and `coinsForAchievements` are pure and idempotent; XP/course thresholds compute off projected values; `arrayUnion` makes the writes safe to repeat.
- `practiceXp.ts` — difficulty-band base × per-try multiplier × reasoning multiplier, rounded, then daily-capped against a per-local-day counter (`grantPracticeXp`). Correct, but **unreferenced by app code** (Practice page is a stub).
- `buildReportCard` (`learnerModel.ts:437-470`) — the *fold itself* is correct: a skill is `nailed` only if every slot touching it was first-try correct, else `review` (mutually exclusive); misconceptions de-duped in insertion order. It is just never rendered (§3).

---

## 3. What's missing / incomplete

1. **The lesson report card is not shipped (WP-9 incomplete).** The brief frames the report card as "surfaced on the celebration screen," but:
   - `LessonReportCard.tsx` **does not exist** (no file matches `*ReportCard*` under `src/`).
   - `CelebrationScreen.tsx` never imports or renders it; there is no `SlotFirstTry[]` handoff (no URL/`sessionStorage` payload).
   - `buildReportCard` (`learnerModel.ts:437`) is tested but **dead in production** — referenced only by `learnerModel.test.ts`.
   - The lesson player never builds `SlotFirstTry[]`, so the formative "Nailed / Worth a review / watch the gambler's fallacy" recap and the non-blocking "Practice these" invite (WP-9 DoD) are entirely absent. This is the single biggest gap and the main learning-science loss (see §6).

2. **`streak-100` ("Inevitable") milestone dropped.** PRD §9.5 AC #5 ("6 thresholds spanning 3 days to 100 days"), D28 ("3/7/14/30/60/100"), and `spec-habit-loop.md` all specify six milestones; `milestones.ts:1` ships five. `milestones.test.ts:30-34` was updated to assert "all 5 … at streak 100," locking the drift in green. A learner who reaches 100 days gets no celebration for the headline milestone.

3. **No integration test for the completion transaction.** `spec-habit-loop.md` step 12 calls for an emulator test asserting `xp`/`lessonsCompleted`/`currentStreak`/`milestonesReached` update atomically on completion. `habitService.ts` and `CelebrationScreen.tsx` have **no tests at all**; only the pure libs are covered. The riskiest code (the Firestore writes and the celebration wiring) is the least tested.

4. **XP ladder is duplicated, not reused.** `LessonPlayer.handleCheck` hardcodes the `10/5/2` ladder inline (`LessonPlayer.tsx:237-243`) instead of calling `xpForAttempt`. Values currently agree, but the source of truth is forked.

5. **No "comeback" celebration** after a broken long streak (acknowledged out-of-scope, D28). The `welcome-back` achievement partially covers this, but there is no dedicated reassurance moment — relevant to the streak-pressure concern in §6.

---

## 4. Bugs & risks (file:line, prioritized)

### P1

**Bug 1 — Re-completing a lesson double-awards XP / `lessonsCompleted` / `weeklyXp` (double-award race).**
`LessonPlayerInner` has no guard against re-entering a `state === 'completed'` lesson in non-review mode — the only `Navigate` guards are `LessonPlayer.tsx:87` (missing lesson) and the review-mode branch lives at the *tap* layer (`LessonNode.tsx`), not the engine. `applyLessonCompletion` is **not idempotent**: it unconditionally does `xp: increment(50)`, `lessonsCompleted: increment(1)`, and a `weeklyXp` increment (`habitService.ts:198-210`).
**Repro:** complete a lesson → land on `/celebration/:id` → press browser **Back** twice → you're back on `/lesson/:id` at the wrap slot in non-review mode → Continue re-runs `markLessonCompleted` + `applyLessonCompletion`, granting another `+50` XP and another `lessonsCompleted`. A bookmarked/typed `/lesson/:id` reaches the same state.
**Blast radius:** inflates lifetime XP, course progress, and leaderboard `weeklyXp`. Milestones and achievements do *not* double (both `arrayUnion`-idempotent), so milestone-once enforcement survives — the damage is the numeric counters. No real money is involved (D83), which is why this is P1 rather than P0, but it's reachable with an ordinary gesture and corrupts the core stats this feature exists to keep honest.
**Fix:** add an engine-level guard after the loading check — `if (progressState.status === 'ready' && progressState.data.state === 'completed' && !isReview) return <Navigate to={`/lesson/${lesson.id}?mode=review`} replace />;` — and/or make `applyLessonCompletion` idempotent via a `completion` guard (e.g. only increment when the persisted state transitions `in_progress → completed`). (Tracked as H1 in `code-audit.md`; still open in current source.)

### P2

**Bug 2 — Westward travel / clock-set-back resets a live streak (E3/E4).**
`nextStreak` only special-cases `lastActiveDate === today` (no-op) and `gap === 1` (consecutive). When the detected local date is *earlier* than `lastActiveDate` (traveling west across enough offset, or a wrong/rolled-back device clock), `gap = daysBetween(...) ≤ 0` → `missedDays < 1` → the `else` branch fires and the streak **resets to 1** (`streak.ts:77-89`). The spec's edge-case note only anticipated the equal-date no-op ("first correct check just no-ops … no crash"); the *backwards* case silently destroys the streak instead of no-opping.
**Fix:** treat `gap <= 0` as "already counted / clock anomaly" → no-op (return current streak unchanged), reserving reset for genuine forward gaps. P2 because it requires travel or a misconfigured clock (D22 accepts tz fragility for MVP), but the failure is a *loss* of a streak, not a harmless boundary feel.

**Bug 3 — Spec/code milestone-threshold drift (`streak-100` missing).** `milestones.ts:1` vs PRD §9.5 AC #5 / D28 / `spec-habit-loop.md`. See §3.2. P2: not a runtime fault, but a shipped product that silently fails an AC and a stated design decision, with the test rewritten to match the regression.

**Bug 4 — `weeklyXp` can be clobbered at a week boundary under snapshot lag.**
`applyLessonCompletion` computes `sameWeek` from the **snapshot** `profile.weekKey` (`habitService.ts:194`) and, when false, *overwrites* `weeklyXp` with `50` instead of incrementing (`:201`, mirrored at `:216`). If earlier per-check writes in the same lesson already advanced the server's `weekKey`/`weeklyXp` but the live snapshot hasn't caught up, this discards the weekly XP the lesson already earned. The adjacent achievement write tolerates lag because it's idempotent; this assignment is not. (Tracked as M2; still open.) **Fix:** always `increment` here and own the weekly reset where `weekKey` is first observed to change, or recompute inside a transaction.

**Bug 5 — Celebration streak number / milestone can lag a session.**
`applyLessonCompletion` derives the milestone set and the celebration's `streak=` value from `profile.currentStreak` (the snapshot, `habitService.ts:174-175`, returned at `:231`). If the lesson's final correct check just bumped the streak server-side and the `onSnapshot` hasn't re-emitted before the wrap-slot Continue, the celebration can show a streak one lower than the truth and defer the just-crossed milestone to the *next* completion. `isNewStreakDay` itself is correct (tracked via `isNewStreakDayRef`). P2: usually masked because the last check precedes one or more non-problem slots, giving the snapshot time to settle.

**Bug 6 — XP logic forked in the lesson player.** `LessonPlayer.tsx:237-243` duplicates the `xpForAttempt` ladder. P2 (drift risk only; values currently agree). **Fix:** call `xpForAttempt(attemptNumber, result.wasCorrect)`.

**Bug 7 — Daily-goal pill doesn't roll over at live midnight.** `today` is computed once per render (`HomePage.tsx:67`); with the Home tab left open across midnight, the pill stays "Done for today" until the next render/navigation. AC #9 says it "rolls over at local midnight." P2: a left-open-tab edge; resolves on any interaction. **Fix:** a midnight-scheduled state tick, or recompute `today` on focus/visibility change.

**Bug 8 — Coins are client-trusted (economy integrity).** The social "first follow / first kudos" coin awards (`socialService.ts`) and the achievement coin grants in `habitService.ts:85`/`:207` are gated on a client-supplied `achievements` array and an allowlisted `coins` increment with no server-side first-time check. A tampering client can mint coins (which buy Streak Freezes + cosmetics). `code-audit.md` H2 documents this; the `bugs.md` framing calls out XP but not coins. P2 (no real money, D83), but should be documented as a coin/economy gap and moved server-side post-MVP.

### P3 / notes

- `dailyGoalDone` recomputes `Intl.DateTimeFormat().resolvedOptions().timeZone` inside its loop (`recommendations.ts:63`) — micro-perf; hoist it.
- Confetti re-randomizes per render (`CelebrationScreen.tsx:60-62`) — cosmetic, memoize per mount (B047).
- `practiceXp.ts` (~89 lines, fully tested) and `buildReportCard` are dead in production today — fine if Practice/WP-9 are imminent, otherwise misleading.
- `isYesterday` (`streak.ts:12`) is unused by app code (only the test) — `nextStreak` uses `daysBetween` directly.

---

## 5. Pros / Cons

**Pros**
- Clean separation: all reward *math* is pure, framework-free, and unit-tested (`xp`/`streak`/`milestones`/`levels`/`weeklyXp`/`achievements`/`coins`/`practiceXp`), with the impure Firestore work isolated in `habitService`.
- Idempotent reward sets (`newMilestonesFor`, `newAchievementsFor`) written via `arrayUnion` → milestone/achievement *once-ever* semantics are robust even under the re-completion bug.
- DST-aware date math (noon anchoring in `daysBetween`) and per-session tz detection (D22) handle the common 11:59pm→12:01am case correctly.
- Refresh-safe celebration via URL params (AC #8) is a genuinely correct design choice, not memory-dependent.
- Real-time in-lesson chips are wired to the live profile snapshot — the "watch XP tick up" payoff (AC #10) works.
- Thoughtful motivational scaffolding already present: persistence reward (`+2` never 0 for effortful correctness), Streak Freeze forgiveness (D79), cosmetic-only coins (D83), and SDT-aware achievement copy.

**Cons**
- The formative **report card — the one surface that turns the celebration from a dopamine hit into actionable learning feedback — is unbuilt** despite being the brief's headline for this feature.
- The two highest-risk modules (`habitService`, `CelebrationScreen`) are untested; the green suite gives false confidence about the completion/celebration path specifically.
- Re-completion double-award (Bug 1) is a real, reachable data-integrity hole in the exact counters this feature owns.
- Spec drift (missing `streak-100`) with a test rewritten to bless it — the kind of regression that audits exist to catch.
- Reward density skews heavily extrinsic (XP, coins, levels, ranks, leaderboard, streaks, milestones, achievements) relative to competence/feedback signals — see §6.

---

## 6. Learning-science assessment

**Extrinsic vs intrinsic / over-justification.** The build is reward-dense: XP, levels, pirate ranks, coins, a friends leaderboard, streaks, milestones, and achievements all fire around a single lesson. The code comments show real awareness of the over-justification effect (`coins.ts`, `achievements.ts`), and the safeguards are good — coins are cosmetic/forgiveness only (D83), and achievement copy is *informational* ("that's where learning sticks") rather than controlling. The risk is **density, not any single mechanic**: when finishing one lesson triggers confetti + count-up + level-up + streak + milestone + coins, the salient signal becomes "collect rewards," which SDT and Deci/Ryan warn can crowd out interest in probability itself. The missing report card is what would rebalance this toward *competence* feedback.

**SDT — autonomy / competence / relatedness.**
- *Autonomy:* mostly respected — the Streak Freeze (D79) and the explicitly **non-blocking** "Practice these" invitation in the WP-9 spec are autonomy-supportive. **But the invitation is not built**, so the one designed autonomy-supportive feedback affordance is absent today.
- *Competence:* under-served. XP rewards *activity*, not *understanding*. The only competence-signaling surface designed for the celebration (the report card's "Nailed / Worth a review") is missing, so a learner who guessed their way through and one who reasoned cleanly see the *same* celebration.
- *Relatedness:* served by the friends leaderboard + kudos (out of this feature's core, but adjacent).

**Streak pressure on a high-school learner.** Daily-streak mechanics are the sharpest double-edged tool here. For a teen with exam weeks, illness, or family travel, an all-or-nothing streak manufactures loss-aversion anxiety and can drive churn precisely when the learner is most fragile. Mitigations present: Streak Freeze (D79) and a softening `welcome-back` achievement. Mitigations missing: a dedicated "comeback" reassurance (acknowledged out-of-scope), and **Bug 2 actively works against the learner** — a family trip west can wipe a streak that a freeze should have protected. Net: the streak is humane *by design* but has a sharp, unhandled edge in implementation.

**Does the report card give actionable retrieval feedback?** **No — because it isn't surfaced.** This is the most important learning-science finding. The pure fold exists and is correct (`buildReportCard`, grounded in the learner's own first-attempt results — exactly the right retrieval-practice signal: first-try success is the memory-strengthening event, per Roediger/Karpicke), but nothing renders it. So the celebration currently delivers *reward* without *retrieval feedback*. Wiring WP-9 would convert the celebration into a Khan-style formative recap ("you nailed favorable-over-total; review ordered-vs-unordered; watch the gambler's fallacy"), which is the highest-leverage learning improvement available and is largely already written.

---

## 7. Prioritized recommendations

1. **Ship the report card (WP-9).** Build `LessonReportCard.tsx`, hand `SlotFirstTry[]` from the lesson player to the celebration (URL if small, else `sessionStorage` keyed by `lessonId` to preserve refresh-safety per the spec), and render it between the XP/streak beats and "Back to Home." Highest learning-science ROI; the pure logic and labels already exist. *(Fixes §3.1; addresses the §6 competence gap.)*
2. **Close the re-completion double-award (Bug 1, P1).** Add the engine-level completed-state `Navigate` guard *and* make `applyLessonCompletion` idempotent on the `in_progress → completed` transition. Protects every counter this feature owns.
3. **Fix the streak backward-gap reset (Bug 2, P2).** Treat `gap <= 0` as a no-op in `nextStreak`. Small, pure, unit-testable; removes a user-hostile streak loss for travelers — directly relevant to the HS-learner streak-pressure concern.
4. **Restore `streak-100` "Inevitable" (Bug 3, P2)** to `MILESTONE_THRESHOLDS`/`MILESTONE_TITLES` and correct the milestone test, or formally amend PRD §9.5/D28 if 60 is now intentional. Don't leave code and spec disagreeing with a test blessing the drift.
5. **Make `weeklyXp` writes increment-only at completion (Bug 4, P2)** and own week reset where `weekKey` first changes; prevents silent leaderboard-XP loss at the week boundary.
6. **Add tests for the untested risk surface.** An emulator integration test for `applyLessonCompletion` atomicity (spec step 12) and an RTL test for `CelebrationScreen` refresh-safety + ordering. Today the green suite doesn't cover the completion/celebration path.
7. **De-duplicate the XP ladder (Bug 6)** — call `xpForAttempt` in `LessonPlayer.handleCheck`.
8. **Tune reward density toward competence.** Lead the celebration with the report-card's "what you understood," let XP/streak follow; consider gating confetti intensity to first-try performance so the *feedback* is the loudest signal. Document coins as a client-trust/economy gap (Bug 8) and plan server-side enforcement post-MVP.

---

### Executive summary

- **Working:** All 10 PRD §9.5 ACs are met except the report card — XP decay (`10/5/2`, wrong `0`, never decreases), completion bonus, consecutive-day streak + `bestStreak`, once-ever milestones bundled into the next celebration, spec-ordered celebration, URL-param refresh-safety (AC #8), the daily-goal pill, and live in-lesson XP/streak chips (AC #10). Reward *math* is pure, isolated, and well-tested (`levels`, `weeklyXp` ISO weeks, achievements/coins idempotency all verified sound).
- **Biggest gap:** The **lesson report card is not shipped** — `LessonReportCard.tsx` doesn't exist, `CelebrationScreen.tsx` never renders it, and `buildReportCard` (`src/features/learner/learnerModel.ts:437`) is correct but dead in production. The celebration delivers reward without retrieval feedback.
- **Most severe bug (P1):** Re-completing a lesson double-awards XP/`lessonsCompleted`/`weeklyXp` — `LessonPlayer` has no completed-state guard and `applyLessonCompletion` is not idempotent (`src/features/habit/habitService.ts:198-210`); reachable by pressing browser Back twice from the celebration. Milestones/achievements survive (both `arrayUnion`), so the damage is the core counters.
- **Second bug (P2, learner-hostile):** Westward travel or a backward clock resets a live streak instead of no-opping — `nextStreak` only handles the equal-date case, so `gap <= 0` falls through to reset (`src/lib/streak.ts:77-89`).
- **Spec drift (P2):** `streak-100` "Inevitable" was dropped — `src/lib/milestones.ts:1` ships 5 of the 6 thresholds in PRD §9.5 AC #5 / D28, with `milestones.test.ts:30` rewritten to bless it.
- **Other risks:** `weeklyXp` clobber at a week boundary under snapshot lag (`habitService.ts:201`); celebration streak/milestone can lag a snapshot; XP ladder forked in `LessonPlayer.tsx:237-243`; daily-goal pill doesn't roll at live midnight; coins are client-trusted; `habitService`/`CelebrationScreen` have **no tests**.
- **Learning-science verdict:** Humane scaffolding (Streak Freeze D79, SDT-aware copy, cosmetic-only coins D83) but reward-dense and competence-light. The celebration rewards activity, not understanding.
- **Top learning-science improvement:** Wire WP-9 so the celebration shows the formative "Nailed / Worth a review / watch the gambler's fallacy" recap plus the non-blocking "Practice these" invite — grounded in the learner's own first-attempt retrieval results, with the logic already written.
