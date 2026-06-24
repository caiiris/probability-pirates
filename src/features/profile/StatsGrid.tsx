type Stat = { label: string; value: string | number };

type Props = {
  xp: number;
  lessonsCompleted: number;
  stepsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  courseCompleted: number;
  courseTotal: number;
};

export function StatsGrid({
  xp,
  lessonsCompleted,
  stepsCompleted,
  currentStreak,
  bestStreak,
  courseCompleted,
  courseTotal,
}: Props) {
  const stats: Stat[] = [
    { label: 'Total XP', value: xp.toLocaleString() },
    { label: 'Completions', value: lessonsCompleted },
    { label: 'Steps', value: stepsCompleted },
    { label: 'Streak', value: `${currentStreak}d` },
    { label: 'Best streak', value: `${bestStreak}d` },
    { label: 'Course', value: `${courseCompleted} / ${courseTotal}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl bg-[color:var(--fill)] p-3.5 flex flex-col gap-1"
        >
          <span className="num text-2xl font-bold">{stat.value}</span>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
