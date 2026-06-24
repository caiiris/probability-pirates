import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Brandmark } from '@/components/Brandmark';
import { useAuth } from './AuthProvider';
import { claimUsername, signOutUser } from './userService';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/**
 * One-step onboarding for first-time Google users: pick a username.
 *
 * Why this exists: Google sign-in gives us an email + display name but no
 * username — and Pascal's data model (URL paths, /usernames sentinel,
 * @-mentions if we ever build them) is built around a stable lowercase
 * username. We collect it here, then claimUsername() runs the same
 * transactional sentinel write that registerUser() does for email signups.
 *
 * Auth-state handling:
 *   - loading           → render nothing (avoids flash)
 *   - unauthenticated   → /login
 *   - authenticated     → /  (user already has a username; nothing to do)
 *   - needs_username    → render the form
 */
export function UsernameSetupPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (auth.status === 'loading') return null;
  if (auth.status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (auth.status === 'authenticated') return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!USERNAME_RE.test(trimmed)) {
      setError('Username must be 3-20 characters: letters, numbers, underscores only.');
      return;
    }

    setError('');
    setSubmitting(true);
    const result = await claimUsername({ username: trimmed });
    setSubmitting(false);

    if (result.ok) {
      // AuthProvider snapshot will flip us from needs_username → authenticated;
      // navigating immediately is fine because RequireAuth on '/' will read
      // the next state synchronously from context.
      navigate('/', { replace: true });
      return;
    }

    setError(result.error.message);
  }

  async function handleCancel() {
    // No way to "go back" to a half-onboarded Google account — sign out so
    // the user can pick a different sign-in method or come back later.
    await signOutUser();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Brandmark size={44} />
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
            Probability Pirates
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">One last step.</p>
        </div>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">Pick a username</h2>
            <p className="text-sm text-muted-foreground">
              This is how you'll show up across Probability Pirates. You can change it later in your
              profile.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting || !username}>
                {submitting ? 'Saving…' : 'Continue'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleCancel}
                disabled={submitting}
              >
                Use a different account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
