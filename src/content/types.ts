import type { SkillId } from '@/content/skills';
import type { MisconceptionKey } from '@/content/misconceptions';

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
  /**
   * Lede sentence, the one-line idea the slot is built around. Optional on
   * enriched slots (those with a title/body/quote/etc.); required on the thin
   * one-liner shape, which has nothing else to show.
   */
  prompt?: string;
  illustration: IllustrationRef;
  /** Optional short heading or term being introduced (renders in the display face). */
  title?: string;
  /** Optional supporting paragraphs — the "teach". Kept short; comfortable measure, not full width. */
  body?: string[];
  /**
   * Optional pull-quote (D88). Renders as a styled box with a large quotation
   * mark and italic text, directly under the lede prompt. Used for inspirational
   * or framing quotes (e.g. the course-opener welcome).
   */
  quote?: {
    text: string;
    attribution?: string;
  };
  /**
   * Optional named theorem statement (D77). Renders as a violet-accented
   * callout directly under the lede prompt, with `name` as the eyebrow.
   * Use for **claims** that can be proven or derived (the multiplication
   * principle, the complement rule, P(A) + P(not A) = 1, etc.). Do not
   * use for **terminology** — that is what `definition` is for. Both can
   * appear on the same slot if a beat names a word AND states a claim
   * about it; the definition renders first.
   */
  theorem?: {
    name?: string;
    statement: string;
  };
  /**
   * Optional named definition. Same shape as `theorem` but renders with
   * a blue accent and a "Definition" eyebrow. Use for **naming a word**
   * (outcome, sample space, event, random variable). A definition is a
   * labeling convention, not a claim to be proven; the visual difference
   * cues the learner that the slot is teaching vocabulary rather than
   * stating a derivable result.
   */
  definition?: {
    name?: string;
    statement: string;
  };
  /** Optional short worked example, rendered as an ordered, mono-numeric block. */
  example?: {
    title?: string;
    steps: string[];
  };
  /**
   * Optional formal derivation (D77). Rendered with the "notebook page"
   * treatment: an amber paper tab at the top and step-numbered mono lines.
   * Use this for proofs and derivations (not for quick numeric examples).
   *
   * If `question` is set, the card becomes a 3D-flippable flashcard (D78):
   * the front face shows the question, click flips to reveal the title and
   * steps. Without `question`, the derivation renders fully visible.
   */
  derivation?: {
    title: string;
    steps: string[];
    question?: string;
  };
  /**
   * Optional inline static figure rendered alongside the prose. Distinct
   * from problem-slot interactions (which the learner drives): a figure is
   * declarative chrome attached to a teaching beat. Currently supports a
   * single `settling-line` variant — a long-run convergence chart used by
   * `long-run-frequency` to show the running share landing on the true
   * probability without making the learner re-drive the simulation. Can
   * grow to other variants (e.g. tree diagrams) without touching this
   * shape.
   */
  figure?: ConceptFigure;
};

export type ConceptFigure =
  | SettlingLineFigure
  | TwoCoinsGridFigure
  | SubsetPickerFigure
  | TreeDiagramFigure
  | RoadForkFigure;

/**
 * Long-run convergence chart. Shows the running fraction of successes over
 * many trials with a horizontal reference at the true probability. Used by
 * `long-run-frequency` so the settling story is on screen as a line, not
 * just in prose.
 */
export type SettlingLineFigure = {
  kind: 'settling-line';
  /** Drives the trial generator. Must match a `ScrubTrialsVariant.scenario`. */
  scenario: 'coin' | 'die-six';
  /** Where the running share converges. Drawn as a horizontal reference. */
  targetProbability: number;
  /** Short caption for the reference line, e.g. "1/2" or "1/6". */
  targetLabel: string;
  /** How many trials the line spans. Default 10,000. */
  trialCount?: number;
  /** Deterministic seed for the trial sequence. Same seed → same picture. */
  seed?: number;
  /** Optional caption shown beneath the chart. */
  caption?: string;
};

/**
 * Autonomous looping animation that builds a two-coin sample space cell by
 * cell into a 2×2 grid (HH, HT, TH, TT). The four pairs appear in sequence,
 * pause briefly when full, then clear and replay. Used in `sample-space` so
 * the learner sees the four outcomes as ordered pairs being constructed,
 * not just listed. Pure observation: no interaction.
 *
 * The grid layout is fixed (rows = first flip, columns = second flip), so
 * authors only configure the caption and the per-step timing if they want
 * to tune cadence; everything else is determined by the lesson's content.
 */
export type TwoCoinsGridFigure = {
  kind: 'two-coins-grid';
  /** Optional caption shown beneath the grid. */
  caption?: string;
  /** Milliseconds between cells appearing. Default 900ms. */
  stepMs?: number;
  /** Milliseconds the full grid stays visible before looping. Default 1800ms. */
  holdMs?: number;
};

/**
 * Playful subset picker. Renders a small fixed cast of colored balls
 * (red, blue, green) that the learner can tap to add to or remove from a
 * subset. The current subset is shown beneath the row, in curly-brace
 * notation, so the learner can see a real-time mapping between their
 * taps and the set notation introduced in the lesson body.
 *
 * Deliberately **not** a problem slot. There is no correct answer, no
 * grading, no XP. Continue is always available; the picker is here to
 * make the word "subset" feel concrete by hand. Used in `sample-space`
 * to sit under the set/subset definition before the formal `define-event`
 * beat.
 */
export type SubsetPickerFigure = {
  kind: 'subset-picker';
  /** Optional caption shown beneath the picker. */
  caption?: string;
};

/**
 * Autonomous looping tree-diagram animation for the multiplication
 * principle. Renders a two-stage branching tree (e.g. 3 shirts × 2 pants)
 * with a root, `stageA.count` first-stage nodes that fan out from it,
 * and `stageB.count` second-stage nodes that fan out from each
 * first-stage node — `stageA.count * stageB.count` leaves total. The
 * animation reveals the levels in sequence (root → stage A → stage B),
 * holds when the tree is full, then clears and replays.
 *
 * Limited to two stages on purpose: the multiplication principle is
 * taught on two stages because that is the case the eye can hold all
 * at once. Three-stage trees get visually hairy and live in later
 * lessons via fill-text counting problems instead.
 *
 * Authors specify the two stages (label + count) and an optional
 * caption. Sample-space size is read by the component as
 * `stageA.count * stageB.count`; if the lesson needs to show that
 * product on screen, set `showProduct: true`.
 */
export type TreeDiagramFigure = {
  kind: 'tree-diagram';
  /** First-stage choice — e.g. { label: 'shirt', count: 3 }. */
  stageA: { label: string; count: number };
  /** Second-stage choice — e.g. { label: 'pants', count: 2 }. */
  stageB: { label: string; count: number };
  /** Optional caption shown beneath the tree. */
  caption?: string;
  /** When true, animates "stageA.count × stageB.count = N" beneath the tree once full. */
  showProduct?: boolean;
  /** Milliseconds between level reveals. Default 900ms. */
  stepMs?: number;
  /** Milliseconds the full tree stays before looping. Default 2400ms. */
  holdMs?: number;
};

/**
 * Autonomous looping road-fork animation for the multiplication principle.
 * Same two-stage shape as `tree-diagram` but drawn as a left-to-right road
 * that splits at each decision. The classic "fork in the road" metaphor:
 * first intersection fans into `stageA.count` routes, each route hits a
 * second fork into `stageB.count` endpoints. Pure observation (no input).
 */
export type RoadForkFigure = {
  kind: 'road-fork';
  stageA: { label: string; count: number };
  stageB: { label: string; count: number };
  caption?: string;
  showProduct?: boolean;
  stepMs?: number;
  holdMs?: number;
};

/** Two-stage combination picker embedded in a multiple-choice slot. */
export type CombinationPickerConfig = {
  stageALabel: string;
  stageAOptions: string[];
  stageBLabel: string;
  stageBOptions: string[];
  /** Label on the button that registers the current pair. Default "Add outfit". */
  addButtonLabel?: string;
};

export type WrapSlot = {
  id: string;
  kind: 'wrap';
  title: string;
  body: string;
  segueToLessonId?: string;
  /** Optional Captain Pascal cameo line shown on the wrap (D88). */
  mascotLine?: string;
};

export type ProblemSlot = {
  id: string;
  kind: 'problem';
  interactionKind: InteractionKind;
  variants: [Variant, ...Variant[]];
  /**
   * Commit-once "prediction / challenge" question (D88). When true the learner
   * answers once and Continue unlocks immediately, right OR wrong (no retry, no
   * bail-out gate). Correct shows `feedbackCorrect`; wrong shows the matching
   * `feedbackBy*` copy. Use for gut-check questions whose payoff is the reveal
   * on the next slots, not getting the answer right first try.
   */
  commitOnce?: boolean;
  /**
   * Renders a "Challenge question" banner (with the Captain Pascal mascot) above
   * the interaction. Presentation only.
   */
  challenge?: boolean;
};

export type InteractionKind =
  | 'tap-outcomes'
  | 'fill-fraction'
  | 'number-fill'
  | 'tap-event'
  | 'grid-event'
  | 'multiple-choice'
  | 'simulate-proportion'
  | 'scrub-trials'
  | 'fill-text'
  | 'monty-hall';

export type Variant =
  | TapOutcomesVariant
  | FillFractionVariant
  | NumberFillVariant
  | TapEventVariant
  | GridEventVariant
  | MultipleChoiceVariant
  | SimulateProportionVariant
  | ScrubTrialsVariant
  | FillTextVariant
  | MontyHallVariant;

type BaseVariant = {
  id: string;
  prompt: string;
  feedbackCorrect: string;
  feedbackDefault: string;
  explanation?: string;
  /**
   * Optional teaching caption shown INSIDE the interaction (just below its
   * content) once the learner answers correctly, distinct from the footer
   * feedback. Currently rendered by `tap-outcomes` and `fill-fraction`.
   */
  afterNote?: string;
  /** Phase 2 (WP-2) — skill ids this variant exercises (learner model). Optional during migration. */
  skills?: SkillId[];
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
  /**
   * Maps a specific wrong fraction (the diagnostic "trap" answer) to a
   * misconception key for the learner model. Each entry's `num`/`den` are
   * matched against the learner's submitted fraction by exact value (reduced),
   * so `2/4` matches a `1/2` trap. Number-fill uses `misconceptionByValue` and
   * multiple-choice uses `misconceptionByOption`; this is the fraction analogue.
   * See spec-misconception-capture.md (C-MC2/C-MC4).
   */
  misconceptionByFraction?: { num: number; den: number; key: MisconceptionKey }[];
  /** When true, renders an interactive d6 reference above the inputs (tap to highlight faces). */
  showDieContext?: boolean;
  /** Optional label beside the numerator input, e.g. "ways to roll even". */
  numeratorLabel?: string;
  /** Optional label beside the denominator input, e.g. "ways in total". */
  denominatorLabel?: string;
  /**
   * Optional context blurb shown between the prompt and the inputs. Use
   * for a brief setup the prompt cannot carry on its own (e.g. "a suit
   * has 13 cards") without bloating the prompt.
   */
  context?: string;
};

/**
 * Single-integer free-response input (F2). The learner types a whole number
 * (e.g. a count) and it is graded by exact integer equality against `answer`.
 *
 * Used by the practice engine for count-style problems where multiple-choice
 * would let the learner guess; the renderer is `NumberFill`. Lessons do not
 * currently author this kind (it is practice-only), but the type lives in the
 * shared union so `checkAnswer` can grade it.
 */
export type NumberFillVariant = BaseVariant & {
  interactionKind: 'number-fill';
  /** The exact correct integer answer. Derived from the template's solver. */
  answer: number;
  /** Optional label above the input, e.g. "study groups". Defaults to "Answer". */
  answerLabel?: string;
  /** Keyed by the stringified wrong integer. The default covers the rest. */
  feedbackByWrongAnswer?: Record<string, string>;
  /** Maps a specific wrong integer answer to a misconception key (learner model). */
  misconceptionByValue?: Record<number, MisconceptionKey>;
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
  feedbackByCell?: Record<string, string>;
  /** Shows a "Roll the dice!" simulation button above the grid. */
  simulationEnabled?: boolean;
  /**
   * Optional comparison hint. Renders an opt-in, read-only reference grid that
   * highlights a DIFFERENT sum's cells in a distinct (amber) color, so the
   * learner can see the "constant-sum diagonal" shape without it sitting on the
   * live grid where they would reflexively tap it. Collapsed by default; the
   * learner chooses to reveal it.
   */
  hint?: {
    highlightCells: Array<[number, number]>;
    label: string;
  };
};

export type MultipleChoiceVariant = BaseVariant & {
  interactionKind: 'multiple-choice';
  options: { id: string; label: string; subtext?: string }[];
  correctOptionId: string;
  feedbackByOption: Record<string, string>;
  /** Phase 2 (WP-2) — maps a wrong option id to a misconception key (learner model). */
  misconceptionByOption?: Record<string, MisconceptionKey>;
  /** Optional context blurb shown above the options. */
  context?: string;
  /** When true, renders the two-dice "Roll the dice!" roller above the options (play, no answer state). */
  showDiceRoller?: boolean;
  /** Optional read-only grid shown inside a collapsible "Need a hint?" panel. */
  gridReference?: {
    rows: number;
    cols: number;
    highlightCells?: Array<[number, number]>;
    label?: string;
  };
  /**
   * Optional strategy hint shown above the prompt (D96). Use when the learner
   * should try a concrete listing strategy before committing to an answer —
   * e.g. "build every outfit in the picker below."
   */
  strategyHint?: string;
  /**
   * Optional two-stage combination picker (D96). Lets the learner register
   * (stageA, stageB) pairs and see a running count. Does not affect grading;
   * the MCQ answer is still what gets checked.
   */
  combinationPicker?: CombinationPickerConfig;
};

/**
 * A trial simulator that runs a binary event many times and plots the running
 * share of "successes" converging toward a theoretical reference line.
 * The slot is "correct" once the learner has run at least `minTrials` trials,
 * so Check stays disabled until they have actually watched the convergence.
 */
export type SimulateProportionVariant = BaseVariant & {
  interactionKind: 'simulate-proportion';
  /** Drives the per-trial visual and the trial generator. */
  scenario: 'coin' | 'die-six' | 'birthday';
  /** Theoretical probability the running share converges to (0–1). Drawn as a reference line. */
  targetProbability: number;
  /** Short label for the reference line, e.g. "True P(heads) = 50%". */
  targetLabel: string;
  /** Learner must run at least this many trials before Continue unlocks. */
  minTrials: number;
  /** People per room for the `birthday` scenario; ignored otherwise. */
  roomSize?: number;
  /** Keyed by `'incomplete'` for the "run more trials" nudge. */
  feedbackByWrongValue?: Record<string, string>;
};

/**
 * "Scrub" interactive demo: a slider sweeps a number of trials N from a small
 * start to a large end, and a horizontal H/T (or success/failure) bar updates
 * to show the share at that N. Pedagogically distinct from `simulate-proportion`
 * — there the learner taps a button to *generate* trials and watches the
 * running share over time; here they *scrub* across pre-determined trial
 * counts to feel the share *settle* as N grows. Used in the long-run-frequency
 * lesson to make "the share converges" something the learner can drag and see,
 * not just a chart they read.
 *
 * Determinism: the same `seed` always produces the same H/T sequence, so the
 * bar at N=1000 is reproducible across renders, scrubs, and resumes (the
 * learner can drag back and forth without the visualization re-rolling).
 *
 * Engagement gate: Continue unlocks once the learner has reached at least
 * `reachN` trials on the slider — a low bar (default 1,000 or so) just to
 * confirm they actually swept past the wobbly low-N region.
 */
export type ScrubTrialsVariant = BaseVariant & {
  interactionKind: 'scrub-trials';
  /** Drives the trial generator. `coin` = P(heads) = 0.5; `die-six` = P(roll a 6) = 1/6. */
  scenario: 'coin' | 'die-six';
  /** Long-run probability the share converges to (0–1). Renders as a reference marker on the bar. */
  targetProbability: number;
  /** Short label for the reference, e.g. "True P(heads) = 50%". */
  targetLabel: string;
  /** Smallest N on the slider — typically 10 (where the share is wildly wobbly). */
  minN: number;
  /** Largest N on the slider — typically 10,000 (where the share is very close to target). */
  maxN: number;
  /** Engagement gate: the learner must scrub to at least this many trials before Continue unlocks. */
  reachN: number;
  /** Deterministic seed for the trial sequence. Same seed → same bar shape forever. */
  seed?: number;
  /** Keyed by `'incomplete'` for the "scrub further" nudge. */
  feedbackByWrongValue?: Record<string, string>;
};

/**
 * Free-text fill-in-the-blank. The learner types into a single input; the
 * answer is graded by a regex match against the normalized input (trimmed,
 * lower-cased). Use when the question has many equally valid answers
 * (e.g. "type one outcome from a sample space" — any of `HHH`, `HHT`, …
 * `TTT` is acceptable) and authoring all of them as MCQ options would be
 * busy.
 *
 * Authoring rules for `acceptRegex`:
 *   - Pattern is matched against `input.trim().toLowerCase()`, so the
 *     regex should use lowercase character classes (`[ht]`, not `[HhTt]`).
 *   - Anchors are added at evaluation time; do NOT include `^`/`$`.
 *   - Use `\s*` between tokens if you want to accept optional whitespace.
 *   - Compile errors are caught by `assertLessonInvariants`, so a bad
 *     regex fails at lesson-load time, not at first run.
 *
 * `feedbackByWrongAnswer` is keyed by the normalized input. Most lessons
 * only need `feedbackDefault` (the input space is too large to enumerate);
 * specific known traps can be keyed explicitly if useful.
 */
export type FillTextVariant = BaseVariant & {
  interactionKind: 'fill-text';
  /**
   * Regex source string (no leading/trailing slashes, no anchors). Matched
   * case-insensitively against the normalized input.
   */
  acceptRegex: string;
  /** Short hint shown inside the empty input. Optional. */
  placeholder?: string;
  /** Optional context blurb shown above the input (or above the combination picker when present). */
  context?: string;
  /** Approximate max length for the input. UI hint only, not validation. */
  maxLength?: number;
  /**
   * Optional two-stage combination picker (D96). Lets the learner register
   * (stageA, stageB) pairs and see a running count. Does not affect grading.
   */
  combinationPicker?: CombinationPickerConfig;
  /** Keyed by normalized wrong input. The default covers the rest. */
  feedbackByWrongAnswer?: Record<string, string>;
};

/**
 * The Monty Hall problem. Three doors, one car. The learner plays rounds by
 * hand, then runs an autopilot batch that compares "always stay" vs
 * "always switch" win rates. Correct once at least `minGames` total games
 * (hand-played plus batched) have run.
 */
export type MontyHallVariant = BaseVariant & {
  interactionKind: 'monty-hall';
  /** Total games (manual + autopilot) required before Continue unlocks. */
  minGames: number;
  /** Keyed by `'incomplete'` for the "play or run a batch" nudge. */
  feedbackByWrongValue?: Record<string, string>;
};

export type IllustrationRef = {
  kind: 'die' | 'coin' | 'cards' | 'doors' | 'calendar';
  faceValue?: number;
};

export const FEEDBACK_TODO_PREFIX = '[TODO]';

export function FEEDBACK_TODO(note: string): string {
  return `${FEEDBACK_TODO_PREFIX} ${note}`;
}

export function isFeedbackTodo(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(FEEDBACK_TODO_PREFIX);
}
