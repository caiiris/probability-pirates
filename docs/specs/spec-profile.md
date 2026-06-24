# Spec: Profile

> The user's profile screen — avatar, username, bio, lifetime stats, milestone trophies, edit profile, log out. Lives at route `/profile`. Reads `useAuth().profile`; writes via `userService.updateProfile`.
>
> **Avatar upload deferred (D72 / I026):** Firebase Storage requires Blaze; MVP ships on Spark. All users see `DefaultAvatar` (initial on colored circle). Edit Profile is bio-only until Storage is enabled.

## Purpose

Give the learner a small but real sense of identity (avatar, bio) and lifetime achievement (XP, streaks, milestones earned). Provide log-out. This is the only screen for editing profile info in MVP.

## User-facing behavior

### Header
- Sticky app shell navigation (Home / Profile) — same as `spec-course-path`. Bottom nav on mobile; shadcn `Sidebar` block on tablet+ per D63 / D71.
- Top of the page: large avatar (96px on mobile, 128px on tablet+), centered, with `displayUsername` below it and `bio` below that.
- Empty bio → muted "Tap Edit to add a bio."

### Stats grid (responsive — 2-col mobile, 3-col tablet+)
- `Total XP`
- `Lessons completed`
- `Steps completed`
- `Current streak`
- `Best streak`
- `Course progress` (e.g. `1 / 6`)
- Each stat in a small shadcn `Card`. Number large (text-3xl), label small (text-sm muted) below.

### Milestones row
- Horizontal scroll row of earned milestone trophies, each a small card with the trophy SVG + milestone title.
- Empty state (no milestones): a muted card "Keep going — your first trophy is 3 days away."

### Edit Profile (modal)
- Opened by a shadcn `Button` "Edit Profile" below the header.
- Modal (shadcn `Dialog`) with one field for MVP:
  - **Bio:** shadcn `Textarea`, 150 char max, char counter.
- Save button writes the new bio to `/users/{uid}` via `updateProfile`.
- **Avatar upload omitted for MVP** (D72 / I026). Do not render "Change photo" or file picker until Storage is enabled. Full avatar flow (file picker, upload, preview) ships when I026 is closed; see original spec bullets in git history or `spec-profile` post-Storage.

### Log out
- shadcn `Button variant="destructive"` at the very bottom, full-width, with a confirm dialog ("Log out?").
- On confirm: `signOutUser()` → redirect to `/login`.

## Data model

This spec mutates `/users/{uid}` (bio, avatarUrl) and writes to Firebase Storage. It reads:
- `useAuth().profile` (live `/users/{uid}` doc).
- `useAllLessonProgress(uid)` for the course-progress stat (or denormalized `lessonsCompleted`).

### Firebase Storage rules (this spec's slice)
```
match /avatars/{filename} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
               && filename.matches(request.auth.uid + '\\.(png|jpe?g)')
               && request.resource.size < 2 * 1024 * 1024  // 2 MB
               && request.resource.contentType.matches('image/(png|jpe?g)');
}
```

## Implementation outline

1. Create `src/features/profile/ProfilePage.tsx`. Reads `useAuth()`. Renders header + stats grid + milestones row + Edit button + Log out button. Disabled state if `profile === null` (still loading).
2. Create `src/features/profile/StatsGrid.tsx` — pure presentational; takes `{ xp, lessonsCompleted, stepsCompleted, currentStreak, bestStreak, courseProgress }`.
3. Create `src/features/profile/MilestonesRow.tsx` — maps `profile.milestonesReached` to trophy cards using `MILESTONE_TITLES` from `src/lib/milestones.ts`.
4. Create `src/features/profile/EditProfileDialog.tsx` — shadcn `Dialog`, controlled component. Validates bio length client-side.
5. Create `src/features/profile/avatarService.ts` exporting `uploadAvatar(uid, file): Promise<string>`:
   - Validates `file.size < 2_097_152`, `file.type ∈ {image/png, image/jpeg}`.
   - Uploads to `avatars/{uid}.{ext}` via `uploadBytes`.
   - Returns the download URL from `getDownloadURL`.
6. Extend `src/features/auth/userService.ts` with `updateProfile(uid, { bio?, avatarUrl? })` — a `setDoc(..., { merge: true })`.
7. Update `firebase/storage.rules` with the rules above.
8. Wire `<ProfilePage>` into `App.tsx` at `/profile` inside `<RequireAuth>` and `<AppShell>`.
9. Write Vitest tests for `avatarService.uploadAvatar` validation (oversize, wrong type) using the emulator.

## Edge cases

- **No avatar uploaded:** render a default avatar — a colored circle with the user's first initial. (Component: `<DefaultAvatar username={...} />`; deterministic background color from `fnv1a32(username) % palette.length`.)
- **Avatar upload succeeds but `updateProfile` write fails:** the file is in Storage but the URL isn't on the user doc. On next save attempt, try `updateProfile` again with the URL we already have (cached in component state). Acceptable trade-off; no orphan cleanup in MVP.
- **Bio over 150 chars:** Save button disabled; inline char counter goes red.
- **Bio with only whitespace:** trim before save; treat as empty.
- **File picker cancelled:** no-op, no preview change.
- **User logs out mid-upload:** the upload should complete (the auth token is captured when the upload starts); the URL won't be written to the (now signed-out) `/users/{uid}`. Stale file in Storage; acceptable for MVP.
- **`courseProgress` denormalization drift** between `profile.lessonsCompleted` and the actual progress collection: trust the collection count for the stat grid (compute it fresh on each render).
- **User reaches a new milestone but hasn't completed a lesson yet** (so `milestonesReached` isn't updated): milestones row still shows the old set. That's fine — milestones are designed to celebrate at lesson-completion time.
- **Very long `displayUsername`:** truncate with ellipsis at ~24 chars in the header.

## Test plan

- Manual: open Profile → see avatar (default if not set), username, bio, all stats reflect real data.
- Manual: tap Edit, change bio, save → reopens with new bio; check Firestore to confirm `/users/{uid}.bio` updated.
- Manual: tap Edit, upload a PNG, save → avatar updates in the header; check Storage for `avatars/{uid}.png`.
- Manual: try to upload a 3 MB file → inline error "Image must be under 2 MB."
- Manual: log out → return to `/login`; hitting `/profile` redirects to `/login`.
- Unit: `avatarService.uploadAvatar` rejects oversize files synchronously (no upload attempted).
- Integration (emulator): a user cannot upload to another user's `avatars/{otherUid}.png` (rules-enforced).

## Out of scope

- Friends / following, public profiles, username search, friends leaderboard, and
  the expanded achievement system — these shipped later and now live in
  [spec-social.md](spec-social.md). (This reverses the original MVP exclusion
  noted in alternatives D24.)
- Account settings (timezone, notifications, language) — Phase 3.
- Account deletion / data export — Phase 3 GDPR.
- Avatar cropping UI — pickers handle native cropping on iOS; Android accepts as-is; we don't ship a custom cropper.
- Image compression on upload (`browser-image-compression` is ~30 KB; revisit if upload payloads cause complaints).
- Editing username after registration (alternatives D16).
- Email change.
