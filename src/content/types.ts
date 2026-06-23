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
  prompt: string;
  illustration: IllustrationRef;
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
  | 'multiple-choice';

export type Variant =
  | TapOutcomesVariant
  | FillFractionVariant
  | TapEventVariant
  | GridEventVariant
  | MultipleChoiceVariant;

type BaseVariant = {
  id: string;
  prompt: string;
  feedbackCorrect: string;
  feedbackDefault: string;
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
  feedbackByCell?: Record<string, string>;
};

export type MultipleChoiceVariant = BaseVariant & {
  interactionKind: 'multiple-choice';
  options: { id: string; label: string }[];
  correctOptionId: string;
  feedbackByOption: Record<string, string>;
};

export type IllustrationRef = {
  kind: 'die' | 'coin' | 'cards';
  faceValue?: number;
};

export const FEEDBACK_TODO_PREFIX = '[TODO]';

export function FEEDBACK_TODO(note: string): string {
  return `${FEEDBACK_TODO_PREFIX} ${note}`;
}

export function isFeedbackTodo(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(FEEDBACK_TODO_PREFIX);
}
