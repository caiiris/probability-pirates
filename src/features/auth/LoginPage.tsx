import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AuthHero } from './AuthHero';
import { signIn } from './userService';
import { takeAuthRedirectError } from './authRedirect';
import { useAuth } from './AuthProvider';
import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const redirectError = takeAuthRedirectError();
    if (redirectError) setError(redirectError);
  }, []);

  if (auth.status === 'loading') return null;
  if (auth.status === 'needs_username') return <Navigate to="/setup-username" replace />;
  if (auth.status === 'authenticated') return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;

    setError('');
    setSubmitting(true);

    const result = await signIn({ identifier, password });

    setSubmitting(false);

    if (result.ok) {
      navigate('/', { replace: true });
      return;
    }

    setError(result.error.message);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <AuthHero />
        </div>

        <Card className="rounded-2xl shadow-soft">
          {/* No "Sign in" subheader — AuthHero sets the page intent, and the
              very first control says "Sign in with Google" already. */}
          <CardContent className="pt-6 space-y-4">
            <GoogleSignInButton onError={setError} label="Sign in with Google" />

            {/* Quieter divider than the previous "or" eyebrow — the form below
                speaks for itself, and the eyebrow read as filler chrome. */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="space-y-1">
                <Label htmlFor="identifier">Email or username</Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || !identifier || !password}
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account-creation link lives BELOW the card, not inside it — keeps the
            card tightly focused on the sign-in action. */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account yet?{' '}
          <Link to="/register" className="text-primary underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
