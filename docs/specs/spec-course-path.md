# Spec: Course Path (Home)

> The home screen. Shows where the learner is, where they're going, and the next thing to do. Reads progress from Firestore via `useAllLessonProgress`, reads the static lesson list from `lessonById`. Lives at route `/`.

## Purpose

Be the right answer to "what should I do now?" Every time the learner opens the app, the answer is one tap away — either Continue the in-progress lesson, or Start the next unlocked one. Surface the streak and daily goal at the top to motivate, show the locked future lessons to give the course a shape.

## User-facing behavior

### Header (sticky, ~80px)
- Top row: app name "Pascal" (small), Profile avatar icon (taps to `/profile`).
- Below: a flex row with three elements:
  - **Flame chip:** `🔥 N` (current streak). Amber background if streak > 0; gray if 0.
  - **Daily goal pill:** "Complete a lesson today" (gray) or "Done for today" (amber + checkmark).
  - **Course progress:** small text `X / 6 lessons`.

### Hero card
- One full-width card just below the header.
- States (evaluated in order):
  - **Welcome (brand-new user, per D70):** if `useAllLessonProgress(uid)` is empty *and* `profile.stepsCompleted === 0`, show `"Welcome, {displayUsername}. Let's begin."` with a Start CTA that routes to `/lesson/what-is-probability`. The condition flips false the moment the learner advances any slot; no client-side flag needed.
  - **Resume:** if any lesson has `state === 'in_progress'`, show `"Resume Lesson N, Step X of Y"` with a Continue CTA that routes to `/lesson/:id`.
  - **Start:** if no in-progress lesson, show `"Start Lesson N: <title>"` where N is the next `not_started` real lesson. (For MVP that's always Lesson 1.)
  - **All caught up:** if *all* unlocked lessons are completed → `"All caught up. Come back tomorrow."` + a re-do button for Lesson 1 (triggers replay; see `spec-progress-persistence.startReplay`).

### Course path list
- Responsive layout of all 6 lessons (the full `lessons` array). One shadcn `Card` per lesson. Mobile: single-column vertical list. Tablet (`md:`): 2-column grid. Desktop (`lg:`): 3-column grid. Cards reflow on viewport resize. (Per D63.)
- Card contents:
  - **Lesson number badge** (`1`..`6`) on the left.
  - **Title** + **blurb** in the middle.
  - **Right side:**
    - `~Nm` estimated minutes.
    - State badge: `Not started` (muted), `In progress` (indigo), `Completed` (emerald check).
    - For locked lessons: a small lock icon and `Coming soon` text replaces the state badge.
- Tap behavior:
  - Real lesson (Lesson 1): route to `/lesson/:id`.
  - Locked lesson (Lessons 2–6, `comingSoon: true`): show toast "Coming soon. Finish Lesson N first." (via Sonner).

### Navigation chrome (responsive per D63, implementation per D71)
- Persistent `AppShell` navigation (also used by Profile). Two destinations: Home (active) and Profile.
- **Mobile (<`md:` = <768px):** bottom nav bar built from shadcn `Button variant="ghost"`, full-width, ~64px tall.
- **Tablet+ (`md:` and up):** **shadcn `Sidebar` block** (`npx shadcn add sidebar`) on the left. Use the block's defaults for collapse/expand and focus management; override only the visual register to match the rest of the app per `docs/ui-directive.md`.
- Hidden entirely on `/lesson/:lessonId` and `/celebration/:lessonId` across all breakpoints — the lesson player and celebration are immersive full-screen experiences.

## Data model

This spec is read-only relative to Firestore. It consumes:
- The static `lessons: Lesson[]` from `src/content/index.ts`.
- `useAllLessonProgress(uid)` → `Map<lessonId, LessonProgress>`.
- `useAuth()` → `{ profile }` for streak fields.

It computes:
- `nextRecommendedLesson(lessons, progressMap)` — first `in_progress` real lesson, else first `not_started` real lesson, else `null` (all done).
- `courseProgress(lessons, progressMap)` — number of completed *real* lessons over total real lessons (= 1 for MVP).

## Implementation outline

1. Create `src/components/AppShell.tsx` — the persistent layout for `/` and `/profile`. Renders an `<Outlet>` + responsive nav (per D71): bottom nav (mobile) made of shadcn `Button variant="ghost"`, shadcn `Sidebar` block (tablet+). The nav is hidden by inspecting the current pathname (no shell on `/lesson/...` or `/celebration/...`).
2. Create `src/features/progress/useAllLessonProgress.ts` — subscribes to `collection(/users/{uid}/lessonProgress)` via `onSnapshot`; returns `Map<lessonId, LessonProgress>`.
3. Create `src/features/course/recommendations.ts` exporting `nextRecommendedLesson(lessons, progressMap)` and `courseProgress(lessons, progressMap)`. Pure functions.
4. Create `src/features/course/HomePage.tsx`. Renders:
   - `<HomeHeader>` — name, profile icon, streak chip, daily-goal pill, course-progress text.
   - `<HeroCard>` — Resume / Start / All-caught-up state.
   - `<LessonList>` — `.map` over `lessons` into `<LessonCard>`.
5. Create `src/features/course/HeroCard.tsx`. Takes `(recommendation, progressMap)`. Routes on Continue/Start tap. Animated subtle fade-in on mount (Framer).
6. Create `src/features/course/LessonCard.tsx`. Takes `(lesson, progress | undefined)`. Renders badge + content + right-side state. Locked behavior wired with shadcn `Sonner` toast.
7. Create `src/features/course/dailyGoal.ts` — `dailyGoalDone(progressMap, today)`: returns true if any progress doc has `completedAt` matching today's local date.
8. Wire the route in `App.tsx`: `<Route path="/" element={<HomePage />} />` inside `<RequireAuth>` and `<AppShell>`.
9. Write Vitest tests for `nextRecommendedLesson`, `courseProgress`, `dailyGoalDone`.

## Edge cases

- **First-time user** (no progress doc at all): hero card shows "Start Lesson 1"; all real lessons show `Not started`; streak shows 0 (gray); daily goal gray.
- **User completed Lesson 1, no in-progress**: hero shows "All caught up. Come back tomorrow."; Lesson 1 card shows `Completed`; tapping it opens a Replay confirmation dialog ("Start over from the beginning?") that, on confirm, calls `startReplay` and routes to `/lesson/1`.
- **Network is slow** (progress doc still loading): hero card and lesson list render shadcn `Skeleton` placeholders.
- **Locked lesson tap**: toast appears but tap does *not* navigate; the card visibly shakes briefly (Framer).
- **`comingSoon: true` lesson with `state: completed` somehow** (data drift): trust `comingSoon` over state; render as locked.
- **User has multiple `in_progress` lessons** (shouldn't happen in MVP since only Lesson 1 is real): show the one with the most recent `updatedAt`.
- **`useAllLessonProgress` returns nothing for hours after signup** (Firestore propagation delay, rare): hero card shows the "Start" state — same as a brand new user. Acceptable.
- **User changes their device's timezone**: daily goal pill may flip from "Done" back to "Pending" on the same day; harmless.
- **Hero card overflow** (very long resume label): truncate with `text-ellipsis`; the full title is visible in the lesson card below.

## Test plan

- Unit: `nextRecommendedLesson` returns Lesson 1 for an empty progress map; returns the in-progress lesson when one exists; returns null when all real lessons are complete.
- Unit: `courseProgress` returns `{ completed: 0, total: 1 }` (real lessons in MVP) for empty progress, `{ completed: 1, total: 1 }` after Lesson 1.
- Unit: `dailyGoalDone` returns true when any progress doc's `completedAt` is today.
- Manual: brand new account → land on home, see "Start Lesson 1" hero, streak 0.
- Manual: tap Lesson 4 (locked) → toast appears, no navigation.
- Manual: complete Lesson 1 → land on home, see "All caught up" hero, completed badge on Lesson 1, daily goal "Done for today".
- Manual: scroll the list on a 390px viewport — all 6 cards readable, lock states clear.

## Out of scope

- Search / filter over lessons.
- Lesson groupings (chapters, units) — Phase 3 when there are more lessons.
- Per-lesson XP shown on the card (Phase 3).
- A "Today" widget separate from the hero card.
- Direct unlock / cheat affordance for grading purposes — keep clean.
