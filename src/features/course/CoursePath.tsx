import { Fragment, useId } from 'react';
import type { LessonProgress } from '@/features/progress/progressService';
import { ACCENTS, type AccentName } from '@/lib/theme';
import { LessonNode } from './LessonNode';
import { getLessonVisual } from './lessonVisuals';
import { FlyingDie } from './FlyingDie';
import { OceanScene } from './OceanScene';
import { ChapterBanner } from './ChapterBanner';
import { Checkpoint } from './Checkpoint';
import { groupLessonsIntoChapters } from './chapters';
import { chestReward } from '@/lib/coins';
import type { Lesson } from '@/content/types';

type Props = {
  lessons: Lesson[];
  progressMap: Map<string, LessonProgress>;
  currentLessonId: string | null;
  uid: string;
  /** Checkpoint chest ids the user has already claimed. */
  claimedChests: string[];
};

// Horizontal weave: each node sits at a fraction of the track width. The pattern
// reads center → right → center → left and repeats, giving a gentle quest-path S.
// Kept moderate so centered labels never clip at the track edges.
const WEAVE = [0.5, 0.74, 0.5, 0.26];
const frac = (i: number) => WEAVE[i % WEAVE.length];

const NODE_W = 140; // label column width; disc is centered within it
const GAP_H = 58; // vertical height of each curved connector segment

// Magical dice cycle through these accents; sprinkled on every other lesson
// boundary so the sea feels alive without crowding the route. Most swim like
// fish over the water; a couple further down the voyage sprout wings and fly,
// so the airborne dice aren't all stuck up top. Purely presentational.
const DIE_ACCENTS: AccentName[] = ['amber', 'violet', 'teal', 'coral', 'green', 'blue'];

type DieSpec = { accent: AccentName; pips: number; delay: number; variant: 'flying' | 'swimming' };

// Keyed on the previous lesson's *global* index so a die's look/placement stays
// stable and the flyers spread evenly down the whole path regardless of chapter.
function dieForBoundary(prevIdx: number): DieSpec | null {
  if (prevIdx % 2 === 0) return null; // sparse: decorate every other boundary
  const i = Math.floor(prevIdx / 2);
  const flying = prevIdx >= 5 && (prevIdx - 5) % 4 === 0; // a few flyers, lower down
  return {
    accent: DIE_ACCENTS[i % DIE_ACCENTS.length],
    pips: (i % 6) + 1,
    delay: (i % 4) * 0.5,
    variant: flying ? 'flying' : 'swimming',
  };
}

export function CoursePath({ lessons, progressMap, currentLessonId, uid, claimedChests }: Props) {
  const groups = groupLessonsIntoChapters(lessons);
  // Stable global index per lesson so each node keeps a consistent glyph/accent.
  const globalIndex = new Map(lessons.map((l, i) => [l.id, i]));

  // The big treasure ("course complete") sits at the very bottom of the path —
  // the literal last chapter — as the aspirational end goal of the whole 9-unit
  // course (D88, owner request). It renders locked until that final chapter is
  // complete. Every earlier chapter shows its usual chest marker. (This replaces
  // the D86 behavior that parked the trophy on the last *playable* chapter, which
  // put it near the top while only the opener is unlocked.)
  const trophyGroupIdx = groups.length - 1;

  return (
    <OceanScene>
      <div className="mx-auto max-w-md flex flex-col gap-3">
        {groups.map(({ chapter, lessons: chapterLessons }, groupIdx) => {
          const isFinalChapter = groupIdx === trophyGroupIdx;
          const availableLessons = chapterLessons.filter((l) => !l.comingSoon);
          const chapterComplete =
            availableLessons.length > 0 &&
            availableLessons.every((l) => progressMap.get(l.id)?.state === 'completed');
          const lastFrac = frac(chapterLessons.length - 1);
          const chapterAccentBase = ACCENTS[chapter.accent].base;

          return (
            <section key={chapter.id} aria-label={`Chapter ${chapter.number}: ${chapter.title}`}>
              <ChapterBanner chapter={chapter} lessons={chapterLessons} progressMap={progressMap} />
              <ol className="mt-6 flex flex-col">
                {chapterLessons.map((lesson, j) => {
                  const prev = j > 0 ? chapterLessons[j - 1] : null;
                  const prevDone = prev ? progressMap.get(prev.id)?.state === 'completed' : false;
                  const prevIdx = prev ? (globalIndex.get(prev.id) ?? j - 1) : 0;
                  const prevAccent = prev
                    ? ACCENTS[getLessonVisual(prev.id, prevIdx).accent].base
                    : null;

                  return (
                    <Fragment key={lesson.id}>
                      {j > 0 ? (
                        <CurveConnector
                          fromFrac={frac(j - 1)}
                          toFrac={frac(j)}
                          done={prevDone}
                          color={prevAccent}
                          die={dieForBoundary(prevIdx)}
                        />
                      ) : null}
                      <li className="w-full">
                        <div
                          className="-translate-x-1/2"
                          style={{ marginInlineStart: `${frac(j) * 100}%`, width: NODE_W }}
                        >
                          <LessonNode
                            lesson={lesson}
                            progress={progressMap.get(lesson.id)}
                            index={globalIndex.get(lesson.id) ?? j}
                            isCurrent={lesson.id === currentLessonId}
                            uid={uid}
                          />
                        </div>
                      </li>
                    </Fragment>
                  );
                })}

                {/* Checkpoint reward at the end of the chapter */}
                <CurveConnector
                  fromFrac={lastFrac}
                  toFrac={0.5}
                  done={chapterComplete}
                  color={chapterAccentBase}
                  die={null}
                />
                <li className="w-full">
                  <div
                    className="-translate-x-1/2"
                    style={{ marginInlineStart: '50%', width: isFinalChapter ? 300 : 200 }}
                  >
                    <Checkpoint
                      variant={isFinalChapter ? 'treasure' : 'chest'}
                      title={chapter.title}
                      accent={chapter.accent}
                      complete={chapterComplete}
                      chestId={chapter.id}
                      reward={chestReward(isFinalChapter)}
                      claimed={claimedChests.includes(chapter.id)}
                      uid={uid}
                    />
                  </div>
                </li>
              </ol>
            </section>
          );
        })}
      </div>
    </OceanScene>
  );
}

/**
 * Curved segment linking two weaving nodes. The SVG spans the full track width
 * and uses a normalized 0–100 x-axis with `preserveAspectRatio="none"`, so the
 * curve's endpoints line up with the node centers (same fractions) at any width.
 * `vectorEffect="non-scaling-stroke"` keeps the line crisp despite the x-scaling.
 */
function CurveConnector({
  fromFrac,
  toFrac,
  done,
  color,
  die,
}: {
  fromFrac: number;
  toFrac: number;
  done: boolean;
  color: string | null;
  die: DieSpec | null;
}) {
  const x1 = fromFrac * 100;
  const x2 = toFrac * 100;
  // Treasure-map dashed route: bold colored dashes once sailed, faint ahead.
  const stroke = done && color ? color : '#FFFFFF';
  // Park the flying die across the path from the bend, in the roomy side.
  const mid = (fromFrac + toFrac) / 2;
  const dieLeft = mid < 0.5 ? mid + 0.3 : mid - 0.3;
  // Per-connector unique filter id so the ink-wobble filters don't collide
  // across SVGs (some browsers treat SVG filter ids as document-global).
  const inkId = useId().replace(/:/g, '');

  return (
    <li className="w-full" aria-hidden="true">
      <div className="relative" style={{ height: GAP_H }}>
        <svg
          width="100%"
          height={GAP_H}
          viewBox={`0 0 100 ${GAP_H}`}
          preserveAspectRatio="none"
          className="block"
        >
          {/* Hand-drawn ink wobble: a tiny turbulence-displacement so the
              treasure-map route reads as drawn by a navigator instead of
              exported from Figma. The preserveAspectRatio="none" stretches
              horizontal displacement more than vertical, which actually helps
              the "long pen stroke" feel. */}
          <defs>
            <filter id={inkId} x="-5%" y="-20%" width="110%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.45"
                numOctaves="1"
                seed={Math.round(x1 + x2)}
              />
              <feDisplacementMap in="SourceGraphic" scale="0.6" />
            </filter>
          </defs>
          <path
            d={`M ${x1} 0 C ${x1} ${GAP_H * 0.5}, ${x2} ${GAP_H * 0.5}, ${x2} ${GAP_H}`}
            fill="none"
            stroke={stroke}
            strokeWidth={done ? 4 : 3}
            strokeLinecap="round"
            strokeDasharray={done ? '0.1 7' : '0.1 6'}
            vectorEffect="non-scaling-stroke"
            opacity={done ? 1 : 0.9}
            filter={`url(#${inkId})`}
          />
        </svg>
        {die ? (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${dieLeft * 100}%` }}
          >
            <FlyingDie
              accent={die.accent}
              pips={die.pips}
              delay={die.delay}
              variant={die.variant}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
