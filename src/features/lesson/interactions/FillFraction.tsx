import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Die } from '@/components/illustrations/Die';
import type { FillFractionVariant } from '@/content/types';
import type { InteractionProps } from './InteractionProps';
import { useInteractionHint } from './useInteractionHint';
import { InteractionHint } from './InteractionHint';
import { MOTION } from '@/lib/motion';

const AFFORDANCE = 'Type your fraction. Tap Check when ready.';
const D6_FACES = [1, 2, 3, 4, 5, 6];

type Props = InteractionProps<FillFractionVariant>;

function coerceInt(raw: string): number | null {
  const stripped = raw.replace(/[^0-9]/g, '');
  if (stripped === '') return null;
  const n = parseInt(stripped, 10);
  return isNaN(n) ? null : Math.min(n, 999);
}

/** Interactive d6 reference that lets learners tap faces to mark them as "favorable". */
function DieContext({ locked }: { locked: boolean }) {
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set());

  function toggle(face: number) {
    if (locked) return;
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (next.has(face)) next.delete(face);
      else next.add(face);
      return next;
    });
  }

  const count = highlighted.size;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
        Tap the faces you want to count
      </p>
      <div className="flex gap-3">
        {D6_FACES.map((face) => {
          const isOn = highlighted.has(face);
          return (
            <motion.button
              key={face}
              type="button"
              onClick={() => toggle(face)}
              disabled={locked}
              aria-pressed={isOn}
              aria-label={`Face ${face}${isOn ? ', highlighted' : ''}`}
              className={`
                relative rounded-xl p-1 transition-colors select-none touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${
                  isOn
                    ? 'bg-[color:var(--green-soft)] ring-2 ring-[color:var(--success)]'
                    : 'bg-card ring-1 ring-border hover:ring-primary/50'
                }
                ${locked ? 'cursor-default opacity-60' : 'cursor-pointer'}
              `}
              style={{
                boxShadow: isOn
                  ? '0 2px 0 color-mix(in srgb, var(--success) 45%, transparent)'
                  : '0 3px 0 rgba(33,28,48,0.14), 0 1px 3px rgba(33,28,48,0.09)',
              }}
              whileTap={locked ? {} : { scale: 0.9, y: 2 }}
              transition={MOTION.pop}
            >
              <Die value={face} className="w-10 h-10" />
            </motion.button>
          );
        })}
      </div>
      {count > 0 && (
        <p className="text-sm font-semibold text-[color:var(--green-deep)] num">
          {count} face{count !== 1 ? 's' : ''} highlighted, favorable: {count} / 6
        </p>
      )}
    </div>
  );
}

export function FillFraction({ variant, feedbackState, onChange }: Props) {
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');
  const locked = feedbackState === 'correct';
  const [hintVisible, dismissHint] = useInteractionHint('fill-fraction');

  function handleNum(raw: string) {
    const coerced = coerceInt(raw);
    const display = coerced !== null ? String(coerced) : '';
    setNum(display);
    emit(coerced, coerceInt(den));
  }

  function handleDen(raw: string) {
    const coerced = coerceInt(raw);
    const display = coerced !== null ? String(coerced) : '';
    setDen(display);
    emit(coerceInt(num), coerced);
  }

  function emit(n: number | null, d: number | null) {
    if (n !== null && d !== null) {
      onChange({ numerator: n, denominator: d });
    } else {
      onChange(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-6">
      <p className="text-xl font-medium text-center">{variant.prompt}</p>
      {variant.context && (
        <p className="text-sm text-muted-foreground text-center max-w-md text-balance">
          {variant.context}
        </p>
      )}
      {hintVisible && <InteractionHint text={AFFORDANCE} onDismiss={dismissHint} />}
      {variant.showDieContext && <DieContext locked={locked} />}

      {/* Fraction input, with optional labels naming what each line counts. */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-0">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            value={num}
            onChange={(e) => handleNum(e.target.value)}
            disabled={locked}
            aria-label={variant.numeratorLabel ?? 'Numerator'}
            className="w-24 text-center text-2xl font-semibold h-14 border-b-0 rounded-b-none"
          />
          <div className="h-0.5 w-24 bg-foreground" role="presentation" />
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            value={den}
            onChange={(e) => handleDen(e.target.value)}
            disabled={locked}
            aria-label={variant.denominatorLabel ?? 'Denominator'}
            className="w-24 text-center text-2xl font-semibold h-14 border-t-0 rounded-t-none"
          />
        </div>

        {(variant.numeratorLabel || variant.denominatorLabel) && (
          <div
            className="flex flex-col justify-between self-stretch py-2 text-left text-xs leading-snug text-muted-foreground max-w-[9rem]"
            aria-hidden="true"
          >
            <span>{variant.numeratorLabel}</span>
            <span>{variant.denominatorLabel}</span>
          </div>
        )}
      </div>

      {/* Teaching caption that appears once the answer is correct. */}
      {locked && variant.afterNote && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION.slide}
          className="max-w-sm text-center text-sm font-medium text-foreground"
        >
          {variant.afterNote}
        </motion.p>
      )}
    </div>
  );
}
