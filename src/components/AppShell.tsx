import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, CalendarDays, Users, LineChart, Dumbbell, Lock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';

type NavEntry = {
  to: string;
  label: string;
  icon: typeof Home;
  /** Renders a lock badge; the destination is a "coming soon" placeholder. */
  locked?: boolean;
};

const NAV_ITEMS: NavEntry[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

/** Routes where all navigation chrome is hidden (immersive screens). */
const CHROMELESS_PREFIXES = ['/lesson/', '/celebration/'];

function isActive(to: string, pathname: string): boolean {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

/** Desktop sidebar row — icon sits in a rounded tile that fills with the accent
 *  when active, matching the app's tactile disc/medallion language. */
function NavItem({ to, label, icon: Icon, locked }: NavEntry) {
  const { pathname } = useLocation();
  const active = isActive(to, pathname);

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className="group flex items-center gap-3 px-3 py-1.5"
    >
      <motion.span
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.15 }}
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
          active
            ? 'bg-primary/12 text-primary'
            : 'text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2} aria-hidden="true" />
        {locked && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-muted text-muted-foreground ring-2 ring-[color:var(--sidebar)]">
            <Lock className="h-2 w-2" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </motion.span>
      <span
        className={`text-sm transition-colors ${
          active
            ? 'font-semibold text-primary'
            : 'font-medium text-muted-foreground group-hover:text-foreground'
        }`}
      >
        {label}
      </span>
      {locked && (
        <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
          Soon
        </span>
      )}
    </Link>
  );
}

/** Mobile bottom-nav tab — icon lifts into a colored pill when active, with a
 *  little press squish for tactility. */
function BottomTab({ to, label, icon: Icon, locked }: NavEntry) {
  const { pathname } = useLocation();
  const active = isActive(to, pathname);

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className="flex flex-1 flex-col items-center justify-center gap-0.5"
    >
      <motion.span
        whileTap={{ scale: 0.85 }}
        transition={{ duration: 0.15 }}
        className={`relative grid place-items-center rounded-2xl px-5 py-1 transition-colors ${
          active ? 'bg-primary/12' : ''
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
          strokeWidth={active ? 2.6 : 2}
          aria-hidden="true"
        />
        {locked && (
          <span className="absolute right-3 top-0 grid h-3.5 w-3.5 place-items-center rounded-full bg-muted text-muted-foreground ring-2 ring-background">
            <Lock className="h-2 w-2" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </motion.span>
      <span
        className={`text-[11px] transition-colors ${
          active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

/**
 * Wraps the routed page in a subtle fade/slide that replays on each navigation
 * (keyed by pathname → remount), and resets the scroll position to the top so a
 * route change never lands mid-page. Both effects are reduced-motion-safe via the
 * app-level `MotionConfig`. `scrollRef` is the page's scroll container.
 */
function RoutedPage({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
    window.scrollTo(0, 0);
  }, [pathname, scrollRef]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <Outlet />
    </motion.div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLElement | null>(null);

  const isChromeless = CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p));

  // Lesson player and celebration are full-screen — no chrome at all
  if (isChromeless) {
    return <Outlet />;
  }

  // Mobile: persistent top bar + bottom nav
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto pb-16">
          <div className="flex-1">
            <RoutedPage scrollRef={scrollRef} />
          </div>
          <AppFooter />
        </main>
        <nav
          className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-border bg-background/95 backdrop-blur"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <BottomTab key={item.to} {...item} />
          ))}
        </nav>
      </div>
    );
  }

  // Tablet/desktop: full-width header above a Sidebar + content split. Putting
  // the header on top (instead of inside the SidebarInset alongside the
  // sidebar's own brand block) ends the "boxed-in" L-shape and lets the
  // wordmark anchor the whole top edge. The Sidebar is now purely nav, no
  // duplicated brand label.
  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <SidebarProvider className="flex-1 min-h-0 overflow-hidden">
        <Sidebar>
          <SidebarContent className="pt-4">
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <NavItem {...item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <main ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1">
              <RoutedPage scrollRef={scrollRef} />
            </div>
            <AppFooter />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
