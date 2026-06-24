import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

/**
 * Read-only reference grid used inside a hint. Deliberately NOT a set of
 * buttons — these cells can't be tapped or selected, so the learner never
 * confuses them with a live interactive grid. Highlights use amber to stay
 * visually distinct from the indigo selection on interactive surfaces.
 */
export function HintReferenceGrid({
  rows,
  cols,
  highlightCells,
}: {
  rows: number;
  cols: number;
  highlightCells: Array<[number, number]>;
}) {
  const highlighted = new Set(highlightCells.map(([r, c]) => `${r},${c}`));
  return (
    <div
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const key = `${r + 1},${c + 1}`;
          const isOn = highlighted.has(key);
          return (
            <div
              key={key}
              className={`flex h-7 w-7 items-center justify-center rounded-sm text-xs font-medium select-none
                ${
                  isOn
                    ? 'bg-amber-soft text-amber-deep ring-1 ring-[color:var(--amber-base)]'
                    : 'bg-muted text-muted-foreground'
                }`}
            >
              {r + 1 + (c + 1)}
            </div>
          );
        }),
      )}
    </div>
  );
}

/**
 * Opt-in, collapsed-by-default hint disclosure. Reaching for it is deliberate,
 * so its contents never read as something to tap by reflex. Shared by the
 * interactive grid and the multiple-choice comparison so the "hint" affordance
 * is consistent across the lesson.
 */
export function HintDisclosure({
  label = 'Need a hint?',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 bg-card hover:bg-muted/60 transition-colors text-sm font-medium"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[color:var(--amber-base)]" aria-hidden="true" />
          {label}
        </span>
        <span className="text-muted-foreground text-xs">{open ? 'Hide ▲' : 'Show ▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-center gap-3 border-t bg-muted/30 px-4 py-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
