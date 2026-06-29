/**
 * WagerCardPreSubmit — the pre-submit wager card (WP-CW-F).
 *
 * Renders the prompt, unit-aware numeric input, and submit button.
 * On submit, calls submitWager from the service layer.
 *
 * submitWager now handles the two-step flow internally (placeholder create →
 * answer read → score-patch). This component passes only the fields it has:
 * uid, wagerId, guess, and scoring. trueAnswer is no longer required here.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { submitWager } from '@/features/wager/wagerService';
import { WagerExplainerDialog } from '@/features/wager/WagerExplainerDialog';
import type { Wager, WagerUnit } from '@/features/wager/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  wager: Wager;
  /** null when the user is not signed in — renders a sign-in nudge instead. */
  uid: string | null;
};

// ---------------------------------------------------------------------------
// Unit metadata
// ---------------------------------------------------------------------------

type UnitMeta = {
  hint: string;
  placeholder: string;
  step: string;
  min: string;
  max?: string;
};

const UNIT_META: Record<WagerUnit, UnitMeta> = {
  percent: {
    hint: '(0–100)',
    placeholder: 'e.g. 47.5',
    step: '0.1',
    min: '0',
    max: '100',
  },
  count: {
    hint: '(whole number)',
    placeholder: 'e.g. 1200',
    step: '1',
    min: '0',
  },
  fraction: {
    hint: '(0 to 1)',
    placeholder: 'e.g. 0.47',
    step: '0.001',
    min: '0',
    max: '1',
  },
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isInputValid(rawValue: string, unit: WagerUnit): boolean {
  if (rawValue === '') return false;
  const num = parseFloat(rawValue);
  if (!isFinite(num) || isNaN(num)) return false;
  if (unit === 'percent') return num >= 0 && num <= 100;
  if (unit === 'count') return num >= 0 && Number.isInteger(num);
  if (unit === 'fraction') return num >= 0 && num <= 1;
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WagerCardPreSubmit({ wager, uid }: Props): JSX.Element {
  const [rawValue, setRawValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = UNIT_META[wager.unit];
  const valid = isInputValid(rawValue, wager.unit);
  const canSubmit = uid !== null && valid && !submitting;

  if (uid === null) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-base font-semibold">Sign in to place your wager.</p>
        <p className="text-sm text-muted-foreground">
          You need an account to submit a guess and see the reveal.
        </p>
        <Link to="/login" className={buttonVariants({ variant: 'default', size: 'sm' })}>
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || uid === null) return;
    const guess = parseFloat(rawValue);
    setSubmitting(true);
    setError(null);
    try {
      await submitWager({
        uid,
        wagerId: wager.id,
        guess,
        scoring: wager.scoring,
      });
      // Success: WagerCardPage will re-render because useUserSubmission fires.
      // No local nav needed; just clean up submitting state in case the
      // component isn't immediately unmounted (e.g. snapshot lag).
      setSubmitting(false);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'AlreadySubmitted') {
        setError("You've already submitted a wager here.");
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Something went wrong. Try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <header className="shrink-0 border-b px-4 py-4 flex items-center gap-3 bg-card">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Wager #{wager.sequence}
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-10">
        <div className="w-full max-w-lg space-y-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-center leading-snug">
            {wager.prompt}
          </h1>

          <Card>
            <CardContent className="pt-4 space-y-5">
              <p className="text-sm text-muted-foreground">
                Answer in{' '}
                <span className="font-medium text-foreground">
                  {wager.unit === 'percent' && 'percent'}
                  {wager.unit === 'count' && 'a whole number'}
                  {wager.unit === 'fraction' && 'a fraction'}
                </span>{' '}
                <span className="text-muted-foreground">{meta.hint}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                  type="number"
                  inputMode="decimal"
                  step={meta.step}
                  min={meta.min}
                  max={meta.max}
                  placeholder={meta.placeholder}
                  value={rawValue}
                  onChange={(e) => {
                    setRawValue(e.target.value);
                    setError(null);
                  }}
                  className="text-base"
                  aria-label="Your guess"
                  disabled={submitting}
                />

                {error !== null && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!canSubmit}
                >
                  {submitting ? 'Submitting…' : 'Submit your wager'}
                </Button>
              </form>

              <div className="flex justify-center">
                <WagerExplainerDialog />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
