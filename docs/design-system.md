# Design System — major choices & rationale

> The durable "why" behind the 2026-06-23 design overhaul. This is the decision
> log; the chronological change list lives in
> [`docs/design-iterations.md`](design-iterations.md), the token/tooling reference
> in [`docs/ui-stack.md`](ui-stack.md), and the voice/judgment rules in
> [`docs/ui-directive.md`](ui-directive.md).
>
> Each entry: **the choice**, **why**, and **the alternative we rejected**. If you
> change one of these, update this file so the next person inherits the reasoning,
> not just the result.

---

## 0. Guiding tension

The brief was "colorful and fun like Brilliant / Khan / Duolingo." The existing
`ui-directive.md` bans gratuitous color, gradients, and generic AI defaults. These
are not actually in conflict once you locate the color correctly:

- **D1 — Color lives in content, chrome stays calm.** Saturated brand color
  appears in *illustrations, lesson nodes, glyphs, stat icons, and celebration*.
  The surrounding UI (backgrounds, cards, text, nav) stays near-neutral. This is
  exactly how Brilliant reads "playful" without looking like a toy.
  - *Rejected:* painting the whole UI in gradients/rainbow accents (reads as a
    generated template; fatigues fast; fights the directive).
- **D2 — "Playful but disciplined," with headroom.** Owner chose this over both
  "maximal/toy" and "corporate/flat." Everything is built on tokens so the dial
  can be turned later without a rewrite (see §6).

---

## 1. Color

- **D3 — One brand hue: Pascal violet `#6B4EFF`.** Distinct from the old generic
  shadcn indigo; warm, confident, not a default. It is `--primary`,
  `--ring`, sidebar accent, and the avatar/confetti seed.
- **D4 — Six-stop accent ramp** (`violet, blue, teal, green, amber, coral`), each
  with `-soft / -base / -deep`. Lessons, glyphs, and path nodes cycle through it so
  the journey feels varied without being random — color is *assigned*, not
  decorative (`src/features/course/lessonVisuals.ts`).
- **D5 — Warm, plum-tinted neutrals**, not pure gray and not cream
  (`--paper #FAFAFC`, `--ink #211C30`). Pure gray reads clinical; cream reads
  "notebook skin." The faint plum ties neutrals to the violet brand.
- **D6 — Semantic color has fixed meaning:** green = success/done, amber = streak,
  blue = info, coral = destructive/wrong. Components reference the *meaning* token
  (`--success`), never a raw hue, so meaning stays consistent across screens.
  - *Known tradeoff:* the activity heatmap uses violet (brand presence) while
    "done" elsewhere is green. Left intentionally — the heatmap is brand texture,
    not a success signal. Revisit if it confuses testers.

## 2. Typography

- **D7 — Three deliberate roles**, not one font doing everything:
  - **Bricolage Grotesque** (`--font-display`) for headings — a characterful
    grotesque with negative tracking; carries personality so the UI isn't
    "Inter everywhere" (the #1 AI-app tell).
  - **Inter** (`--font-sans`) for body/UI — neutral, legible at small sizes.
  - **JetBrains Mono** (`--font-mono`, `.num` helper) for numerals — XP, streaks,
    fractions, stats read as *data*, not prose. This is a signature, not decoration.
  - *Rejected:* a single typeface (cheap but generic); a script/rounded display
    font (too toy).
- **D8 — Display face applied via global `h1–h3`.** Ensures every real heading is
  branded.
  - *Known tradeoff:* a few small uppercase "eyebrow" labels are also `h2/h3` and
    inherit the display face. Acceptable today (Bricolage holds up at small caps);
    if it ever looks off, scope those specific labels back to `font-sans` rather
    than dropping the global rule.

## 3. Shape, elevation, motion

- **D9 — One radius scale** seeded from `--radius: 0.75rem` (sm/md/lg/xl derived).
  Friendlier than sharp corners, not bubble-toy round.
- **D10 — Two shadows only:** `--shadow-soft` (ambient card lift) and
  `--shadow-pop` (lifted/active). A bounded elevation vocabulary prevents the
  "every card has a different random shadow" look.
- **D11 — Motion is purposeful and reduced-motion-safe.** Press/spring feedback on
  interactive objects; `MotionConfig reducedMotion="user"` + a global
  `prefers-reduced-motion` CSS block. No ambient/idle animation on static chrome.
  - *Watch item:* the current path node has an infinite "start here" bounce
    (Duolingo-style). Intentional affordance, but it is the most attention-seeking
    element on the home screen — first candidate to soften if it grates.

## 4. Tactile buttons (D12)

The primary `Button` variant has a solid bottom edge (`--btn-depth: 4px` in
`--primary-deep`) that compresses on `:active`, so pressing feels physical. This is
the "fun clickable" request, expressed once at the component level so it applies
everywhere instead of being re-styled per screen.
- *Rejected:* gradient/glow buttons (generic); applying the depth to every variant
  (dilutes the primary action — only the main CTA gets the chunk).

## 5. Brand & navigation metaphor

- **D13 — Pascal's Triangle brandmark** (`Brandmark` / `Wordmark`): the dots are
  colored from the accent ramp, tying identity to the product's math subject and
  to the palette in one mark. Replaces plain "Pascal" text in header, sidebar, auth.
- **D14 — Home is a vertical "course path," not a card grid.** Connected nodes with
  per-lesson color + glyph turn a flat list into a journey with a clear "you are
  here." Locked/available/current/in-progress/completed are visually distinct
  states. (`CoursePath`, `LessonNode`, `LessonGlyph`.)
- **D15 — Custom glyphs & stat icons replace emoji.** `FlameIcon`/`BoltIcon` and
  geometric lesson glyphs (die, coin, cards, door, bars, curve) render in
  `currentColor`. Emoji render inconsistently per-OS and read as placeholder.

## 5b. Serpentine path & decorative doodles (2026-06-23)

- **D20 — The path weaves.** Nodes alternate horizontal position along a gentle
  `center → right → center → left` curve (`WEAVE` fractions in `CoursePath.tsx`),
  with the disc on top and the lesson title centered beneath it. This is the
  game-quest / "islands" feel without a full map rework. Amplitude is kept
  moderate so centered labels never clip at the track edges.
  - *Implementation note:* nodes are positioned with `marginInlineStart: <frac>%`
    + `-translate-x-1/2` (percentage margins are relative to track width), so the
    weave is fully responsive with **no JS measurement**. Connectors are SVGs that
    span the full width on a normalized 0–100 x-axis (`preserveAspectRatio="none"`,
    `vectorEffect="non-scaling-stroke"`), so curve endpoints line up with node
    centers at any width while the stroke stays crisp.
  - *Traveled vs. untraveled:* completed segments draw a solid accent-colored
    curve; upcoming segments are a faint dotted neutral line.
  - *Rejected:* measuring node positions with a ResizeObserver to draw one global
    SVG (works, but adds a measure-then-paint flash and more code for no visual gain).
- **D21 — Decorative path doodles** (`PathSticker`): sparse sparkle/clover/comet/
  star/die that bob gently and **boing on tap but do nothing functional**. They
  ride the inner side of every other bend. `aria-hidden`, not keyboard-focusable,
  reduced-motion-safe — they add delight without adding navigation noise.
- **D22 — Chapters ("worlds").** The path is grouped into themed chapters, each
  opening with a `ChapterBanner` (soft accent tint, tactile number medallion,
  `done/total` progress, completion check). Grouping is a presentation-only map
  (`chapters.ts`) mirroring `lessonVisuals.ts`; any unassigned lesson falls into a
  generated trailing "More to Explore" chapter so new content never drops off the
  path. Weave restarts per chapter (`frac(j)`), so each chapter's first node sits
  centered under its banner.
- **D23 — Checkpoint rewards.** Each chapter ends with a `Checkpoint` marker
  reached by a curved connector from the chapter's last node. Chests for chapters
  1..n-1, a trophy for the final chapter. **Locked** until the chapter is cleared
  (grayscale chest + padlock, "Clear X to unlock"); once cleared it sits on a
  glowing accent platform, bobs, twinkles with sparkles, and **bursts confetti +
  opens the chest on tap** (with a toast). Tapping is pure celebration — no
  navigation — so it's a `button` but does nothing destructive. Confetti is a
  local Framer particle spray (same technique as `CelebrationScreen`, not shared
  to avoid coupling). Chest illustration: `src/components/illustrations/Chest.tsx`.
- **D24 — Treasure-map sea theme (the big swing, owner-requested).** The whole
  course path now sails across an animated ocean (`OceanScene`): a soft blue
  gradient sea kept light enough that dark node labels stay legible, drifting
  clouds, seagulls, a bobbing **pirate ship**, scrolling foam wave bands, and a
  sun. Lesson markers rest on little **sandy islands** (`Island`, some with a
  palm); the route between them is a **dashed treasure-map trail** (bold colored
  once sailed, faint foam ahead). The bend decorations are **magical flying dice**
  (`FlyingDie`) — winged d6s with a colored glow and twinkle that drift and tumble
  on tap. Chapter banners gained a shadow + near-white tint so they read as
  signposts on the water.
  - *Scope/discipline:* this themed treatment is **confined to the home course
    path**. The lesson player, profile, schedule, and auth stay calm — color and
    whimsy live in the "world," not in working chrome. All pieces are new,
    self-contained files wrapping the existing path, so the theme can be dialed
    back or removed without unpicking the path logic.
  - *Tunables:* `OceanScene` ambient counts/durations, `FlyingDie` size/drift,
    `Island` palm frequency (`index % 3` in `LessonNode`), sea gradient stops.
  - *Replaced:* `PathSticker` (sparkle/clover doodles) is superseded by `FlyingDie`
    on the path; the file is left in place as a reusable doodle primitive.
  - *Refinements (owner feedback):* islands enlarged & bolder (palm on every other
    node); the **final chapter ends in landfall** — a wide `Landmass` (beach +
    grass + palms) with the trophy planted on it, so finishing the course literally
    lands you ashore; the **ship now sails a slow loop** around the ocean (with a
    direction flip) instead of parking next to the sun.
- **D25 — Friends page joins the voyage.** The social page (`SocialPage`) now
  opens with the same `OceanScene` banner — a `CompassRose` flourish, display-font
  hero ("Your Crew"), and the weekly leaderboard reframed as "The weekly voyage."
  Leaderboard ranks use tactile gold/silver/bronze **medal badges** (`RankBadge`),
  XP reads in the mono `.num` face, and the empty state is a compass-led "recruit
  a crew" call. Theme stays presentational; search/leaderboard logic untouched.
- **D26 — Profile trophy medallions + carded layout.** Achievements and streak
  milestones are now a **collectible medallion system** (`Medallion` + `Emblem` +
  `badgeVisuals`): each trophy is a tactile coin with a **unique emblem** and a
  tone — accent hues for most, **bronze/silver/gold metals** for the progressive
  XP chain so it reads as tiers. Laid out as a **collection grid** with quiet
  ghosted locked slots and **tap-for-detail** (`TrophyCase` dialog showing the big
  medallion + how to earn it). The profile stays **one page** but is reorganized
  into clear **carded sections** (Stats / Activity / Trophy shelf) with display
  headers; stat tiles flattened to sit inside the section cards.
  - *Decisions (owner):* medallion system over bespoke-per-badge; grid over
    gallery; one page over split routes.
  - *Deferred:* a **customizable showcase shelf** (pin top 3, Khan-style) — needs a
    `showcase` profile field + editor, so it's a follow-up. `MilestonesRow` is now
    superseded by `TrophyCase` (left in place).
- **Still deferred:** an optional zoomed-out map view of all chapters; profile
  showcase shelf.

## 6. Extensibility (the "add stuff later" requirement)

- **D16 — Strict 3-layer tokens** (`src/index.css`): primitive ramps → semantic
  tokens → Tailwind utilities, mirrored for JS in `src/lib/theme.ts`. Retheme by
  remapping Layer 2; grow by adding to Layer 1 + Layer 3 (recipe documented inline
  in `index.css`). Components never hard-code hex.
- **D17 — Presentation/data separation.** Lesson→color/glyph mapping lives in a
  presentation-only file; no business logic was touched during the overhaul, so it
  composes cleanly with other in-flight work.

## 7. Performance

- **D18 — Route-split heavy surfaces** (`React.lazy` + `Suspense`): lesson player,
  celebration, schedule, profile. Keeps the eager chunk lean despite added fonts +
  illustrations. Eager chunk **≈ 286 KB gz**.
- **D19 — Budget is a soft target, gated by load perf** (owner decision): eager
  first-load JS soft target **≤ 350 KB gz**, with Lighthouse mobile Performance ≥ 90
  / healthy TTI as the real gate, not the raw byte count. See
  [`docs/architecture.md`](architecture.md) and D64 in
  [`docs/alternatives.md`](alternatives.md).

---

## Self-critique pass — 2026-06-23

Ran the design skill's skeptical/"remove one thing" review on the finished overhaul.

**Fixed now**

1. **Two competing CTAs on home.** The `HeroCard` ("Up next…") and the path's
   current node both acted as the primary action — violating "one primary focus per
   screen." `HeroCard` is now shown *only* for the two states the path can't express
   (first-time welcome, all-caught-up). For the normal returning case the path's
   current node is the single focus. (`HomePage.tsx`)
2. **Dangling token reference.** The path connector referenced
   `var(--line-strong, #DAD7E2)` — a token that didn't exist. Added `--line-strong`
   to Layer 1 and dropped the inline fallback. (`index.css`, `CoursePath.tsx`)

**Logged, intentionally deferred**

- Activity heatmap uses violet vs. green-for-done elsewhere (D6 tradeoff).
- Display face on small uppercase eyebrow headings (D8 tradeoff).
- Infinite "start here" bounce on the current node (D11 watch item).
- `HeroCard` retains now-unreachable-from-home `inProgress`/`nextUnstarted`
  branches; kept so the component stays self-contained/reusable. Harmless.

**Verification:** typecheck + lint clean, 104 tests pass, build green, eager chunk
≈ 286 KB gz.

---

## 8. Progress correctness & review mode — 2026-06-23

Owner feedback: progress numbers looked wrong ("1/6" when only 5 lessons ship),
and replaying a finished lesson silently un-finished it.

- **D27 — Counts are derived, never hardcoded.** `courseProgress` now returns
  `total = available (non-coming-soon) lessons` instead of a fixed `COURSE_SIZE = 6`.
  Chapter banners, the chapter/checkpoint "complete" test, the celebration progress
  bar, and both profile course stats all count only available lessons. This means
  the final chapter (whose last lesson is `comingSoon`) can actually complete, so the
  landfall trophy + course-complete moment are reachable. Supersedes PRD §9.6 AC #2's
  fixed "/ 6". (`recommendations.ts`, `ChapterBanner.tsx`, `CoursePath.tsx`,
  `CelebrationScreen.tsx`, `PublicProfilePage.tsx`, `LessonPlayer.tsx`)
- **D28 — Completion is permanent; re-entry is read-only "review".** Tapping a
  completed lesson (or "Review a lesson" on the all-caught-up hero) opens
  `/lesson/:id?mode=review`: the player starts at step 1, every step is read-only,
  and it writes nothing — no progress reset, no XP/streak/coin re-award. The
  destructive `startReplay` (which flipped `completed → in_progress`) is no longer
  wired to any UI. Reuses the player's existing `viewSlotIndex` review plumbing.
  (`LessonNode.tsx`, `HeroCard.tsx`, `LessonPlayer.tsx`)
- **D29 — A cleared chest stays open.** The checkpoint chest now initializes its
  open state from `claimed`, so once you've taken its coins it renders open on every
  visit (instead of resetting closed). Preserves the coin-economy claim-on-tap flow.
  (`Checkpoint.tsx`)

**Verification:** typecheck + lint clean, 145 tests pass, build green, eager chunk
≈ 301 KB gz.

---

## 9. Shell cohesion & first impression — 2026-06-23

UX-polish pass to make the app *feel* shipped: tie every screen together and make
the first screen on-brand.

- **D30 — Persistent app bar.** New `AppHeader` renders on every chromed route
  (`AppShell.tsx`), keeping the habit-loop signals — streak, XP (desktop), and the
  coin wallet — always in view, and making the store reachable from anywhere via
  the coin chip (it was previously only reachable from Home). Mobile drops the XP
  pill to avoid crowding; XP still lives on Home/Profile. (`AppHeader.tsx`)
- **D31 — Identity in the bar.** The header avatar is the user's real
  `DefaultAvatar` (honoring their equipped `avatarStyle`), not a generic person
  icon, and links to the profile. Home's bespoke header + duplicated stat strip
  were removed; Home keeps only the home-specific daily-goal + streak-freeze row.
  (`AppHeader.tsx`, `HomePage.tsx`)
- **D32 — Playful, tactile navigation.** Sidebar rows and the mobile bottom tabs
  now lift the active icon into a colored rounded tile, thicken its stroke, and
  add a press-squish (`whileTap`), matching the disc/medallion language instead of
  a flat color swap. (`AppShell.tsx`)
- **D33 — On-brand auth.** Login/Register lead with the `OceanScene` banner
  (`AuthHero`) and a compact Captain Pascal welcome, so the first screen starts the
  voyage instead of presenting a generic form. (`AuthHero.tsx`, `LoginPage.tsx`,
  `RegisterPage.tsx`)

**Verification:** my files are typecheck + lint + Prettier clean and 162 tests
pass. NOTE: a full `tsc -b`/build is currently red due to an unrelated in-flight
edit in `src/features/schedule/SchedulePage.tsx` (missing `onOpenDetail` prop),
owned by another agent — not from this change.

## 10. Lesson-player felt quality — 2026-06-23

Polish pass on the core learning surface so each tap feels rewarding.

- **D34 — Segmented step progress.** `LessonHeader` replaced the thin continuous
  `Progress` bar (which was `slotIndex / totalSlots` and so never reached 100% on
  the final step) with one pip per slot. Completed *and* the current step fill, so
  the bar is full on the last step and the count of remaining pips tells the
  learner how far is left. Each pip fills with a 0.3s `scaleX` spring.
  (`LessonHeader.tsx`)
- **D35 — Result flood + check pop + haptics.** The footer feedback tray now
  washes soft green/coral across the whole tray (not just the icon), the correct
  check-mark pops in with a spring, wrong copy is coral (was muted gray), and we
  fire short Android `navigator.vibrate` patterns for correct/wrong/celebrate.
  Haptics are a pure progressive enhancement (`lib/haptics.ts`) — no-op on iOS /
  desktop and gated by `prefers-reduced-motion`. (`LessonFooter.tsx`,
  `CelebrationScreen.tsx`, `lib/haptics.ts`)
- **D36 — Calm leave dialog.** "Leave lesson?" no longer uses a destructive-red
  button for the benign Leave action (progress is saved). Leave is now a quiet
  ghost button and "Keep going" is the emphasized default. (`LessonHeader.tsx`)

## 11. App-wide finish pass — 2026-06-24

Cohesion + empty/loading-state polish so the whole app feels shipped.

- **D37 — Page transitions + scroll reset.** A `RoutedPage` wrapper in `AppShell`
  fades/slides the routed page in on each navigation (keyed by pathname) and
  resets the scroll container to the top, so route changes never hard-cut or land
  mid-page. Reduced-motion-safe via the app-level `MotionConfig`. (`AppShell.tsx`)
- **D38 — One shared empty state.** New `EmptyState` (centered icon + one line +
  optional supporting line + optional action) standardizes every "nothing here"
  surface on the leaderboard's themed bar. Applied to the empty Schedule day
  (calendar icon + "Add an event") and the empty Friends search (compass + "No
  explorers found"). (`components/EmptyState.tsx`, `SchedulePage.tsx`,
  `SocialPage.tsx`)
- **D39 — Treasure-shop store.** The store leads with an `OceanScene` banner + an
  open `Chest` ("Trading Post") and the coin balance. Item cards gained tactile
  depth (`rounded-2xl` + `shadow-soft`), an equipped ring + corner check, dimmed
  unaffordable previews, and a `PriceLabel` (coin + amount, lock prefix when you
  can't afford it). (`StorePage.tsx`)
- **D40 — Consistent shaped skeletons.** Schedule now renders a calendar +
  day-list `ScheduleSkeleton` while the month's events load, fixing a false
  "nothing planned" flash (events were `[]` during load). Profile / public
  profile / leaderboard already used shaped skeletons. (`SchedulePage.tsx`)
- **D41 — Tactile secondary buttons.** `outline` and `secondary` button variants
  gained a quiet 2px neutral bottom edge that compresses on press (matching the
  primary CTA's chunky depth and the lesson nodes), so every tap feels tactile.
  `ghost`/`link` stay flat; popup triggers opt out via `not-aria-[haspopup]`.
  (`components/ui/button.tsx`)

## 12. XP progression / levels & ranks — 2026-06-24

XP previously only fed the leaderboard — no progression payoff. Coins are the
*spendable* currency, so XP's job is now *status/progression*.

- **D42 — Pirate ranks from XP (client-derived).** New pure `lib/levels.ts` maps
  total XP → a level (advancing L→L+1 costs `50 + 50*L` XP, ~one lesson for the
  first level) and a themed rank (Stowaway → … → Captain → Commodore), tinted
  from the accent ramp. No schema/backend change — it reads the `xp` we already
  store, so it can't collide with the economy/backend work. Surfaced as: a
  `RankPanel` (level disc + rank + progress-to-next bar) in a new Profile "Rank"
  section, a compact `LevelBadge` disc in the persistent header (XP always in
  view as a level), and a level-up card on the celebration screen (the lesson
  player now passes the new running `total` XP so the screen can detect a
  level-up). Covered by `lib/levels.test.ts`. (`lib/levels.ts`,
  `features/profile/LevelBadge.tsx`, `ProfileBody.tsx`, `AppHeader.tsx`,
  `CelebrationScreen.tsx`, `LessonPlayer.tsx`)
- **D43 — Practice XP policy (capped daily).** Resolves the spec-practice open
  question. A correct practice problem will award a small flat 5 XP (vs. a
  lesson's first-try 10), capped at 100 XP/local-day (~one lesson / ~20 problems)
  — enough to keep learners progressing on off-days without practice dwarfing the
  path or the leaderboard. Practice XP feeds total XP (levels) + weekly XP but
  does NOT tick the streak or count as a completed lesson. Encoded as pure, tested
  logic (`lib/practiceXp.ts`, `grantPracticeXp`) ready for the practice solve loop
  (currently a locked "Arriving Friday" stub) to call. The level curve (D42) was
  documented to target the planned ~40-lesson arc: finishing the course ≈ level 13
  (First Mate); Captain/Commodore reachable via capped practice. (`lib/practiceXp.ts`,
  `lib/practiceXp.test.ts`, `lib/levels.ts`, `docs/specs/spec-practice.md`)

## 13. Surface consistency pass — 2026-06-24

From the full-app UI audit. Two issues fixed; the rest queued.

- **D44 — Radius + elevation convention (codified).** The app already trended
  this way; now it's the rule:
  - **Radius:** top-level cards/banners → `rounded-2xl`; inner tiles, list rows,
    and content cards → `rounded-xl`; controls (buttons, inputs, chips) →
    `rounded-lg` / `rounded-full`; calendar day cells → `rounded-lg`.
  - **Elevation:** resting cards use the **`shadow-soft` token** (never Tailwind's
    default `shadow-sm`); overlays/lifted use `shadow-pop`; inner tiles carry no
    shadow. `drop-shadow-*` on SVG illustrations is unrelated and fine.
  - Fixes this pass: Profile wallet card was `rounded-xl` + no shadow among
    `rounded-2xl`+`shadow-soft` sections → aligned; `DerivationCard`'s two cards
    used `shadow-sm` → `shadow-soft`. (`ProfilePage.tsx`, `DerivationCard.tsx`)
- **D45 — Concept body is left-aligned.** Enriched concept slots centered all
  prose, including multi-sentence `body`/`theorem` text, which is hard to read
  (every line starts at a different x). Now only the illustration, title, and the
  one-line lede prompt are centered; running prose is left-aligned within
  `max-w-prose` (`text-balance` on the lede). Matches `ui-directive.md`'s "don't
  center everything." (`ConceptSlotView.tsx`)

## 14. Follow notifications — 2026-06-24

- **D46 — In-app notifications via owner-only subcollection.** "X started
  following you" needed an inbox without Cloud Functions (Spark plan). The
  natural shape: `users/{uid}/notifications/{notifId}` (owner-only `read`,
  sender `create` with a closed-set `type`, owner-only `update` restricted to
  flipping `read`). `socialService.follow()` queues a `batch.set` into the
  recipient's inbox via `notificationsService.queueFollowNotification` so the
  follow and the notification land atomically. Doc id `follow_{fromUid}` makes
  re-following refresh rather than spam. A `NotificationBell` in the persistent
  header shows an unread badge (capped at "9+"); tapping opens a panel with the
  most recent 20 items (real-time via `onSnapshot`) and marks everything read.
  The schema and the rules' closed-set `type` enum are ready to extend to kudos
  / achievements / leaderboard movement without a rules rewrite.
  (`firebase/firestore.rules`, `features/notifications/*`,
  `features/social/socialService.ts`, `components/AppHeader.tsx`,
  `docs/specs/spec-social.md`, `docs/data-schema.md`)

## 15. UI audit — small fixes — 2026-06-24

- **D47 — Notification badge: primary, not coral.** The unread dot was initially
  coral (`--coral-base`), which is the *destructive/wrong-answer* color elsewhere
  in the app. A follow is positive news, so the badge now uses `bg-primary` to
  avoid the semantic mismatch and to stop the chrome's one pop of color from
  reading as an error. (`features/notifications/NotificationBell.tsx`)
- **D48 — Header right-cluster discipline.** The persistent app bar was getting
  busy: streak chip + XP chip + coin chip + bell + avatar, regardless of state.
  Two changes: (1) the streak chip is **hidden until `streak > 0`** so new
  learners aren't staring at a dead "0 day streak" pill; (2) the raw-XP chip is
  **gone entirely from the cluster**, because the centered level bar already
  shows XP as progress toward the next level and as a remaining count. The right
  cluster is now: streak (when earned) → coins → bell → avatar.
  (`components/AppHeader.tsx`)
- **D49 — "Today's goal" pill states the goal.** The Home pill used to read
  just `Today's goal` when undone — a label that repeats the section's purpose
  without saying what to do. It now reads **"Finish 1 lesson today"** (and
  "Done today" once met). Matches `ui-directive.md`'s "empty/idle states tell
  the user what to do next." (`features/course/HomePage.tsx`)

## 16. UI audit — polish pass — 2026-06-24

- **D50 — Page header style is the same on every page.** Schedule used
  `text-xl font-semibold` while every other top-level page used
  `font-display text-2xl font-bold tracking-tight`. Now Schedule matches, and
  the filler subtitle ("Plan tests, homework, and study sessions.") that just
  restated the heading was cut. (`features/schedule/SchedulePage.tsx`)
- **D51 — Login card opens straight into the action.** The "Sign in" h2 that
  sat between `AuthHero` (which already says "Probability Pirates" with a
  tagline) and the very first control (a button labeled "Sign in with Google")
  was filler. Removed; the card now opens directly with the Google button.
  (`features/auth/LoginPage.tsx`)
- **D52 — Notification panel: shaped skeletons + mobile sheet.** The loading
  state was a bare "Loading…" string inside a panel that otherwise had shaped
  rows — inconsistent with the rest of the app's loading convention (D40). Now
  shows three shaped rows (avatar circle + two text lines). On **mobile**, the
  panel is no longer a tiny floating dropdown anchored to a 32px bell; it
  becomes a **top sheet** (fixed inset, just under the header, with a backdrop
  click-outside). Desktop keeps the small anchored 320px dropdown.
  (`features/notifications/NotificationBell.tsx`)
- **D53 — Trading Post item identity.** Item cards (avatar styles, flair rows)
  gained a subtle warm parchment tint (`color-mix(in srgb, var(--amber-soft)
  35%, var(--card))`) and a `hover:-translate-y-0.5` tactile lift, so the wares
  feel laid out on a shop table — without literal wood-grain or texture work.
  Equipped items pop back to plain card with a violet ring so the active state
  still stands out. (`features/economy/StorePage.tsx`)

## 17. Anti-vibe-coded pass — 2026-06-24

A self-honest audit asked whether the UI still read as AI-generated. The
metaphor and the bones were intentional, but several layers above that read as
defaults. Three coordinated passes addressed the loudest tells.

- **D54 — Plain words over thesaurus stack.** Three nautical noun phrases on
  one Profile page ("Captain's log," "Voyage log," "Treasure shelf") read like
  a prompt-themed checklist. New rule: keep the metaphor **only where the
  illustration earns it** (the chest = Treasure shelf, the ocean = course path,
  the captain mascot = Captain's log card on Home), and use plain words
  everywhere else. Renames:
  - Profile sections: `Captain's log → Stats`; `Voyage log → Activity`;
    `Treasure shelf` kept.
  - Home: `Your path → Path`.
  - Friends: `Your Crew → Friends`; `Find explorers → Find learners`;
    `The weekly voyage → Weekly leaderboard`; empty-search `No explorers found
    → No learners found`.
  - Leaderboard empty state: cut "Recruit a crew to start your voyage" for
    plain "Follow other learners to start the leaderboard."
  - Store: `Forgiveness → Streak Freeze` (single-item section, plain name);
    `Profile flair → Flair` (shorter).
  Stripping the possessive ("Your") + the thesaurus is the most direct
  anti-AI-default copy move.
  (`features/profile/ProfileBody.tsx`, `features/course/HomePage.tsx`,
  `features/social/SocialPage.tsx`, `features/social/Leaderboard.tsx`,
  `features/economy/StorePage.tsx`)
- **D55 — Opt-in elevation: one hero per page, the rest recede.** Every card
  in the app wore the same `rounded-2xl border bg-card p-4 shadow-soft` shell,
  so there was no visual hierarchy — four cards on Profile all weighed
  identically. New pattern: card containers default to a hairline
  `border-border/70` with no shadow; only the page's hero collection wears
  `shadow-soft` (and any tint). Implemented via an `elevated` prop on the
  Profile `Section` component. Only **Treasure shelf** is elevated; Rank /
  Stats / Activity sit lighter. The Leaderboard followed: rows lost their
  per-row `shadow-soft`, and **only the "(you)" row** keeps the shadow +
  violet wash, so the eye lands there first. The empty state lost its shadow
  too. (`features/profile/ProfileBody.tsx`,
  `features/social/Leaderboard.tsx`)
- **D56 — Mono numerals reserved for comparative data.** The `.num` (JetBrains
  Mono, tabular) treatment was on every number in the app, including
  single-digit counters in pills and discs. That reads as data-dashboard-y for
  numbers that aren't actually being compared. New rule:
  - **Keep mono** on: stats grid tiles, fractions (math + progress
    `X / Y` form), leaderboard XP across rows, RankPanel "75 / 150 XP," the
    celebration hero "+45" count-up, lesson grid axis labels.
  - **Drop mono** on: header streak chip, level disc, RankPanel "Lv N," coin
    chip, lesson header XP/streak chips, home freeze count, leaderboard rank
    badges (single digit), celebration streak chip, chapter banner number disc,
    medallion stack badge, store price label.
  The chrome now reads as friendly; real comparative data still gets the
  treatment it earns. (`components/AppHeader.tsx`,
  `features/profile/LevelBadge.tsx`, `features/economy/CoinChip.tsx`,
  `features/lesson/LessonHeader.tsx`, `features/course/HomePage.tsx`,
  `features/social/Leaderboard.tsx`, `features/habit/CelebrationScreen.tsx`,
  `features/course/ChapterBanner.tsx`, `features/profile/Medallion.tsx`,
  `features/economy/StorePage.tsx`)
