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
`KudosButton`, `Leaderboard` (+ `useLeaderboard`), `usePublicProfile`.

## Analytics

New events (`src/lib/analytics.ts`): `follow_user`, `unfollow_user`, `user_search`,
`kudos_sent`, `achievement_earned`, `leaderboard_view`.

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

- Activity feed / notifications.
- Mutual-follow "friend" semantics (following is one-directional).
- Blocking / privacy controls beyond the PII boundary — Phase 3.
- Server-side fan-out or Cloud Functions (Spark plan; mirroring is client-side).
