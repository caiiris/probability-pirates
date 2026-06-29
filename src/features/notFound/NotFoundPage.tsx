/**
 * NotFoundPage — themed catch-all for unknown routes.
 *
 * Replaces the prior `<Navigate to="/" replace />` which silently bounced you
 * home with no acknowledgement that the URL was wrong. The themed page keeps
 * the metaphor consistent ("wandered off the map") and gives the user two
 * concrete next steps instead of dumping them at Home.
 *
 * Rendered for both authenticated and signed-out users (the route sits outside
 * RequireAuth). For signed-in users the surrounding AppShell wouldn't render
 * here, so we draw our own compact header strip with the brandmark so the page
 * doesn't feel orphaned.
 */

import { Link } from 'react-router-dom';
import { Wordmark } from '@/components/Brandmark';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';

export default function NotFoundPage() {
  const auth = useAuth();
  const signedIn = auth.status === 'authenticated';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3">
        <Link to="/" className="inline-flex items-center" aria-label="Probability Pirates home">
          <Wordmark className="h-6" />
        </Link>
      </header>

      <main
        className="flex-1 grid place-items-center px-6 py-12"
        style={{
          background:
            'linear-gradient(180deg, #EAF5FF 0%, #CCE6FB 35%, #9DCDF0 75%, #74B5E0 100%)',
        }}
      >
        <div className="max-w-md text-center space-y-6">
          <LostAtSea className="mx-auto w-48 h-auto" />

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              You&rsquo;ve wandered off the map.
            </h1>
            <p className="text-base text-foreground/75">
              There&rsquo;s no chart for this part of the sea. The page you&rsquo;re
              looking for either drifted away or never existed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to={signedIn ? '/' : '/login'}
              className={buttonVariants({ variant: 'default', size: 'lg' })}
            >
              {signedIn ? 'Back to your path' : 'Sign in'}
            </Link>
            {signedIn && (
              <Link
                to="/wager"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Today&rsquo;s wager
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Compact inline SVG: a tiny ship adrift over wavy lines. Decorative only;
 *  no semantic meaning the surrounding copy doesn't already convey. */
function LostAtSea({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 140"
      className={className}
      role="img"
      aria-label="A small ship adrift on the sea"
    >
      {/* Sun in the far distance */}
      <circle cx="160" cy="32" r="14" fill="#FFD27A" opacity="0.7" />
      <circle cx="160" cy="32" r="8" fill="#FFB347" />

      {/* Distant clouds */}
      <g opacity="0.85" fill="#FFFFFF">
        <ellipse cx="40" cy="28" rx="14" ry="6" />
        <ellipse cx="50" cy="24" rx="9" ry="5" />
        <ellipse cx="110" cy="20" rx="10" ry="4" />
      </g>

      {/* Ship — small, centered, slightly tilted to suggest "lost" */}
      <g transform="translate(85,55) rotate(-6)">
        {/* Mast */}
        <line x1="15" y1="2" x2="15" y2="36" stroke="#8B5A3C" strokeWidth="2" />
        {/* Sail (a soft pennant, suggesting becalmed) */}
        <path d="M15 4 L34 12 L15 18 Z" fill="#FFFFFF" stroke="#CFD8E3" strokeWidth="0.8" />
        {/* Hull */}
        <path
          d="M-4 36 L34 36 L29 46 L1 46 Z"
          fill="#8B5A3C"
          stroke="#5A3A24"
          strokeWidth="1"
        />
        {/* Hull stripe */}
        <line x1="-2" y1="40" x2="32" y2="40" stroke="#5A3A24" strokeWidth="0.6" opacity="0.5" />
      </g>

      {/* Waves */}
      <g stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.75">
        <path d="M0 108 Q12 104 24 108 T48 108 T72 108 T96 108 T120 108 T144 108 T168 108 T200 108" />
      </g>
      <g stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.55">
        <path d="M0 122 Q14 118 28 122 T56 122 T84 122 T112 122 T140 122 T168 122 T200 122" />
      </g>
      <g stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.4">
        <path d="M0 134 Q16 130 32 134 T64 134 T96 134 T128 134 T160 134 T200 134" />
      </g>
    </svg>
  );
}
