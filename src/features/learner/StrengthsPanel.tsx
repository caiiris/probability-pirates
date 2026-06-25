/**
 * WP-7 — Strengths / growth panel (read-only).
 *
 * Pure presentational component: given a LearnerModel (or null/loading),
 * renders three groups:
 *
 *   1. Strong          — top practiced skills (Engine A, strongestSkills)
 *   2. Keep working on — weakest practiced skills (Engine A, weakestSkills)
 *   3. Introduced      — skills met in lessons but never practiced
 *                        (in `exposure`, absent from `skills` — Engine B)
 *
 * Shows NO raw Elo numbers — only the skill label and a 0-3 mastery pip
 * derived from `recentCorrect`:
 *   < 0.4  → 1 pip (early)
 *   0.4–0.7 → 2 pips (developing)
 *   > 0.7  → 3 pips (strong)
 *
 * `compact` prop trims padding and limits introduced list to 3 entries
 * (used in the Profile compact section).
 */

import { BookOpen, Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SKILLS } from '@/content/skills';
import type { SkillId } from '@/content/skills';
import type { LearnerModel, SkillStat, ExposureStat } from './learnerModel';

// ─── Mastery pip ─────────────────────────────────────────────────────────────

type PipLevel = 1 | 2 | 3;

function masteryPip(recentCorrect: number): PipLevel {
  if (recentCorrect < 0.4) return 1;
  if (recentCorrect <= 0.7) return 2;
  return 3;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MasteryPips({ level }: { level: PipLevel }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${level} out of 3`}>
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={i}
          className={`block h-2 w-2 rounded-full transition-colors ${
            i < level ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </span>
  );
}

function SkillRow({
  skillId,
  stat,
  hint,
}: {
  skillId: SkillId;
  stat?: SkillStat;
  hint?: string;
}) {
  const label = SKILLS[skillId]?.label ?? skillId;
  const pip = stat ? masteryPip(stat.recentCorrect) : undefined;

  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        {hint && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600">
            {hint}
          </span>
        )}
        {pip !== undefined && <MasteryPips level={pip} />}
      </div>
    </li>
  );
}

function ExposureRow({
  skillId,
  stat,
}: {
  skillId: SkillId;
  stat: ExposureStat;
}) {
  const worthPractice = stat.lessonFirstTryStruggles > 0;
  return (
    <SkillRow skillId={skillId} hint={worthPractice ? 'worth a practice' : undefined} />
  );
}

function GroupSection({
  icon,
  title,
  subtitle,
  children,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {subtitle && !compact && (
            <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
          )}
        </div>
      </div>
      <ul className={`divide-y divide-border/50 ${compact ? '' : 'rounded-xl border bg-card/60 px-3'}`}>
        {children}
      </ul>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PanelSkeleton({ compact }: { compact?: boolean }) {
  const rows = compact ? 2 : 3;
  return (
    <div className={`space-y-${compact ? '4' : '6'}`} aria-busy="true" aria-label="Loading strengths">
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-4 w-28 rounded" />
          <div className={`${compact ? '' : 'rounded-xl border bg-card/60 px-3 py-1'} space-y-1`}>
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <Skeleton className="h-3.5 w-36 rounded" />
                <Skeleton className="h-2 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        Do a lesson or some practice to see your strengths.
      </p>
    );
  }
  return (
    <div className="rounded-xl border bg-card/60 p-6 text-center">
      <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">Nothing here yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Do a lesson or some practice to see your strengths.
      </p>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface StrengthsPanelProps {
  model: LearnerModel | null;
  loading: boolean;
  /** Compact layout for the Profile page section. */
  compact?: boolean;
}

// ─── StrengthsPanel ──────────────────────────────────────────────────────────

export function StrengthsPanel({ model, loading, compact }: StrengthsPanelProps) {
  if (loading) {
    return <PanelSkeleton compact={compact} />;
  }

  const hasAnyData =
    model !== null &&
    (Object.keys(model.skills).length > 0 || Object.keys(model.exposure).length > 0);

  if (!hasAnyData) {
    return <EmptyState compact={compact} />;
  }

  // Engine A — practiced
  const strongest = (model.strongestSkills ?? []).slice(0, 3);
  const weakest = (model.weakestSkills ?? []).slice(0, 3);

  // Engine B — introduced (in exposure but NOT in skills)
  const practicedSet = new Set<string>(Object.keys(model.skills));
  const introducedEntries = Object.entries(model.exposure)
    .filter(([id]) => !practicedSet.has(id)) as [SkillId, ExposureStat][];

  // In compact mode cap introduced list at 3; full mode up to 5.
  const maxIntroduced = compact ? 3 : 5;
  const introduced = introducedEntries.slice(0, maxIntroduced);

  const hasPracticed = strongest.length > 0 || weakest.length > 0;
  const hasIntroduced = introduced.length > 0;

  return (
    <div
      className={`space-y-${compact ? '4' : '6'}`}
      aria-label="Strengths and growth panel"
    >
      {/* Group 1: Strong */}
      {strongest.length > 0 && (
        <GroupSection
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          title="Strong"
          subtitle="Skills you've practiced and are doing well at"
          compact={compact}
        >
          {strongest.map((id) => {
            const stat = model.skills[id];
            return <SkillRow key={id} skillId={id} stat={stat} />;
          })}
        </GroupSection>
      )}

      {/* Group 2: Keep working on */}
      {weakest.length > 0 && (
        <GroupSection
          icon={<Flame className="h-4 w-4" aria-hidden="true" />}
          title="Keep working on"
          subtitle="Skills that could use more practice"
          compact={compact}
        >
          {weakest.map((id) => {
            const stat = model.skills[id];
            return <SkillRow key={id} skillId={id} stat={stat} />;
          })}
        </GroupSection>
      )}

      {/* Group 3: Introduced */}
      {hasIntroduced && (
        <GroupSection
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          title="Introduced"
          subtitle="Met in lessons — try practice to build mastery"
          compact={compact}
        >
          {introduced.map(([id, stat]) => (
            <ExposureRow key={id} skillId={id} stat={stat} />
          ))}
        </GroupSection>
      )}

      {/* Fallback if we have model but zero items in any group */}
      {!hasPracticed && !hasIntroduced && <EmptyState compact={compact} />}
    </div>
  );
}
