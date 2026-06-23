import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * Wraps any route that requires authentication.
 * - Loading: renders nothing (avoids flash of login before auth resolves).
 * - Unauthenticated: redirects to /login.
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

  return <>{children}</>;
}
