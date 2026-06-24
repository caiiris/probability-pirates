import type { Variant } from '@/content/types';
import type { FeedbackState } from '@/features/lesson/useSlotState';
import type { AttemptPayload } from '@/features/progress/progressService';

export type InteractionProps<V extends Variant = Variant> = {
  variant: V;
  attemptNumber: number;
  feedbackState: FeedbackState;
  /** Increments each wrong attempt; key animations off this to replay them. */
  wrongTick: number;
  onChange: (payload: AttemptPayload | null) => void;
};
