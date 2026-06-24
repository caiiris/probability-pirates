import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CaptainPascal } from '@/features/captain/CaptainPascal';
import type { Lesson } from '@/content/types';
import type { LessonProgress } from '@/features/progress/progressService';
import { MOTION } from '@/lib/motion';

type Props = {
  lessons: Lesson[];
  progressMap: Map<string, LessonProgress>;
  uid: string;
  displayUsername: string;
  isNewUser: boolean;
};

export function HeroCard({ lessons, progressMap, displayUsername, isNewUser }: Props) {
  const navigate = useNavigate();

  const realLessons = lessons.filter((l) => !l.comingSoon);

  // Determine hero state
  const inProgress = realLessons.find(
    (l) => progressMap.get(l.id)?.state === 'in_progress',
  );
  const allCompleted =
    realLessons.length > 0 &&
    realLessons.every((l) => progressMap.get(l.id)?.state === 'completed');
  const nextUnstarted = realLessons.find((l) => !progressMap.has(l.id));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...MOTION.slide, delay: 0.05 }}
      >
        <Card className="border-primary/15 bg-[color:var(--primary-soft)] rounded-2xl shadow-soft">
          <CardContent className="p-5">
            {isNewUser ? (
              <WelcomeHero
                displayUsername={displayUsername}
                onStart={() => navigate('/lesson/what-is-probability')}
              />
            ) : inProgress ? (
              <ResumeHero
                lesson={inProgress}
                progress={progressMap.get(inProgress.id)!}
                onResume={() => navigate(`/lesson/${inProgress.id}`)}
              />
            ) : allCompleted ? (
              <AllCaughtUpHero
                lesson={realLessons[realLessons.length - 1]}
                onReview={(l) => navigate(`/lesson/${l.id}?mode=review`)}
              />
            ) : nextUnstarted ? (
              <StartHero
                lesson={nextUnstarted}
                onStart={() => navigate(`/lesson/${nextUnstarted.id}`)}
              />
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-states
// ---------------------------------------------------------------------------

function WelcomeHero({ displayUsername, onStart }: { displayUsername: string; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <CaptainPascal context="welcome" name={displayUsername} compact />
      <Button onClick={onStart} className="w-full">Start your first lesson</Button>
    </div>
  );
}

function ResumeHero({
  lesson,
  progress,
  onResume,
}: {
  lesson: Lesson;
  progress: LessonProgress;
  onResume: () => void;
}) {
  const slotLabel = `Step ${progress.slotIndex + 1}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
          In progress
        </p>
        <p className="font-semibold">Lesson {lesson.number}: {lesson.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{slotLabel}</p>
      </div>
      <Button onClick={onResume} className="shrink-0">Continue</Button>
    </div>
  );
}

function StartHero({ lesson, onStart }: { lesson: Lesson; onStart: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
          Up next
        </p>
        <p className="font-semibold">Lesson {lesson.number}: {lesson.title}</p>
      </div>
      <Button onClick={onStart} className="shrink-0">Start</Button>
    </div>
  );
}

function AllCaughtUpHero({
  lesson,
  onReview,
}: {
  lesson: Lesson;
  onReview: (l: Lesson) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CaptainPascal context="allCaught" compact />
      <Button variant="outline" onClick={() => onReview(lesson)} className="w-full">
        Review a lesson
      </Button>
    </div>
  );
}
