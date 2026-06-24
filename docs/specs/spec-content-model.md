# Spec: Content Model

> Owns the TypeScript shape of lessons. The whole rest of the app reads from this shape. No DB role — lessons are TS files bundled into the client. **Status: IMPLEMENTED** (shipped in PR #0, see `src/content/`).

## Purpose

Defines `Lesson`, `Slot`, and `Variant` types and the file layout / authoring workflow for adding lessons and hand-written feedback. Establishes the build-time and runtime invariants that prevent malformed content from shipping.

## User-facing behavior

None directly. This spec is invisible to learners. It's the authoring contract for whoever writes lessons (us, today; potentially a content team later).

## Data model

All types live in `src/content/types.ts`. Lessons live in `src/content/lessons/NN-slug.ts`, each exporting one typed `Lesson` constant. No Firestore involvement.

```ts
export type Lesson = {
  id: string;
  number: number;
  title: string;
  blurb: string;
  estimatedMinutes: number;
  comingSoon?: boolean;
  slots: Slot[];
};

export type Slot = ConceptSlot | WrapSlot | ProblemSlot;

export type ConceptSlot = {
  id: string;
  kind: 'concept';
  prompt: string; // lede sentence (required)
  illustration: IllustrationRef;
  title?: string; // D75 — short heading / term being introduced
  body?: string[]; // D75 — supporting paragraphs (the "teach")
  example?: {
    // D75 — optional short worked example / derivation
    title?: string;
    steps: string[]; // ordered short lines; `{a/b}` segments render as stacked fractions
  };
};

export type WrapSlot = {
  id: string;
  kind: 'wrap';
  title: string;
  body: string;
  segueToLessonId?: string;
};

export type ProblemSlot = {
  id: string;
  kind: 'problem';
  interactionKind: InteractionKind;
  variants: [Variant, ...Variant[]];
};

export type InteractionKind =
  | 'tap-outcomes'
  | 'fill-fraction'
  | 'tap-event'
  | 'grid-event'
  | 'multiple-choice'
  | 'simulate-proportion'
  | 'monty-hall'; // D73 — simulation kinds for Lessons 2-4

export type Variant =
  | TapOutcomesVariant
  | FillFractionVariant
  | TapEventVariant
  | GridEventVariant
  | MultipleChoiceVariant
  | SimulateProportionVariant
  | MontyHallVariant;

type BaseVariant = {
  id: string;
  prompt: string;
  feedbackCorrect: string;
  feedbackDefault: string;
  /**
   * Optional deeper hint surfaced by the lesson player after N wrong attempts
   * (see `spec-lesson-player.md` §"Feedback area"). Shown alongside the
   * per-wrong feedback, never as an unlock. Phase 2 may migrate this into an
   * ordered `hints` array for progressive disclosure.
   */
  explanation?: string;
};

export type TapOutcomesVariant = BaseVariant & {
  interactionKind: 'tap-outcomes';
  source: 'd6' | 'coin' | 'card-suit' | 'card-rank';
  expectedOutcomes: string[];
  feedbackByWrongValue?: Record<string, string>;
};

export type FillFractionVariant = BaseVariant & {
  interactionKind: 'fill-fraction';
  numerator: number;
  denominator: number;
  feedbackByWrongAnswer?: Record<string, string>;
};

export type TapEventVariant = BaseVariant & {
  interactionKind: 'tap-event';
  sampleSpace: string[];
  correctOutcomes: string[];
  feedbackByWrongOutcome?: Record<string, string>;
};

export type GridEventVariant = BaseVariant & {
  interactionKind: 'grid-event';
  rows: number;
  cols: number;
  correctCells: Array<[number, number]>;
  liveCounterTemplate: string;
  /** Optional per-cell hint keyed by `"row,col"` strings (D69). Falls back to `feedbackDefault`. */
  feedbackByCell?: Record<string, string>;
};

export type MultipleChoiceVariant = BaseVariant & {
  interactionKind: 'multiple-choice';
  options: { id: string; label: string; subtext?: string }[];
  correctOptionId: string;
  feedbackByOption: Record<string, string>;
  context?: string; // optional blurb shown above the options
};

// D73 — simulation kinds (Lessons 2-4). Both grade on engagement: the renderer
// emits a non-null answer only once the trial/game threshold is reached, so the
// Check button stays disabled until the learner has run the simulation. There is
// no synthetic "wrong" state, which preserves the no-bail-out rule (D55).

export type SimulateProportionVariant = BaseVariant & {
  interactionKind: 'simulate-proportion';
  scenario: 'coin' | 'die-six' | 'birthday'; // drives the per-trial visual + generator
  targetProbability: number; // 0..1, drawn as the reference line
  targetLabel: string; // e.g. "True P(heads) = 50%"
  minTrials: number; // engagement gate before Continue unlocks
  roomSize?: number; // people per room for the birthday scenario
  feedbackByWrongValue?: Record<string, string>; // keyed by 'incomplete'
};

export type MontyHallVariant = BaseVariant & {
  interactionKind: 'monty-hall';
  minGames: number; // total games (manual + autopilot) before Continue unlocks
  feedbackByWrongValue?: Record<string, string>; // keyed by 'incomplete'
};

export type IllustrationRef = {
  kind: 'die' | 'coin' | 'cards' | 'doors' | 'calendar';
  faceValue?: number;
};
```

## Implementation outline

1. Create `src/content/types.ts` with all types above; the `[Variant, ...Variant[]]` tuple forbids empty `variants` arrays at compile time.
2. Create `src/content/lessons/01-what-is-probability.ts` exporting `lesson1: Lesson` with all hand-written copy: 1 intro concept, 4 problem slots (sample-space, fill-fraction, tap-event evens, grid-event sum=7) with 2 variants each, 1 multiple-choice payoff, 1 wrap.
3. Stub `src/content/lessons/{02..06}-*.ts` exporting lessons with `comingSoon: true` and `slots: []` plus a title and blurb.
4. Create `src/content/index.ts` exporting `lessons: Lesson[]` (array of all 6) and `lessonById: Map<string, Lesson>`.
5. Create `src/content/assertLessonInvariants.ts` exporting a function that throws if any `ProblemSlot.interactionKind` mismatches a variant's, if any required string is empty, or if any `correctCells` row/col is out of bounds.
6. Call `assertLessonInvariants` on every lesson at module load in `src/content/index.ts` — `throw` in dev, `console.error` in prod.
7. Write `src/content/lessons/01-what-is-probability.test.ts` (Vitest) that imports `lesson1` and asserts `assertLessonInvariants` passes.
8. Add a script `scripts/audit-feedback.ts` that scans every variant and prints which ones lack `feedbackByWrongAnswer`/`feedbackByWrongValue`/`feedbackByOption` entries — the "what hints still need writing" backlog.

## Edge cases

- A variant placed in a slot with a mismatched `interactionKind` → `assertLessonInvariants` throws with a pointer to `lesson.id/slot.id/variant.id`.
- An empty `variants` array → caught at compile time by the tuple type; if someone forces it, the assertion catches it too.
- A `GridEventVariant.correctCells` entry referencing a row/col outside `rows`/`cols` → assertion throws.
- A variant with empty `feedbackCorrect` or `feedbackDefault` → assertion throws.
- Lessons 2–6 with `comingSoon: true` are allowed to have `slots: []` (assertion skips invariant checks if `comingSoon`).

## Test plan

- `assertLessonInvariants(lesson1)` passes.
- Mutating a variant's `interactionKind` in a test throws with a useful message.
- Mutating `correctCells` to `[6, 6]` for a 6×6 grid throws.
- The exported `lessons` array has length 6; `lesson1` has all 7 slot types (1 concept, 4 problem, 1 multiple-choice, 1 wrap).
- TypeScript compilation fails if a developer removes `feedbackCorrect` from any variant.
- `npm run audit-feedback` prints a non-empty backlog when a known wrong-answer hint is absent.

## Authoring conventions

### `FEEDBACK_TODO()` for pending hand-written copy

Hand-written feedback is the content owner's job, not the implementer's. When a variant needs feedback that hasn't been authored yet, wrap a brief authoring note with the `FEEDBACK_TODO()` helper exported from `src/content/types.ts`:

```ts
import { FEEDBACK_TODO } from '../types';

{
  id: 'd6-evens-v1',
  prompt: 'Tap every face that shows an even number.',
  feedbackCorrect: FEEDBACK_TODO('praise — they spotted 2, 4, 6'),
  feedbackDefault: FEEDBACK_TODO('generic nudge — they missed at least one even face'),
  feedbackByWrongValue: {
    '1': FEEDBACK_TODO('1 is odd — explain odd vs even briefly'),
  },
  // ...
}
```

The helper renders as `[TODO] <note>` — visible at a glance if it ever leaks to a real learner. `npm run audit-feedback` lists every outstanding placeholder so the content owner has a single backlog to work through.

Implementer rule (see `docs/architecture.md` §12.6): **do not invent feedback strings.** If you don't have authored copy for a variant, use `FEEDBACK_TODO()`. Inventing copy is unauthorized scope creep and produces drift from the content owner's voice.

### `feedbackByCell` for grid-event variants (D69)

Grid-event problems can optionally carry per-cell hints keyed by `"row,col"`:

```ts
{
  interactionKind: 'grid-event',
  rows: 6, cols: 6,
  correctCells: [[0, 5], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0]],
  liveCounterTemplate: '{n} of 6 sevens found',
  feedbackByCell: {
    '0,0': FEEDBACK_TODO('that cell is 1+1=2 — not 7'),
  },
  feedbackCorrect: 'Yes — every cell on that diagonal sums to 7.',
  feedbackDefault: FEEDBACK_TODO('generic — the cell you tapped does not sum to 7'),
}
```

If `feedbackByCell[row,col]` is set, the player surfaces it on a wrong tap; otherwise it falls back to `feedbackDefault`. Optional — leave undefined when one default suffices.

## Out of scope

- Loading lessons from a CMS or Firestore (see alternatives D13).
- Localization (Phase 3+).
- Authoring UI (alternatives D26).
- Rendering the lessons — see `spec-lesson-player`, `spec-interactions`, and `docs/ui-stack.md`.
- Picking which variant to show — see `spec-progress-persistence`.
