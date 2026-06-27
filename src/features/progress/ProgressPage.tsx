import { LineChart } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLearnerModel } from '@/features/learner/useLearnerModel';
import { StrengthsPanel } from '@/features/learner/StrengthsPanel';
import { summarizeByTopic } from '@/features/learner/topicSummary';
import type { Topic } from '@/content/skills';

const TOPIC_LABELS: Record<Topic, string> = {
  counting: 'Counting',
  'permutations-combinations': 'Permutations & Combinations',
  'inclusion-exclusion': 'Inclusion-Exclusion',
  'long-run': 'Long-run',
  complement: 'Complement',
  conditional: 'Conditional',
  distributions: 'Distributions',
};

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

  const topicSummary = model ? summarizeByTopic(model) : [];

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

        {topicSummary.length > 0 && (
          <section className="mt-8 space-y-2">
            <div>
              <h2 className="text-sm font-semibold leading-tight">By topic</h2>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Practice solved and accuracy across each category
              </p>
            </div>
            <ul className="divide-y divide-border/50 rounded-xl border bg-card/60 px-3">
              {topicSummary.map((s) => (
                <li key={s.topic} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {TOPIC_LABELS[s.topic]}
                  </span>
                  <span className="num shrink-0 text-xs text-muted-foreground">
                    {s.solved} solved · {s.accuracy}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
