/**
 * NumberFill component tests (F2-D renderer, WP-T harness).
 *
 * Covers:
 *  - Renders empty when value is null
 *  - Renders with a supplied numeric value
 *  - onChange called with parsed integer on valid input
 *  - onChange called with null when the field is cleared
 *  - Input is disabled when disabled=true
 *  - Coerces decimal/non-digit input to an integer
 *  - Caps value at 9 999
 *  - Custom label is rendered and associated with the input
 *
 * Explicit afterEach(cleanup) is required because Vitest does not expose
 * afterEach as a global by default, preventing RTL's auto-cleanup from firing.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { NumberFill } from './NumberFill';

afterEach(cleanup);

describe('NumberFill', () => {
  it('renders with empty input when value is null', () => {
    render(<NumberFill value={null} onChange={() => {}} />);
    // type="number" inputs have the "spinbutton" ARIA role
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(null);
  });

  it('renders with the supplied numeric value', () => {
    render(<NumberFill value={5} onChange={() => {}} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(5);
  });

  it('calls onChange with the parsed integer on valid input', () => {
    const onChange = vi.fn();
    render(<NumberFill value={null} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('calls onChange with null when the field is cleared', () => {
    const onChange = vi.fn();
    render(<NumberFill value={3} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('strips non-digit characters and parses as integer', () => {
    const onChange = vi.fn();
    render(<NumberFill value={null} onChange={onChange} />);
    // "12.5" → strips "." → "125" → 125
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '12.5' } });
    expect(onChange).toHaveBeenCalledWith(125);
  });

  it('caps the value at 9 999', () => {
    const onChange = vi.fn();
    render(<NumberFill value={null} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99999' } });
    expect(onChange).toHaveBeenCalledWith(9999);
  });

  it('is disabled when disabled=true', () => {
    render(<NumberFill value={null} onChange={() => {}} disabled />);
    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });

  it('renders and associates the default label "Answer"', () => {
    render(<NumberFill value={null} onChange={() => {}} />);
    // getByLabelText finds the input via htmlFor <-> id association
    expect(screen.getByLabelText('Answer')).toBeInTheDocument();
  });

  it('renders and associates a custom label', () => {
    render(<NumberFill value={null} onChange={() => {}} label="Count" />);
    expect(screen.getByLabelText('Count')).toBeInTheDocument();
  });
});
