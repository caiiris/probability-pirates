import { Lock, Dumbbell, Infinity as InfinityIcon, ShieldCheck, Gauge } from 'lucide-react';
import { CaptainMascot } from '@/components/illustrations/CaptainMascot';

/**
 * Locked placeholder for the upcoming Practice section: an adaptive, endless
 * problem set with worked solutions, every problem checked for correctness
 * before a learner sees it. Surfaced in the nav now (lock badge) and slated for
 * the Friday update.
 *
 * Read-only and dependency-light: no data fetching, no writes.
 */
export function PracticePage() {
  return (
    <div className="min-h-full bg-white">
      <div className="mx-auto max-w-lg px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Dumbbell className="h-9 w-9" aria-hidden="true" />
          </span>
          <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground ring-4 ring-background">
            <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">Practice</h1>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--green-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--green-deep)]">
          <Lock className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          Arriving Friday
        </span>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A never-ending problem set that meets you at your level. Ask for a topic you
          want to work on, or follow the suggestions built from the questions you miss
          most.
        </p>
      </div>

      {/* What's coming: a quiet preview, all disabled */}
      <ul className="mt-8 space-y-3" aria-label="Planned practice features">
        <PreviewRow
          icon={<InfinityIcon className="h-4 w-4" aria-hidden="true" />}
          title="Unlimited problems"
          desc="A fresh question every time, so you never run out of practice on a concept."
        />
        <PreviewRow
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          title="Checked for correctness"
          desc="Every problem and its solution is verified before it reaches you, so the answer is always right."
        />
        <PreviewRow
          icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
          title="Adaptive difficulty"
          desc="It ramps up when you're cruising and eases back when you're stuck, so you stay at the right challenge."
        />
      </ul>

      <div className="mt-10 flex items-center justify-center gap-3 rounded-xl border bg-card p-4">
        <CaptainMascot className="h-12 w-12 shrink-0" />
        <div className="min-w-0 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Captain Pascal
          </p>
          <p className="text-sm text-foreground/90">
            Drop anchor here Friday. I'll have a fresh set of problems ready for you.
          </p>
        </div>
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
