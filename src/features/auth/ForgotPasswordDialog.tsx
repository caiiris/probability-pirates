import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { sendPasswordReset } from './userService';
import { ERROR_COPY } from '@/lib/errors';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefill when the learner already typed an email into the login form. */
  initialEmail?: string;
};

export function ForgotPasswordDialog({ open, onOpenChange, initialEmail = '' }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // Reset to a clean form each time it opens.
  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setError('');
      setSent(false);
      setSending(false);
    }
  }, [open, initialEmail]);

  const looksLikeEmail = /\S+@\S+\.\S+/.test(email.trim());
  const canSend = looksLikeEmail && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError('');
    const result = await sendPasswordReset(email.trim());
    setSending(false);
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Enter the email you signed up with and we&apos;ll send a link to set a new password.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground" role="status">
              {ERROR_COPY.auth.resetEmailSent}
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSend) handleSend();
                }}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={!canSend}>
                {sending ? 'Sending...' : 'Send reset link'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
