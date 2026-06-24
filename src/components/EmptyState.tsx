import type { ReactNode } from 'react';

/**
 * The one shared "nothing here yet" surface so every empty list reads the same:
 * a centered illustration/icon, one clear line, an optional supporting line, and
 * an optional action. Modeled on the leaderboard's themed empty state so the
 * whole app feels finished rather than dropping the user onto a bare "no data".
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center ${className}`}
    >
      {icon && (
        <span className="text-muted-foreground/70" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
