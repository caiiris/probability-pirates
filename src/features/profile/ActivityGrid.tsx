/** 16-week activity heatmap, GitHub contribution-grid style. */

const WEEKS = 16;
const DAYS = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getGridDates(weeksBack: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start on the most recent Sunday that is ≥ weeksBack weeks ago
  const startOffset = today.getDay() + (weeksBack - 1) * 7;
  const start = new Date(today);
  start.setDate(today.getDate() - startOffset);

  const dates: Date[] = [];
  for (let i = 0; i < weeksBack * DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = {
  activityDates: string[] | undefined;
};

export function ActivityGrid({ activityDates }: Props) {
  const active = new Set(activityDates ?? []);
  const dates = getGridDates(WEEKS);
  const today = toLocalDateString(new Date());

  const activeDays = (activityDates ?? []).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">Last {WEEKS} weeks</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {activeDays} active day{activeDays !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Day-of-week labels */}
      <div className="flex gap-px" style={{ paddingLeft: 0 }}>
        {/* Empty first column for day labels */}
        <div className="flex flex-col gap-px mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={label} className="h-4 flex items-center">
              {i % 2 === 1 && (
                <span className="text-[9px] text-muted-foreground/60 w-6 leading-none">{label}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid: weeks as columns, days as rows */}
        <div className="flex gap-px overflow-x-auto">
          {Array.from({ length: WEEKS }, (_, week) => (
            <div key={week} className="flex flex-col gap-px">
              {Array.from({ length: DAYS }, (_, day) => {
                const date = dates[week * DAYS + day];
                if (!date) return <div key={day} className="w-4 h-4" />;
                const dateStr = toLocalDateString(date);
                const isActive = active.has(dateStr);
                const isToday = dateStr === today;
                const isFuture = dateStr > today;
                return (
                  <div
                    key={day}
                    className={`w-4 h-4 rounded-[2px] transition-colors ${
                      isFuture
                        ? 'bg-transparent'
                        : isActive
                        ? 'bg-primary'
                        : isToday
                        ? 'bg-primary/20 ring-1 ring-primary/40'
                        : 'bg-muted'
                    }`}
                    title={isFuture ? undefined : `${dateStr}${isActive ? ' ✓ active' : ''}`}
                    aria-label={isFuture ? undefined : `${dateStr}${isActive ? ', active' : ', no activity'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[false, false, true, true, true].map((on, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-[2px] ${on ? 'bg-primary' : 'bg-muted'}`}
            style={{ opacity: on ? 0.4 + i * 0.2 : 1 }}
          />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
