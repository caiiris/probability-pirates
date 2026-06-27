/**
 * ConceptualRound tests — two-part concept-check loop.
 *
 * useAiHint is mocked to the AI-off fallback (no network/Firebase), so the
 * classification path returns null → no reasoning penalty, generic hint copy.
 * AnswerWhy + DerivationCard are mocked to thin controls to keep the test on
 * the loop logic (code-graded Part 1, 3-try ladder, reveal).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ConceptualProblem } from '@/content/conceptual/types';

vi.mock('@/features/ai/useAiHint', () => ({
  useAiHint: () => ({
    requestHint: vi.fn(() => Promise.resolve({ text: '', fallbackUsed: true })),
  }),
}));

vi.mock('@/features/learner/learnerModelService', () => ({
  recordPracticeAttempt: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/features/practice/renderers/AnswerWhy', () => ({
  AnswerWhy: ({
    value,
    onChange,
    disabled,
  }: {
    value: { answer: string; why: string };
    onChange: (v: { answer: string; why: string }) => void;
    disabled?: boolean;
  }) => (
    <div>
      <input
        data-testid="answer"
        value={value.answer}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, answer: e.target.value })}
      />
      <textarea
        data-testid="why"
        value={value.why}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, why: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('@/features/lesson/DerivationCard', () => ({
  DerivationCard: ({ derivation }: { derivation: { title: string; steps: string[] } }) => (
    <div data-testid="derivation">{derivation.steps.join(' ')}</div>
  ),
}));

import { ConceptualRound } from './ConceptualRound';

const problem: ConceptualProblem = {
  id: 'cp-test',
  topic: 'counting',
  skills: ['combinations'],
  prompt: 'How many groups of 3 from 5?',
  answer: { kind: 'int', value: 10 },
  rubricKeyPoints: ['order does not matter'],
  misconceptions: ['ordered_vs_unordered'],
  canonicalWhy: 'C(5,3) = 10 because order does not matter.',
};

function setup() {
  const awardXp = vi.fn(() => ({ granted: 5, capReached: false }));
  const onAnswered = vi.fn();
  const onNext = vi.fn();
  render(
    <ConceptualRound
      problem={problem}
      uid={null}
      topic="counting"
      awardXp={awardXp}
      onAnswered={onAnswered}
      onNext={onNext}
    />,
  );
  return { awardXp, onAnswered, onNext };
}

afterEach(cleanup);

describe('ConceptualRound', () => {
  it('requires both the answer and the why before Check is enabled', () => {
    setup();
    const check = screen.getByRole('button', { name: 'Check' });
    expect(check).toBeDisabled();

    fireEvent.change(screen.getByTestId('answer'), { target: { value: '10' } });
    expect(check).toBeDisabled(); // why still empty

    fireEvent.change(screen.getByTestId('why'), { target: { value: 'order does not matter' } });
    expect(check).not.toBeDisabled();
  });

  it('a correct answer resolves, reveals the canonical why, and awards XP', async () => {
    const { awardXp } = setup();
    fireEvent.change(screen.getByTestId('answer'), { target: { value: '10' } });
    fireEvent.change(screen.getByTestId('why'), { target: { value: 'order does not matter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(await screen.findByRole('button', { name: 'Next problem' })).toBeInTheDocument();
    expect(screen.getByTestId('derivation')).toHaveTextContent('C(5,3) = 10');
    expect(awardXp).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ tryNumber: 1, reasoningMultiplier: 1 }),
    );
  });

  it('accepts an equivalent fraction form for the answer', async () => {
    const { awardXp } = setup();
    fireEvent.change(screen.getByTestId('answer'), { target: { value: '10/1' } });
    fireEvent.change(screen.getByTestId('why'), { target: { value: 'order does not matter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(await screen.findByRole('button', { name: 'Next problem' })).toBeInTheDocument();
    expect(awardXp).toHaveBeenCalled();
  });

  it('wrong answers show a hint and only reveal after the 3rd miss (no XP)', async () => {
    const { awardXp } = setup();
    const answer = screen.getByTestId('answer');
    fireEvent.change(screen.getByTestId('why'), { target: { value: 'they are ordered' } });

    fireEvent.change(answer, { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(await screen.findByText('Try 2 of 3')).toBeInTheDocument();
    expect(screen.queryByTestId('derivation')).not.toBeInTheDocument();

    fireEvent.change(answer, { target: { value: '61' } });
    fireEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(await screen.findByText('Try 3 of 3')).toBeInTheDocument();

    fireEvent.change(answer, { target: { value: '62' } });
    fireEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(await screen.findByRole('button', { name: 'Next problem' })).toBeInTheDocument();
    expect(screen.getByTestId('derivation')).toBeInTheDocument();
    expect(awardXp).not.toHaveBeenCalled();
  });
});
