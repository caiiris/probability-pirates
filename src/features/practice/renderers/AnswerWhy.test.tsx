/**
 * AnswerWhy component tests (F2-D renderer, WP-T harness).
 *
 * Covers:
 *  - Renders both the answer input and the why textarea
 *  - Default labels are present and associated with their inputs
 *  - Custom labels are rendered
 *  - onChange emits { answer, why } when the answer field changes
 *  - onChange emits { answer, why } when the why field changes
 *  - Previous field values are preserved in onChange payloads
 *  - Both inputs are disabled when disabled=true
 *  - Custom placeholders appear
 *
 * Explicit afterEach(cleanup) is required because Vitest does not expose
 * afterEach as a global by default, preventing RTL's auto-cleanup from firing.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AnswerWhy } from './AnswerWhy';
import type { AnswerWhyValue } from './AnswerWhy';

afterEach(cleanup);

const EMPTY: AnswerWhyValue = { answer: '', why: '' };

describe('AnswerWhy', () => {
  it('renders the answer input and the why textarea', () => {
    render(<AnswerWhy value={EMPTY} onChange={() => {}} />);
    expect(screen.getByLabelText('Answer')).toBeInTheDocument();
    expect(screen.getByLabelText('Why?')).toBeInTheDocument();
  });

  it('renders default labels and associates them with the correct inputs', () => {
    render(<AnswerWhy value={EMPTY} onChange={() => {}} />);
    // getByLabelText resolves via htmlFor <-> id
    const answerInput = screen.getByLabelText('Answer');
    const whyTextarea = screen.getByLabelText('Why?');
    expect(answerInput.tagName).toBe('INPUT');
    expect(whyTextarea.tagName).toBe('TEXTAREA');
  });

  it('renders custom labels when provided', () => {
    render(
      <AnswerWhy
        value={EMPTY}
        onChange={() => {}}
        answerLabel="P(event)"
        whyLabel="Reasoning"
      />,
    );
    expect(screen.getByLabelText('P(event)')).toBeInTheDocument();
    expect(screen.getByLabelText('Reasoning')).toBeInTheDocument();
  });

  it('calls onChange with updated answer and preserved why on answer change', () => {
    const onChange = vi.fn();
    const initial: AnswerWhyValue = { answer: '', why: 'because…' };
    render(<AnswerWhy value={initial} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Answer'), { target: { value: '1/2' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ answer: '1/2', why: 'because…' });
  });

  it('calls onChange with preserved answer and updated why on why change', () => {
    const onChange = vi.fn();
    const initial: AnswerWhyValue = { answer: '1/2', why: '' };
    render(<AnswerWhy value={initial} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Why?'), {
      target: { value: 'Each flip is independent.' },
    });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ answer: '1/2', why: 'Each flip is independent.' });
  });

  it('reflects controlled values in the DOM', () => {
    const controlled: AnswerWhyValue = { answer: '3', why: 'There are 3 ways.' };
    render(<AnswerWhy value={controlled} onChange={() => {}} />);
    expect(screen.getByLabelText<HTMLInputElement>('Answer').value).toBe('3');
    expect(screen.getByLabelText<HTMLTextAreaElement>('Why?').value).toBe('There are 3 ways.');
  });

  it('disables both inputs when disabled=true', () => {
    render(<AnswerWhy value={EMPTY} onChange={() => {}} disabled />);
    expect(screen.getByLabelText('Answer')).toBeDisabled();
    expect(screen.getByLabelText('Why?')).toBeDisabled();
  });

  it('shows custom placeholders', () => {
    render(
      <AnswerWhy
        value={EMPTY}
        onChange={() => {}}
        answerPlaceholder="Enter a fraction"
        whyPlaceholder="Describe your approach"
      />,
    );
    expect(screen.getByPlaceholderText('Enter a fraction')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe your approach')).toBeInTheDocument();
  });
});
