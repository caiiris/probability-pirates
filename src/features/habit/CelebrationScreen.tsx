import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy } from '@/components/illustrations/Trophy';
import { MILESTONE_TITLES } from '@/lib/milestones';
import type { MilestoneId } from '@/lib/milestones';
import { SKILLS } from '@/content/skills';
import { MISCONCEPTIONS } from '@/content/misconceptions';
import type { LessonReportCard } from '@/features/learner/learnerModel';
import { useLessons } from '@/features/flags/useLessons';
import { CaptainPascal } from '@/features/captain/CaptainPascal';
import { MOTION } from '@/lib/motion';
import { ACCENT_BASES } from '@/lib/theme';
import { BoltIcon } from '@/components/icons/StatIcons';
import { StreakChip } from '@/components/StreakChip';
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
// Confetti burst — multi-origin, varied shapes, optional secondary burst
//
// Previously: 32 squares all flung from the same top-center origin. Reads as
// "a polite handful." New: 3 origin points (center, top-left, top-right),
// 60 total particles split across them, three shape variants (square, circle,
// streamer) for visual richness, and a triggerable secondary burst that the
// level-up moment uses to feel distinct from the lesson-complete burst.
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ACCENT_BASES;
type Shape = 'square' | 'circle' | 'streamer';
type Origin = { x: string; y: string }; // CSS positions

const ORIGINS: Origin[] = [
  { x: '50%', y: '0%' }, // center top
  { x: '15%', y: '5%' }, // left
  { x: '85%', y: '5%' }, // right
];

function ConfettiParticle({
  origin,
  index,
  delaySec,
  spread,
}: {
  origin: Origin;
  index: number;
  delaySec: number;
  spread: number;
}) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const x = (Math.random() - 0.5) * spread;
  const y = Math.random() * 280 + 160;
  const rotate = Math.random() * 720 - 360;
  const size = Math.random() * 6 + 6;
  const shape: Shape =
    index % 3 === 0 ? 'circle' : index % 3 === 1 ? 'streamer' : 'square';

  const baseStyle: React.CSSProperties = {
    width: shape === 'streamer' ? size * 0.45 : size,
    height: shape === 'streamer' ? size * 1.8 : size,
    backgroundColor: color,
    marginLeft: -size / 2,
    marginTop: -size / 2,
    borderRadius: shape === 'circle' ? '50%' : shape === 'streamer' ? 1 : 2,
  };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: origin.x, top: origin.y, ...baseStyle }}
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      animate={{ x, y, opacity: 0, rotate }}
      transition={{
        duration: 1.4,
        ease: 'easeOut',
        delay: delaySec + index * 0.012,
      }}
    />
  );
}

function ConfettiBurst({
  count,
  delaySec = 0,
  spread = 480,
}: {
  count: number;
  delaySec?: number;
  spread?: number;
}) {
  // Spread evenly across the three origins.
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <ConfettiParticle
          key={i}
          index={i}
          origin={ORIGINS[i % ORIGINS.length]}
          delaySec={delaySec}
          spread={spread}
        />
      ))}
    </>
  );
}

function Confetti({ leveledUp }: { leveledUp: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Main burst on arrival */}
      <ConfettiBurst count={48} delaySec={0} spread={520} />
      {/* Secondary, denser burst staged for the level-up moment so the rank-
          up feels like its own beat instead of a single "lesson done" salute. */}
      {leveledUp && <ConfettiBurst count={32} delaySec={0.55} spread={400} />}
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
  const location = useLocation();
  const lessons = useLessons();

  // Engine B payoff (F3b): the lesson recap, passed via router state by the
  // lesson player. Absent on a hard refresh (state is not in the URL) — the
  // card simply does not render, which is acceptable degradation.
  const reportCard = (location.state as { reportCard?: LessonReportCard } | null)?.reportCard;

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
      <Confetti leveledUp={leveledUp} />

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

        {/* HERO MOMENT — when leveling up, this gets the big treatment instead
            of the regular XP card. Rank-up is the rarer event of the two and
            deserves its own beat (its own confetti wave already fires from
            <Confetti leveledUp />). When NOT leveling up, the XP earned is the
            hero. */}
        {leveledUp ? <LevelUpHero totalXp={totalXp} xpDisplay={xpDisplay} /> : (
          <XpEarnedHero xpDisplay={xpDisplay} />
        )}

        {/* Supporting details — the bold moments above (complete, hero) carry
            the celebration; streak, milestones, progress, and what's next are
            context, so they appear together in one calm fade rather than a
            five-step entrance cascade. */}
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: leveledUp ? 0.85 : 0.6 }}
        >
          {/* XP earned (small line) — surfaced when we lost the giant XP card
              to the level-up hero, so the learner still sees the count for
              this lesson without losing it inside the rank-up moment. */}
          {leveledUp && (
            <p className="text-center text-sm text-muted-foreground">
              <span className="num font-semibold text-primary">+{xpDisplay}</span>{' '}
              XP earned this lesson
            </p>
          )}

          {/* Streak chip — uses the tier-aware StreakChip so a 30-day streak
              earned during this lesson actually pops here. */}
          {newStreak > 0 && (
            <div className="flex items-center justify-center gap-2">
              <StreakChip streak={newStreak} />
              {streakDelta > 0 && (
                <span className="text-xs text-muted-foreground">
                  +{streakDelta} from yesterday
                </span>
              )}
            </div>
          )}

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

          {/* Lesson recap (Engine B report card) — formative retrieval feedback:
              what the learner nailed first-try vs. what is worth another look. */}
          {reportCard && <ReportCardSection reportCard={reportCard} onPractice={() => navigate('/practice')} />}

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

// ---------------------------------------------------------------------------
// ReportCardSection — Khan-style formative recap (F3b). Built from the lesson's
// first-attempt results: skills nailed first-try, skills worth a review, and any
// misconceptions observed. The "Practice these" CTA is a non-blocking invitation
// (autonomy/SDT — never a forced gate).
// ---------------------------------------------------------------------------
function ReportCardSection({
  reportCard,
  onPractice,
}: {
  reportCard: LessonReportCard;
  onPractice: () => void;
}) {
  const { nailed, review, misconceptions } = reportCard;
  if (nailed.length === 0 && review.length === 0 && misconceptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Lesson recap
      </p>

      {nailed.length > 0 && (
        <div className="space-y-1.5">
          {nailed.map((id) => (
            <div key={id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--green-base)]" aria-hidden="true" />
              <span>
                Nailed <span className="font-medium">{SKILLS[id]?.label ?? id}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {review.length > 0 && (
        <div className="space-y-1.5">
          {review.map((id) => (
            <div key={id} className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 shrink-0 text-[color:var(--amber-base)]" aria-hidden="true" />
              <span>
                Worth a review: <span className="font-medium">{SKILLS[id]?.label ?? id}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {misconceptions.length > 0 && (
        <div className="space-y-1.5 rounded-xl bg-[color:var(--coral-soft)]/40 p-3">
          {misconceptions.map((key) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--coral-base)]" aria-hidden="true" />
              <span>
                <span className="font-medium">Watch out — {MISCONCEPTIONS[key].label}.</span>{' '}
                <span className="text-muted-foreground">{MISCONCEPTIONS[key].fix}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {(review.length > 0 || misconceptions.length > 0) && (
        <Button variant="outline" size="sm" className="w-full" onClick={onPractice}>
          Practice these
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero variants — one of these is the dominant beat on the screen depending
// on whether this lesson crossed a rank boundary or not.
// ---------------------------------------------------------------------------

/** Default hero: giant XP gain. Used when the learner DIDN'T rank up. */
function XpEarnedHero({ xpDisplay }: { xpDisplay: number }) {
  return (
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
  );
}

/** Hero variant: dramatic rank-up. The level badge becomes the focal element,
 *  with an amber-tinted backdrop and a soft glow so it feels like a "promoted"
 *  moment instead of a small card next to the XP number. XP is demoted to a
 *  small line in the supporting details block below. */
function LevelUpHero({
  totalXp,
  xpDisplay: _xpDisplay,
}: {
  totalXp: number;
  xpDisplay: number;
}) {
  const info = levelFromXp(totalXp);

  return (
    <motion.div
      className="relative flex flex-col items-center gap-3 px-6 py-7 rounded-2xl border border-[color:var(--amber-base)]/40 bg-gradient-to-b from-[color:var(--amber-soft)]/70 to-card shadow-[0_0_24px_rgba(245,158,11,0.20)]"
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...MOTION.pop, delay: 0.5 }}
    >
      {/* Eyebrow */}
      <motion.p
        className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--amber-deep)]"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        ⚓ Rank achieved
      </motion.p>

      {/* Level badge — bigger here than in the side-card variant, with a soft
          pulse to draw the eye after the entry pop. */}
      <motion.div
        initial={{ scale: 0.7, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.6 }}
      >
        <LevelBadge xp={totalXp} size={84} />
      </motion.div>

      {/* Level + rank name */}
      <motion.div
        className="text-center space-y-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.85 }}
      >
        <p className="font-display text-2xl font-bold tracking-tight">
          Level {info.level}
        </p>
        <p className="text-sm font-medium text-[color:var(--amber-deep)]">
          {info.rank.name}
        </p>
      </motion.div>
    </motion.div>
  );
}
