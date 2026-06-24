import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackDialog } from '@/features/feedback/FeedbackDialog';

/**
 * Quiet site footer for chromed routes: attribution + copyright on the left, a
 * feedback entry point on the right. Sits below the routed page inside the
 * scroll area so it never overlaps the bottom nav on mobile.
 */
export function AppFooter() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border/60 px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>© {year} Probability Pirates · Made by Iris Cai</p>
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
          Send feedback
        </button>
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </footer>
  );
}
