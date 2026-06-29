import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderBuilderFigure as Variant } from '@/content/types';
import { MOTION } from '@/lib/motion';

/**
 * Playful "build an order" picker for permutations. Three people (Ana, Ben,
 * Cleo); the learner taps them one at a time to fill three ordered spots,
 * then logs the arrangement. Distinct orders pile up toward 3! = 6, so the
 * count is discovered by hand before the formula names it.
 *
 * Same contract as SubsetPickerFigure: not graded, no XP, no blocking. The
 * point is the manipulative, that order matters (ABC is not ACB).
 */
type Props = Variant;

type Person = { id: 'A' | 'B' | 'C'; name: string; base: string; ring: string };

const PEOPLE: Person[] = [
  { id: 'A', name: 'Ana', base: '#E25555', ring: '#A93030' },
  { id: 'B', name: 'Ben', base: '#4E83E5', ring: '#22458C' },
  { id: 'C', name: 'Cleo', base: '#3DA66B', ring: '#1F6A41' },
];

const TOTAL_ORDERS = 6; // 3!

export function OrderBuilderFigure({ caption }: Props) {
  const [current, setCurrent] = useState<Person['id'][]>([]);
  const [found, setFound] = useState<Set<string>>(() => new Set());

  const complete = current.length === PEOPLE.length;

  function place(id: Person['id']) {
    if (current.includes(id) || complete) return;
    setCurrent((prev) => [...prev, id]);
  }

  function logOrder() {
    if (!complete) return;
    setFound((prev) => new Set(prev).add(current.join('')));
    setCurrent([]);
  }

  function clear() {
    setCurrent([]);
  }

  const allFound = found.size >= TOTAL_ORDERS;
  const nameOf = (id: Person['id']) => PEOPLE.find((p) => p.id === id)!.name;
  const orderText = (key: string) =>
    key
      .split('')
      .map((id) => nameOf(id as Person['id']))
      .join(' → ');

  return (
    <figure className="space-y-3">
      <div
        className="rounded-xl border bg-muted/30 px-4 py-5 space-y-4"
        role="group"
        aria-label="Build an order of Ana, Ben, and Cleo"
      >
        <p className="text-center text-xs text-muted-foreground">
          Tap the three friends in any order to line them up. Order matters: Ana then Ben is not the same as Ben then Ana.
        </p>

        {/* Name chips */}
        <div className="flex items-center justify-center gap-3">
          {PEOPLE.map((p) => {
            const used = current.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => place(p.id)}
                disabled={used || complete}
                aria-label={`Place ${p.name}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  used ? 'opacity-30 cursor-default' : 'cursor-pointer hover:opacity-90'
                }`}
                style={{ backgroundColor: `${p.base}22`, color: p.ring }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Ordered spots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => {
            const id = current[i];
            const person = id ? PEOPLE.find((p) => p.id === id)! : null;
            return (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="flex h-12 w-16 items-center justify-center rounded-lg border-2 border-dashed text-sm font-semibold"
                  style={
                    person
                      ? { borderColor: person.ring, backgroundColor: `${person.base}22`, color: person.ring }
                      : { borderColor: 'rgb(214, 211, 209)', color: 'rgb(168, 162, 158)' }
                  }
                >
                  {person ? person.name : i + 1}
                </div>
                {i < 2 && <span className="text-muted-foreground">→</span>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2">
          <motion.button
            type="button"
            onClick={logOrder}
            disabled={!complete}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              complete
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-default'
            }`}
            whileTap={complete ? { scale: 0.97 } : {}}
            transition={MOTION.pop}
          >
            Log this order
          </motion.button>
          {current.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Found orders */}
        <div className="rounded-lg bg-card/70 border border-border/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Orders you found
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {found.size} of {TOTAL_ORDERS}
            {allFound && (
              <span className="text-[color:var(--green-deep)]"> — that is 3 × 2 × 1</span>
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
                    {orderText(key)}
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
