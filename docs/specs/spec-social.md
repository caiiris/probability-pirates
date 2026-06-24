# Spec: Social

> Followers/following, friend search by username, viewable public profiles, a
> friends-only weekly leaderboard ("trophy table"), kudos/cheers, and an expanded
> achievement system. Reverses the original "no social" MVP decision (alternatives
> D24). Lives under `src/features/social/` plus additions to `src/features/profile/`.

## Purpose

Add lightweight social connection grounded in learning science, without turning a
solo learning tool into a noisy feed. Every surface is opt-in and framed to support
motivation rather than undermine it.

### Learning-science rationale

- **Followers / following — relatedness (Self-Determination Theory).** Satisfying
  the need for relatedness sustains intrinsic motivation; visible connections also
  create study-buddy accountability (social commitment).
- **Friends-only, weekly-resetting leaderboard — Social Comparison Theory
  (Festinger).** Comparison with similar others (people you chose to follow) is
  motivating; weekly resets give the fresh-start effect so learners who fell behind
  re-engage. We deliberately avoid a global all-time ranking, which demotivates
  everyone outside the top few.
- **Kudos / cheers — prosocial behavior + relatedness.** Encouragement benefits both
  giver and receiver.
- **Expanded achievements — informational rewards (SDT) + goal-setting (Locke &
  Latham).** Achievements reward the behaviors that build durable knowledge
  (retrieval, learning from errors, spacing), not just raw activity. Copy stays
  informational, not controlling. See `src/lib/achievements.ts`.

## Data model

`users/{uid}` stays owner-read-only because it holds PII (email). A PII-free
projection powers all social reads:

- **`publicProfiles/{uid}`** — public read (any signed-in user), owner write.
  Fields: `username` (lowercase, searchable), `displayUsername`, `bio`, `avatarUrl`,
  `xp`, `lessonsCompleted`, `stepsCompleted`, `currentStreak`, `bestStreak`,
  `milestonesReached[]`, `achievements[]`, `activityDates[]`, `weeklyXp`, `weekKey`.
  Never `email`.
  - **`following/{followeeUid}`** — written by the list owner.
  - **`followers/{followerUid}`** — written by the follower (doc id is their uid).
  - **`kudos/{fromUid}`** — written by the sender (doc id is their uid).

A separate **private inbox** lives on the recipient's owner-only doc tree (see
"Notifications" below):

- **`users/{uid}/notifications/{notifId}`** — sender-create, owner-read; carries
  the inbox feed.

Counts come from `getCountFromServer` aggregation queries, so no user ever writes a
counter on another user's document.

### Mirroring (Spark plan, no Cloud Functions)

The projection is maintained client-side:

- `registerUser` / `claimUsername` seed `publicProfiles/{uid}` in the same
  transaction as the user doc (`publicProfileSeed`).
- `habitService` writes a `writeBatch` to both `users/{uid}` and
  `publicProfiles/{uid}` (XP, streaks, steps, milestones, achievements, weekly XP).
- `updateProfile` mirrors bio/avatar.
- `ensurePublicProfile` (called once per session from `AuthProvider`) backfills the
  projection for accounts created before this feature and self-heals drift.

### Weekly XP

`src/lib/weeklyXp.ts`: `currentWeekKey()` (ISO-8601 week, e.g. `2026-W26`),
`effectiveWeeklyXp()` (treats a stale `weekKey` as 0). `habitService` increments
`weeklyXp` within the same week and resets it on a new week.

## Firestore rules (this spec's slice)

`publicProfiles/{uid}`: `read if signed in`; `create/update if owner`, with tolerant
field validation (partial gamification merges allowed) and a hard `!('email' in
request.resource.data)` guard; `delete` denied. Subcollections allow create/delete
only by the writer identified by the doc id (`uid` for following, `followerUid` for
followers, `fromUid` for kudos). See `firebase/firestore.rules`.

## Routes & UI

- `/friends` (`SocialPage`, new AppShell nav item): username search + weekly
  leaderboard + your follower/following counts.
- `/u/:username` (`PublicProfilePage`): read-only `ProfileBody` + Follow button +
  Cheer (kudos) button + counts. Resolves username -> uid via the `usernames`
  sentinel; viewing your own username redirects to `/profile`.
- `/profile` gains a follower/following count row (tap to open list dialogs) and the
  expanded `TrophyCase` (streak milestones + achievements).

Shared components: `ProfileBody` (extracted from `ProfilePage`, used by both
profiles), `FollowButton`, `FollowCounts`, `FollowListDialog`, `UserListItem`,
`KudosButton`, `Leaderboard` (+ `useLeaderboard`), `usePublicProfile`,
`NotificationBell` (in `AppHeader`).

## Notifications

A lightweight in-app inbox, today firing on **follows only** (the schema and the
rules' closed `type` enum are ready to extend to kudos, achievements, etc.). No
push, no email; the bell + dot in the header is the entire surface.

**Why a private subcollection on `users/{uid}` (not `publicProfiles/{uid}`):**
notifications are addressed personal data ("X followed you"), so they live on
the owner-only tree. Anyone authenticated can _create_ a notification in someone
else's inbox (which is how follows fan out without Cloud Functions), but only
the recipient can read, mark read, or delete.

**Trigger:** `socialService.follow()` adds a single `batch.set` to the target's
inbox as part of its existing write batch via
`notificationsService.queueFollowNotification(batch, me, targetUid)`. Follow +
notification land atomically.

**Doc id:** `follow_{fromUid}`. Re-following after an unfollow refreshes the
same doc instead of stacking duplicates. (Unfollow does not tombstone — the
"X followed you" event remains historically true until the recipient deletes it.)

**Shape (enforced in rules):** `{ type, fromUid, fromUsername,
fromDisplayUsername, createdAt, read }`; `type` is a closed enum (currently
`'follow'`); `fromUid == request.auth.uid`; `createdAt == request.time`;
`read == false` on create; `keys().hasOnly(...)`; recipient cannot be the sender.

**Mark-as-read:** owner-only `update`, restricted to flipping `read`. The bell's
"open the panel" event marks all currently-loaded items read in a single
`writeBatch`. Owner-only `delete` is allowed for future "clear" UX.

**UI:** `NotificationBell` in `AppHeader` shows a coral unread badge (capped at
"9+"). Tap to open a small panel listing the most recent 20 items, newest first
(avatar + "X started following you" + relative timestamp); each row links to
`/u/:username`. Click-outside or Escape closes. Both the unread count and the
list are real-time `onSnapshot` subscriptions (`useUnreadCount`,
`useRecentNotifications`).

**Cost note:** two live subscriptions per session per user. The unread query is
capped at 20 (rules limit growth via the closed-set `type` + sender gate). For a
free-tier deployment this is well within bounds.

## Analytics

Events (`src/lib/analytics.ts`): `follow_user`, `unfollow_user`, `user_search`,
`kudos_sent`, `achievement_earned`, `leaderboard_view`. A `notification_open`
event is a reasonable follow-up but is not wired today.

## Edge cases

- **Pre-existing accounts** have no projection until `ensurePublicProfile` runs;
  search/leaderboard simply won't show them until then.
- **Weekly bucket at a week boundary** may be momentarily imprecise on a
  resume-then-finish with no correct check that day; `effectiveWeeklyXp` zeroes stale
  buckets for display and the next correct attempt resets correctly.
- **Following someone then they delete activity:** counts are computed live, so they
  stay correct.
- **Self-follow / self-kudos** are rejected in `socialService`.

## Out of scope

- Activity feed (a chronological feed of friends' actions). The new follow
  notification is point-to-point, not a broadcast feed.
- Notification _types_ beyond `follow` (kudos / achievements / leaderboard
  movement). Extending the `type` enum + adding a row variant is mechanical when
  wanted.
- Push or email notifications (no Cloud Functions / messaging configured).
- Mutual-follow "friend" semantics (following is one-directional).
- Blocking / privacy controls beyond the PII boundary — Phase 3.
- Server-side fan-out or Cloud Functions (Spark plan; mirroring + notifications
  are client-side).
