/**
 * ConceptualRound — a two-part (answer + why) concept-check, interleaved into
 * the practice loop (F2).
 *
 * Correctness split: Part 1 (the answer) is graded in CODE
 * (`gradeConceptualAnswer`) — the only thing that earns XP. Part 2 (the "why")
 * is sent to the conceptual `/api/hint` which classifies it against the
 * problem's closed rubric/misconception set; the learner's reasoning sharpens
 * the hint while answering, and on resolution it (a) may halve XP if flagged
 * and (b) feeds the misconception signal. The reveal shows the hand-authored
 * `canonicalWhy`, never model prose.
 *
 * Concept-checks deliberately do NOT move the per-topic Elo (that stays anchored
 * to the difficulty-matched template stream); they award XP and record the
 * per-skill / misconception signal only.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DerivationCard } from '@/features/lesson/DerivationCard';
import { AnswerWhy } from '@/features/practice/renderers/AnswerWhy';
import type { AnswerWhyValue } from '@/features/practice/renderers/AnswerWhy';
import { useAiHint } from '@/features/ai/useAiHint';
import { gradeConceptualAnswer, reasoningMultiplier } from '@/features/practice/conceptual';
import { recordPracticeAttempt } from '@/features/learner/learnerModelService';
import { MOTION, SHAKE_KEYFRAMES } from '@/lib/motion';
import { difficultyLabel } from '@/features/practice/practiceDifficulty';
import { practiceXpBaseForDifficulty } from '@/lib/practiceXp';
import type { PracticeXpHookResult } from '@/features/practice/usePracticeXp';
import type { ConceptualProblem } from '@/content/conceptual/types';
import type { ExactAnswer } from '@/lib/probability/exact';
import type { MisconceptionKey } from '@/content/misconceptions';
import type { Topic } from '@/content/skills';

/** Nominal Elo used only for XP banding + signals; concept-checks aren't rated. */
const CONCEPTUAL_DIFFICULTY = 1100; // Medium band
const MAX_TRIES = 3;

type Props = {
  problem: ConceptualProblem;
  uid: string | null | undefined;
  topic: Topic;
  awardXp: PracticeXpHookResult['award'];
  onAnswered: (event: { topic: Topic; difficulty: number; wasCorrect: boolean }) => void;
  onNext: () => void;
};

function formatAnswer(answer: ExactAnswer): string {
  switch (answer.kind) {
    case 'fraction':
      return `${answer.value.num}/${answer.value.den}`;
    case 'int':
      return String(answer.value);
    case 'choice':
      return '';
  }
}

export function ConceptualRound({ problem, uid, topic, awardXp, onAnswered, onNext }: Props) {
  const { requestHint } = useAiHint();

  const [value, setValue] = useState<AnswerWhyValue>({ answer: '', why: '' });
  const [tryNumber, setTryNumber] = useState(1);
  const [resolved, setResolved] = useState(false);
  const [resolvedCorrect, setResolvedCorrect] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = value.answer.trim() !== '' && value.why.trim() !== '' && !loading && !resolved;

  function ground() {
    return {
      answer: formatAnswer(problem.answer),
      canonicalWhy: problem.canonicalWhy,
      rubricKeyPoints: problem.rubricKeyPoints,
      misconceptions: problem.misconceptions,
    };
  }

  async function finalize(wasCorrect: boolean, solvedOnTry: number) {
    // Final, reveal-allowed classification pass (tryNumber 3 lifts the no-reveal
    // guard — the answer is already settled, so a verdict on the "why" is fine).
    setLoading(true);
    const res = await requestHint({
      mode: 'conceptual',
      tryNumber: 3,
      problem: { prompt: problem.prompt },
      learnerAnswer: { answer: value.answer, why: value.why },
      ground: ground(),
    });
    setLoading(false);

    const classification = res.fallbackUsed ? null : (res.classification ?? null);
    const misconceptionKey = (res.fallbackUsed ? null : (res.misconceptionKey ?? null)) as
      | MisconceptionKey
      | null;
    // Reasoning penalty only bites a correct answer ("right number, shaky why").
    const reasoningMult = wasCorrect ? reasoningMultiplier(classification) : 1;

    setResolved(true);
    setResolvedCorrect(wasCorrect);
    setVerdict(res.fallbackUsed ? null : res.text || null);

    onAnswered({ topic, difficulty: CONCEPTUAL_DIFFICULTY, wasCorrect });

    if (wasCorrect) {
      awardXp(true, {
        difficulty: CONCEPTUAL_DIFFICULTY,
        tryNumber: solvedOnTry,
        reasoningMultiplier: reasoningMult,
      });
    }

    // Record the per-skill + misconception signal (no per-topic Elo move).
    // The LLM-derived key is weighted as source 'llm' (weight 0.5) per C-MC3.
    if (uid) {
      void recordPracticeAttempt(uid, {
        skills: problem.skills,
        wasCorrect,
        difficulty: CONCEPTUAL_DIFFICULTY,
        misconceptionSignal: misconceptionKey ? { key: misconceptionKey, source: 'llm' } : null,
      });
    }
  }

  async function handleCheck() {
    if (!canSubmit) return;

    const thisTry = tryNumber;
    const wasCorrect = gradeConceptualAnswer(problem.answer, value.answer);

    if (wasCorrect || thisTry >= MAX_TRIES) {
      await finalize(wasCorrect, thisTry);
      return;
    }

    // Wrong with tries left — fetch a reasoning-aware, no-reveal hint and retry.
    setHint(null);
    setLoading(true);
    const res = await requestHint({
      mode: 'conceptual',
      tryNumber: thisTry as 1 | 2,
      problem: { prompt: problem.prompt },
      learnerAnswer: { answer: value.answer, why: value.why },
      ground: ground(),
    });
    setLoading(false);
    setHint(
      res.fallbackUsed || !res.text
        ? 'Not quite — re-check both your answer and your reasoning, then try again.'
        : res.text,
    );
    setTryNumber(thisTry + 1);
  }

  const floodClass = resolved
    ? resolvedCorrect
      ? 'border-[color:var(--green-base)]/40 bg-[color:var(--green-soft)]/60'
      : 'border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/50'
    : hint
      ? 'border-[color:var(--coral-base)]/40 bg-[color:var(--coral-soft)]/50'
      : 'border-border bg-card';

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          <div className="my-auto flex flex-col items-stretch gap-5 py-6">
            {/* Concept-check badge + XP-on-offer. */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="rounded-full bg-[color:var(--violet-soft,var(--primary-soft))] px-2.5 py-1 font-semibold text-primary">
                Concept check
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                {difficultyLabel(CONCEPTUAL_DIFFICULTY)}
              </span>
              <span className="num rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 font-semibold text-primary">
                +{practiceXpBaseForDifficulty(CONCEPTUAL_DIFFICULTY)} XP
              </span>
            </div>

            <p className="mx-auto max-w-2xl px-4 text-center text-lg font-medium leading-snug sm:text-xl">
              {problem.prompt}
            </p>

            <AnswerWhy
              value={value}
              onChange={setValue}
              disabled={resolved}
              whyLabel="Why? (explain your reasoning)"
            />

            {resolved && (
              <div className="mx-auto max-w-sm w-full px-4">
                <DerivationCard derivation={{ title: 'Why', steps: [problem.canonicalWhy] }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`shrink-0 border-t px-4 py-4 space-y-3 transition-colors duration-200 ${floodClass}`}
      >
        <AnimatePresence mode="wait">
          {resolved && resolvedCorrect && (
            <motion.div
              key="correct"
              className="flex items-start gap-2 text-sm font-medium text-[color:var(--green-deep)]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="status"
              aria-live="polite"
            >
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={MOTION.pop}
                className="mt-0.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </motion.span>
              <span>{verdict ?? 'Correct!'}</span>
            </motion.div>
          )}

          {resolved && !resolvedCorrect && verdict && (
            <motion.p
              key="resolved-verdict"
              className="text-sm font-medium text-[color:var(--coral-deep)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
            >
              {verdict}
            </motion.p>
          )}

          {!resolved && hint && (
            <motion.div
              key={`hint-${tryNumber}`}
              className="flex flex-col gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: SHAKE_KEYFRAMES.x }}
              transition={SHAKE_KEYFRAMES.transition}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--coral-deep)]">
                Try {Math.min(tryNumber, MAX_TRIES)} of {MAX_TRIES}
              </p>
              <p className="text-sm font-medium text-foreground">{hint}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {resolved ? (
          <Button size="lg" className="w-full" onClick={onNext}>
            Next problem
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled={!canSubmit} onClick={handleCheck}>
            {loading ? 'Checking…' : 'Check'}
          </Button>
        )}
      </div>
    </div>
  );
}
