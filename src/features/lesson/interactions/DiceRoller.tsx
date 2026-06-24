import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';
import { Die } from '@/components/illustrations/Die';

/**
 * Animated "Roll the dice!" roller: tumbles two dice through a few quick frames,
 * then settles and shows the sum. Pure play, no answer state. Reused by the
 * grid interaction and by Captain Pascal's two-dice challenge.
 */
export function DiceRoller() {
  const [roll, setRoll] = useState<{ d1: number; d2: number; key: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const tickRef = useRef(0);

  function handleRoll() {
    if (rolling) return;
    setRolling(true);
    const tick = ++tickRef.current;

    // Brief "tumbling" phase — swap faces quickly then settle
    let ticks = 0;
    const interval = setInterval(() => {
      setRoll({
        d1: Math.ceil(Math.random() * 6),
        d2: Math.ceil(Math.random() * 6),
        key: tick * 100 + ticks,
      });
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        setRolling(false);
      }
    }, 80);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleRoll}
        disabled={rolling}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 select-none"
      >
        <Dices className="w-4 h-4" aria-hidden="true" />
        Roll the dice!
      </button>

      <AnimatePresence mode="wait">
        {roll && (
          <motion.div
            key={roll.key}
            className="flex items-center gap-3"
            initial={{ opacity: 0.6, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.08 }}
          >
            <Die value={roll.d1} className="w-12 h-12 drop-shadow-md" />
            <span className="text-lg font-bold text-muted-foreground">+</span>
            <Die value={roll.d2} className="w-12 h-12 drop-shadow-md" />
            {!rolling && (
              <span className="ml-2 text-base font-semibold text-primary">
                = {roll.d1 + roll.d2}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
