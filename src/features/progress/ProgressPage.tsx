import { Lock, LineChart, Sparkles, Target, TrendingUp } from 'lucide-react';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';

/**
 * Locked placeholder for the upcoming Progress section. The feature is surfaced
 * in the nav (with a lock badge) so learners know personalized progress tracking
 * is coming, but the analysis itself (reading real attempt and streak data to
 * surface strengths and gaps) isn't built yet.
 *
 * Intentionally read-only and dependency-light: no data fetching, no writes.
 */
export function ProgressPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-primary-soft text-primary">
            <LineChart className="h-9 w-9" aria-hidden="true" />
          </span>
          <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground ring-4 ring-background">
            <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">Progress insights</h1>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Lock className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          Coming soon
        </span>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Soon this is where you'll see how your learning is really going. Beyond XP and
          streaks, it shows where you're strong, where you're stuck, and what to revisit
          next.
        </p>
      </div>

      {/* What's coming: a quiet preview, all disabled */}
      <ul className="mt-8 space-y-3" aria-label="Planned progress features">
        <PreviewRow
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          title="Strengths &amp; gaps"
          desc="A read of which concepts you've mastered and which need another pass."
        />
        <PreviewRow
          icon={<Target className="h-4 w-4" aria-hidden="true" />}
          title="Smart review suggestions"
          desc="Timely nudges to revisit ideas right before you'd forget them."
        />
        <PreviewRow
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          title="Plain-language summary"
          desc="A clear read on how you're actually doing, drawn straight from your attempts."
        />
      </ul>

      <div className="mt-10 flex items-center justify-center gap-3 rounded-xl border bg-card p-4">
        <CaptainMascot className="h-12 w-12 shrink-0" />
        <div className="min-w-0 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Captain Pascal
          </p>
          <p className="text-sm text-foreground/90">
            Keep charting your course! I'm building the map that shows how far you've come.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border bg-card/60 p-4 opacity-70">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Lock className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
    </li>
  );
}
