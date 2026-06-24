import { Check, Lock } from 'lucide-react';
import type { Lesson } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';
import { ACCENTS } from '@/lib/theme';
import type { Chapter } from './chapters';

type Props = {
  chapter: Chapter;
  /** the chapter's actual lessons (used to ignore coming-soon in the count) */
  lessons: Lesson[];
  progressMap: Map<string, LessonProgress>;
};

/** A "world" header that opens each chapter of the path. Soft accent tint, a
 *  tactile number medallion, and a progress count — no gradients, on-brand. */
export function ChapterBanner({ chapter, lessons, progressMap }: Props) {
  const c = ACCENTS[chapter.accent];
  const available = lessons.filter((l) => !l.comingSoon);
  const total = available.length;
  const done = available.filter((l) => progressMap.get(l.id)?.state === 'completed').length;
  const complete = total > 0 && done === total;
  // A unit with no playable lessons yet is a locked roadmap preview — show a
  // "Soon" chip instead of a meaningless "0/0" count.
  const locked = total === 0;

  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl border p-4 shadow-soft backdrop-blur-sm"
      style={{
        background: `color-mix(in srgb, ${c.soft} 88%, #ffffff)`,
        borderColor: `${c.base}40`,
      }}
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white"
        style={{ background: c.base, boxShadow: `0 3px 0 ${c.deep}` }}
        aria-hidden="true"
      >
        {chapter.number}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: c.deep }}>
          Chapter {chapter.number}
        </p>
        <h2 className="font-display text-base font-bold leading-tight tracking-tight">
          {chapter.title}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{chapter.subtitle}</p>
      </div>

      {locked ? (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: c.deep, background: `${c.base}1A` }}
          aria-label={`Chapter ${chapter.number} coming soon`}
        >
          <Lock className="h-3 w-3" aria-hidden="true" />
          Soon
        </span>
      ) : complete ? (
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: c.base }}
          aria-label={`Chapter ${chapter.number} complete`}
        >
          <Check className="h-4 w-4 text-white" strokeWidth={3} aria-hidden="true" />
        </span>
      ) : (
        <span
          className="num shrink-0 text-sm font-bold"
          style={{ color: c.deep }}
          aria-label={`${done} of ${total} lessons complete`}
        >
          {done}/{total}
        </span>
      )}
    </div>
  );
}
