import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import type { MultiplyStepsVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';

const AFFORDANCE = 'Answer each step. Your numbers multiply together as you go.';

type Props = InteractionProps<MultiplyStepsVariant>;

/**
 * Guided "multiply it down" input. The learner answers one sub-question per
 * factor; each correct number locks in and joins a running product, until
 * the full expression and its result are revealed. See the type doc in
 * `content/types.ts` for the pedagogical rationale.
 */
export function MultiplySteps({ variant, feedbackState, onChange }: Props) {
  const [locked, setLocked] = useState<number[]>([]);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hintVisible, dismissHint] = useInteractionHint('multiply-steps');

  const stepIndex = locked.length;
  const complete = stepIndex >= variant.steps.length;
  const slotLocked = feedbackState === 'correct';
  const product = locked.reduce((acc, n) => acc * n, 1);
  const resultNoun = variant.resultNoun ?? 'in all';

  // Report the built product once every step is filled correctly; null
  // otherwise so Continue stays gated until the learner finishes.
  useEffect(() => {
    onChange(complete ? { value: product } : null);
  }, [complete, product, onChange]);

  function submitStep() {
    if (complete || slotLocked) return;
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    const n = Number(trimmed);
    const step = variant.steps[stepIndex];
    if (Number.isInteger(n) && n === step.answer) {
      setLocked((prev) => [...prev, n]);
      setValue('');
      setError(null);
    } else {
      setError(step.hint ?? 'Not quite. Count the choices for this spot and try again.');
      setValue('');
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6 max-w-md mx-auto w-full">
      <p className="text-xl font-medium text-center text-balance">{variant.prompt}</p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      {/* Running product. Each locked factor is a chip; the equals and result
          appear once every step is done. */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 min-h-[2.5rem]"
        aria-live="polite"
      >
        {locked.length === 0 && !complete && (
          <span className="text-sm text-muted-foreground">Your product builds here.</span>
        )}
        {locked.map((n, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">×</span>}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={MOTION.pop}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[color:var(--primary-soft)] px-2 font-mono text-lg font-semibold text-primary-deep"
            >
              {n}
            </motion.span>
          </span>
        ))}
        {complete && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="text-muted-foreground">=</span>
            <span className="font-mono text-primary">{product}</span>
            <span className="text-sm font-normal text-muted-foreground">{resultNoun}</span>
          </motion.span>
        )}
      </div>

      {/* Current step, or a done message. */}
      <AnimatePresence mode="wait">
        {!complete ? (
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex w-full flex-col items-center gap-3"
          >
            <p className="text-center text-base font-medium text-foreground">
              {variant.steps[stepIndex].prompt}
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitStep();
                  }
                }}
                disabled={slotLocked}
                placeholder="?"
                inputMode="numeric"
                autoFocus
                aria-label={`Answer for step ${stepIndex + 1}`}
                className="!h-12 w-20 text-center font-mono text-xl"
              />
              <motion.button
                type="button"
                onClick={submitStep}
                disabled={slotLocked || value.trim().length === 0}
                whileTap={{ scale: 0.97 }}
                transition={MOTION.pop}
                className={`h-12 rounded-lg px-4 text-sm font-semibold ${
                  value.trim().length === 0
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {stepIndex === 0 ? 'Start' : 'Multiply'}
              </motion.button>
            </div>
            {error && <p className="text-sm text-[color:var(--coral-deep)] text-center">{error}</p>}
          </motion.div>
        ) : (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground"
          >
            Every spot is filled. Tap Check to lock in {product} {resultNoun}.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
