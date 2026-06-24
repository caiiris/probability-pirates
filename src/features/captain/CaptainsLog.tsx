import { CaptainMascot } from '@/components/illustrations/CaptainMascot';
import { captainLine, dailyTipIndex } from './captainLines';

/**
 * A small, always-present card on Home where Captain Pascal shares one
 * learning-science tip a day. Keeps the guide visible outside the welcome /
 * all-caught-up / course-complete moments, and quietly teaches good study habits
 * (spacing, retrieval, learning from errors).
 */
export function CaptainsLog({ className = '' }: { className?: string }) {
  const tip = captainLine('tip', { pick: dailyTipIndex() });

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-primary/15 bg-[color:var(--primary-soft)] p-4 ${className}`}
    >
      <CaptainMascot className="h-12 w-12 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Captain&rsquo;s log
        </p>
        <p className="text-sm text-foreground/90">{tip}</p>
      </div>
    </div>
  );
}
