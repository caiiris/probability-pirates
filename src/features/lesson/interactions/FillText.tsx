import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { FillTextVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';
import { CombinationPicker } from './CombinationPicker';

const AFFORDANCE = 'Type your answer in the box. Tap Check when ready.';

type Props = InteractionProps<FillTextVariant>;

/**
 * Free-text fill-in-the-blank. The learner types into a single input;
 * grading is a regex match against the trimmed, lowercased input
 * (see `checkAnswer.ts`). Used when a question has many equally valid
 * answers and an MCQ would be busy (e.g. "type one outcome from the
 * sample space of three coin flips").
 *
 * Reset behavior: the input clears whenever the variant id changes
 * (new slot mounts a new component instance, so React state reinitializes)
 * and on a wrong attempt (`wrongTick` bumps), so the learner gets a clean
 * slate to retry. We do NOT clear after a correct answer; once correct,
 * the input locks in place so the learner can review what they typed.
 */
export function FillText({ variant, feedbackState, wrongTick, onChange }: Props) {
  const [value, setValue] = useState('');
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('fill-text');

  // Clear the input on each wrong attempt so the learner starts fresh.
  // `wrongTick` is bumped by the parent reducer on every wrong answer,
  // so this fires exactly once per attempt. `onChange` is stable across
  // renders (it comes from the parent's `useState`), so including it in
  // the deps does not cause an extra clear.
  useEffect(() => {
    if (wrongTick > 0) {
      setValue('');
      onChange(null);
    }
  }, [wrongTick, onChange]);

  function handleChange(next: string) {
    setValue(next);
    onChange(next.trim().length > 0 ? { text: next } : null);
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto w-full">
      <p className="text-xl font-medium text-center max-w-md text-balance">
        {variant.prompt}
      </p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      {variant.combinationPicker && variant.context && (
        <p className="w-full text-sm text-center text-foreground/90 bg-[color:var(--blue-soft)]/60 border border-[color:var(--blue-base)]/30 rounded-lg px-4 py-2.5 leading-snug">
          {variant.context}
        </p>
      )}

      {variant.combinationPicker && (
        <CombinationPicker {...variant.combinationPicker} locked={locked} />
      )}

      {variant.context && !variant.combinationPicker && (
        <p className="text-sm text-muted-foreground text-center max-w-md text-balance">
          {variant.context}
        </p>
      )}

      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={locked}
        placeholder={variant.placeholder}
        maxLength={variant.maxLength}
        autoFocus
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        aria-label="Your answer"
        className="!h-14 w-48 text-center font-mono text-xl tracking-[0.3em] uppercase"
      />
    </div>
  );
}
