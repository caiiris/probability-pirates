import { useMemo, useEffect, useRef } from 'react';
import type { ProblemSlot } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';
import type { FeedbackState } from './useSlotState';
import type { AttemptPayload } from '@/features/progress/progressService';
import { pickVariantForSlot } from '@/features/progress/selectVariant';
import { TapOutcomes } from './interactions/TapOutcomes';
import { FillFraction } from './interactions/FillFraction';
import { TapEvent } from './interactions/TapEvent';
import { GridEvent } from './interactions/GridEvent';
import { MultipleChoice } from './interactions/MultipleChoice';
import { SimulateProportion } from './interactions/SimulateProportion';
import { ScrubTrials } from './interactions/ScrubTrials';
import { FillText } from './interactions/FillText';
import { MontyHall } from './interactions/MontyHall';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';

type Props = {
  slot: ProblemSlot;
  progress: LessonProgress;
  uid: string;
  lessonId: string;
  feedbackState: FeedbackState;
  attemptNumber: number;
  wrongTick: number;
  onChange: (payload: AttemptPayload | null) => void;
  onVariantPicked: (variantId: string) => void;
};

export function ProblemSlotView({
  slot,
  progress,
  uid,
  lessonId,
  feedbackState,
  attemptNumber,
  wrongTick,
  onChange,
  onVariantPicked,
}: Props) {
  // Include the already-saved variant id in the memo deps so resume always
  // restores the correct variant (B014).
  const savedVariantId = progress.selectedVariantIds[slot.id];
  const variant = useMemo(() => {
    return pickVariantForSlot(progress, slot, uid, lessonId);
  }, [slot.id, progress.attemptId, savedVariantId]);

  // Notify parent of the picked variant in an effect (not inside useMemo) to
  // avoid Firestore writes as a render side effect (B012).
  const lastNotifiedRef = useRef('');
  useEffect(() => {
    if (variant.id && variant.id !== lastNotifiedRef.current) {
      lastNotifiedRef.current = variant.id;
      onVariantPicked(variant.id);
    }
  }, [variant.id, onVariantPicked]);

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

  // Vertically center the interaction for short problems; tall ones collapse the
  // auto-margins and scroll from the top. Each interaction already centers
  // itself horizontally (mx-auto max-w-sm).
  return (
    <div className="min-h-full flex flex-col">
      <div className="my-auto w-full">
        {slot.challenge && (
          <div className="mx-auto mb-6 flex max-w-sm items-center gap-3 rounded-xl border-2 border-primary/30 bg-[color:var(--primary-soft)]/50 px-4 py-3">
            <CaptainMascot className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Challenge question
              </p>
              <p className="text-xs text-muted-foreground">Captain Pascal wants to play a game.</p>
            </div>
          </div>
        )}
        {interaction}
      </div>
    </div>
  );
}
