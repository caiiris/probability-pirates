/**
 * Standalone interaction dispatcher for the practice solve loop (WP-6a).
 *
 * Mirrors the switch in ProblemSlotView (src/features/lesson/ProblemSlotView.tsx)
 * without the lesson-specific progress, Firestore, or slot-selection concerns.
 * When a new interactionKind is added to ProblemSlotView, add it here too.
 *
 * Takes a Variant directly (already resolved by the practice engine) plus the
 * same InteractionProps-style callbacks used by every existing renderer.
 */

import type { Variant } from '@/content/types';
import type { FeedbackState } from '@/features/lesson/useSlotState';
import type { AttemptPayload } from '@/features/progress/progressService';
import { TapOutcomes } from '@/features/lesson/interactions/TapOutcomes';
import { FillFraction } from '@/features/lesson/interactions/FillFraction';
import { TapEvent } from '@/features/lesson/interactions/TapEvent';
import { GridEvent } from '@/features/lesson/interactions/GridEvent';
import { MultipleChoice } from '@/features/lesson/interactions/MultipleChoice';
import { SimulateProportion } from '@/features/lesson/interactions/SimulateProportion';
import { ScrubTrials } from '@/features/lesson/interactions/ScrubTrials';
import { FillText } from '@/features/lesson/interactions/FillText';
import { MontyHall } from '@/features/lesson/interactions/MontyHall';

type Props = {
  variant: Variant;
  attemptNumber: number;
  feedbackState: FeedbackState;
  /** Increments on each wrong answer so renderers can key animations off it. */
  wrongTick: number;
  onChange: (payload: AttemptPayload | null) => void;
};

export function InteractionDispatch({
  variant,
  attemptNumber,
  feedbackState,
  wrongTick,
  onChange,
}: Props) {
  const sharedProps = { variant, attemptNumber, feedbackState, wrongTick, onChange };

  let interaction: React.ReactNode;
  switch (variant.interactionKind) {
    case 'tap-outcomes':
      interaction = <TapOutcomes {...sharedProps} variant={variant} />;
      break;
    case 'fill-fraction':
      interaction = <FillFraction {...sharedProps} variant={variant} />;
      break;
    case 'tap-event':
      interaction = <TapEvent {...sharedProps} variant={variant} />;
      break;
    case 'grid-event':
      interaction = <GridEvent {...sharedProps} variant={variant} />;
      break;
    case 'multiple-choice':
      interaction = <MultipleChoice {...sharedProps} variant={variant} />;
      break;
    case 'simulate-proportion':
      interaction = <SimulateProportion {...sharedProps} variant={variant} />;
      break;
    case 'scrub-trials':
      interaction = <ScrubTrials {...sharedProps} variant={variant} />;
      break;
    case 'fill-text':
      interaction = <FillText {...sharedProps} variant={variant} />;
      break;
    case 'monty-hall':
      interaction = <MontyHall {...sharedProps} variant={variant} />;
      break;
  }

  return <>{interaction}</>;
}
