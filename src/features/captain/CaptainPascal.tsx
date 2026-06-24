import { CaptainMascot } from '@/components/illustrations/CaptainMascot';
import { captainLine, type CaptainContext } from './captainLines';

type Props = {
  context: CaptainContext;
  name?: string;
  /** Lesson title, for the lessonIntro line. */
  title?: string;
  /** Rotate/randomize the line; omit for the deterministic first line. */
  pick?: number;
  /** Compact lays mascot + text in a row (cards); default stacks for big moments. */
  compact?: boolean;
  className?: string;
};

/**
 * Captain Pascal saying a contextual line. The named guide that ties the
 * "Pascal lives inside the pirate world" brand together — used at the welcome,
 * the all-caught-up lull, course completion, and lesson intros.
 */
export function CaptainPascal({ context, name, title, pick, compact = false, className = '' }: Props) {
  const line = captainLine(context, { name, title, pick });

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <CaptainMascot className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Captain Pascal
          </p>
          <p className="text-sm text-foreground/90">{line}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
      <CaptainMascot className="h-16 w-16" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
        Captain Pascal
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">{line}</p>
    </div>
  );
}
