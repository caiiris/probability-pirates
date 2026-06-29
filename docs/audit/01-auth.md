# Audit 01 — Authentication & Account Lifecycle

> Pre-deadline audit. Method: static reading of source + Firestore rules + spec/PRD.
> Ground truth accepted as given: `tsc` clean, `eslint --max-warnings=0` clean,
> `vitest run` 1083/1083 green. No runtime/visual verification was performed — every
> claim that depends on live Firebase behavior (rule evaluation against a real
> request, session persistence, OAuth redirect, email delivery) is flagged as
> **not runtime-verified**.
>
> Scope: `src/features/auth/*`, `src/lib/firebase.ts`,
> `src/components/EmailVerificationBanner.tsx`, and the `users` + `usernames` slices
> of `firebase/firestore.rules`. Reference docs: `docs/prd.md` §9.1 (10 ACs),
> `docs/specs/spec-auth.md`, `docs/alternatives.md` D16–D18, D48, D50, D51.

---

## 1. Overview

**What it is.** Email/username/password auth on Firebase Auth, with a `/users/{uid}`
private profile doc and a `/usernames/{lowercased}` sentinel for case-insensitive
username uniqueness. Beyond the original spec the feature has grown four additions —
Google sign-in, a first-time-Google username-setup step, email-verification nudging,
and forgot-password — all of which are in scope here.

**Files / entry points.**

| Concern | File |
| --- | --- |
| Firebase SDK init (auth, db, analytics, RC, perf, emulator wiring) | `src/lib/firebase.ts` |
| Service layer (register, signIn, Google, claimUsername, changeUsername, reset, signOut) | `src/features/auth/userService.ts` |
| App-wide auth state + profile snapshot | `src/features/auth/AuthProvider.tsx` (`useAuth()`) |
| Route gate | `src/features/auth/RequireAuth.tsx` |
| Pages | `LoginPage.tsx`, `RegisterPage.tsx`, `UsernameSetupPage.tsx` |
| Widgets | `GoogleSignInButton.tsx`, `ForgotPasswordDialog.tsx`, `AuthHero.tsx`, `src/components/EmailVerificationBanner.tsx` |
| OAuth platform heuristic + redirect-error buffer | `src/features/auth/authRedirect.ts` (+ `.test.ts`) |
| Error taxonomy + copy | `src/lib/errors.ts` |
| Rules | `firebase/firestore.rules` (`/users` 12–137, `/publicProfiles` 145–178, `/usernames` 213–223) |

**Routes** (`src/App.tsx:64-98`): `/login`, `/register` (public); `/setup-username`
(half-auth, self-guarded, deliberately *not* wrapped in `RequireAuth` to avoid a
redirect loop — `App.tsx:69-72`); everything else sits under a single
`<RequireAuth><AppShell/></RequireAuth>` parent route (`App.tsx:75-94`); `*` →
`/` (`App.tsx:97`).

**State machine** (`AuthProvider.tsx:49-57`): `loading → unauthenticated |
needs_username | authenticated{profile|null}`. `needs_username` exists only for a
Google user with no profile doc yet (`AuthProvider.tsx:119-127`) and is routed to
`/setup-username` by `RequireAuth.tsx:22-24`.

---

## 2. What works (verified by reading; ACs from PRD §9.1)

- **AC1 — Successful registration.** `registerUser` (`userService.ts:32-128`) creates
  the Auth user, writes `/usernames`, `/publicProfiles`, and `/users` in one
  `runTransaction` (`:54-95`), and Firebase auto-signs-in on
  `createUserWithEmailAndPassword`. `RegisterPage.tsx:82-84` navigates to `/`
  (and the `authenticated` early-return at `:43` also routes there). Single submit. ✔
- **AC2 — Client-side validation.** `RegisterPage.validate()` (`:45-62`) gives a
  specific message per failure: malformed email (`:49`), username regex
  `^[a-zA-Z0-9_]{3,20}$` (`:52`, mirrored in `userService.ts:223`), password < 6
  (`:55`), mismatch (`:58`). Errors render inline with `role="alert"` and
  `aria-describedby` wiring (`:145-152` etc.). ✔
- **AC3 — Server conflicts.** `auth/email-already-in-use` → typed `email-in-use`
  (`errors.ts:115`) shown on the email field (`RegisterPage.tsx:88-89`);
  `username-taken` thrown inside the transaction (`userService.ts:56-57`) shown on
  the username field (`:90-91`); orphan Auth account cleaned via `deleteUser`
  (`:99`). ✔ (robustness caveats in §4).
- **AC4 — Case-insensitive uniqueness.** Sentinel keyed on `username.toLowerCase()`
  (`userService.ts:38`); transaction re-reads and fails if it exists (`:55-57`);
  rules force `name == name.lower()` on create (`firestore.rules:217`). ✔
- **AC6 — Generic auth failure.** `signIn` returns one `GENERIC_ERROR` for unknown
  username, missing user doc, and any `signInWithEmailAndPassword` throw
  (`userService.ts:139-168`); copy never reveals which field was wrong
  (`errors.ts:46`). Satisfies D50. ✔ (but see B2 — the username branch can throw
  *before* reaching this handler).
- **AC8 — Sign out + route gating.** `signOutUser` (`userService.ts:212-214`) is
  called from Profile (`ProfilePage.tsx:44-46`); the resulting `unauthenticated`
  state makes `RequireAuth` redirect to `/login` (`RequireAuth.tsx:18-20`). Gated
  routes redirect when unsigned. ✔ (logout relies on the redirect rather than an
  explicit `navigate('/login')`, which is fine).
- **AC9 — New-account defaults persisted.** Seed writes `xp:0, currentStreak:0,
  bestStreak:0, bio:'', avatarUrl:null` plus the gamification defaults
  (`userService.ts:71-94`); rules *enforce* the zeros on create
  (`firestore.rules:17-25`). ✔
- **AC10 — Double-submit (button).** Submit buttons disable while in flight:
  login `disabled={submitting || !identifier || !password}` (`LoginPage.tsx:122`),
  register `disabled={submitting}` (`RegisterPage.tsx:206`), setup
  (`UsernameSetupPage.tsx:113`), Google button (`GoogleSignInButton.tsx:56`),
  resend (`EmailVerificationBanner.tsx:37`). ✔ for taps (gap for Enter-key, B5).
- **Privacy hardening (good).** `/users` is owner-only read (`firestore.rules:13`);
  the public projection `/publicProfiles` hard-blocks `email`
  (`firestore.rules:150`) and is the only cross-user-readable surface. Update
  allowlists on both `/users` (`:29-48`) and `/usernames` (no update, `:222`)
  prevent field injection / `createdAt` tampering.
- **Beyond-spec additions read as coherent:** Google two-phase onboarding
  (`signInWithGoogle` → `claimUsername`, `userService.ts:388-488`) reuses the same
  transactional sentinel write and rules; mobile OAuth correctly switches to
  `signInWithRedirect` via a UA heuristic (`authRedirect.ts:11-21`) with the
  redirect result drained on load before the auth listener wires up
  (`AuthProvider.tsx:146-150`); forgot-password is enumeration-safe (B-/below).

**Not runtime-verified:** AC5 (login by username — see B1, believed broken), AC7
(session persistence — relies on Firebase default `local` persistence; no explicit
`setPersistence` call anywhere, so this is inherited default behavior, plausible but
unverified). Live rule evaluation, OAuth redirect round-trip, and email delivery
were not executed.

---

## 3. What's missing / incomplete vs spec

- **Pre-transaction username `getDoc` optimization is gone.** `spec-auth.md:88-108`
  specifies a cheap `getDoc(/usernames/{lower})` *before* creating the Auth account
  so a common taken-username collision never burns an Auth account. `registerUser`
  instead creates the Auth user first (`userService.ts:44`) and only discovers the
  collision inside the transaction (`:56`), forcing a `deleteUser` rollback on the
  *common* path, not just the race. Functionally correct, materially less robust
  (see B3).
- **Rules diverged from the spec's login-by-username contract.** `spec-auth.md:113-120`
  and its test plan (`:161`) state `/users` is readable by *any* authed user
  "because login-by-username needs it." The shipped rule is owner-only
  (`firestore.rules:13`). This is the root of B1 — the spec slice in the doc no
  longer matches the deployed rule.
- **Orphan-cleanup observability.** `spec-auth.md:149` says a failed `deleteUser`
  should "log to Sentry." The code only `console.error`s (`userService.ts:102`).
  No Sentry/telemetry on the orphan path.
- **`storage` export.** `spec-auth.md:135` (impl outline) calls for `firebase.ts` to
  export `storage`; it does not (`firebase.ts:22-24` export only `app/auth/db`).
  Out of strict auth scope but a spec deviation that touches avatar upload.
- **Forgot-password is email-only.** `sendPasswordReset` is keyed on email and
  cannot resolve a username (`userService.ts:171-206`, documented at `:174-177`).
  A learner who signs in *by username* and has forgotten their email cannot reset.
  Spec listed forgot-password as out-of-MVP, so this is an additive feature with a
  known gap rather than a regression.
- **Email verification is nudged, not enforced** (matches `spec-auth.md:154`): the
  banner is informational and suppressed entirely in dev
  (`EmailVerificationBanner.tsx:13-15`). No gating of features on `emailVerified`.

---

## 4. Bugs & risks

> Severity: **P0** = ship-blocker, **P1** = serious (fix before deadline if at all
> possible), **P2** = polish / robustness.

### B1 — Login-by-username is broken by the owner-only `/users` read rule — **P0**
`signIn` resolves a username to an email by reading **another user's** profile doc
*while the requester is still unauthenticated*:

```146:160:src/features/auth/userService.ts
  // If identifier doesn't look like an email, resolve it via the username sentinel
  if (!identifier.includes('@')) {
    const usernameRef = doc(db, 'usernames', identifier.toLowerCase());
    const usernameSnap = await getDoc(usernameRef);
    if (!usernameSnap.exists()) {
      return { ok: false, error: GENERIC_ERROR };
    }
    const uid = usernameSnap.data().uid as string;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { ok: false, error: GENERIC_ERROR };
    }
    email = userSnap.data().email as string;
  }
```

But the rule allows `/users` reads **only to the owner**:

```12:13:firebase/firestore.rules
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
```

On the login screen `request.auth == null` (the user is signing in), so
`getDoc(/users/{uid})` (`userService.ts:155`) is denied. This means **AC5 ("login
by email or username") fails for the username path** — a documented, advertised
feature (the field literally reads "Email or username", `LoginPage.tsx:80`). It also
directly contradicts the spec's own rule slice and test plan (`spec-auth.md:113-120,
161`). The PII-hardening comment on the rule (`firestore.rules:6-7`) shows the rule
is the *intended* state and login-by-username is the unintended casualty. Email
login still works, which is why the email-path tests stay green; I could not confirm
whether the emulator test harness loads these production rules, so this is a
read-the-code finding, **not runtime-verified** — but the rule and the code are
mutually inconsistent by inspection. Made worse by B2 (the failure is *ungraceful*).
**Highest-leverage fix in this audit.**

### B2 — Username-resolution reads are outside `try/catch`; a thrown read hangs the form — **P1**
The two `getDoc`s in the username branch (`userService.ts:148-159`) are **not**
inside the `try` that wraps `signInWithEmailAndPassword` (`:162-168`). Any throw —
permission-denied (B1), or a flaky-network error on mobile — propagates out of
`signIn`. `LoginPage.handleSubmit` then never runs `setSubmitting(false)` and never
sets an error:

```32:49:src/features/auth/LoginPage.tsx
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;
    setError('');
    setSubmitting(true);
    const result = await signIn({ identifier, password });
    setSubmitting(false);
    ...
```

There is no surrounding `try/catch`, so on a thrown promise the button stays stuck
on "Signing in…" with no message. This converts B1 (and any transient read failure)
from a clean generic error into a dead form. Independently shippable fix even if B1
is resolved at the rules layer.

### B3 — Taken-username always burns + deletes an Auth account; `deleteUser` failure leaves an orphan that signs into a profile-less state — **P1**
Because the pre-check `getDoc` was dropped (§3), every duplicate-username
registration creates an Auth user (`userService.ts:44`) and relies on the rollback
`deleteUser` (`:99`). If `deleteUser` fails (network drop, transient), the catch only
`console.error`s (`:102`) — no Sentry, no retry — and an orphan Auth account remains:
a valid email/password with no `/users` doc. That orphan can then *sign in*, and the
provider routes it into the app in a broken state, because the `needs_username`
recovery is **Google-only**:

```119:129:src/features/auth/AuthProvider.tsx
        const isGoogleUser = firebaseUser.providerData.some((p) => p.providerId === 'google.com');
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubProfile = onSnapshot(
          userRef,
          (snap) => {
            if (!snap.exists() && isGoogleUser) {
              setState({ status: 'needs_username', user: firebaseUser });
              return;
            }
            const profile = snap.exists() ? (snap.data() as UserProfile) : null;
            setState({ status: 'authenticated', user: firebaseUser, profile });
```

An email orphan hits the `else` and becomes `authenticated, profile: null` →
`RequireAuth` renders the app (`RequireAuth.tsx:26`) with a null profile, which
downstream screens (Home/Profile) are not guaranteed to handle. Restoring the spec's
pre-transaction `getDoc` would make this path rare again; adding Sentry on the
`deleteUser` failure (per spec) and an email-side `needs_username`/repair branch
would make it safe.

### B4 — Registration-failure rollback bounces the user to `/login` with no error shown — **P2**
On a successful `createUserWithEmailAndPassword`, `onAuthStateChanged` fires
`authenticated` *before* the transaction completes, so `RegisterPage`'s early return
navigates away immediately:

```41:43:src/features/auth/RegisterPage.tsx
  if (auth.status === 'loading') return null;
  if (auth.status === 'needs_username') return <Navigate to="/setup-username" replace />;
  if (auth.status === 'authenticated') return <Navigate to="/" replace />;
```

If the transaction then fails and `deleteUser` runs (`userService.ts:96-99`), the
user is signed out → `unauthenticated` → `RequireAuth` redirects to `/login`. The
`result.error` returned to `handleSubmit` (`RegisterPage.tsx:87-94`) is set on a
component that has already unmounted, so the learner lands on the login screen with
**no explanation** of why their account wasn't created. Race window is small but the
failure mode is confusing.

### B5 — Enter-key double-submit is not guarded — **P2 (partial AC10 gap)**
Neither `handleSubmit` short-circuits on an in-flight request (`LoginPage.tsx:32-49`,
`RegisterPage.tsx:64-95` — no `if (submitting) return`). The disabled *button*
prevents a second click, but pressing **Enter** in a still-focused field re-fires the
form `onSubmit` while the first request is in flight, producing two `signIn` /
`registerUser` calls. D51/AC10 says "double-tapping does not produce two account
creations or two login attempts." Tap is covered; the keyboard path is not. (For
register the second call usually fails with `email-in-use`, but it's still a second
network attempt and a possible confusing error.)

### B6 — `EmailVerificationBanner` reads a stale `emailVerified` and never refreshes — **P2**
`user.emailVerified` (`EmailVerificationBanner.tsx:14-15`) is cached on the Firebase
user object. After the learner clicks the verification link, the banner persists for
the whole session because nothing calls `user.reload()`. Cosmetic but nagging.

### B7 — Username length: client (≤20) stricter than rules (≤30) — **P2 (cosmetic)**
Client regex caps usernames at 20 (`RegisterPage.tsx:22`, `userService.ts:223`) while
rules permit ≤30 (`firestore.rules:219`) and `displayUsername` ≤30 (`:23, :46`). The
client is stricter so nothing slips through, but the bounds should be reconciled to
avoid future drift.

### B8 — Username sentinels are publicly enumerable — **P2 (accepted, by design)**
`/usernames` is world-readable (`firestore.rules:214`) to support unauthenticated
login resolution, exposing the full set of taken usernames and their `uid`s. Low
risk (no PII), and required by D18, but worth noting in the privacy posture.

### B9 — App can hang on `loading` if the Google redirect drain stalls — **P2**
The auth listener is wired only *after* `processGoogleRedirectResult()` resolves
(`AuthProvider.tsx:146-150`). If that network call is slow/hangs, the whole app stays
in `loading` (blank `RequireAuth`/page renders nothing). No timeout fallback.

---

## 5. Pros / Cons

**Pros**
- Clean service/UI separation: all Firebase calls live in `userService.ts`; pages are
  thin; error copy is centralized and typed (`errors.ts`).
- Discriminated `AuthResult` union (`errors.ts:33-34`) makes call-site handling
  exhaustive and keeps raw `auth/*` codes out of the UI.
- Real atomicity for the uniqueness invariant via `runTransaction` with an in-tx
  re-read; the same primitive is reused for register, Google claim, and rename — one
  pattern, one rules surface.
- Strong privacy defaults: owner-only `/users`, PII-free public projection with an
  `email` hard-block, tight update allowlists that block field injection and
  `createdAt`/`username` tampering.
- Security-conscious copy: single generic login error (D50), enumeration-safe
  password reset (`userService.ts:191-192`), `prompt: 'select_account'` for shared
  devices (`:393`).
- Mobile OAuth correctness: redirect-vs-popup heuristic + redirect-error buffer
  surfaced back on the auth page (`authRedirect.ts`, `AuthProvider.tsx:146-150`).

**Cons**
- The single most important non-email login path (username) is broken by a
  rules/code mismatch (B1) and fails ungracefully (B2).
- Robustness of the orphan-cleanup path regressed vs spec (B3): cleanup is on the hot
  path, has no telemetry, and email orphans have no recovery state.
- A few "navigate-on-state" races (B4) and an Enter-key double-submit gap (B5) that a
  framework form library would have handled for free.
- Several spec deviations (pre-check getDoc, Sentry logging, rules contract, storage
  export) suggest the spec and the rules drifted out of sync during the post-spec
  feature additions.

---

## 6. Learning-science / UX-friction assessment

**Sign-up friction.** Email + username + password + confirm = four fields
(`RegisterPage.tsx`), which is on the heavy side for a phone-in-hand HS first-timer,
but the prominent one-tap **Sign up with Google** (`:120-123`) is the right pressure
valve and was a sensible addition beyond the original email-only D17 decision. The
Google → pick-a-username step (`UsernameSetupPage.tsx`) is a single, well-explained
screen ("One last step", `:78`) with a clean escape hatch ("Use a different account",
`:117-126`) — good funnel design.

**Error-copy clarity for a first-timer.** Copy is warm, sentence-case, and
specific where it can be: the username rule message spells out the exact constraint
("3-20 characters: letters, numbers, underscores only", `RegisterPage.tsx:53`),
which is far better than a regex error. The deliberately vague login error
("That login does not match our records.", `errors.ts:46`) is correct for security
but is the one place a 14-year-old may feel stuck — they can't tell whether it's the
username or the password. The forgot-password affordance on the same row
(`LoginPage.tsx:97-103`) partially mitigates this. The enumeration-safe reset copy
("If an account exists for that email…", `errors.ts:50-51`) is honest and reduces
panic.

**Friction risks specific to the HS persona.**
- A learner who registered *with* a username (their natural identity) and then tries
  to log in *by* that username hits B1 — the worst possible first-return experience
  (silent stuck form). High learning-science cost: the friction lands at the exact
  "come back tomorrow" moment the whole habit loop depends on (PRD §6).
- Forgot-password only accepts email; a learner who only remembers their username has
  no path. Consider resolving username→email server-side, or at least telling them
  "enter the email you signed up with" (the dialog does, `ForgotPasswordDialog.tsx:60-62`).
- Password minimum is 6 chars (`RegisterPage.tsx:55`) — Firebase default, low bar;
  acceptable for this audience but worth a deliberate decision.
- No age gate (D48) is a conscious product/legal posture, not a bug, but it remains
  the open COPPA exposure for this minor-heavy audience.

---

## 7. Recommendations (prioritized for the deadline)

1. **Fix B1 (P0).** Decide the canonical contract and align code + rules:
   - *Preferred (keeps PII hardening):* stop reading `/users` for email resolution.
     Either mirror the (non-PII-sensitive enough) email into the world-readable
     `/usernames` sentinel for login resolution, or store a small public
     `username → email` lookup the login flow can read while unauthenticated.
   - *Or (matches the spec as written):* relax `/users` read to
     `request.auth != null` (any authed user) — but that re-opens the email-PII leak
     the rule was hardened to close, and still doesn't help the *unauthenticated*
     login read. So the lookup-doc approach is the real fix.
   Add/keep an emulator **rules test** that performs an *unauthenticated*
   username→email resolution so this can never regress silently again.
2. **Fix B2 (P1).** Wrap the whole `signIn` body (incl. the two username `getDoc`s)
   in `try/catch` returning `GENERIC_ERROR`, and/or wrap `LoginPage.handleSubmit` so
   `setSubmitting(false)` always runs. This alone removes the dead-form failure mode.
3. **Harden registration (B3, P1).** Restore the spec's pre-transaction
   `getDoc(/usernames/{lower})` so common collisions never create an Auth account;
   add Sentry (or the project's telemetry) on `deleteUser` failure (`userService.ts:102`);
   and add an **email-side** profile-missing branch in `AuthProvider`
   (`:124-129`) so an orphaned email account is recovered (route to a setup/repair
   screen) instead of rendering the app with `profile: null`.
4. **Close the double-submit/keyboard gap (B5, P2).** Add `if (submitting) return;`
   at the top of both `handleSubmit`s.
5. **Smooth the register rollback UX (B4, P2).** Don't rely on the `authenticated`
   early-return to navigate during registration; gate that redirect until the
   profile actually exists, or surface the rollback error via a toast that survives
   the route change.
6. **Polish (P2):** call `user.reload()` before reading `emailVerified` in the banner
   (B6); reconcile the 20-vs-30 username caps (B7); add a timeout/fallback so a stalled
   Google redirect drain can't pin the app on `loading` (B9); consider username→email
   resolution for forgot-password.

---

## Executive summary

- **Solid architecture & privacy posture.** Clean service/UI split, a typed
  `AuthResult` union, real transactional username uniqueness reused across email +
  Google + rename, owner-only `/users`, and a PII-free public projection that
  hard-blocks `email`. Security-aware copy (generic login error, enumeration-safe
  reset) is genuinely good for the audience.
- **8 of 10 §9.1 ACs read as satisfied** (1, 2, 3, 4, 6, 8, 9, 10-by-tap). AC7
  (session persistence) relies on Firebase defaults and is plausible but
  **not runtime-verified**; AC5 is believed broken (below).
- **Most severe bug — B1 (P0): login-by-username is broken.** `signIn` reads
  `/users/{uid}` while unauthenticated (`src/features/auth/userService.ts:155`) but
  the rule is owner-only (`firebase/firestore.rules:13`). This fails AC5 and
  contradicts the spec's own rules slice/test plan (`spec-auth.md:113-120, 161`). Not
  runtime-verified, but the code and rules are inconsistent by inspection.
- **Compounding bug — B2 (P1):** those username reads sit outside `try/catch`
  (`userService.ts:148-159`), so the B1 denial (or any flaky-network read) throws and
  leaves the login form stuck on "Signing in…" with no error (`LoginPage.tsx:39-48`).
- **Robustness regression — B3 (P1):** the spec's pre-transaction username check was
  dropped, so every taken username burns + deletes an Auth account; a failed
  `deleteUser` (`userService.ts:99-102`, console-only, no Sentry) leaves an email
  orphan that signs into a `profile: null` state because `needs_username` recovery is
  Google-only (`AuthProvider.tsx:119-129`).
- **Lower-severity:** registration-rollback bounces the user to `/login` with no
  error (B4, P2, `RegisterPage.tsx:41-43`); Enter-key double-submit isn't guarded
  (B5, P2); stale `emailVerified` banner (B6, P2); 20-vs-30 username-cap drift (B7);
  stall-on-loading if the Google redirect drain hangs (B9).
- **UX/learning-science:** sign-up friction is reasonable thanks to one-tap Google and
  a clean username-setup step; error copy is warm and specific. The biggest learning
  cost is that B1 lands precisely at the "come back tomorrow" return moment the habit
  loop depends on; forgot-password being email-only is a secondary friction.
- **Single highest-leverage improvement:** fix **B1** by giving the login flow an
  unauthenticated-readable username→email lookup (instead of reading owner-only
  `/users`), and lock it in with an emulator rules test that resolves a username while
  signed out. This restores AC5, removes the worst return-user failure, and — paired
  with the trivial B2 try/catch — eliminates the stuck-form symptom.
