import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coin } from '@/components/illustrations/Coin';
import type { TwoCoinsGridFigure as Variant } from '@/content/types';

/**
 * Autonomous looping animation that builds the sample space of two coin
 * flips into a 2x2 grid. The four pairs (HH, HT, TH, TT) appear one by
 * one, the full grid holds for a beat, then the cells clear and the loop
 * starts over. Pure observation (no learner input). Used in `sample-space`
 * to make the construction of a compound sample space visible without
 * naming the multiplication principle (that lands in Unit 2).
 *
 * Layout:
 *
 *                    second flip
 *                    H        T
 *   first flip  H  [HH]    [HT]
 *               T  [TH]    [TT]
 *
 * The row and column labels make it explicit that "HT" means "first
 * heads, then tails" — that order will matter in the next lesson when we
 * ask whether {0H, 1H, 2H} is a valid breakdown of these four outcomes.
 */
type Props = Variant;

const PAIRS: Array<{ first: 'H' | 'T'; second: 'H' | 'T'; label: string }> = [
  { first: 'H', second: 'H', label: 'HH' },
  { first: 'H', second: 'T', label: 'HT' },
  { first: 'T', second: 'H', label: 'TH' },
  { first: 'T', second: 'T', label: 'TT' },
];

const DEFAULT_STEP_MS = 900;
const DEFAULT_HOLD_MS = 1800;

export function TwoCoinsGridFigure({
  caption,
  stepMs = DEFAULT_STEP_MS,
  holdMs = DEFAULT_HOLD_MS,
}: Props) {
  // `filled` counts how many cells of the grid are currently shown. Cycles
  // 0 → 1 → 2 → 3 → 4 → (hold) → 0 → ...
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setFilled((prev) => {
        const next = prev >= PAIRS.length ? 0 : prev + 1;
        const delay = next === 0 || prev === PAIRS.length ? holdMs : stepMs;
        timer = setTimeout(tick, delay);
        return next;
      });
    };
    timer = setTimeout(tick, stepMs);
    return () => clearTimeout(timer);
  }, [stepMs, holdMs]);

  return (
    <figure className="space-y-3">
      <div
        className="rounded-xl border bg-muted/30 px-4 py-5"
        role="img"
        aria-label="Sample space for two coin flips: HH, HT, TH, TT"
      >
        <Grid filled={filled} />
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function Grid({ filled }: { filled: number }) {
  return (
    <div className="mx-auto grid w-full max-w-[20rem] grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-2">
      {/* Top-left corner is empty (axis labels meet here). */}
      <div aria-hidden="true" />

      {/* Column labels: "second flip = H" / "second flip = T" */}
      <ColumnLabel side="H" />
      <ColumnLabel side="T" />

      {/* Row labels live in the leftmost column. */}
      <RowLabel side="H" />
      <Cell pair={PAIRS[0]} visible={filled > 0} />
      <Cell pair={PAIRS[1]} visible={filled > 1} />

      <RowLabel side="T" />
      <Cell pair={PAIRS[2]} visible={filled > 2} />
      <Cell pair={PAIRS[3]} visible={filled > 3} />
    </div>
  );
}

function ColumnLabel({ side }: { side: 'H' | 'T' }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span>2nd flip</span>
      <span className="text-foreground text-sm">{side}</span>
    </div>
  );
}

function RowLabel({ side }: { side: 'H' | 'T' }) {
  return (
    <div className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <div className="flex flex-col items-center gap-0.5">
        <span>1st flip</span>
        <span className="text-foreground text-sm">{side}</span>
      </div>
    </div>
  );
}

function Cell({
  pair,
  visible,
}: {
  pair: (typeof PAIRS)[number];
  visible: boolean;
}) {
  return (
    <div className="relative aspect-[3/2] rounded-lg border border-dashed border-border/70 bg-card/40">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={pair.label}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            initial={{ opacity: 0, y: -14, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="flex gap-1.5 text-primary">
              <Coin side={pair.first} className="h-7 w-7" />
              <Coin side={pair.second} className="h-7 w-7" />
            </div>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground/80">
              {pair.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
