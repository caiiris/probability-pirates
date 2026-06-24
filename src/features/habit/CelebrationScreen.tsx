import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy } from '@/components/illustrations/Trophy';
import { MILESTONE_TITLES } from '@/lib/milestones';
import type { MilestoneId } from '@/lib/milestones';
import { useLessons } from '@/features/flags/useLessons';
import { CaptainPascal } from '@/features/captain/CaptainPascal';
import { MOTION } from '@/lib/motion';
import { ACCENT_BASES } from '@/lib/theme';
import { FlameIcon, BoltIcon } from '@/components/icons/StatIcons';
import { haptic } from '@/lib/haptics';
import { levelFromXp } from '@/lib/levels';
import { LevelBadge } from '@/features/profile/LevelBadge';

// ---------------------------------------------------------------------------
// XP Count-up hook (Framer Motion useMotionValue approach)
// ---------------------------------------------------------------------------

function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    }

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, durationMs]);

  return value;
}

// ---------------------------------------------------------------------------
// Confetti burst — simple Framer Motion particle implementation
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ACCENT_BASES;
const PARTICLE_COUNT = 32;

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const x = (Math.random() - 0.5) * 600;
  const y = -(Math.random() * 400 + 200);
  const rotate = Math.random() * 720 - 360;
  const size = Math.random() * 6 + 6;

  return (
    <motion.div
      className="absolute left-1/2 top-0 rounded-sm pointer-events-none"
      style={{ width: size, height: size, backgroundColor: color, marginLeft: -size / 2 }}
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      animate={{ x, y, opacity: 0, rotate }}
      transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.015 }}
    />
  );
}

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CelebrationScreen
// ---------------------------------------------------------------------------

export function CelebrationScreen() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessons = useLessons();

  // State carried via URL so refresh works
  const xp = parseInt(searchParams.get('xp') ?? '0', 10);
  const streakDelta = parseInt(searchParams.get('streakDelta') ?? '0', 10);
  const newStreak = parseInt(searchParams.get('streak') ?? '0', 10);
  const milestoneIds = (searchParams.get('milestones') ?? '')
    .split(',')
    .filter(Boolean) as MilestoneId[];

  const lesson = lessons.find((l) => l.id === lessonId);
  const lessonIndex = lesson ? lessons.indexOf(lesson) : -1;
  const nextLesson = lessonIndex >= 0 ? lessons[lessonIndex + 1] : undefined;

  // `completed` param carries the actual lessonsCompleted count after this lesson (B017)
  const completedCount =
    parseInt(searchParams.get('completed') ?? '0', 10) || (lesson ? lesson.number : 1);
  // Denominator is the *full planned course* (live + locked roadmap stubs), so
  // the progress bar reflects the user's share of the whole curriculum and
  // "course complete" only fires when truly every lesson is done — not when
  // the single currently-authored lesson is finished (D91).
  const courseTotal = lessons.length || 1;
  const progressPct = Math.min(100, Math.round((completedCount / courseTotal) * 100));
  const courseComplete = completedCount >= courseTotal;

  const xpDisplay = useCountUp(xp);

  // Level-up detection: compare the level at the new running total vs. before
  // this lesson's XP was added. `total` is passed by the lesson player.
  const totalXp = parseInt(searchParams.get('total') ?? '0', 10);
  const levelAfter = levelFromXp(totalXp);
  const leveledUp = totalXp > 0 && levelAfter.level > levelFromXp(totalXp - xp).level;

  // Celebratory buzz on arrival (Android; no-op elsewhere).
  useEffect(() => {
    haptic('celebrate');
  }, []);

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-start overflow-hidden">
      <Confetti />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-16 pb-12 flex flex-col gap-8">
        {/* Lesson complete header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION.slide, delay: 0.3 }}
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Lesson {lesson?.number} complete
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {lesson?.title}
          </h1>
        </motion.div>

        {/* Captain Pascal — only for the big course-complete moment */}
        {courseComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...MOTION.pop, delay: 0.4 }}
            className="rounded-2xl border bg-card p-4 shadow-soft"
          >
            <CaptainPascal context="courseComplete" />
          </motion.div>
        )}

        {/* XP earned */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...MOTION.pop, delay: 0.5 }}
        >
          <span className="flex items-center gap-1.5 text-6xl font-bold text-primary num">
            <BoltIcon className="w-9 h-9" />+{xpDisplay}
          </span>
          <span className="text-sm text-muted-foreground">XP earned</span>
        </motion.div>

        {/* Level up! */}
        {leveledUp && (
          <motion.div
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...MOTION.pop, delay: 0.6 }}
          >
            <LevelBadge xp={totalXp} size={52} />
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--violet-base)] font-semibold">
                Level up!
              </p>
              <p className="font-semibold">
                Level {levelAfter.level} · {levelAfter.rank.name}
              </p>
            </div>
          </motion.div>
        )}

        {/* Supporting details — the bold moments above (complete, XP, level-up)
            carry the celebration; streak, milestones, progress, and what's next
            are context, so they appear together in one calm fade rather than a
            five-step entrance cascade. */}
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: leveledUp ? 0.7 : 0.6 }}
        >
          {/* Streak chip */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                newStreak > 0
                  ? 'bg-card border-border'
                  : 'bg-muted text-muted-foreground border-transparent'
              }`}
            >
              <FlameIcon className="w-4 h-4" />
              <span>{newStreak}</span> day streak
              {streakDelta > 0 && (
                <span className="ml-1 text-xs font-normal opacity-75">+{streakDelta}</span>
              )}
            </span>
          </div>

          {/* Milestone cards */}
          {milestoneIds.map((id) => (
            <div
              key={id}
              className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-soft"
            >
              <Trophy className="w-10 h-10 text-streak shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  New milestone
                </p>
                <p className="font-semibold">{MILESTONE_TITLES[id]}</p>
              </div>
            </div>
          ))}

          {/* Course progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Course progress</span>
              <span>
                {Math.min(completedCount, courseTotal)} / {courseTotal} lessons
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Next lesson preview */}
          {nextLesson && (
            <div className="p-4 rounded-2xl border bg-card shadow-soft space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Up next</p>
              <p className="font-semibold">
                Lesson {nextLesson.number}: {nextLesson.title}
              </p>
              <p className="text-sm text-muted-foreground">{nextLesson.blurb}</p>
              {nextLesson.comingSoon && (
                <span className="inline-block mt-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Coming soon
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Back to Home CTA */}
        <Button size="lg" className="w-full" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
