# Audit 14 — Engagement & Economy

> Pre-deadline audit. Method: static reading of source + Firestore rules + spec/PRD.
> Ground truth accepted as given: `tsc` clean, `eslint --max-warnings=0` clean,
> `vitest run` 1083/1083 green. **No runtime verification** — every claim that
> depends on live Firebase behavior (rule evaluation against a real request,
> Remote Config delivery, aggregation counts) is flagged **not runtime-verified**.
>
> Scope: the peripheral engagement cluster —
> `src/features/{economy,social,schedule,notifications,feedback,flags,captain}/*`,
> `src/lib/coins.ts`, `src/lib/weeklyXp.ts`, the relevant slices of
> `src/features/habit/habitService.ts`, and the `users`, `publicProfiles`,
> `feedback`, `studyEvents`, `notifications` slices of `firebase/firestore.rules`.
> Reference: `docs/prd.md` §8 + §9.10 (scope reconciliations), `docs/specs/spec-social.md`,
> `docs/alternatives.md` D79–D84.

---

## 1. Overview

This is the cluster of "everything around the lesson" features — the habit/retention
layer that the brief calls _"the difference between an app people open once and one
they open every day."_ Seven loosely-related subsystems, grouped here because they
share an architectural posture: **all are client-authoritative** (Spark plan, no
Cloud Functions), so every write is done from the browser and the Firestore rules
are the entire server-side trust boundary.

| Subsystem | What it is | Primary files |
| --- | --- | --- |
| **Economy** | Earned-only coin wallet; sinks = cosmetics (avatar styles, flair) + Streak Freeze | `economy/coinService.ts`, `StorePage.tsx`, `CoinChip.tsx`, `FlairBadge.tsx`, `avatarStyles.ts`, `profileFlair.ts`, `src/lib/coins.ts`; grants in `habit/habitService.ts`, `course/Checkpoint.tsx` |
| **Social** | Follow/followers, username search, friends-only weekly leaderboard, kudos | `social/socialService.ts`, `useLeaderboard.ts`, `Leaderboard.tsx`, `SocialPage.tsx`, `FollowButton.tsx`, `KudosButton.tsx`, `publicProfile.ts`, `usePublicProfile.ts`, `src/lib/weeklyXp.ts` |
| **Schedule** | In-app study calendar + a once-a-day "you have a task today" reminder dialog | `schedule/scheduleService.ts`, `reminderRules.ts`, `ScheduleReminder.tsx`, `useStudyEvents.ts`, `eventTypes.ts`, `SchedulePage.tsx` |
| **Notifications** | In-app inbox (follow events only), header bell + unread dot | `notifications/notificationsService.ts`, `NotificationBell.tsx` |
| **Feedback** | Bug/feedback submit to a write-only `feedback` collection | `feedback/feedbackService.ts`, `FeedbackDialog.tsx` |
| **Flags** | Remote Config gating of which lessons are playable | `flags/RemoteFlagsProvider.tsx`, `remoteFlagsConfig.ts`, `useLessons.ts` |
| **Captain** | Pascal mascot — contextual encouragement + a daily study-science tip | `captain/CaptainPascal.tsx`, `CaptainsLog.tsx`, `captainLines.ts` |

**Scope decisions this cluster implements:** D83 (cosmetic earned-only coins, no
real money), D79/D80 (Streak Freeze + cosmetic sinks), D24-reversal (social shipped),
D82 (in-app-only schedule reminder), D27 (no off-app push/email — still holds).

---

## 2. What works (per subsystem)

### 2.1 Economy

- **Earned-only, no real-money path.** Coins are minted in exactly three honest
  places: achievement unlocks (`coinsForAchievements`, `habitService.ts:85,207`),
  chapter/course chests (`Checkpoint.tsx` → `claimChest`, `coinService.ts:23`), and
  first-follow/first-kudos achievements (`socialService.ts:94,206`). There is **no
  Stripe/payment SDK, no pricing UI, no IAP** anywhere (grep-verified). The
  `package-lock.json` has `@firebase/messaging` as a transitive dep only — never
  imported. **Scope §9.10.3 holds.** ✔
- **Purchase math is overspend-safe within an honest client.** `buyStreakFreeze`,
  `buyAvatarStyle`, `buyProfileFlair` all run a `runTransaction` that re-reads
  `coins` + the owned list inside the transaction and refuses on `insufficient` /
  `owned` / `at-max` (`coinService.ts:56-172`). Rapid double-taps and cross-device
  races can't overspend or double-grant a cosmetic. ✔
- **Chest payout is idempotent.** `claimChest` re-checks server-side `claimedChests`
  inside the transaction and pays `0` if already claimed (`coinService.ts:31-40`), so
  a chest pays exactly once even with the optimistic `claimedState` UI in
  `Checkpoint.tsx:63`. ✔
- **Cosmetics mirror correctly.** `equipAvatarStyle` / `equipProfileFlair` write the
  equipped id to both `users/{uid}` and `publicProfiles/{uid}` in one batch
  (`coinService.ts:126-137,175-186`) so the public projection stays in sync.
- **Pricing is sane and "not pay-to-win" (D83 intent).** Sinks are cosmetic
  (styles 150–300, flair 150–400) + one forgiveness item (Streak Freeze 200, cap 2).
  Coins can never shortcut the actual learning. ✔

### 2.2 Social

- **PII boundary is correct.** `users/{uid}` is owner-only read (`rules:13`);
  everything social reads the PII-free `publicProfiles/{uid}` projection, which
  rules **hard-block `email`** on write (`rules:150`) and `projectPublicFields`
  never copies email (`publicProfile.ts:40-59`). ✔
- **Social-graph writes are self-edge-only.** `following/{followeeUid}` is
  owner-writable; `followers/{followerUid}` is writable only by the follower
  (doc id = their uid); `kudos/{fromUid}` only by the sender (`rules:161-177`). A
  user **cannot** forge another user's followers or force-follow anyone. ✔
- **Counts can't be written cross-user.** All counts come from
  `getCountFromServer` aggregation (`socialService.ts:144-157,239-247`); no user
  increments a counter on another's doc. ✔
- **Weekly-XP bucket logic is correct.** `currentWeekKey()` is a clean ISO-8601
  (Monday) week key computed from the local calendar date (`weeklyXp.ts:15-30`);
  `effectiveWeeklyXp` zeroes a stale bucket so last week's XP never leaks into this
  week's ranking (`weeklyXp.ts:41-47`). `habitService` increments within-week and
  resets on a new week (`habitService.ts:77,201`). The fresh-start-effect design
  (D-social) is implemented faithfully. ✔
- **Leaderboard scoping matches spec.** `useLeaderboard` ranks `[me, ...following]`
  by effective weekly XP, descending, with ranks 1..n (`useLeaderboard.ts:42-58`).
  Friends-only + weekly reset, exactly as `spec-social.md` describes.
- **Self-follow / self-kudos rejected** client-side (`socialService.ts:79,191`).

### 2.3 Schedule

- **In-app-only — no off-app channel.** `ScheduleReminder` is a shadcn `Dialog`
  that renders only while the app is open (`ScheduleReminder.tsx`). The reminder
  is driven by an `onSnapshot` on today's events (`scheduleService.ts:134-157`);
  there is **no FCM, no `Notification()` Web API, no service worker, no email**.
  **Scope §9.10.6 holds.** ✔
- **Pure, testable "today" logic.** `pendingToday` filters to today's unfinished
  events sorted by time (`reminderRules.ts:27-36`); past days fall out because the
  query is scoped to `today` — it never nags about yesterday.
- **Once-a-day dismissal** persisted in `localStorage` keyed by date+uid
  (`reminderRules.ts:43-60`); marking the last task done auto-dismisses.
- **Event shape is locked at the rules layer:** `eventType` is a closed enum,
  `time` matches `HH:MM` regex, `title` 1–200, `notes` ≤1000, owner-only
  (`rules:116-136`). ✔

### 2.4 Notifications

- **Owner-only inbox with a locked shape.** `users/{uid}/notifications/{id}` is
  read/update/delete by the owner only; any authenticated user may **create** one
  on someone else's tree (the no-Cloud-Functions fan-out), but the rule pins
  `fromUid == auth.uid`, `type in ['follow']`, `read == false`,
  `createdAt == request.time`, and `keys().hasOnly(...)` (`rules:92-111`). The
  recipient cannot be the sender. ✔
- **No duplicate stacking.** Doc id `follow_${fromUid}` means re-follow refreshes
  one doc rather than piling up (`notificationsService.ts:59`).
- **Real-time + cost-bounded.** Unread count and list are capped `onSnapshot`
  queries (`:84-153`); opening the bell marks loaded items read.

### 2.5 Feedback

- **Write-only, shape-locked.** `submitFeedback` appends to `/feedback/{autoId}`
  with `serverTimestamp()` (`feedbackService.ts:28-36`); rules deny read/update/
  delete and validate the exact 7-key shape with size caps (`rules:186-204`). The
  client trims + slices every field to its cap before write, so honest submissions
  always satisfy the rule. ✔

### 2.6 Flags (Remote Config)

- **Lesson gating works with a safety net.** `useLessons` marks a lesson
  `comingSoon` if it isn't in `available_lesson_ids` **or** has empty slots
  (`useLessons.ts:24-27`) — Remote Config can never make a contentless lesson
  playable. ✔
- **Fails safe.** `fetchAndActivate` failure is swallowed and bundled defaults are
  used (`RemoteFlagsProvider.tsx:36-53`); the live list is **unioned** with bundled
  defaults so a stale shared template can't hide a lesson this build ships (D88).

### 2.7 Captain mascot

- **Pure data + picker, well-tested.** `captainLine` does safe `{name}`/`{title}`
  interpolation with fallbacks (`captainLines.ts:48-65`); `dailyTipIndex` rotates
  one tip per calendar day. Copy is deliberately **competence-supporting and
  informational** ("a mistake you fix is remembered better than a lucky guess"),
  not empty hype — exactly the SDT-aligned tone the file documents.
- **CaptainsLog** is dismissible-per-day via `localStorage` and degrades gracefully
  in private mode (`CaptainsLog.tsx:36-44`).

---

## 3. What's missing / incomplete

- **No server-side economy integrity.** Because there are no Cloud Functions, the
  rules allow the owner to write `coins`, `streakFreezes`, `ownedAvatarStyles`,
  `ownedFlair`, `claimedChests`, `xp`, `weeklyXp` to their own doc with **no value
  validation** (`rules:31-43`). The transactional services are honest, but they are
  not the only path to the data (see §4 P1-A). This is a known consequence of the
  Spark-plan posture (`spec-social.md` "Out of scope: server-side fan-out").
- **No privacy controls.** Any signed-in user can read any `publicProfiles/{uid}`,
  including `activityDates[]`, `currentStreak`, `bestStreak`, `bio`, `xp` — for a
  HS (minor) audience there is no block list, no "private profile," no follow
  approval. `spec-social.md:162` explicitly defers this to Phase 3, so it's
  documented-not-forgotten, but it remains a real gap (§4 P2-D).
- **Notifications are follow-only.** Kudos received, achievement earned, and
  leaderboard movement do not notify; the schema is ready but unused
  (`spec-social.md:157`).
- **Comment/doc drift in flags.** `useLessons.ts:14-16` and `RemoteFlagsProvider`
  comments still say the default list is `["how-likely"]`, but
  `REMOTE_CONFIG_DEFAULTS` now ships 11 ids (`remoteFlagsConfig.ts:25-37`).
  Harmless, but misleading to the next maintainer.
- **No leaderboard tie-handling.** Equal weekly XP yields distinct sequential ranks
  (insertion order), so two tied learners see ranks 2 and 3 (§5 con).
- **Kudos / follow edge payloads are not shape-validated** in rules (only the
  writer identity is) — a self-edge could carry arbitrary fields (§4 P2-E).

---

## 4. Bugs & risks (`file:line`, P0/P1/P2)

> Severity calibrated by **who is harmed**. Because coins carry no real-money value
> and are cosmetic + self-only (D83), self-inflation is low-harm vanity; abuse that
> distorts **other** users' experience (the shared leaderboard) is rated higher.

### P1-A — Coins / cosmetics / streak-freezes are client-spoofable (no server validation)
`firebase/firestore.rules:27-48`

The `users/{uid}` `update` rule restricts only the **set of keys** that may change
and validates `bio`/`username`/`displayUsername`. It does **not** validate `coins`,
`streakFreezes`, `ownedAvatarStyles`, `ownedFlair`, or `claimedChests`. A user can
open the console and run, against their own doc:

```js
updateDoc(doc(db,'users',myUid), { coins: 999999,
  ownedAvatarStyles: ['classic','ocean','sunset','orchid','forest','gold'],
  ownedFlair: ['none','navigator','legend'], streakFreezes: 2 });
```

…bypassing `coinService` entirely — **granting coins, owning every cosmetic, and
maxing Streak Freezes without earning or paying.** The audit question "can a client
grant itself coins or buy without paying?" is therefore **yes**. Real-world harm is
low (cosmetic, self-only, no real money), **except** the free Streak Freeze lets a
user fake a perfect streak — which feeds the public `currentStreak`/`bestStreak` on
their profile and is visible to followers. **Fix path:** the only true fix is Cloud
Functions (out of Spark scope); a partial mitigation is monotonic guards in rules
(`request.resource.data.coins >= resource.data.coins` is wrong because spends
decrease; a meaningful guard needs server logic). Recommend documenting this as an
accepted limitation and gating any future real-value use of coins behind Functions.

### P1-B — Weekly-XP / XP leaderboard is spoofable → distorts friends' rankings
`firebase/firestore.rules:151-154`, `src/features/social/useLeaderboard.ts:54`

`publicProfiles` write validation only checks `xp >= 0` and `weeklyXp >= 0` — **no
upper bound, no consistency with the private doc, no check that `weekKey` matches**.
A user can set `weeklyXp: 100000, weekKey: currentWeekKey()` on their own public
profile and **top the weekly leaderboard of everyone who follows them**. Unlike
P1-A this harms *other* users' experience (the shared, comparative surface), so it
is the most consequential abuse vector in the cluster. `effectiveWeeklyXp`
(`useLeaderboard.ts:54`) faithfully trusts the stored value. **Fix path:** same
constraint as P1-A (needs server authority); at minimum add an upper-bound sanity
cap in rules to blunt absurd values, and note the limitation.

### P2-C — First-follow / first-kudos coin grant is not idempotent server-side
`src/features/social/socialService.ts:88-98` (and `:200-209`)

`earnsFirst` is decided from the **client-passed** `myAchievements` array, then
`coins: increment(25)` is written via `batch.set(..., {merge:true})` — **not** a
transaction that re-reads server state (contrast `claimChest`). Two failure modes:
(1) a client that passes `myAchievements: []` gets `+25` on **every** new follow;
(2) even an honest client following two people before its profile snapshot refreshes
double-grants. `arrayUnion('new-connection')` keeps the *achievement* idempotent, so
the divergence is silent (coins climb, achievement set stays correct). Low harm
(cosmetic currency) but a genuine correctness bug reachable through the legitimate
API. **Fix:** move the coin grant into a `runTransaction` that re-checks
`achievements` server-side, mirroring `claimChest`.

### P2-D — Public profile exposes activity pattern of a minor audience, no opt-out
`src/features/social/publicProfile.ts:55`, `firebase/firestore.rules:146`

`activityDates[]` (the exact local dates a learner studied) plus streaks are
world-readable to **any** authenticated user via `/u/:username` or search — not just
to followers. For a HS audience this is a privacy-by-default concern (a stranger can
profile when a specific student is online). Documented as Phase-3 scope
(`spec-social.md:162`) but worth an explicit ship-time risk note. **Fix:** drop
`activityDates` from the public projection (it powers nothing on public surfaces),
or scope reads to followers.

### P2-E — Follow notification can be sent without actually following; edge docs unvalidated
`firebase/firestore.rules:94-106,161-177`; `notificationsService.ts:53`

The notification `create` rule never checks that a corresponding `followers` edge
exists, so a user can drop "X started following you" into anyone's inbox without
following (one per sender, since doc id is `follow_${fromUid}`). Similarly the
`following`/`followers`/`kudos` subcollection rules validate **only the writer's
identity**, not the payload shape — a self-edge can carry arbitrary fields. Low
abuse ceiling (needs many accounts to spam; self-only fields), but it's a small
social-spoofing surface. **Fix:** optional — add a `kudos`/edge shape allowlist and
accept that follow-notif verification needs Functions.

### P2-F — `following` count is self-inflatable
`firebase/firestore.rules:161-163`

A user can create `following/{anyUid}` docs for arbitrary (even nonexistent) uids on
their own list, inflating their "following" count and seeding their leaderboard query
with phantom uids (filtered out as `null` in `useLeaderboard.ts:48`). Vanity-only,
no impact on others. **Fix:** low priority; optionally validate the target exists.

### Note (borderline, out of this cluster) — email IS sent off-app
`src/features/auth/userService.ts:121`

`sendEmailVerification` fires an off-app email at registration. This is transactional
auth, not a study reminder, so it does **not** violate D27/§9.10.6 ("no off-app
*reminders*"), but a strict reading of "no email service integration" deserves a
conscious note. It belongs to the Auth audit (01), flagged here only for completeness.

---

## 5. Pros / Cons

**Pros**
- Clean separation: pure logic (`coins.ts`, `weeklyXp.ts`, `reminderRules.ts`,
  `captainLines.ts`, `eventTypes.ts`) is Firebase/React-free and unit-tested,
  which is why the suite is green and the math is trustworthy.
- The honest write paths are genuinely careful: transactions for every coin
  spend/chest, aggregation for counts, locked-down rule shapes for feedback /
  notifications / studyEvents.
- The PII boundary (`users` private, `publicProfiles` email-blocked) is the right
  architecture and is correctly enforced.
- Engagement copy is unusually disciplined — Captain tips and the `coins.ts` header
  explicitly reason about SDT / over-justification, a rare and welcome sign that the
  reward layer was designed with the science in mind.

**Cons**
- **The entire trust boundary is the rules file, and for the economy + leaderboard
  those rules validate keys/types but not *values*.** Client-authoritative gamified
  state is inherently spoofable (P1-A, P1-B); the shared leaderboard is the part
  that actually matters.
- Coin grants outside `claimChest` (follow/kudos achievements) skipped the
  transactional idempotency pattern (P2-C).
- Privacy posture is thin for a minor audience (P2-D); no blocking/private profiles.
- Several "ready to extend" stubs (notif types, tie handling) and doc drift (flags
  defaults) add small maintenance debt.

---

## 6. Learning-science / motivation assessment

**Overall:** this engagement layer is, by gamification standards, **restrained and
mostly aligned with Self-Determination Theory** — but it is also the part of the app
most at risk of trading durable intrinsic motivation for shallow extrinsic loops, so
the restraint matters.

**What supports intrinsic motivation (keep):**
- **Coins as cosmetic + forgiveness, never pay-to-win** (`coins.ts` header). This is
  the single best design decision in the cluster: per the over-justification effect,
  rewards that you can spend to *skip the effort* corrode motivation; cosmetics and a
  streak freeze keep the reward **informational and supportive**, not controlling.
- **Captain Pascal's copy** names effort, spacing, and retrieval (competence +
  autonomy support) rather than dispensing empty praise — it actively *teaches study
  skills* while it encourages, which is the highest-value use of a mascot.
- **Friends-only, weekly-resetting leaderboard.** Comparison with *self-chosen
  similar others* (relatedness + Festinger) plus the fresh-start effect avoids the
  classic global-leaderboard failure mode where everyone outside the top few
  disengages.
- **Kudos / follows** satisfy relatedness and create light accountability without a
  noisy feed (comments stay out of scope).
- **Achievements reward learning behaviors** (comebacks, spaced returns), not raw
  grinding — goal-setting (Locke & Latham) done with informational framing.

**Extrinsic-reward risks (watch):**
- **Streaks + Streak Freeze + daily reminder + leaderboard stack into a pressure
  bundle.** Individually benign; together they can shift a learner's "why" from
  *I want to understand probability* toward *I must not break my streak / lose my
  rank* — controlled motivation, which SDT predicts erodes once the external prod
  stops. The Streak Freeze is a thoughtful pressure-release valve; the daily reminder
  dialog is the most "controlling" surface and should stay gentle and skippable
  (it currently is).
- **Leaderboard for a struggling student.** Even friends-only weekly comparison can
  demoralize the lowest-XP learner in a friend group. There is no "opt out of
  ranking" — worth considering.
- **Cosmetic treadmill.** Coins risk becoming the *point* (collect styles) rather
  than a side-effect of learning. Pricing is high enough that this is mild today.

**Extraneous cognitive load (HS learner):** the engagement chrome lives **outside**
the lesson player (Home, Profile, Friends, Store), so it adds little extraneous load
*during* learning — the right call. The one in-lesson reward signal (XP/streak chip)
is minimal. The pirate/treasure metaphor is decorative and consistent; it's seductive
detail but low-cost because it never competes with the probability content itself.

**Opportunities:**
1. Make the Captain *contextual to the misconception just made* (tie a tip to the
   wrong answer), turning the mascot from ambient flavor into a retrieval prompt.
2. Add an optional "focus mode" / leaderboard opt-out so the comparison surface is
   genuinely autonomy-supportive.
3. Reframe streak copy toward process ("you showed up 5 days") over loss-aversion
   ("don't lose your streak"). `captainLines.ts` already models this tone — extend it
   to the streak chip and reminder.
4. Notify on **kudos received** (not just follows): receiving encouragement is the
   higher-relatedness event and is currently silent.

---

## 7. Prioritized recommendations

**P0 (ship-blocker): none.** Nothing here crashes, loses data, leaks PII, or breaks
a scope negative. The scope-compliance verdict (no real money, no off-app
notifications, social PII boundary intact) is **PASS**.

**P1 (high-value before/just-after deadline):**
1. **Document the client-authoritative economy + leaderboard limitation explicitly**
   (P1-A, P1-B) in `docs/privacy.md`/deploy checklist, and add a defensive
   upper-bound sanity cap on `weeklyXp`/`xp` in `publicProfiles` rules to blunt the
   leaderboard-spoofing surface. The real fix (Cloud Functions / server authority)
   is a Phase-2 item — call it out so reviewers know it's a known tradeoff, not an
   oversight.
2. **Make the follow/kudos coin grant transactional** (P2-C) — small, mirrors the
   existing `claimChest` pattern, removes a real double-grant bug.

**P2 (nice-to-have):**
3. **Drop `activityDates` (and consider streaks) from the public projection** (P2-D)
   to reduce the activity-pattern exposure of a minor audience; it powers nothing on
   public surfaces.
4. **Add leaderboard tie-handling** (shared rank for equal weekly XP) and an
   optional ranking opt-out (learning-science §6).
5. **Fix the flags doc drift** (`useLessons.ts` / `RemoteFlagsProvider` comments vs
   the 11-id default) and add edge-doc shape validation for kudos/following.
6. **Contextual Captain tips + kudos-received notifications** (learning-science
   opportunities #1, #4).
