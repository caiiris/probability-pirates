import { useState } from 'react';
import { motion } from 'framer-motion';
import { Die } from '@/components/illustrations/Die';
import { Coin } from '@/components/illustrations/Coin';
import type { TapOutcomesVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';

const AFFORDANCE = 'Tap to collect. Tap again to remove.';

type Props = InteractionProps<TapOutcomesVariant>;

export function TapOutcomes({ variant, feedbackState, onChange }: Props) {
  const [collected, setCollected] = useState<string[]>([]);
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('tap-outcomes');

  function handleTap(face: string) {
    if (locked) return;
    setCollected((prev) => {
      let next: string[];
      if (prev.includes(face)) {
        next = prev.filter((f) => f !== face);
      } else {
        next = [...prev, face];
      }
      onChange(next.length > 0 ? { collected: next } : null);
      return next;
    });
  }

  const outcomes =
    variant.source === 'd6'
      ? ['1', '2', '3', '4', '5', '6']
      : variant.source === 'coin'
        ? ['H', 'T']
        : variant.expectedOutcomes;

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>

      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      {/* Tappable faces */}
      <div className="flex flex-wrap justify-center gap-4">
        {outcomes.map((face) => {
          const isCollected = collected.includes(face);
          const isDie = variant.source === 'd6';
          return (
            <motion.button
              key={face}
              className={`
                relative flex items-center justify-center rounded-2xl
                transition-colors select-none touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${isDie ? 'w-16 h-16 md:w-20 md:h-20 p-1' : 'w-14 h-14 md:w-16 md:h-16'}
                ${
                  isCollected
                    ? 'bg-primary/15 ring-2 ring-primary'
                    : 'bg-card ring-1 ring-border hover:ring-primary/50'
                }
                ${locked ? 'cursor-default opacity-70' : 'cursor-pointer'}
              `}
              style={
                !locked
                  ? {
                      boxShadow: isCollected
                        ? '0 2px 0 color-mix(in srgb, var(--primary) 45%, transparent)'
                        : '0 3px 0 rgba(33,28,48,0.14), 0 1px 3px rgba(33,28,48,0.10)',
                    }
                  : undefined
              }
              onClick={() => handleTap(face)}
              disabled={locked}
              aria-pressed={isCollected}
              aria-label={`Face ${face}${isCollected ? ', selected' : ''}`}
              whileTap={locked ? {} : { scale: 0.91, y: 2 }}
              transition={MOTION.pop}
            >
              {isDie ? (
                <Die value={parseInt(face)} className="w-full h-full drop-shadow-sm" />
              ) : variant.source === 'coin' ? (
                <Coin side={face as 'H' | 'T'} className="w-9 h-9 md:w-11 md:h-11" />
              ) : (
                <span className="text-xl font-bold">{face}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Collected row */}
      {collected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {collected.map((face) => (
            <span
              key={face}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
            >
              {face}
            </span>
          ))}
        </div>
      )}

      {/* Teaching caption that appears once the answer is correct. */}
      {locked && variant.afterNote && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.slide}
          className="max-w-xs text-center text-sm font-medium text-foreground"
        >
          {variant.afterNote}
        </motion.p>
      )}
    </div>
  );
}
