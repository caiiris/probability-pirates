import { LineChart } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLearnerModel } from '@/features/learner/useLearnerModel';
import { StrengthsPanel } from '@/features/learner/StrengthsPanel';

/**
 * Progress page — WP-7 unlock.
 *
 * Reads the learner model for the authenticated user and passes it directly
 * to StrengthsPanel, which handles loading, empty, and data states.
 */
export function ProgressPage() {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : null;
  const { model, loading } = useLearnerModel(uid);

  return (
    <div className="min-h-full bg-white">
      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <LineChart className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Progress insights</h1>
            <p className="text-sm text-muted-foreground">Your strengths and growth areas</p>
          </div>
        </div>

        <StrengthsPanel model={model} loading={loading} />
      </div>
    </div>
  );
}
