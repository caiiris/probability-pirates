# Issues Log

> Running log of open issues, ambiguities, and blockers discovered before or during implementation.
> Companion to:
> - `docs/alternatives.md` — *closed* design decisions with rationale.
> - `docs/prd.md` — what we contracted to build.
> - `docs/build-order.md` — the order we ship features in.
>
> **Implementer rule:** read this file at the start of every task. Append to it whenever you hit something the spec doesn't cover. See `docs/architecture.md` §12 Engineering Guardrails.

---

## How to use this doc

When you, the implementer:

| Situation | Action |
| --- | --- |
| The spec leaves something genuinely ambiguous (two valid interpretations) | **Stop.** Log it under "Open — ambiguity". Ask in chat. Do not silently pick one. |
| You need to make a design decision the spec/alternatives don't cover | Log it under "Open — needs-decision" *with* your proposed answer + reasoning. Ask. If approved, the answer gets promoted into `docs/alternatives.md`. |
| You find a real bug in spec or code | Log it under "Open — bug". |
| You're blocked on something external (Firebase project not yet created, missing credential, etc.) | Log it under "Open — blocker". Surface it; do not work around. |
| You knowingly skipped a non-essential feature for now | Log it under "Open — known-gap" with what's missing and what would unblock it. |
| You decided something locally and shipped (e.g. picked a small visual default) | Log it under "Closed — ad-hoc decision" so it can be audited later. Do not let these accumulate silently. |

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
- **Description:** D55 introduced the progressive hint model — after 2 wrong attempts on a slot, the player surfaces `variant.explanation` as a deeper hint. Lesson 1 was authored *before* the field existed, so none of its 9 variants populate it. With no `explanation`, a stuck learner just sees the same `feedbackDefault` over and over.
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

### I015 — Lesson stubs (lessons 2–6) have empty `slots: []` with no concept teaser

- **Status:** open
- **Type:** known-gap
- **Severity:** minor
- **Discovered:** 2026-06-23 during PRD assembly (pending todo `lesson_stubs_polish`)
- **Spec ref:** `src/content/lessons/02-*.ts` through `06-*.ts`
- **Description:** Stubs only carry id/number/title/blurb/`comingSoon: true`. When the user visits the Home screen, the locked card has a blurb but no preview of *what* they'll learn. A single concept-slot teaser would improve the "what's next" affordance without committing to authoring problem slots.
- **Proposed action:** Add one concept slot per stub with a teaser illustration and one-line preview. Defer until Lesson 1 ships.

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

  | Field | Before | After |
  | --- | --- | --- |
  | `intro.prompt` | `... total outcomes — when every outcome ...` | `... total outcomes, when every outcome ...` |
  | `d6.feedbackByWrongValue.duplicate` | `... tapped that face — each outcome ...` | `... tapped that face. Each outcome ...` |
  | `coin.feedbackDefault` | `Tap each side once — heads and tails.` | `Tap each side once, heads and tails.` |
  | `even-d6.feedbackCorrect` | `Exactly — 3 even faces ...` | `Exactly. 3 even faces ...` |
  | `even-d6.feedbackByWrongAnswer['1/6']` | `... one face out of six — but even ...` | `... one face out of six, but even ...` |
  | `even-d6.feedbackByWrongAnswer['2/6']` | `Close on the numerator — how many ...` | `Close on the numerator. How many ...` |
  | `heads-coin.feedbackCorrect` | `Yes — 1 favorable outcome ...` | `Yes. 1 favorable outcome ...` |
  | `heads-coin.feedbackByWrongAnswer['1/1']` | `... two sides — heads is only ...` | `... two sides; heads is only ...` |
  | `evens-d6.feedbackCorrect` | `Perfect — the event "even" ...` | `Perfect. The event "even" ...` |
  | `red-cards.feedbackCorrect` | `Right — hearts and diamonds ...` | `Right. Hearts and diamonds ...` |
  | `sum-seven.feedbackCorrect` | `Yes — 6 cells out of 36 ...` | `Yes. 6 cells out of 36 ...` |
  | `sum-six.feedbackCorrect` | `Correct — 5 cells out of 36 ...` | `Correct. 5 cells out of 36 ...` |

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

---

## Closed issues

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
- **Time on the celebration screen.** Confetti + count-up + milestone animation could compound into 3+ seconds. Per-component motion budgets live in `docs/ui-stack.md`; verify the *total* doesn't exceed ~1.5s.
- **Two writes from the same Check tap.** Without double-submit protection, a fast double-tap on Check could submit twice → double XP. PRD §9 has the AC; implementation must disable the button immediately on click.
- **Profile updates while another tab is open.** `useAuth().profile` is a live subscription, so this is fine, but a stale optimistic update in the Edit dialog could overwrite a remote change. Plan: read fresh on dialog open, last-write-wins on save.
- **Lighthouse score regression on adding any one heavy component.** Animbits is bundle-friendly but framer-motion isn't. Verify bundle stays < 300KB gz after each feature.
- **Variant selection becoming non-uniform if `attemptId`s share a pattern.** `fnv1a32` is fine in practice; sanity-check in the spec-progress test plan.
