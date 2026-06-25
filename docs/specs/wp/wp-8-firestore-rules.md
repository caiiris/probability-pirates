# WP-8 — Firestore rules for Phase 2 subcollections

> **Type:** security rules + emulator test. **Depends on:** nothing. **Blocks:** WP-5 (writes learnerModel), WP-6 (writes practiceState/practiceXp). **Server/AI:** no.
>
> Small and isolated. Mirrors the existing owner-only pattern already used for `lessonProgress` / `stepAttempts`.

## Goal

Add owner-only read/write rules for the three new subcollections in [C8](wp-contracts.md#c8-firestore-paths-owned-by-wp-8-consumed-by-wp-5-wp-6), without touching the existing `users/{uid}` document update allowlist.

## Files

- **Edit** `firebase/firestore.rules` — add three nested `match` blocks inside the existing `match /users/{uid} { ... }` block.
- **Add/extend** the rules emulator test (follow whatever pattern exists for `lessonProgress`; if none, add `firebase/firestore.rules.test.ts` or the project's existing rules-test harness).

## Rules to add (inside `match /users/{uid} {`)

```
match /learnerModel/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /practiceState/{topicId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /practiceXp/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Steps (loop until green)

1. Insert the three blocks alongside the existing `lessonProgress` / `stepAttempts` matches (same nesting level, same owner-only shape).
2. Do **not** modify the `users/{uid}` document `allow update` allowlist — Phase 2 practice XP reuses the already-allowlisted `xp` / `weeklyXp` / `weekKey` fields; the per-day counter lives in the `practiceXp` subdoc, so no new top-level field is needed.
3. Add emulator tests: owner can read/write its own `learnerModel/state`, `practiceState/{topic}`, `practiceXp/today`; a different uid is denied read and write on all three.
4. Run the rules test suite + deploy a dry-run validation if the project has one (`firebase deploy --only firestore:rules --dry-run` is optional; the emulator test is the gate).

## Test plan / Definition of Done

- Emulator test: `users/A/learnerModel/state` is readable+writable by A, denied for B. Same for `practiceState/{x}` and `practiceXp/today`.
- The existing rules tests still pass (no regression to `users`, `lessonProgress`, `stepAttempts`, social, etc.).
- `firebase/firestore.rules` still compiles (no syntax error).

## Boundaries (do NOT touch)

- Do not alter the `users/{uid}` create/update allowlists or any existing match block.
- Do not add public-read anywhere (these are private, owner-only — no leaderboard surface in Phase 2).
- Do not add a `practiceProblems` collection rule (that's the post-Friday Track-2 stretch; out of scope here).
