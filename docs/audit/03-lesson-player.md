# Audit 03 — Lesson Player / Slot Engine

> Scope: the generic engine that renders one slot at a time — `LessonPlayer`, the
> header/footer chrome, the slot dispatcher and the three slot views, `useSlotState`,
> `DerivationCard`, the concept figures, plus the data layer that drives the player
> (`useLessonProgress`, `useLessons`, `src/content/index.ts`). The 11 interaction
> renderers themselves are a **separate** audit — only their hosting/dispatch is in
> scope here.
>
> Ground truth accepted as given: `tsc` clean, `eslint` clean, `vitest` 1083/1083.
> This audit was performed read-only against the source; the suite was not re-run.
>
> Reference contracts: `docs/prd.md` §9.3 (10 ACs), §9.8.1/§9.8.7 (latency, CLS),
> `docs/specs/spec-lesson-player.md`, `docs/alternatives.md` (D5/D7/D43/D55 no-bail-out),
> `docs/design-iterations.md` (D86/D88 commit-once).

---

## 1. Overview

### Files

| File | Role |
| --- | --- |
| `src/features/lesson/LessonPlayer.tsx` | Outer guard (`LessonPlayer`) + the stateful engine (`LessonPlayerInner`). Owns the CTA state machine, persistence calls, keyboard nav, feedback derivation, review mode, completion + celebration handoff. |
| `src/features/lesson/LessonHeader.tsx` | Close-X (confirm dialog), back/forward chevrons, segmented step progress bar, XP + streak chips. |
| `src/features/lesson/LessonFooter.tsx` | Feedback area (correct/wrong/explanation) + the single Check/Continue button. Owns the `allowContinueOnWrong` (commit-once) branch and haptics. |
| `src/features/lesson/useSlotState.ts` | Per-slot reducer: `attemptNumber`, `feedbackState`, `explanationRevealed`, `lastAnswer`, `wrongTick`. Resets on `slotId` change. |
| `src/features/lesson/ConceptSlotView.tsx` | Renders concept teach beats (title/prompt/theorem/definition/body/example/derivation) + dispatches the 7 concept figures + the `IllustrationBlock`. |
| `src/features/lesson/ProblemSlotView.tsx` | Picks the variant (`pickVariantForSlot`), notifies the player, and dispatches to one of the interaction components by `interactionKind`. |
| `src/features/lesson/WrapSlotView.tsx` | Title + body paragraphs + optional Captain Pascal mascot line. |
| `src/features/lesson/DerivationCard.tsx` | Static or 3D-flip flashcard derivation card (hosted inside ConceptSlotView). |
| Concept figures | `CircleBuilderFigure`, `OrderBuilderFigure`, `RoadForkFigure`, `SettlingLineFigure`, `SubsetPickerFigure`, `TreeDiagramFigure`, `TwoCoinsGridFigure` — dispatched by `slot.figure.kind`. |
| `src/features/progress/useLessonProgress.ts` | Live `onSnapshot` subscription to the progress doc → `loading | empty | ready | error`. |
| `src/features/flags/useLessons.ts` | Catalog with `comingSoon` adjusted by Remote Config; `useLessonById` map. |
| `src/content/index.ts` | Builds the live catalog (authored lessons swapped over roadmap stubs), validates invariants. |

### State machine (CTA)

The "state machine" is split between `useSlotState` (per-slot reducer) and `LessonFooter` (button derivation), driven by `LessonPlayerInner`:

```
feedbackState:  idle ──Check(correct)──▶ correct ──Continue──▶ (advance, RESET → idle of next slot)
                  │
                  └──Check(wrong)──▶ wrong ──Check(...)──▶ wrong (attemptNumber++; explanationRevealed once attemptNumber≥2)
```

- `LessonFooter` derives the button: `showCheck = problem && feedbackState !== 'correct' && !committedWrong`; `showContinue = !problem || feedbackState === 'correct' || committedWrong` (`LessonFooter.tsx:39-41`).
- Concept/wrap slots: only ever show **Continue** (no Check phase).
- Problem slots: **Check** until correct, then **Continue**. Continue never appears on a wrong problem answer — *except* the intended commit-once exception via `allowContinueOnWrong` (see §4, **this branch is currently dead**).

### How it loads

1. `LessonPlayer` resolves the lesson from `useLessonById()`; `!lesson → <Navigate to="/">`; `lesson.comingSoon → <ComingSoonRedirect>` (toast + redirect in an effect) (`LessonPlayer.tsx:85-90`).
2. `LessonPlayerInner` subscribes via `useLessonProgress(uid, lesson.id)` and fires `getOrCreateProgress` once in an effect (`LessonPlayer.tsx:136-141`).
3. `slotIndex` = the persisted leading edge; `viewSlotIndex` is a local cursor seeded to `slotIndex` (or 0 in review), kept at the leading edge by an effect (`LessonPlayer.tsx:163-170`). This is the resume mechanism.
4. While `loading`/`empty` → skeleton (`LessonPlayer.tsx:559-571`).

### How it saves

- **Variant selection**: first visit → `recordVariantSelection` (`LessonPlayer.tsx:183-195`).
- **Check**: `checkAnswer` (pure) → `dispatch(CORRECT|WRONG)` *immediately* (before any await) → `recordAttempt` (append-only attempt + XP increment) → `applyAttemptOutcome` (streak/achievements) (`LessonPlayer.tsx:227-321`). Feedback never waits on the network.
- **Continue (non-last)**: `applySlotAdvance` for concept/wrap steps + `advanceSlot` (monotonic) → bump `viewSlotIndex` (`LessonPlayer.tsx:432-445`).
- **Continue (last)**: `markLessonCompleted` → `applyLessonCompletion` (retried once) → `track('lesson_complete')` → navigate to `/celebration/...` with URL params (`LessonPlayer.tsx:327-429`).
- **Review mode** (`?mode=review`): `handleCheckReview`/`handleContinueReview` are local-only; nothing is persisted, no XP/streak/achievements/analytics (`LessonPlayer.tsx:202-225`).

---

## 2. What works (against §9.3 ACs)

- **AC 1 — Entry & resume.** First visit lands at slot 0; resume restores `slotIndex` via the leading-edge effect (`LessonPlayer.tsx:163-170`). Variant resume is correct: `ProblemSlotView` keys its `useMemo` on the saved variant id (`ProblemSlotView.tsx:44-47`, the B014 fix), so a resumed problem restores the exact variant. Nav chrome is hidden because `/lesson/:id` renders the player full-screen (`AppShell` excludes it). Header shows close-X + progress + XP/streak chips (`LessonHeader.tsx:41-104`).
- **AC 2 — Slot dispatch.** `slot.kind` switch renders ConceptSlotView / ProblemSlotView / WrapSlotView (`LessonPlayer.tsx:630-644`). Concept/wrap get a single Continue; problems get Check.
- **AC 3 — Check → feedback.** Verdict dispatched synchronously *before* the awaited writes (`LessonPlayer.tsx:259-274`), satisfying the §9.8.1 <100 ms budget and §9.2.7 "persistence never blocks feedback." Correct → green wash + `feedbackCorrect` + CTA flips to Continue; wrong → coral wash + per-key hint (`feedbackBy*[key]` with `feedbackDefault` fallback, `LessonPlayer.tsx:509-552`) and CTA stays Check.
- **AC 4 — No bail-out (the standard, non-commit-once case).** Continue is gated behind `feedbackState === 'correct'` for problems (`LessonFooter.tsx:41`); the keyboard path enforces the same gate (`LessonPlayer.tsx:491-495`). After 2 wrong attempts, `explanationRevealed` flips true once and the "Still stuck? Here's the idea." panel appears beneath the hint without unlocking Continue (`useSlotState.ts:22-30`, `LessonFooter.tsx:107-114`). The reveal is idempotent (`state.attemptNumber >= 2`). Close-X always lets the learner *leave* (never trapped) — matches D55.
- **AC 5 — CTA enable/disable.** Check is disabled until `currentAnswer !== null` and while `submitting` (`LessonFooter.tsx:121`); Continue disabled while `submitting`.
- **AC 6 — Slot transition + reset.** Continue advances with a slide transition (`AnimatePresence mode="wait"`, `LessonPlayer.tsx:621-646`); `useSlotState` resets strikes/feedback/input/`explanationRevealed` on `slotId` change (`useSlotState.ts:55-57`) and `currentAnswer` is cleared (`LessonPlayer.tsx:443`). (Caveat: the reset is one frame late — see Bug P1-2.)
- **AC 7 — Completion.** Final Continue calls `markLessonCompleted` then routes to celebration (`LessonPlayer.tsx:335`, `428`).
- **AC 8 — Close mid-lesson.** Close-X opens a confirm dialog; Leave → `/`, Keep going → dismiss; progress is preserved (every Check writes) (`LessonHeader.tsx:43-124`).
- **AC 9 — Invalid / comingSoon.** Unknown id → `<Navigate to="/">`; comingSoon → toast + redirect (`LessonPlayer.tsx:65-72, 87-88`). `useLessons` also force-locks any zero-slot lesson as a safety net (`useLessons.ts:24-27`).
- **AC 10 — Completion-write failure is non-destructive.** If `markLessonCompleted` fails, a toast shows and the learner stays on the wrap slot (no celebration) (`LessonPlayer.tsx:335-340`).
- **§9.8.7 CLS / min-height.** The slot body is a `flex-1` scroll region with `h-full`/`min-h-full` slot views (`LessonPlayer.tsx:619-629`); slides use transforms (no layout shift); reserved height is stable across slot swaps. Feedback growth in the footer is user-initiated (within 500 ms of the Check tap) and so excluded from CLS.
- **aria-live.** Correct feedback is `role="status" aria-live="polite"`; wrong is `role="alert" aria-live="assertive"`; the progress bar exposes `role="progressbar"` + `aria-valuenow`/`aria-label` (`LessonFooter.tsx:76-99`, `LessonHeader.tsx:139-146`).
- **prefers-reduced-motion.** Handled globally and well: `<MotionConfig reducedMotion="user">` (`App.tsx:57`) makes Framer skip transform/layout animations (slide, shake, pop, step-fill spring, DerivationCard flip), and `index.css:257-266` neutralizes CSS animations/transitions. Haptics also respect the OS reduced-motion proxy (`lib/haptics.ts:21-27`).

---

## 3. What's missing / incomplete

1. **Commit-once is not wired into the engine (functional + pedagogical regression).** `ProblemSlot.commitOnce` (`content/types.ts:290`) and the `LessonFooter.allowContinueOnWrong` branch (`LessonFooter.tsx:39`) exist, but `LessonPlayer` **never reads `slot.commitOnce` and never passes `allowContinueOnWrong`** (`LessonPlayer.tsx:650-662`). See Bug **P0-1**. Nearly every authored lesson opens with a commit-once prediction MCQ, so this is the dominant gap.
2. **No tests for the player engine at all.** There are zero tests under `src/features/lesson/` (verified by glob; the 1083 tests live in content/checkAnswer/practice/wager/lib). The spec's own test plan items #6 and #13 ("Vitest test for `useSlotState` confirming strike count resets") are not implemented. The commit-once regression survived precisely because the engine is untested end-to-end.
3. **`progressState === 'error'` is never surfaced.** Only `loading`/`empty` render the skeleton (`LessonPlayer.tsx:559`); on `error`, `progress` falls through to `null` and the render proceeds. See Bug **P1-3**.
4. **`getOrCreateProgress` failure has no recovery path.** A first-visit create failure (offline/permission) leaves the snapshot in `empty` → permanent skeleton; the error is only `console.error`'d (`LessonPlayer.tsx:136-141`). See Bug **P2-4**.
5. **Spec edge case "`slotIndex` past end → navigate to celebration" not implemented.** The code clamps `displayIndex` to the last slot instead (`LessonPlayer.tsx:175`); a shortened lesson silently parks the learner on the last slot rather than auto-completing. Minor.
6. **No focus management / new-slot announcement on advance.** After Continue, focus is orphaned (the Continue button unmounts) and nothing announces the new slot to a screen reader. Only the footer feedback is live-regioned. See Bug **P2-7**.
7. **Phase-2 progressive hints (D55) intentionally absent.** Only the single attempt-2 explanation reveal exists; documented as deferred — not a defect, noted for completeness.

---

## 4. Bugs & risks

### P0-1 — `commitOnce` slots cannot Continue on a wrong answer (engine dead branch)
**Files:** `LessonPlayer.tsx:650-662` (LessonFooter render), `LessonFooter.tsx:39-41`, `content/types.ts:283-290`, design ref D86/D88 (`design-iterations.md:1114-1125`).

The contract (D88): a `commitOnce` problem is answered **once** and Continue unlocks **right or wrong** — the deliberate exception to no-bail-out for gut-check/prediction slots whose payoff is the later reveal. It is supposed to be wired through `LessonFooter`'s `allowContinueOnWrong` prop.

But `LessonPlayerInner` never reads `slot.commitOnce` and the `<LessonFooter>` call omits `allowContinueOnWrong`:

```650:662:src/features/lesson/LessonPlayer.tsx
      <LessonFooter
        slotKind={slot.kind}
        feedbackState={slotState.feedbackState}
        wrongTick={slotState.wrongTick}
        feedbackCorrectText={feedbackCorrectText}
        feedbackWrongText={feedbackWrongText}
        explanationText={explanationText}
        explanationRevealed={slotState.explanationRevealed}
        isReady={currentAnswer !== null}
        isSubmitting={submitting}
        onCheck={isReviewMode ? handleCheckReview : handleCheck}
        onContinue={isReviewMode ? handleContinueReview : handleContinue}
      />
```

So `committedWrong` is always `false` (`LessonFooter.tsx:39`) and the prop is a dead branch. **Effects:**
- A learner who picks the *trap* answer (the entire point of these slots — e.g. 1/3 for two coins, 1/3 for "at least one six") is **stuck on a wrong answer with no Continue.** They can only proceed by reverse-engineering the correct answer, which destroys the predict→see-you're-wrong→learn design.
- Worse, because they're forced to keep trying, after the 2nd wrong the no-bail-out **explanation panel fires on a slot that is explicitly exempt from it** (`useSlotState.ts:27`), inverting the intended pedagogy.
- This affects `how-likely` and essentially every authored roadmap lesson (L2, L4–L10 all open with a commit-once `the-puzzle`), confirmed via grep of `commitOnce: true` in `src/content/lessons/*`.

**Severity P0:** core, repeated learning interaction is broken across the catalog; silently, because there are no engine tests. Fix is one line plus the `feedbackWrongText`/copy already in place: pass `allowContinueOnWrong={slot.kind === 'problem' && slot.commitOnce}` (and ensure wrong commit-once does not count strikes/reveal the explanation).

### P1-2 — Per-slot state reset lags one render frame (stale feedback flash; theoretical skip)
**Files:** `useSlotState.ts:52-59`, `LessonPlayer.tsx:650-662`.

`useSlotState` resets via `useEffect(..., [slotId])` (`useSlotState.ts:55-57`), i.e. *after* commit/paint. On Continue, the parent sets `viewSlotIndex`, the new slot renders, but the reducer still holds the **previous** slot's state for one painted frame before the RESET effect runs. Because the footer is rendered outside `AnimatePresence`, it reads that stale state immediately:
- Advancing from a correctly-answered problem to a **new problem** briefly paints the footer with the prior `feedbackState: 'correct'` → green wash + **Continue** + the new variant's `feedbackCorrect` text, then snaps back to **Check**. Every problem→problem advance flashes this.
- Advancing problem→concept/wrap briefly flashes the green wash on a neutral slot.
- **Risk:** during that ~16 ms frame an enabled **Continue** is shown for a not-yet-answered problem. Not human-exploitable, but a rapid double-Enter / automated input could in principle advance a problem without answering, partially undermining no-bail-out (AC 4) and slot-reset isolation (AC 6).

**Severity P1** (visual flicker on every problem advance + a no-bail-out edge). Recommended fix: reset synchronously during render (track `prevSlotId` in a ref and reset before paint) or `key={slot.id}` the slot-state owner so the reducer remounts fresh.

### P1-3 — Progress load error renders a silently broken player
**Files:** `useLessonProgress.ts:37-39`, `LessonPlayer.tsx:559-573, 632`.

`useLessonProgress` can return `{ status: 'error' }`, but the render only treats `loading`/`empty` as skeleton (`LessonPlayer.tsx:559`). On `error`, `progress` becomes `null` (`:573`) and rendering continues: concept/wrap slots render normally, but **problem slots render no interaction** because of the `progress &&` guard (`LessonPlayer.tsx:632`) — the learner sees a challenge banner (if any) and a disabled/blank Check, with **no error message or retry**. This is a dead-end with no user feedback.

**Severity P1.** Add an explicit `error` branch (toast + retry / inline error), mirroring AC 8/10's non-destructive philosophy.

### P2-4 — First-visit `getOrCreateProgress` failure → permanent skeleton
**Files:** `LessonPlayer.tsx:136-141`, `useLessonProgress.ts:31-35`.

If `getOrCreateProgress` rejects (offline / rules), the doc never exists, the snapshot stays `empty`, and the player shows the skeleton forever; the failure is only `console.error`'d. No timeout, retry, or toast.

**Severity P2.** Surface a retry after a bounded wait, or fall back to a local in-memory progress so the lesson is still playable.

### P2-5 — `applySlotAdvance` can double-count on completion retry
**Files:** `LessonPlayer.tsx:331-340`.

On the final slot, `applySlotAdvance(uid)` (increments lifetime `stepsCompleted`) is fired *before* `markLessonCompleted`. If completion fails and the learner taps Continue again, `applySlotAdvance` runs a second time (it's fire-and-forget with no idempotency), over-counting steps. Same pattern for non-last advances if a retry occurs (`:432-435`).

**Severity P2** (stats drift only; not blocking). Move `applySlotAdvance` after a successful `markLessonCompleted`/`advanceSlot`, or guard with the slot index.

### P2-6 — Celebration can show wrong XP/streak after a habit-write failure
**Files:** `LessonPlayer.tsx:356-399, 427-428`.

If `applyLessonCompletion` fails twice, the code toasts `xpPartial` but still navigates to the celebration with the **default** `celebrationParams` (`xp = xpEarnedThisAttempt + 50`, `streak=0`, `streakDelta=0`, no milestones). The lesson is correctly marked complete (non-destructive), but the celebration may misreport XP/streak/level-up. Documented as best-effort, but worth flagging because it can show `streak=0` to a user mid-streak.

**Severity P2.**

### P2-7 — No focus move / slot-change announcement on advance
**Files:** `LessonPlayer.tsx:619-648`.

After Continue, focus is lost (the Continue button unmounts → focus to `<body>`), and nothing announces the new slot's title/prompt to assistive tech (only the footer feedback is a live region). Keyboard/SR users lose their place each step.

**Severity P2** (a11y; §9.9 baseline). Move focus to the new slot heading and/or wrap the slot body in a polite live region.

### P2-8 — Dynamically-inserted aria-live regions may not announce
**Files:** `LessonFooter.tsx:67-117`.

The correct/wrong feedback live regions are mounted *with* their content (inside `AnimatePresence`), rather than being persistent empty regions that later receive text. Some screen readers do not reliably announce content inserted simultaneously with the live region node. Repeated wrongs re-announce (key changes via `wrongTick`), but the first announcement is at risk.

**Severity P2** (a11y robustness). Prefer a persistent visually-hidden live region updated by text.

### Risk notes (not bugs)
- **Race safety is otherwise good:** `submitting` gates both Check and Continue (button + keyboard, `LessonPlayer.tsx:228-229, 320, 324, 479`); the variant is read from `pickedVariantIdRef` to dodge stale state (B013, `:232-233`); `attemptNumber`/`xpAwarded` are captured before the dispatch (`:236-263`); `advanceSlot` is monotonic server-side (`progressService.ts:180-188`).
- **Resume correctness** is sound for the leading-edge model: `slotIndex` only advances on Continue-after-correct, so an interrupted problem resumes at the same slot with a fresh attempt (matches spec edge case).

---

## 5. Pros / Cons

**Pros**
- Clean separation: a content-agnostic engine, a per-slot reducer, a dumb footer, and a thin dispatcher (`ProblemSlotView`/`ConceptSlotView`) — interactions and figures are fully pluggable by `kind`.
- Feedback-before-persistence is implemented correctly and deliberately (comments cite the AC), nailing the <100 ms budget.
- Review mode is a genuinely separate, side-effect-free code path — no risk of double-awarding XP on revisits.
- Strong, centralized reduced-motion + focus-ring handling; good aria roles on progress and feedback.
- Resume + variant-restore is correct and well-commented (B014/B012/B013/B010/B015 fixes are all present and explained).
- Completion failure is genuinely non-destructive (stays on wrap, no partial celebration).

**Cons**
- The headline regression (commit-once) shows the cost of **zero engine tests** — a documented, catalog-wide behavior is silently inert.
- State reset via post-paint effect is fragile (frame-late flash + a theoretical skip); a render-time or keyed reset would be more robust.
- Error/degraded states (progress error, create failure, partial habit write) are under-surfaced relative to the polish of the happy path.
- The footer's feedback-copy derivation duplicates the per-`interactionKind` switch (`LessonPlayer.tsx:519-547`) that also lives in grading — adding an interaction kind means editing two switches.

---

## 6. Learning-science assessment

- **No-bail-out as desirable difficulty (D55).** For *non*-commit-once problems this is implemented well and is sound: forcing a correct response (with Close-X as the only escape) is classic desirable difficulty — it prevents the "click through without engaging" failure mode of video courses, and the escalating XP (10/5/2) preserves a persistence reward so retrying never feels punitive. The "never trapped in the lesson, but can't bypass a problem" framing (PRD AC 4) is exactly the right line and is honored.
- **Pretrieval / commit-once (the big issue).** Guess-before-you-learn (pretrieval) is one of the strongest effects in the literature — making a *wrong* prediction primes the corrective explanation better than reading it cold. The content is built around this (every lesson opens with a prediction trap whose payoff is the next slots). **But P0-1 means the mechanic is broken in the running app:** a learner who makes the intended wrong prediction is blocked instead of being carried forward to the reveal, and is then incorrectly subjected to the no-bail-out explanation gate. This is the single highest-leverage thing to fix — it converts the app's signature pedagogical move from "predict → reveal" into "guess until correct," which actively teaches the wrong habit on exactly the slots designed to exploit misconceptions.
- **Feedback timing & specificity.** Timing is excellent (synchronous, <100 ms). Specificity is good *when authored*: per-wrong-answer hints (`feedbackBy*[key]`) target the specific misconception, falling back to `feedbackDefault`. The fallback is the known content-backlog tradeoff; the engine does the right thing.
- **Explanation-after-2-strikes timing.** Two strikes before the conceptual explanation is a defensible "productive struggle" window — enough to engage retrieval/generation, not so long as to induce learned helplessness in a 3–5 minute mobile lesson. The reveal is framed as a hint ("Still stuck? Here's the idea."), not the answer, which preserves the requirement to still produce a correct response. This is well-timed. (Phase-2 progressive hints between attempt 1 and the explanation, per D55, would further smooth the curve.)
- **Caveat to the above:** because explanation reveal keys off raw `attemptNumber >= 2` (`useSlotState.ts:27`), once commit-once is wired the fix must also ensure commit-once wrongs do **not** advance the strike counter / reveal the explanation — otherwise a single mis-prediction on a corrected commit-once slot would wrongly trigger the "stuck" panel.

---

## 7. Prioritized recommendations

1. **(P0) Wire commit-once.** Pass `allowContinueOnWrong={slot.kind === 'problem' && slot.commitOnce}` to `LessonFooter` (`LessonPlayer.tsx:650`), and ensure a commit-once wrong does **not** increment strikes or set `explanationRevealed` (guard the WRONG dispatch or the reveal in `useSlotState`). Restores pretrieval across the whole catalog.
2. **(P0/P1) Add engine tests.** At minimum: `useSlotState` reset-on-slot-change (spec test #13), the Check/Continue derivation incl. commit-once, no-bail-out gating, and completion-failure-stays-on-wrap. This is what would have caught #1.
3. **(P1) Make slot reset render-time, not effect-time.** Reset the reducer synchronously on `slotId` change (prev-id ref, or `key={slot.id}`) to kill the stale-feedback flash and the theoretical no-bail-out skip (P1-2).
4. **(P1) Handle `progressState === 'error'`** with a visible error + retry instead of a silently inert problem slot (P1-3); give `getOrCreateProgress` failure a recovery path (P2-4).
5. **(P2) Order completion side-effects safely:** run `applySlotAdvance` only after the gating write succeeds, to avoid double-counting on retry (P2-5); pass real (or clearly-zeroed-with-flag) celebration params when the habit write fails (P2-6).
6. **(P2) A11y polish:** move focus to the new slot heading on advance and/or announce the new slot; use a persistent visually-hidden live region for feedback (P2-7, P2-8).
7. **(P2) De-duplicate the per-`interactionKind` feedback switch** (`LessonPlayer.tsx:519-547`) with the grading layer so new interaction kinds can't drift.

---

## Executive summary

- **Engine architecture is clean and the happy path is well-built:** content-agnostic dispatcher + per-slot reducer + dumb footer; feedback is dispatched synchronously *before* persistence (`LessonPlayer.tsx:259-274`), nailing the <100 ms / "persistence never blocks feedback" ACs.
- **Strong on the contracts most products get wrong:** correct resume + variant restore (`ProblemSlotView.tsx:44-47`), genuinely side-effect-free review mode, non-destructive completion-failure (stays on wrap, `LessonPlayer.tsx:335-340`), and excellent app-wide reduced-motion handling (`App.tsx:57` + `index.css:257`).
- **Most severe bug — P0: commit-once is a dead branch.** `LessonPlayer` never reads `slot.commitOnce` and never passes `allowContinueOnWrong` to the footer (`LessonPlayer.tsx:650-662`; prop defined at `LessonFooter.tsx:39`), so the prediction-trap slots that open nearly every authored lesson cannot Continue on the *intended* wrong answer — and then wrongly trigger the no-bail-out explanation gate (`useSlotState.ts:27`).
- **Second bug — P1: per-slot reset lags one paint frame** (`useSlotState.ts:55-57` effect-based RESET) → a stale green "Continue/correct" flash on every problem advance, plus a theoretical no-bail-out skip.
- **P1: progress-load `error` is unhandled** — problem slots render blank with no message/retry (`LessonPlayer.tsx:559, 632`); first-visit create failure can hang on the skeleton (`:136-141`).
- **Biggest testing gap:** there are **zero** tests under `src/features/lesson/` (the 1083 are content/checkAnswer/practice/wager); the spec's own `useSlotState`/player tests are unimplemented, which is exactly why the P0 shipped unnoticed.
- **Highest-leverage learning-science fix = the P0.** Wiring commit-once restores the app's signature pretrieval ("predict → reveal") move across the catalog; without it, the app teaches "guess until correct" on the very slots designed to surface misconceptions. The no-bail-out gate, escalating-XP persistence reward, and 2-strike explanation timing are otherwise pedagogically sound.
