import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SubsetPickerFigure as Variant } from '@/content/types';

/**
 * Playful subset picker. Three colored balls (red, blue, green); the
 * learner taps each one to add it to or remove it from a subset. The
 * subset is shown beneath the row, in curly-brace notation, so the
 * mapping from "ball I tapped" to "item in a set" is right there on
 * screen.
 *
 * Pedagogical goal: by the time the learner gets to the formal
 * `define-event` slot ("an event is a subset of the sample space"),
 * they have already formed half a dozen subsets by hand on this slot.
 * The word "subset" stops being a vocabulary fact and starts being a
 * thing they have done.
 *
 * Not a graded interaction. Continue is always available; no XP, no
 * correctness, no blocking. The empty set is a valid subset, and so is
 * the full set — the picker accepts every state so neither becomes a
 * gotcha later.
 */
type Props = Variant;

type Ball = {
  id: 'red' | 'blue' | 'green';
  label: string;
  // CSS color (referenced via inline style so we don't pull these into
  // the design tokens). All three are dialed back from pure RGB so they
  // sit on the lesson's cream/card background without screaming.
  base: string;
  // Slightly darker shade used for the ring when the ball is selected,
  // and for the bullet next to the label in the subset readout.
  ring: string;
};

const BALLS: Ball[] = [
  { id: 'red', label: 'red', base: '#E25555', ring: '#A93030' },
  { id: 'blue', label: 'blue', base: '#4E83E5', ring: '#22458C' },
  { id: 'green', label: 'green', base: '#3DA66B', ring: '#1F6A41' },
];

export function SubsetPickerFigure({ caption }: Props) {
  const [selected, setSelected] = useState<Set<Ball['id']>>(() => new Set());

  const toggle = (id: Ball['id']) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // Preserve the canonical BALLS order so the subset reads "red, blue"
  // instead of in tap order. Sets are unordered, but reading order should
  // not be tap-order-dependent — that would teach the wrong thing.
  const chosen = BALLS.filter((b) => selected.has(b.id));
  const subsetText =
    chosen.length === 0 ? '{ }' : `{${chosen.map((b) => b.label).join(', ')}}`;

  return (
    <figure className="space-y-3">
      <div
        className="rounded-xl border bg-muted/30 px-4 py-5 space-y-4"
        role="group"
        aria-label="Pick a subset of red, blue, and green"
      >
        <p className="text-center text-xs text-muted-foreground">
          Tap a ball to add or remove it. The subset is whatever you have picked.
        </p>

        <div className="flex items-center justify-center gap-6">
          {BALLS.map((ball) => {
            const isOn = selected.has(ball.id);
            return (
              <button
                key={ball.id}
                type="button"
                onClick={() => toggle(ball.id)}
                aria-pressed={isOn}
                aria-label={`${ball.label} ball, ${isOn ? 'in subset' : 'not in subset'}`}
                className="flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg"
              >
                <motion.span
                  initial={false}
                  animate={{
                    scale: isOn ? 1.08 : 1,
                    y: isOn ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="block h-14 w-14 rounded-full shadow-md"
                  style={{
                    backgroundColor: ball.base,
                    boxShadow: isOn
                      ? `0 0 0 4px ${ball.ring}33, 0 6px 14px ${ball.ring}55`
                      : `0 3px 6px rgba(0,0,0,0.18)`,
                  }}
                />
                <span
                  className="text-[11px] font-medium uppercase tracking-wide"
                  style={{ color: isOn ? ball.ring : 'rgb(120, 113, 108)' }}
                >
                  {ball.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg bg-card/70 border border-border/60 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Your subset
          </p>
          <p className="mt-0.5 font-mono text-base text-foreground">{subsetText}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {chosen.length === 0
              ? 'The empty set. Still a valid subset.'
              : chosen.length === BALLS.length
                ? 'You picked every ball. That is the whole set as a subset.'
                : `Size ${chosen.length}.`}
          </p>
        </div>
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
