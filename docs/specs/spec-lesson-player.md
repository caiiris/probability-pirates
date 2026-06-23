# Spec: Lesson Player

> The generic engine that renders a lesson one slot at a time. Owns the lesson chrome (close X, progress bar), the slot dispatcher, the Check/Continue CTA, the feedback display, and transitions between slots. Knows nothing about specific interaction kinds — that's `spec-interactions`.

## Purpose

Turn a `Lesson` object plus a `LessonProgress` doc into a full-screen, mobile-first, learn-by-doing experience. The player is the heart of the app: it must feel snappy, friendly, and forgiving.

## User-facing behavior

### Entering a lesson
- Route `/lesson/:lessonId`. The player takes over the screen — navigation chrome is hidden at every breakpoint (bottom nav on mobile, sidebar on desktop — both gone).
- If the lesson is `comingSoon: true` → redirect to `/` with a toast "This lesson isn't ready yet."
- If progress doc exists → start at `slotIndex`.
- If progress doc doesn't exist → call `getOrCreateProgress` and start at slot 0.

### Header
- Compact, ~56px tall.
- Left: close X icon (32px touch target). Tapping prompts a confirm dialog: "Leave lesson? Your progress is saved." with [Stay] [Leave]. Leave routes to `/`.
- Center: slim progress bar showing `slotIndex / totalSlots`.
- Right: small flame chip with `currentStreak`.

### Slot body
- One slot fills the screen. Renderer is chosen from `slot.kind`:
  - `concept` → `<ConceptSlotView>` — illustration + prompt + "Got it." CTA.
  - `problem` → `<ProblemSlotView>` — picks the variant via `pickVariantForSlot`, then renders the matching interaction component (see `spec-interactions`).
  - `wrap` → `<WrapSlotView>` — celebration title + body + segue. Tapping Continue triggers `markLessonCompleted` and routes to the celebration screen (see `spec-habit-loop`).
- Slot enters from the right (slide); exits to the left. Framer Motion `AnimatePresence`.

### Bottom CTA
- Full-width shadcn `Button` (`size="lg"`, `w-full`), 56px tall, thumb-reachable.
- Label is `Check` while the slot is unanswered; becomes `Continue` **only after a correct answer**. There is no way to advance a problem slot without answering correctly.
- Disabled state when the interaction isn't ready (e.g. fill-fraction inputs empty).
- For `concept` and `wrap` slots, the CTA is just `Got it` / `Continue` (no Check phase).

### Feedback area
- Sits between the interaction and the bottom CTA.
- Empty until a Check happens.
- On correct: green check icon scales in (Framer, 200ms) + `feedbackCorrect` copy in `text-emerald-700`.
- On wrong: container shakes (Framer, `x: [0, -8, 8, -8, 8, 0]`, 200ms) + per-wrong hint copy in `text-muted-foreground`. Hint is `variant.feedbackByWrongX[answerKey]` if present, else `feedbackDefault`.
- **After 2 wrong attempts on the same slot:** if the variant has an `explanation` field, it is appended below the per-wrong hint in a softer panel (label: "Still stuck? Here's the idea."). The CTA **does not** change to Continue — the learner must still produce a correct answer. If `explanation` is absent, the per-wrong hint is shown with slightly stronger emphasis but no new content. (No bail-out. Avoids cognitive offloading. Phase 2's LLM will fill in intermediate progressive hints between attempt 1 and the explanation; see `docs/alternatives.md` D55.)

### Transitions
- Continue tap → record attempt (via `progressService.recordAttempt`) → bump `slotIndex` → animate the next slot in.
- On the last slot's Continue → call `markLessonCompleted` → navigate to `/celebration/:lessonId` (rendered by `spec-habit-loop`).

## Data model

This spec does not own any persistent data. It reads:
- The static `Lesson` from `lessonById.get(lessonId)`.
- The reactive `LessonProgress` from `useLessonProgress(lessonId)`.

And calls:
- `pickVariantForSlot` (`spec-progress-persistence`)
- `progressService.recordVariantSelection` (first slot visit)
- `progressService.recordAttempt` (on Check)
- `progressService.markLessonCompleted` (on final Continue)
- `xpForAttempt` (`spec-habit-loop`)

## Implementation outline

1. Create `src/features/lesson/LessonPlayer.tsx` — top-level route component. Reads `:lessonId` param, looks up lesson, fetches progress, renders the header + current slot + CTA. Returns `<Navigate to="/" />` if lesson is `comingSoon` or doesn't exist.
2. Create `src/features/lesson/SlotRenderer.tsx` — switch on `slot.kind`. Returns `<ConceptSlotView>`, `<ProblemSlotView>`, or `<WrapSlotView>`. Wraps in `<motion.div>` with slide-in animation.
3. Create `src/features/lesson/ConceptSlotView.tsx` — illustration (from `src/components/illustrations/`) + prompt + nothing else; the player chrome supplies the CTA.
4. Create `src/features/lesson/WrapSlotView.tsx` — large title + body + small segue card. The player's bottom CTA shows "Continue" here.
5. Create `src/features/lesson/ProblemSlotView.tsx` — picks the variant once per slot visit (memoize with `useMemo` keyed on `slot.id` and `progress.attemptId`), writes the selection on first visit, then renders one of the 5 interaction components from `spec-interactions`. Passes down `onSubmit(answerPayload) => Promise<void>`.
6. Create `src/features/lesson/useSlotState.ts` — hook owning per-slot UI state: `attemptNumber`, `feedbackState: 'idle' | 'correct' | 'wrong'`, `explanationRevealed: boolean` (becomes `true` once `attemptNumber > 2` on a wrong submission), `lastAnswer`. Resets on slot change.
7. Create `src/features/lesson/LessonHeader.tsx` — close X + progress bar + streak chip. Close button opens a shadcn `Dialog` confirm.
8. Create `src/features/lesson/LessonFooter.tsx` — feedback area (conditional) + the bottom CTA button. Button label and disabled state derived from `feedbackState` and slot kind.
9. Create `src/features/lesson/checkAnswer.ts` — a pure function `(variant, answerPayload) => { wasCorrect: boolean, matchedWrongKey?: string }`. One case per `interactionKind`. Tested exhaustively.
10. Wire onCheck handler in `LessonPlayer`: call `checkAnswer`, compute `xpAwarded` via `xpForAttempt`, call `progressService.recordAttempt`, update `useSlotState`. Animations driven by state changes via Framer.
11. Wire onContinue: if final slot, call `markLessonCompleted` and navigate to celebration; else advance `slotIndex` via service write.
12. Write Vitest tests for `checkAnswer` covering every interaction kind, correct + several wrong shapes.
13. Write a Vitest test for `useSlotState` confirming the strike count resets on slot change.

## Edge cases

- **Lesson doesn't exist** (bad `:lessonId` in URL) → redirect to `/`.
- **Lesson is `comingSoon`** → redirect to `/` with toast.
- **Progress doc is loading** → show a centered shadcn `Skeleton` for the slot area; keep the header rendered.
- **`slotIndex` is past the end of `slots`** (data drift, e.g. lesson got shorter) → treat as completed, navigate to celebration.
- **`selectedVariantIds[slotId]` references a missing variant** → fall back to `pickVariantForSlot` recomputation; log to Sentry (handled by `spec-progress-persistence`).
- **User taps Continue on a wrap slot but `markLessonCompleted` fails** → show a toast "Couldn't save — try again"; keep them on the wrap slot. Do *not* let them out without saving completion (or the celebration screen will be wrong).
- **User taps the close X mid-slot** → confirm dialog; on confirm, route home; the in-flight progress is already saved (every Check writes), so resume works.
- **Explanation reveal fires twice (double-tap on the 2nd wrong):** idempotent — `explanationRevealed` flips from `false` to `true` once and stays.
- **Wrong-answer hint missing for the specific wrong answer:** fall through to `feedbackDefault`. This is the audit-feedback backlog by design.
- **`explanation` is missing on a variant where the learner hits 2 wrongs:** UI shows the per-wrong feedback with stronger emphasis but no extra content. Author can backfill `explanation` later without a behavior change.
- **Learner cannot answer correctly on a hard problem:** they stay on the slot indefinitely. They may close out, in which case resume re-enters the same slot with a fresh attempt count (`stepAttempts` log retains the prior wrongs). Acceptable trade for the no-bail-out pedagogy; see `docs/alternatives.md` D55.
- **Network flap during a Check:** the answer feedback shows immediately (it's pure-client compute); the persistence write retries once, then surfaces a toast. The user is not blocked from continuing.
- **User refreshes mid-slot:** UI state (`attemptNumber`, current input) is lost; persistence has `slotIndex`, so they restart this slot. Acceptable — they did not have a correct check on this attempt yet.

## Test plan

- Manual: enter a lesson with no progress → land on slot 0; correctly answer through to wrap → celebration screen.
- Manual: enter, answer two slots correctly, refresh → land on slot 2.
- Manual: enter, answer one slot wrong twice → the variant's `explanation` (if present) appears as a "Still stuck?" panel; the Check CTA stays as Check; submitting another wrong answer still shows feedback; submitting the correct answer advances.
- Manual: tap close X mid-slot → dialog → Stay keeps me; Leave goes home; re-enter resumes.
- Unit: `checkAnswer` returns correct for every variant's canonical correct answer, wrong with `matchedWrongKey` populated for each known wrong answer in test fixtures.
- Unit: `useSlotState` resets on `slot.id` change.
- Integration (emulator): completing a full lesson writes the expected `lessonProgress` updates and `stepAttempts` log entries.

## Out of scope

- The 5 interaction renderers themselves — see `spec-interactions`.
- The celebration screen — see `spec-habit-loop`.
- The course path (home) — see `spec-course-path`.
- Skip / "I know this" buttons — Phase 3.
- Bookmarking a slot — Phase 3.
- Hint button (separate from auto-unlock) — Phase 3.
