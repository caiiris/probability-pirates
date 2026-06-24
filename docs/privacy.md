# Privacy stance (MVP)

> Phase 1 posture for Pascal / Probability Pirates. Resolves issue I019. The
> audience is high-school students, and registration has **no age gate** (D48),
> so this document records what we collect, why, and how a deletion request is
> handled. Not legal advice; revisit before any wider/public launch.

## Who this is for

A high-school student learning probability. The app is shared by a teacher or
the learner directly. We do **not** market to or knowingly target children
under 13. There is no age-gate checkbox in MVP (D48); the deployment context
(a teacher sharing a link with their class) is assumed to handle suitability.

## What we collect

| Data | Where | Why |
|---|---|---|
| Email address | Firebase Auth + `/users/{uid}` | Account identity, login, password reset path |
| Username (chosen) | `/users/{uid}`, `/usernames/{name}`, `/publicProfiles/{uid}` | Login-by-username, public profile, leaderboard display |
| Password | Firebase Auth (hashed by Google; we never see it) | Authentication |
| Bio (optional, ≤150 chars) | `/users/{uid}`, `/publicProfiles/{uid}` | Profile personalization |
| Learning progress, attempts, XP, streaks | `/users/{uid}/lessonProgress`, `/stepAttempts`, `/users/{uid}` | Resume, mastery, habit loop |
| Coins / cosmetic items | `/users/{uid}` | In-app cosmetics (no real money) |
| Schedule events (optional, user-entered) | `/users/{uid}/studyEvents` | Personal study planner |
| Social graph (follows, kudos) | `/publicProfiles/{uid}/{following,followers,kudos}` | Following + cheers |
| Analytics events (GA4) | Firebase Analytics, only if `VITE_FIREBASE_MEASUREMENT_ID` set | Aggregate funnel / drop-off; not used to identify individuals |

We do **not** collect: real name, phone, location, contacts, photos (avatars are
generated, not uploaded — see I026), or payment data (there are no payments).

## How it's stored

- Google Firebase (Auth + Firestore), US data region.
- Firestore security rules enforce owner-only access to `/users/{uid}` and its
  subcollections; `/publicProfiles` exposes a **PII-free** projection (email is
  hard-blocked at the rules layer) for search / leaderboard / public profiles.

## Third parties

- **Google Firebase** — auth, database, hosting, analytics, performance.
- **Google Sign-In** (optional provider) — OAuth identity only.
- No advertising networks, no data brokers, no LLM/AI providers.

## Deletion requests (MVP: manual)

There is no self-serve account deletion in MVP. A user (or their guardian/teacher)
emails the operator; the operator deletes the Firebase Auth user and the
`/users/{uid}` document tree and `/usernames/{name}` + `/publicProfiles/{uid}`
entries by hand. Automating this is Phase 2+.

## Known gaps (accepted for MVP)

- No age gate (D48); no parental-consent flow (COPPA/FERPA compliance assumed to
  be handled by the sharing context, not the app).
- No password recovery UI in MVP (PRD §10 E7) — handled manually.
- No cookie banner; analytics is on only when a measurement ID is configured.
