import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CombinationPickerConfig } from '@/content/types';
import { MOTION } from '@/lib/motion';

type Props = CombinationPickerConfig & {
  locked: boolean;
};

function pairKey(a: number, b: number): string {
  return `${a}:${b}`;
}

/**
 * Exploratory two-stage picker for multiplication-principle discovery.
 * The learner picks one option from each stage and registers the pair;
 * duplicates are rejected. A running list and count make the product
 * visible without stating the formula. Does not affect grading.
 */
export function CombinationPicker({
  stageALabel,
  stageAOptions,
  stageBLabel,
  stageBOptions,
  addButtonLabel = 'Add this combination',
  locked,
}: Props) {
  const [aIdx, setAIdx] = useState<number | null>(null);
  const [bIdx, setBIdx] = useState<number | null>(null);
  const [found, setFound] = useState<Set<string>>(() => new Set());

  const canAdd = aIdx !== null && bIdx !== null && !locked;

  function register() {
    if (!canAdd || aIdx === null || bIdx === null) return;
    const key = pairKey(aIdx, bIdx);
    if (found.has(key)) {
      setAIdx(null);
      setBIdx(null);
      return;
    }
    setFound((prev) => new Set(prev).add(key));
    setAIdx(null);
    setBIdx(null);
  }

  return (
    <div className="w-full rounded-xl border bg-muted/40 px-4 py-4 space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {stageALabel}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {stageAOptions.map((label, i) => {
            const on = aIdx === i;
            return (
              <button
                key={label}
                type="button"
                disabled={locked}
                aria-pressed={on}
                onClick={() => setAIdx(on ? null : i)}
                className={`rounded-lg px-3 py-2 text-sm font-medium border-2 transition-colors ${
                  on
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-card hover:border-primary/40'
                } ${locked ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {stageBLabel}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {stageBOptions.map((label, i) => {
            const on = bIdx === i;
            return (
              <button
                key={label}
                type="button"
                disabled={locked}
                aria-pressed={on}
                onClick={() => setBIdx(on ? null : i)}
                className={`rounded-lg px-3 py-2 text-sm font-medium border-2 transition-colors ${
                  on
                    ? 'border-[color:var(--green-base)] bg-[color:var(--green-soft)] text-[color:var(--green-deep)]'
                    : 'border-border bg-card hover:border-[color:var(--green-base)]/50'
                } ${locked ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.button
        type="button"
        disabled={!canAdd}
        onClick={register}
        className={`mx-auto block rounded-lg px-4 py-2 text-sm font-semibold ${
          canAdd
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'bg-muted text-muted-foreground cursor-default'
        }`}
        whileTap={canAdd ? { scale: 0.97 } : {}}
        transition={MOTION.pop}
      >
        {addButtonLabel}
      </motion.button>

      <div className="rounded-lg bg-card/80 border border-border/60 px-3 py-2.5 min-h-[3.5rem]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Combinations you listed
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {found.size} {found.size === 1 ? 'combination' : 'combinations'}
        </p>
        <AnimatePresence>
          {found.size > 0 && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {[...found].map((key) => {
                const [ai, bi] = key.split(':').map(Number);
                return (
                  <li
                    key={key}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-foreground/90"
                  >
                    {stageAOptions[ai]} + {stageBOptions[bi]}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
