# Issues Log

> Running log of open issues, ambiguities, and blockers discovered before or during implementation.
> Companion to:
>
> - `docs/alternatives.md` — _closed_ design decisions with rationale.
> - `docs/prd.md` — what we contracted to build.
> - `docs/build-order.md` — the order we ship features in.
>
> **Implementer rule:** read this file at the start of every task. Append to it whenever you hit something the spec doesn't cover. See `docs/architecture.md` §12 Engineering Guardrails.

---

## How to use this doc

When you, the implementer:

| Situation                                                                                         | Action                                                                                                                                                |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| The spec leaves something genuinely ambiguous (two valid interpretations)                         | **Stop.** Log it under "Open — ambiguity". Ask in chat. Do not silently pick one.                                                                     |
| You need to make a design decision the spec/alternatives don't cover                              | Log it under "Open — needs-decision" _with_ your proposed answer + reasoning. Ask. If approved, the answer gets promoted into `docs/alternatives.md`. |
| You find a real bug in spec or code                                                               | Log it under "Open — bug".                                                                                                                            |
| You're blocked on something external (Firebase project not yet created, missing credential, etc.) | Log it under "Open — blocker". Surface it; do not work around.                                                                                        |
| You knowingly skipped a non-essential feature for now                                             | Log it under "Open — known-gap" with what's missing and what would unblock it.                                                                        |
| You decided something locally and shipped (e.g. picked a small visual default)                    | Log it under "Closed — ad-hoc decision" so it can be audited later. Do not let these accumulate silently.                                             |

### Issue format

```
### I### — <one-line title>

- **Status:** open | resolved | wontfix | needs-decision
- **Type:** ambiguity | needs-decision | bug | blocker | known-gap | ad-hoc-decision
- **Severity:** blocker | major | minor
- **Discovered:** YYYY-MM-DD by <agent/human> during <task>
- **Spec ref:** <file:line> or "N/A"
- **Description:** what's wrong or unclear, in 2–4 sentences.
- **Proposed action:** the concrete next step.
- **Resolution:** (filled in when status = resolved) what was done, link to commit/PR.
```

IDs are monotonically increasing, zero-padded to 3 digits, **never reused**.

---

## Open issues

### I001 — Lesson 1 variants are missing the `explanation` field

- **Status:** open
- **Type:** known-gap
- **Severity:** major
- **Discovered:** 2026-06-23 during PRD review
- **Spec ref:** `src/content/lessons/01-what-is-probability.ts`; convention in `src/content/types.ts` (`BaseVariant.explanation?`)
- **Description:** D55 introduced the progressive hint model — after 2 wrong attempts on a slot, the player surfaces `variant.explanation` as a deeper hint. Lesson 1 was authored _before_ the field existed, so none of its 9 variants populate it. With no `explanation`, a stuck learner just sees the same `feedbackDefault` over and over.
- **Proposed action:** Author one `explanation` per variant in Lesson 1 before shipping the player. Use the `FEEDBACK_TODO()` helper as a placeholder so `npm run audit-feedback` surfaces them; the user (content owner) fills them in.

### I002 — `firebase/` config files do not exist in the repo yet

- **Status:** open (partial: CLI + Firestore rules scaffolded 2026-06-23; Storage rules still omitted per D72)
- **Type:** blocker
- **Severity:** blocker (for spec-auth and onward)
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/architecture.md` §2; `firebase/firestore.rules`, `firebase/firestore.indexes.json`, `firebase.json`, `.firebaserc`
- **Description:** `firebase.json`, `.firebaserc`, `firebase/firestore.rules`, and `firebase/firestore.indexes.json` now exist. Auth + Firestore emulator ports configured. **`firebase/storage.rules` and Storage emulator omitted** per D72 / I026. Emulator seed dir (`firebase/seed/`) not created yet.
- **Proposed action:** Sonnet verifies emulator start on spec-auth. Add `firebase/seed/` when writing emulator integration tests. Add Storage rules only when I026 is closed.

### I026 — Firebase Storage deferred (no Blaze plan)

- **Status:** open (accepted gap until Blaze upgrade)
- **Type:** known-gap
- **Severity:** minor (avatar upload only; rest of MVP unaffected)
- **Discovered:** 2026-06-23 during Firebase setup
- **Spec ref:** `docs/alternatives.md` D72; `spec-profile.md` avatar upload section
- **Description:** Cloud Storage requires Firebase Blaze (pay-as-you-go). Project stays on Spark. Avatar upload is out of MVP scope. Profile uses `DefaultAvatar` only; hide "Change photo" in Edit Profile. Do not deploy Storage rules or wire `avatarService` until this issue is closed.
- **Proposed action:** Owner upgrades to Blaze and enables Storage when ready, then close this issue and implement avatar upload per spec-profile. Until then, Sonnet ships profile without photo upload.

### I004 — Vercel project not yet linked

- **Status:** open
- **Type:** blocker
- **Severity:** blocker (for any deploy)
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/deploy-checklist.md` (pending)
- **Description:** No Vercel project linked to the GitHub repo. First preview deploy blocked.
- **Proposed action:** Human task — `vercel link`, set env vars from Firebase config, confirm preview deploy on push.

### I005 — `.env.example` is referenced but not committed

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/architecture.md` §4
- **Description:** Architecture doc shows the contents of `.env.example` but the file isn't in the repo. New contributors won't know what envs to copy.
- **Proposed action:** Create `.env.example` verbatim from `docs/architecture.md` §4 as part of spec-auth implementation (since spec-auth is the first feature that needs envs).

### I006 — `npm run verify` script is referenced but not defined in `package.json`

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/build-order.md` §"Definition of Done per spec" line 5
- **Description:** Build-order says every spec is "done" when `npm run verify` passes. That script doesn't exist yet. Should be `tsc --noEmit && eslint . && vitest run` (or similar) wired into `package.json`.
- **Proposed action:** Add the `verify` script in the same PR that introduces the first feature spec (spec-auth).

### I007 — Audit-feedback script does not yet enforce in CI

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `scripts/audit-feedback.ts`
- **Description:** The script prints a backlog but exits 0 either way. CI does not fail on missing feedback. Acceptable while content is in flux; tighten before launch.
- **Proposed action:** Once Lesson 1 content is final, change the script to `process.exit(1)` if backlog is non-empty, and add it to the CI workflow.

### I009 — Browser back button behavior during a lesson is unspecified

- **Status:** needs-decision
- **Type:** ambiguity
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `spec-lesson-player.md` describes the Close (×) button and confirm dialog, but not the browser back gesture
- **Description:** Spec says the Close (×) button opens a confirmation dialog. Browser back (or iOS swipe-back) is unaddressed. If it just exits to Home, the learner loses the "are you sure" moment.
- **Proposed action:** Recommend intercepting `popstate` while a lesson is in progress and showing the same confirmation dialog. Need confirmation before implementing.

### I010 — Two-tab concurrent play behavior is undefined

- **Status:** needs-decision
- **Type:** ambiguity
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `spec-progress-persistence.md` edge case "Two devices write at the same time" addresses cross-device; same-browser-two-tabs is implicitly the same case but UX is louder
- **Description:** If a learner opens Lesson 1 in Tab A and Tab B, both tabs subscribe to the same `lessonProgress` doc. Tab A's writes flow into Tab B's UI mid-interaction. Probably fine (Firestore atomic ops handle the data layer), but the UI may flicker or jump.
- **Proposed action:** Accept as known-gap for MVP; manual test confirms whether the flicker is acceptable. If bad, add a soft warning toast "Lesson is open in another tab — close this one."

### I011 — No SVG illustration assets exist yet

- **Status:** open
- **Type:** blocker
- **Severity:** blocker (for spec-lesson-player concept slots and spec-habit-loop celebration)
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/ui-stack.md` §"Illustrations"; `IllustrationRef` in `src/content/types.ts`
- **Description:** Concept slots reference die, coin, cards. The celebration screen references a trophy. None exist. Player will crash or render a blank if not stubbed.
- **Proposed action:** Implement `src/components/illustrations/{Die,Coin,Cards,Trophy}.tsx` as inline SVGs as part of spec-lesson-player (concept slot rendering) and spec-habit-loop (celebration). Use minimalist Brilliant-style line art.

### I012 — shadcn/ui and Animbits not installed yet

- **Status:** open
- **Type:** blocker
- **Severity:** setup
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/ui-stack.md`
- **Description:** First implementation step should be `npx shadcn init` and `npx shadcn add button card input dialog textarea label form sonner sidebar progress` plus the relevant Animbits components (confetti, count-up). Currently the repo has no `src/components/ui/`.
- **Proposed action:** First task under spec-auth — bootstrap shadcn. Sidebar is needed for D63 responsive nav.

### I013 — Inter font not yet self-hosted

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/architecture.md` §8; `docs/ui-stack.md`
- **Description:** Performance budget says preload Inter 400 via `@fontsource/inter`. Not installed.
- **Proposed action:** `npm install @fontsource/inter`, import in `main.tsx` as part of spec-auth (since auth pages are the first thing users see).

### I014 — Sentry DSN not provisioned

- **Status:** open
- **Type:** blocker
- **Severity:** minor (for dev) / major (for prod)
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `docs/architecture.md` §6
- **Description:** Architecture says Sentry initializes only if `VITE_SENTRY_DSN` is set. No Sentry project exists, no DSN. Error visibility in prod is zero until this is wired.
- **Proposed action:** Human task — create Sentry project (free tier), drop DSN into Vercel env vars. Implementation should gracefully no-op when DSN is missing (so dev keeps working).

### I015 — Lesson 6 (Distributions) stub has empty `slots: []` with no concept teaser

- **Status:** open (narrowed twice: lessons 2-4 shipped 2026-06-23 as I028; new combinatorics lesson and CLT-stub drop landed under D76 on 2026-06-23, so this gap now applies only to L6 Distributions)
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during PRD assembly (pending todo `lesson_stubs_polish`)
- **Spec ref:** `src/content/lessons/06-distributions.ts`
- **Description:** Lessons 1-5 now ship real content. Lesson 6 (Distributions) is the only remaining coming-soon stub: it carries id/number/title/blurb/`comingSoon: true` only, so the locked Home card has a blurb but no preview of what it will teach. A single concept-slot teaser would improve the "what's next" affordance without authoring problem slots; alternatively, build it out fully and graduate from the stub.
- **Proposed action:** Add one concept slot to the Distributions stub with a teaser illustration and a one-line preview, or build the lesson out fully.

### I018 — README.md not yet written

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding (pending todo `readme`)
- **Spec ref:** N/A
- **Description:** Repo has no top-level README. New contributors land cold.
- **Proposed action:** Author a short README that links to PRD, architecture, build-order, and explains `npm run dev` + emulator usage.

### I019 — privacy.md not yet written

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding (pending todo `privacy_doc`)
- **Spec ref:** `docs/prd.md` §11 lists `docs/privacy.md` as pending; D48 dropped the age gate and pushed the privacy stance into a doc
- **Description:** PRD references a privacy doc that doesn't exist. Without it, the COPPA/FERPA stance is undocumented; deployment context (who shares this URL with students) is assumed to handle it.
- **Proposed action:** Author `docs/privacy.md` covering: (1) data we collect (email, username, bio, avatar, progress), (2) we do not target users under 13, (3) hosting on Firebase USA region, (4) deletion request process (manual for MVP). Defer until pre-launch.

### I020 — deploy-checklist.md not yet written

- **Status:** open
- **Type:** known-gap
- **Severity:** major (before any prod deploy)
- **Discovered:** 2026-06-23 during scaffolding (pending todo `deploy_checklist`)
- **Spec ref:** `docs/prd.md` §11; `docs/build-order.md` §"Gate before deploy"
- **Description:** Build-order says deploy is gated by this checklist. The checklist doesn't exist.
- **Proposed action:** Author `docs/deploy-checklist.md` listing: rules deployed, indexes deployed, .env populated in Vercel, Sentry DSN set, audit-feedback green, 5 brief scenarios passed on a real phone, Lighthouse mobile + desktop ≥ 90. Author before first prod deploy.

### I021 — Accessibility section missing from `docs/ui-stack.md`

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding (pending todo `accessibility_section`)
- **Spec ref:** `docs/ui-stack.md`
- **Description:** PRD §9 has accessibility ACs (focus ring, keyboard nav, contrast). UI stack doc doesn't yet have the matching implementation section (WCAG AA targets, axe-core dev check, color contrast verification).
- **Proposed action:** Add an "Accessibility" section to `docs/ui-stack.md` once shadcn is wired (shadcn handles most a11y primitives correctly out of the box).

### I022 — Course-progress denormalization vs live count is unspecified

- **Status:** needs-decision
- **Type:** ambiguity
- **Severity:** minor
- **Discovered:** 2026-06-23 during scaffolding
- **Spec ref:** `spec-profile.md` edge case "courseProgress denormalization drift" says "trust the collection count" — but `spec-habit-loop.md` increments `profile.lessonsCompleted` on every completion
- **Description:** Two sources of truth: the denormalized `profile.lessonsCompleted` counter and a live `count(lessonProgress where state==completed)`. The spec resolves it in favor of the live count for Profile's stat grid. The Home hero ("Lesson 2 of 6") should also use the live count or it'll drift. Worth pinning down explicitly so implementers don't pick differently per page.
- **Proposed action:** Recommend a single helper `useCourseProgress(uid): { completed: number; total: 6 }` that always reads from the collection. Both Home and Profile call it. Confirm before implementing course-path.

### I023 — Lesson 1 strings rewritten for `ui-directive.md` em-dash compliance (accept current; revisit during content polish)

- **Status:** open (known-gap; accept current substitutions for now, revisit during a future content polish pass)
- **Type:** ad-hoc-decision
- **Severity:** minor
- **Discovered:** 2026-06-23 during UI directive integration
- **Spec ref:** `src/content/lessons/01-what-is-probability.ts`; rule from `docs/ui-directive.md` §"Writing and copy"
- **Description:** Lesson 1 carried 12 em dashes that the UI directive forbids absolutely. Per-user direction (2026-06-23), accept the mechanical substitutions for now and revisit during a dedicated content pass later. No further action required from Sonnet; the strings ship as-is.
- **The 12 substitutions:**

  | Field                                     | Before                                        | After                                        |
  | ----------------------------------------- | --------------------------------------------- | -------------------------------------------- |
  | `intro.prompt`                            | `... total outcomes — when every outcome ...` | `... total outcomes, when every outcome ...` |
  | `d6.feedbackByWrongValue.duplicate`       | `... tapped that face — each outcome ...`     | `... tapped that face. Each outcome ...`     |
  | `coin.feedbackDefault`                    | `Tap each side once — heads and tails.`       | `Tap each side once, heads and tails.`       |
  | `even-d6.feedbackCorrect`                 | `Exactly — 3 even faces ...`                  | `Exactly. 3 even faces ...`                  |
  | `even-d6.feedbackByWrongAnswer['1/6']`    | `... one face out of six — but even ...`      | `... one face out of six, but even ...`      |
  | `even-d6.feedbackByWrongAnswer['2/6']`    | `Close on the numerator — how many ...`       | `Close on the numerator. How many ...`       |
  | `heads-coin.feedbackCorrect`              | `Yes — 1 favorable outcome ...`               | `Yes. 1 favorable outcome ...`               |
  | `heads-coin.feedbackByWrongAnswer['1/1']` | `... two sides — heads is only ...`           | `... two sides; heads is only ...`           |
  | `evens-d6.feedbackCorrect`                | `Perfect — the event "even" ...`              | `Perfect. The event "even" ...`              |
  | `red-cards.feedbackCorrect`               | `Right — hearts and diamonds ...`             | `Right. Hearts and diamonds ...`             |
  | `sum-seven.feedbackCorrect`               | `Yes — 6 cells out of 36 ...`                 | `Yes. 6 cells out of 36 ...`                 |
  | `sum-six.feedbackCorrect`                 | `Correct — 5 cells out of 36 ...`             | `Correct. 5 cells out of 36 ...`             |

- **Proposed action:** `git diff src/content/lessons/01-what-is-probability.ts` and reject any substitution you disagree with. If you'd rather restructure the sentence entirely on some of these (more aligned with the directive's "restructure the sentence" option), do it now — Sonnet will mimic whatever style you settle on. Close this issue when you've reviewed.

### I024 — Lesson stub blurbs (lessons 2–5) and spec UI draft strings rewritten for directive compliance

- **Status:** open (awaiting your review)
- **Type:** ad-hoc-decision
- **Severity:** minor
- **Discovered:** 2026-06-23 during UI directive integration
- **Spec ref:** `src/content/lessons/02-*.ts`, `03-*.ts`, `04-*.ts`, `05-*.ts`; `docs/specs/spec-habit-loop.md` milestone titles + celebration copy; `docs/specs/spec-course-path.md` hero / toast / empty-state strings
- **Description:** Same em-dash substitution applied to the lesson stub blurbs (which ship on the Home screen as locked-card descriptions) and to draft UI strings in the specs. Plus three deliberate calls based on the directive:
  - **Milestone titles** dropped the `Day N — ` prefix to satisfy the directive (the streak chip on the celebration card already carries the count; the title carries the sentiment). Result: `"Warming up"`, `"On a roll"`, `"Locked in"`, `"Genuine habit"`, `"Probability lifer"`, `"Inevitable"`. If you'd rather keep the count visible in the title, use a colon (`"Day 3: Warming up"`).
  - **`+1!` annotation on the streak chip** stripped to `+1` (the count-up + color carry the joy; the text doesn't shout).
  - **`"Lesson 1 complete!"` reduced to `"Lesson 1 complete"`** (no exclamation; the confetti and animation carry the moment). The directive permits exclamations only where genuinely warranted; on this celebration card every visual signal is already shouting, so the text staying calm is the more deliberate choice. Open to flipping this back if you disagree.
  - **`"All caught up. Come back tomorrow!"` reduced to `"All caught up. Come back tomorrow."`** (empty state, not a celebration).
- **Proposed action:** review `git diff src/content/lessons/0{2,3,4,5}-*.ts docs/specs/spec-habit-loop.md docs/specs/spec-course-path.md`. Close when you've signed off.

### I025 — Internal narrative em-dashes in specs/docs are not retroactively rewritten

- **Status:** open (policy decision recorded)
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during UI directive integration
- **Spec ref:** `docs/architecture.md` §12.11 (scope clarification)
- **Description:** The UI directive bans em dashes. Internal spec narrative (e.g. `spec-habit-loop.md` line 13 "small chip near the streak flame — increments visibly after each correct slot") contains many. Per §12.11 scope, the directive's hard rules apply to **shipped strings** (UI copy, lesson content, error messages, etc.), not retroactively to engineering docs. Reasoning: docs need precision, the volume of edits would be churn-only, and Sonnet's behavior is governed by the guardrail + the issues log, not by every prose detail of the spec.
- **Proposed action:** none unless you want a full sweep. If you want a sweep, say the word, it's straightforward but invasive.

### I029 — Lesson 2-4 feedback copy authored by the agent (departs from §12.6)

- **Status:** open (awaiting your review)
- **Type:** ad-hoc-decision
- **Severity:** minor
- **Discovered:** 2026-06-23 during the Lessons 2-4 build
- **Spec ref:** `docs/architecture.md` §12.6 ("do not invent feedback copy"); `src/content/lessons/0{2,3,4}-*.ts`
- **Description:** §12.6 says the implementer should leave `FEEDBACK_TODO()` placeholders and let the content owner author copy. The owner explicitly asked for finished, good lessons, so all prompts, `feedbackCorrect`, `feedbackDefault`, per-wrong hints, and `explanation` strings for Lessons 2-4 were written by the agent in Lesson 1's voice and under `ui-directive.md` (no em dashes, sentence case, plain verbs, no filler). `explanation` is populated on every variant (so these lessons do not carry the I001 gap). This is the one deliberate departure from the guardrail and is flagged here so it stays auditable.
- **Proposed action:** read the copy in the three lesson files and edit anything off-voice or factually loose. `npm run audit-feedback` shows no TODO placeholders for these lessons.

### I033 — Reported cross-device "progress sync": XP/achievements appear shared between distinct accounts

- **Status:** resolved 2026-06-24 — root cause confirmed as the `AuthProvider` stale-profile leak (B055); not a backend data bug.
- **Confirming evidence (2026-06-24, from reporter):** the affected accounts were `caiiris1011` (824 XP) and `janestreetsthegoat`. When `janestreetsthegoat` _first_ signed in, the header showed `caiiris1011`'s XP, then it **corrected to its own** once the profile snapshot loaded; `kittysnowball43` started at 0 normally. The "shows the other user's value, then corrects" pattern is the exact signature of B055: the previous user's profile lingered in React state during the account switch until the new `onSnapshot` arrived. `kittysnowball43` didn't reproduce it because that session had no prior high-XP profile in memory (no in-app account switch / fresh load). The earlier "separate devices" framing is reconciled by the switching device having had `caiiris1011` loaded first and switching accounts without a full page reload (React state survives; Firestore's default in-memory cache does not).
- **Resolution:** fixed by **B055** — on a genuine uid change `AuthProvider` immediately resets `profile` to `null`, and the profile `onSnapshot` now has an error handler that falls back to `null` instead of leaving stale data. Verified the live data layer is correct and per-user (table below); no server-side sharing or hardcoding exists.
- **Type:** bug
- **Severity:** major (if real: a user could see another user's progress)
- **Discovered:** 2026-06-24 by user report — "when someone else signs up, all our progress is synced; the xp, achievements etc appear to be hardcoded." User states the two testers were on **separate devices**.
- **Spec ref:** `src/features/auth/AuthProvider.tsx`, `src/features/auth/userService.ts` (`registerUser`, `claimUsername`), `src/features/social/publicProfile.ts`, `firebase/firestore.rules`
- **Investigation (2026-06-24, via Firebase MCP against live `brilliant-clone-102a7`):**
  - **Backend data is NOT shared.** All 5 accounts have _distinct_ per-user values. Snapshot at time of investigation:

    | username           | uid (prefix) | provider           |  xp | achievements |
    | ------------------ | ------------ | ------------------ | --: | -----------: |
    | caiiris1011        | nlgmAC…      | google (+password) | 824 |            7 |
    | janestreetsthegoat | m3iCaU…      | google             | 122 |            4 |
    | orchardoak         | jZqyd…       | google             |  40 |            0 |
    | ee89               | u4cHc2…      | google             |   0 |            0 |
    | kittysnowball43    | Il2HJF…      | google             |   0 |            0 |

  - **Fresh sign-ups correctly start at 0** (`ee89`, `kittysnowball43`). Nothing is hardcoded server-side.
  - **Registration is atomic and correct.** `registerUser` (email) and `claimUsername` (Google first-time) both write `/usernames/{name}`, `/users/{uid}`, and `/publicProfiles/{uid}` in a single `runTransaction`, all seeded with `xp:0`. Verified `kittysnowball43`: all three docs present and consistent. No orphans.
  - **All reads key on the live `uid`.** `AuthProvider` subscribes to `/users/{firebaseUser.uid}`; `AppHeader`, `ProfilePage`, `ProfileBody`, `StatsGrid`, `LevelBadge`/`RankPanel`, `TrophyCase`, `useAllLessonProgress`, and `useLeaderboard` all read from the per-uid profile / per-uid `publicProfiles`. No component renders hardcoded or globally-shared stats. Firestore rules enforce owner-only reads on `/users/{uid}`.
  - **Conclusion:** there is no code path or data state by which two _distinct_ accounts on _separate_ devices could show identical XP/achievements. The report cannot currently be reproduced.

- **Fixed sub-cause (B055):** a _same-browser_ account switch left the previous user's profile in React state (and `onSnapshot` had no error handler), so account B could transiently — or permanently, on a profile-read error — render account A's stats. Fixed in `AuthProvider`. This fully explains the symptom **only** for same-device/same-browser testing.
- **Leading hypotheses for a genuine cross-device report (need data to disambiguate):**
  1. **Both devices authenticated as the same Google account.** All accounts use Google sign-in; `signInWithGoogle` sets `prompt: 'select_account'`, but if a tester picked the same Google identity (or the second device reused an existing session), both land on the same uid → same data by design, not a bug.
  2. **Misread surface.** The locked `/progress` insights page is an identical "Coming soon" placeholder for everyone; the friends leaderboard shows other users' XP by design. Either could be misread as "my progress is shared."
  3. **Stale deployment.** A previously-deployed bundle (Firebase Hosting) predating B055 could exhibit the same-browser bleed; confirm the live site is rebuilt/redeployed from current `main`.
- **Proposed action / repro ask:** on EACH device, open `/profile` and record the **username shown** and the account's **email** (and ideally the `uid` from `auth.currentUser` in devtools). If the two devices show the **same uid**, it is hypothesis #1 (same login), not a data bug. If they show **different uids but identical XP/achievements**, capture a screenshot from both + the exact values and reopen this issue with that evidence — that would indicate a real, currently-unidentified shared read and warrants deeper investigation. Until such evidence exists, treat the data layer as correct (verified above) and B055 as the shipped fix.

---

## Closed issues

### I034 — In-app feedback / bug reports + site footer (attribution)

- **Status:** resolved 2026-06-24
- **Type:** ad-hoc-decision (feature addition)
- **Severity:** minor (additive; no behavior change to existing flows)
- **Discovered:** 2026-06-24, user request — "there should be somewhere that lets the user send in bug reports or feedback" + a footer / "made by Iris Cai".
- **Spec ref:** `src/features/feedback/feedbackService.ts`, `src/features/feedback/FeedbackDialog.tsx`, `src/components/AppFooter.tsx`, `src/components/AppShell.tsx`, `firebase/firestore.rules`, `docs/data-schema.md` §5c
- **Decisions (user-selected):**
  - **Delivery:** in-app form persisted to a new top-level `/feedback/{autoId}` collection (vs mailto / external form), so it matches the existing Firestore stack with no third-party dependency. Owner reviews submissions in the Firebase console.
  - **Footer:** `© {year} Probability Pirates · Made by Iris Cai` + a "Send feedback" button, shown on all chromed routes (hidden on immersive lesson/celebration screens).
  - **Scope:** both bug reports and general feedback via a `type` toggle (`'bug' | 'feedback'`).
- **Description:**
  - **`FeedbackDialog`** — segmented bug/feedback toggle (per-type placeholder), 2000-char message box with counter, success toast. Auto-captures `uid`, `username`, current `route`, and `userAgent` so the owner has triage context; the user only types the message.
  - **`AppFooter`** — renders attribution + the feedback trigger; lives inside the scroll area below the routed page on both mobile and desktop layouts (so it never overlaps the mobile bottom nav). `AppShell` `main` switched to a flex column with a `flex-1` content wrapper so the footer sinks to the bottom on short pages.
  - **`feedbackService.submitFeedback`** — single `addDoc` to `/feedback`, client-side trims + length-clamps before write.
- **Firestore rules:** `/feedback/{id}` is **create-only** for signed-in users with a locked shape (`uid == auth.uid`, `type in ['bug','feedback']`, message 1–2000, length-capped `username`/`route`/`userAgent`, `createdAt == request.time`, `keys().hasOnly([...])`). `read`/`update`/`delete` are all `false`. Validated via `firebase_validate_security_rules` and deployed to `brilliant-clone-102a7`.
- **Accepted gap:** no email/notification on new feedback (no Cloud Functions on Spark). Owner polls the console. If volume grows, add an admin-only "unread feedback" view or a Cloud Function relay.
- **Resolution:** shipped. `tsc -b` clean, lint clean. Rules + hosting deployed live (https://probability-pirates.web.app).

### I032 — Schedule promoted from "study sessions" to first-class event types (tests / homework / study / other)

- **Status:** resolved 2026-06-23
- **Type:** ad-hoc-decision (feature expansion)
- **Severity:** minor (additive; backwards-compatible with existing events)
- **Discovered:** 2026-06-23, user feedback — "schedule should allow you to add events. like upcoming tests and things like that"
- **Spec ref:** `src/features/schedule/eventTypes.ts`, `scheduleService.ts`, `SchedulePage.tsx`, `useStudyEvents.test.ts`, `firebase/firestore.rules`, `src/lib/analytics.ts`
- **Description:** The schedule already persisted free-text events, but every entry rendered identically and tests had no way to stand out. Added a closed enum `EventType = 'study' | 'test' | 'homework' | 'other'` with per-type metadata (icon + color token + badge class) and an optional `time` field (HH:MM 24h) for timed events.
  - **`AddEventDialog`** now leads with a 4-up chip picker for type (icon + label), and shows a Date/Time pair instead of date-only. The title placeholder rewrites based on type (e.g. picking "Test" prompts "AP Statistics midterm"). The dialog title changed from "Add study event" to "Add to schedule" and the page subtitle from "Plan study sessions and future lessons" to "Plan tests, homework, and study sessions." A primary Add button was also surfaced in the page header (was only reachable from the day-list footer before).
  - **`DayEventList`** rows show a type badge (icon + label), a clock + formatted time when present, and a 3px left-edge color accent in the type's color so tests catch the eye at a glance.
  - **`UpcomingStrip`** swapped the per-row treatment from "primary color + lesson icon" to a typed icon tile (color-mixed background in the type color), and surfaces the formatted time on the right.
  - **Calendar dots** now render one dot per distinct pending type for the day (red for test, primary for study, amber for homework, muted for other) instead of a single primary dot.
- **Backward compatibility:** legacy events written before this change lack `eventType`; `eventTypeOf()` normalizes any missing/unknown value to `'study'` at read time, so they render with the default treatment instead of crashing.
- **Firestore rules:** `studyEvents` create rule now validates `eventType ∈ {study, test, homework, other}` and `time ∈ HH:MM` regex; both remain optional. Update allowlist extended with `eventType, time`. `notes` length-capped to 1000 chars at the rules layer (was unenforced). Rules validated via `firebase_validate_security_rules` and deployed.
- **Analytics:** added custom event `study_event_added` with `{event_type, has_lesson, has_time, days_out}`. `days_out` is computed in the user's local timezone (midnight-to-midnight delta) so the metric is stable for a given user regardless of when they sit down.
- **Resolution:** shipped. `npm run verify` 118/118. Firestore rules redeployed to live project (`brilliant-clone-102a7`).

### I031 — Google sign-in added (Firebase Auth Google provider + first-time username flow)

- **Status:** resolved 2026-06-23 (pending manual provider enable in Firebase Console)
- **Type:** ad-hoc-decision (auth surface area expansion)
- **Severity:** minor (additive; email/password still works exactly as before)
- **Discovered:** 2026-06-23 during Firebase plugin pass
- **Spec ref:** `src/features/auth/userService.ts`, `AuthProvider.tsx`, `RequireAuth.tsx`, `GoogleSignInButton.tsx`, `UsernameSetupPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `App.tsx`
- **Description:** Email + username + password + verification email was the only signup path. New "Continue with Google" button on both LoginPage and RegisterPage. Google sign-in goes through Firebase Auth `signInWithPopup(GoogleAuthProvider)`. The data-model gotcha — Google doesn't provide a username — is handled by a two-phase flow:
  - Phase 1: `signInWithGoogle()` completes OAuth, checks if a `/users/{uid}` profile exists. Returning user → fires `login {method: 'google'}` and AuthProvider lands them on `/`.
  - Phase 2: First-time user has Firebase Auth but no Firestore profile. `AuthProvider` detects this (via `providerData.some(p => p.providerId === 'google.com')` + `!snap.exists()`) and exposes a new `needs_username` auth state. `RequireAuth` routes that state to `/setup-username`. `UsernameSetupPage` collects a username, calls `claimUsername()`, which runs the same transactional sentinel write as `registerUser` (so Firestore rules from B051 apply unchanged). On success it fires `sign_up {method: 'google'}` — chosen so the GA funnel reflects "completed signup", not "clicked Sign in with Google."
- **Auth state machine after this change:** `loading | unauthenticated | needs_username | authenticated`. The new `needs_username` variant is gated separately so existing `auth.status === 'authenticated'` checks behave identically for the email/password path. The `isGoogleUser` provider check in AuthProvider keeps email-signup's brief auth-then-create window from flickering through `needs_username`.
- **Routes:** `/setup-username` is intentionally **not** wrapped in `<RequireAuth>` — that would loop. The page enforces its own state guards (loading → null, unauthenticated → /login, authenticated → /, needs_username → render form).
- **Analytics:** `sign_up` and `login` events extended with `method: 'email_password' | 'google'`. Catalog in `src/lib/analytics.ts` and I030 table updated.
- **Operator setup required:** in [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/brilliant-clone-102a7/authentication/providers) enable the **Google** provider (one toggle, support email auto-filled). Also enable **"One account per email address"** under Authentication → Settings → User actions, so a Google sign-in with `alice@gmail.com` can't silently coexist with a password account at the same address.
- **Resolution:** shipped. `npm run verify` 104/104 (post-change). Pending only the two console toggles above; without them, the Google button errors with `auth/operation-not-allowed` (already surfaces as a user-friendly message).

### I030 — Firebase Analytics (GA4) + Performance Monitoring introduced

- **Status:** resolved 2026-06-23
- **Type:** ad-hoc-decision (observability addition)
- **Severity:** minor (additive, no behavior change)
- **Discovered:** 2026-06-23 during Firebase plugin pass
- **Spec ref:** `src/lib/analytics.ts`, `src/lib/firebase.ts`, `src/main.tsx`
- **Description:** Before this change Pascal had Sentry for crashes but zero behavioral telemetry. We had no answer to "where do learners drop off in Lesson 1" or "how long does the average session take." Wired up two free Firebase services on the existing Spark plan:
  - **Firebase Analytics (GA4):** measurement ID `G-HDFLRQ8LMX` already provisioned in the Firebase project (pre-existing GA4 link). `src/lib/analytics.ts` defines a typed event catalog (`PascalEvent` map) and a `track(event, params)` helper that fire-and-forgets through `getAnalyticsSafe()`. The helper preflights with `isSupported()`, returns null in jsdom / emulator / missing-measurementId, and never throws.
  - **Performance Monitoring:** initialized once in `main.tsx` via `ensurePerformanceMonitoring()`. Auto-tracks page loads + outbound network requests; no custom traces yet.
- **Event catalog:**

  | Event                      | Where fired                                                                  | Why                                                                                                            |
  | -------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
  | `sign_up` (GA4 standard)   | `userService.registerUser` success                                           | New-user funnel                                                                                                |
  | `login` (GA4 standard)     | `userService.signIn` success                                                 | Returning-user funnel                                                                                          |
  | `lesson_start`             | `LessonPlayerInner` once on mount, after first progress snapshot             | Distinguishes `mode: 'new' \| 'resume'`                                                                        |
  | `attempt_checked`          | `handleCheck` after `recordAttempt` resolves                                 | Drives slot-level drop-off analysis (lesson + slot + variant + attempt_number + was_correct + xp_awarded)      |
  | `attempt_hinted`           | `handleCheck` when the 2nd wrong attempt reveals `variant.explanation` (D55) | How often the progressive hint actually triggers, per slot/variant                                             |
  | `lesson_complete`          | `handleContinue` final-slot path, right before navigate                      | Includes `xp_earned` (final, accounts for habit retry) + `duration_sec` since lesson_start                     |
  | `daily_goal_complete`      | After `lesson_complete` when `isNewStreakDay` is true                        | First lesson of the day; pairs with the daily-goal pill in UI                                                  |
  | `streak_milestone_reached` | After `lesson_complete`, one event per item in `newMilestones`               | Threshold crossings (`streak-3`, `streak-7`, etc.); pairs with the milestone trophy cards in CelebrationScreen |

- **Env setup required by operator:** add `VITE_FIREBASE_MEASUREMENT_ID=G-HDFLRQ8LMX` to `.env.local`. With the var unset, the wrapper no-ops (no errors). `.env.example` updated. Emulator mode (`VITE_USE_EMULATOR=true`) also no-ops — by design, so dev sessions don't pollute the GA4 dashboard.
- **Verification path:** with the var set, DevTools → Network → filter `google-analytics` should show `collect` requests on each event. GA4 dashboard surfaces real events within ~24h; for instant feedback enable GA4 DebugView in the Firebase console.
- **Resolution:** shipped. `npm run verify` 92/92 (post-change).

### I028 — Two new interaction kinds added for Lessons 2-4 (`simulate-proportion`, `monty-hall`)

- **Status:** resolved 2026-06-23 (decision folded into the spec + `docs/alternatives.md` D73)
- **Type:** ad-hoc-decision (architectural addition, owner-approved in chat before build)
- **Severity:** minor (additive; the existing 5 kinds are unchanged)
- **Discovered:** 2026-06-23 during the Lessons 2-4 build
- **Spec ref:** `spec-interactions.md` (now documents 7 kinds, §6-7); `spec-content-model.md` (new variant types); `docs/alternatives.md` D73; `src/content/types.ts`
- **Description:** The three payoff moments (LLN convergence, birthday paradox, Monty Hall) are simulations, central to the PRD's premise. Rather than degrade them to multiple-choice, two new `InteractionKind`s were added: `simulate-proportion` (scenario-driven: `coin` / `die-six` / `birthday`) and `monty-hall`. Both grade on engagement (`minTrials` / `minGames`), so Check stays disabled until the learner has run the simulation; there is no synthetic wrong state, preserving D55. They share `ProportionChart` (inline SVG) and `src/lib/simulations.ts` (pure, tested). New illustrations `Door` and `Calendar` were added, and `IllustrationRef.kind` extended with `'doors'` / `'calendar'`.
- **Resolution:** `spec-interactions.md` and `spec-content-model.md` now formally document all 7 kinds, and the tradeoff is recorded as D73 in `docs/alternatives.md`. The `feedbackByWrongValue.incomplete` hint is near-unreachable in normal play (Check disabled below threshold), kept as a safety net (parallels B045). Renderer/copy UX review rolls into I029.

### I027 — Remote Config introduced for lesson availability (kill-switch / launch coordination)

- **Status:** resolved 2026-06-23
- **Type:** ad-hoc-decision (architectural addition during Firebase plugin pass)
- **Severity:** minor (improves operability; no behavior change at default)
- **Discovered:** 2026-06-23 during Firebase plugin pass
- **Spec ref:** `src/features/flags/`, `src/content/types.ts` (`Lesson.comingSoon`), `src/lib/firebase.ts`
- **Description:** Lesson 2–6 currently ship with `comingSoon: true` hardcoded in their TS files. Going live with each lesson previously required a code change + redeploy; rolling back a broken lesson required the same. Introduced Firebase Remote Config as the source of truth for which lessons are playable.
  - **New param:** `available_lesson_ids` (STRING, JSON array). Default: `["what-is-probability"]`, matching today's bundled state.
  - **Semantics:** a lesson is `comingSoon` iff its id is **not** in `available_lesson_ids` **or** its `slots` array is empty. The empty-slots check is a hard safety net: Remote Config can never flip a contentless lesson live.
  - **New files:** `src/features/flags/remoteFlagsConfig.ts` (defaults + parser), `RemoteFlagsProvider.tsx` (context, `fetchAndActivate` on mount), `useLessons.ts` (`useLessons()` + `useLessonById()` hooks that wrap the static catalog with RC overrides), `remoteFlagsConfig.test.ts` (5 tests).
  - **Refactored:** `HomePage`, `LessonPlayer`, `CelebrationScreen`, `ProfilePage` now read lessons via `useLessons()` instead of importing the static `lessons` array directly.
  - **Firebase init:** `src/lib/firebase.ts` exposes `getRemoteConfigSafe()` (returns `null` under jsdom so tests don't construct it).
  - **Cache window:** 10s in dev (fast iteration), 1h in prod (default Firebase recommendation).
  - **Template:** published to live project as version 1 via Firebase MCP `remoteconfig_update_template`.
- **Operator notes:**
  - **Launch a lesson:** add its id to `available_lesson_ids` in the Firebase console (Remote Config). No redeploy required (clients pick it up on next fetch — within 1h in prod, ~10s in dev). Lesson must have populated `slots` in code for the flag to take effect.
  - **Kill switch:** remove an id from the array. Existing players inside that lesson finish their current session; new entries land on the "coming soon" toast.
  - **Rollback:** Remote Config templates are versioned; use `remoteconfig_update_template` with `version_number` to roll back.
- **Resolution:** shipped. Files committed in same pass as B051. `npm run verify` 65/65.

### I008 — Empty Home screen for brand-new users is unspecified

- **Status:** resolved 2026-06-23
- **Type:** ambiguity
- **Resolution:** Decided via D70. Brand-new users (no `lessonProgress` and `profile.stepsCompleted === 0`) see a hero reading `"Welcome, {displayUsername}. Let's begin."` with a Start CTA pointing at Lesson 1. The condition is derived from server data; no localStorage flag. Hero reverts to the standard Resume/Start/All-caught-up logic the moment any slot advances. Spec-course-path updated.

### I016 — Tablet sidebar component is referenced but the shadcn variant isn't picked

- **Status:** resolved 2026-06-23
- **Type:** ambiguity
- **Resolution:** Decided via D71. Tablet+ nav uses the **shadcn `Sidebar` block** (`npx shadcn add sidebar`). Default behaviors (collapse, focus management, mobile-aware) are used as-is; only visual register is tuned to match the rest of the app per `docs/ui-directive.md`. Spec-course-path and spec-profile updated.

### I003 — Firebase project not yet provisioned

- **Status:** resolved 2026-06-23 (Storage deferred per D72 / I026)
- **Type:** blocker
- **Resolution:** Project `brilliant-clone-102a7` created. Web app registered. Auth (email/password) and Firestore enabled. Storage not enabled (Spark). `.env.local` at repo root with `VITE_FIREBASE_*` and `VITE_USE_EMULATOR=true`. Vercel env vars still pending (I004).

### I017 — Daily-goal timezone detection mechanism not specified

- **Status:** resolved 2026-06-23
- **Type:** ambiguity
- **Resolution:** Already answered by `docs/alternatives.md` D22, which I missed on first read. D22 specifies `Intl.DateTimeFormat().resolvedOptions().timeZone` for detection. Per user direction (2026-06-23), tightened D22 to clarify detection is **per session, not persisted**, and explicitly accepted the traveler / DST / multi-device edge cases as MVP-acceptable gaps. Implementer follows D22; no further decision needed.

---

## Anticipated risks (not yet issues, flagged for awareness)

These aren't actionable bugs — they're things to be alert for. Promote to a numbered issue if you hit them in practice.

- **Firebase free-tier limits.** 50K reads/day, 20K writes/day. Live `onSnapshot` listeners count as reads on every update. A user playing through Lesson 1 generates ~30 writes (one per attempt + slot progression) and a handful of reads from the snapshot listener. Should be fine for MVP but worth a glance if you onboard a class of 30.
- **Vite HMR + Firebase emulator quirks.** Emulator connections sometimes hold open across HMR reloads and exhaust file handles. Reproduces by saving a service file rapidly. Workaround: full reload.
- **`crypto.randomUUID` on Safari < 15.4.** Spec assumes it exists. iPhone SE (320px floor) running an old iOS may lack it. Fall back to a `Math.random` UUID per `spec-progress-persistence.md` edge case.
- **Time on the celebration screen.** Confetti + count-up + milestone animation could compound into 3+ seconds. Per-component motion budgets live in `docs/ui-stack.md`; verify the _total_ doesn't exceed ~1.5s.
- **Two writes from the same Check tap.** Without double-submit protection, a fast double-tap on Check could submit twice → double XP. PRD §9 has the AC; implementation must disable the button immediately on click.
- **Profile updates while another tab is open.** `useAuth().profile` is a live subscription, so this is fine, but a stale optimistic update in the Edit dialog could overwrite a remote change. Plan: read fresh on dialog open, last-write-wins on save.
- **Lighthouse score regression on adding any one heavy component.** Animbits is bundle-friendly but framer-motion isn't. Verify bundle stays < 300KB gz after each feature.
- **Variant selection becoming non-uniform if `attemptId`s share a pattern.** `fnv1a32` is fine in practice; sanity-check in the spec-progress test plan.
