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
- **Engagement gate, not a fake right/wrong.** A simulation has no wrong answer, so each new kind grades on _engagement_: the renderer emits a non-null answer only once the learner has run `minTrials` (200) / `minGames` (100). Check stays disabled until then, so there is no synthetic "wrong" state and the no-bail-out rule (D55) holds by construction. The `feedbackByWrongValue.incomplete` hint is therefore mostly unreachable in normal play (parallel to B045) but is kept as a safety net.
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

| ID    | Issue                                           | Category              | Severity | Status   |
| ----- | ----------------------------------------------- | --------------------- | -------- | -------- |
| T1-01 | Email verification on signup                    | auth                  | high     | **done** |
| T1-02 | 3D die illustration + tap feel                  | interaction · visual  | high     | **done** |
| T1-03 | Interactive die context for even-number problem | interaction · content | high     | **done** |
| T1-04 | Wrong-answer flash doesn't repeat               | interaction           | medium   | **done** |
| T1-05 | Two-dice page needs live simulation             | content · interaction | high     | **done** |
| T1-06 | "Which is more likely?" needs visuals           | content · visual      | medium   | **done** |

---

### 2026-06-23 — Test Session 2 immediate issues resolved (T2-01 through T2-04)

| ID    | Fix summary                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ------ | -------- |
| T2-01 | `viewSlotIndex` local state in `LessonPlayerInner`; `←` chevron in `LessonHeader`; review mode shows read-only slot + "Next →" footer                                                |
| T2-02 | `gridReference` field on `MultipleChoiceVariant`; `ReferenceGrid` + collapsible "View grid" toggle in `MultipleChoice.tsx`; populated on both `which-more-likely` variants           |
| T2-03 | `activityDates: string[]` added to `UserProfile` and `registerUser`; `arrayUnion(today)` written in `applyAttemptOutcome`; `ActivityGrid` 16-week heatmap component on `ProfilePage` |
| T2-04 | `MilestonesRow` rebuilt: shows all 6 milestone thresholds (earned = amber trophy, locked = grey lock); next-target progress banner at top; section renamed "Trophies"                |
| T1-07 | Generic error messages need custom copy                                                                                                                                              | ux · content        | medium | **done** |
| T1-08 | Design too plain; needs personality                                                                                                                                                  | visual              | medium | open     |
| T1-09 | Audience expansion + engagement features                                                                                                                                             | scope               | low    | open     |
| T2-01 | Back button in lesson player                                                                                                                                                         | ux · interaction    | high   | **done** |
| T2-02 | "Use the grid above" reference panel                                                                                                                                                 | content · ux        | high   | **done** |
| T2-03 | Profile activity/progress grid                                                                                                                                                       | visual · ux         | medium | **done** |
| T2-04 | Trophies — show all milestones, locked + earned                                                                                                                                      | visual · engagement | medium | **done** |

---

### 2026-06-23 — Test Session 3 (T3-01)

| ID    | Fix summary                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---- | -------- |
| T3-01 | Full study calendar at `/schedule`: month grid with event dots, day event list, add/check-off/delete events, upcoming strip, "Link to lesson" option. Firestore `studyEvents` subcollection with owner-only CRUD rules (deployed). AI study plan hook documented in architecture — `studyEvents` collection is the natural write target for a generated plan. |
| T3-01 | Calendar / study scheduler                                                                                                                                                                                                                                                                                                                                    | feature · ux | high | **done** |

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

| Act                  | Slots                                                                                                             | Pedagogical job                                                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — one random thing | `hook` → `sample-space-def` → `sample-space` (tap-outcomes) → `equally-likely` → `single-outcome` (fill-fraction) | Pose the question before the formula. Introduce **outcome** and **sample space** as named building blocks, then enforce them by tapping. Surface the equally-likely assumption so Lesson 2 has a hook to break. Apply the formula on the simplest case before events. |
| 2 — events           | `event-def` → `define-event` (tap-event) → `compute-probability` (fill-fraction) → `reduce`                       | Define **event** as a set of outcomes, then identify and count it, then divide. Fixes the prior order tangle (computing P(even) before "event" was defined). The `reduce` slot carries the first proof beat: `{3/6} = {(3/3)/(6/3)} = {1/2}`.                         |
| 3 — two dice         | `two-dice-intro` → `all-sums-equal` → `grid-sum` (grid-event) → `which-more-likely` (multiple-choice) → `wrap`    | Derive 6 × 6 = 36 via the multiplication principle (second proof beat, worked-example block). Plant the naive intuition ("all sums equally likely?") so the reveal lands. Existing grid + multiple-choice interactions carry the payoff.                              |

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

Triggered by a gap surfaced during the L1 pedagogy review: the existing L3 (birthday paradox) _uses_ combinatorial reasoning — "(4 × 3)/2 = 6", "23 people form 253 pairs", `P(no shared birthday) = 365/365 × 364/365 × …` — but never _teaches_ it. The student is asked to take three unnamed tools (multiplication principle, combinations, complement counting) on faith. The fix: insert a dedicated combinatorics lesson before the birthday lesson. Recorded as D76.

### Course shuffle

| New #     | id                      | What it teaches                                                      | Source                          |
| --------- | ----------------------- | -------------------------------------------------------------------- | ------------------------------- |
| L1        | what-is-probability     | Sample space, events, two dice                                       | unchanged                       |
| L2        | law-of-large-numbers    | Why simulation works                                                 | unchanged                       |
| **L3**    | **counting-carefully**  | **Multiplication, addition, permutations, combinations, complement** | **NEW**                         |
| L4        | counting-gets-hard      | Birthday paradox                                                     | was L3, `number: 4`             |
| L5        | conditional-probability | Monty Hall                                                           | was L4, `number: 5`             |
| L6        | distributions           | Coming-soon stub                                                     | was L5, `number: 6`             |
| (dropped) | central-limit-theorem   | Was a coming-soon stub                                               | deleted to keep the course at 6 |

### Lesson 3 — pedagogical arc (14 slots, ~7 minutes)

| Slot                       | Kind                            | Job                                                                                                       |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `hook`                     | concept (rich)                  | "A 5-card hand has 2.5M outcomes. Count without listing."                                                 |
| `multiplication-principle` | concept (rich + worked example) | m × n × … for sequential independent choices. Outfits worked through.                                     |
| `multiply-problem`         | multiple-choice ×2              | 4 entrees × 3 desserts; license-plate prefix 26 × 10³.                                                    |
| `addition-principle`       | concept (rich + worked example) | Either-or, mutually exclusive: add not multiply. Bus or train.                                            |
| `add-vs-multiply`          | multiple-choice ×2              | Discriminator — the most common mistake.                                                                  |
| `permutations`             | concept (rich + worked example) | 3! arrangements of ABC listed. Generalize to nPk.                                                         |
| `permute-problem`          | multiple-choice ×2              | 4! race orders; 5 × 4 × 3 podiums from 5 runners.                                                         |
| `combinations`             | concept (rich + worked example) | **The proof beat the prior L3 was missing.** 12 ordered pairs / 2 = 6 unordered. nCk = `{n!/(k!(n-k)!)}`. |
| `combine-problem`          | multiple-choice ×2              | 5C3 ice-cream trios; 6C2 handshakes.                                                                      |
| `order-or-not`             | concept (rich)                  | "Swap two items: same outcome?" rubric for ordered vs unordered.                                          |
| `which-is-it`              | multiple-choice ×2              | Lottery ticket (unordered); basketball starting five (unordered).                                         |
| `complement`               | concept (rich + worked example) | `P(at least 1 head in 3 flips) = 1 − {1/8} = {7/8}`. Names the trick the birthday lesson needs.           |
| `complement-problem`       | fill-fraction ×2                | `P(at least one six in two rolls) = 11/36`; `P(at least one head in 4 flips) = 15/16`.                    |
| `wrap`                     | wrap                            | Segue into the birthday paradox: "Twenty-three people, 253 pairs."                                        |

All copy authored in Lesson 1's voice under `docs/ui-directive.md` (no em dashes, sentence case, no banned vocabulary, no filler subtitles). Every problem variant carries full `feedbackByOption` / `feedbackByWrongAnswer` and an `explanation`.

### Engineering changes (mechanical, low-risk)

- New files: `src/content/lessons/03-counting-carefully.{ts,test.ts}`.
- Renamed files (lesson ids unchanged so resume/replay/progress docs are unaffected): `03 → 04-counting-gets-hard.{ts,test.ts}`, `04 → 05-conditional-probability.{ts,test.ts}`, `05 → 06-distributions.ts`. Each file's exported symbol name and `lesson.number` were bumped to match.
- Deleted `src/content/lessons/06-central-limit-theorem.ts` (the CLT coming-soon stub).
- New course-path glyph: `'tree'` in `src/features/course/LessonGlyph.tsx` (root node branching twice into four leaves — the multiplication principle's canonical visualization). `lessonVisuals.ts` maps `counting-carefully → { accent: 'green', glyph: 'tree' }`; the orphaned `central-limit-theorem` entry was removed; Distributions moved to the coral accent so its slot at L6 reads visually distinct.
- `src/content/index.ts` rewritten to import the new L3 and drop the CLT lesson; exports stay `lesson1..lesson6`.
- `src/features/flags/remoteFlagsConfig.ts` adds `'counting-carefully'` to the default `available_lesson_ids` so the new L3 ships playable on cold start. Remote Config template push to follow (same launch pattern as Lessons 2-4).
- `src/content/lessons/02-law-of-large-numbers.ts` segue updated: wrap now points to `'counting-carefully'`; the "next, the counting itself becomes the wall" line was rewritten to set up the _tools_ before the wall ("the counting tools that make the formula side work when the sample space is too big to list"). One forward-reference inside an L2 problem ("next lesson") was also rephrased to "in the birthday lesson coming up" so the foreshadow pays off in L4 instead of misfiring at L3.

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

Tiny owner request late in the L1/L3/L4/L5 pass: _"get a 3d coin in the tap every face of this coin, in the bottom right. it just stays there. if i click on it, it flips over to show the other face."_

> **Un-mounted same-day, 2026-06-23.** Owner reviewed the live screen and called the combination confusing — a literal 3D coin in the corner next to a "tap every face of this coin" prompt that pointed at flat H/T tiles. The fix was to redesign the question itself (see "Sample-space slot — tap-faces → multiple-choice 'how large'" entry below); the 3D coin no longer has a contextual home in L1. The component file (`src/components/illustrations/Coin3D.tsx`) is preserved for future use; only the mount in `TapOutcomes.tsx` was removed.

### Choice

Brand-violet two-tone metal coin, CSS-3D, click-to-flip. New component at `src/components/illustrations/Coin3D.tsx`. Was mounted in `TapOutcomes.tsx` only when `variant.source === 'coin'`, pinned `absolute bottom-4 right-4`, sized `w-16 h-16` (mobile) / `w-[72px] h-[72px]` (≥md).

### What it is, and what it isn't

It is **decorative**. It does not gate the answer state, doesn't appear in `feedbackState`, doesn't feed `onChange`. Tapping it is a moment of "just because" — the canonical fair coin sitting next to a lesson about a fair coin, available to fidget with.

The flip is the only interaction: click → spring `rotateY` between 0° and 180°. There is no idle motion. (Idle wobble was considered and rejected — the frontend-design skill explicitly flags ambient motion as one of the strongest AI-tells; the hover-lift micro-interaction on pointer devices is enough invitation.)

### Visual choices, deliberately not the defaults

The frontend-design skill named three AI-default looks. For a coin, the equivalents are casino-gold, US-mint silver, and the abstract dot-and-ring. All three were rejected.

- **Two-tone violet, not casino gold.** Heads is a lighter violet wash (`#B7A7FF → #4F36AB`), tails is the standard primary violet (`#8E76FF → #3A2A8C`). Both stay on the brand ramp so the coin reads as _minted for this app_, not transplanted from a Vegas asset library. The two-tone split is small but enough that the flip is legible from peripheral vision before the H / T glyph resolves — useful when the coin is in the corner and the learner is focused on the actual tap targets.
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
- The coin is pinned to the _interaction container's_ bottom-right, not the viewport's. This is deliberate — `fixed` positioning would leave the coin floating over header/footer and other lessons; `absolute` keeps it scoped to the slot it belongs to.

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

Owner saw the live `coin` variant of the `sample-space` slot in L1 and flagged it as confusing: _"this is confusing. just ask how large is the sample space, or type in the sample space."_ Three things were colliding on screen:

- The instruction said "tap every face of this coin" but pointed at two flat H/T tiles, not a coin.
- The decorative 3D coin in the bottom-right (just shipped earlier in the session) was _also_ a tappable coin, with a different role.
- For a 2-outcome sample space, "tap each face once to list every outcome" is barely an interaction — the learner clicks twice and submits, with little to learn.

### Fix

Converted the `sample-space` problem slot from `tap-outcomes` to `multiple-choice`. Both variants now ask the same kind of question with concrete numeric answers:

| Variant | Question                                             | Correct |
| ------- | ---------------------------------------------------- | ------- |
| `d6`    | "Roll one fair die. How large is the sample space?"  | 6       |
| `coin`  | "Flip one fair coin. How large is the sample space?" | 2       |

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

## Path progress count + locked-lesson stale-progress polish — 2026-06-24

Owner spotted two cosmetic warts on the live path: _"right now path and 1/1 done look a little odd. anything better we can say while still encoding progress? also right now two dice is randomly in the middle, can we lock it and delete the progress on it"_. Decision recorded as **D91**.

### What looked wrong

- **Header read "1 / 1 done"** once `how-likely` was finished — implying course completion while ~40 locked roadmap previews were obviously visible below. Same misleading framing rippled into the Profile stats grid ("Course: 1 / 1") and into the celebration screen's "course complete" trigger (which fired on the very first lesson).
- **`two-dice` rendered with a green completed-check** even though it was a locked stub — its Firestore `lessonProgress/two-dice` doc was left over from an earlier branch where the lesson was authored and completed by the tester. The visual was the worst of both worlds: locked grey disc + bright completed check + "Coming soon" meta.

### Three fixes

1. **Course-progress denominator now counts the whole planned course** (live + locked stubs), not just non-coming-soon lessons. Header reads "1 / 42 lessons" instead of "1 / 1 done" — honest scope, with the locked nodes on the path itself communicating "more is coming." `courseProgress(lessons, progressMap)` rewritten: `total = lessons.length`, `completed` only counts lessons that _have_ authored slots and are completed (so a stale completed-state on a now-blank stub never inflates the count).
2. **Header copy** shifted from "{n} / {n} done" to "{n} / {n} lessons." Drops the implication of finality. The Profile `StatsGrid` already labels its row "Course," so no copy change there.
3. **`allCompleted` everywhere** — `HomePage`, `HeroCard`, `CelebrationScreen.courseTotal`, `PublicProfilePage` — now requires the _full_ catalog to be done before the "all caught up" / course-complete celebration fires. Pre-fix this fired on the first lesson because `realLessons.every(...)` is trivially satisfied with one lesson.

### Stale-progress fixes (the `two-dice` issue)

- **Visual guard in `LessonNode`:** when `lesson.comingSoon` is true, the component now treats `progress.state` as `undefined` regardless of what Firestore says. A coming-soon lesson always renders as locked — no green check, no "Completed" meta, no in-progress label. Defensive: this handles any future re-locked lesson, not just `two-dice`.
- **Data cleanup via `pruneStaleProgress`:** new helper in `progressService.ts` that batches deletes for a list of `lessonProgress` doc ids. A one-shot `useEffect` in `HomePage` runs it with the ids of lessons that exist in the user's progress map but have `slots: []` in the catalog. Idempotent (a `prunedRef` keeps a per-session set so a Firestore snapshot re-emit after the delete doesn't refire), best-effort (errors logged, never thrown). Single-id case takes the `deleteDoc` fast path; multi-id case batches into one atomic write.

### Why catalog-driven, not flag-driven

The prune criterion is `slots.length === 0` (truly contentless), not `comingSoon` (which can be set via Remote Config too). That distinction matters: a lesson temporarily flagged off via Remote Config still has authored content, and its progress should resume if/when the lesson is flipped back on. Only "lesson literally has no content right now" justifies a delete.

### What was NOT touched

- `profile.lessonsCompleted` — a separate Firestore counter on `users/{uid}`, updated via server-side `increment`. Can still be off-by-one if a lesson was completed and re-locked. The Profile UI clamps it visually with `Math.min(profile.lessonsCompleted, courseTotal)`. Out of scope for this cosmetic pass.
- `stepAttempts` history — same reasoning. Could be pruned later if it ever feels stale on Profile.

### Tests

`recommendations.test.ts` updated:

- `'counts only available (non-coming-soon) lessons as the total'` → `'counts the full planned course as the total (live + locked stubs)'`.
- `'returns 1/1 after completing the only available lesson'` → `'after completing the one real lesson, returns 1/2 (not 1/1)'`.
- New: `'ignores stale progress on lessons that are blank stubs (no slots)'` exercises the guard in `courseProgress`.
- Test fixture's `makeLesson` now gives non-coming-soon lessons a single concept slot, modeling the real / stub distinction the function uses.

`npm run verify` is green: 27 test files, 206 tests passing (one new test for the stale-stub case).

### Audit follow-ups (caught the same day)

A close re-read of the diff caught two issues `npm run verify` didn't:

1. **Hook ordering in `HomePage`.** The `useRef` + `useEffect` for the prune were initially placed _after_ the `if (auth.status === 'loading' …) return <HomePageSkeleton />` early return — a Rules of Hooks violation that would have surfaced as a "hook count changed between renders" warning the moment `progressState` flipped from `loading` to `ready`. Moved both hooks above the early return; the effect's body still no-ops via `if (progressState.status !== 'ready') return;` so behavior is identical, but React's hook list stays stable across renders. Sentinel comment added so the next reader doesn't move them back down.
2. **Course-Cleared achievement could fire on lesson 1.** `LessonPlayer.tsx:114` was computing `courseTotal = useLessons().filter((l) => !l.comingSoon).length` and passing it into `applyLessonCompletion → newAchievementsFor`, which awards `course-cleared` when `lessonsCompleted >= courseTotal`. With the catalog at one playable lesson, that threshold was trivially satisfied on the first completion. Fix: same `useLessons().length` change as the other course-total sites — now requires the full planned course, matching the celebration-screen + hero-card semantics. (Existing achievements awarded under the broken threshold stay awarded — `award()` is idempotent and never revokes; the audit note in D91 documents the trade.)

---

## Lesson 3 — sample-space (vocabulary done right) — 2026-06-25

Authoring the third live lesson of Unit 1 ("Defining Probability"): name the things the learner has been counting since Lesson 1. Outcome, sample space, event. **No probability calculations** here; the favorable / total formula returns in the next lesson with its pitfalls. Decision recorded as **D93**.

### Three calls that shaped the lesson

1. **Equally-likely-outcomes stays its own lesson.** Owner asked whether equally-likely deserved its own slot. Strong yes. The classical formula has real failure modes (two-coin head counts, two-dice sums, "either it happens or it doesn't") and it would be a waste to fold them into a vocabulary lesson where the formula is barely the point. Sample-space owns the toolkit; equally-likely owns the assumption.
2. **HT-vs-TH cognitive conflict is moved out.** Earlier drafts of the sample-space slot list had a dedicated concept beat hammering "HT and TH are different outcomes, even though they both have one head and one tail." Owner pushback was sharp: _"doesn't it depend on what you're looking for? maybe we save this for equally likely outcomes."_ Right call. That tension is the perfect cognitive-conflict opener for the next lesson — staging it here would steal the punchline. Sample-space lists outcomes by their natural "what just happened?" rule and moves on; the question of whether {0H, 1H, 2H} is a valid breakdown of those four outcomes lands in `equally-likely-outcomes`.
3. **Event upgraded from "something that can happen" to "subset of the sample space".** Lesson 2 introduced _event_ loosely so the named theorem ("P(event) is the fraction of times the event happens after many tries") could read cleanly. Sample-space upgrades the definition: an event is a subset of the sample space, and the slot's body explicitly references the previous lesson's looser take so the upgrade reads as a continuation, not a contradiction. This is how Lessons 1, 2, and 3 layer the same vocabulary deeper each time.

### New figure variant: `two-coins-grid`

Owner asked for the two-coin sample space to land as _"an autonomous looping thing where four coins are chosen and moved into pairs into the grid slots."_ Pure observation, no learner input. Built as a new `ConceptFigure` variant alongside `settling-line`:

- 2×2 grid with row labels (1st flip = H or T) and column labels (2nd flip = H or T), so HH, HT, TH, TT each sit in their natural cell.
- Cells fill one at a time on a 900 ms cadence, hold the full grid for 1.8 s, then clear and loop. Framer Motion `AnimatePresence` with a soft drop-and-scale entry per cell so the appearances read as construction, not popping.
- Default timings exposed on the variant (`stepMs`, `holdMs`) for future tuning, but for now every concept slot using this figure inherits the defaults.
- Same content-model pattern as `settling-line`: declarative chrome attached to a concept slot, validated by `assertLessonInvariants`, rendered via `ConceptSlotView`'s figure switch. No new interaction kind, no `checkAnswer` plumbing, no progress side-effects.

### MCQ design rule: explain the trap, do not name the right answer

Owner ground rule for this lesson and beyond: _"DON'T GIVE AWAY THE ANSWER IN HINTS."_ Every wrong-answer feedback string in this lesson explains why the chosen option fails, then leaves the learner to re-pick:

| Slot | Pattern |
| --- | --- |
| `pick-the-event` (at-least-one-heads) | Each wrong option earns a sentence about which event _it_ is ("that is exactly two heads," "those are exactly one heads," "that is the entire sample space"), then a reminder of the question. None says "the right answer is `{HH, HT, TH}`." |
| `pick-the-sample-space` (one-card) | Each granularity-trap option earns the same shape of correction: "two cards can both be \[that category\] and still be different draws." The pattern teaches the principle (a sample space must be at least as specific as the result) without naming the 52-card option. |
| `three-coins` (which is NOT in the 3-flip sample space) | Each valid 3-letter string earns "this is a fine three-flip outcome, so it sits inside the sample space." Pushes the learner back to the question (find the outlier) without naming the 4-letter string. |

Two lesson tests assert this directly: `pick-the-event`'s wrong-answer feedback must not contain the literal `"{HH, HT, TH}"`, and `three-coins`'s wrong-answer feedback must not contain `"HHTH"`. These tests will catch a future copy edit that slips into spoiler territory.

### Slot list (10 slots, ~5 min)

| # | Slot | Beat |
| --- | --- | --- |
| 1 | `welcome` | Frame the lesson as a vocabulary upgrade. Cite three things the learner has been counting (faces, heads, dice pairs). |
| 2 | `define-outcome` | Theorem: outcome = one specific result of an experiment. Connects back to Lesson 1's "ways." |
| 3 | `define-sample-space` | Theorem: sample space = set of all outcomes. `{H, T}` and `{1, 2, 3, 4, 5, 6}` shown explicitly. |
| 4 | `list-coin` | Tap-outcomes recap: list the sample space for one flip. The mechanic is from Lesson 1; the vocabulary is new. |
| 5 | `two-coins-grid` | The new looping animation. Four pairs appear cell by cell; HT and TH in their separate cells but no preview of the equally-likely pitfall. |
| 6 | `define-event` | Theorem: event = subset of the sample space. Two examples (rolling even, at least one heads). Body cites Lesson 2's loose definition. |
| 7 | `pick-the-event` | MCQ: identify "at least one heads" as a 3-element subset. Distractors test specific misreadings ("exactly two," "exactly one," "the whole sample space"). |
| 8 | `pick-the-sample-space` | MCQ: granularity trap on a single card draw. Distractors are subsets of correct categories (color, suit, rank). |
| 9 | `three-coins` | MCQ: which string is NOT a 3-flip outcome (correct answer is 4-letter HHTH). |
| 10 | `wrap` | Bridge to `equally-likely-outcomes`. Mascot line: "First the list. Then the math." |

### Numbers

- 30 test files, **247 tests**, all passing. New file `sample-space.test.ts` adds 14 tests (arc, theorem-name pinning, event-as-subset upgrade check, figure config, no-jargon, no-giveaway, three MCQ correctness, wrap segue, validation).
- The catalog test in `01-what-is-probability.test.ts` was updated: playable lessons are now `[how-likely, long-run-frequency, sample-space]`.
- Bundled Remote Config defaults updated in `remoteFlagsConfig.ts` so the lesson is unlocked without a remote publish.
- The `ConceptFigure` type became a discriminated union (`SettlingLineFigure | TwoCoinsGridFigure`); the validator now exhaustively switches on `kind`. This is the cleanest extension shape for adding a third or fourth figure later (tree diagrams, etc.) without revisiting existing slots.

### Follow-up: three-coins becomes a regex-graded fill-text — 2026-06-25

Owner pushed back on the original three-coins MCQ ("which of these is NOT in the sample space?"). The MCQ tested a discrimination skill (scan four strings, spot the outlier), which is a weaker pedagogical ask than constructing a valid outcome from scratch. The new shape: a single text input that the learner fills with one outcome they think belongs.

To support this cleanly, a **new interaction kind `fill-text`** was added across the stack:

- **`FillTextVariant`** in `content/types.ts`: a regex-graded text input. Authors write `acceptRegex` against the lowercased input. Anchors are added at evaluation time so a regex like `\s*[ht]\s*[ht]\s*[ht]\s*` is what authors actually type, not the noisy `^\s*[ht]\s*[ht]\s*[ht]\s*$/i` form.
- **`assertLessonInvariants`** compiles the regex at lesson load. A typo in the pattern fails fast at startup rather than silently rejecting every learner attempt.
- **`checkAnswer`** normalizes input (`trim().toLowerCase()`), anchors the pattern with `^(?:...)$`, and applies the `i` flag belt-and-suspenders. The wrong-key is the normalized input itself (or `'empty'` when blank), so authors can target very specific traps in `feedbackByWrongAnswer` if they want.
- **`AttemptPayload`** gains `{ text: string }`.
- **`FillText.tsx`**: single autofocused input, monospaced and uppercase-styled so the visual reads as a structured 3-letter answer slot. `wrongTick` clears the input on each wrong attempt so the learner starts fresh; correct answers lock the input in place for review.
- The `audit-feedback.ts` registry knows about `fill-text` so the feedback-coverage script does not break on this lesson; per-input hints are optional (the input space is too large to enumerate).

For the question itself:

> _"You flip three coins. Type one outcome from the sample space. Use H for heads and T for tails, three letters in order."_

The regex `\s*[ht]\s*[ht]\s*[ht]\s*` accepts every one of the eight valid outcomes, plus any case mix, plus any internal/edge whitespace. That covers a ton of natural typing patterns ("HHT", "h h t", " H T H ", "hHt", etc.) so the question never feels like a guess-the-format puzzle.

**Anti-spoiler**: a dedicated test scans the prompt, context, placeholder, default feedback, and per-input feedback for any of the eight valid outcomes (matched as word boundaries to avoid false hits like "HEADS"). The `explanation` field is exempt because it is the post-attempt teaching moment — the full sample space is allowed there. Future copy edits that drift toward "HHT" in a placeholder will trip this test.

**Numbers update**: 31 test files, **255 tests**. New checkAnswer cases (eight valid outcomes, case-insensitivity, whitespace tolerance, the three rejection types) plus the lesson-level fill-text round-trip and the no-spoiler scan.

### Follow-up: close the formula loop in the new vocabulary — 2026-06-25

Owner noticed the lesson defined outcome, sample space, and event but never came back to say "and probability of an event is the size of the event over the size of the sample space." Without that bridge, the new vocabulary reads as set-theory chrome that does not pay off. With it, the lesson lands the same `k/N` formula from Lesson 1 but written in the new words: favorable becomes |event|, total becomes |sample space|.

New slot `classical-probability` inserted between `pick-the-event` and `pick-the-sample-space`. Two-sentence reasons for the placement:

1. **After `pick-the-event`** — so the worked example can use the event the learner just identified (`{HH, HT, TH}` for "at least one heads"). No spoiler risk because that MCQ is already submitted; the reuse builds direct continuity instead.
2. **Before `pick-the-sample-space`** — so by the time the learner is asked about granularity of a 52-card draw, they have the full vocabulary AND a formula that depends on counting outcomes correctly.

The theorem is named **"Probability of an event"** rather than "Probability" (Lessons 1 and 2 already each have a theorem named "Probability" — for `k/N` and long-run share respectively). The fresh name signals that this is the third reframing of the same idea, now in the event/sample-space vocabulary, and matches what the next lesson stress-tests as the _classical_ definition. The equally-likely caveat is in the theorem statement; `equally-likely-outcomes` then tests when that caveat fails.

Two worked examples land in the body: P(rolling even) = 3/6 = 1/2 on one die, and P(at least one heads) = 3/4 on two coins (reusing the just-picked subset). A third paragraph names the bridge back to Lesson 1 explicitly: "the same formula, just written with the new words."

Tests pin three things specifically: (a) the theorem name and statement mention `event` + `sample space` + the equally-likely caveat, (b) the body references the previous lesson (so future edits cannot silently lose the bridge), and (c) the body uses the `3/6` worked example so the formula is shown in action.

**Numbers update**: 33 test files, **301 tests**. New assertions cover slot order, theorem naming for all four named ideas (outcome, sample space, event, probability-of-an-event), the formula-in-context check, and the Lesson-1 bridge check.

### Follow-up: introduce "set" and "subset" inline — 2026-06-25

Owner asked whether we needed to introduce "set" and "subset" as terms. The lesson was using `{H, T}` notation and the words "set" and "subset" as if defined, but the live path's previous two lessons (`how-likely`, `long-run-frequency`) never use curly-brace set notation. So sample-space is the first place an 8–15 year old reader meets these symbols and these specific words on the path. Without an inline gloss, the lesson reads as a wall of unfamiliar shape for kids who have not seen sets in school yet.

Two surgical edits — no new slots:

- **`define-sample-space` body** now opens with the curly-brace gloss alongside the first example: *"For one fair coin flip, the sample space is {H, T}. The curly braces mark a set, which is just a list of items with no duplicates and no fixed order."* The notation gets explained where it first appears, not as a separate beat.
- **`define-event` body** prepends a plain-English subset definition: *"A subset is just some of the items from a set, picked out for a reason. Some subsets have every item, some have none, but most are somewhere in between."* That sets up the worked die and two-coin examples that follow, which use "subset" repeatedly.

The math vocabulary stays — this lesson's title is "Naming the toolkit" and pretending set theory does not exist would undercut its purpose. The plain-English glosses run alongside the math words so the kid who has seen sets reads fluently and the kid who has not gets a definition exactly when it is needed.

Two new tests pin the additions:
- The body of `define-sample-space` must mention `curly braces`, the word `set`, and one of `no duplicates / no repeats / order does not matter / no fixed order`.
- The body of `define-event` must mention `subset` and one of `some of the items / some of the outcomes / part of the set / inside the set`.

Both regexes are intentionally permissive so reasonable rewording keeps passing; what they guarantee is that a future edit cannot silently strip the explanation.

**Numbers update**: 33 test files, **303 tests** (+2).

### Follow-up: sharpen outcome-vs-event distinction — 2026-06-25

Owner read the `define-event` slot and called out the confusion: _"this is confusing, people are gonna ask whats the difference between event and outcome. the question you can ask is good. but you should make it clear in the statement that an event is a set of outcomes."_ The previous statement led with "An event is a subset of the sample space" and only mentioned "set of outcomes" as a second sentence; for a kid who is fuzzy on what subset means, that ordering misses the most important takeaway.

Two changes:

1. **Theorem statement reordered** to lead with the set-of-outcomes framing: _"An event is the set of outcomes that count as 'yes' for whatever question you are asking. Every event is a subset of the sample space."_ The "set of outcomes" wording lands first; the subset framing follows as the formal version.
2. **Body opens with the explicit outcome-vs-event contrast**, no more buried under the subset explanation:
   _"An outcome is one specific result, like rolling a 3 or flipping heads. An event is bigger: it bundles all the outcomes that match your question into one set. So an event is not a single outcome, it is a group of them."_

The subset definition still appears in body[1] (now tied directly to event: "That is what an event is: some of the outcomes from the sample space, the ones that match the question"). Two worked examples (die and two-coin) now use the verb "bundles" in their first sentence so the conceptual word from body[0] surfaces again in concrete contexts.

The prompt is unchanged. Owner explicitly liked the "an event is a question you can ask" framing as a hook, and the new theorem statement reads as the answer to that hook.

A new test pins the distinction:
- Body must contain a singular description of outcome (one of `one specific / one result / single result / a single outcome / one outcome`).
- Body must contain a set-style description of event (`(set|group|bag|bundle|bundles)` near the word `outcomes`).
- Theorem statement must contain the literal phrase `set of outcomes`.

A future copy edit that softens any of those three will trip the test.

**Numbers update**: 34 test files, **313 tests** (+10 since the previous log entry; mostly from new lesson-shape assertions across this batch).

### Follow-up: split theorem and definition callouts — 2026-06-25

Owner read the `define-outcome` / `define-sample-space` / `define-event` slots and noted that they all use the `theorem` callout, but they are not theorems. _"We should have a definition block instead of theorem block for the outcome event type thing."_ Correct read. In math, a theorem is a claim that can be derived; a definition is a labeling convention. Pretending they are the same thing softens both.

New content-model field `definition?: { name?: string; statement: string }` on `ConceptSlot`, mirroring the shape of `theorem` but with two distinct concerns:

| Field | Use for | Visual |
| --- | --- | --- |
| `theorem` | Claims that can be proven (multiplication principle, complement rule, etc.) | Violet top-border accent, "Theorem" eyebrow |
| `definition` | Labeling conventions (outcome, sample space, event, …) | Blue top-border accent, "Definition" eyebrow |

`ConceptSlotView` renders both, definition first if both are present on the same slot (a beat could plausibly name a word AND state a derivable claim about it). Validation in `assertLessonInvariants` mirrors theorem: non-empty statement, non-empty name if present.

**Scope of migration**: the four named-vocabulary callouts in `sample-space` (Outcome, Sample space, Event, Probability of an event) all migrate from `theorem` to `definition`. Lessons 1 and 2 still call their "Probability" callouts theorems; those are also definitions philosophically, but the user did not ask to touch them and migrating creates churn for marginal gain. They can be migrated later when those lessons get content edits.

**Tone polish** in the same pass. `define-event`'s body used "bundles" four times in five paragraphs, which read mechanical; replaced with "groups together" in the worked examples (`bundles the outcomes 2, 4, and 6 into the subset` → `groups the outcomes 2, 4, and 6 together into the subset`) and removed entirely from the lead-in body[0]. Also retired the slightly stiff _"The set view says it more carefully"_ in body[4] in favor of _"Now we can pin it down"_, which is what a teacher would actually say out loud.

**Test deltas**:
- Renamed _"defines outcome, sample space, event, and probability-of-an-event as named theorem callouts"_ → _"... as named definition callouts"_; updated all four assertions from `.theorem` to `.definition`.
- New assertion: for each of the four migrated slots, `slot.theorem` must be `undefined`. A future edit that reaches for `theorem` on a terminology slot trips here, keeping the theorem/definition discipline enforced.
- Updated two other assertions (event-as-subset upgrade check, outcome-vs-event distinction) to read from `definition.statement` instead of `theorem.statement`.

**Numbers update**: 36 test files, **369 tests** (the jump is mostly from a parallel feature branch's tests that landed alongside this work; my changes here account for the assertion edits and the no-theorem-on-terminology check).

### Set/subset: split the beat, add a playful picker, lock with a fill-blank — 2026-06-25

Owner read the slimmed `define-event` and called the next problem: _"too much text!! lets abstract out the set and subset stuff. and put it on one page with a definition. we should also have an interactive thing that goes through a list of three differently colored balls and lets you pick out a subset each time. but just for fun, not required."_ And: _"then have a fill in the blank question for size of set and subset, or what is a subset, etc etc."_

Both reads are correct. Five paragraphs on `define-event` — an outcome/event distinction, a set/subset primer, two worked examples, and a callback to Lesson 2 — was three beats in a trench coat. The set/subset primer was the easiest one to lift out: it is a prereq for the event definition (events ARE subsets), but it is not the event definition itself, and it deserves room for a hands-on moment that the prose alone cannot deliver.

**New slot layout** (sample-space, slots 5–9):

```
two-coins-grid          (existing, autonomous animation)
define-set-subset       (NEW: subset definition + playful picker figure)
subset-fill             (NEW: fill-text — type any 2-item subset of {R,B,G})
define-event            (existing, body slimmed from 5 paragraphs → 3)
pick-the-event          (existing, unchanged)
```

The subset definition is the **subset**, not "set and subset." A set is the supporting word and gets glossed in the body (curly braces, no duplicates, no fixed order); the formal blue callout names "Subset" specifically, because that is the word the next slot leans on. One definition per slot is also the cleanest fit for the `ConceptSlot.definition` shape we shipped earlier today.

**Playful picker figure (`SubsetPickerFigure`)**: three colored balls (red, blue, green). Tap a ball, it springs up and grows a ring; the readout under the row updates the subset in curly-brace notation in real time. Empty set is a valid state (the readout reads `{ }` and labels it "the empty set, still a valid subset"). Full set is also valid (readout labels it "the whole set as a subset"). The boundary cases that confuse the formal definition are surfaced by playing with the toy, not just by reading them.

Author-time hook is a new `ConceptFigure` variant: `{ kind: 'subset-picker', caption?: string }`. Same wiring path as `settling-line` and `two-coins-grid` — append to the discriminated union, exhaustive switch in `assertLessonInvariants`, one render-line in `ConceptSlotView`. Pure presentation: no XP, no correctness, no Continue gate. The slot's `kind` is still `concept`, so Continue is always available; the picker is something to do, not something to pass.

**Fill-blank (`subset-fill`)**: _"Type a subset of {red, blue, green} with exactly two colors. Separate the colors with a comma."_ Three valid answers ({red,blue}, {red,green}, {blue,green}), each accepted in any case and with flexible separators (comma, space, or both). Picks `fill-text` over `multiple-choice` deliberately: multiple-choice over a 3-choice answer space makes the question one tap; fill-text forces the learner to recall and type a subset, which is the conceptual move we want. The regex is enumerated rather than computed (six alternations) so the matcher stays readable.

**Tone**: kept the new copy in the L1/L2 voice. No em dashes. Declarative. _"A set is a collection. A subset is a piece of that collection. The picker below is yours to play with."_ The picker's readout messages handle the two boundary cases in plain language: _"The empty set. Still a valid subset."_ and _"You picked every ball. That is the whole set as a subset."_

**Slimmed `define-event`**: dropped the subset primer (slot 6 has it now) and the L2 callback paragraph (the definition statement carries the upgrade — "subset of the sample space whose outcomes answer yes" — and the L2 callback was load-bearing only for prose, not for the math). Body is now three paragraphs: outcome/event distinction, die-even worked example, two-coin worked example. Same callout, same examples, half the text.

**Test deltas**:
- Slot-order test expanded to 13 IDs with new ordering assertion: `define-set-subset` and `subset-fill` both precede `define-event`, and `subset-fill` immediately follows `define-set-subset`.
- Interaction-kind sequence updated to five problems: `tap-outcomes`, `fill-text`, `multiple-choice`, `multiple-choice`, `fill-text`.
- New assertion: `define-set-subset` has a `Subset` definition (not `theorem`), a body that covers set/empty-set/full-set in plain English, and a `subset-picker` figure with a non-empty caption.
- New assertion: `subset-fill` accepts all six lowercase/whitespace/separator variants of {red,blue}, {red,green}, {blue,green} and rejects single-color, three-color, duplicate-color, unknown-color, and empty inputs.
- New assertion: subset-fill prompt/feedback do not leak a specific 2-item answer — neither as a 2-color brace group `{...}` nor as a 2-color prose pair. The full set `{red, blue, green}` is allowed (it is the source set), so the check strips braced groups first, then scans the prose tail. The explanation field IS allowed to list all three answers (post-attempt teaching moment).
- Dropped the "body references last lesson" assertion on `define-event` — that paragraph was cut deliberately for brevity, and the definition statement carries the upgrade without prose.

**Numbers update**: 36 test files, **372 tests** (+3: subset-fill grading, subset-fill no-leak, define-set-subset shape).

---

## Curriculum: scope to classical probability ending on Expected Value — 2026-06-24

Owner pushed back on the tail of the roadmap: _"i think random variables and expected value and whatnot are not classic probability, no? more statistics."_ Half-right — academically those topics live in the _probability_ course (Pitman, Ross), but in the **AP / HS taxonomy** that the persona (D2) actually meets, the line moves: AP Stats is where RVs, EV, binomial, normal, and CLT go; "probability" effectively ends at conditional probability + Bayes. Given the persona, the HS line is the right one to draw — with one carve-out. Decision recorded as **D90**.

### What changed

- **Reshaped Unit 7** from "Random variables and expected value" (7 lessons) into **"Expected Value"** (5 lessons): `expected-value-intuition` → `computing-expected-value` → **`fair-games`** (new) → `practice-expected-value` (retitled to "Practice: gambles and insurance") → `review-expected-value` (renamed from `review-random-variables`). Chapter id `random-variables` → `expected-value`, subtitle _"When you bet on a probability, what payoff do you expect?"_
- **Dropped the entire old Unit 8** ("Famous Distributions"): `binomial-distribution`, `normal-distribution`, `central-limit-theorem`, `monte-carlo`, `capstone-problem-set` — gone from the path entirely.
- **Dropped from Unit 7**: the formal `random-variable` abstraction, `distributions-intro`, and `variance-spread`.
- **Updated comments** in `roadmapStubs.ts` and `chapters.ts` to spell out the scope decision so the next reader sees the rationale, not just an empty file.

### Why keep Expected Value

EV is universally treated as the probability capstone in the relevant textbooks (Pitman, Ross), and Brilliant's own probability path ends on EV (their Levels 4–5). It's literally "given a probability of X, what payoff do you expect?" — the natural completion of conditional probability. Skipping it would leave the course feeling truncated.

### Why drop the formal "random variable"

An HS course can teach EV without ever invoking "an RV is a function Ω → ℝ." The unit now talks about **payoffs** and **average winnings**, not random variables. Skipping the abstraction lets the unit lead with applications (fair games, gambles, insurance) instead of vocabulary, and removes a stand-alone lesson that would have been pure formalism.

### Why no Statistics course-2 stub

Owner explicitly chose not to add a "Statistics (course 2)" locked-stub chapter at the bottom of the path. The dropped material is recorded as out-of-scope in `curriculum-roadmap.md` but isn't advertised in the IA. Easy to revisit if a stats track ever materializes; the roadmap doc has the starting list ready.

### Verification

`npm run verify` is green: 27 test files, 205 tests. The catalog lost 8 lesson ids and 1 chapter; the existing chapter-structure regression tests (no orphans, no double assignment, monotonic numbering, no fallback "More to Explore") covered the change without an update. `chapters.test.ts`'s explicit `groups[1]` assertion still passes (it pins the merged "Defining Probability" chapter, which is unchanged here).

---

## Curriculum: collapse "Likelihood" + "Sample Spaces" → "Defining Probability" — 2026-06-24

Owner reviewed the path after the `how-likely` opener landed and pushed back on the top of the curriculum: _"i think which is more likely and the probability scale can be removed. then, we can probably combine sections 2 and 3."_ The opener already builds comparative-likelihood intuition (tap a die's faces, see which roll is more likely) and states the 0..1 scale in its rigorous-definition beat, so two of the planned Unit 1 lessons would have re-taught what `how-likely` just taught. Decision recorded as **D89** (also resolves the open rename suggestion in D88's gloss — "likelihood" being a distinct technical term in statistics).

### What changed

- **Dropped from `roadmapStubs.ts`:** `likelihood-compare` ("Which is more likely?"), `probability-scale` ("The probability scale"), `review-likelihood`. The third was dropped because the merge collapses two thin reviews into one (`review-sample-spaces`, retitled "Defining probability review").
- **Merged in `chapters.ts`:** the old "Likelihood" and "Sample Spaces" chapters became one chapter with id `defining-probability`, title "Defining Probability", subtitle _"From the long-run feeling to the favorable-over-total formula."_ Lesson order in the merged unit: `long-run-frequency` → `sample-space` → `equally-likely-outcomes` → `practice-single-events` → `review-sample-spaces`. Subsequent chapters renumbered down by one (now 8 unit chapters total under the "Start Here" lead, vs. 9 before).
- **Two small wiring fixes:** `how-likely`'s wrap had `segueToLessonId: 'likelihood-compare'`, now `'long-run-frequency'`. `chapters.test.ts` updated to assert `groups[1].chapter.id === 'defining-probability'` and that `long-run-frequency` is its first lesson.
- **Doc updates:** `curriculum-roadmap.md` § 3 now lists 8 units; `roadmapStubs.ts` header doc-comment notes the merge; D88's open rename suggestion is closed by linking to D89.

### Why "Defining Probability" (and not just keep "Sample Spaces")

The merged unit's job changed: it now opens with the long-run intuition lesson and lands on the favorable-over-total formula. That's the _definition_ arc, not just the listing technique. A fresh chapter id makes the merge explicit; lesson ids (`sample-space`, `review-sample-spaces`) stay stable so any future progress data and Remote Config refer to the same things.

### What stayed

- `long-run-frequency` survives — it's the _other_ definition of probability (frequentist), and it's the bridge to L2's Law of Large Numbers material later. `how-likely` only counts equally-likely outcomes; it does not teach the long-run interpretation.
- All eight downstream units are unchanged in content, just renumbered.

### Verification

`npm run verify` is green: 27 test files, 205 tests. The catalog lost three lesson ids and two unit chapters, all caught by the existing chapter-structure regression tests (no orphans, no double assignment, monotonic numbering, no fallback "More to Explore" chapter).

---

## Curriculum skeleton — full roadmap scaffolded as locked stubs — 2026-06-24

Owner asked to "refactor the pages (the lessons)" toward the fuller probability sequence from [`curriculum-roadmap.md`](curriculum-roadmap.md): _"feel free to leave further lessons blank. lock them. don't change any content for now, but names/stuff are good."_ Decision recorded as **D86**.

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
- A blank lesson is double-locked: `comingSoon: true` _and_ `useLessons`' empty-slots safety net.

### Two regressions the refactor would have caused — both fixed

1. **Trophy reward.** `CoursePath` marked the _last_ chapter's checkpoint as the 250-coin "course complete" trophy. Appending nine all-locked chapters would have demoted the live final chapter to a 100-coin chest and parked the trophy behind unreachable content. Fixed: the trophy chapter is now "the last chapter that still has a playable lesson" (`trophyGroupIdx` in `CoursePath.tsx`). For today's state this reproduces the old behavior exactly (trophy on "Going Deeper"); it migrates forward automatically as units are authored. Trade-off: the trophy now sits mid-path with locked previews below — acceptable and self-correcting.
2. **"0/0" banner.** A unit with no playable lessons showed a meaningless "0/0" in `ChapterBanner`. Fixed to render a "Soon" lock chip when a chapter has zero available lessons. (Per-chapter `Checkpoint`s already rendered their correct locked state for all-stub units — no change needed.)

### Tests

- Updated the catalog test (`01-what-is-probability.test.ts`): no longer pins length to 6; asserts the five live lessons come first in order, everything after is a blank/locked stub, ids are globally unique, and numbering is sequential/monotonic.
- New `src/features/course/chapters.test.ts`: every `chapter.lessonIds` resolves to a real lesson, no lesson is in two chapters, every catalog lesson is chaptered (the generated "More to Explore" fallback never appears), chapters are uniquely + sequentially numbered, and grouping preserves order.
- `npm run verify` green: 188 + 5 = 193 tests, typecheck + lint clean.

### Authoring a stub later

Fill the stub's `slots`, then add its id to `available_lesson_ids` (the local default in `remoteFlagsConfig.ts` and the live Remote Config template). No other wiring. As live content reaches a new unit, the trophy and the "Soon" chips update themselves.

---

## Review mode — let the learner redo questions (sandboxed, no consequences) — 2026-06-23

After the flashcard work landed, owner exercised review mode (the read-only walkthrough that the home-screen "Review a lesson" CTA + the back-arrow on completed slots both route into) and pushed back: _"in review mode, it should still allow you to redo the question. you just don't gain xp and it also doesn't penalize or reward you or block anything."_

### Old behavior

Review mode was a strict read-only walkthrough:

- `onChange` and `onVariantPicked` were forced to `() => {}`, so the interaction's input handlers did nothing.
- `feedbackState` was forced to `'idle'`, so the regular check / wrong / correct UI never lit up.
- The regular `LessonFooter` (with Check / Continue) was swapped out for a `ReviewFooter` that only had a Next button + an italic "Reviewing — your progress is unchanged" line.

The net effect: the learner could _see_ every slot they'd already done, but couldn't try anything again. That defeated the most useful part of revisiting a lesson.

### New behavior

Review mode is now a _sandboxed retry_: full interaction, full feedback, zero persistence.

- Inputs flow normally: `onChange`, variant pick, etc. drive the same `currentAnswer` / `useSlotState` machinery as a fresh attempt.
- Check + Continue use review-only handlers (`handleCheckReview` / `handleContinueReview`) that compute feedback via the existing pure `checkAnswer` and dispatch CORRECT/WRONG to the local reducer — but never call `recordAttempt`, `recordVariantSelection`, `applyAttemptOutcome`, `markLessonCompleted`, `applySlotAdvance`, or `advanceSlot`. No analytics either (review attempts shouldn't pollute `attempt_checked` series).
- All the existing UI behaves as it does in normal play: wrong-answer shake, the after-2-tries explanation reveal (since `useSlotState` is purely local, this Just Works), the soft success/error wash on the footer.
- The footer is the regular `LessonFooter` again; the "review" affordance moves to a thin banner under the header reading `Review · retries don't affect XP or progress`. That keeps the read-only-stats promise visible without stealing the Check button.
- Variant pick is doubly safe: `handleVariantPicked` early-returns whenever `isReview` is true (in addition to the pre-existing "selectedVariantIds already has it" guard). There's no path from review mode to a Firestore write.

Mid-lesson back-navigation review (`viewSlotIndex < slotIndex` while `?mode=review` is _not_ set) gets the same treatment — those are also "I've already done this and want to try it again", and the same handlers apply.

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

Triggered by an owner note immediately after the new L3 landed: _"we should have a slide introducing each new theorem. eg. multiplication principle should have a theorem. and we should have a practice problem for it."_ Scope was widened in the same conversation to _"everywhere a named rule appears, but not derivations — for derivations, we should have a dedicated derivations page, formatted a bit like bookmarked pages in a notebook."_ Recorded as D77.

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

| Lesson | Slot                                                                                   | What changed                                                                                                                                                                                                       |
| ------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| L1     | `equally-likely`                                                                       | Added theorem ("Equally-likely outcomes"); dropped redundant `example` (the formula now lives in the theorem statement).                                                                                           |
| L1     | `reduce`                                                                               | Converted `example` ("Why 3/6 = 1/2") → `derivation`. Pre-existing rendering bug fixed: `{(3/3)/(6/3)}` was unparseable by the `{a/b}` regex (multiple slashes); rewrote that step as plain prose.                 |
| L1     | `two-dice-intro`                                                                       | Converted `example` ("Why 6 × 6 = 36") → `derivation`.                                                                                                                                                             |
| L3     | `multiplication-principle`                                                             | Added theorem; kept the closet-outfits worked example.                                                                                                                                                             |
| L3     | `addition-principle`                                                                   | Added theorem; kept the bus-or-train example.                                                                                                                                                                      |
| L3     | `permutations`                                                                         | Added theorem (n! and nPk forms); kept the A/B/C arrangements example.                                                                                                                                             |
| L3     | `combinations`                                                                         | Added theorem; converted `example` ("Why divide by k!") → `derivation` and expanded it to a 5-step proof with a sanity-check at the end.                                                                           |
| L3     | `complement`                                                                           | Added theorem ("Complement rule"); kept the at-least-one-head example.                                                                                                                                             |
| L4     | new slot `birthday-derivation` (inserted between `birthday-sim` and `how-many-people`) | New concept slot whose payload is a `derivation` showing `P(no shared) = 365/365 × 364/365 × … × 343/365 ≈ 0.493 → P(match) ≈ 0.507`. References the multiplication principle and complement rule from L3 by name. |
| L5     | `intro`                                                                                | Promoted to enriched shape: title, body paragraph, plus a theorem callout for the conditional-probability formula `P(A                                                                                             | B) = {P(A and B) / P(B)}`. |

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

## "How likely?" course opener + collapse to the 9-unit plan — 2026-06-24

Owner asked to merge the five authored lessons into the new 9-unit curriculum
(`curriculum-roadmap.md`), update the path UI, and ship one demo-able lesson by
tonight with the rest locked, without losing the carefully planned problem types
/ interactions. Audience refined to a curious, algebra-comfortable younger
learner (enrichment, not test prep); rigor must stay but be manageable
(derivations clear, theorems always introduced with an explanation). Built on a
`two-dice-demo` branch off `main` so the prior arrangement is preserved.
Decision recorded as **D88**.

The design evolved over the session: it started as a focused mid-path "two
dice" lesson, then (owner: "two dice is kinda hard, but you can just look at it"
and "what if we introduce likelihood, first one die, then two dice") became a
gentle-ramp **course opener** at the front of the path.

### What shipped

- **New opener** `src/content/lessons/how-likely.ts` (id `how-likely`, number 1,
  ~6 min). Arc: **welcome + a pull-quote** (Oscar Wilde) → **the famous hard
  questions** (lottery, soulmate, shared birthday) with "probability can take a
  swing at all of these" → **tap one die's faces** ("how many ways to roll a
  die?", `tap-outcomes`) → an **intuitive definition** ("probability is how likely
  you get what you want, out of all the ways") that gives the tap a purpose and
  softens the jump into fractions → two **tap-to-count `fill-fraction` questions,
  easy first** (P(roll a 5) = 1/6, then P(roll even) = 3/6; inputs annotated "ways
  to roll …" / "ways in total") → a **comparison that seeds the key principle**
  (more likely to roll even or a 5? more ways → bigger fraction → more likely) →
  a **sharper "better definition" of probability** (the rigorous `{k/N}` theorem)
  → **apply it** to P(rolling a 3) (no die-tap scaffold now), then a playful
  big-number check (P(roll 14 on a 67-sided die) = 1/67, the formula scales) → a
  **flip-to-reveal flashcard** ("why is a probability always between 0 and 1?",
  read-only, via the `derivation.question` card) → **Captain Pascal's commit-once
  challenge** (with the "Roll the dice!" roller under the game intro, so the
  learner can get a feel for the totals before answering) ("he wins on
  7, you win on 2, is it fair?") → the signature 6×6 `grid-event` → derive the
  36-roll count by cases → wrap (the game was never fair: 6 ways vs 1). Opening
  big-and-human then landing on the humble die was an owner call; the
  one-die-vs-two-dice contrast is the lesson (one die: counting trivial, all
  equal; two dice: rolls equal, totals not). The tap-and-count even question is
  placed _before_ the definition (you can tap to discover favorable/total), which
  the definition then names.
- **Rigorous definition of probability (owner request).** A `definition` concept
  beat after the one-die tap states it precisely: probability is favorable / total
  when outcomes are equally likely, a number from 0 (never, "rare") to 1 (always,
  "common"). Delivered as a named `theorem` ("Probability", `{k/N}`) with a plain
  gloss, anchored on the die the learner just counted. **Terminology:** the term
  is **probability**, not "likelihood" — in statistics "likelihood" is a distinct
  technical concept (the likelihood function), so the defined quantity is named
  probability; "likely" stays as casual English. (Open suggestion to the owner:
  rename the Unit 1 "Likelihood" chapter accordingly.)
- **Count derived after the grid, by cases (owner fix).** An earlier draft put a
  "6 × 6 = 36" concept page _before_ the grid, which smuggles in the multiplication
  principle (its own later lesson) before it is taught. Now the 36 count comes
  _after_ the grid, as the `count-the-rolls` derivation flashcard, built by
  enumeration: "first die shows 1, the second has 6 options; first die shows 2, 6
  options; … six cases of 6, so 6+6+6+6+6+6 = 36." No named theorem, no "sample
  space" term (Unit 2). Rule: show the idea concretely, name the tool in its own
  lesson — with the lone principled exception that the course's core object,
  probability itself, is defined up front.
- **Dice roller moved to the challenge.** The "Roll the dice!" two-dice
  simulator was extracted from `GridEvent` into a reusable `DiceRoller`
  component and now renders under Captain Pascal's game intro (via
  `MultipleChoiceVariant.showDiceRoller`), not on the grid slot, so it doesn't
  compete with the 6×6 grid on the next slide. `simulationEnabled` dropped from
  this lesson's grid variants (the flag still works for other lessons).
- **Revived `tap-outcomes`.** It had been unused in production since Lesson 1 went
  multiple-choice; the renderer (3D dice faces), dispatch, and `checkAnswer` arm
  were all still present and tested, so the one-die tap beat reuses it directly.
- **New `quote` concept-slot field.** A small optional `ConceptSlot.quote`
  (`{ text, attribution? }`) renders as a styled pull-quote box (large quotation
  mark, italic, centered) under the lede, via `ConceptSlotView`. Validated in
  `assertLessonInvariants`. Same pattern as the `theorem`/`derivation` additions
  (D75/D77). The welcome uses it; quote sourced from The Probability Web.
- **Commit-once "challenge" questions (engine change).** New optional
  `ProblemSlot.commitOnce` lets a question be answered exactly once and unlock
  Continue right OR wrong, a deliberate exception to the no-bail-out gate (D55)
  for gut-check/prediction questions whose payoff is the reveal on later slots.
  Wired via a new `allowContinueOnWrong` prop on `LessonFooter` (a wrong answer
  hides Check and shows Continue, keeping the coral "wrong" wash + the matching
  `feedbackByOption` copy). Correct shows the green "good call, let's prove it";
  wrong shows "lots of people say that, let's prove them wrong." A sibling
  `ProblemSlot.challenge` flag renders a "Challenge question" banner with the
  Captain Pascal mascot above the interaction (`ProblemSlotView`). Used by the
  fair-game challenge. (Edge: a wrong commit still counts against the `flawless`
  achievement; acceptable, not surfaced.)
- **Annotated fraction inputs.** Optional `FillFractionVariant.numeratorLabel` /
  `denominatorLabel` render small labels beside the numerator/denominator inputs
  (e.g. "ways to roll even" / "ways in total"), so the favorable-over-total idea
  is legible while typing. Validated in `assertLessonInvariants`.
- **In-interaction teaching note (`afterNote`).** Optional `BaseVariant.afterNote`
  renders a caption _inside_ the interaction (below its content) once the answer
  is correct, distinct from the footer feedback. Rendered by `tap-outcomes` and
  `fill-fraction`. Used so the one-die tap reveals "There are six ways to roll a
  six-sided die" under the faces, and the first fraction reveals "This fraction
  you just worked out tells us how likely something is to happen." (Note: copy
  before the definition says "fraction"/"how likely", not "probability".)
- **Path collapsed to the 9-unit plan.** Removed the old three-chapter spine
  (`foundations` / `counting` / `deeper`) from `chapters.ts`; chapters are now
  "Start Here" (1) + the nine units (2–10). The duplication D86 introduced (each
  topic shown once dense, once as a locked stub) is gone. The catalog re-numbers
  lessons by position in `content/index.ts`, so display order stays monotonic.
- **Locked the rest.** Bundled Remote Config default narrowed to `['how-likely']`;
  every other unit lesson (including the `two-dice` stub, reserved for the future
  Unit 3 compound lesson) is blank and locked.
- **Big treasure moved to the path bottom.** `CoursePath` `trophyGroupIdx` now
  always points at the last chapter (Famous Distributions), so the course-complete
  treasure is the aspirational end-of-path goal (locked until then) rather than
  parked on the last playable chapter near the top. Reverses the D86 trophy
  placement; earlier chapters keep their regular chests.
- **Non-destructive.** `lesson1`–`lesson5` + the `distributions` stub stay
  imported and re-exported from `content/index.ts` as the content reservoir for
  the future splits; their files and per-file tests are untouched.

### Wiring audited (no old code broken)

- `HeroCard` no longer hardcodes `/lesson/what-is-probability` for a new learner's
  "Start" — it follows the catalog's first playable lesson.
- `recommendations` / `courseProgress` / `CelebrationScreen` all filter
  `!comingSoon` and look up by id, so they resolve to `how-likely` cleanly.
- Tests updated: catalog block in `01-what-is-probability.test.ts` (asserts
  `how-likely` is the only playable lesson, at number 1), `chapters.test.ts`
  (first chapter `start-here`), `remoteFlagsConfig.test.ts` (default enables
  `how-likely`). New `how-likely.test.ts`. `npm run verify` 200/200 green; earlier
  build was 293.97 KB gz (under the 300 KB ceiling).

### Issue hit — live Remote Config publish blocked, fixed with a defaults floor

`RemoteFlagsProvider` calls `fetchAndActivate` and reads the live, **shared**
`available_lesson_ids` template, which lists the old five lessons (v3) and not
`how-likely`. Once the fetch resolves it overrides the bundled default and would
re-lock the opener. Publishing a fix via the Firebase MCP failed (permission),
and setting the live value to just the opener would lock `main`'s five lessons.
**Fix shipped:** `RemoteFlagsProvider` now unions the live list with the bundled
defaults, so a lesson this build ships as available can never be hidden by a
stale shared template — the opener stays unlocked locally and when deployed,
with no RC publish needed. Trade-off: a defaulted id can't be taken down purely
via RC (fine here; the default set is just the opener).

### Deferred

The actual content splits of Lessons 1/3/5 into their granular unit lessons, and
authoring the rest of Unit 3 (`two-coins`, `two-dice`, `tree-diagrams`,
`multiplication-principle`), per `curriculum-roadmap.md` §4/§7.

---

## Changelog

### 2026-06-23 — Immediate issues resolved (T1-01 through T1-06)

| ID    | Fix summary                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| T1-01 | `sendEmailVerification` called in `registerUser`; `EmailVerificationBanner` added app-wide                       |
| T1-02 | `Die` redesigned as isometric SVG cube; `TapOutcomes` buttons enlarged + physical box-shadow + spring press      |
| T1-03 | `DieContext` widget added to `FillFraction` for `showDieContext` variants; tappable d6 faces with live count     |
| T1-04 | `wrongTick` counter in `useSlotState`; threaded to `LessonFooter` (animation key) and `GridEvent` (flash effect) |
| T1-05 | `DiceSimulator` component in `GridEvent` — "Roll the dice!" button with tumbling animation + sum display         |
| T1-06 | `MultipleChoiceVariant` extended with `context` + option `subtext`; both dice-sum variants updated               |

### 2026-06-23 — Economy, forgiveness, cosmetics, branding & schedule UX

> A batch of engagement + identity features that extended (and in one case reversed) the original Phase 1 scope. Per-decision rationale: alternatives **D79–D83** (the coin economy is D83 — D78 was taken by the flashcard-derivation work); non-goal reconciliation in [`prd.md`](prd.md) §8 / §9.10 and [`spec-habit-loop.md`](specs/spec-habit-loop.md). All grounded in learning science — coins are cosmetic-only to avoid the over-justification effect, the freeze softens punishing streaks (self-determination), and Captain Pascal's tips reinforce spacing / retrieval / learning-from-errors.

| Decision | Feature                                                                                                                                                                                                                          | Key files                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **D83**  | **Coin economy** — earned only from chests (100), trophy (250), achievements (25); spent only on cosmetics + freeze. Idempotent Firestore transactions; `coins` / `claimedChests` on `users/{uid}`.                              | `lib/coins.ts`, `economy/coinService.ts`, `economy/CoinChip.tsx`, `course/Checkpoint.tsx`                                            |
| **D79**  | **Streak Freeze** (supersedes D34) — 200 coins, hold ≤2, auto-consumed in `nextStreak()` before reset; snowflake chip + toast.                                                                                                   | `lib/streak.ts`, `habit/habitService.ts`, `economy/coinService.ts`, `course/HomePage.tsx`                                            |
| **D80**  | **Avatar styles + profile flair** — cosmetic, bought once (private `ownedAvatarStyles`/`ownedFlair`), equipped value mirrored to `publicProfiles`.                                                                               | `economy/avatarStyles.ts`, `economy/profileFlair.ts`, `economy/FlairBadge.tsx`, `profile/DefaultAvatar.tsx`, `economy/StorePage.tsx` |
| **D81**  | **"Probability Pirates" + Captain Pascal** — public brand + mascot; internal package/namespace stays `pascal`. Captain's Log tip card + lesson-intro cameo.                                                                      | `components/Brandmark.tsx`, `illustrations/CaptainMascot.tsx`, `captain/*`, auth pages, `index.html`                                 |
| **D82**  | **In-app schedule reminder + event detail** — today-scoped reminder dialog (once/day, `localStorage` dismissal); tappable event detail resolving linked lesson + full notes.                                                     | `schedule/reminderRules.ts`, `schedule/ScheduleReminder.tsx`, `schedule/scheduleService.ts`, `schedule/SchedulePage.tsx`             |
| **D84**  | **Progress nav section (locked stub)** — nav entry with lock badge → read-only `/progress` placeholder previewing future AI-assisted insights; deferred under D23.                                                               | `components/AppShell.tsx`, `features/progress/ProgressPage.tsx`, `App.tsx`                                                           |
| **D85**  | **Practice nav section (locked stub)** — Alcumus-style adaptive practice with LLM-generated, correctness-vetted problems; lock-badged "Arriving Friday" → read-only `/practice` placeholder. Full engine deferred (reopens D23). | `components/AppShell.tsx`, `features/practice/PracticePage.tsx`, `App.tsx`                                                           |

| Area           | Notes                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security rules | `users/{uid}` allowlist extended with `coins`, `claimedChests`, `streakFreezes`, `avatarStyle`, `ownedAvatarStyles`, `profileFlair`, `ownedFlair`; public mirror fields stay PII-free. |
| Content        | Removed the "Reducing the fraction" concept slot from Lesson 1 (per request); tests updated (7 → 6 concept slots).                                                                     |
| Tests          | New pure-logic suites: `coins`, `avatarStyles`, `profileFlair`, `reminderRules`, plus streak-freeze cases in `streak.test.ts`. Full `npm run test` + `build` green (162 tests).        |

---

## Phase 2 — AI plan locked — 2026-06-25

> Working session: scope the Phase 2 AI layer, write the PRD + specs, and document the decision history before writing a line of implementation code. Pairs with [`docs/prd-phase2.md`](prd-phase2.md), the new specs ([`spec-practice`](specs/spec-practice.md) extended, [`spec-learner-model`](specs/spec-learner-model.md) new, [`spec-ai-assist`](specs/spec-ai-assist.md) new), and **D92–D98** in [`docs/alternatives.md`](alternatives.md). Reverses **D23** (no AI in MVP) intentionally and partially — the "no SDK in bundle, no key in build" property is preserved literally.

### Decided feature set (the spine)

- **F1 — Track 1 adaptive practice.** Unlimited problems generated client-side from in-repo parameterized templates; `solve()` (code) is the answer; Monte-Carlo cross-checked in CI. No runtime LLM. Replaces the "Arriving Friday" stub at [`PracticePage.tsx`](../src/features/practice/PracticePage.tsx).
- **F2 — Personalized hint / wrong-answer explanation.** Vercel function (`/api/hint`) calls Gemini via `fetch` (no SDK), grounded in the learner's actual `answerPayload` + weak skills + the code-verified answer. Hand-written copy is the fallback. Triggers: after 2 strikes in a lesson; after a wrong answer in practice.
- **F3 — Per-learner mastery model.** Owner-only `users/{uid}/learnerModel/state` doc with per-skill Elo + recency-weighted accuracy + misconception counts. Materialized from the existing `stepAttempts` log. Drives F1 difficulty + topic auto-suggest, and F2's hint personalization. Visible "Strengths / keep working on" panel on Progress + Profile.

### Stretch (ship if ahead)

- **F4 — Teach the recruit.** Learner tutors a naive AI student; the LLM is the _student, not the judge_. Structured-JSON rubric mapping + a code-verified transfer problem decides "got it." Misconceptions flow into F3.
- **F5 — Offline vetted problem bank + end-of-session AI recap.**

### Deliberately rejected

Open chatbot; RAG / vector DB / embeddings; lesson-path reordering; live per-request generation; Firebase AI Logic client SDK; LLM-only grading of free text. Reasoning in [`alternatives.md`](alternatives.md) D93, D96, D97 and the Brainlift outline.

### Architecture decisions at a glance

| Choice | Why |
| --- | --- |
| **Vercel serverless `/api`** over Firebase Cloud Functions (Blaze) | Free, already in deploy pipeline, no second backend (D92) |
| **`fetch` to Gemini REST**, no SDK | Preserves PRD §9.10 AC #1 "no model SDK in bundle" literally (D93) |
| **Gemini free tier** (no credit card) | $0 cost; Project Spend Cap as escalation (D95) |
| **Solver runs first, then prompt** | "The math is right" — code computes the answer, model phrases prose (D23 amendment) |
| **Closed-set skill + misconception taxonomy** | Interpretable, debuggable, no embeddings/RAG needed at this corpus size (D97) |
| **LLM is student, never judge** | Avoids sycophancy + correlated-error failure modes for free-text input (D96) |
| **Owner-only subcollections** for learner model + practice state | Avoids touching the tight `users/{uid}` update allowlist; consistent with `lessonProgress` pattern |

### Learning-science levers baked into the design

- Adaptive difficulty targets ~20–30% miss rate (failure >50% demotivates).
- Templates organized by retrieval form (definition → operation → procedural → application); the engine interleaves forms within a topic.
- Recency-weighted accuracy + a delayed-retrieval bonus on Elo updates ("performance ≠ learning").
- Worked-solution always rendered after a wrong answer (worked-example effect).
- Pretrieval slots (Phase 1 `commitOnce`) retained; nothing diluted.
- Teach-the-recruit pairs the protege effect with a rubric + transfer problem so the LLM's praise cannot fake mastery.

### Implementation order (each step deployable; AI-off path always intact)

1. **Verification core** — `src/lib/probability/exact.ts` + Monte-Carlo cross-check tests.
2. **Learner model** — skill taxonomy in `src/content/skills.ts`, optional `skills?: SkillId[]` on `Variant`, `learnerModelService` hooked into the same path as `recordAttempt`, owner-only rules, Strengths panel.
3. **Track 1 practice** — 6 template families with `solve`/`explain` + tests, `practiceEngine` adaptive serving, replace [`PracticePage.tsx`](../src/features/practice/PracticePage.tsx) reusing existing interaction renderers, wire `grantPracticeXp` + learner model.
4. **AI hint / explanation** — `/api/hint.ts` (token verify → solve → Gemini fetch → JSON), `aiHintService.ts` client adapter wired into the after-2-strikes hint + practice, `VITE_AI_ENABLED` flag + hand-written fallback.
5. **Stretch** — `/api/teach.ts` + rubric + transfer problem for one concept; offline vetted bank in `scripts/practice/`; session recap.

### Day-by-day (each ends deployable)

- **Wed/now:** PRD + specs drafted, decisions locked, AI scaffold + Gemini key staged. (This entry.)
- **Thu:** Workstreams 1–3 — verification core, learner model, Track 1 templates + engine. Unlock `/practice` behind the flag (no LLM yet).
- **Fri (Phase 2 deadline):** Workstream 4 — `/api/hint` + fallback wiring; AI-off toggle demonstrated.
- **Sat:** Strengths panel + topic auto-suggest live; stretch (teach-the-recruit minimal, vetted bank, recap); phone test + rate-limit fallback verified.
- **Sun:** Final deploy, phone smoke test, Brainlift written, closed-loop demo recorded.

### Verification ("the AI never gives a wrong answer")

- **Exact arithmetic oracle:** `src/lib/probability/exact.ts` — bigint `Fraction`, `nCr`, `nPr`, factorial.
- **Cross-check:** every template ships a vetting test asserting `solve()` agrees with `simulate()` over ≥1,000 sampled params (and exact enumeration where the space is small ≤ 10⁴). Failure blocks CI.
- **Prompt grounding:** `/api/hint` and `/api/teach` compute `solve()` server-side first and pass it as ground truth; model phrases prose around it. No model-only numbers, ever.

### Property preservation note

PRD §9.10 AC #1's wording ("no model SDK in `package.json`, no API key in `.env` or the deployed build") is preserved **literally**: SDK never enters `package.json`, key only as a Vercel server-side env var. AC #1's _spirit_ ("the deployed app teaches without an AI dependency") is preserved by the AI-off fallback path being a full first-class citizen.

---

## Practice problem bank layout locked — 2026-06-25

> Design decision for the Phase 2 practice build: runtime Track 1 templates are
> organized by Practice topic folders, not as one flat `templates/` directory.
> Formal decision: **D99** in [`alternatives.md`](alternatives.md). WP-4 handoff:
> [`wp-4-layout-handoff.md`](specs/wp/wp-4-layout-handoff.md). Proposal:
> [`problem-bank-layout-proposal.md`](curriculum-harvest/problem-bank-layout-proposal.md).

### Decision

Use topic folders for runtime practice templates:

```text
src/features/practice/templates/
  counting/
  complement/
  conditional/
  distributions/
  long-run/
```

Each template still exports the frozen C5 `Template` contract and registers in
the single WP-3 `TEMPLATES` array. This is a file-layout decision only: the
practice engine, learner model, XP rules, Firestore shape, and UI work packages
do not change.

### Why this matters

The original WP-4 spec was written for the first six families and used a flat
path (`src/features/practice/templates/<id>.ts`). The curriculum-harvest pass
quickly produced many more plausible families: complements, conditional tables,
Bayes/base rates, independence tests, expected value, representation choice, and
mixed strategy review. A flat directory would become noisy immediately and would
likely be reorganized after tests/imports already existed.

Topic folders make the bank easier to review and safer for parallel agents:

- complement agents can work in `templates/complement/`,
- conditional agents can work in `templates/conditional/`,
- tests stay beside their family,
- WP-3 keeps the one shared registry WP-6 already expects.

### Non-goals / boundaries

- Do **not** change `wp-contracts.md` C5/C6.
- Do **not** create per-topic runtime registries in v1.
- Do **not** create the Track 2 static problem bank yet.
- Keep review artifacts in `docs/curriculum-harvest/generated-problems/`.
- Static vetted problems, if/when Track 2 ships, should live under
  `src/content/practiceProblems/` as curriculum content, not executable template
  code.

### Follow-up required

- Update `wp-4-template-families.md` so WP-4 agents use
  `templates/<topic>/<id>.ts`.
- Update `spec-practice.md` to match.
- If any flat WP-4 files already exist, move them into topic folders and update
  only imports/registry paths. Preserve behavior and tests.

---

## Runtime practice bank loaded — 2026-06-25

> The WP-4 template families are now usable as the live Track 1 practice bank.
> Reproducible workflow: [`runtime-generation-workflow.md`](curriculum-harvest/runtime-generation-workflow.md).

### What changed

- `/practice` now loads from the registered runtime template bank (`TEMPLATES`)
  via `pickNextTemplate` + `generateInstance`.
- `TopicPicker` lets the learner choose a topic and can default to the weakest
  practiced topic once the learner model exists.
- `PracticeSession` renders the generated `Variant` through `InteractionDispatch`,
  grades with `checkAnswer`, shows the worked solution, then generates another
  instance on "Next problem."
- Correct answers write the intended practice signals: per-topic practice state,
  daily-capped practice XP, and per-skill learner-model Engine A mastery.
- Review artifacts for all six templates are generated under
  `docs/curriculum-harvest/generated-problems/runtime-templates/`.

### Verification workflow

Each review problem is generated from the actual runtime template and verified by:

- `answerToPayload` + `checkAnswer`,
- exact `solve()`,
- Monte Carlo simulation for numeric probability templates,
- structural verification for conceptual / multiple-choice templates,
- source-wording audit against harvested chunks.

### Copy fixes from review

- Removed Markdown emphasis markers from runtime prompts because the existing
  renderers display prompt strings as plain text.
- Changed `conditional-bayes-2x2` from a medical disease scenario to a neutral
  "rare signal" scenario.
- Fixed `gambler-fallacy-mc` so die streaks use `1/6` rather than `1/2`.
