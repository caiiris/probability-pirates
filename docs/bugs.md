# Bugs — Surfaced & Fixed

> Running log of verified bugs found during implementation review.
> Companion to [`docs/issues.md`](issues.md) and [`docs/build-order.md`](build-order.md).
>
> **Status key:** `open` · `fixed` · `wontfix` · `false-positive` · `known-gap`
> **Severity:** `critical` · `high` · `medium` · `low`

IDs are monotonically increasing (`B001`…), never reused.

---

## Summary

| Verdict | Count |
| --- | ---: |
| **Fixed** | 35 |
| **Wontfix / Known gap** | 4 |
| **False positives** | 5 |

`npm run verify` passes: **0 type errors · 0 lint warnings · 89/89 tests** (2026-06-23).

---

## Original 50 — item-by-item verdict

| # | Original finding | Verdict | Bug ID |
| --- | --- | --- | --- |
| 1 | AuthProvider listener leak | FIXED | B001 |
| 2 | Stale `currentAnswer` across slots | **FALSE POSITIVE** | cleared on every Continue |
| 3 | Double XP on completion | FIXED | B004 |
| 4 | Re-completion without replay | FIXED | B003 |
| 5 | "All caught up" hero hidden | FIXED | B002 |
| 6 | Stale React `profile` in habit writes | FIXED | B006 |
| 7 | `setState` during render | FIXED | B010 |
| 8 | `toast` during render | FIXED | B011 |
| 9 | Side effect in `useMemo` | FIXED | B012 |
| 10 | `useMemo` deps omit `selectedVariantIds` | FIXED | B014 |
| 11 | Problem slot blank when progress `'empty'` | FIXED | B015 |
| 12 | `xpEarnedThisAttempt` overwrites | FIXED | B005 |
| 13 | Course progress `X / 1` not `X / 6` | FIXED | B016 |
| 14 | Celebration progress uses `lesson.number` | FIXED | B017 |
| 15 | Celebration XP undercounts | FIXED | B018 (follows B005) |
| 16 | `stepsCompleted` not on concept/wrap | FIXED | B008 |
| 17 | Lesson card bypasses replay dialog | FIXED | B009 |
| 18 | Firestore client tampering | KNOWN GAP | MVP-accepted |
| 19 | No login redirect when signed in | **FALSE POSITIVE** | not in spec |
| 20 | `profile === null` skips habit writes | FIXED | B044 |
| 21 | Missing XP chip in lesson header | FIXED | B020 |
| 22 | Hints not dismissible | FIXED | B021 |
| 23 | Grid wrong-cell rose flash | FIXED | B022 |
| 24 | Fill-fraction reduce animation | FIXED | B023 (shows locked on correct) |
| 25 | Zero-denominator hint not guaranteed | **FALSE POSITIVE** | content-dependent |
| 26 | Tap-outcomes duplicate feedback unreachable | WONTFIX | B045 — toggle is spec-correct; `duplicate` key in content is dead but harmless |
| 27 | `recordAttempt` never passes `nextSlotIndex` | WONTFIX | B034 — split writes; MVP accepted |
| 28 | No Firestore write retry | FIXED | B024 (retry in completion path) |
| 29 | Offline banner missing | FIXED | B025 |
| 30 | Error boundary missing | FIXED | B026 |
| 31 | `prefers-reduced-motion` not respected | FIXED | B027 |
| 32 | Milestone/streak logic at completion redundant | **FALSE POSITIVE** | fixed by B006 refactor |
| 33 | Daily goal vs streak on partial failure | WONTFIX | B046 — transient only; retry reduces occurrence |
| 34 | `completedAt.seconds` Timestamp shape | **FALSE POSITIVE** | SDK Timestamp has `.seconds` |
| 35 | `startReplay` no `completed` guard | FIXED | B028 |
| 36 | `getOrCreateProgress` on completed lesson | duplicate of B003 | — |
| 37 | Profile shows two lesson counts | FIXED | B047 (renamed label) |
| 38 | Emulator double-connect on HMR | FIXED | B048 |
| 39 | Grid labels `row+col` | DOWNGRADED | pedagogy nit |
| 40 | Edit profile placeholder copy | DOWNGRADED | copy nit |
| 41 | EditProfileDialog stale bio on reopen | FIXED | B049 |
| 42 | RegisterPage no trim | FIXED | B050 |
| 43 | Catch-all double redirect | DOWNGRADED | works correctly |
| 44 | No auth integration tests | OPEN | B033 |
| 45 | No progress/habit integration tests | OPEN | B033 |
| 46 | Mid-file imports in LessonPlayer | DOWNGRADED | style only — fixed as side-effect |
| 47 | Confetti `Math.random` on re-render | DOWNGRADED | visual polish |
| 48 | `useCountUp(0)` shows +0 | DOWNGRADED | minor UX |
| 49 | I001 missing explanations | KNOWN GAP | `docs/issues.md` I001 |
| 50 | Login while authenticated | **FALSE POSITIVE** | duplicate of #19 |

**New on second pass:**

| ID | Finding | Verdict |
| --- | --- | --- |
| B013 | pickedVariantId race (wrong variant graded) | FIXED |
| B019 | Completion failure still navigates | FIXED |
| B029 | slotIndex not monotonic | FIXED |
| B030 | Locked-lesson toast hardcoded "Lesson 1" | FIXED |
| B031 | Daily goal pill missing checkmark | FIXED |
| B032 | `milestonesReached` undefined crash | FIXED |
| B034 | Writes not atomic | WONTFIX (MVP) |
| B044 | `profile === null` silent | FIXED |
| B045 | Tap-outcomes duplicate unreachable | WONTFIX |
| B046 | Daily goal stale on completion failure | WONTFIX |
| B047 | Denormalized vs live lesson count | FIXED |
| B048 | Emulator HMR reconnect | FIXED |
| B049 | EditProfileDialog stale bio | FIXED |
| B050 | RegisterPage no trim | FIXED |

---

## Fixed bugs

### B001 — AuthProvider never unsubscribes profile listeners
- **Status:** fixed · 2026-06-23
- **Fix:** Store `unsubProfile` in a closure var; tear it down before each new auth state change, and in the outer cleanup. The `return unsubProfile` pattern (inside onAuthStateChanged callback) is a Firebase no-op.
- **File fixed:** `src/features/auth/AuthProvider.tsx`

---

### B002 — HomePage hides hero when all lessons complete
- **Status:** fixed · 2026-06-23
- **Fix:** Added `allCompleted` boolean (derived from `progressMap`). HeroCard now renders when `recommendation !== null || isNewUser || allCompleted`.
- **File fixed:** `src/features/course/HomePage.tsx`

---

### B003 — Completed lesson re-entry re-completes without replay
- **Status:** fixed · 2026-06-23
- **Fix:** `LessonCard` detects `state === 'completed'` and opens a replay confirmation dialog that calls `startReplay` before navigating.
- **Files fixed:** `src/features/course/LessonCard.tsx`

---

### B004 — Profile XP double-counted on lesson completion
- **Status:** fixed · 2026-06-23
- **Fix:** `applyLessonCompletion` now increments XP by `LESSON_COMPLETION_BONUS` only (50 XP). Per-check XP was already written by `applyAttemptOutcome`. The `xpEarnedThisLesson` return value (for celebration display) still includes check XP + bonus.
- **File fixed:** `src/features/habit/habitService.ts`

---

### B005 — `xpEarnedThisAttempt` overwrites instead of accumulates
- **Status:** fixed · 2026-06-23
- **Fix:** `recordAttempt` now uses `increment(xpAwarded)` (Firestore atomic increment) instead of assigning.
- **File fixed:** `src/features/progress/progressService.ts`

---

### B006 — Stale React `profile` causes streak double-increment
- **Status:** fixed · 2026-06-23
- **Fix:** `applyLessonCompletion` no longer re-runs `nextStreak`. It uses `profile.currentStreak` directly (already updated by `applyAttemptOutcome` during the lesson). `LessonPlayer` passes `isNewStreakDay` (tracked via ref during the lesson) to `applyLessonCompletion`.
- **Files fixed:** `src/features/habit/habitService.ts`, `src/features/lesson/LessonPlayer.tsx`

---

### B007 — Celebration `streakDelta` never shows +1
- **Status:** fixed · 2026-06-23
- **Fix:** `LessonPlayer` tracks `isNewStreakDayRef` from `applyAttemptOutcome` return value. This is passed to `applyLessonCompletion` and propagated to celebration URL params.
- **Files fixed:** `src/features/lesson/LessonPlayer.tsx`, `src/features/habit/habitService.ts`

---

### B008 — `stepsCompleted` not incremented for concept/wrap slots
- **Status:** fixed · 2026-06-23
- **Fix:** Added `applySlotAdvance(uid)` in `habitService` that only increments `stepsCompleted`. Called in `LessonPlayer.handleContinue` for all non-problem slots (concept, wrap), including the last slot.
- **Files fixed:** `src/features/habit/habitService.ts`, `src/features/lesson/LessonPlayer.tsx`

---

### B009 — Lesson card missing replay confirmation
- **Status:** fixed · 2026-06-23
- **Fix:** Same as B003 — `LessonCard` now shows a replay dialog for completed lessons.
- **File fixed:** `src/features/course/LessonCard.tsx`

---

### B010 — `setState` during render in LessonPlayer init
- **Status:** fixed · 2026-06-23
- **Fix:** Replaced the synchronous `if (!initialized)` guard with a `useEffect` that calls `getOrCreateProgress` after mount. Removed `initialized` state entirely.
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B011 — `toast()` called during render on coming-soon redirect
- **Status:** fixed · 2026-06-23
- **Fix:** Extracted a `ComingSoonRedirect` component that shows the toast in a `useEffect` before navigating.
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B012 — Side effect inside `useMemo` (variant pick)
- **Status:** fixed · 2026-06-23
- **Fix:** `onVariantPicked` moved from inside `useMemo` to a `useEffect` that runs when `variant.id` changes. A `lastNotifiedRef` guards against duplicate calls.
- **File fixed:** `src/features/lesson/ProblemSlotView.tsx`

---

### B013 — `pickedVariantId` race: Check can grade wrong variant
- **Status:** fixed · 2026-06-23
- **Fix:** `pickedVariantIdRef` (a `useRef`) stores the latest value synchronously when `handleVariantPicked` is called. `handleCheck` reads from the ref, not from the potentially-stale state.
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B014 — `useMemo` omits `progress.selectedVariantIds` from deps
- **Status:** fixed · 2026-06-23
- **Fix:** Added `savedVariantId = progress.selectedVariantIds[slot.id]` to the memo deps array so resume always restores the correct variant.
- **File fixed:** `src/features/lesson/ProblemSlotView.tsx`

---

### B015 — Problem slot blank while progress is `'empty'`
- **Status:** fixed · 2026-06-23
- **Fix:** `LessonPlayerInner` treats `status === 'empty'` the same as `'loading'` and shows the skeleton.
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B016 — Course progress UI shows `X / 1` not `X / 6`
- **Status:** fixed · 2026-06-23
- **Fix:** `courseProgress()` returns `total: COURSE_SIZE` (6) always. Unit test updated to expect `total: 6`.
- **Files fixed:** `src/features/course/recommendations.ts`, `src/features/course/recommendations.test.ts`

---

### B017 — Celebration course progress uses `lesson.number`
- **Status:** fixed · 2026-06-23
- **Fix:** `LessonPlayer` passes `completed={newLessonsCompleted}` in celebration URL params. `CelebrationScreen` reads this param instead of `lesson.number`.
- **Files fixed:** `src/features/lesson/LessonPlayer.tsx`, `src/features/habit/CelebrationScreen.tsx`

---

### B018 — Celebration XP display undercounts
- **Status:** fixed · 2026-06-23
- **Fix:** Fixed as a consequence of B005 (accumulate) + B004 (bonus only at completion). `xpEarnedThisLesson` in the celebration URL is now the correct sum.

---

### B019 — `applyLessonCompletion` failure still navigates silently
- **Status:** fixed · 2026-06-23
- **Fix:** Added one retry of `applyLessonCompletion` on failure. If retry also fails, a toast informs the user. Navigation always proceeds (lesson is already marked complete — non-destructive).
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B020 — Missing XP chip in lesson player header
- **Status:** fixed · 2026-06-23
- **Fix:** Added `currentXp` prop to `LessonHeader`; rendered as a ⚡ chip alongside the streak chip.
- **Files fixed:** `src/features/lesson/LessonHeader.tsx`, `src/features/lesson/LessonPlayer.tsx`

---

### B021 — Interaction hints not dismissible / no localStorage
- **Status:** fixed · 2026-06-23
- **Fix:** Created `useInteractionHint(kind)` hook + `InteractionHint` component. Each interaction renders the hint only when not dismissed; tap × to hide and persist to `localStorage.interactionHintsDismissed`.
- **Files fixed:** all 5 interaction components + `useInteractionHint.ts` + `InteractionHint.tsx`

---

### B022 — Grid wrong-answer rose flash not implemented
- **Status:** fixed · 2026-06-23
- **Fix:** `GridEvent` uses `useEffect` watching `feedbackState === 'wrong'` to set a 600ms `flashWrong` flag. Selected cells render rose background during that window.
- **File fixed:** `src/features/lesson/interactions/GridEvent.tsx`

---

### B023 — Fill-fraction "reduce on correct" animation missing
- **Status:** fixed · 2026-06-23 (partial)
- **Fix:** Inputs lock (`disabled`) when `feedbackState === 'correct'`, visually indicating the answer is set. Full animated reduce-to-simplified-form requires knowing the canonical simplified fraction from the variant — deferred to content enrichment (I001 area).

---

### B024 — No Firestore write retry
- **Status:** fixed · 2026-06-23 (completion path)
- **Fix:** `applyLessonCompletion` is retried once on failure in `LessonPlayer`. Write-retry for per-check calls (B034 scope) left as known gap for MVP.
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B025 — Offline banner not implemented
- **Status:** fixed · 2026-06-23
- **Fix:** `OfflineBanner` component listens to `window online/offline` events and shows a sticky destructive banner.
- **Files fixed:** `src/components/OfflineBanner.tsx`, `src/App.tsx`

---

### B026 — Root error boundary not implemented
- **Status:** fixed · 2026-06-23
- **Fix:** `ErrorBoundary` class component wraps the entire app in `App.tsx`. Shows a "Something went wrong" fallback with a Back to home button.
- **Files fixed:** `src/components/ErrorBoundary.tsx`, `src/App.tsx`

---

### B027 — `prefers-reduced-motion` not respected
- **Status:** fixed · 2026-06-23
- **Fix:** Wrapped app in Framer Motion's `<MotionConfig reducedMotion="user">` — automatically disables all Framer animations when the OS accessibility setting is active.
- **File fixed:** `src/App.tsx`

---

### B028 — `startReplay` doesn't require `state === 'completed'`
- **Status:** fixed · 2026-06-23
- **Fix:** `startReplay` reads the current doc and returns an error if `state !== 'completed'`.
- **File fixed:** `src/features/progress/progressService.ts`

---

### B029 — `slotIndex` not monotonic
- **Status:** fixed · 2026-06-23
- **Fix:** `advanceSlot` reads the current `slotIndex` before writing; only writes if `nextSlotIndex > currentIndex`.
- **File fixed:** `src/features/progress/progressService.ts`

---

### B030 — Locked-lesson toast hardcoded "Lesson 1"
- **Status:** fixed · 2026-06-23
- **Fix:** Toast now reads `lesson.number - 1` dynamically.
- **File fixed:** `src/features/course/LessonCard.tsx`

---

### B031 — Daily goal pill missing checkmark
- **Status:** fixed · 2026-06-23
- **Fix:** Added `<Check>` icon from lucide-react alongside "Done for today" text.
- **File fixed:** `src/features/course/HomePage.tsx`

---

### B032 — `milestonesReached` may be undefined on malformed docs
- **Status:** fixed · 2026-06-23
- **Fix:** `newMilestonesFor` now accepts `string[] | undefined` and defaults to `[]`. `MilestonesRow` also defaults to `[]`.
- **Files fixed:** `src/lib/milestones.ts`, `src/features/profile/MilestonesRow.tsx`

---

### B033 — No auth/progress emulator integration tests
- **Status:** open
- **Severity:** medium
- **Note:** Requires Firebase emulator setup; deferred.

---

### B044 — `profile === null` silently skips habit writes
- **Status:** fixed · 2026-06-23
- **Fix:** Both `handleCheck` and `handleContinue` now show a toast when `profile` is null so the user knows XP/streak may not update.
- **File fixed:** `src/features/lesson/LessonPlayer.tsx`

---

### B047 — Profile "Lessons" vs "Course" dual-count confusion
- **Status:** fixed · 2026-06-23
- **Fix:** Renamed "Lessons" stat label to "Completions" to clarify it counts total completions including replays, while "Course" shows current distinct completion progress.
- **File fixed:** `src/features/profile/StatsGrid.tsx`

---

### B048 — Firebase emulator reconnect throws on HMR
- **Status:** fixed · 2026-06-23
- **Fix:** Wrapped `connectAuthEmulator` / `connectFirestoreEmulator` in try/catch.
- **File fixed:** `src/lib/firebase.ts`

---

### B049 — EditProfileDialog bio not synced on open
- **Status:** fixed · 2026-06-23
- **Fix:** `useEffect([open, currentBio])` syncs `bio` state from props whenever the dialog opens.
- **File fixed:** `src/features/profile/EditProfileDialog.tsx`

---

### B050 — RegisterPage doesn't trim inputs
- **Status:** fixed · 2026-06-23
- **Fix:** `validate()` and `registerUser()` call both now use `.trim()` on email and username.
- **File fixed:** `src/features/auth/RegisterPage.tsx`

---

### B051 — Firestore security rules over-permissive (PII leak + integrity bypass)
- **Status:** fixed · 2026-06-23
- **Severity:** critical (PII), critical (integrity), moderate (validation gaps)
- **Fix:** Hardened `firebase/firestore.rules` along five axes, all in one pass. Audited per `firebase-security-rules-auditor` skill checklist and validated via Firebase MCP `firebase_validate_security_rules` (OK, no errors). Behavior changes:
  1. **`/users/{uid}` read** — was `request.auth != null` (any signed-in user could read every other user's `email`, `bio`, `lastActiveDate`, etc.). Now owner-only: `request.auth.uid == uid`.
  2. **`/users/{uid}` update** — was `request.auth.uid == uid` with no field constraints (a user could wipe `createdAt`, mutate `email`/`username`, or invent arbitrary new fields). Now constrained by `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])` to the exact field set that `habitService` + `userService.updateProfile` actually write: `xp`, `stepsCompleted`, `currentStreak`, `bestStreak`, `lastActiveDate`, `lessonsCompleted`, `milestonesReached`, `bio`, `avatarUrl`. Note: this does not stop a determined cheater from inflating their own XP via direct client writes (see B034 / KNOWN GAP) — it stops them from corrupting identity fields and inventing new ones.
  3. **`/users/{uid}` create** — added type/size validation on `displayUsername` (string, ≤30 chars) and `bio` (string, ≤200 chars), and zeroed-out invariants for `bestStreak`, `stepsCompleted`, `lessonsCompleted` (only `xp` and `currentStreak` were zero-checked before).
  4. **`/users/{uid}/stepAttempts/{attemptId}` create** — added type checks: `attemptNumber is int`, `wasCorrect is bool`, plus `xpAwarded is int && 0 ≤ xpAwarded ≤ 20` (was unbounded). The xp range covers the current ceiling of 10/attempt + headroom; tighten if `xpForAttempt` ever exceeds.
  5. **`/usernames/{name}` create** — added length cap (3–30 chars) to prevent storage-bloat abuse (was unbounded).
- **Files fixed:** `firebase/firestore.rules`
- **Deploy:** `npx firebase-tools@latest deploy --only firestore:rules`

---

### B052 — `EmailVerificationBanner` destructures `user` off discriminated `AuthState`
- **Status:** fixed · 2026-06-23
- **Severity:** medium (typecheck failure — `npm run verify` blocked)
- **Fix:** `useAuth()` returns `{status: 'loading'} | {status: 'unauthenticated'} | {status: 'authenticated', user, profile}`. The banner did `const { user } = useAuth()`, which fails type-narrowing on the non-authenticated variants. Replaced with explicit narrowing: `const user = auth.status === 'authenticated' ? auth.user : null`.
- **File fixed:** `src/components/EmailVerificationBanner.tsx`
- **Note:** untracked file (never committed); typecheck error existed since the file was first authored. Surfaced when running `verify` post-Remote-Config refactor.

### B053 — Schedule page crashes: `useStudyEvents` ready field named `events`, consumer reads `.data`
- **Status:** fixed · 2026-06-23
- **Severity:** critical (entire `/schedule` route crashes to the root ErrorBoundary — the user-visible "Something went wrong")
- **Symptom:** opening `/schedule` immediately renders the ErrorBoundary fallback ("Something went wrong").
- **Root cause:** every other async-state hook in the codebase (`useLessonProgress`, `useAllLessonProgress`) shapes its ready state as `{ status: 'ready'; data: T }`, and `SchedulePage` follows that convention: `const events = eventsState.status === 'ready' ? eventsState.data : []`. But `useStudyEvents` diverged and named the field `events` (`{ status: 'ready'; events: StudyEvent[] }`). So `eventsState.data` is `undefined` on the ready branch, and the next line — `for (const ev of events)` building `eventsByDate` — throws `TypeError: undefined is not iterable`, which the ErrorBoundary catches. `tsc` also flagged it (TS2339 `Property 'data' does not exist`), but Vite's dev server uses esbuild (no typecheck), so it shipped to the browser as a runtime crash.
- **Fix:** renamed the hook's ready field from `events` to `data` to match the house convention, fixing both setState calls. One-line consumer change avoided; the hook is now consistent with the rest of the codebase.
- **Files fixed:** `src/features/schedule/useStudyEvents.ts`
- **Regression test:** `src/features/schedule/useStudyEvents.test.ts` — asserts the ready state is `{ status: 'ready', data: [...] }` and that `.events` is `undefined`, so reintroducing the old field name fails CI.
- **Note:** untracked feature (never committed); the bug existed since the file was authored. The lesson: discriminated-union state hooks should share one field name (`data`) so consumers are interchangeable.

### B054 — Add-event dialog never resets; saves to the wrong/stale date
- **Status:** fixed · 2026-06-23
- **Severity:** medium (data-correctness: events save to the wrong day; stale title/notes persist across opens)
- **Symptom:** select a day other than today, tap "Add" — the Date field still shows the previously-used date (and any prior title/notes linger). Saving writes the event to the stale date, so it appears on the wrong calendar day.
- **Root cause:** `AddEventDialog` reset its form inside `handleOpenChange(v)` (when `v === true`), wired to the Radix `Dialog`'s `onOpenChange`. But the dialog is opened **programmatically** by the parent (`setAddOpen(true)`), and Radix only fires `onOpenChange` in response to its own internal interactions (overlay/ESC/close), not parent `open`-prop changes. So the reset branch never ran on open, and `date` (initialized once via `useState(defaultDate)`) stayed frozen at its first value.
- **Fix:** replaced the open-time reset with a `useEffect(() => { if (open) { …reset… } }, [open, defaultDate])`, which fires reliably whenever the dialog opens or the selected day changes. The `Dialog` now forwards `onOpenChange` directly.
- **Files fixed:** `src/features/schedule/SchedulePage.tsx`
- **Design choice:** an effect (not a `key`-based remount) keeps the dialog's mount stable while still resetting deterministically; `defaultDate` is in the dep array so reopening on a different day prefills correctly.

---

## Wontfix / Known gaps

| ID | Reason |
| --- | --- |
| B033 | Integration tests require Firebase emulator setup — deferred |
| B034 | Per-check writes not atomic (XP + progress separate) — MVP accepted |
| B045 | Tap-outcomes `duplicate` feedback unreachable — toggle is spec-correct; dead content key harmless |
| B046 | Streak/daily-goal transient inconsistency on completion failure — retry reduces occurrence; fully fixing requires architecture change |
| B036 | Missing `explanation` copy on Lesson 1 variants — content gap, tracked in `docs/issues.md` I001 |

---

## Changelog

| Date | Action |
| --- | --- |
| 2026-06-23 | Initial audit: all 50 items re-verified; 35 confirmed + new bugs found |
| 2026-06-23 | Full fix pass: 31 bugs fixed; `npm run verify` passes 60/60 tests |
| 2026-06-23 | Firebase plugin pass: B051 (rules hardening) + B052 (banner type narrowing) fixed; Remote Config introduced (see `docs/issues.md` I027); 33 fixed total; `npm run verify` passes 65/65 tests |
| 2026-06-23 | Schedule feature audit: B053 (`/schedule` crash — hook field mismatch) + B054 (add-event dialog stale date) fixed; 35 fixed total; `npm run verify` passes 89/89 tests |
| 2026-06-23 | Schedule typed-events pass (`docs/issues.md` I032): event-type taxonomy (study/test/homework/other) + optional time, type-colored badges and calendar dots, rules validation extended; `npm run verify` passes 118/118 tests |
