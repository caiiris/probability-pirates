# Audit 04 — Interaction Renderers & Grading

> Scope: `src/features/lesson/interactions/*`, the practice renderers
> (`src/features/practice/renderers/NumberFill*.tsx`), the grader
> `src/lib/checkAnswer.ts`, and the dispatch/state plumbing that hosts them
> (`ProblemSlotView.tsx`, `InteractionDispatch.tsx`, `useSlotState.ts`,
> `LessonPlayer.tsx`, `LessonFooter.tsx`).
>
> Method: read-only static review against PRD §9.4 (11 ACs),
> `docs/specs/spec-interactions.md`, and `docs/alternatives.md` (D4/D8/D55/D56).
> Ground truth accepted as given: `tsc` clean, `eslint` clean, `vitest`
> 1083/1083. The suite was **not** re-run. No source or test files were
> modified.

---

## 1. Overview — kinds, renderers, where they're used

The spec started at **5** interaction kinds (PRD §9.4 still says "5"); the app
now ships **11** kinds in the `InteractionKind` union (`src/content/types.ts:298`).
Ten render in lessons via `ProblemSlotView.tsx`; `number-fill` is **practice-only**
and renders via `InteractionDispatch.tsx`.

| Kind | Renderer | Grader case | Authored in (lessons / practice) |
| --- | --- | --- | --- |
| `tap-outcomes` | `TapOutcomes.tsx` | `checkAnswer.ts:12` | sample-space, compound-experiments, how-likely |
| `fill-fraction` | `FillFraction.tsx` | `checkAnswer.ts:38` | 01, 02, 03, 05, how-likely, sample-space, equally-likely, complement-rule, inclusion-exclusion |
| `number-fill` | `NumberFill.tsx` → `NumberFillInteraction.tsx` | `checkAnswer.ts:49` | **practice templates only** (counting) |
| `tap-event` | `TapEvent.tsx` | `checkAnswer.ts:55` | 01-what-is-probability |
| `grid-event` | `GridEvent.tsx` | `checkAnswer.ts:69` | 01-what-is-probability, how-likely (6×6 dice sums) |
| `multiple-choice` | `MultipleChoice.tsx` | `checkAnswer.ts:83` | nearly every lesson (dominant kind) |
| `simulate-proportion` | `SimulateProportion.tsx` (+`ProportionChart.tsx`) | `checkAnswer.ts:89` | 02-law-of-large-numbers, 04-counting-gets-hard, long-run-frequency |
| `scrub-trials` | `ScrubTrials.tsx` | `checkAnswer.ts:95` | long-run-frequency |
| `fill-text` | `FillText.tsx` (+`CombinationPicker.tsx`) | `checkAnswer.ts:101` | permutations, combinations, multiplication-principle, sample-space, equally-likely, compound-experiments |
| `multiply-steps` | `MultiplySteps.tsx` | `checkAnswer.ts:116` | permutations |
| `monty-hall` | `MontyHall.tsx` (+`ProportionChart.tsx`) | `checkAnswer.ts:126` | 05-conditional-probability |

Shared infrastructure:

- **Contract** `InteractionProps.ts` — `{ variant, attemptNumber, feedbackState, wrongTick, onChange }`.
- **State machine** `useSlotState.ts` — `idle | correct | wrong`, `attemptNumber`, `wrongTick`, `RESET` on `slot.id` change.
- **Reset isolation** — `LessonPlayer.tsx:621-646` wraps the slot in `AnimatePresence`/`motion.div key={slot.id}`, so a new slot **remounts** the renderer (fresh `useState`); `currentAnswer` is cleared on advance (`LessonPlayer.tsx:443`, `:223`).
- **First-time affordance hints** — `useInteractionHint.ts` (per-kind, `localStorage`-persisted) + `InteractionHint.tsx`.
- **Opt-in reference grids** — `HintDisclosure.tsx` (`HintReferenceGrid` is deliberately non-interactive, amber, `aria-hidden`).
- **Shared chrome** — `DiceRoller.tsx` (play-only roller), `ProportionChart.tsx` (dependency-free SVG line chart).

---

## 2. What works (per-AC, per-kind)

**Grading correctness (PRD §9.4 AC 3) — the grader is sound.** `checkAnswer.ts`
is a pure, exhaustive switch with the right semantics per kind:

- **Set equality** is correct for `tap-outcomes` (with explicit duplicate
  detection, `:18-22`), `tap-event` (`:55-67`), and `grid-event`
  (stringified `"r,c"` set comparison, `:69-81`).
- **Fraction-equivalence** uses cross-multiplication, not float division
  (`p.numerator * variant.denominator === variant.numerator * p.denominator`,
  `:44`), so `3/6 ≡ 1/2` and `2/4 ≡ 1/2` grade correct (test
  `checkAnswer.test.ts:56`). This satisfies AC 3's "any equivalent reduced form."
- **Zero-denominator** is treated as wrong before the multiply (`:40-42`),
  avoiding NaN/`0===0` false positives.
- **Numeric equality** for `number-fill` (`:49-53`) and `multiply-steps`
  (product of step answers, `:116-124`) is exact-integer.
- **`fill-text`** anchors the author regex at both ends (`^(?:…)$`) against a
  trimmed/lower-cased input (`:101-114`) — partial matches can't slip through;
  blank input keys `'empty'`. Well covered by tests (`:276-306`).
- **Gate kinds** (`simulate-proportion`, `scrub-trials`, `monty-hall`) correctly
  reduce to `trials/games >= threshold` with `'incomplete'` as the (near-
  unreachable) wrong key (`:89-99`, `:126-130`).

**Numeric input hygiene (AC 9, partial).** `FillFraction.coerceInt`
(`FillFraction.tsx:16-21`) and `NumberFill.coerceInteger`
(`NumberFill.tsx:24-29`) both strip non-digits with `/[^0-9]/g`, which removes a
pasted minus sign (AC 9 ✓), reject empty → `null` (Check stays disabled), and
cap magnitude (`min(n,999)` / `min(n,9999)`). Inputs use `type="number"` +
`inputMode="numeric"` → mobile numeric keyboard (AC 8 ✓). (Decimal handling is
wrong — see §4 P2.)

**Grid as the rich interaction (AC 4).** `GridEvent.tsx` renders a 6×6 of
`memo`-ized `GridCell`s (`:12-57`); touch targets are `w-11 h-11 md:w-14
md:h-14 lg:w-16 lg:h-16` = **44 / 56 / 64 px** exactly per §9.9 (`:39-41`).
`touch-action: manipulation` guards against pinch-zoom on fast taps (`:47`).
Live counter substitutes `{count}` and is wrapped in `aria-live="polite"`
(`:171-173`). The `toggle` callback is stable (`useCallback([onChange])`), and
because cells are memoized, a single tap re-renders only the toggled cell — the
core of the 60fps claim (AC 4 / §9.8.2).

**Correct-answer lock (AC 6).** Every renderer derives `locked = feedbackState
=== 'correct'` and gates input: `TapOutcomes:17`, `FillFraction:90`,
`TapEvent:15`, `GridEvent:62` (`onClick={() => !locked && …}`),
`MultipleChoice:17`, `MultiplySteps:28`, plus the simulation buttons. Inputs are
also `disabled` so they drop out of the tab order once correct.

**Slot-reset isolation (AC 7).** Confirmed via the `key={slot.id}` remount
(`LessonPlayer.tsx:623`) **and** `useSlotState` `RESET` effect
(`useSlotState.ts:55-57`). No interaction stores answer state outside React, so
nothing leaks between slots. Practice mirrors this by keying
`InteractionDispatch` on `instanceId` (documented `NumberFillInteraction.tsx:7`).

**Keyboard accessibility (AC 10).** All tappables are real `<button>`s (Space/
Enter native) with visible `focus-visible:ring-2 focus-visible:ring-ring`.
`MultipleChoice` goes further: a proper `role="radiogroup"` with roving
`tabindex` and Arrow-key navigation that moves selection (`:29-41`, `:78-110`).
`ScrubTrials` uses a native `<input type="range">` with full ARIA value text
(`:137-155`), so the slider is keyboard- and SR-operable for free.

**Build-vs-commit affordance (AC 11 / D56).** The bottom CTA reads **Check**,
not Submit (`LessonFooter.tsx:122`), and each kind ships dismissible per-kind
copy via `AFFORDANCE` constants (e.g. `TapEvent.tsx:9`, `FillFraction.tsx:11`,
`MultipleChoice.tsx:11`, `SimulateProportion.tsx:13`, `MontyHall.tsx:12`)
matching the spec table in `spec-interactions.md:23-31`.

**Determinism & convergence (simulation family).**

- `scrub-trials` **is seeded** — `mulberry32(seed)` drives
  `cumulativeSuccesses` (`simulations.ts:45-83`), memoized on `[scenario,
  stops, seed]` (`ScrubTrials.tsx:78-81`), so dragging back/forth never
  re-rolls. Convergence targets are mathematically right: coin `flipIsHeads`
  → 0.5, `rollIsSix` → 1/6.
- `monty-hall` converges to the correct **2/3 (switch) vs 1/3 (stay)** with
  reference lines drawn at exactly those values (`MontyHall.tsx:240-243`);
  `switchTarget`/`setupMontyGame`/`montyHallWins` are correct
  (`simulations.ts:91-117`). Manual outcomes are attributed to the chosen
  strategy so the live rates stay honest (`:67-96`).
- `simulate-proportion` accumulates the running share via refs to avoid stale
  async state (`SimulateProportion.tsx:62-104`); birthday uses real collision
  detection (`hasSharedBirthday`).

**Unlock gates work end-to-end.** Each gate kind emits `onChange(null)` until
the threshold is crossed (`SimulateProportion.tsx:101`, `ScrubTrials.tsx:100-102`,
`MontyHall.tsx:50-55`), and the footer's Check button is `disabled={!isReady}`
where `isReady = currentAnswer !== null` (`LessonFooter.tsx:121`). `scrub-trials`
correctly credits the **high-water mark**, not the current N, so scrubbing
forward then back keeps the unlock (`ScrubTrials.tsx:87,147`).

---

## 3. What's missing / incomplete

1. **Localized wrong-cell flash is not implemented for the grid** (AC 5 /
   spec §4: "each _incorrect_ selected cell briefly flashes rose… Correct ones
   stay indigo"). The grid flashes **all** selected cells. See §4 P1-A.
2. **`tap-event` has no wrong-answer feedback at all** (spec §3: "only the
   _incorrect_ taps flash rose"). See §4 P1-B.
3. **No emerald "correct pulse" on the grid** (spec §4: "On correct: every
   correct cell pulses emerald once"). On correct the grid simply locks; the
   only success animation is the footer wash.
4. **No "auto-reduce" fraction animation** (spec §2 / PRD UX §3.5: "On correct,
   animates the fraction reducing to lowest terms, e.g. 3/6 → 1/2"). The
   renderer shows a static `afterNote` paragraph instead (`FillFraction.tsx:171-181`).
5. **Pasted decimals are not "rounded down"** (AC 9). They are de-dotted and
   concatenated. See §4 P2-A.
6. **The "denominator can't be zero" hint is effectively unreachable** by key.
   See §4 P2-B.
7. **The interaction surface itself does not shake** on wrong (AC 5 "shakes
   once"). Only the footer feedback text shakes (`LessonFooter.tsx:103`,
   `SHAKE_KEYFRAMES`). Arguably satisfies the letter of the AC, not the spirit
   ("the interaction shakes").
8. **PRD §9.4 is stale** — it still scopes "5 interaction kinds." Six kinds
   (`number-fill`, `simulate-proportion`, `scrub-trials`, `fill-text`,
   `multiply-steps`, `monty-hall`) are shipped beyond the documented contract.
   Doc debt, not a code bug, but it means six kinds have **no AC coverage**.

---

## 4. Bugs & risks

### P1 — feedback fidelity (visible AC gaps; correctness of *grading* unaffected)

**P1-A · Grid wrong-flash is global, not localized — violates AC 5.**
`GridEvent.tsx:29-34` computes the cell style purely from `isSelected &&
flashWrong`, and `flashWrong` is a single component-level boolean set whenever
`feedbackState === 'wrong'` (`:60-71`) and passed to *every* cell (`:157`).
`GridCell` has no knowledge of `correctCells`, so on a wrong submit **all
selected cells flash coral, including the correct ones** — the exact opposite of
"only incorrect selections flash rose; correct selections stay indigo." Spec
also expects wrong cells to **deselect** after the flash (`spec-interactions.md:63`);
they stay selected. *Fix sketch:* pass the variant's correct-cell set (or a
`wrongKeys` set derived in the parent) into `GridCell` and gate the coral style
on membership; optionally auto-prune wrong cells after the 600ms timer.

**P1-B · `tap-event` shows no wrong feedback on the chips.** `TapEvent.tsx:13`
doesn't even destructure `wrongTick`; there is no flash/shake path. Spec §3 and
AC 5 require incorrect taps to flash rose. The only signal a learner gets after
a wrong `tap-event` submit is the footer message. (`tap-outcomes` has the same
gap, though it's less prominent because the collected-pill row gives some echo.)

### P2 — hygiene, polish, and code-smell

**P2-A · Pasted decimals are concatenated, not rounded down (AC 9).**
`FillFraction.coerceInt` (`FillFraction.tsx:16-21`) and
`NumberFill.coerceInteger` (`NumberFill.tsx:24-29`) strip the decimal point with
`/[^0-9]/g`, so pasting `1.5` yields **15**, `2.7` yields **27**, `0.5` yields
**5**. AC 9 and `spec-interactions.md:163` say "round down silently" (→ `1`,
`2`, `0`). Low blast radius (the `min(n,999/9999)` cap limits absurd values, and
type=number suppresses most pastes), but the behavior is wrong and silent.

**P2-B · Zero-denominator hint can't be authored reliably.**
`checkAnswer.ts:40-42` returns `matchedWrongKey: \`${p.numerator}/0\``. The
feedback lookup (`LessonPlayer.tsx:523-525`) keys
`feedbackByWrongAnswer[\`${num}/0\`]`, so an author would have to enumerate a key
per numerator (`1/0`, `2/0`, …) to surface the spec-mandated "denominator can't
be zero" message (AC 9). In practice it always falls through to
`feedbackDefault`. *Fix sketch:* return a stable key such as
`'zero-denominator'` for the `den === 0` branch.

**P2-C · `onChange` is called inside a state-updater function.**
`TapOutcomes.tsx:29`, `TapEvent.tsx:27`, and `GridEvent.tsx:84` invoke the
parent's `onChange` (i.e. `setCurrentAnswer`) *inside* the `setState(prev => …)`
updater. Updaters must be pure; this fires a parent state update during another
component's render phase and is double-invoked under React StrictMode in dev.
It happens to be benign today (idempotent set), but it's a latent
"cannot update a component while rendering" footgun. *Fix sketch:* compute
`next` in the updater, then call `onChange` after `setState` in the handler.

**P2-D · `tap-outcomes` card sources have no distractors.**
`TapOutcomes.tsx:34-39`: for `source: 'card-suit' | 'card-rank'` the tappable
faces are exactly `variant.expectedOutcomes`. Every visible face is therefore
correct, so the only failure modes are "incomplete" — a learner literally cannot
tap a wrong value, and `feedbackByWrongValue` for specific values is dead code
for these sources. (`d6`/`coin` sources do present distractors and work fully.)
Pedagogically this turns "collect the event" into "select everything shown."

**P2-E · Grid hint reference grid is hard-coded 6×6.**
`GridEvent.tsx:178` renders `<HintReferenceGrid rows={6} cols={6} …>`
irrespective of `variant.rows`/`variant.cols`. Harmless today (all authored
grids are 6×6 dice grids) but will silently desync if a non-6×6 grid is ever
authored. Same hard-coding risk noted in spec for "future 10×10 grids."

**P2-F · Sub-44px touch targets in `CombinationPicker`.**
The stage option buttons (`CombinationPicker.tsx:63-67`, `:90-94`) are
`px-3 py-2 text-sm` (~36px tall), under the 44px floor §9.9/AC 8 mandates for
tappables. Low severity since the picker is exploratory (ungraded), but it's the
one interactive surface that misses the floor.

**P2-G · Per-tap re-render of the whole `LessonPlayer`.** Every tap/keystroke
calls `onChange` → `setCurrentAnswer` in `LessonPlayer` (`:117,641`), re-rendering
the header, footer, and `ProblemSlotView`. The grid survives this (cells are
memoized and bail out), so the 60fps target holds, but the work is larger than
necessary for non-grid kinds. Acceptable; flagged for awareness.

### Not bugs (verified by design)

- **`number-fill` absent from `ProblemSlotView` switch** — intentional; it's
  practice-only and handled in `InteractionDispatch.tsx:64-72`. The lesson
  switch is non-exhaustive but TS doesn't flag it (no `never` assignment).
- **`simulate-proportion` / `monty-hall` use `Math.random`, not a seed** — by
  design (live, user-driven trials); only `scrub-trials` and the settling-line
  *figure* promise reproducibility, and both are seeded.
- **`multiply-steps` can never be graded "wrong"** — steps are validated inline
  and the slot only emits a payload once every step is correct
  (`MultiplySteps.tsx:34-52`), so the built product always equals the expected
  product. Intentional; that's why there is no `multiply-steps` case in the
  footer wrong-feedback switch (`LessonPlayer.tsx:519-547`).

---

## 5. Pros / Cons

**Pros**

- Grading lives in one pure, exhaustively-switched, well-tested function;
  float-safe fraction logic and explicit duplicate/zero handling are textbook.
- Clean prop contract + remount-based reset gives bulletproof slot isolation
  with almost no bespoke teardown code.
- Grid hits the responsive/perf targets squarely (44/56/64, memoized cells,
  `touch-action`), and the simulations are mathematically honest with the one
  reproducibility-critical kind correctly seeded.
- Strong a11y baseline: real buttons, radiogroup semantics, native range
  slider, consistent focus rings, `aria-live` counters.

**Cons**

- The **feedback layer under-delivers on the spec**: the headline "localized
  wrong-cell flash" (AC 5) is global on the grid and absent on tap-event, and
  the two promised reward animations (emerald grid pulse, fraction auto-reduce)
  are missing. These are the moments that make "the interaction is the
  explanation" feel responsive, so the gap is felt, not cosmetic.
- AC-vs-code drift: PRD §9.4 documents 5 kinds while 11 ship, leaving six kinds
  uncontracted.
- A few small hygiene/robustness gaps (decimal coercion, zero-denom hint key,
  updater side-effects).

---

## 6. Learning-science assessment

**Manipulation-as-explanation — strong.** The grid (build the sum-7 diagonal),
`tap-outcomes` (assemble the sample space), `multiply-steps` (construct n!
factor-by-factor), and `CombinationPicker` (enumerate outfits) all make the
learner *produce* the structure rather than read it. This is the app's biggest
pedagogical asset and it's well executed.

**Externalizing the invisible — strong, with one soft spot.** `ProportionChart`,
the `ScrubTrials` ball-buckets, the Monty two-series convergence, and the
birthday-room collision dots all turn abstract long-run behavior into something
on screen. The soft spot: for `tap-outcomes` card sources, the sample space is
pre-filtered to the answer (P2-D), so the learner doesn't externalize the *whole*
space and then carve the event out of it — they just confirm a given set.

**Generation effect — strong.** `fill-text`, `fill-fraction`, `number-fill`, and
`multiply-steps` force recall/production over recognition. The deliberate choice
to *strip* MCQ subtext and fraction labels in the **practice** path
(`InteractionDispatch.tsx:53-62, :86-89`) is a nice anti-give-away touch that
preserves the generation effect under retrieval.

**Immediate specific feedback — good, but throttled by the §4 bugs.** The
architecture is built for it: `<100ms` verdict before persistence
(`LessonPlayer.tsx:259-263`), per-wrong-value/per-cell/per-option hint maps, and
a staged "still stuck?" explanation on the 2nd wrong attempt. But the *spatial*
specificity that makes feedback land — "*these* cells are wrong, those are
right" — is exactly what P1-A/P1-B drop. The learner is told they're wrong and
given prose, but the surface doesn't point at the mistake.

**Top learning-science improvement:** implement true localized wrong feedback on
the grid and tap-event (flash only the incorrect selections, keep correct ones
indigo, deselect the wrong ones). This is the single change that most tightens
the perception→action→feedback loop the whole product is built around, and it's
already authored for at the content level (`feedbackByCell`, `feedbackByWrongOutcome`).

---

## 7. Prioritized recommendations

1. **(P1-A) Localize the grid wrong-flash.** Pass correct-cell membership (or a
   parent-computed `wrongKeys` set) into `GridCell`; flash coral only on wrong
   cells, keep correct cells indigo, and deselect wrong cells after the timer.
   Directly closes AC 5. *(`GridEvent.tsx`)*
2. **(P1-B) Add wrong-tap feedback to `tap-event`** (and the collected row in
   `tap-outcomes`): flash incorrect chips rose off `wrongTick`. *(`TapEvent.tsx`,
   `TapOutcomes.tsx`)*
3. **(P2-B) Return a stable `'zero-denominator'` wrong key** from the grader's
   `den === 0` branch so the AC-9 hint is authorable. *(`checkAnswer.ts:40-42`)*
4. **(P2-A) Fix decimal coercion** to round down (parse to float, `Math.floor`,
   then clamp) instead of de-dotting digits. *(`FillFraction.tsx:16-21`,
   `NumberFill.tsx:24-29`)*
5. **(P2-C) Move `onChange` out of the `setState` updaters** in the three tap
   renderers. *(`TapOutcomes.tsx:22-31`, `TapEvent.tsx:20-29`, `GridEvent.tsx:73-89`)*
6. **(spec) Ship the missing reward animations** — emerald grid pulse on correct
   and the `3/6 → 1/2` fraction reduce — to match spec §2/§4.
7. **(P2-D) Give card-source `tap-outcomes` real distractors** (render the full
   suit/rank space, not just `expectedOutcomes`) so the kind externalizes the
   whole sample space.
8. **(docs) Update PRD §9.4** to cover all 11 kinds (rename "5 interaction
   kinds"; add ACs for the simulation/text/steps families).
9. **(P2-E/F) Minor:** drive the grid hint grid from `variant.rows/cols`; bump
   `CombinationPicker` option buttons to the 44px touch floor.
