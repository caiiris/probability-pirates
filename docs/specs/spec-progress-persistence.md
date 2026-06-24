# Spec: Progress Persistence

> Owns where the learner is in the course, which variant they're looking at, and the append-only attempt log. Backed by `/users/{uid}/lessonProgress/{lessonId}` and `/users/{uid}/stepAttempts/{autoId}`. Includes the deterministic variant-selection algorithm.

## Purpose

Persist every check the learner makes server-side so progress survives reload, device switch, and crash. Make resume restore the _exact_ slot and the _exact_ variant the learner was looking at. Give other features (habit loop, course path) a clean API to read progress and a fast log they can later mine for mastery signals.

## User-facing behavior

The learner never thinks about this spec directly. They notice it when:

- They close the app mid-lesson and reopen — they land on the same slot they left.
- They reload on a different device — same.
- They replay a completed lesson — they get a fresh mix of variants (different from last time, but stable for the duration of the replay).
- They tap an answer — feedback appears in < 100ms (the persistence write happens in the background, doesn't block UI).

## Data model

### Firestore docs this spec owns

```
/users/{uid}/lessonProgress/{lessonId}    // one doc per touched lesson
/users/{uid}/stepAttempts/{autoId}        // append-only log
```

### `/users/{uid}/lessonProgress/{lessonId}` shape

| field                 | type                             | notes                                                              |
| --------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `state`               | `'in_progress'` \| `'completed'` | doc absence = `not_started`                                        |
| `slotIndex`           | number                           | 0-based current slot; used for resume                              |
| `attemptId`           | string                           | UUID, regenerated on replay-from-scratch — seeds variant selection |
| `selectedVariantIds`  | map<string, string>              | `{ [slotId]: variantId }`; populated lazily as slots are reached   |
| `xpEarnedThisAttempt` | number                           | resets to 0 on replay                                              |
| `completedAt`         | Timestamp \| null                | set on transition to `'completed'`                                 |
| `updatedAt`           | Timestamp                        | `serverTimestamp()` on every write                                 |

### `/users/{uid}/stepAttempts/{autoId}` shape (append-only)

| field           | type      | notes                                                       |
| --------------- | --------- | ----------------------------------------------------------- |
| `lessonId`      | string    |                                                             |
| `slotId`        | string    | matches a `Slot.id` in the content model                    |
| `variantId`     | string    | matches a `Variant.id` within the slot                      |
| `attemptNumber` | number    | 1, 2, 3 within the same slot in the same sitting            |
| `wasCorrect`    | boolean   |                                                             |
| `xpAwarded`     | number    | per `spec-habit-loop` table                                 |
| `answerPayload` | map       | what the learner submitted (cell list, fraction, choice id) |
| `createdAt`     | Timestamp | `serverTimestamp()`                                         |

### Variant selection algorithm

```ts
// src/features/progress/selectVariant.ts
import { fnv1a32 } from '@/lib/hash';

export function selectVariantIndex(
  userId: string,
  lessonId: string,
  attemptId: string,
  slotId: string,
  variantCount: number,
): number {
  const seed = `${userId}|${lessonId}|${attemptId}|${slotId}`;
  return fnv1a32(seed) % variantCount;
}
```

- The hash function (`fnv1a32`) is a 30-line pure function in `src/lib/hash.ts`. Stable across deploys and Node/browser engines.
- On a slot's first visit, `progressService.recordVariantSelection(lessonId, slotId, variantId)` writes the chosen variant id to `selectedVariantIds[slotId]`. Subsequent visits read from that map (resume = same variant).
- On replay, the player generates a new `attemptId` (`crypto.randomUUID()`); selection re-runs with the new seed; `selectedVariantIds` is reset.

### Firestore security rules (this spec's slice)

```
match /users/{uid}/lessonProgress/{lessonId} {
  allow read, write: if request.auth.uid == uid;
}
match /users/{uid}/stepAttempts/{attemptId} {
  allow read: if request.auth.uid == uid;
  allow create: if request.auth.uid == uid
                && request.resource.data.attemptNumber >= 1
                && request.resource.data.attemptNumber <= 10;  // abuse cap
  allow update, delete: if false;  // append-only
}
```

The `attemptNumber <= 10` cap is a cheap defense against a stuck client retrying forever (see `docs/alternatives.md` D54 — "abuse cap").

## Implementation outline

1. Create `src/lib/hash.ts` exporting `fnv1a32(input: string): number` (a 30-line FNV-1a 32-bit hash). Pure, no dependencies, deterministic.
2. Create `src/features/progress/selectVariant.ts` with `selectVariantIndex(...)` and a thin wrapper `pickVariantForSlot(progressDoc, slot, userId, lessonId)` that prefers `progressDoc.selectedVariantIds[slot.id]` if present, else computes from seed.
3. Create `src/features/progress/progressService.ts` with:
   - `getOrCreateProgress(uid, lessonId): Promise<LessonProgress>` — read or create the doc with `state: 'in_progress', slotIndex: 0, attemptId: crypto.randomUUID(), ...`.
   - `recordVariantSelection(uid, lessonId, slotId, variantId)` — `updateDoc` with `selectedVariantIds.{slotId} = variantId`.
   - `recordAttempt(uid, lessonId, slotId, variantId, attemptNumber, wasCorrect, xpAwarded, answerPayload)` — `addDoc` to `stepAttempts` AND `updateDoc` on `lessonProgress` to bump `slotIndex` (if correct or unlocked) and `xpEarnedThisAttempt`. Use a batched write.
   - `markLessonCompleted(uid, lessonId)` — set `state: 'completed', completedAt: serverTimestamp()`.
   - `startReplay(uid, lessonId)` — set `state: 'in_progress', slotIndex: 0, attemptId: crypto.randomUUID(), selectedVariantIds: {}, xpEarnedThisAttempt: 0`.
4. Create `src/features/progress/useLessonProgress.ts` — a hook that subscribes to `/users/{uid}/lessonProgress/{lessonId}` via `onSnapshot`; returns `{ progress, loading }`.
5. Create `src/features/progress/useAllLessonProgress.ts` — subscribes to the full `lessonProgress` collection for Home; returns a `Map<lessonId, LessonProgress>`.
6. Extend `firebase/firestore.rules` with the rules above.
7. Write Vitest tests using the Firebase emulator: create progress, record correct attempt, verify `slotIndex` advances, resume returns same variant, replay returns new `attemptId` and reshuffles, `attemptNumber > 10` is rejected.
8. Write a unit test for `selectVariantIndex` confirming: same inputs → same output; different `attemptId` → different output (or same with `% N`); distribution is roughly uniform over 1000 calls.

## Edge cases

- **Two devices write at the same time:** Firestore's last-write-wins is acceptable. `slotIndex` only ever monotonically increases (the player computes `max(local, remote)`). The `stepAttempts` log is append-only so both writes survive.
- **`crypto.randomUUID` unavailable:** modern browsers all support it; if not, fall back to a tiny `Math.random`-based UUID (acceptable — only used as a seed).
- **`selectedVariantIds` is missing when player needs it:** treat as first visit, compute, write.
- **Replay from a partially-completed lesson:** "replay" only makes sense once `state === 'completed'`. Mid-lesson "start over" is out of scope for MVP (would require a confirmation dialog and clarity on whether it counts as a new attempt for streak purposes).
- **Variant pool shrinks between deploys** (a variant gets removed): `selectedVariantIds[slotId]` points to a variant that no longer exists. Fallback: log to Sentry and re-run `selectVariantIndex` for this slot.
- **`stepAttempts` write fails:** the inline toast tells the learner; one retry; on second failure, the learner's UI is unblocked but the attempt is lost. The next correct write will save the _next_ slot's progress (so they don't get stuck).
- **Hash collision** between two different `attemptId`s causing the same variant order: rare and harmless — both learners see a valid variant.
- **Lesson is `comingSoon: true`:** the player should refuse to open it (see `spec-course-path`); this spec assumes only real lessons reach `progressService`.

## Test plan

- `selectVariantIndex` is deterministic (same seed → same output, 100 runs).
- `selectVariantIndex` distribution: across 1000 randomly-seeded calls with `variantCount = 2`, each variant should appear 450–550 times.
- Emulator integration: create progress doc, record a correct attempt, verify `slotIndex` is 1, `xpEarnedThisAttempt` is 10, a `stepAttempts` doc exists.
- Emulator: resume returns the same `selectedVariantIds`.
- Emulator: replay regenerates `attemptId` and (with high probability across multiple lessons) produces a different variant on at least one slot.
- Emulator: writing a `stepAttempts` doc with `attemptNumber: 11` is rejected by the rules.
- Emulator: a user cannot read another user's `lessonProgress` or `stepAttempts`.
- Emulator: a user cannot update or delete an existing `stepAttempts` doc.

## Out of scope

- Optimistic UI updates (we rely on Firestore's local cache for instant reads).
- Firestore offline persistence (alternatives D25).
- Replay-from-current-slot (only replay-from-scratch in MVP).
- Per-attempt grace tokens (e.g. "hint used") — Phase 3.
- Spaced-repetition scheduling over the attempts log (Phase 3).
- Per-user variant balancing (alternatives D33 gap).
