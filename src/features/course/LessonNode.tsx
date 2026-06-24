import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import type { Lesson } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';
import { ACCENTS } from '@/lib/theme';
import { Island } from '@/components/illustrations/Island';
import { LessonGlyph } from './LessonGlyph';
import { getLessonVisual } from './lessonVisuals';

type Props = {
  lesson: Lesson;
  progress: LessonProgress | undefined;
  index: number;
  isCurrent: boolean;
  uid: string;
};

const DEPTH = 5; // tactile bottom-edge thickness in px

export function LessonNode({ lesson, progress, index, isCurrent }: Props) {
  const navigate = useNavigate();

  const { accent, glyph } = getLessonVisual(lesson.id, index);
  const c = ACCENTS[accent];

  const locked = !!lesson.comingSoon;
  // Locked lessons always render as locked, regardless of any stored progress.
  // A coming-soon lesson with a stale Firestore progress doc (e.g. left over
  // from a branch where it was authored, then re-locked when the catalog
  // shifted) would otherwise show a green completed-check next to a
  // "Coming soon" meta — the worst of both worlds. Stale progress is wiped
  // separately by `pruneStaleProgress` in HomePage; this is the visual guard.
  const state = locked ? undefined : progress?.state;
  const completed = state === 'completed';
  const inProgress = state === 'in_progress';

  function handleTap() {
    if (locked) {
      toast(`Coming soon. Finish Lesson ${lesson.number - 1} first.`);
      return;
    }
    // Completed lessons reopen in read-only review mode — your completion (and
    // XP/streak) stay exactly as they were; nothing is reset or re-awarded.
    if (completed) {
      navigate(`/lesson/${lesson.id}?mode=review`);
      return;
    }
    navigate(`/lesson/${lesson.id}`);
  }

  // Disc visual style by state.
  const filled = completed || inProgress || isCurrent;
  const discStyle: React.CSSProperties = locked
    ? { background: '#EEEDF2', boxShadow: `0 ${DEPTH}px 0 #DAD7E2` }
    : filled
      ? { background: c.base, boxShadow: `0 ${DEPTH}px 0 ${c.deep}` }
      : { background: c.soft, boxShadow: `0 ${DEPTH}px 0 ${c.base}33` };

  const glyphColor = locked ? '#A8A4B5' : filled ? '#FFFFFF' : c.deep;
  const ring = isCurrent ? { boxShadow: `0 0 0 5px ${c.soft}, 0 ${DEPTH}px 0 ${c.deep}` } : null;

  const meta = locked
    ? 'Coming soon'
    : completed
      ? 'Completed · tap to review'
      : inProgress
        ? `In progress · step ${(progress?.slotIndex ?? 0) + 1}`
        : isCurrent
          ? 'Start here'
          : `Lesson ${lesson.number} · ${lesson.estimatedMinutes} min`;

  const metaColor = completed
    ? 'text-[color:var(--success)]'
    : isCurrent || inProgress
      ? 'text-foreground'
      : 'text-muted-foreground';

  return (
    <>
      {/* Disc on top, label centered beneath — sits on a weaving path column. */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {/* sandy island the marker rests on */}
          <Island
            palm={index % 2 === 0}
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-4 ${
              isCurrent ? 'w-[188px]' : 'w-[164px]'
            }`}
          />
          {isCurrent ? (
            <motion.span
              className="absolute left-1/2 -top-5 -translate-x-1/2 z-10 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft"
              style={{ background: c.base }}
              initial={{ y: 2 }}
              animate={{ y: [2, -2, 2] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {inProgress ? 'Continue' : 'Start'}
            </motion.span>
          ) : null}

          <motion.button
            type="button"
            onClick={handleTap}
            aria-label={`Lesson ${lesson.number}: ${lesson.title}${
              locked ? ' (coming soon)' : completed ? ' (completed — tap to review)' : ''
            }`}
            className="relative grid place-items-center rounded-full"
            style={{
              width: isCurrent ? 80 : 68,
              height: isCurrent ? 80 : 68,
              color: glyphColor,
              ...discStyle,
              ...(ring ?? {}),
            }}
            whileHover={locked ? undefined : { y: -1 }}
            whileTap={locked ? { x: [0, -4, 4, -4, 4, 0] } : { y: DEPTH, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <LessonGlyph
              glyph={glyph}
              className={isCurrent ? 'w-10 h-10' : 'w-9 h-9'}
            />

            {completed ? (
              <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center w-6 h-6 rounded-full bg-[color:var(--success)] ring-2 ring-card">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} aria-hidden="true" />
              </span>
            ) : locked ? (
              <span className="absolute -right-0.5 -bottom-0.5 grid place-items-center w-6 h-6 rounded-full bg-muted ring-2 ring-card">
                <Lock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
              </span>
            ) : null}
          </motion.button>
        </div>

        {/* Label (the disc is the interactive target) */}
        <p
          className={`mt-2 font-display font-bold tracking-tight leading-snug line-clamp-2 ${
            locked ? 'text-muted-foreground' : 'text-foreground'
          }`}
          style={{ fontSize: isCurrent ? '1.02rem' : '0.95rem' }}
        >
          {lesson.title}
        </p>
        <p className={`text-xs mt-0.5 ${metaColor}`}>{meta}</p>
      </div>
    </>
  );
}
