/**
 * WagerExplainerDialog — self-contained "How does this work?" modal.
 *
 * Includes its own trigger so callers just render <WagerExplainerDialog />.
 * Copy lives here; keep it to ~80-120 words per spec §8.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export function WagerExplainerDialog() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-3 hover:text-foreground transition-colors"
          />
        }
      >
        How does this work?
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captain's Wager</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          One question every few days — same prompt for everyone. Enter your best numeric guess
          before you see any answers. We score it on a log scale: nail the order of magnitude and
          you score around 50; get it exact and you score 100; miss by 10× and you score 0. The
          true answer, a histogram of all guesses, and a short probability lesson reveal the
          moment you submit. You cannot change your answer once it's in — committing to a number,
          even a wrong one, is exactly how calibration training works.
        </p>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
