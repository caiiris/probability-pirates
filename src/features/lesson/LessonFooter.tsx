import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedbackState } from './useSlotState';
import { SHAKE_KEYFRAMES, MOTION } from '@/lib/motion';
import { haptic } from '@/lib/haptics';

type Props = {
  slotKind: 'concept' | 'problem' | 'wrap';
  feedbackState: FeedbackState;
  wrongTick: number;
  feedbackCorrectText?: string;
  feedbackWrongText?: string;
  explanationText?: string;
  explanationRevealed?: boolean;
  isReady: boolean;
  isSubmitting: boolean;
  onCheck: () => void;
  onContinue: () => void;
};

export function LessonFooter({
  slotKind,
  feedbackState,
  wrongTick,
  feedbackCorrectText,
  feedbackWrongText,
  explanationText,
  explanationRevealed,
  isReady,
  isSubmitting,
  onCheck,
  onContinue,
}: Props) {
  const showCheck = slotKind === 'problem' && feedbackState !== 'correct';
  const showContinue = slotKind !== 'problem' || feedbackState === 'correct';

  // Haptic punctuation on Android; a no-op everywhere else (see lib/haptics).
  useEffect(() => {
    if (feedbackState === 'correct') haptic('correct');
  }, [feedbackState]);
  useEffect(() => {
    if (wrongTick > 0) haptic('wrong');
  }, [wrongTick]);

  // The whole tray floods with a soft success/error wash so the result reads at
  // a glance, not just from the small icon + text.
  const flood =
    feedbackState === 'correct'
      ? 'border-[color:var(--green-base)]/40 bg-[color:var(--green-soft)]/60'
      : feedbackState === 'wrong'
        ? 'border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/50'
        : 'border-border bg-background';

  return (
    <div
      className={`shrink-0 border-t px-4 py-4 space-y-3 transition-colors duration-200 ${flood}`}
    >
      {/* Feedback area */}
      <AnimatePresence mode="wait">
        {feedbackState === 'correct' && feedbackCorrectText && (
          <motion.div
            key="correct"
            className="flex items-start gap-2 text-sm font-medium text-[color:var(--green-deep)]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
          >
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={MOTION.pop}
              className="mt-0.5 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.span>
            <span>{feedbackCorrectText}</span>
          </motion.div>
        )}

        {feedbackState === 'wrong' && feedbackWrongText && (
          <motion.div
            key={`wrong-${wrongTick}`}
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alert"
            aria-live="assertive"
          >
            <motion.p
              className="text-sm font-medium text-[color:var(--coral-deep)]"
              animate={SHAKE_KEYFRAMES}
            >
              {feedbackWrongText}
            </motion.p>
            {explanationRevealed && explanationText && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <p className="text-xs font-medium uppercase tracking-wide mb-1">Still stuck? Here's the idea.</p>
                <p>{explanationText}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA button */}
      {showCheck && (
        <Button
          size="lg"
          className="w-full"
          disabled={!isReady || isSubmitting}
          onClick={onCheck}
        >
          Check
        </Button>
      )}
      {showContinue && (
        <Button
          size="lg"
          className="w-full"
          disabled={isSubmitting}
          onClick={onContinue}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
