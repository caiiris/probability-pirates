# Spec: Interactions

> The five variant renderers — one per `InteractionKind`. Each is a self-contained React component that displays the question, captures the learner's input, and reports an `answerPayload` up to the lesson player. **The grid-event is the brief's required "rich interaction beyond multiple choice."**

## Purpose

Render each kind of problem the content model supports in a way that is visual, tappable, mobile-first, and 60 FPS. Each component is a pure renderer — it knows nothing about persistence, XP, or progress. It takes a variant and a callback, and emits answer payloads.

## User-facing behavior

Each interaction shares a contract with the lesson player:
- Receives `variant`, `attemptNumber`, `feedbackState: 'idle' | 'correct' | 'wrong'` as props.
- Exposes `onChange(answerPayload | null)` to keep the parent's Check button enabled/disabled correctly.
- Resets internal state on `slot.id` change (key-based remount).
- On `feedbackState === 'correct'`, becomes read-only (locks input) until the slot advances. (Per D55, there is no `'unlocked'` state — `'wrong'` always accepts new input.)
- On `feedbackState === 'wrong'`, shakes once, then accepts new input.

### Build-vs-commit affordance (per D56)

Every interaction renders a small, persistent instructional hint above or below the interaction area that makes the build phase explicit, e.g.:

| Kind | Affordance copy |
| --- | --- |
| `tap-outcomes` | "Tap to collect. Tap again to remove." |
| `fill-fraction` | "Type your fraction. Tap Check when ready." |
| `tap-event` | "Tap to mark. Tap again to unmark." |
| `grid-event` | "Tap cells to count them. Tap again to remove." |
| `multiple-choice` | "Tap your choice. You can change it before tapping Check." |

The copy is rendered in `text-muted-foreground` at body size, dismissible by tapping a small `×` (state stored per-user in `localStorage` under `interactionHintsDismissed`). Exact wording owned by `docs/ui-stack.md`.

### 1. `TapOutcomes`
- Renders a row of large tappable faces (die / coin / card suits) above an "outcomes-collected" pill row.
- Each tap adds the face to the collected list; tapping the same face twice triggers a hint via the `duplicate` key in `feedbackByWrongValue`.
- Done when all `expectedOutcomes` are collected (in any order).
- `answerPayload`: `{ collected: string[] }`.

### 2. `FillFraction`
- Two number inputs stacked vertically (numerator on top), with a horizontal divider line. Numeric keyboard on mobile.
- Inputs accept 0–999 each; non-numeric chars stripped on input.
- `answerPayload`: `{ numerator: number; denominator: number }`.
- On correct, animates the fraction reducing to lowest terms (e.g. `3/6 → 1/2`).

### 3. `TapEvent`
- Renders the variant's `sampleSpace` as a row of large tappable chips.
- Tapping a chip toggles its "selected" state with a satisfying scale-bounce.
- `answerPayload`: `{ selected: string[] }`.
- On wrong: only the *incorrect* taps flash rose; correct ones stay neutral. Hint via the wrong-outcome key.

### 4. `GridEvent` — **the rich interaction**
- Renders an `rows × cols` grid of tappable cells. Each cell shows the outcome label (e.g. `(2, 5)` for dice pairs).
- Cell size scales with viewport per D63: **44×44px minimum on mobile** (touch target floor), **56×56px on tablet (`md:`)**, **64×64px on desktop (`lg:`)**. The 6×6 grid fits on a 390px-wide phone with 4px gaps; on wider viewports the grid is centered with proportional gaps.
- Tap a cell → toggles it indigo (using `--primary`).
- Live counter below the grid renders `liveCounterTemplate` with `{count}` substituted (e.g. `"6 / 36"`).
- `answerPayload`: `{ selectedCells: Array<[number, number]> }` (1-indexed).
- On wrong: each *incorrect* selected cell briefly flashes rose, then deselects. Correct ones stay indigo. Hint copy is `feedbackByCell[row,col]` if present, else `feedbackDefault`. (See `feedbackByCell` extension below.)
- On correct: every correct cell pulses emerald once.
- Smooth 60 FPS: each cell is a small `<motion.button>` with `whileTap={{ scale: 0.94 }}`. No re-renders of the full grid on tap (memoize cells on `(row, col, selected)`).

### 5. `MultipleChoice`
- 2–4 large option cards, full width, stacked vertically.
- Single-select (tap an option → outlined indigo).
- `answerPayload`: `{ optionId: string }`.
- On wrong: the chosen option flashes rose; hint from `feedbackByOption[optionId]`.

## Data model

### Extension to the content model: `feedbackByCell` for GridEventVariant

Adds optional per-cell hint support for the rich interaction. See `docs/alternatives.md` D69 (extends D8's `feedbackByWrong*` authoring pattern to the grid kind).

```ts
export type GridEventVariant = BaseVariant & {
  interactionKind: 'grid-event';
  rows: number;
  cols: number;
  correctCells: Array<[number, number]>;
  liveCounterTemplate: string;
  feedbackByCell?: Record<string, string>;  // key: "row,col" (1-indexed)
};
```

Authoring example:
```ts
feedbackByCell: {
  '1,1': 'That sums to 2, not 7.',
  '6,6': 'That sums to 12, not 7.',
}
```

The audit-feedback script (`scripts/audit-feedback.ts`) is updated to flag grid variants whose `feedbackByCell` is missing entries for any obvious wrong cells (e.g. cells adjacent to a correct cell).

### `answerPayload` shapes (consumed by `checkAnswer`)

| interactionKind | `answerPayload` |
| --- | --- |
| `tap-outcomes` | `{ collected: string[] }` |
| `fill-fraction` | `{ numerator: number; denominator: number }` |
| `tap-event` | `{ selected: string[] }` |
| `grid-event` | `{ selectedCells: Array<[number, number]> }` |
| `multiple-choice` | `{ optionId: string }` |

### `checkAnswer` semantics (this defines correctness)

| kind | Correct when | `matchedWrongKey` (for hint lookup) |
| --- | --- | --- |
| `tap-outcomes` | `collected` (as a set) equals `expectedOutcomes` (as a set) AND no duplicates | `'duplicate'` if a duplicate was tapped, else the first unexpected value |
| `fill-fraction` | `numerator / denominator === variant.numerator / variant.denominator` (cross-multiply to avoid float) OR an equivalent reduced form | `"${numerator}/${denominator}"` |
| `tap-event` | `selected` (as a set) equals `correctOutcomes` (as a set) | the first wrong outcome in `selected` |
| `grid-event` | `selectedCells` (as a set of `"row,col"`) equals `correctCells` (as a set) | the first wrong cell in `selectedCells`, key `"row,col"` |
| `multiple-choice` | `optionId === correctOptionId` | `optionId` |

## Implementation outline

1. Create `src/components/illustrations/Die.tsx`, `Coin.tsx`, `CardSuit.tsx` — geometric SVGs (no external assets), accept a `value` prop and `onTap`.
2. Create `src/features/lesson/interactions/InteractionProps.ts` exporting the shared `InteractionProps<V extends Variant>` interface.
3. Create `src/features/lesson/interactions/TapOutcomes.tsx`. Internal state: `collected: string[]`. Renders die/coin/card faces (one per `expectedOutcomes`), each as a `<motion.button>`. Below: collected pill row. Calls `onChange({ collected })` on every tap.
4. Create `src/features/lesson/interactions/FillFraction.tsx`. Two shadcn `Input type="number"` stacked, divider line. Strict numeric coercion. Calls `onChange` on every keystroke.
5. Create `src/features/lesson/interactions/TapEvent.tsx`. Renders `sampleSpace` as a flex-wrap row of chips. Internal `selected: Set<string>`. Toggle on tap.
6. Create `src/features/lesson/interactions/GridEvent.tsx`. Renders a CSS grid (`grid-cols-{cols}`). Each cell is a memoized `<GridCell>` component (`memo` on `(row, col, isSelected)`). Live counter below. Use Framer for the pulse-on-correct.
7. Create `src/features/lesson/interactions/MultipleChoice.tsx`. Renders `options` as vertically stacked `<motion.button>` cards.
8. Update `src/content/types.ts` to add `feedbackByCell?: Record<string, string>` to `GridEventVariant`.
9. Update `src/content/assertLessonInvariants.ts` to validate `feedbackByCell` keys (`"row,col"` format, in-bounds).
10. Update `scripts/audit-feedback.ts` to surface grid variants missing `feedbackByCell`.
11. Implement `src/features/lesson/checkAnswer.ts` per the semantics table above. Exhaustive `switch` keyed on `variant.interactionKind`. Pure function.
12. Write Vitest tests for `checkAnswer` covering: every kind, canonical correct, canonical wrong, edge values (empty selection, duplicates in tap-outcomes, fraction reduction equivalence).
13. Write a Vitest test for `GridCell` memoization (`render` count doesn't increase when an unrelated cell changes).

## Edge cases

- **Tap during the wrong-answer shake animation:** input is locked for the 200ms shake duration; subsequent taps queue normally.
- **Touch + mouse double-fire:** use `onClick`, not `onMouseDown` + `onTouchStart` — React synthetic events handle this.
- **Numeric input non-digits** (pasting `1.5` into fill-fraction): coerce to integer; round down silently. (Pasted negative numbers: strip the minus.)
- **Empty selection on Check:** the Check button stays disabled until `onChange` reports a non-empty answer. (Player decides.)
- **Grid cell off-screen:** the grid container scrolls vertically inside the slot if it would exceed viewport. Rare for 6×6, but defensive for future 10×10 grids.
- **Fraction zero denominator:** treated as wrong (math is undefined). Hint: "Denominator can't be zero."
- **Multiple-choice with one option:** caught by `assertLessonInvariants` (min 2 options).
- **Card suit unicode** (`♥`, `♦`, `♣`, `♠`): rendered with explicit colors (hearts/diamonds always red even in dark contexts). Inline in SVG, not as text.
- **Same cell tapped twice in grid-event:** toggles off (deselect). Always.
- **Pinch zoom on mobile:** prevent default on the grid container with `touch-action: manipulation` to avoid accidental zoom during fast tapping.

## Test plan

- Manual: every interaction kind reaches a correct state and shows the right feedback animation.
- Manual: shake on wrong is gentle, not jarring. Verified on a real phone.
- Manual: grid stays at 60 FPS on a mid-range Android (Chrome DevTools FPS meter). Verified via 50 rapid taps in a row.
- Unit: `checkAnswer` covers every kind correct + wrong (≥ 15 tests total).
- Unit: `assertLessonInvariants` rejects a grid with an out-of-bounds `feedbackByCell` key.
- Unit: `GridCell.memo` prevents unrelated re-renders (counted with `vi.fn` render-counter).
- A11y: every interactive element is keyboard-accessible (Tab to focus, Space/Enter to activate) — see `docs/ui-stack.md` accessibility section.

## Out of scope

- Drag-and-drop interactions (Phase 2+).
- Slider interactions (Phase 2 — needed for Lesson 2 LLN).
- Free-text input (Phase 2 / AI grading).
- Multi-select keyboard navigation (Phase 3 a11y polish).
- Custom interaction kinds beyond the 5 above (extend the union when adding a new lesson).
