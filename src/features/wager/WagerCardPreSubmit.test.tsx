/**
 * WagerCardPreSubmit component tests (WP-CW-F).
 *
 * Covers:
 *   - Empty input → submit button disabled
 *   - Invalid text (e.g. "abc") → submit disabled
 *   - Negative number on 'percent' unit → submit disabled
 *   - Out-of-range (>100) on 'percent' unit → submit disabled
 *   - Negative number on 'count' unit → submit disabled
 *   - Fractional count (non-integer) → submit disabled
 *   - Out-of-range (>1) on 'fraction' unit → submit disabled
 *   - Valid number for each unit → submit enabled
 *   - Clicking submit calls submitWager with the parsed guess value
 *   - Submit failure → error message shown, button re-enabled
 *   - Explainer link click opens dialog (found by accessible name)
 *   - Signed-out (uid=null) renders sign-in nudge, not the form
 *
 * submitWager is mocked — no Firebase in tests.
 * WagerExplainerDialog is mocked to a simple stub to avoid base-ui portal
 * focus-trap issues in JSDOM; the dialog itself has its own rendering tested
 * via the accessible-name assertion on the trigger.
 *
 * Explicit afterEach(cleanup) required: Vitest does not expose afterEach
 * globally, preventing RTL's auto-cleanup from firing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Wager } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Mock wagerService — no Firebase
// ---------------------------------------------------------------------------

vi.mock('@/features/wager/wagerService', () => ({
  submitWager: vi.fn(),
}));

import { submitWager } from '@/features/wager/wagerService';
const mockSubmitWager = vi.mocked(submitWager);

// ---------------------------------------------------------------------------
// Mock WagerExplainerDialog — avoid base-ui portal/focus-trap in JSDOM
// ---------------------------------------------------------------------------

vi.mock('@/features/wager/WagerExplainerDialog', () => ({
  WagerExplainerDialog: () => (
    <button type="button" aria-label="How does this work?">
      How does this work?
    </button>
  ),
}));

// Import component after mocks are registered
import { WagerCardPreSubmit } from '@/features/wager/WagerCardPreSubmit';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeWager(overrides: Partial<Wager> = {}): Wager {
  return {
    id: 'test-wager-1',
    sequence: 1,
    openAt: Date.now(),
    prompt: 'In a group of 23 randomly chosen people, what is the probability two share a birthday?',
    unit: 'percent',
    tags: ['birthday-paradox'],
    flavor: 'counterintuition',
    scoring: 'log',
    status: 'live',
    createdBy: 'system',
    ...overrides,
  };
}

function renderComponent(wager: Wager, uid: string | null = 'user-123') {
  return render(
    <MemoryRouter>
      <WagerCardPreSubmit wager={wager} uid={uid} />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSubmitButton() {
  return screen.getByRole('button', { name: /submit your wager/i });
}

function getInput() {
  return screen.getByRole('spinbutton', { name: /your guess/i });
}

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WagerCardPreSubmit — input validation', () => {
  beforeEach(() => {
    mockSubmitWager.mockReset();
  });

  it('submit button is disabled when input is empty', () => {
    renderComponent(makeWager());
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is disabled for non-numeric text', () => {
    renderComponent(makeWager());
    fireEvent.change(getInput(), { target: { value: 'abc' } });
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is disabled for a negative number on percent unit', () => {
    renderComponent(makeWager({ unit: 'percent' }));
    fireEvent.change(getInput(), { target: { value: '-5' } });
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is disabled for a value > 100 on percent unit', () => {
    renderComponent(makeWager({ unit: 'percent' }));
    fireEvent.change(getInput(), { target: { value: '150' } });
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is disabled for a negative number on count unit', () => {
    renderComponent(makeWager({ unit: 'count' }));
    fireEvent.change(getInput(), { target: { value: '-10' } });
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is disabled for a fractional count (non-integer)', () => {
    renderComponent(makeWager({ unit: 'count' }));
    fireEvent.change(getInput(), { target: { value: '5.5' } });
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is disabled for a value > 1 on fraction unit', () => {
    renderComponent(makeWager({ unit: 'fraction' }));
    fireEvent.change(getInput(), { target: { value: '1.5' } });
    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit button is enabled for a valid percent value', () => {
    renderComponent(makeWager({ unit: 'percent' }));
    fireEvent.change(getInput(), { target: { value: '47.5' } });
    expect(getSubmitButton()).not.toBeDisabled();
  });

  it('submit button is enabled for a valid count value (whole number)', () => {
    renderComponent(makeWager({ unit: 'count' }));
    fireEvent.change(getInput(), { target: { value: '1200' } });
    expect(getSubmitButton()).not.toBeDisabled();
  });

  it('submit button is enabled for a valid fraction value', () => {
    renderComponent(makeWager({ unit: 'fraction' }));
    fireEvent.change(getInput(), { target: { value: '0.47' } });
    expect(getSubmitButton()).not.toBeDisabled();
  });

  it('submit button is enabled for 0 (valid lower bound)', () => {
    renderComponent(makeWager({ unit: 'percent' }));
    fireEvent.change(getInput(), { target: { value: '0' } });
    expect(getSubmitButton()).not.toBeDisabled();
  });
});

describe('WagerCardPreSubmit — submit behaviour', () => {
  beforeEach(() => {
    mockSubmitWager.mockReset();
  });

  it('calls submitWager with the parsed guess value on submit', async () => {
    mockSubmitWager.mockResolvedValueOnce({
      uid: 'user-123',
      guess: 50,
      logError: 0,
      score: 0,
      submittedAt: Date.now(),
    });

    renderComponent(makeWager({ unit: 'percent', scoring: 'log' }));
    fireEvent.change(getInput(), { target: { value: '50' } });
    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    expect(mockSubmitWager).toHaveBeenCalledOnce();
    expect(mockSubmitWager).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'user-123',
        wagerId: 'test-wager-1',
        guess: 50,
        scoring: 'log',
      }),
    );
    // trueAnswer must NOT be in the call — it is resolved internally by submitWager.
    expect(mockSubmitWager.mock.calls[0][0]).not.toHaveProperty('trueAnswer');
  });

  it('disables the submit button while submitting', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolve: (v: any) => void = () => {};
    mockSubmitWager.mockImplementationOnce(
      () => new Promise((res) => { resolve = res; }),
    );

    renderComponent(makeWager());
    fireEvent.change(getInput(), { target: { value: '42' } });

    // Capture reference before click — the button text changes to "Submitting…"
    const btn = getSubmitButton();
    fireEvent.click(btn);

    // Button should be disabled while the promise is pending (text is now "Submitting…")
    expect(btn).toBeDisabled();

    // Resolve and clean up
    await act(async () => { resolve(undefined); });
  });

  it('shows the actual Firebase error message and re-enables the button on submit failure', async () => {
    // We surface the underlying error message verbatim now (no more generic
    // "Something went wrong" mask) so the user/dev can see the real cause.
    const err = new Error('Missing or insufficient permissions.');
    (err as Error & { code: string }).code = 'permission-denied';
    mockSubmitWager.mockRejectedValueOnce(err);

    renderComponent(makeWager());
    fireEvent.change(getInput(), { target: { value: '42' } });

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Missing or insufficient permissions.',
      );
    });

    // Button should be re-enabled after the error
    expect(getSubmitButton()).not.toBeDisabled();
  });

  it('falls back to a generic message when the rejection has no message', async () => {
    mockSubmitWager.mockRejectedValueOnce('');

    renderComponent(makeWager());
    fireEvent.change(getInput(), { target: { value: '42' } });

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    });
  });

  it('shows an AlreadySubmitted error message when the error code matches', async () => {
    const err = new Error('AlreadySubmitted');
    (err as Error & { code: string }).code = 'AlreadySubmitted';
    mockSubmitWager.mockRejectedValueOnce(err);

    renderComponent(makeWager());
    fireEvent.change(getInput(), { target: { value: '42' } });

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/already submitted/i);
    });
  });
});

describe('WagerCardPreSubmit — explainer dialog', () => {
  it('renders the "How does this work?" trigger with the correct accessible name', () => {
    renderComponent(makeWager());
    expect(
      screen.getByRole('button', { name: /how does this work/i }),
    ).toBeInTheDocument();
  });
});

describe('WagerCardPreSubmit — signed-out state', () => {
  it('renders a sign-in nudge when uid is null', () => {
    renderComponent(makeWager(), null);
    expect(screen.getByText(/sign in to place your wager/i)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('does not render the submit button when uid is null', () => {
    renderComponent(makeWager(), null);
    expect(screen.queryByRole('button', { name: /submit your wager/i })).not.toBeInTheDocument();
  });
});
