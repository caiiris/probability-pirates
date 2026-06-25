/**
 * PracticeSession component tests (WP-6a/6b, WP-T harness).
 *
 * Covers:
 *  - render → submit correct → worked solution visible → Next advances
 *  - render → submit wrong  → worked solution shown immediately → can move on
 *
 * practiceEngine is mocked so tests are deterministic (no Date.now() seeds).
 *
 * InteractionDispatch is mocked with a simple <input> so tests can control
 * the answer payload directly without fighting FillFraction's internal state
 * or framer-motion animations. This keeps the test focused on PracticeSession's
 * loop logic (generate → grade → reveal solution → next) rather than renderer
 * internals (which have their own separate tests).
 *
 * WP-6b additions: also mocks usePracticeState (Firestore), recordPracticeAttempt
 * (Firestore), and pickNextTemplate (now called instead of SAFE_TEMPLATE).
 * Tests pass topic="counting" and uid={null} as minimal required props.
 *
 * Explicit afterEach(cleanup) is required because Vitest does not expose
 * afterEach as a global by default, preventing RTL's auto-cleanup from firing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { PracticeInstance } from '@/features/practice/practiceEngine';

// ---------------------------------------------------------------------------
// Mock practiceEngine — deterministic instance generation
// ---------------------------------------------------------------------------

vi.mock('@/features/practice/practiceEngine', () => ({
  TEMPLATES: [{ id: 'sum-of-two-dice' }],
  generateInstance: vi.fn(),
  pickNextTemplate: vi.fn(() => ({ id: 'sum-of-two-dice' })),
}));

// Import after mock declaration so we get the mocked version.
import { generateInstance } from '@/features/practice/practiceEngine';

// ---------------------------------------------------------------------------
// Mock InteractionDispatch — simple controlled input
// ---------------------------------------------------------------------------

vi.mock('@/features/practice/InteractionDispatch', () => ({
  InteractionDispatch: ({
    variant,
    onChange,
  }: {
    variant: { prompt: string };
    onChange: (payload: { numerator: number; denominator: number } | null) => void;
  }) => (
    <div>
      <p data-testid="problem-prompt">{variant.prompt}</p>
      <input
        data-testid="answer-input"
        placeholder="num/den"
        onChange={(e) => {
          const [num, den] = e.target.value.split('/').map(Number);
          if (!isNaN(num) && !isNaN(den)) {
            onChange({ numerator: num, denominator: den });
          } else {
            onChange(null);
          }
        }}
      />
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock usePracticeState — no Firestore in tests
// ---------------------------------------------------------------------------

vi.mock('@/features/practice/usePracticeState', () => ({
  usePracticeState: () => ({
    rating: 1000,
    recentTemplateIds: [],
    recordResult: vi.fn(),
  }),
  applyElo: vi.fn(),
  trimRecentTemplateIds: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock learnerModelService — no Firestore in tests
// ---------------------------------------------------------------------------

vi.mock('@/features/learner/learnerModelService', () => ({
  recordPracticeAttempt: vi.fn(() => Promise.resolve()),
  subscribeLearnerModel: vi.fn(() => () => {}),
}));

// ---------------------------------------------------------------------------
// Mock usePracticeXp — no Firestore in tests (WP-6c)
// ---------------------------------------------------------------------------

vi.mock('@/features/practice/usePracticeXp', () => ({
  usePracticeXp: () => ({
    award: vi.fn(() => ({ granted: 5, capReached: false })),
    capReached: false,
  }),
}));

// ---------------------------------------------------------------------------
// Mock SessionSignals — keep PracticeSession tests focused on loop logic
// ---------------------------------------------------------------------------

vi.mock('@/features/practice/SessionSignals', () => ({
  SessionSignals: () => null,
}));

// Import PracticeSession AFTER all mocks are declared.
import { PracticeSession } from './PracticeSession';

// ---------------------------------------------------------------------------
// Shared mock fixtures — fill-fraction shape (sum-of-two-dice family)
// ---------------------------------------------------------------------------

/** First problem: P(sum=7) = 1/6 (fill-fraction). */
const instance1: PracticeInstance = {
  instanceId: 'test-instance-1',
  templateId: 'sum-of-two-dice',
  topic: 'counting',
  skills: ['sample-space-enumeration', 'equally-likely-outcomes'],
  difficulty: 800,
  variant: {
    id: 'sum-of-two-dice:k=7',
    interactionKind: 'fill-fraction',
    prompt: 'What is the probability the sum equals 7?',
    numerator: 1,
    denominator: 6,
    numeratorLabel: 'ways to get sum 7',
    denominatorLabel: 'total equally-likely outcomes',
    feedbackCorrect: 'Correct! There are 6 pairs summing to 7.',
    feedbackDefault: 'Not quite. Enumerate the ordered pairs (a,b) with a+b=7.',
  },
  answer: { kind: 'fraction', value: { num: 1n, den: 6n } },
  explanation: {
    title: 'P(sum = 7) by enumeration',
    steps: [
      'Rolling two dice produces 36 equally-likely outcomes.',
      'Pairs summing to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1).',
      'P(sum=7) = 6/36 = 1/6.',
    ],
  },
};

/**
 * Second problem: P(sum=2) = 1/36.
 * Distinct prompt so tests can assert that "Next problem" navigated forward.
 */
const instance2: PracticeInstance = {
  instanceId: 'test-instance-2',
  templateId: 'sum-of-two-dice',
  topic: 'counting',
  skills: ['sample-space-enumeration', 'equally-likely-outcomes'],
  difficulty: 1300,
  variant: {
    id: 'sum-of-two-dice:k=2',
    interactionKind: 'fill-fraction',
    prompt: 'What is the probability the sum equals 2?',
    numerator: 1,
    denominator: 36,
    numeratorLabel: 'ways to get sum 2',
    denominatorLabel: 'total equally-likely outcomes',
    feedbackCorrect: 'Correct! Only (1,1) sums to 2.',
    feedbackDefault: 'Not quite. Only one pair sums to 2.',
  },
  answer: { kind: 'fraction', value: { num: 1n, den: 36n } },
  explanation: {
    title: 'P(sum = 2) by enumeration',
    steps: ['36 total equally-likely outcomes.', 'Only (1,1) sums to 2.', 'P(sum=2) = 1/36.'],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PracticeSession', () => {
  beforeEach(() => {
    vi.mocked(generateInstance).mockReturnValue(instance1);
  });

  afterEach(cleanup);

  it('renders the first problem with a disabled Check button before an answer is entered', () => {
    render(<PracticeSession topic="counting" uid={null} />);

    expect(
      screen.getByText('What is the probability the sum equals 7?'),
    ).toBeInTheDocument();

    const checkBtn = screen.getByRole('button', { name: 'Check' });
    expect(checkBtn).toBeInTheDocument();
    expect(checkBtn).toBeDisabled();
  });

  it('correct answer → Check grades, worked solution appears, "Next problem" advances', () => {
    render(<PracticeSession topic="counting" uid={null} />);

    fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '1/6' } });
    expect(screen.getByRole('button', { name: 'Check' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText('Correct! There are 6 pairs summing to 7.')).toBeInTheDocument();
    expect(screen.getByText('P(sum = 7) by enumeration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next problem' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument();

    vi.mocked(generateInstance).mockReturnValueOnce(instance2);
    fireEvent.click(screen.getByRole('button', { name: 'Next problem' }));

    expect(
      screen.getByText('What is the probability the sum equals 2?'),
    ).toBeInTheDocument();
  });

  it('wrong answer → worked solution revealed immediately, "Next problem" lets learner move on', () => {
    render(<PracticeSession topic="counting" uid={null} />);

    fireEvent.change(screen.getByTestId('answer-input'), { target: { value: '2/6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    expect(
      screen.getByText('Not quite. Enumerate the ordered pairs (a,b) with a+b=7.'),
    ).toBeInTheDocument();

    expect(screen.getByText('P(sum = 7) by enumeration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next problem' })).toBeInTheDocument();

    vi.mocked(generateInstance).mockReturnValueOnce(instance2);
    fireEvent.click(screen.getByRole('button', { name: 'Next problem' }));

    expect(
      screen.getByText('What is the probability the sum equals 2?'),
    ).toBeInTheDocument();
  });
});
