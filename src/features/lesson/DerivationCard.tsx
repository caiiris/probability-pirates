import { useState } from 'react';
import { motion } from 'framer-motion';
import { renderInlineMath } from '@/components/Fraction';

type DerivationData = {
  title: string;
  steps: string[];
  /** When set, the card flips on click — front shows the question, back the derivation. */
  question?: string;
};

type Props = { derivation: DerivationData };

/**
 * Notebook-page derivation card (D77). Static when `question` is absent,
 * 3D-flippable flashcard (D78) when present:
 *
 *   ┌── Question (front) ──┐  click  ┌── Derivation (back) ──┐
 *   │  Big prompt          │  ───>   │  amber tab • steps    │
 *   │  "Tap to reveal"     │  <───   │  (notebook page)      │
 *   └──────────────────────┘         └───────────────────────┘
 *
 * Both faces share a CSS grid cell so the larger one (the derivation) sets
 * the height; the question face centers within that bounding box. This way
 * the surrounding lesson layout never reflows when the card flips.
 */
export function DerivationCard({ derivation }: Props) {
  const [revealed, setRevealed] = useState(false);
  const isFlashcard = !!derivation.question;

  const back = <DerivationFace derivation={derivation} />;

  if (!isFlashcard) {
    return back;
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed((r) => !r)}
      aria-pressed={revealed}
      aria-label={
        revealed
          ? 'Showing the derivation. Tap to return to the question.'
          : `Question: ${derivation.question}. Tap to reveal the derivation.`
      }
      className="block w-full text-left rounded-xl bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ perspective: '1400px' }}
    >
      <motion.div
        className="relative grid"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 16, mass: 1 }}
      >
        {/* Front (question) */}
        <div
          className="col-start-1 row-start-1"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <QuestionFace question={derivation.question!} />
        </div>
        {/* Back (derivation) */}
        <div
          className="col-start-1 row-start-1"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </button>
  );
}

function QuestionFace({ question }: { question: string }) {
  return (
    <aside
      aria-label="Question"
      className="relative flex flex-col items-center justify-center gap-4 rounded-xl border bg-card pt-8 pb-7 px-6 shadow-soft h-full min-h-[14rem]"
    >
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md border border-violet-base/40 bg-violet-soft text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-deep shadow-sm">
        Question
      </span>
      <p className="font-display text-lg md:text-xl font-semibold tracking-tight text-foreground text-center leading-snug max-w-[28ch]">
        {renderInlineMath(question)}
      </p>
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/70">
        Tap to reveal
      </p>
    </aside>
  );
}

function DerivationFace({ derivation }: { derivation: DerivationData }) {
  return (
    <aside
      aria-label={`Derivation: ${derivation.title}`}
      className="relative rounded-xl border bg-card pt-7 pb-4 px-5 shadow-soft text-left"
    >
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md border border-amber-base/40 bg-amber-soft text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-deep shadow-sm">
        Derivation
      </span>
      <p className="font-display text-base font-semibold tracking-tight text-foreground mb-3 text-center">
        {derivation.title}
      </p>
      <ol className="space-y-1.5 text-[0.95rem] font-mono leading-relaxed text-foreground">
        {derivation.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-muted-foreground/60 select-none w-5 shrink-0">
              {i + 1}.
            </span>
            <span className="flex-1">{renderInlineMath(step)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
