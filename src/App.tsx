import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';

/**
 * Placeholder used for routes not yet implemented.
 * Replaced in-place as each spec ships.
 */
function ComingSoonPlaceholder({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      {label} (coming soon)
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ComingSoonPlaceholder label="Home" />
                </RequireAuth>
              }
            />
            <Route
              path="/lesson/:lessonId"
              element={
                <RequireAuth>
                  <ComingSoonPlaceholder label="Lesson player" />
                </RequireAuth>
              }
            />
            <Route
              path="/celebration/:lessonId"
              element={
                <RequireAuth>
                  <ComingSoonPlaceholder label="Celebration" />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ComingSoonPlaceholder label="Profile" />
                </RequireAuth>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
