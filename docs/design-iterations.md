# Design Iterations — Test Feedback

> Issues surfaced from live testing sessions. Each entry has a severity, category, and enough context to act on.
> Companion to [`docs/bugs.md`](bugs.md) (code bugs) and [`docs/issues.md`](issues.md) (open decisions).
>
> **Status key:** `open` · `in-progress` · `done` · `deferred`
> **Category:** `auth` · `interaction` · `content` · `visual` · `ux` · `scope`

---

## Test Session 1 — 2026-06-23

Tester: caiiris1011

---

### T1-01 — Account creation should send a confirmation email

- **Status:** done · 2026-06-23
- **Category:** auth
- **Severity:** high (trust + security)
- **Description:** After registration, no email is sent to verify the address. A user can sign up with a typo'd or fake email and never know. Firebase supports email verification out of the box (`sendEmailVerification`).
- **Fix applied:**
  - `sendEmailVerification(firebaseUser)` is now called at the end of `registerUser` in `src/features/auth/userService.ts` (fire-and-forget; failures are logged but don't block signup).
  - `EmailVerificationBanner` component added at `src/components/EmailVerificationBanner.tsx` — shown app-wide via `App.tsx` when `user.emailVerified` is false. Includes a "Resend" button and a dismiss control.
- **Remaining / open items:** Rate-limit testing, verification-link expiry flow, and multi-device reload still deferred to stress-test pass (T1-01-stress).
- **Dev-mode decision (2026-06-23):** The banner is suppressed when `import.meta.env.DEV` is true (i.e. local Vite dev server). Firebase sends verification emails automatically via Google's servers — no SMTP setup required — but during local testing the registered email may be a dummy address and the banner would be noise. The banner will appear as intended in the production build.

---

### T1-02 — Die faces are flat and tapping feels weird; needs 3D treatment

- **Status:** done · 2026-06-23
- **Category:** interaction · visual
- **Severity:** high (core UX — die is the central object in Lesson 1)
- **Description:** The current die faces were SVG squares with dots — flat and abstract.
- **Fix applied:**
  - `Die` illustration fully redesigned (`src/components/illustrations/Die.tsx`) as an isometric 3-face SVG: ivory front face with dots, lighter parallelogram top face, darker parallelogram right face, and a subtle ground shadow ellipse. Reads unmistakably as a physical die.
  - `TapOutcomes` die buttons (`src/features/lesson/interactions/TapOutcomes.tsx`) enlarged, given physical `box-shadow` depth, and spring-animated with `whileTap={{ scale: 0.91, y: 2 }}` so pressing them feels like pressing a real button/die.

---

### T1-03 — "P(rolling an even number)" problem needs an interactive die

- **Status:** done · 2026-06-23
- **Category:** interaction · content
- **Severity:** high (pedagogically central)
- **Description:** The even-number fill-fraction problem had no visual scaffolding — learners had to count even faces in their head.
- **Fix applied:**
  - Added `showDieContext?: boolean` to `FillFractionVariant` (types and lesson content updated).
  - When enabled (`even-d6` variant), a `DieContext` widget renders above the fraction inputs: 6 tappable 3D die faces that the learner can tap to highlight; a live counter ("3 faces highlighted — favorable: 3 / 6") helps them fill in the numerator before typing.
  - Files: `src/content/types.ts`, `src/features/lesson/interactions/FillFraction.tsx`, `src/content/lessons/01-what-is-probability.ts`.
- **Remaining:** Full drag-to-zone interaction deferred as a larger interaction spec extension.

---

### T1-04 — Repeated wrong answers should flash on each attempt, not just the first

- **Status:** done · 2026-06-23
- **Category:** interaction
- **Severity:** medium
- **Description:** Wrong-answer feedback (shake + rose flash) only fired on the first wrong attempt; `feedbackState` stayed `'wrong'` so no animation re-triggered.
- **Fix applied:**
  - Added `wrongTick: number` to `SlotState` (`useSlotState.ts`) — increments on every `WRONG` dispatch.
  - Threaded `wrongTick` through `InteractionProps`, `ProblemSlotView`, `LessonPlayer`, and `LessonFooter`.
  - `LessonFooter` keys the wrong-feedback `<motion.div>` on `` `wrong-${wrongTick}` `` so `AnimatePresence` remounts and replays the shake each time.
  - `GridEvent` rose flash `useEffect` now depends on `wrongTick` instead of `feedbackState` — fires on each new wrong submission.

---

### T1-05 — "Roll two dice" page needs a live simulation / something to click

- **Status:** done · 2026-06-23
- **Category:** content · interaction
- **Severity:** high (engagement)
- **Description:** The two-dice grid was a static 6×6 tap grid with no live feedback.
- **Fix applied:**
  - Added `simulationEnabled?: boolean` to `GridEventVariant` (types + lesson content — enabled on both `sum-seven` and `sum-six` variants).
  - `DiceSimulator` component added inside `GridEvent.tsx`: a "Roll the dice!" button that animates two dice through 8 random tumbling frames at 80ms intervals, then settles on a final roll and shows the sum. Uses `AnimatePresence` + `Die` illustrations with `drop-shadow-md`.
  - Files: `src/content/types.ts`, `src/features/lesson/interactions/GridEvent.tsx`, `src/content/lessons/01-what-is-probability.ts`.

---

### T1-06 — "Which is more likely?" problem has no visual

- **Status:** done · 2026-06-23
- **Category:** content · visual
- **Severity:** medium
- **Description:** The multiple-choice question showed plain text options with no visual reference to the probability counts.
- **Fix applied:**
  - Extended `MultipleChoiceVariant` with `context?: string` (shown as a muted hint card above the options) and `subtext?: string` per option.
  - `MultipleChoice.tsx` now renders the `context` blurb and each option's `subtext` in a smaller weight below the label.
  - Both `seven-vs-two` and `seven-vs-twelve` variants updated with a "Use the grid above to count" context blurb and `"? ways out of 36"` subtexts that prompt the learner to cross-reference the grid before choosing.
  - Files: `src/content/types.ts`, `src/features/lesson/interactions/MultipleChoice.tsx`, `src/content/lessons/01-what-is-probability.ts`.

---

---

## Test Session 2 — 2026-06-23

Tester: caiiris1011

---

### T2-01 — Need a back button in the lesson player

- **Status:** done · 2026-06-23
- **Category:** ux · interaction
- **Severity:** high
- **Description:** There is no way to go back and review a previous slot during a lesson. The only exit is the ✕ button which leaves the lesson entirely.
- **What to do:**
  - Add a `←` back chevron to `LessonHeader` that decrements a local `viewSlotIndex` without touching Firestore progress.
  - When viewing a past slot (`viewSlotIndex < slotIndex`), render it read-only with a "Next →" footer button to re-advance the view.
  - Prevent going back past slot 0.

---

### T2-02 — "Use the grid above" context reference doesn't exist

- **Status:** done · 2026-06-23
- **Category:** content · ux
- **Severity:** high
- **Description:** The "Which is more likely?" multiple-choice variants say "Use the grid above to count" but the 6×6 grid is on a different slot — learners can't see it when answering.
- **What to do:**
  - Add a `gridReference` field to `MultipleChoiceVariant` containing a compact read-only version of the relevant grid.
  - Render a collapsible "View grid" toggle panel in `MultipleChoice.tsx` that shows/hides this reference.
  - Populate the field on the two `which-more-likely` variants in lesson 1.

---

### T2-03 — Profile should include a progress/activity grid

- **Status:** done · 2026-06-23
- **Category:** visual · ux
- **Severity:** medium
- **Description:** The profile has no visualisation of learning over time — just aggregate counts. A GitHub-style contribution grid (days active over the past N weeks) would make progress feel tangible.
- **What to do:**
  - Add `activityDates: string[]` (YYYY-MM-DD) to `UserProfile` and `userService` initial doc.
  - In `habitService.applyAttemptOutcome`, append today's date via `arrayUnion`.
  - Build an `ActivityGrid` component: 16 weeks × 7 days, cells coloured by activity presence.
  - Add to `ProfilePage` below the stats section.
- **Note:** shadcn does not ship a contribution-grid component; build custom.

---

### T2-04 — Trophies and achievements on profile

- **Status:** done · 2026-06-23
- **Category:** visual · engagement
- **Severity:** medium
- **Description:** The Milestones section only shows earned trophies; locked ones are invisible, so there's no sense of what to work toward. The trophy cards are also small and plain.
- **What to do:**
  - Enhance `MilestonesRow` to show ALL milestone thresholds — earned ones highlighted, locked ones greyed out with their goal ("Streak 7 days").
  - Show the next unearned milestone prominently as a progress target.
  - Rename section to "Trophies" for personality.

---

## Lessons 2-4 build — 2026-06-23

> Built Lessons 2 (law of large numbers), 3 (counting gets hard), and 4 (conditional probability / Monty Hall). Scope chosen with the owner: "up to Monty Hall." Lessons 5-6 stay coming-soon stubs. `npm run verify` 89/89, production build 287 KB gz (under the 300 KB budget).

### Design choices

- **Two new interaction kinds, not five-kinds-only.** The three payoff moments (LLN convergence, birthday paradox, Monty Hall) are simulations, which is the PRD's whole premise ("every claim is verifiable by simulation"). Forcing them into multiple-choice would mean telling the punchline instead of showing it. Added `simulate-proportion` and `monty-hall` (now 7 kinds). `docs/ui-stack.md` already anticipated this ("custom SVG/canvas for simulations in Lesson 2+") and `spec-interactions.md` says to extend the union per new lesson. See `docs/issues.md` I028.
- **Engagement gate, not a fake right/wrong.** A simulation has no wrong answer, so each new kind grades on *engagement*: the renderer emits a non-null answer only once the learner has run `minTrials` (200) / `minGames` (100). Check stays disabled until then, so there is no synthetic "wrong" state and the no-bail-out rule (D55) holds by construction. The `feedbackByWrongValue.incomplete` hint is therefore mostly unreachable in normal play (parallel to B045) but is kept as a safety net.
- **One shared engine.** Both new renderers share `ProportionChart` (dependency-free inline SVG, no chart lib per ui-stack) and `src/lib/simulations.ts` (pure, unit-tested trial generators). The Monty Hall logic reduces to "switch wins iff the first pick missed the car," verified by a test that the switch rate lands near 2/3 over 6000 games.
- **`simulate-proportion` is scenario-driven** (`coin`, `die-six`, `birthday`) so one renderer powers both Lesson 2 (coin/die convergence to 0.5 / 1/6) and Lesson 3 (rooms of 23 or 30 birthdays converging to ~50.7% / ~70.6%). The per-trial visual swaps per scenario; the convergence engine and chart are shared.
- **`monty-hall` is one slot, two modes:** hand-play rounds (pick a door, host reveals a goat, switch or stay) to build intuition, plus an autopilot batch that races always-switch vs always-stay win rates toward the 2/3 and 1/3 reference lines.
- **Two new illustrations** in the existing geometric family: `Door` (closed / goat / car, palette matched to `Die`) and `Calendar` (birthday teaser). Extended `IllustrationRef.kind` with `'doors'` and `'calendar'` and added the matching branches in `ConceptSlotView`.
- **Copy authored, not stubbed.** Per the owner's call, all prompts, feedback, and `explanation` strings were written in Lesson 1's voice under `ui-directive.md` (no em dashes, sentence case, plain verbs) rather than left as `FEEDBACK_TODO`. This is a deliberate departure from architecture §12.6; logged in `docs/issues.md` I029 for owner review.
- **Replay support.** Every standard problem slot ships 2 variants (matching Lesson 1); the bespoke `monty-hall` slot ships 1.

### Pedagogical arc

- **L2** anchors the theoretical value (fill-fraction), shows a real run is bumpy, then the convergence sim makes the law of large numbers visible, and closes by motivating simulation as the bridge to L3.
- **L3** walks small counting to explosion (combinations), then the birthday sim delivers the "only 23 people" surprise, framed around counting pairs and the complement.
- **L4** sets up the 1/3 vs 2/3 split, lets the Monty Hall sim prove switching wins 2/3, then locks it in with comprehension and fraction checks.

### Wiring + ops

- Touched the three exhaustive switches the type system guards: `checkAnswer.ts`, `ProblemSlotView.tsx` dispatch, and the `LessonPlayer.tsx` hint lookup. Extended `AttemptPayload` with `{ trials }` and `{ games }`, `assertLessonInvariants` with the new validation, and `audit-feedback.ts` with the new kinds.
- Flipped the lessons live: updated `REMOTE_CONFIG_DEFAULTS` (cold-start) and published Remote Config template **version 2** via the Firebase MCP so the running app shows all four lessons. Roll back to version 1 to take L2-4 down without a redeploy.

### Watch items

- **Bundle budget.** First-load JS is now 287 KB gz, close to the 300 KB ceiling (D64). The next heavy addition should be code-split (route-level `lazy`) or this breaks the budget. Tracked as a risk, not yet an issue.
- **Mid-simulation progress is ephemeral.** Trial counts live in component state, not Firestore. Closing mid-sim resets the counter on resume (the slot was never marked correct, so `slotIndex` did not advance). Consistent with the spec's key-based slot reset; acceptable for MVP.

---

---

## Test Session 3 — 2026-06-23

Tester: caiiris1011

---

### T3-01 — Calendar / study scheduler

- **Status:** done · 2026-06-23
- **Category:** feature · ux · scope
- **Severity:** high (study-prep use case)
- **Description:** Students using the app for test prep or structured study need a way to schedule study sessions, mark future lesson targets, and review what's coming up. A calendar gives the app a planning dimension beyond the daily streak.
- **What to do:**
  - New `/schedule` route and `SchedulePage` component.
  - Firestore subcollection `users/{uid}/studyEvents/{eventId}` — fields: `title`, `date` (YYYY-MM-DD), `lessonId?`, `notes?`, `completed`, `createdAt`.
  - Month-grid calendar UI (built from scratch, no extra dep): prev/next navigation, today highlighted, event dots on days that have events, selected day shown below.
  - Event list for selected day: title, optional lesson link chip, notes, check off / delete.
  - "Add event" dialog: title, date, optional lesson link, optional notes.
  - Add "Schedule" nav item (📅) to `AppShell`.
  - Update Firestore rules to allow `users/{uid}/studyEvents` CRUD for authenticated owner.
- **Future AI hook:** `studyEvents` collection is the natural input for a personalized study-plan generator — AI reads lesson progress + upcoming test date and writes a dense of `studyEvents` entries as a plan. The data model is intentionally compatible.

---

## Longer-horizon issues

---

### T1-07 — Error messages are too generic; need custom copy

- **Status:** done · 2026-06-24
- **Category:** ux · content
- **Severity:** medium
- **Description:** Current error messages ("Something went wrong. Please try again.") were developer-facing strings, and raw Firebase codes (`auth/...`, `Sign-in failed (auth/popup-blocked)`) leaked into the UI. They needed to be warm, specific, and actionable, consistent with the app's tone.
- **Fix applied:**
  - New single source of truth at `src/lib/errors.ts`: an `ERROR_COPY` catalog grouped by domain (`auth`, `profile`, `progress`, `economy`, `schedule`, `email`, `social`, `system`), plus an `ErrorKind` taxonomy (`validation` / `auth` / `permission` / `transient` / `system`) documenting how each error should surface.
  - `authErrorFromFirebaseCode()` maps every handled `auth/*` code to one warm, typed `{ code, message }`; the raw code now stays in `console.error` for debugging instead of reaching the learner. The `AuthError` / `AuthErrorCode` / `AuthResult` types moved here (their natural home) and are re-exported from `userService.ts` so existing imports are unchanged.
  - All call sites repointed at the catalog: `userService.ts` (auth + profile), `LessonPlayer.tsx` (save-answer / progress / completion / partial-XP / profile-unavailable / not-ready), `StorePage.tsx` + `coinService.ts` (purchase / equip / chest), `SchedulePage.tsx` + `ScheduleReminder.tsx` (save / update / delete / time-format validation), `EmailVerificationBanner.tsx`, `FollowButton.tsx` + `socialService.ts` (follow / unfollow / kudos, which now never echo a raw Firestore message), and `ErrorBoundary.tsx` (full-page system copy).
  - `src/lib/errors.test.ts` guards the directive (no em/en dashes, no exclamation marks, no leaked `auth/*` codes, all strings non-empty/trimmed) and the mapper (known codes map correctly, unknown/undefined fall back to the generic). `npm run verify` 172/172.
- **Remaining / open items:** Treatment is currently toast-or-inline as each call site already used; a dedicated full-page treatment exists only at the error boundary. Per-field inline rendering for form-validation errors (vs the current toast on the schedule time field) is a small follow-up if validation copy grows. The catalog is plain strings, ready for i18n extraction later.

---

### T1-08 — Design is too plain; needs personality

- **Status:** open
- **Category:** visual
- **Severity:** medium (pre-launch)
- **Description:** The current design is functional but reads as a default shadcn/Tailwind app. It lacks the visual energy appropriate for a high-school audience learning probability through play.
- **Ideas to explore:**
  - **Illustration system** — commission or design a consistent set of probability-themed illustrations (dice, coins, cards, probability trees) that appear between slots and on the home screen.
  - **Color** — the indigo primary is safe but cold. Consider a warmer accent or a gradient brand mark.
  - **Typography** — Inter is clean but neutral. A display font for headings (`Lesson 1: What is Probability?`) would add character.
  - **Motion** — slot transitions could be more expressive (cards flipping, dice tumbling) rather than simple slide-in.
  - **Celebration** — the confetti burst is good; add a sound cue option (opt-in per OS audio settings).
  - Tie into `docs/ui-directive.md` — any changes need to update that document first.

---

### T1-09 — Expand target audience; add engagement features

- **Status:** open
- **Category:** scope
- **Severity:** low (roadmap)
- **Description:** Currently targeting high schoolers learning probability. Expanding scope could mean:
  - **Age range:** Middle school (simpler language, more animation) or early college (more rigorous notation).
  - **Social features:** Leaderboards, share-a-streak, challenge-a-friend — would require significant backend work and moderation policy.
  - **More content:** Statistics, combinatorics, Bayesian reasoning — each needs its own lesson arc.
  - **Accessibility:** Screen reader support beyond aria-labels (full keyboard navigation through interactions, VoiceOver-tested flows).
  - **Localization:** i18n scaffolding if international users are a target.
- **Note:** Each of these is a PRD-level decision. Log as future issues in `docs/issues.md` before scoping.

---

## Summary table

| ID | Issue | Category | Severity | Status |
| --- | --- | --- | --- | --- |
| T1-01 | Email verification on signup | auth | high | **done** |
| T1-02 | 3D die illustration + tap feel | interaction · visual | high | **done** |
| T1-03 | Interactive die context for even-number problem | interaction · content | high | **done** |
| T1-04 | Wrong-answer flash doesn't repeat | interaction | medium | **done** |
| T1-05 | Two-dice page needs live simulation | content · interaction | high | **done** |
| T1-06 | "Which is more likely?" needs visuals | content · visual | medium | **done** |

---

### 2026-06-23 — Test Session 2 immediate issues resolved (T2-01 through T2-04)

| ID | Fix summary |
| --- | --- |
| T2-01 | `viewSlotIndex` local state in `LessonPlayerInner`; `←` chevron in `LessonHeader`; review mode shows read-only slot + "Next →" footer |
| T2-02 | `gridReference` field on `MultipleChoiceVariant`; `ReferenceGrid` + collapsible "View grid" toggle in `MultipleChoice.tsx`; populated on both `which-more-likely` variants |
| T2-03 | `activityDates: string[]` added to `UserProfile` and `registerUser`; `arrayUnion(today)` written in `applyAttemptOutcome`; `ActivityGrid` 16-week heatmap component on `ProfilePage` |
| T2-04 | `MilestonesRow` rebuilt: shows all 6 milestone thresholds (earned = amber trophy, locked = grey lock); next-target progress banner at top; section renamed "Trophies" |
| T1-07 | Generic error messages need custom copy | ux · content | medium | **done** |
| T1-08 | Design too plain; needs personality | visual | medium | open |
| T1-09 | Audience expansion + engagement features | scope | low | open |
| T2-01 | Back button in lesson player | ux · interaction | high | **done** |
| T2-02 | "Use the grid above" reference panel | content · ux | high | **done** |
| T2-03 | Profile activity/progress grid | visual · ux | medium | **done** |
| T2-04 | Trophies — show all milestones, locked + earned | visual · engagement | medium | **done** |

---

### 2026-06-23 — Test Session 3 (T3-01)

| ID | Fix summary |
| --- | --- |
| T3-01 | Full study calendar at `/schedule`: month grid with event dots, day event list, add/check-off/delete events, upcoming strip, "Link to lesson" option. Firestore `studyEvents` subcollection with owner-only CRUD rules (deployed). AI study plan hook documented in architecture — `studyEvents` collection is the natural write target for a generated plan. |
| T3-01 | Calendar / study scheduler | feature · ux | high | **done** |

---

## Design overhaul (addresses T1-08 "design too plain")

> Multi-category overhaul toward a colorful-but-disciplined look (refs: Brilliant,
> Duolingo, Khan). Owner direction: color lives in illustrations/nodes, chrome
> stays calm; build extensibly. `npm run verify` 92/92; entry bundle ~282 KB gz.

### Category 1 — Design foundation (done · 2026-06-23)

- Three-layer token system in `src/index.css` (primitive ramps → semantic →
  `@theme`), built to extend; JS mirror in `src/lib/theme.ts`.
- Brand moved to Pascal Violet `#6B4EFF`; warm plum neutrals; six-accent ramp.
- Type: Bricolage Grotesque (display) + Inter (body) + JetBrains Mono (data).
- Signature: Pascal's-Triangle brandmark (`src/components/Brandmark.tsx`).
- Rounder radius (`0.75rem`), `--btn-depth` tactile token, `shadow-soft/-pop`.
- Route-split heavy routes (`React.lazy`) to keep first load lean; D64 budget
  relaxed to a soft ≤350 KB gz with load-time as the real gate.

### Categories 2 + 3 — Icons, illustrations & course path (done · 2026-06-23)

- Custom filled `FlameIcon` / `BoltIcon` (`src/components/icons/StatIcons.tsx`)
  replace the bare 🔥 / ⚡ emoji in Home, `LessonHeader`, `CelebrationScreen`.
- Per-lesson node glyphs (`LessonGlyph.tsx`: die/coin/cards/door/bars/curve) +
  presentation-only `lessonVisuals.ts` map (accent + glyph, with index fallback).
- `LessonNode.tsx`: tactile colored disc with locked / available / current /
  in-progress / completed states, depth shadow + press animation, replay dialog.
- `CoursePath.tsx`: vertical journey with accent-colored connectors; replaces the
  flat lesson-card grid on Home. `LessonCard.tsx` removed.
- Home restyled: stat chips with the new icons, "Your path" section, lighter
  hero card.

### Category 4 — Tactile buttons (done · 2026-06-23)

- shadcn `Button` default variant is now chunky: a solid `--primary-deep` bottom
  edge (`--btn-depth`) that compresses on press (translate + shadow collapse).
  Applies app-wide (lesson CTA, hero, dialogs) for one consistent press feel.
- `lg` size grew to a proper CTA height (h-11, semibold) for the lesson footer
  and celebration actions.

### Category 5 — Lesson player + illustration recolor (done · 2026-06-23)

- Recolored in-lesson illustrations onto the new palette: Monty Hall car (violet),
  Calendar marker + Monty Hall chart (brand green `#22C55E`), card suits (coral +
  ink), `DefaultAvatar` now draws from the accent ramp.
- Fixed colors that broke when tokens moved from HSL to hex: `hsl(var(--primary))`
  chart/strokes and tap-target shadows now use valid `var(--primary)` /
  `color-mix`.
- Concept prompts use the display face (2xl bold, balanced); coin pair is now
  two-tone (violet + amber); correct/wrong feedback and tap states harmonized to
  the green/coral tokens. Replaced a stray em dash in fraction copy (directive).
- **Deferred:** problem-slot prompts still use the prior `text-xl` weight (left
  as the lower tier vs concept statements); remaining `emerald-*`/`rose-*`
  Tailwind utility classes in the sims read fine and were left as-is.

### Category 6 — Celebration & gamification (done · 2026-06-23)

- Celebration screen: XP payoff now pairs the custom `BoltIcon` with mono
  numerals (`.num`); milestone + next-lesson cards use `rounded-2xl shadow-soft`;
  the "Back to home" CTA inherits the tactile `lg` button.
- Profile `MilestonesRow`: the next-target 🔥 emoji is replaced with `FlameIcon`,
  count set in mono.

### Category 7 — Consistency sweep (done · 2026-06-23)

- Profile `StatsGrid`: values in mono (`.num`), cards `rounded-2xl shadow-soft`.
- Schedule: completed dots + checkbox use the brand `--success` green (was
  Tailwind `emerald-500`).
- Auth (login + register): brandmark + display wordmark lockup, cards
  `rounded-2xl shadow-soft`, submit buttons promoted to the `lg` tactile CTA.
- All changes presentation-only (no services/hooks/content/data touched), to
  stay clear of concurrent work. `npm run verify` green; entry bundle ~282 KB gz.

---

## Lesson 1 pedagogy redesign — 2026-06-23

Triggered by owner feedback that Lesson 1 read as "fact, task, fact, task" rather than a cohesive lesson, with the formula arriving before any motivating question and key vocabulary (outcome / sample space / event) used but never crisply introduced. Pedagogical model: real probability textbooks and Khan Academy walkthroughs, pose-then-formalize structure, short proof beats where they earn their place. Lesson length cap relaxed (owner-approved); L1 is now ~14 slots / ~7 minutes.

### Content model — enriched concept slot (D75)

- `ConceptSlot` gains three optional fields: `title` (short heading), `body: string[]` (paragraphs), and `example: { title?, steps[] }` (worked example or short derivation). All optional, so the prior thin shape (`prompt + illustration`) still renders the legacy centered one-liner — Lessons 2-4 stay visually intact until each is converted on its own pass.
- Worked-example steps support a single inline affordance: `{a/b}` segments render via a tiny CSS-only `<Fraction>` component (`src/components/Fraction.tsx`) for the stacked textbook look. No KaTeX, no markdown.
- `assertLessonInvariants` validates the new fields: non-empty title when present, no empty paragraphs in `body`, non-empty `example.steps`.

### Renderer — `ConceptSlotView`

- Branches once on "has teach fields?" If yes: left-aligned reading flow with the title in the display face (2xl tracking-tight), the `prompt` as the lede (lg medium), `body` paragraphs at a comfortable measure (max-w-prose, muted), and the worked example as a bordered mono-numeric ordered list inside a `bg-muted/30` card. If no: the prior centered one-liner. Both routes use the existing "Got it" CTA in the player footer (no `LessonPlayer` change needed).
- The `{a/b}` parser is a 12-line regex that splits each step into text + `<Fraction>` segments; no library added.

### Lesson 1 — three-act arc

| Act | Slots | Pedagogical job |
| --- | --- | --- |
| 1 — one random thing | `hook` → `sample-space-def` → `sample-space` (tap-outcomes) → `equally-likely` → `single-outcome` (fill-fraction) | Pose the question before the formula. Introduce **outcome** and **sample space** as named building blocks, then enforce them by tapping. Surface the equally-likely assumption so Lesson 2 has a hook to break. Apply the formula on the simplest case before events. |
| 2 — events | `event-def` → `define-event` (tap-event) → `compute-probability` (fill-fraction) → `reduce` | Define **event** as a set of outcomes, then identify and count it, then divide. Fixes the prior order tangle (computing P(even) before "event" was defined). The `reduce` slot carries the first proof beat: `{3/6} = {(3/3)/(6/3)} = {1/2}`. |
| 3 — two dice | `two-dice-intro` → `all-sums-equal` → `grid-sum` (grid-event) → `which-more-likely` (multiple-choice) → `wrap` | Derive 6 × 6 = 36 via the multiplication principle (second proof beat, worked-example block). Plant the naive intuition ("all sums equally likely?") so the reveal lands. Existing grid + multiple-choice interactions carry the payoff. |

All copy authored in Lesson 1's existing voice under `docs/ui-directive.md` (no em dashes, sentence case, no banned vocabulary, no filler subtitles). Every problem slot keeps 2 variants for replay.

### Tests + specs

- `01-what-is-probability.test.ts`: slot-count assertion updated (7 concept / 6 problem / 1 wrap); two new invariant tests reject empty `example.steps` and empty `body` paragraphs; one structural test asserts the redesigned `equally-likely` / `reduce` / `two-dice-intro` slots all carry the enriched fields.
- `spec-content-model.md` documents the new optional `ConceptSlot` fields and the `{a/b}` template convention.
- `spec-lesson-player.md` documents the dual concept-slot rendering (legacy one-liner vs enriched teach).

### Watch items

- Two visual patterns for concept slots coexist (legacy one-liner on L2-5, enriched teach on L1 + new L3) until L2/L4/L5 are converted on their own passes. Transitional state; renderer branch is one `if (hasTeach)`.
- Lesson 1 `estimatedMinutes` bumped from 4 to 7. Field is informational only and does not gate anything.
- Authors can now make concept slots arbitrarily long. Invariants only check non-emptiness, not length; editorial discipline is the cap. Add a soft length cap later if it becomes a real problem.
- `<Fraction>` covers the cases Lesson 1 needs (stacked numerator/denominator). If a future lesson needs subscripts, exponents, or sigma, extend the template or escalate to KaTeX rather than creeping features into the regex parser.

---

## New L3 — Counting carefully (combinatorics) — 2026-06-23

Triggered by a gap surfaced during the L1 pedagogy review: the existing L3 (birthday paradox) *uses* combinatorial reasoning — "(4 × 3)/2 = 6", "23 people form 253 pairs", `P(no shared birthday) = 365/365 × 364/365 × …` — but never *teaches* it. The student is asked to take three unnamed tools (multiplication principle, combinations, complement counting) on faith. The fix: insert a dedicated combinatorics lesson before the birthday lesson. Recorded as D76.

### Course shuffle

| New # | id | What it teaches | Source |
| --- | --- | --- | --- |
| L1 | what-is-probability | Sample space, events, two dice | unchanged |
| L2 | law-of-large-numbers | Why simulation works | unchanged |
| **L3** | **counting-carefully** | **Multiplication, addition, permutations, combinations, complement** | **NEW** |
| L4 | counting-gets-hard | Birthday paradox | was L3, `number: 4` |
| L5 | conditional-probability | Monty Hall | was L4, `number: 5` |
| L6 | distributions | Coming-soon stub | was L5, `number: 6` |
| (dropped) | central-limit-theorem | Was a coming-soon stub | deleted to keep the course at 6 |

### Lesson 3 — pedagogical arc (14 slots, ~7 minutes)

| Slot | Kind | Job |
| --- | --- | --- |
| `hook` | concept (rich) | "A 5-card hand has 2.5M outcomes. Count without listing." |
| `multiplication-principle` | concept (rich + worked example) | m × n × … for sequential independent choices. Outfits worked through. |
| `multiply-problem` | multiple-choice ×2 | 4 entrees × 3 desserts; license-plate prefix 26 × 10³. |
| `addition-principle` | concept (rich + worked example) | Either-or, mutually exclusive: add not multiply. Bus or train. |
| `add-vs-multiply` | multiple-choice ×2 | Discriminator — the most common mistake. |
| `permutations` | concept (rich + worked example) | 3! arrangements of ABC listed. Generalize to nPk. |
| `permute-problem` | multiple-choice ×2 | 4! race orders; 5 × 4 × 3 podiums from 5 runners. |
| `combinations` | concept (rich + worked example) | **The proof beat the prior L3 was missing.** 12 ordered pairs / 2 = 6 unordered. nCk = `{n!/(k!(n-k)!)}`. |
| `combine-problem` | multiple-choice ×2 | 5C3 ice-cream trios; 6C2 handshakes. |
| `order-or-not` | concept (rich) | "Swap two items: same outcome?" rubric for ordered vs unordered. |
| `which-is-it` | multiple-choice ×2 | Lottery ticket (unordered); basketball starting five (unordered). |
| `complement` | concept (rich + worked example) | `P(at least 1 head in 3 flips) = 1 − {1/8} = {7/8}`. Names the trick the birthday lesson needs. |
| `complement-problem` | fill-fraction ×2 | `P(at least one six in two rolls) = 11/36`; `P(at least one head in 4 flips) = 15/16`. |
| `wrap` | wrap | Segue into the birthday paradox: "Twenty-three people, 253 pairs." |

All copy authored in Lesson 1's voice under `docs/ui-directive.md` (no em dashes, sentence case, no banned vocabulary, no filler subtitles). Every problem variant carries full `feedbackByOption` / `feedbackByWrongAnswer` and an `explanation`.

### Engineering changes (mechanical, low-risk)

- New files: `src/content/lessons/03-counting-carefully.{ts,test.ts}`.
- Renamed files (lesson ids unchanged so resume/replay/progress docs are unaffected): `03 → 04-counting-gets-hard.{ts,test.ts}`, `04 → 05-conditional-probability.{ts,test.ts}`, `05 → 06-distributions.ts`. Each file's exported symbol name and `lesson.number` were bumped to match.
- Deleted `src/content/lessons/06-central-limit-theorem.ts` (the CLT coming-soon stub).
- New course-path glyph: `'tree'` in `src/features/course/LessonGlyph.tsx` (root node branching twice into four leaves — the multiplication principle's canonical visualization). `lessonVisuals.ts` maps `counting-carefully → { accent: 'green', glyph: 'tree' }`; the orphaned `central-limit-theorem` entry was removed; Distributions moved to the coral accent so its slot at L6 reads visually distinct.
- `src/content/index.ts` rewritten to import the new L3 and drop the CLT lesson; exports stay `lesson1..lesson6`.
- `src/features/flags/remoteFlagsConfig.ts` adds `'counting-carefully'` to the default `available_lesson_ids` so the new L3 ships playable on cold start. Remote Config template push to follow (same launch pattern as Lessons 2-4).
- `src/content/lessons/02-law-of-large-numbers.ts` segue updated: wrap now points to `'counting-carefully'`; the "next, the counting itself becomes the wall" line was rewritten to set up the *tools* before the wall ("the counting tools that make the formula side work when the sample space is too big to list"). One forward-reference inside an L2 problem ("next lesson") was also rephrased to "in the birthday lesson coming up" so the foreshadow pays off in L4 instead of misfiring at L3.

### Tests

- New `03-counting-carefully.test.ts`: invariants pass, slot shape (7 concept / 6 problem / 1 wrap), all four counting tools present by id, the five enriched concept slots carry title + body + worked example, wrap segues to `counting-gets-hard`.
- `01-what-is-probability.test.ts` catalog test: slices shifted (1-5 ship content, 6 is the sole coming-soon stub) plus a new test pinning the exact id order and number sequence so any future renumbering fails loudly.
- Renamed test files now import the renamed symbols (`lesson4`, `lesson5`).

### Watch items

- L4 (birthday) `explanation` strings were authored before combinatorics was a named topic. They are still correct, but pedagogy is now redundant in spots ("23 people form 253 pairs" is now backed by `23C2` being a named tool). Tightening that copy is a follow-up L4 review pass, not a blocker.
- L5 (Monty Hall) is unchanged in content; only number, file name, and export symbol moved. Its segue still points to `distributions`, which remains the sole coming-soon stub at L6 (I015).
- The renaming pass touched many files but did not change any lesson `id`, so persisted Firestore progress (`/users/{uid}/lessonProgress/{lessonId}`) carries over cleanly for any test user.
- Future renumbering should be avoided once real learners are on the system. The unique key is the id; the `number` field is purely presentational.

---

## 3D coin — flip-as-signature on the tap-coin variant — 2026-06-23

Tiny owner request late in the L1/L3/L4/L5 pass: *"get a 3d coin in the tap every face of this coin, in the bottom right. it just stays there. if i click on it, it flips over to show the other face."*

> **Un-mounted same-day, 2026-06-23.** Owner reviewed the live screen and called the combination confusing — a literal 3D coin in the corner next to a "tap every face of this coin" prompt that pointed at flat H/T tiles. The fix was to redesign the question itself (see "Sample-space slot — tap-faces → multiple-choice 'how large'" entry below); the 3D coin no longer has a contextual home in L1. The component file (`src/components/illustrations/Coin3D.tsx`) is preserved for future use; only the mount in `TapOutcomes.tsx` was removed.

### Choice

Brand-violet two-tone metal coin, CSS-3D, click-to-flip. New component at `src/components/illustrations/Coin3D.tsx`. Was mounted in `TapOutcomes.tsx` only when `variant.source === 'coin'`, pinned `absolute bottom-4 right-4`, sized `w-16 h-16` (mobile) / `w-[72px] h-[72px]` (≥md).

### What it is, and what it isn't

It is **decorative**. It does not gate the answer state, doesn't appear in `feedbackState`, doesn't feed `onChange`. Tapping it is a moment of "just because" — the canonical fair coin sitting next to a lesson about a fair coin, available to fidget with.

The flip is the only interaction: click → spring `rotateY` between 0° and 180°. There is no idle motion. (Idle wobble was considered and rejected — the frontend-design skill explicitly flags ambient motion as one of the strongest AI-tells; the hover-lift micro-interaction on pointer devices is enough invitation.)

### Visual choices, deliberately not the defaults

The frontend-design skill named three AI-default looks. For a coin, the equivalents are casino-gold, US-mint silver, and the abstract dot-and-ring. All three were rejected.

- **Two-tone violet, not casino gold.** Heads is a lighter violet wash (`#B7A7FF → #4F36AB`), tails is the standard primary violet (`#8E76FF → #3A2A8C`). Both stay on the brand ramp so the coin reads as *minted for this app*, not transplanted from a Vegas asset library. The two-tone split is small but enough that the flip is legible from peripheral vision before the H / T glyph resolves — useful when the coin is in the corner and the learner is focused on the actual tap targets.
- **Bricolage display H / T, not a presidential silhouette.** The same display face the rest of Pascal uses. Heavy weight, tightened tracking, soft drop-shadow → stamped-letterform feel without literal embossing.
- **One milled inner ring, not a faux-engraved field.** The ring is the minimum signal for "coin" without filling the face with skeuomorphic noise.
- **Floor shadow lives outside the rotating layer.** Inside, the shadow would rotate with the coin and disappear at 90°. Outside, it stays on the floor while the coin spins above it — the cheap trick that sells the 3D illusion.

### Implementation

- `transformStyle: preserve-3d` on the rotating layer; two `backface-visibility: hidden` faces, the back rotated 180° at rest. When the parent rotates 180°, the back face's two transforms compose to identity and it shows upright.
- Spring on `rotateY`: `stiffness: 90`, `damping: 14`, `mass: 0.8` — a gentle overshoot for a satisfying "land". Hover springs (`y: -2`) and tap squash (`scale: 0.96`) use stiffer springs for snappier feedback.
- No 3D edge band. A real cylindrical edge would need many transformed slices and adds visual weight without payoff at this size; the spring flip carries the dimensionality on its own.
- Real `<button>` element, `aria-label` updates with the current side, focus-visible ring on the wrapper.

### Layout notes

- The tap-coin variant of `TapOutcomes` now reserves `pb-28` (112 px) bottom padding so the corner coin can never overlap the collected-tags row on narrow viewports. The d6 variant still uses `py-6`.
- The coin is pinned to the *interaction container's* bottom-right, not the viewport's. This is deliberate — `fixed` positioning would leave the coin floating over header/footer and other lessons; `absolute` keeps it scoped to the slot it belongs to.

### Tests

No unit tests for the coin itself — it's pure presentational chrome with no business logic. The interaction's existing TapOutcomes tests still pass (135/135 → unchanged total of 135 because no tests were added or removed; the coin renders without affecting the answer state).

### Files

- New: `src/components/illustrations/Coin3D.tsx` (~95 lines).
- Edit: `src/features/lesson/interactions/TapOutcomes.tsx` (added import, added `relative` + conditional `pb-28` to wrapper, mounted `<Coin3D>` on the coin variant).

---

## Two-dice derivation — flashcard mode (question front → derivation back) — 2026-06-23

Owner reviewed L1's `two-dice-intro` slot and flagged the existing `derivation.title` ("Why 6 × 6 = 36") as awkward — a backwards-looking restatement of arithmetic instead of a forward-looking pedagogical question. They requested two changes:
1. Reframe the derivation around the **sample space of two dice** rather than the multiplication arithmetic.
2. Make the derivation a **flippable flashcard** that starts as a question and reveals the answer on click.

### Fix

- **Reframed:** `title: 'Sample space of two dice'`. Steps rewritten in sample-space language ("First die: 6 outcomes …", "Each ordered pair (first, second) is one outcome of the joint experiment", "Total outcomes in the sample space: 6 × 6 = 36"). The arithmetic still lands on 36, but the framing matches the lesson's overall sample-space vocabulary.
- **Flashcard:** new optional `question?: string` field on `derivation` (D78). The `two-dice-intro` derivation now sets `question: 'How large is the sample space when you roll two fair dice?'`. The card flips on click: front shows the question with a violet "QUESTION" tab and a "Tap to reveal" hint; back is the existing amber "Derivation" tab + title + steps.

### Implementation notes

- New component: `src/features/lesson/DerivationCard.tsx`. Switches between static-card and flashcard rendering based on whether `question` is set.
- Same CSS-3D flip pattern as `Coin3D`: `transformStyle: preserve-3d` on the rotating layer, two `backface-hidden` faces, spring on `rotateY`. Both faces share a CSS grid cell (`col-start-1 row-start-1`) so the larger face sets the wrapper height — the surrounding lesson layout never reflows during a flip.
- Pre-existing inline `renderInline` helper in `ConceptSlotView` was extracted to `renderInlineMath` and exported from `src/components/Fraction.tsx`, so `DerivationCard` and `ConceptSlotView` share the same `{a/b}` → stacked-fraction parser. Behavior unchanged; just newly importable.
- `assertLessonInvariants` validates `derivation.question` is a non-empty string when present.
- Other lessons' derivations (L3 combinations, L4 birthday) do not set `question` and continue to render as static notebook pages — same shape, no migration.

### Tests

- `01-what-is-probability.test.ts` adds two cases: the `two-dice-intro` derivation has a `question` matching `/sample space.*two/i`, and `assertLessonInvariants` rejects an empty `derivation.question`. 164/164 tests pass.

---

## Sample-space slot — tap-faces → multiple-choice "how large" — 2026-06-23

Owner saw the live `coin` variant of the `sample-space` slot in L1 and flagged it as confusing: *"this is confusing. just ask how large is the sample space, or type in the sample space."* Three things were colliding on screen:

- The instruction said "tap every face of this coin" but pointed at two flat H/T tiles, not a coin.
- The decorative 3D coin in the bottom-right (just shipped earlier in the session) was *also* a tappable coin, with a different role.
- For a 2-outcome sample space, "tap each face once to list every outcome" is barely an interaction — the learner clicks twice and submits, with little to learn.

### Fix

Converted the `sample-space` problem slot from `tap-outcomes` to `multiple-choice`. Both variants now ask the same kind of question with concrete numeric answers:

| Variant | Question | Correct |
| --- | --- | --- |
| `d6` | "Roll one fair die. How large is the sample space?" | 6 |
| `coin` | "Flip one fair coin. How large is the sample space?" | 2 |

Each variant has four numeric options with targeted wrong-answer feedback (e.g. for the coin: 1 → "a coin can land more than one way", 4 → "that is two coins", 6 → "that is for a die"), and an `explanation` that names the sample space as a set ({1, 2, 3, 4, 5, 6} for d6; {H, T} for coin) so the "list it" pedagogy is preserved verbally even though the interaction itself no longer requires it.

### Trade-offs

- **Lost:** the tactile "tap each face" beat, which previously visualized the sample-space construction. The d6 illustration in the preceding `sample-space-def` concept slot still shows all six faces, so the visual idea survives. `tap-outcomes` is now unused in L1 — the interaction kind is preserved in the codebase for future use, but no shipped lesson currently mounts it.
- **Gained:** the slot now actually challenges the learner (multiple-choice with confusable distractors instead of a 2-tap-then-submit reveal), and it composes with the lesson's existing multiple-choice rhythm.
- **Side-effect:** the recently-added decorative 3D coin no longer has a host slot. Un-mounted in the same pass; see the "3D coin" entry above.

### Files

- `src/content/lessons/01-what-is-probability.ts` — slot rewritten.
- `src/features/lesson/interactions/TapOutcomes.tsx` — Coin3D import + mount removed; wrapper styling reverted to the pre-coin shape.
- L1 invariant test still mutates `variants[0].interactionKind = 'fill-fraction'` to verify the slot-vs-variant mismatch path; the test is unchanged because `'fill-fraction'` differs from the slot's new `'multiple-choice'` kind too.

---

## Curriculum skeleton — full roadmap scaffolded as locked stubs — 2026-06-24

Owner asked to "refactor the pages (the lessons)" toward the fuller probability sequence from [`curriculum-roadmap.md`](curriculum-roadmap.md): *"feel free to leave further lessons blank. lock them. don't change any content for now, but names/stuff are good."* Decision recorded as **D86**.

### What shipped

The whole 9-unit, ~51-lesson roadmap is now visible on the course path as locked preview nodes, sitting below the six live lessons. No shipped lesson content changed.

- **`src/content/lessons/roadmapStubs.ts`** (new) — every roadmap lesson as a `Lesson` with a real `title`/`blurb`, `slots: []`, `comingSoon: true`. Numbered 7…57 (continuing the live lessons) so "Lesson N" stays monotonic. One file with a `stub()` helper rather than ~51 tiny files.
- **`src/content/index.ts`** — appends `...roadmapStubLessons` after the six authored lessons.
- **`src/features/course/chapters.ts`** — adds nine unit chapters (Likelihood → Famous Distributions) after the three live chapters, which are left untouched.

### Why the live experience is unchanged

Audited every consumer that walks the lesson catalog:

- `nextRecommendedLesson` / `courseProgress` / `HomePage.allCompleted` / `HeroCard` all filter `!comingSoon` and look up by `id`, and the live five stay first in array order — so "Start here" and the X/total counter are identical.
- `CelebrationScreen` computes `nextLesson` as `lessons[index+1]` and `courseTotal` as the count of non-coming-soon lessons; both resolve exactly as before (the stub at index 6 is the same `distributions` stub that was there pre-change), and it already handles a coming-soon "next lesson."
- `lessonVisuals.getLessonVisual` has a deterministic by-index fallback for unknown ids — new nodes get sensible glyph/accent, no crash.
- `SchedulePage`'s "link a lesson" picker filters `!comingSoon`, so it still lists only the five live lessons.
- A blank lesson is double-locked: `comingSoon: true` *and* `useLessons`' empty-slots safety net.

### Two regressions the refactor would have caused — both fixed

1. **Trophy reward.** `CoursePath` marked the *last* chapter's checkpoint as the 250-coin "course complete" trophy. Appending nine all-locked chapters would have demoted the live final chapter to a 100-coin chest and parked the trophy behind unreachable content. Fixed: the trophy chapter is now "the last chapter that still has a playable lesson" (`trophyGroupIdx` in `CoursePath.tsx`). For today's state this reproduces the old behavior exactly (trophy on "Going Deeper"); it migrates forward automatically as units are authored. Trade-off: the trophy now sits mid-path with locked previews below — acceptable and self-correcting.
2. **"0/0" banner.** A unit with no playable lessons showed a meaningless "0/0" in `ChapterBanner`. Fixed to render a "Soon" lock chip when a chapter has zero available lessons. (Per-chapter `Checkpoint`s already rendered their correct locked state for all-stub units — no change needed.)

### Tests

- Updated the catalog test (`01-what-is-probability.test.ts`): no longer pins length to 6; asserts the five live lessons come first in order, everything after is a blank/locked stub, ids are globally unique, and numbering is sequential/monotonic.
- New `src/features/course/chapters.test.ts`: every `chapter.lessonIds` resolves to a real lesson, no lesson is in two chapters, every catalog lesson is chaptered (the generated "More to Explore" fallback never appears), chapters are uniquely + sequentially numbered, and grouping preserves order.
- `npm run verify` green: 188 + 5 = 193 tests, typecheck + lint clean.

### Authoring a stub later

Fill the stub's `slots`, then add its id to `available_lesson_ids` (the local default in `remoteFlagsConfig.ts` and the live Remote Config template). No other wiring. As live content reaches a new unit, the trophy and the "Soon" chips update themselves.

---

## Review mode — let the learner redo questions (sandboxed, no consequences) — 2026-06-23

After the flashcard work landed, owner exercised review mode (the read-only walkthrough that the home-screen "Review a lesson" CTA + the back-arrow on completed slots both route into) and pushed back: *"in review mode, it should still allow you to redo the question. you just don't gain xp and it also doesn't penalize or reward you or block anything."*

### Old behavior

Review mode was a strict read-only walkthrough:

- `onChange` and `onVariantPicked` were forced to `() => {}`, so the interaction's input handlers did nothing.
- `feedbackState` was forced to `'idle'`, so the regular check / wrong / correct UI never lit up.
- The regular `LessonFooter` (with Check / Continue) was swapped out for a `ReviewFooter` that only had a Next button + an italic "Reviewing — your progress is unchanged" line.

The net effect: the learner could *see* every slot they'd already done, but couldn't try anything again. That defeated the most useful part of revisiting a lesson.

### New behavior

Review mode is now a *sandboxed retry*: full interaction, full feedback, zero persistence.

- Inputs flow normally: `onChange`, variant pick, etc. drive the same `currentAnswer` / `useSlotState` machinery as a fresh attempt.
- Check + Continue use review-only handlers (`handleCheckReview` / `handleContinueReview`) that compute feedback via the existing pure `checkAnswer` and dispatch CORRECT/WRONG to the local reducer — but never call `recordAttempt`, `recordVariantSelection`, `applyAttemptOutcome`, `markLessonCompleted`, `applySlotAdvance`, or `advanceSlot`. No analytics either (review attempts shouldn't pollute `attempt_checked` series).
- All the existing UI behaves as it does in normal play: wrong-answer shake, the after-2-tries explanation reveal (since `useSlotState` is purely local, this Just Works), the soft success/error wash on the footer.
- The footer is the regular `LessonFooter` again; the "review" affordance moves to a thin banner under the header reading `Review · retries don't affect XP or progress`. That keeps the read-only-stats promise visible without stealing the Check button.
- Variant pick is doubly safe: `handleVariantPicked` early-returns whenever `isReview` is true (in addition to the pre-existing "selectedVariantIds already has it" guard). There's no path from review mode to a Firestore write.

Mid-lesson back-navigation review (`viewSlotIndex < slotIndex` while `?mode=review` is *not* set) gets the same treatment — those are also "I've already done this and want to try it again", and the same handlers apply.

### Trade-offs

- **No "you got it wrong, lose XP" penalty even though we now have full feedback.** That's the explicit ask: review is for low-stakes practice. The user keeps their original score even if they bomb the question on retry.
- **Achievement signal refs (`allFirstTryRef`, `hadComebackRef`) don't fire in review mode**, because `applyLessonCompletion` is never called. Correct — those are awarded once, on first completion.
- **The "End of review" copy is gone.** The learner just lands back on the home screen when they hit Continue on the last slot. If we want a dedicated "review summary" page later, that's a separate beat; the current behavior is the minimal sandbox the user asked for.

### Implementation notes

`src/features/lesson/LessonPlayer.tsx`:

- Removed the `ReviewFooter` component; replaced with a `ReviewBanner` (thin `bg-muted/40` strip with `text-[11px] uppercase tracking-[0.14em]` review tag).
- Added `handleCheckReview` and `handleContinueReview`. Both are sync, no `setSubmitting(true)` (no async I/O to gate against) — they short-circuit the network round-trip entirely.
- Dropped the `isReviewMode ? () => {} : ...` overrides on `onChange` / `onVariantPicked` / `feedbackState`.
- Footer wiring now uses `onCheck={isReviewMode ? handleCheckReview : handleCheck}` and the same shape for `onContinue`. Single `LessonFooter` instance for both modes.
- `handleVariantPicked` gains an `if (isReview) return;` guard before the Firestore-write branch. `isReview` is added to its `useCallback` deps.

### Tests

- All 164 existing tests still pass (`npm run verify` green). Review mode is a UI/handler change with no new pure logic, so no new unit tests were added — `checkAnswer` (already tested) and `useSlotState` (purely local) are the same code paths the live UI exercises.
- Manual verification: in `?mode=review` on a completed lesson, retrying a question shows correct/wrong feedback + explanation, the regular Check/Continue flow works, and Firestore is untouched (no new `attempts` writes, no XP / streak movement).

---

## Theorem callouts + bookmarked derivation pages — 2026-06-23

Triggered by an owner note immediately after the new L3 landed: *"we should have a slide introducing each new theorem. eg. multiplication principle should have a theorem. and we should have a practice problem for it."* Scope was widened in the same conversation to *"everywhere a named rule appears, but not derivations — for derivations, we should have a dedicated derivations page, formatted a bit like bookmarked pages in a notebook."* Recorded as D77.

### Pedagogical intent

Each named rule becomes a clearly-marked **theorem statement** so the student can see the rule on its own, distinct from the surrounding intuition. Each genuine proof (multi-step algebra, not a numerical demo) becomes a dedicated **derivation page** with a separate visual treatment, so a student who wants to skip the proof can do so visually, and a student who wants to study it has a clean landing page.

### Content-model extension

Two new optional fields on `ConceptSlot` (D75):

```ts
theorem?: { name?: string; statement: string };
derivation?: { title: string; steps: string[] };
```

`assertLessonInvariants` validates non-empty strings on both. The legacy thin shape and the existing `body` / `example` fields are untouched, so any concept slot can opt into theorem, derivation, both, or neither.

### Renderer

`ConceptSlotView` now renders, in this order: title → prompt → **theorem callout** → body → example → **derivation page**. The theorem sits above the explanatory paragraphs so the formal statement is the first structured artifact a reader meets after the lede; the body then justifies it, and the example/derivation apply or prove it.

- **Theorem callout:** rounded card with a 4px violet left rule and a `--primary-soft` tint. Eyebrow row reads `THEOREM · _name_` in semibold uppercase. Statement renders with the existing `{a/b}` `<Fraction>` inline template, so `P(A | B) = {P(A and B) / P(B)}` typesets correctly.
- **Derivation page:** rounded card with a small `--amber-soft` tab labeled "Derivation" peeking off the top-left corner (positioned `absolute -top-2.5 left-5`, with shadow + border to look like a sticker on paper). Title in display face. Steps render as an ordered mono-numeric list, same machinery as `example`. The visual reads as a tab of a tabbed notebook page.

Both elements are wrapped in `<aside aria-label="…">` so screen readers announce them as separate landmarks.

### Where it landed (this pass)

| Lesson | Slot | What changed |
| --- | --- | --- |
| L1 | `equally-likely` | Added theorem ("Equally-likely outcomes"); dropped redundant `example` (the formula now lives in the theorem statement). |
| L1 | `reduce` | Converted `example` ("Why 3/6 = 1/2") → `derivation`. Pre-existing rendering bug fixed: `{(3/3)/(6/3)}` was unparseable by the `{a/b}` regex (multiple slashes); rewrote that step as plain prose. |
| L1 | `two-dice-intro` | Converted `example` ("Why 6 × 6 = 36") → `derivation`. |
| L3 | `multiplication-principle` | Added theorem; kept the closet-outfits worked example. |
| L3 | `addition-principle` | Added theorem; kept the bus-or-train example. |
| L3 | `permutations` | Added theorem (n! and nPk forms); kept the A/B/C arrangements example. |
| L3 | `combinations` | Added theorem; converted `example` ("Why divide by k!") → `derivation` and expanded it to a 5-step proof with a sanity-check at the end. |
| L3 | `complement` | Added theorem ("Complement rule"); kept the at-least-one-head example. |
| L4 | new slot `birthday-derivation` (inserted between `birthday-sim` and `how-many-people`) | New concept slot whose payload is a `derivation` showing `P(no shared) = 365/365 × 364/365 × … × 343/365 ≈ 0.493 → P(match) ≈ 0.507`. References the multiplication principle and complement rule from L3 by name. |
| L5 | `intro` | Promoted to enriched shape: title, body paragraph, plus a theorem callout for the conditional-probability formula `P(A | B) = {P(A and B) / P(B)}`. |

### Tests

- `assertLessonInvariants.test.ts` extended via the L1 / L3 / L4 / L5 lesson tests (no separate file). New cases: theorem callout presence per principle in L3, conditional-probability theorem in L5, derivation block on the four target slots, slot count refresh for L4 (3 → 4 concept slots), invariant rejection of empty `theorem.statement` / empty `derivation.steps`.
- L3 enriched-shape test split: title/body coverage for all five principles; theorem coverage for all five principles; derivation coverage for combinations only; example coverage for the four non-derivation principles.
- `npm run verify` and `npm run audit-feedback` are green.

### Watch items

- Bundle size: zero new dependencies (no KaTeX). The renderer additions are ~40 lines of TSX. Expected delta < 0.5 KB gzipped.
- Author convention: `theorem` for named rules, `example` for short numerical demos, `derivation` for proofs. The matrix is intentionally simple but should be re-checked when the next lesson is authored.
- The amber tab on the derivation card is the only place amber appears in the lesson player today. If the streak/progress UI later lands on amber as a primary signal, the derivation tab should rotate to a different accent (or to the lesson's accent ramp).
- L2 (Law of Large Numbers) and L5's `setup` slot still use the legacy thin shape. They are not named-rule beats, so D77 does not require touching them. If L2 gets a theorem-style restatement of the law, this pattern is the way to add it.

---

## Changelog

### 2026-06-23 — Immediate issues resolved (T1-01 through T1-06)

| ID | Fix summary |
| --- | --- |
| T1-01 | `sendEmailVerification` called in `registerUser`; `EmailVerificationBanner` added app-wide |
| T1-02 | `Die` redesigned as isometric SVG cube; `TapOutcomes` buttons enlarged + physical box-shadow + spring press |
| T1-03 | `DieContext` widget added to `FillFraction` for `showDieContext` variants; tappable d6 faces with live count |
| T1-04 | `wrongTick` counter in `useSlotState`; threaded to `LessonFooter` (animation key) and `GridEvent` (flash effect) |
| T1-05 | `DiceSimulator` component in `GridEvent` — "Roll the dice!" button with tumbling animation + sum display |
| T1-06 | `MultipleChoiceVariant` extended with `context` + option `subtext`; both dice-sum variants updated |

### 2026-06-23 — Economy, forgiveness, cosmetics, branding & schedule UX

> A batch of engagement + identity features that extended (and in one case reversed) the original Phase 1 scope. Per-decision rationale: alternatives **D79–D83** (the coin economy is D83 — D78 was taken by the flashcard-derivation work); non-goal reconciliation in [`prd.md`](prd.md) §8 / §9.10 and [`spec-habit-loop.md`](specs/spec-habit-loop.md). All grounded in learning science — coins are cosmetic-only to avoid the over-justification effect, the freeze softens punishing streaks (self-determination), and Captain Pascal's tips reinforce spacing / retrieval / learning-from-errors.

| Decision | Feature | Key files |
| --- | --- | --- |
| **D83** | **Coin economy** — earned only from chests (100), trophy (250), achievements (25); spent only on cosmetics + freeze. Idempotent Firestore transactions; `coins` / `claimedChests` on `users/{uid}`. | `lib/coins.ts`, `economy/coinService.ts`, `economy/CoinChip.tsx`, `course/Checkpoint.tsx` |
| **D79** | **Streak Freeze** (supersedes D34) — 200 coins, hold ≤2, auto-consumed in `nextStreak()` before reset; snowflake chip + toast. | `lib/streak.ts`, `habit/habitService.ts`, `economy/coinService.ts`, `course/HomePage.tsx` |
| **D80** | **Avatar styles + profile flair** — cosmetic, bought once (private `ownedAvatarStyles`/`ownedFlair`), equipped value mirrored to `publicProfiles`. | `economy/avatarStyles.ts`, `economy/profileFlair.ts`, `economy/FlairBadge.tsx`, `profile/DefaultAvatar.tsx`, `economy/StorePage.tsx` |
| **D81** | **"Probability Pirates" + Captain Pascal** — public brand + mascot; internal package/namespace stays `pascal`. Captain's Log tip card + lesson-intro cameo. | `components/Brandmark.tsx`, `illustrations/CaptainMascot.tsx`, `captain/*`, auth pages, `index.html` |
| **D82** | **In-app schedule reminder + event detail** — today-scoped reminder dialog (once/day, `localStorage` dismissal); tappable event detail resolving linked lesson + full notes. | `schedule/reminderRules.ts`, `schedule/ScheduleReminder.tsx`, `schedule/scheduleService.ts`, `schedule/SchedulePage.tsx` |
| **D84** | **Progress nav section (locked stub)** — nav entry with lock badge → read-only `/progress` placeholder previewing future AI-assisted insights; deferred under D23. | `components/AppShell.tsx`, `features/progress/ProgressPage.tsx`, `App.tsx` |
| **D85** | **Practice nav section (locked stub)** — Alcumus-style adaptive practice with LLM-generated, correctness-vetted problems; lock-badged "Arriving Friday" → read-only `/practice` placeholder. Full engine deferred (reopens D23). | `components/AppShell.tsx`, `features/practice/PracticePage.tsx`, `App.tsx` |

| Area | Notes |
| --- | --- |
| Security rules | `users/{uid}` allowlist extended with `coins`, `claimedChests`, `streakFreezes`, `avatarStyle`, `ownedAvatarStyles`, `profileFlair`, `ownedFlair`; public mirror fields stay PII-free. |
| Content | Removed the "Reducing the fraction" concept slot from Lesson 1 (per request); tests updated (7 → 6 concept slots). |
| Tests | New pure-logic suites: `coins`, `avatarStyles`, `profileFlair`, `reminderRules`, plus streak-freeze cases in `streak.test.ts`. Full `npm run test` + `build` green (162 tests). |
