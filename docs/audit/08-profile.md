# Audit 08 — Profile & Stats

> Pre-deadline audit. Method: static reading of source + Firestore rules + spec/PRD.
> Ground truth accepted as given: `tsc --noEmit` clean, `eslint --max-warnings=0`
> clean, `vitest run` 1083/1083 green. No runtime/visual verification was done —
> every claim that depends on live Firebase behavior (rule evaluation, onSnapshot
> timing, cross-device sync) is flagged **not runtime-verified**.
>
> Scope: `src/features/profile/*` (ProfilePage, ProfileBody (+test), PublicProfilePage,
> EditProfileDialog, StatsGrid, MilestonesRow, TrophyCase, ActivityGrid, DefaultAvatar,
> Emblem, Medallion, LevelBadge, badgeVisuals), plus the stat **source of truth**
> (`src/features/habit/habitService.ts`, `src/features/course/recommendations.ts`,
> `src/features/auth/userService.ts`, `src/features/auth/AuthProvider.tsx`), the
> public projection (`src/features/social/publicProfile.ts`,
> `usePublicProfile.ts`), and the `users` / `publicProfiles` slices of
> `firebase/firestore.rules`. Reference docs: `docs/prd.md` §9.7 (10 ACs),
> `docs/specs/spec-profile.md`, `docs/specs/spec-progress-insights.md`,
> `docs/alternatives.md` D16, D24, D63, D72/I026, D91.

---

## 1. Overview

**What it is.** The signed-in learner's identity + lifetime-achievement screen at
`/profile`, plus a public mirror at `/u/:username`. Both render one shared
presentational component, `ProfileBody`, which composes: an ocean-themed identity
banner (avatar + name + flair + bio), a Rank panel (level + pirate rank from XP),
a six-tile Stats grid, a 16-week Activity heatmap, a Wagers strip (owner-only), a
compact Strengths panel, and a Treasure-shelf trophy case (streak milestones +
achievements). The owner page adds a Wallet link, an Edit-profile dialog
(username + bio), and a destructive Log-out flow.

**Growth beyond the original spec** (`spec-profile.md` was bio-only, avatar
deferred): the feature now carries an Activity grid (GitHub-style heatmap), a
levels/rank system, a trophy case with medallion art, cosmetic avatar styles +
profile flair, a coin wallet, and full public profiles + social actions
(follow/kudos). All of these are in scope here and audited below.

**Files / entry points.**

| Concern | File |
| --- | --- |
| Owner page (route `/profile`) | `src/features/profile/ProfilePage.tsx` |
| Public page (route `/u/:username`) | `src/features/profile/PublicProfilePage.tsx` |
| Shared body (identity + all sections) | `src/features/profile/ProfileBody.tsx` (+ `ProfileBody.test.tsx`) |
| Edit dialog (username + bio) | `src/features/profile/EditProfileDialog.tsx` |
| Stats grid | `src/features/profile/StatsGrid.tsx` |
| Activity heatmap | `src/features/profile/ActivityGrid.tsx` |
| Trophy case (streaks + achievements) | `src/features/profile/TrophyCase.tsx`, `Medallion.tsx`, `Emblem.tsx`, `badgeVisuals.ts` |
| Level/rank | `src/features/profile/LevelBadge.tsx` (`LevelBadge`, `RankPanel`) |
| Default avatar (initial-on-color) | `src/features/profile/DefaultAvatar.tsx` |
| **Unused** milestones row | `src/features/profile/MilestonesRow.tsx` (dead code — see §4) |
| Stat writes (source of truth) | `src/features/habit/habitService.ts` |
| Course-progress compute | `src/features/course/recommendations.ts` (`courseProgress`) |
| Profile write API | `src/features/auth/userService.ts` (`updateProfile`, `changeUsername`) |
| Live profile snapshot | `src/features/auth/AuthProvider.tsx` (`onSnapshot` → `useAuth().profile`) |
| Public projection | `src/features/social/publicProfile.ts`, `usePublicProfile.ts` |
| Rules | `firebase/firestore.rules` (`/users` 12–137, `/publicProfiles` 145–178) |

**Stat source-of-truth map (important).** The owner page reads denormalized
counters off the live `/users/{uid}` doc for XP / lessons / steps / streaks
(`ProfilePage.tsx:55-59`) and computes **Course progress fresh** from the lesson
progress collection (`ProfilePage.tsx:41-42` → `courseProgress`). The public page
reads everything (including a *recomputed* course numerator) from the
`/publicProfiles/{uid}` projection (`PublicProfilePage.tsx:77-83`). These two
paths do **not** agree in several cases (see §4, bugs P1-a / P1-b).

---

## 2. What works (verified by reading; ACs from PRD §9.7)

- **AC1 — Identity display.** `ProfileBody.tsx:77-104` renders the avatar,
  `displayUsername` (truncated, `:88`), optional flair (`:91-95`), and the bio with
  an explicit empty-state prompt: owner gets "Tap Edit to add a bio."
  (`ProfilePage.tsx:54`, rendered italic-muted at `ProfileBody.tsx:99`); public gets
  "No bio yet." (`PublicProfilePage.tsx:76`). Avatar scales 92px → 28 (`md:`) at
  `ProfileBody.tsx:82-84`. ✔ (avatar is always the *default* — see §3.)
- **AC2 — Stats grid (six tiles, responsive).** `StatsGrid.tsx:22-29` renders Total
  XP, Completions, Steps, Streak, Best streak, Course, in a `grid-cols-2
  md:grid-cols-3` layout (`:32`). All six present; layout matches the spec. ✔
  (labels are abbreviated vs. AC wording — see §3.)
- **AC5 — Bio persistence.** `EditProfileDialog.handleSave` trims and writes only on
  change (`EditProfileDialog.tsx:80-87` → `updateProfile`), Cancel/close discards via
  `handleOpenChange` (`:93-101`), and the dialog re-syncs from the live profile on
  open (`:43-49`). Because the profile is a live `onSnapshot`, reopening shows the
  saved bio. ✔
- **AC7 — Deterministic default avatar.** `DefaultAvatar.tsx:28` picks the
  background from `fnv1a32(username) % PALETTE.length` — pure function of the
  username, so it's stable across sessions/devices; first initial uppercased at
  `:29`. ✔
- **AC8 — Log out with confirmation.** Destructive full-width button
  (`ProfilePage.tsx:96-98`) opens a confirm `Dialog` (`:111-126`); confirm calls
  `signOutUser()` (`:44-46`), and `AuthProvider` + `RequireAuth` redirect the now
  signed-out user to `/login`. ✔ (redirect not runtime-verified.)
- **AC9 — Loading skeleton.** `ProfilePage.tsx:37-39` gates on
  `auth.status==='loading' || !profile || progressState.status==='loading'` and
  renders `ProfileSkeleton` (`:131-146`); `PublicProfilePage.tsx:31` does the same.
  No flash of empty content. ✔ (skeleton covers avatar + stat tiles only — see §3.)
- **AC10 — Real-time stats updates.** `AuthProvider.tsx:121` subscribes to
  `/users/{uid}` via `onSnapshot`, so completing a lesson and returning to Profile
  reflects updated XP/streak/milestones without a manual refresh (the one-refresh
  contract). The public page is also live via `usePublicProfile`'s `onSnapshot`
  (`usePublicProfile.ts:36`). ✔ (not runtime-verified; caveat in §4 P1-c.)
- **Bio length UX (part of AC4).** 150-char cap with a live counter that turns
  destructive-red over the limit (`EditProfileDialog.tsx:53,142,145-150`); Save is
  disabled when over limit (`:56,164`). Whitespace-only bios are trimmed to empty
  (`:52,80`). ✔
- **Username editing (D16 reversal).** The dialog also edits username with the
  `^[a-zA-Z0-9_]{3,20}$` rule (`:16,55`), routed through the transactional
  `changeUsername` (sentinel move + public-projection mirror,
  `userService.ts:246-321`). ✔
- **Trophy case + rank + activity.** TrophyCase renders streak milestones and
  achievements as locked/earned medallions with a detail dialog and "N more days to
  go" hints (`TrophyCase.tsx:34-47,103`); RankPanel derives level/rank/progress
  purely from XP (`LevelBadge.tsx:34-66`); ActivityGrid renders a correct 16-week
  local-date heatmap with today/future handling (`ActivityGrid.tsx:69-99`). These
  exceed the original spec and are coherent. ✔
- **Public-profile privacy basics.** The public page reads only
  `/publicProfiles/{uid}`, which is a PII-free projection — `projectPublicFields`
  never copies `email` (`publicProfile.ts:40-58`), and the create/update rule
  hard-blocks `email` (`firestore.rules:150`). Owner-only surfaces are correctly
  withheld from the public page: the **Wagers** strip is gated on a passed `uid`
  and PublicProfilePage passes none (`ProfileBody.tsx:72,133`,
  `PublicProfilePage.tsx:73-88`), and the Wallet/Edit/Log-out controls live only on
  the owner page. Viewing your own `/u/<you>` redirects to the editable `/profile`
  (`PublicProfilePage.tsx:27-29`). ✔

---

## 3. What's missing / incomplete

- **Avatar upload is entirely absent (AC4 second half + AC6 not met).** There is
  **no file picker, no live preview, no `avatarService`, and no Storage write**
  anywhere in the repo — a global search for `type="file"` / `accept=image` /
  `uploadBytes` / `FileReader` returns nothing in `src/`. `EditProfileDialog`
  exposes only username + bio. `ProfileBody` *always* renders `DefaultAvatar` and
  never reads `avatarUrl` (`ProfileBody.tsx:80-85`), so even a manually-set
  `avatarUrl` would not display. This is the documented D72 / I026 deferral
  ("Storage requires Blaze; MVP ships on Spark; all users see DefaultAvatar"), and
  `spec-profile.md:5,40` reflects it — **but PRD §9.7 AC4 and AC6 still list avatar
  picker/preview and PNG/JPEG-<2MB constraints as shipped criteria.** Net: the spec
  and code agree (deferred); the PRD over-claims. AC7 (default avatar) is met; AC4
  is half-met (bio only); AC6 is not met.
- **No Storage rules file.** `firebase/storage.rules` does not exist. The avatar
  rule block mandated by `spec-profile.md:54-64` was never added. Harmless while no
  upload exists, but if Storage is ever enabled this must be created *before* an
  upload path ships (otherwise default-deny or, worse, an over-broad bucket).
- **Stats-grid labels diverge from the AC wording.** AC2 names the tiles "Total
  XP, Lessons completed, Steps completed, Current streak, Best streak, Course
  progress (X / 6)." The code ships "Total XP, **Completions**, **Steps**,
  **Streak**, Best streak, **Course**" (`StatsGrid.tsx:22-29`). "Completions" is
  arguably *more* honest than "Lessons completed" given the replay-inflation bug
  (§4 P1-a), but it's a documentation/UX mismatch worth reconciling. The "/ 6"
  denominator is also superseded by the full-curriculum denominator (D91) — fine,
  but the PRD text is stale.
- **AC3 milestones-row shape changed.** The spec/AC describe a *horizontally
  scrolling row* of earned trophies with the empty-state copy "your first trophy is
  N days away." The shipped UI is a richer **grid** trophy case (`TrophyCase.tsx`)
  with locked medallions + per-item hints, not a horizontal scroll, and without that
  exact empty-state sentence. The component that *did* implement the AC verbatim,
  `MilestonesRow.tsx`, is **dead code** — imported nowhere in `src/` (only docs/tests
  reference the name). Functionally a net improvement, but technically a divergence
  from AC3 and a stale file.
- **Public profile shows a permanently-empty "Strengths" section.**
  `PublicProfilePage` never passes `learnerModel` to `ProfileBody`, so it defaults to
  `null` + `loading:false` (`ProfileBody.tsx:68-69,156-160`). The learner model is
  owner-only (`firestore.rules:72-74`), so it *cannot* be fetched for another user.
  The result is a "Strengths" heading on every public profile followed by
  self-directed copy: "Do a lesson or some practice to see your strengths."
  (`StrengthsPanel.tsx:219-224`) — nonsensical when addressed to someone viewing a
  *different* learner. Either hide the section or relabel it for the public context.
- **Skeleton coverage is partial.** `ProfileSkeleton` renders only the avatar +
  six stat tiles (`ProfilePage.tsx:131-146`); Rank, Activity, Strengths, and the
  Treasure shelf are not skeletoned. Because the whole page is gated behind the
  loading guard there's no *flash*, but the perceived-load shape is thinner than the
  real page. AC9 is met in spirit.
- **No error/escape state when the profile doc is missing.** If
  `auth.status==='authenticated'` but `profile===null` (the B044 "profile doc
  unavailable" case the codebase elsewhere guards against), `ProfilePage.tsx:37`
  renders the skeleton **forever** with no error message and no way to log out
  (the Log-out button is below the guard). Low-probability, but a dead-end.

---

## 4. Bugs & risks (`file:line` + severity)

### P1-a — `lessonsCompleted` / `stepsCompleted` inflate on lesson replay (stat-source integrity)

`applyLessonCompletion` unconditionally does `lessonsCompleted: increment(1)`
(`habitService.ts:200,215`) and there is **no guard** preventing a learner from
re-entering and re-finishing an already-completed lesson. `markLessonCompleted`
just re-sets `state:'completed'` (idempotent for the progress doc,
`progressService.ts:198-204`), but `LessonPlayer.handleContinue` still calls
`applyLessonCompletion` on every finish (`LessonPlayer.tsx:357-363`), and the
per-check path increments `stepsCompleted` + XP again (`habitService.ts:72,93`,
`applySlotAdvance` `:126-127`). Consequences on the profile:

- The **"Completions" tile** (`profile.lessonsCompleted`) can exceed the number of
  *unique* completed lessons.
- It can therefore **disagree with the "Course" tile on the same page**: owner
  Course is computed fresh as unique `state==='completed'` lessons
  (`recommendations.ts:51-53`), while Completions is the raw replay-inflated counter
  — e.g. "Completions 3" next to "Course 1 / 42."
- XP/level and steps are likewise inflatable by grinding one lesson.

Not a crash, but it undermines the honesty of the headline stats and the
leaderboard. **Severity P1** (data-integrity + motivation-accuracy).

### P1-b — Owner vs. public "Course progress" use different sources (same user, two numbers)

Owner numerator = fresh unique completed lessons (`ProfilePage.tsx:42`). Public
numerator = `Math.min(pp.lessonsCompleted, courseTotal)` (`PublicProfilePage.tsx:82`)
— i.e. the **replay-inflated denormalized counter**, merely clamped to the total.
For a learner who has replayed lessons, `/profile` and `/u/<them>` show different
"X / Y" course progress. **Severity P1** (stat-source mismatch; the audit brief's
named class).

### P1-c — Practice XP never reaches `/publicProfiles`, so public XP/level lags private

`awardPracticeXp` writes **only** `users/{uid}` (`xp`, `weeklyXp`, `weekKey`) and
deliberately skips the public mirror (`habitService.ts:257-269`) — unlike every
other gamification write, which batches a `publicProfiles` `set(merge)` alongside
the user write (e.g. `:89-102`, `:211-222`). Result:

- Your **own** profile's Total XP, Rank, and level disc (`profile.xp`) include
  practice XP; your **public** profile (`pp.xp`) and the **weekly leaderboard**
  (which reads `publicProfiles.weeklyXp`) do **not**. After any practice session the
  two XP totals silently diverge and never reconcile.

This contradicts the "PII-free projection mirrors gamification writes" contract
documented in `publicProfile.ts:6-9`. **Severity P1** (stat-source mismatch +
leaderboard fairness). *Not runtime-verified, but unambiguous from the write set.*

### P2-a — Public-profile stats are self-reported and trivially spoofable

`publicProfiles` is writable by its owner with only loose validation: the update
rule accepts any `xp` that is `int >= 0` and any `weeklyXp >= 0`
(`firestore.rules:148-156`) with no monotonicity or cross-check against
`/users`. A motivated user can `setDoc` their own `publicProfiles.xp` /
`weeklyXp` / `currentStreak` to arbitrary values and top the leaderboard / inflate
their public profile. This is inherent to the no-Cloud-Functions (Spark) design and
is an accepted trade-off elsewhere, but it means **public profile + leaderboard
numbers are not trustworthy** and should not be presented as authoritative.
**Severity P2** (integrity; architectural).

### P2-b — `activityDates` (daily usage calendar) is exposed to every signed-in user

The public projection includes the full `activityDates` array
(`publicProfile.ts:34,55`), readable by any authenticated user
(`firestore.rules:146`), and rendered as a 16-week heatmap on `/u/:username`
(`PublicProfilePage.tsx:84` → `ActivityGrid`). This reveals each learner's
day-by-day app-usage pattern to all other learners. `spec-progress-insights.md:112`
states insights sharing is "private only"; a daily activity calendar is arguably an
insight. For a high-school-student audience this is a mild privacy concern worth a
conscious decision (expose vs. coarsen to a streak number). **Severity P2.**

### P2-c — Permanently-empty, self-addressed "Strengths" on public profiles

See §3. Cosmetic/UX rather than a data bug, but it ships a confusing dead section on
every `/u/:username`. `ProfileBody.tsx:155-161` + `PublicProfilePage` (no
`learnerModel`). **Severity P2.**

### P2-d — Infinite skeleton + no logout if profile doc is null

See §3. `ProfilePage.tsx:37` treats `profile===null` as "loading" forever with no
error UI or escape. **Severity P2** (edge case).

### P2-e — Dead component drift (`MilestonesRow.tsx`)

Unused file still maintained as if live; risks future confusion (someone "fixing"
the milestones AC may edit the wrong component). **Severity P2** (maintenance).

### Note — no upload-validation-bypass bug exists, because there is no upload

The brief flags "upload validation bypass (P0)" as a thing to look for. There is
**no avatar upload path at all** (§3), so there is nothing to bypass today. The
*future* risk is real: `updateProfile` accepts an `avatarUrl` and mirrors it to the
public projection with no URL/host validation (`userService.ts:323-337`), and no
Storage rules exist — so whoever implements the upload must add both the synchronous
client check (PNG/JPEG, <2 MB) **and** the Storage rule from `spec-profile.md:54-64`
to avoid a real bypass. Flagged as a **pre-implementation P1 for the avatar
workstream**, not a current defect.

---

## 5. Pros / Cons

**Pros**

- Clean shared-component design: one `ProfileBody` powers both owner and public
  pages, so identity/stats/activity/trophies stay visually and behaviorally
  consistent; the page-specific slots (`actions`, `counts`, `uid`) are a tidy seam.
- Strong privacy posture on the obvious axis: PII (`email`) is structurally excluded
  from the public projection in three places (projection fn, rules, seed), and
  owner-only surfaces (wagers, wallet, edit) are correctly withheld publicly.
- Live data throughout (`onSnapshot` on both `/users` and `/publicProfiles`) gives
  the real-time refresh AC10 wants without manual reload plumbing.
- The "beyond-spec" additions (levels/rank, trophy case, activity heatmap) are
  well-built, pure-from-source (rank derives from XP; heatmap from `activityDates`),
  and motivation-positive.
- Edit dialog handles the fiddly cases: trims whitespace, disables Save over limit,
  re-syncs on open, discards on cancel, and routes username changes through the safe
  transactional path.

**Cons**

- Two different stat-source paths (denormalized counters vs. fresh compute vs.
  public projection) that disagree (P1-a/b/c) — the headline numbers are not
  guaranteed self-consistent.
- A flagship AC (avatar upload) is unimplemented while the PRD still advertises it.
- Public/leaderboard numbers are self-reported and spoofable (P2-a); activity
  patterns are broadly exposed (P2-b).
- Visible rough edges on the public page (empty Strengths section) and a stale dead
  component.

---

## 6. Learning-science / motivation assessment

**Does the profile reinforce durable learning, or just engagement vanity?** It's a
*mix, currently tilted toward engagement metrics* — fixable cheaply.

- **Pro-durable-learning signals.** The **Strengths panel** (owner) and the
  **Activity heatmap** are the two genuinely learning-oriented surfaces. Strengths
  shows mastery as 0–3 pips (not raw Elo) split into Strong / Keep-working-on /
  Introduced, with misconception call-outs and a deep-link to remediate
  (`StrengthsPanel.tsx`) — this is the intervention→achievement→motivation loop done
  right, and it points the learner at *what to fix*, not just *how much they did*.
  The heatmap rewards **consistency/spacing**, which is the single highest-leverage
  habit for durable retention (distributed practice).
- **Vanity-leaning signals.** Total XP, Completions, Steps, current/best Streak, and
  the Rank/level disc are all **volume/throughput** metrics. They're motivating and
  fine as a habit scaffold, but they measure *activity*, not *understanding* — and
  three of them are inflatable by grinding one lesson (P1-a), which actively
  *rewards* shallow replay over new learning. "Steps" in particular is a near-pure
  engagement counter with no learning meaning.
- **The trophy case** is mostly streak-and-volume driven (streak milestones +
  achievements). It celebrates showing up, which is good for habit formation, but the
  page would be stronger if mastery itself were a first-class trophy
  ("Mastered conditional probability") rather than only days-in-a-row.
- **Honesty.** The app already commits to "pips not numbers" honesty for mastery
  (`spec-progress-insights.md:27`), and Strengths honors it. The Stats grid is the
  opposite end (big precise numbers), and right now some of those numbers are not
  accurate (P1-a/b/c). For a learner, an inflated/Inconsistent XP undermines the
  trust the honest Strengths panel earns.

**Net.** The bones of a learning-centered profile are present (Strengths +
spacing). The opportunity is to (a) make the volume stats *accurate* so they're
trustworthy, and (b) elevate *mastery/misconception* signals to share billing with
XP/streak so the page answers "what do I actually understand now?" — not just "how
much have I done?"

---

## 7. Prioritized recommendations (before deadline)

**P1 — high-value, do if time allows**

1. **Fix replay inflation (P1-a).** Guard `applyLessonCompletion` (and the
   step/XP writes) so a lesson that is already `state==='completed'` does not
   re-increment `lessonsCompleted` / `stepsCompleted` / award the completion bonus
   — gate on the prior progress state in `LessonPlayer.handleContinue`
   (`LessonPlayer.tsx:329-363`). This single fix also resolves the owner-page
   Completions-vs-Course disagreement.
2. **Unify the course-progress source (P1-b).** Make the public page derive its
   course numerator the same way as the owner (unique completed), or at minimum
   document that the public number is the clamped denormalized counter. Today they
   silently differ for the same user.
3. **Mirror practice XP to `publicProfiles` (P1-c).** Add the `publicProfiles`
   `set(merge)` (`xp` + `weeklyXp` + `weekKey`) to `awardPracticeXp`
   (`habitService.ts:257-269`) so own/public XP, rank, and the weekly leaderboard
   agree. (Or, conversely, decide practice XP is private and exclude it from
   `profile.xp` on the profile too — pick one and make both surfaces consistent.)
4. **Reconcile the avatar ACs with reality.** Either (a) update PRD §9.7 AC4/AC6 to
   record the D72/I026 deferral so the contract matches the spec + code, or (b) if
   Storage is being enabled, ship the upload *with* the synchronous client validation
   **and** the `firebase/storage.rules` block from `spec-profile.md:54-64` before the
   write path goes live (closes the future bypass flagged in §4).

**P2 — polish / correctness**

5. **Hide or relabel the public Strengths section (P2-c)** so `/u/:username` doesn't
   show self-directed "do a lesson" copy to a viewer.
6. **Decide on activity-calendar exposure (P2-b)** — keep public, or coarsen the
   public projection to a streak count / "active this week" rather than the full
   `activityDates` array.
7. **Tighten public-stat validation (P2-a)** as far as Spark allows (e.g.
   non-decreasing `xp`/`bestStreak` in the rule), and stop presenting leaderboard
   numbers as authoritative in copy.
8. **Delete the dead `MilestonesRow.tsx` (P2-e)** or wire it back; don't leave two
   milestone components.
9. **Add an error/escape state for `profile===null` (P2-d)** so the page isn't an
   infinite skeleton with no logout.
10. **Re-label the Stats tiles** to match AC2 wording (or update the AC), and
    consider promoting a mastery/misconception tile into the grid so the headline
    stats aren't purely volume.
