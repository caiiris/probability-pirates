import { motion } from 'framer-motion';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';
import { MOTION } from '@/lib/motion';
import type { WrapSlot } from '@/content/types';

type Props = { slot: WrapSlot };

export function WrapSlotView({ slot }: Props) {
  // Vertically centered for short wrap-ups (`my-auto`); long ones collapse the
  // auto-margins and scroll from the top. Centered horizontally to match the
  // concept slots' visual rhythm.
  return (
    <div className="min-h-full flex flex-col">
      <div className="my-auto flex flex-col gap-6 px-4 py-8 max-w-md mx-auto w-full">
        <h2 className="text-2xl font-bold leading-tight text-center">{slot.title}</h2>
        <div className="space-y-3">
          {slot.body.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="text-base text-muted-foreground leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {slot.mascotLine && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={MOTION.pop}
            className="mx-auto flex items-center gap-3 rounded-2xl border bg-[color:var(--primary-soft)]/50 px-4 py-3 text-left"
          >
            <CaptainMascot className="h-12 w-12 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Captain Pascal
              </p>
              <p className="text-sm text-foreground/90">{slot.mascotLine}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
