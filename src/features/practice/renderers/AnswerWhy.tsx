/**
 * AnswerWhy — two-part conceptual problem UI.
 *
 * Part 1: a concrete, code-verifiable answer (numeric or fraction text input).
 * Part 2: a free-response "why" textarea judged against a hand-authored rubric.
 *
 * Emits `{ answer, why }` via onChange on every keystroke in either field.
 * Standalone, prop-driven. No Firestore, no engine imports.
 *
 * F2-D renderer — dormant until wired into InteractionDispatch (Stage 2).
 * See spec-ai-assist §"Refinement" for the two-part conceptual design rationale.
 */

import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type AnswerWhyValue = {
  /** Part 1 — the concrete verifiable answer (e.g. "1/2", "3"). */
  answer: string;
  /** Part 2 — the learner's free-response reasoning. */
  why: string;
};

export type AnswerWhyProps = {
  value: AnswerWhyValue;
  onChange: (value: AnswerWhyValue) => void;
  disabled?: boolean;
  /** Label for the part-1 answer input. Defaults to "Answer". */
  answerLabel?: string;
  /** Label for the part-2 textarea. Defaults to "Why?". */
  whyLabel?: string;
  /** Placeholder text for the answer input. */
  answerPlaceholder?: string;
  /** Placeholder text for the why textarea. */
  whyPlaceholder?: string;
};

export function AnswerWhy({
  value,
  onChange,
  disabled = false,
  answerLabel = 'Answer',
  whyLabel = 'Why?',
  answerPlaceholder = 'e.g. 1/2 or 3',
  whyPlaceholder = 'Explain your reasoning…',
}: AnswerWhyProps) {
  const answerId = useId();
  const whyId = useId();

  function handleAnswer(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...value, answer: e.target.value });
  }

  function handleWhy(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange({ ...value, why: e.target.value });
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
      {/* Part 1 — concrete verifiable answer */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={answerId}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {answerLabel}
        </label>
        <Input
          id={answerId}
          type="text"
          inputMode="decimal"
          value={value.answer}
          onChange={handleAnswer}
          disabled={disabled}
          placeholder={answerPlaceholder}
          aria-label={answerLabel}
          className="text-center text-xl font-semibold h-14"
        />
      </div>

      {/* Divider between the two parts */}
      <div className="h-px w-full bg-border" role="separator" />

      {/* Part 2 — free-response reasoning */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={whyId}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {whyLabel}
        </label>
        <Textarea
          id={whyId}
          value={value.why}
          onChange={handleWhy}
          disabled={disabled}
          placeholder={whyPlaceholder}
          aria-label={whyLabel}
          className="min-h-[6rem] resize-none"
        />
      </div>
    </div>
  );
}
