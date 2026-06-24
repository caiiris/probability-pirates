import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Wraps any route that requires a fully-set-up Pascal account.
 * - Loading: renders nothing (avoids flash of login before auth resolves).
 * - Unauthenticated: redirects to /login.
 * - needs_username: redirects to /setup-username (first-time Google user).
 * - Authenticated: renders children.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return null;
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (auth.status === 'needs_username') {
    return <Navigate to="/setup-username" replace />;
  }

  return <>{children}</>;
}
