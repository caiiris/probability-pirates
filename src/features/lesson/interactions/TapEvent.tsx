import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TapEventVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';

const AFFORDANCE = 'Tap to mark. Tap again to unmark.';

type Props = InteractionProps<TapEventVariant>;

export function TapEvent({ variant, feedbackState, wrongTick, onChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [flashWrong, setFlashWrong] = useState(false);
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('tap-event');

  // Localized wrong feedback (PRD §9.4 AC #5): on a wrong submission, flash only
  // the INCORRECT selections rose; correct selections stay indigo. Keyed off
  // wrongTick so it replays on every wrong Check.
  const correctSet = useMemo(() => new Set(variant.correctOutcomes), [variant.correctOutcomes]);
  useEffect(() => {
    if (feedbackState === 'wrong') {
      setFlashWrong(true);
      const timer = setTimeout(() => setFlashWrong(false), 600);
      return () => clearTimeout(timer);
    }
  }, [wrongTick]); // re-flash only when a new wrong submission arrives

  function toggle(outcome: string) {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(outcome)) {
        next.delete(outcome);
      } else {
        next.add(outcome);
      }
      onChange(next.size > 0 ? { selected: [...next] } : null);
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      <div className="flex flex-wrap justify-center gap-3">
        {variant.sampleSpace.map((outcome) => {
          const isSelected = selected.has(outcome);
          const isRed = outcome === '♥' || outcome === '♦';
          const isWrongSelected = flashWrong && isSelected && !correctSet.has(outcome);

          return (
            <motion.button
              key={outcome}
              animate={isWrongSelected ? { x: [0, -4, 4, -3, 3, 0] } : undefined}
              transition={isWrongSelected ? { duration: 0.4 } : MOTION.pop}
              className={`
                min-w-[44px] min-h-[44px] md:min-w-[56px] md:min-h-[56px]
                px-4 py-2 rounded-xl border-2 font-semibold text-lg
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${
                  isWrongSelected
                    ? 'border-[color:var(--coral-base)] bg-[color:var(--coral-soft)] text-[color:var(--coral-deep)]'
                    : isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : isRed
                        ? 'border-border bg-card text-[color:var(--coral-base)] hover:border-[color:var(--coral-base)]/40'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                }
                ${locked ? 'cursor-default' : 'cursor-pointer'}
              `}
              aria-pressed={isSelected}
              aria-label={outcome}
              onClick={() => toggle(outcome)}
              disabled={locked}
              whileTap={locked ? {} : { scale: 0.94 }}
            >
              {outcome}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
