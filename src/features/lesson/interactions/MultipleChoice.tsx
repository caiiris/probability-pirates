import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MultipleChoiceVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';
import { HintDisclosure, HintReferenceGrid } from './HintDisclosure';
import { DiceRoller } from './DiceRoller';

const AFFORDANCE = 'Tap your choice. You can change it before tapping Check.';

type Props = InteractionProps<MultipleChoiceVariant>;

export function MultipleChoice({ variant, feedbackState, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('multiple-choice');
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(id: string) {
    if (locked) return;
    setSelectedId(id);
    onChange({ optionId: id });
  }

  // Arrow-key navigation for the radio group: moving focus also moves the
  // selection (standard radio behavior), wrapping at the ends.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (locked) return;
    const isNext = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const isPrev = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    if (!isNext && !isPrev) return;
    e.preventDefault();
    const n = variant.options.length;
    const current = variant.options.findIndex((o) => o.id === selectedId);
    const base = current >= 0 ? current : 0;
    const nextIndex = (base + (isNext ? 1 : -1) + n) % n;
    select(variant.options[nextIndex].id);
    optionRefs.current[nextIndex]?.focus();
  }

  const grid = variant.gridReference;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 max-w-sm mx-auto w-full">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}

      {(variant.context || grid || variant.showDiceRoller) && (
        <div className="flex flex-col items-center gap-3">
          {variant.context && (
            <p className="w-full text-sm text-muted-foreground text-center bg-muted rounded-lg px-4 py-2.5">
              {variant.context}
            </p>
          )}
          {variant.showDiceRoller && <DiceRoller />}
          {grid && (
            <HintDisclosure>
              <HintReferenceGrid
                rows={grid.rows}
                cols={grid.cols}
                highlightCells={grid.highlightCells ?? []}
              />
              {grid.label && (
                <p className="text-xs text-muted-foreground font-medium text-center">{grid.label}</p>
              )}
              <p className="text-xs text-muted-foreground tabular-nums">
                {(grid.highlightCells?.length ?? 0)} / {grid.rows * grid.cols} cells
              </p>
            </HintDisclosure>
          )}
        </div>
      )}

      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label={variant.prompt}
        onKeyDown={handleKeyDown}
      >
        {variant.options.map((option, i) => {
          const isSelected = selectedId === option.id;
          // Roving tabindex: only the selected option is tabbable (or the first
          // option when nothing is selected yet), so Tab lands on the group once
          // and arrows move within it.
          const tabbable = isSelected || (selectedId === null && i === 0);

          return (
            <motion.button
              key={option.id}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              type="button"
              className={`
                w-full px-5 py-4 rounded-xl border-2 text-left
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40'
                }
                ${locked ? 'cursor-default' : 'cursor-pointer'}
              `}
              role="radio"
              aria-checked={isSelected}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => select(option.id)}
              disabled={locked}
              whileTap={locked ? {} : { scale: 0.98 }}
              transition={MOTION.pop}
            >
              <span className={`font-medium text-base block ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {option.label}
              </span>
              {option.subtext && (
                <span className={`text-xs mt-0.5 block ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>
                  {option.subtext}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
