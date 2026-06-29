import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RemoteFlagsProvider } from '@/features/flags/RemoteFlagsProvider';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { UsernameSetupPage } from '@/features/auth/UsernameSetupPage';
import { AppShell } from '@/components/AppShell';
import { HomePage } from '@/features/course/HomePage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';

// Code-split the heavier, non-entry routes to keep the initial JS bundle under
// the 300 KB gz budget (D64). Home / Login / Register stay eager as the entry
// surfaces; everything below loads on navigation.
const LessonPlayer = lazy(() =>
  import('@/features/lesson/LessonPlayer').then((m) => ({ default: m.LessonPlayer })),
);
const CelebrationScreen = lazy(() =>
  import('@/features/habit/CelebrationScreen').then((m) => ({ default: m.CelebrationScreen })),
);
const SchedulePage = lazy(() =>
  import('@/features/schedule/SchedulePage').then((m) => ({ default: m.SchedulePage })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const PublicProfilePage = lazy(() =>
  import('@/features/profile/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })),
);
const SocialPage = lazy(() =>
  import('@/features/social/SocialPage').then((m) => ({ default: m.SocialPage })),
);
const StorePage = lazy(() =>
  import('@/features/economy/StorePage').then((m) => ({ default: m.StorePage })),
);
const ProgressPage = lazy(() =>
  import('@/features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })),
);
const PracticePage = lazy(() =>
  import('@/features/practice/PracticePage').then((m) => ({ default: m.PracticePage })),
);
const WagerListPage = lazy(() => import('@/features/wager/WagerListPage'));
const WagerCardPage = lazy(() => import('@/features/wager/WagerCardPage'));
const WarmupPage = lazy(() =>
  import('@/features/review/WarmupPage').then((m) => ({ default: m.WarmupPage })),
);
const NotFoundPage = lazy(() => import('@/features/notFound/NotFoundPage'));

export function App() {
  return (
    <ErrorBoundary>
      {/* MotionConfig reducedMotion="user" makes Framer Motion automatically
          skip animations when prefers-reduced-motion: reduce is set (B027) */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AuthProvider>
            <RemoteFlagsProvider>
              <TooltipProvider>
                <OfflineBanner />
                <EmailVerificationBanner />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Half-auth route: signed in to Firebase but no username yet.
                      Not wrapped in <RequireAuth> — that would loop. The page
                      enforces its own auth-state guards. */}
                    <Route path="/setup-username" element={<UsernameSetupPage />} />

                    {/* Protected routes — wrapped in AppShell for nav chrome */}
                    <Route
                      element={
                        <RequireAuth>
                          <AppShell />
                        </RequireAuth>
                      }
                    >
                      <Route path="/" element={<HomePage />} />
                      <Route path="/lesson/:lessonId" element={<LessonPlayer />} />
                      <Route path="/warmup" element={<WarmupPage />} />
                      <Route path="/celebration/:lessonId" element={<CelebrationScreen />} />
                      <Route path="/practice" element={<PracticePage />} />
                      <Route path="/schedule" element={<SchedulePage />} />
                      <Route path="/progress" element={<ProgressPage />} />
                      <Route path="/friends" element={<SocialPage />} />
                      <Route path="/store" element={<StorePage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/u/:username" element={<PublicProfilePage />} />
                      <Route path="/wager" element={<WagerListPage />} />
                      <Route path="/wager/:id" element={<WagerCardPage />} />
                    </Route>

                    {/* Catch-all — themed NotFound page (was a silent
                        redirect to "/"). Sits OUTSIDE RequireAuth so signed-
                        out users hitting a typo URL see the same page; the
                        component itself adapts its CTAs to auth state. */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
                <Toaster position="top-center" />
              </TooltipProvider>
            </RemoteFlagsProvider>
          </AuthProvider>
        </BrowserRouter>
      </MotionConfig>
    </ErrorBoundary>
  );
}

/** Quiet placeholder shown while a lazy route chunk loads. */
function RouteFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  );
}
