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
   * Optional named theorem statement (D77). Renders as a bordered callout
   * directly under the lede prompt (above the body / example / derivation),
   * with `name` as the eyebrow. Used for the four named counting theorems
   * (multiplication, addition, permutation, combination) and other named
   * probability rules.
   */
  theorem?: {
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
  | 'tap-event'
  | 'grid-event'
  | 'multiple-choice'
  | 'simulate-proportion'
  | 'monty-hall';

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
  explanation?: string;
  /**
   * Optional teaching caption shown INSIDE the interaction (just below its
   * content) once the learner answers correctly, distinct from the footer
   * feedback. Currently rendered by `tap-outcomes` and `fill-fraction`.
   */
  afterNote?: string;
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
  /** When true, renders an interactive d6 reference above the inputs (tap to highlight faces). */
  showDieContext?: boolean;
  /** Optional label beside the numerator input, e.g. "ways to roll even". */
  numeratorLabel?: string;
  /** Optional label beside the denominator input, e.g. "ways in total". */
  denominatorLabel?: string;
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
