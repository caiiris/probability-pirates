import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CircleBuilderFigure as Variant } from '@/content/types';
import { MOTION } from '@/lib/motion';

/**
 * Interactive circular-seating builder. The learner picks how many pirates
 * sit around a round table (n ∈ {2, 3, 4}), taps them into the seats, and
 * logs distinct seatings. Two seatings that differ only by a rotation are
 * recognized as the same circle, so the running count lands on (n − 1)!.
 *
 * Not graded, no XP, no blocking — same contract as the other pickers. The
 * point is to discover the (n − 1)! pattern by hand before the next page
 * names it.
 */
type Props = Variant;

type Pirate = { id: number; name: string; base: string; ring: string };

const PIRATES: Pirate[] = [
  { id: 0, name: 'Red', base: '#E25555', ring: '#A93030' },
  { id: 1, name: 'Blue', base: '#4E83E5', ring: '#22458C' },
  { id: 2, name: 'Green', base: '#3DA66B', ring: '#1F6A41' },
  { id: 3, name: 'Gold', base: '#D9A126', ring: '#9C6F12' },
];

const N_CHOICES = [2, 3, 4] as const;

function factorial(k: number): number {
  let acc = 1;
  for (let i = 2; i <= k; i++) acc *= i;
  return acc;
}

/**
 * Rotate a seat sequence to a canonical reading that starts at the lowest
 * pirate id. Two seatings are the same circle iff their canonical readings
 * match. Rotations collapse; reflections do NOT (clockwise and counter-
 * clockwise are different seatings, which is what (n − 1)! counts).
 */
function canonical(seq: number[]): string {
  const start = seq.indexOf(Math.min(...seq));
  return [...seq.slice(start), ...seq.slice(0, start)].join('-');
}

const BOX = 200;
const RADIUS = 70;
const CENTER = BOX / 2;

export function CircleBuilderFigure({ caption }: Props) {
  const [n, setN] = useState(3);
  const [seats, setSeats] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [note, setNote] = useState<string | null>(null);

  const target = factorial(n - 1);
  const full = seats.length === n;
  const pool = PIRATES.slice(0, n);
  const allFound = found.size >= target;

  function chooseN(next: number) {
    setN(next);
    setSeats([]);
    setFound(new Set());
    setNote(null);
  }

  function place(id: number) {
    if (full || seats.includes(id)) return;
    setNote(null);
    setSeats((prev) => [...prev, id]);
  }

  function logSeating() {
    if (!full) return;
    const key = canonical(seats);
    if (found.has(key)) {
      setNote('That is the same circle as one you already have, just spun around.');
    } else {
      setFound((prev) => new Set(prev).add(key));
      setNote(null);
    }
    setSeats([]);
  }

  function clear() {
    setSeats([]);
    setNote(null);
  }

  // Seat coordinates: seat 0 at the top, going clockwise.
  const seatPos = (i: number) => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
  };

  const nameOf = (id: number) => PIRATES[id].name;
  const reading = (key: string) =>
    key
      .split('-')
      .map((s) => nameOf(Number(s)))
      .join(' → ');

  return (
    <figure className="space-y-3">
      <div
        className="rounded-xl border bg-muted/30 px-4 py-4 space-y-4"
        role="group"
        aria-label="Seat the pirates around a round table"
      >
        {/* How many pirates */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Pirates:</span>
          {N_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => chooseN(choice)}
              aria-pressed={n === choice}
              className={`h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                n === choice
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:border-primary/40'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>

        {/* Round table with seats */}
        <div className="mx-auto" style={{ width: BOX, height: BOX, position: 'relative' }}>
          {/* table */}
          <div
            className="absolute rounded-full bg-[color:var(--amber-soft)]/50 border-2 border-[color:var(--amber-base)]/30"
            style={{
              left: CENTER - RADIUS + 14,
              top: CENTER - RADIUS + 14,
              width: (RADIUS - 14) * 2,
              height: (RADIUS - 14) * 2,
            }}
          />
          {Array.from({ length: n }).map((_, i) => {
            const { x, y } = seatPos(i);
            const id = seats[i];
            const pirate = id !== undefined ? PIRATES[id] : null;
            return (
              <div
                key={i}
                className="absolute flex h-11 w-11 items-center justify-center rounded-full border-2 text-[11px] font-semibold"
                style={
                  pirate
                    ? {
                        left: x - 22,
                        top: y - 22,
                        borderColor: pirate.ring,
                        backgroundColor: `${pirate.base}22`,
                        color: pirate.ring,
                      }
                    : {
                        left: x - 22,
                        top: y - 22,
                        borderStyle: 'dashed',
                        borderColor: 'rgb(214, 211, 209)',
                        color: 'rgb(168, 162, 158)',
                      }
                }
              >
                {pirate ? pirate.name : `seat ${i + 1}`}
              </div>
            );
          })}
        </div>

        {/* Pirate chips to seat (in the order tapped, clockwise from the top) */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {pool.map((p) => {
            const used = seats.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => place(p.id)}
                disabled={used || full}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-opacity ${
                  used || full ? 'opacity-30 cursor-default' : 'cursor-pointer hover:opacity-90'
                }`}
                style={{ backgroundColor: `${p.base}22`, color: p.ring }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2">
          <motion.button
            type="button"
            onClick={logSeating}
            disabled={!full}
            whileTap={full ? { scale: 0.97 } : {}}
            transition={MOTION.pop}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              full
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-default'
            }`}
          >
            Log this seating
          </motion.button>
          {seats.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {note && <p className="text-center text-xs text-[color:var(--amber-deep)]">{note}</p>}

        {/* Found seatings */}
        <div className="rounded-lg bg-card/70 border border-border/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Different seatings found
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {found.size} of {target}
            {allFound && found.size > 0 && (
              <span className="text-[color:var(--green-deep)]"> — that is ({n} − 1)!</span>
            )}
          </p>
          <AnimatePresence>
            {found.size > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 flex flex-wrap gap-1.5"
              >
                {[...found].map((key) => (
                  <li
                    key={key}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-foreground/90"
                  >
                    {reading(key)}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
