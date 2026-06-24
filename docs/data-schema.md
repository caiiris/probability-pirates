# Data Schema — Consolidated Reference

> One screen view of every Firestore collection, Storage path, and security rule for Pascal Phase 1. Authoritative bodies live in each spec; this doc cross-links and exists so an implementer can sanity-check the whole shape in one place.
>
> Sources of truth (in case of conflict, the spec wins):
> - `docs/specs/spec-auth.md` — `/users/{uid}`, `/usernames/{name}`
> - `docs/specs/spec-progress-persistence.md` — `/users/{uid}/lessonProgress/{lessonId}`, `/users/{uid}/stepAttempts/{autoId}`
> - `docs/specs/spec-habit-loop.md` — mutations on `/users/{uid}` (xp, streak, milestones)
> - `docs/specs/spec-profile.md` — Storage `avatars/{filename}`
> - `docs/specs/spec-social.md` — `/publicProfiles/{uid}` + `following/`, `followers/`, `kudos/`; `/users/{uid}/notifications/{notifId}`
> - `docs/issues.md` I034 — `/feedback/{autoId}` (no dedicated spec)

---

## 1. Collection map

```
firestore/
├── users/
│   └── {uid}/                          [spec-auth]
│       ├── lessonProgress/
│       │   └── {lessonId}              [spec-progress-persistence]
│       ├── stepAttempts/
│       │   └── {autoId}                [spec-progress-persistence, append-only]
│       ├── studyEvents/
│       │   └── {eventId}               [spec-schedule, owner CRUD]
│       └── notifications/
│           └── {notifId}               [spec-social, sender-create / owner-read]
├── publicProfiles/                     [spec-social]
│   └── {uid}/                          PII-free projection of /users/{uid}
│       ├── following/{followeeUid}     owner-write (list owner)
│       ├── followers/{followerUid}     sender-write (follower)
│       └── kudos/{fromUid}             sender-write (cheerer)
├── usernames/
│   └── {lowercasedUsername}            [spec-auth, rename-capable sentinel — D16 amended]
└── feedback/
    └── {autoId}                        [I034, create-only; reviewed in console]

storage/
└── avatars/
    └── {uid}.{png|jpg|jpeg}            [spec-profile]
```

---

## 2. `/users/{uid}` — user profile document

Created at registration, mutated by every feature that touches the learner.

| Field | Type | Default | Owner spec | Notes |
| --- | --- | --- | --- | --- |
| `username` | string | required | spec-auth | lowercased; lookup key |
| `displayUsername` | string | required | spec-auth | preserves user casing |
| `email` | string | required | spec-auth | mirrored from Firebase Auth at registration |
| `bio` | string | `''` | spec-profile | ≤ 150 chars |
| `avatarUrl` | string \| null | `null` | spec-profile | Storage download URL |
| `xp` | number | `0` | spec-habit-loop | lifetime XP |
| `lessonsCompleted` | number | `0` | spec-habit-loop | denormalized counter — see I022 |
| `stepsCompleted` | number | `0` | spec-habit-loop | per D55: only correct answers count |
| `currentStreak` | number | `0` | spec-habit-loop | calendar days |
| `bestStreak` | number | `0` | spec-habit-loop | `max(bestStreak, currentStreak)` |
| `lastActiveDate` | string \| null | `null` | spec-habit-loop | `YYYY-MM-DD` in learner's local tz |
| `milestonesReached` | string[] | `[]` | spec-habit-loop | e.g. `['streak-3', 'streak-7']` |
| `createdAt` | Timestamp | `serverTimestamp()` | spec-auth | |

**Mutators:** `userService.registerUser` (create), `userService.updateProfile` (bio/avatar), `habitService.awardXpAndStreak` (xp/streak/milestones), `progressService.markLessonCompleted` (lessonsCompleted).

**Readers:** `AuthProvider` via `onSnapshot` (subscribes once, app-wide).

---

## 3. `/usernames/{lowercasedUsername}` — username uniqueness sentinel

Write-once doc that reserves a username. The doc *being created* is the uniqueness check.

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | the owning user's UID |
| `createdAt` | Timestamp | `serverTimestamp()` |

**Mutators:** `userService.registerUser` (create), `userService.changeUsername` (rename: create new + delete old sentinel in one transaction — D16 amendment 2026-06-24).

**Readers:** `userService.signIn` (for login-by-username); `userService.registerUser` (for the pre-transaction availability check).

---

## 4. `/users/{uid}/lessonProgress/{lessonId}` — per-lesson resume state

One document per lesson the learner has touched. Document absence = `not_started`.

| Field | Type | Notes |
| --- | --- | --- |
| `state` | `'in_progress' \| 'completed'` | — |
| `slotIndex` | number | 0-based; resume target |
| `attemptId` | string | UUID; seeds variant selection; regenerated on replay |
| `selectedVariantIds` | `Record<string, string>` | `{ [slotId]: variantId }`; lazy-populated |
| `xpEarnedThisAttempt` | number | resets to `0` on replay |
| `completedAt` | Timestamp \| null | set on `in_progress → completed` transition |
| `updatedAt` | Timestamp | `serverTimestamp()` on every write |

**Mutators:** `progressService.getOrCreateProgress` (create), `progressService.recordAttempt` (slotIndex + xpEarnedThisAttempt), `progressService.recordVariantSelection` (selectedVariantIds), `progressService.markLessonCompleted` (state + completedAt), `progressService.startReplay` (full reset).

**Readers:** `useLessonProgress(lessonId)` (one subscription per active lesson), `useAllLessonProgress(uid)` (for Home + Profile course progress).

---

## 5. `/users/{uid}/stepAttempts/{autoId}` — append-only attempt log

Every Check submission writes one doc. Server enforces `1 ≤ attemptNumber ≤ 10` (D54 abuse cap).

| Field | Type | Notes |
| --- | --- | --- |
| `lessonId` | string | |
| `slotId` | string | matches `Slot.id` |
| `variantId` | string | matches `Variant.id` |
| `attemptNumber` | number | 1–10 within one slot in one sitting |
| `wasCorrect` | boolean | |
| `xpAwarded` | number | per `spec-habit-loop` |
| `answerPayload` | map | what the learner submitted |
| `createdAt` | Timestamp | `serverTimestamp()` |

**Mutators:** `progressService.recordAttempt` (create only).

**Readers:** none in MVP (Phase 3 mastery / analytics will mine this log).

---

## 5b. `/users/{uid}/notifications/{notifId}` — private inbox

In-app inbox for the recipient. Today the only `type` is `follow` (the doc id is
`follow_{fromUid}` so re-following refreshes the same row rather than stacking
duplicates).

| Field | Type | Notes |
| --- | --- | --- |
| `type` | `'follow'` | closed enum in rules; extensible |
| `fromUid` | string | must equal `request.auth.uid` |
| `fromUsername` | string | lowercased, ≤ 30 |
| `fromDisplayUsername` | string | ≤ 30 |
| `createdAt` | Timestamp | `serverTimestamp()` (rules enforce `== request.time`) |
| `read` | boolean | `false` on create; recipient flips to `true` |

**Mutators:** `notificationsService.queueFollowNotification` (create, batched
inside `socialService.follow`); `markNotificationRead` /
`markAllNotificationsRead` (recipient flips `read`).

**Readers:** `useUnreadCount(uid)` (header badge),
`useRecentNotifications(uid, max)` (bell panel). Both are live `onSnapshot`
subscriptions, owner-only by rules.

**Rules contract:** sender-create with `fromUid == auth.uid`,
`type in ['follow']`, `read == false`, `createdAt == request.time`, strict
`keys().hasOnly(...)`; recipient ≠ sender; only the owner may `read`, `update`
(`affectedKeys().hasOnly(['read'])`), or `delete`. See `firebase/firestore.rules`.

---

## 5c. `/feedback/{autoId}` — bug reports + general feedback (top-level)

Append-only inbox for in-app feedback. Written from the footer's "Send feedback"
dialog (`src/features/feedback/`). Create-only from signed-in clients; no client
read/update/delete — the owner reviews submissions in the Firebase console.

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | must equal `request.auth.uid` |
| `username` | string | submitter's lowercased username, ≤ 30 (context only) |
| `type` | `'bug' \| 'feedback'` | closed enum in rules |
| `message` | string | 1–2000 chars |
| `route` | string | pathname the user was on, ≤ 200 (triage context) |
| `userAgent` | string | `navigator.userAgent`, ≤ 500 (triage context) |
| `createdAt` | Timestamp | `serverTimestamp()` (rules enforce `== request.time`) |

**Mutators:** `feedbackService.submitFeedback` (create only).

**Readers:** none in-app by design. Owner reads via
[Firestore console → `feedback`](https://console.firebase.google.com/project/brilliant-clone-102a7/firestore/data/~2Ffeedback).
No Cloud Functions on Spark, so there is no email/notification on new feedback.

**Rules contract:** `create` requires `uid == auth.uid`, `type in ['bug','feedback']`,
`1 ≤ message.size() ≤ 2000`, length-capped `username`/`route`/`userAgent`,
`createdAt == request.time`, and strict `keys().hasOnly([...])`. `read`, `update`,
`delete` are all `false`. See `firebase/firestore.rules`.

---

## 6. Firebase Storage — `avatars/{filename}`

`filename` matches `{uid}.png` or `{uid}.jpg` / `{uid}.jpeg`. Size cap 2 MB. Content-type must match the extension.

**Mutators:** `avatarService.uploadAvatar` (overwrite-on-upload — only one avatar per user).

**Readers:** any authed client (URL is on the user doc; `<img>` tag in Profile and Home headers).

---

## 7. Security rules — combined view

The single `firestore.rules` and `storage.rules` files unify these. **Authoritative bodies live in the specs.** This section shows the union for reviewer convenience.

### `firebase/firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // spec-auth
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid
                    && request.resource.data.xp == 0
                    && request.resource.data.currentStreak == 0;
      allow update: if request.auth.uid == uid;
      allow delete: if false;

      // spec-progress-persistence
      match /lessonProgress/{lessonId} {
        allow read, write: if request.auth.uid == uid;
      }
      match /stepAttempts/{attemptId} {
        allow read: if request.auth.uid == uid;
        allow create: if request.auth.uid == uid
                      && request.resource.data.attemptNumber >= 1
                      && request.resource.data.attemptNumber <= 10;
        allow update, delete: if false;
      }
    }

    // spec-auth — rename-capable sentinel (D16 amended): owner may release
    // their own name so changeUsername can move it; update stays forbidden.
    match /usernames/{name} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && name == name.lower();
      allow delete: if request.auth != null
                    && resource.data.uid == request.auth.uid;
      allow update: if false;
    }

    // I034 — feedback inbox: create-only, locked shape, no client reads.
    match /feedback/{id} {
      allow read, update, delete: if false;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.type in ['bug', 'feedback']
                    && request.resource.data.message.size() >= 1
                    && request.resource.data.message.size() <= 2000;
    }
  }
}
```

### `firebase/storage.rules`

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // spec-profile
    match /avatars/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && filename.matches(request.auth.uid + '\\.(png|jpe?g)')
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/(png|jpe?g)');
    }
  }
}
```

---

## 8. Required indexes

MVP queries are all by single-field reads on a single user's subcollections. **No composite indexes required.**

`firebase/firestore.indexes.json` ships as:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

If a future query needs ordering + filtering (e.g. `where('lessonId', '==', X).orderBy('createdAt', 'desc')` over `stepAttempts`), Firebase will surface the missing-index error with a link to create one.

---

## 9. Read/write budget (sanity check vs Firebase free tier)

For one learner finishing Lesson 1 (5 problem slots, 2 wrong + 1 correct average, 7 slots total):

| Operation | Count | Source |
| --- | --- | --- |
| Reads via `useAuth().profile` subscription | 1 initial + N updates | spec-auth |
| Reads via `useLessonProgress(lessonId)` | 1 initial + N updates | spec-progress |
| Writes to `stepAttempts` (one per Check) | ~15 | spec-progress |
| Writes to `lessonProgress` (slotIndex, selectedVariantIds, xpEarnedThisAttempt) | ~7 | spec-progress |
| Writes to `/users/{uid}` (xp, streak, lessonsCompleted) | ~6 | spec-habit-loop |
| **Total writes per Lesson 1 completion** | **~28** | |

Free tier: 20K writes/day. A class of 30 doing 1 lesson/day = ~840 writes/day. Healthy margin. Profile/home views add reads but Firestore's listener cache de-dupes.

---

## 10. Schema invariants the code enforces

- `currentStreak ≤ bestStreak` always (mutator updates bestStreak in the same write).
- `lessonProgress.state === 'completed'` implies `lessonProgress.completedAt !== null`.
- A `stepAttempts` doc's `lessonId`+`slotId`+`variantId` references must resolve to real entities in `src/content/lessons/` at write time (defensive — the player can only generate valid refs).
- `selectedVariantIds[slotId]` always points at a variant that exists in the lesson at write time (orphan handling: re-run selection per `spec-progress-persistence` edge case).
- `usernames/{name}` is created only when `name === name.lower()` (rule-enforced).

---

## 11. Related issues

- **I002** — `firebase/` rule files don't exist in the repo yet.
- **I010** — Two-tab concurrent play behavior is undefined (data layer is safe; UX is not).
- **I022** — Course-progress denormalization vs live count needs a single helper.
