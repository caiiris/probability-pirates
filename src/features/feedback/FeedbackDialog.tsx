import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Bug, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { submitFeedback, FEEDBACK_MESSAGE_MAX, type FeedbackType } from './feedbackService';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TYPES: { id: FeedbackType; label: string; icon: typeof Bug; placeholder: string }[] = [
  {
    id: 'bug',
    label: 'Bug',
    icon: Bug,
    placeholder: 'What went wrong? What were you doing when it happened?',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    placeholder: 'What would make Probability Pirates better?',
  },
];

export function FeedbackDialog({ open, onOpenChange }: Props) {
  const auth = useAuth();
  const { pathname } = useLocation();
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Reset to a clean form each time it opens.
  useEffect(() => {
    if (open) {
      setType('bug');
      setMessage('');
      setError('');
    }
  }, [open]);

  const uid = auth.status === 'authenticated' ? auth.user.uid : '';
  const username = auth.status === 'authenticated' ? (auth.profile?.username ?? '') : '';

  const trimmed = message.trim();
  const overLimit = message.length > FEEDBACK_MESSAGE_MAX;
  const canSend = !!trimmed && !overLimit && !sending && !!uid;

  const active = TYPES.find((t) => t.id === type) ?? TYPES[0];

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError('');
    const result = await submitFeedback({ uid, username, type, message: trimmed, route: pathname });
    setSending(false);
    if (result.ok) {
      toast.success(type === 'bug' ? 'Bug report sent. Thank you.' : 'Feedback sent. Thank you.');
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type toggle — segmented control */}
          <div
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            role="tablist"
            aria-label="Feedback type"
          >
            {TYPES.map((t) => {
              const Icon = t.icon;
              const selected = t.id === type;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setType(t.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-background text-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-message" className="sr-only">
              Your message
            </Label>
            <Textarea
              id="feedback-message"
              rows={4}
              autoFocus
              maxLength={FEEDBACK_MESSAGE_MAX + 50}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error) setError('');
              }}
              placeholder={active.placeholder}
              className={overLimit ? 'border-destructive' : ''}
              aria-describedby="feedback-counter"
            />
            <p
              id="feedback-counter"
              className={`text-right text-xs ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {message.length} / {FEEDBACK_MESSAGE_MAX}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!canSend}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
