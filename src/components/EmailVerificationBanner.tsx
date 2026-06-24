import { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import { ERROR_COPY } from '@/lib/errors';

export function EmailVerificationBanner() {
  const auth = useAuth();
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isDev = import.meta.env.DEV;
  const user = auth.status === 'authenticated' ? auth.user : null;
  if (!user || user.emailVerified || dismissed || isDev) return null;

  async function handleResend() {
    if (!user || resending) return;
    setResending(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent — check your inbox.');
    } catch {
      toast.error(ERROR_COPY.email.resendVerification);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
      <MailWarning className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">Please verify your email address to unlock all features.</span>
      <button
        className="font-medium underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 shrink-0"
        onClick={handleResend}
        disabled={resending}
      >
        {resending ? 'Sending…' : 'Resend'}
      </button>
      <button
        className="ml-1 text-amber-600 hover:text-amber-800 shrink-0"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
