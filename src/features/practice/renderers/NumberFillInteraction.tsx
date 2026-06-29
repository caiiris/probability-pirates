/**
 * NumberFillInteraction — dispatch adapter that wraps the presentational
 * `NumberFill` input with the local value state and the `AttemptPayload`
 * contract the practice loop expects.
 *
 * Stateless renderers in this app reset by remounting; PracticeSession keys
 * the whole InteractionDispatch by `instance.instanceId`, so every new problem
 * remounts this adapter with an empty field. Emits `{ value }` payloads
 * (graded by `checkAnswer`'s 'number-fill' case).
 */

import { useState } from 'react';
import { NumberFill } from './NumberFill';
import type { FeedbackState } from '@/features/lesson/useSlotState';
import type { AttemptPayload } from '@/features/progress/progressService';
import type { NumberFillVariant } from '@/content/types';

type Props = {
  variant: NumberFillVariant;
  feedbackState: FeedbackState;
  onChange: (payload: AttemptPayload | null) => void;
};

export function NumberFillInteraction({ variant, feedbackState, onChange }: Props) {
  const [value, setValue] = useState<number | null>(null);

  function handleChange(next: number | null) {
    setValue(next);
    onChange(next === null ? null : { value: next });
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-5">
      <p className="max-w-2xl text-lg font-medium leading-snug text-center sm:text-xl">
        {variant.prompt}
      </p>
      <NumberFill
        value={value}
        onChange={handleChange}
        disabled={feedbackState === 'correct'}
        label={variant.answerLabel ?? 'Answer'}
      />
    </div>
  );
}
