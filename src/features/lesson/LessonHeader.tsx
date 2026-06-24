import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FlameIcon, BoltIcon } from '@/components/icons/StatIcons';

type Props = {
  slotIndex: number;
  totalSlots: number;
  currentStreak: number;
  currentXp: number;
  canGoBack: boolean;
  onBack: () => void;
  canGoForward: boolean;
  onForward: () => void;
};

export function LessonHeader({ slotIndex, totalSlots, currentStreak, currentXp, canGoBack, onBack, canGoForward, onForward }: Props) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <header className="flex items-center gap-1 px-4 h-14 border-b bg-background/95 backdrop-blur shrink-0">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Leave lesson"
          onClick={() => setConfirmOpen(true)}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Go to previous step"
          onClick={onBack}
          disabled={!canGoBack}
          style={{ opacity: canGoBack ? 1 : 0, pointerEvents: canGoBack ? 'auto' : 'none' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Forward button — visible only when reviewing past slots */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Go to next step"
          onClick={onForward}
          disabled={!canGoForward}
          style={{ opacity: canGoForward ? 1 : 0, pointerEvents: canGoForward ? 'auto' : 'none' }}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Progress — one pip per step; the current step counts as filled so the
            bar reaches 100% on the final step. */}
        <StepProgress total={totalSlots} currentIndex={slotIndex} />

        {/* XP chip — running total. Plain Inter (single counter, not data the
            user compares; the live tally during a lesson reads as motivation). */}
        <span
          className="flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full bg-card border border-border shrink-0"
          aria-label={`${currentXp} XP`}
        >
          <BoltIcon className="w-4 h-4" />
          {currentXp.toLocaleString()}
        </span>

        {/* Streak chip — only shown once the learner has a streak (matches
            AppHeader's policy of not surfacing dead 0-day pills). */}
        {currentStreak > 0 && (
          <span
            className="flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full bg-card border border-border shrink-0"
            aria-label={`${currentStreak} day streak`}
          >
            <FlameIcon className="w-4 h-4" />
            {currentStreak}
          </span>
        )}
      </header>

      {/* Confirm leave dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave lesson?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your progress is saved. You can pick up where you left off.
          </p>
          <DialogFooter className="flex gap-2">
            {/* Leaving is harmless (progress is saved), so it's a calm secondary
                action — not destructive-red. Staying is the emphasized default. */}
            <Button variant="ghost" onClick={() => navigate('/')}>
              Leave
            </Button>
            <Button onClick={() => setConfirmOpen(false)}>Keep going</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Segmented step progress: one pip per slot. Completed and current steps fill
 * (so the final step shows a full bar); upcoming steps stay muted. Each pip
 * fills with a short spring as the learner advances.
 */
function StepProgress({ total, currentIndex }: { total: number; currentIndex: number }) {
  const safeTotal = Math.max(total, 1);
  const filled = Math.min(currentIndex + 1, safeTotal);

  return (
    <div
      className="flex flex-1 items-center gap-1"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={filled}
      aria-label={`Step ${filled} of ${safeTotal}`}
    >
      {Array.from({ length: safeTotal }, (_, i) => (
        <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.span
            className="block h-full origin-left rounded-full bg-primary"
            initial={false}
            animate={{ scaleX: i <= currentIndex ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </span>
      ))}
    </div>
  );
}
