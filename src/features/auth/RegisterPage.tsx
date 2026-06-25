import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CaptainPascal } from '@/features/captain/CaptainPascal';
import { AuthHero } from './AuthHero';
import { registerUser } from './userService';
import { takeAuthRedirectError } from './authRedirect';
import { useAuth } from './AuthProvider';
import { GoogleSignInButton } from './GoogleSignInButton';

type FieldErrors = {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [fields, setFields] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const redirectError = takeAuthRedirectError();
    if (redirectError) setErrors({ form: redirectError });
  }, []);

  if (auth.status === 'loading') return null;
  if (auth.status === 'needs_username') return <Navigate to="/setup-username" replace />;
  if (auth.status === 'authenticated') return <Navigate to="/" replace />;

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    const email = fields.email.trim();
    const username = fields.username.trim();
    if (!email.includes('@') || email.length < 5) {
      errs.email = 'Enter a valid email address.';
    }
    if (!USERNAME_RE.test(username)) {
      errs.username = 'Username must be 3-20 characters: letters, numbers, underscores only.';
    }
    if (fields.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (fields.password !== fields.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const result = await registerUser({
      email: fields.email.trim(),
      username: fields.username.trim(),
      password: fields.password,
    });

    setSubmitting(false);

    if (result.ok) {
      navigate('/', { replace: true });
      return;
    }

    const { code, message } = result.error;
    if (code === 'email-in-use') {
      setErrors({ email: message });
    } else if (code === 'username-taken') {
      setErrors({ username: message });
    } else {
      setErrors({ form: message });
    }
  }

  function field(name: keyof typeof fields) {
    return {
      value: fields[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields((prev) => ({ ...prev, [name]: e.target.value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
      },
    };
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <AuthHero />
        </div>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">Create account</h2>
          </CardHeader>
          <CardContent>
            <CaptainPascal context="welcome" compact className="mb-4" />
            <GoogleSignInButton
              onError={(message) => setErrors({ form: message })}
              label="Sign up with Google"
            />

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errors.form && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.form}
                </p>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...field('email')}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  {...field('username')}
                />
                {errors.username && (
                  <p id="username-error" className="text-sm text-destructive" role="alert">
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...field('password')}
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  {...field('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p id="confirm-error" className="text-sm text-destructive" role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
