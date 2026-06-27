/**
 * NumberFill — single-integer free-response input for count answers.
 *
 * Standalone, prop-driven. No Firestore, no engine imports.
 * Matches the app's input styling (see FillFraction for the canonical pattern).
 *
 * F2-D renderer — dormant until wired into InteractionDispatch (Stage 2).
 */

import { useId } from 'react';
import { Input } from '@/components/ui/input';

export type NumberFillProps = {
  /** Current controlled value; null when the field is empty. */
  value: number | null;
  /** Emits the parsed integer, or null when the field is cleared. */
  onChange: (value: number | null) => void;
  disabled?: boolean;
  /** Visible label above the input. Defaults to "Answer". */
  label?: string;
};

/** Strip non-digit chars, parse as integer, cap at 9 999. Returns null when empty. */
function coerceInteger(raw: string): number | null {
  const stripped = raw.replace(/[^0-9]/g, '');
  if (stripped === '') return null;
  const n = parseInt(stripped, 10);
  return isNaN(n) ? null : Math.min(n, 9_999);
}

export function NumberFill({ value, onChange, disabled = false, label = 'Answer' }: NumberFillProps) {
  const inputId = useId();
  const displayValue = value !== null ? String(value) : '';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(coerceInteger(e.target.value));
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <label
        htmlFor={inputId}
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <Input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        aria-label={label}
        className="w-28 text-center text-xl font-semibold h-14"
      />
    </div>
  );
}
