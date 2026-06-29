import { Fragment, memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { GridEventVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { MOTION } from '@/lib/motion';
import { HintDisclosure, HintReferenceGrid } from './HintDisclosure';
import { DiceRoller } from './DiceRoller';

type Props = InteractionProps<GridEventVariant>;

// Memoized cell — only re-renders when its own selected/flash state changes
const GridCell = memo(function GridCell({
  row,
  col,
  label,
  isSelected,
  flashWrong,
  locked,
  onToggle,
}: {
  row: number;
  col: number;
  label: string;
  isSelected: boolean;
  flashWrong: boolean;
  locked: boolean;
  onToggle: (row: number, col: number) => void;
}) {
  const selectedStyle =
    isSelected && flashWrong
      ? 'bg-[color:var(--coral-soft)] text-[color:var(--coral-deep)] border-[color:var(--coral-base)]' // wrong flash
      : isSelected
        ? 'bg-primary text-primary-foreground border-primary' // correct
        : 'bg-card border-border text-muted-foreground hover:border-primary/40';

  return (
    <motion.button
      className={`
        flex items-center justify-center rounded border text-xs font-medium
        w-11 h-11 md:w-14 md:h-14 lg:w-16 lg:h-16
        touch-manipulation
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
        transition-colors
        ${selectedStyle}
        ${locked ? 'cursor-default' : 'cursor-pointer'}
      `}
      style={{ touchAction: 'manipulation' }}
      aria-pressed={isSelected}
      aria-label={`Cell ${row},${col}: ${label}`}
      onClick={() => !locked && onToggle(row, col)}
      whileTap={locked ? {} : { scale: 0.94 }}
      transition={MOTION.pop}
    >
      {label}
    </motion.button>
  );
});

export function GridEvent({ variant, feedbackState, wrongTick, onChange }: Props) {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [flashWrong, setFlashWrong] = useState(false);
  const locked = feedbackState === 'correct';

  // Keys of the correct cells, so the wrong-answer flash can be LOCALIZED to
  // only the incorrect selections (PRD §9.4 AC #5) — a correct cell the learner
  // also tapped stays indigo, only the genuinely-wrong taps flash rose.
  const correctKeys = useMemo(
    () => new Set(variant.correctCells.map(([r, c]) => `${r},${c}`)),
    [variant.correctCells],
  );

  // Re-flash on every wrong submission (keyed off wrongTick so it fires each time)
  useEffect(() => {
    if (feedbackState === 'wrong') {
      setFlashWrong(true);
      const timer = setTimeout(() => setFlashWrong(false), 600);
      return () => clearTimeout(timer);
    }
  }, [wrongTick]); // intentional: only re-flash when a new wrong submission arrives

  const toggle = useCallback(
    (row: number, col: number) => {
      const key = `${row},${col}`;
      setSelectedCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        const cells = [...next].map((k) => k.split(',').map(Number) as [number, number]);
        onChange(cells.length > 0 ? { selectedCells: cells } : null);
        return next;
      });
    },
    [onChange],
  );

  const count = selectedCells.size;
  const counterText = variant.liveCounterTemplate.replace('{count}', String(count));

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {variant.simulationEnabled && <DiceRoller />}

      {/* Annotated grid: "Die 1" labels the rows (left side), "Die 2" labels
          the columns (top), with face numbers 1–N along each axis so a learner
          can read any cell's roll directly from the margins. Decorative; cells
          carry the canonical aria-label. */}
      <div className="overflow-x-auto w-full flex justify-center">
        <div className="inline-flex flex-col items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            aria-hidden="true"
          >
            Die 2
          </span>

          <div className="inline-flex items-center gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              aria-hidden="true"
            >
              Die 1
            </span>

            <div
              className="inline-grid gap-1"
              style={{ gridTemplateColumns: `auto repeat(${variant.cols}, minmax(0, 1fr))` }}
            >
              {/* Corner + column number track */}
              <span aria-hidden="true" />
              {Array.from({ length: variant.cols }, (_, c) => (
                <span
                  key={`ch-${c}`}
                  className="num text-center text-xs font-semibold text-muted-foreground"
                  aria-hidden="true"
                >
                  {c + 1}
                </span>
              ))}

              {/* Row number track + cells */}
              {Array.from({ length: variant.rows }, (_, r) => (
                <Fragment key={`row-${r}`}>
                  <span
                    className="num self-center pr-1 text-right text-xs font-semibold text-muted-foreground"
                    aria-hidden="true"
                  >
                    {r + 1}
                  </span>
                  {Array.from({ length: variant.cols }, (_, c) => {
                    const row = r + 1;
                    const col = c + 1;
                    const key = `${row},${col}`;
                    return (
                      <GridCell
                        key={key}
                        row={row}
                        col={col}
                        label={`${row}+${col}`}
                        isSelected={selectedCells.has(key)}
                        flashWrong={flashWrong && selectedCells.has(key) && !correctKeys.has(key)}
                        locked={locked}
                        onToggle={toggle}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live counter */}
      <p className="text-sm font-semibold text-primary tabular-nums" aria-live="polite">
        {counterText}
      </p>

      {/* Opt-in comparison hint (read-only reference grid, amber, can't be tapped) */}
      {variant.hint && (
        <HintDisclosure>
          <HintReferenceGrid rows={6} cols={6} highlightCells={variant.hint.highlightCells} />
          <p className="max-w-xs text-center text-xs text-muted-foreground">{variant.hint.label}</p>
        </HintDisclosure>
      )}
    </div>
  );
}
