# Audit 05 — Progress Persistence & Firestore Data Layer

> Pre-deadline audit of Pascal's progress-persistence feature: the `lessonProgress`
> resume doc, the append-only `stepAttempts` log, deterministic variant selection,
> cross-device sync, replay, and the Firestore security rules that fence them.
>
> **Scope (read-only):** `src/features/progress/*` (`progressService.ts`,
> `selectVariant.ts` + test, `useLessonProgress.ts`, `useAllLessonProgress.ts`),
> `firebase/firestore.rules`, `firebase/firestore.rules.test.ts`, `docs/data-schema.md`,
> plus the primary consumer `src/features/lesson/LessonPlayer.tsx`.
>
> **Ground truth accepted:** `tsc` clean, `eslint` clean, `vitest` 1083/1083. The
> suite was **not** re-run; findings below are static + cross-reference analysis
> against PRD §9.2 (9 ACs), `spec-progress-persistence.md`, and `alternatives.md`
> (D14, D15, D33, D52–D54).

---

## 1. Overview — data model, services, hooks

### Data model (two-doc pattern, D14)

| Doc | Path | Role |
| --- | --- | --- |
| **Resume state** | `/users/{uid}/lessonProgress/{lessonId}` | One mutable doc per touched lesson. Holds `state`, `slotIndex`, `attemptId`, `selectedVariantIds`, `xpEarnedThisAttempt`, `completedAt`, `updatedAt`. Doc absence = `not_started`. |
| **Attempt log** | `/users/{uid}/stepAttempts/{autoId}` | Append-only. One doc per Check tap: `lessonId`, `slotId`, `variantId`, `attemptNumber`, `wasCorrect`, `xpAwarded`, `answerPayload`, `createdAt`. |

Shapes match `docs/data-schema.md` §4–5 and the spec table. The `LessonProgress`
type lives at `progressService.ts:20-28`.

### Services — `progressService.ts`

- `getOrCreateProgress` (`:65-89`) — `getDoc` then, if absent, `setDoc` a fresh
  `in_progress` doc with a new `attemptId` (`randomUUID`, `:49-59`).
- `recordVariantSelection` (`:95-106`) — `updateDoc` writing `selectedVariantIds.{slotId}`.
- `recordAttempt` (`:112-168`) — **batched** write: append a `stepAttempts` doc +
  `updateDoc` on `lessonProgress` bumping `xpEarnedThisAttempt` via `increment()`
  (`:154`). Returns a typed `{ok}` result rather than throwing.
- `advanceSlot` (`:174-192`) — read-then-write, **monotonic** (only moves the index
  forward, `:183`).
- `markLessonCompleted` (`:198-212`) — sets `state:'completed'` + `completedAt`.
- `startReplay` (`:218-240`) — guards on `state==='completed'`, then full reset with
  a **new `attemptId`** and emptied `selectedVariantIds`.
- `pruneStaleProgress` (`:259-274`) — best-effort batched delete (D91 housekeeping).

### Variant selection — `selectVariant.ts`

- `selectVariantIndex` (`:10-19`) — `fnv1a32("uid|lessonId|attemptId|slotId") % variantCount`.
  Pure, deterministic; `fnv1a32` (`src/lib/hash.ts`) uses `Math.imul(...)>>>0` so it
  is stable across Node/browser engines and deploys.
- `pickVariantForSlot` (`:26-48`) — prefers the recorded `selectedVariantIds[slot.id]`;
  falls back to the seed if absent or if the saved variant no longer exists in content.

### Hooks

- `useLessonProgress(uid, lessonId)` (`useLessonProgress.ts:16-46`) — single-doc
  `onSnapshot`; states `loading | empty | ready | error`.
- `useAllLessonProgress(uid)` (`useAllLessonProgress.ts:15-42`) — collection
  `onSnapshot` → `Map<lessonId, LessonProgress>` for Home/Profile.

### Security rules (`firestore.rules`)

- `lessonProgress` (`:53-55`): `allow read, write: if uid == auth.uid` — owner-scoped,
  **no field validation**.
- `stepAttempts` (`:57-69`): owner read; `create` validates `attemptNumber` (int, 1–10),
  `xpAwarded` (int, 0–20), `wasCorrect` (bool); `update, delete: if false` (append-only).

---

## 2. What works (cited against PRD §9.2 ACs)

- **AC 1 — Mid-lesson resume (exact slot + variant).** ✅ `slotIndex` persists and the
  player resumes at it (`LessonPlayer.tsx:157`); `pickVariantForSlot` restores the exact
  saved variant (`selectVariant.ts:32-37`). Robust even if the `recordVariantSelection`
  write was lost, because the seed `(uid|lessonId|attemptId|slotId)` is deterministic and
  recomputes the *same* index (`:40-47`).
- **AC 2 — Cross-device sync (one-refresh contract).** ✅ Both hooks use live `onSnapshot`
  (`useLessonProgress.ts:28`, `useAllLessonProgress.ts:26`), which is *stronger* than the
  one-refresh contract (D52) — a peer device updates in real time. `viewSlotIndex` tracks
  the leading edge via `Math.max(prev, slotIndex)` (`LessonPlayer.tsx:167-170`).
- **AC 3 — Replay produces fresh-but-stable variants.** ✅ `startReplay` mints a new
  `attemptId` and clears `selectedVariantIds` (`progressService.ts:227-235`); the new seed
  reshuffles, and the persisted `attemptId` keeps the mix stable for the replay's duration.
  Matches D53's probabilistic wording.
- **AC 4 — Append-only attempt history.** ✅ Rules forbid `update`/`delete` on
  `stepAttempts` (`firestore.rules:68`); the client only ever `set`s a fresh auto-id doc
  (`progressService.ts:139-149`).
- **AC 5 — Progress is private.** ✅ Both subcollections gate read/write on
  `request.auth.uid == uid` (`firestore.rules:54`, `:58-60`). A cross-user read/write is
  denied. *(But see §3: not covered by emulator tests.)*
- **AC 7 — Persistence never blocks feedback.** ✅ `handleCheck` dispatches the
  CORRECT/WRONG verdict to the local reducer **before** awaiting any write
  (`LessonPlayer.tsx:259-263`, comment at `:252-258`); `attemptNumber`/`xpAwarded` are
  captured before the dispatch (`:236-243`) so the values written are unaffected.
- **AC 8 — Graceful persistence failure.** ✅ `recordAttempt` returns `{ok:false}` instead
  of throwing (`progressService.ts:164-167`); the player shows an inline toast and keeps
  going (`LessonPlayer.tsx:276-278`). XP cross-check survives because per-check XP is a
  separate `increment()` write and completion XP is recomputed server-side from the live
  profile (`habitService.ts:178-181`), not from a possibly-lost attempt.
- **AC 9 — Completion recorded server-side.** ✅ `markLessonCompleted` sets the server
  state on the final Continue (`LessonPlayer.tsx:335`), gated so the celebration is not
  shown on a failed write (`:336-340`, matches §9.3 AC 10).
- **Determinism unit tests.** ✅ `selectVariant.test.ts` covers same-input stability,
  range, attempt-variation, and rough uniformity.
- **Engineering hygiene.** ✅ `xpEarnedThisAttempt` uses `increment()` (`:154`) rather than
  read-modify-write, eliminating lost-update races across multiple checks in one attempt.
  `advanceSlot` is explicitly monotonic (`:183`).

---

## 3. What's missing / incomplete

- **The feature's own rules tests do not exist.** `firebase/firestore.rules.test.ts`
  only exercises the *Phase-2* subcollections (`learnerModel`, `practiceState`,
  `practiceXp`). There is **no** emulator test for `lessonProgress` or `stepAttempts` —
  none of the abuse-cap rejection, append-only enforcement, cross-user denial, or field
  validation that `spec-progress-persistence.md` §"Test plan" (lines 118-127) explicitly
  enumerates. The "1083/1083 incl. rules tests" headline is real but does **not** cover
  the security-critical surface of this feature. (P0 for confidence; see §4.)
- **No field allowlist / size cap on `stepAttempts`.** The create rule (`:59-67`) validates
  three fields by type but omits `keys().hasOnly([...])` and any cap on `answerPayload`.
  Compare the much stricter `feedback` (`:201-203`) and `notifications` (`:104-106`) rules.
- **No validation on `lessonProgress` writes at all** (`:54`). `state`, `slotIndex`,
  `attemptId`, `xpEarnedThisAttempt`, `completedAt` are all client-trusted.
- **The append-only log has no reader.** `data-schema.md:125` states "Readers: none in MVP."
  Confirmed: the only reference to the `stepAttempts` collection in `src/` is the writer
  (`progressService.ts:46`). The learner model's lesson-exposure recorder
  (`learnerModelService.ts:69-89 recordLessonExposure`) and `buildReportCard`
  (`learnerModel.ts:437`) exist and are unit-tested but have **no production caller** — see
  the learning-science note (§6).
- **Dead parameter.** `recordAttempt`'s `nextSlotIndex` branch (`:121`, `:157-159`) is never
  exercised: the player advances the slot through `advanceSlot` on Continue, never via
  `recordAttempt`. Harmless but misleading.
- **`createdAt` not server-pinned in rules.** Unlike `feedback`/`notifications`
  (`createdAt == request.time`), `stepAttempts.createdAt` is accepted as-is, so a client can
  backdate log entries — relevant once Phase-3 analytics mine the log chronologically.

---

## 4. Bugs & risks (file:line, P0/P1/P2)

### P0 — Security-critical rules / coverage

- **P0-A · No automated coverage of this feature's security rules.**
  `firebase/firestore.rules.test.ts` covers only `learnerModel`/`practiceState`/`practiceXp`.
  The privacy guarantee (AC 5), the abuse cap (AC 6), and append-only (AC 4) are
  **unverified by tests**. A future rules edit could silently break owner-scoping or the cap
  with a green suite. *Fix: add emulator tests per the spec test plan (cross-user deny,
  `attemptNumber:11` deny, update/delete deny).* Files: `firestore.rules:53-69`,
  `firestore.rules.test.ts` (no relevant `describe`).

- **P0-B · The "abuse cap" does not actually cap writes.** `firestore.rules:61-63` only
  bounds the *client-supplied integer* `attemptNumber` to 1–10. It does **not** count
  existing docs, so an adversarial client can write unlimited `stepAttempts` by always
  sending `attemptNumber: 1`. D54's stated threat model — "a runaway client (or hostile
  script) could write thousands of attempts before billing notices" — is **not** mitigated.
  D54 acknowledges "per-create-call, not per-window," but even per-call the rule caps a value,
  not a volume. As the *only* abuse defense in MVP this is a meaningful gap. *Fix options:
  document explicitly as cosmetic-only, or enforce a real ceiling (e.g. reject when the
  matching slot already has N attempts — requires a counter doc, since rules can't `count()`
  a subcollection cheaply).*

- **P0-C · No `keys().hasOnly` / size cap on `stepAttempts.create`** (`firestore.rules:59-67`).
  A client may attach arbitrary extra fields and an unbounded `answerPayload` map, turning
  the per-user log into cheap arbitrary storage (amplifies P0-B). *Fix: add a strict
  `keys().hasOnly([...])` and a size bound on `answerPayload`, mirroring the `feedback` rule.*

### P1 — Correctness / AC contradictions

- **P1-A · The abuse cap is not silent (violates AC 6).** When a learner reaches an 11th
  attempt on one slot, `recordAttempt` sends `attemptNumber: 11`
  (`useSlotState.ts:24-26` increments per WRONG; `LessonPlayer.tsx:236`), the rule rejects
  the batch, and the player surfaces `"We could not save your answer. Check your connection."`
  (`LessonPlayer.tsx:276-278`, `errors.ts:73`). AC 9.2.6 requires the cap be *silent*. This
  is reachable in normal play: §9.3 AC 4 (D55 "no bail-out") **forces** the learner to keep
  retrying until correct, so a genuinely stuck learner on a hard fill-fraction/grid slot can
  exceed 10 and then sees a misleading "connection" error on every further wrong tap. The
  client cannot distinguish a cap rejection (`permission-denied`) from a transient network
  failure. *Fix: detect `permission-denied` from a cap rejection and suppress the toast (or
  raise/remove the cap given D55).* Files: `firestore.rules:61-63`, `LessonPlayer.tsx:265-278`.

- **P1-B · `lessonProgress` writes are entirely unvalidated** (`firestore.rules:54`). A user
  can `setDoc` `state:'completed'` (faking AC 9 completion server-side without finishing),
  jump `slotIndex` to skip content, or write any `attemptId`. Impact is *self-scoped* (own
  doc only), so it is not cross-user PII leakage, but it undermines "completion is recorded
  server-side" as a trustworthy signal and any future analytics built on these docs. The
  inflated `xpEarnedThisAttempt` only affects the **celebration display number**
  (`LessonPlayer.tsx:342-344`), not persisted XP (`habitService.ts:178-181` recomputes from
  the live profile), so XP/leaderboard integrity is *not* directly exposed here — but the
  posture is inconsistent with the locked-down `users`/`feedback` rules. *Fix: allowlist keys
  and constrain `state`, `slotIndex >= 0`, `xpEarnedThisAttempt >= 0`.*

### P2 — Races / minor correctness

- **P2-A · Local view advances even when `advanceSlot` write fails.** In `handleContinue`,
  `setViewSlotIndex(nextIndex)` runs unconditionally after the await
  (`LessonPlayer.tsx:438-445`) regardless of `advanced.ok`. On a failed write the toast shows
  but the UI still moves forward; on reload the learner resumes at the older `slotIndex` and
  re-does a concept/wrap step. Minor, non-destructive (the next successful write reconciles),
  but technically the optimistic local state diverges from server state.

- **P2-B · `getOrCreateProgress` is a non-atomic read-then-write** (`progressService.ts:67-86`).
  Two devices/tabs opening a never-started lesson simultaneously can both see "not exists" and
  both `setDoc` a fresh doc, last-write-wins clobbering a concurrent advance back to
  `slotIndex:0`. Window is tiny (first simultaneous open only) and the gate that renders
  problem slots only after the doc exists (`LessonPlayer.tsx:559-571`) prevents the worse
  variant-write race, but a `runTransaction` or create-if-absent would close it. (Tracked in
  spirit by I010 — two-tab behavior undefined.)

- **P2-C · Completion XP read can lag the last `increment`.** `xpEarnedThisAttempt` is read
  from the React snapshot (`LessonPlayer.tsx:342-343`), which may not yet reflect the final
  correct check's `increment()` write. This only skews the **celebration's displayed total**
  (persisted XP is recomputed in `habitService`), so it is cosmetic, but the number shown can
  occasionally undercount on a slow snapshot.

- **P2-D · Cross-device mid-slot jump.** Device B sitting on a slot will be yanked to the
  leading edge if device A advances (`Math.max(prev, slotIndex)`, `:167-170`). Acceptable per
  D52/I010 but worth a UX note.

---

## 5. Pros / Cons

**Pros**
- Clean two-doc separation (mutable resume vs immutable log) — exactly D14, and the log is a
  genuine append-only audit trail by rule.
- Variant determinism is excellent: the seed-based selection means resume is correct *even if
  the `selectedVariantIds` write was never persisted*, making the map a cache rather than a
  correctness dependency. Stable hash (`Math.imul>>>0`) is the right choice.
- Feedback-never-blocks is implemented correctly and deliberately (verdict dispatched before
  the await; attempt values snapshotted first).
- Services return typed `{ok}` results and never throw into the UI; XP uses `increment()` to
  avoid lost updates; `advanceSlot` is monotonic.
- Live `onSnapshot` exceeds the one-refresh sync contract.

**Cons**
- The security rules for *this* feature are the least-tested and least-validated in the
  ruleset, despite being the highest-stakes (privacy + append-only + abuse cap). Several
  hardening patterns already used elsewhere (`keys().hasOnly`, size caps, `createdAt ==
  request.time`) are absent here.
- The abuse cap is effectively cosmetic against an adversary and yet user-visible (as an
  error toast) against a legitimately-stuck learner — the worst of both.
- The append-only log is write-only; nothing consumes the durable first-attempt signal it was
  designed to provide (see §6).
- A few optimistic-state / non-atomic-create races that are individually minor but collectively
  represent the "data layer vs UI state" seam that I010 flags as undefined.

---

## 6. Learning-science note — does the append-only log feed the learner model as a first-attempt signal?

**Short answer: not today.** The mechanism exists in two correct halves that are not joined.

1. **The durable signal lives in `stepAttempts`.** Every Check writes `attemptNumber` +
   `wasCorrect` (`progressService.ts:140-149`), so "was this slot correct on the *first* try"
   is fully recoverable from the log (`attemptNumber === 1 && wasCorrect`). This is the
   pedagogically meaningful signal: first-attempt accuracy is the cleanest proxy for prior
   knowledge / retrieval strength, uncontaminated by the D55 "keep trying until correct" loop
   (which guarantees *every* slot eventually reads as correct, so only the *first* attempt
   carries information).

2. **The learner model wants exactly that signal but is fed from elsewhere — or not at all.**
   `learnerModel.ts` cleanly separates Engine A (practice Elo) from Engine B
   (`applyLessonExposure`, lesson first-try exposure that *never* moves Elo) and
   `buildReportCard(lessonId, SlotFirstTry[])` (`:437`). Both are unit-tested and take a
   `firstTryCorrect` boolean. **But neither has a production caller** — `recordLessonExposure`
   (`learnerModelService.ts:69`) and `buildReportCard` appear only in their definitions and
   tests; the `LessonPlayer` does not invoke them. The player *does* track first-try signals
   in ephemeral refs (`allFirstTryRef`/`hadComebackRef`, `LessonPlayer.tsx:127-128`,
   `:246-250`) but uses them only for session achievements, then discards them.

**Consequences for the learner model / report card:**
- The first-attempt signal is currently **derived from in-session React state**, not from the
  durable log. If the `stepAttempts` write fails (AC 8 path) or the learner switches devices
  mid-lesson, the in-session signal is whatever that tab observed — the authoritative log is
  never reconciled against it.
- Because nothing mines `stepAttempts`, the report card / learner model cannot be regenerated
  after the fact, cannot be corrected if a session was interrupted, and cannot benefit from the
  cross-device durability the log was built to provide (D14's "free Phase-3 seed data").

**Recommendation (pedagogy):** wire the lesson's first-attempt outcome into Engine B at the
point of truth. Either (a) call `recordLessonExposure` from the lesson flow keyed off
`attemptNumber === 1` per slot's *first* `stepAttempt`, or (b) have the report card / exposure
recorder read back the `stepAttempts` log (filtered to the current `attemptId`) so the
first-attempt signal is sourced from the durable append-only record rather than ephemeral UI
state. This is the difference between "we logged it" and "the learner model learned from it."

---

## 7. Prioritized recommendations

1. **(P0) Add the missing emulator rules tests for this feature.** Cross-user read/write deny
   on both subcollections; `attemptNumber:11` create deny; `update`/`delete` deny on
   `stepAttempts`. The spec already specifies them (`spec-progress-persistence.md:118-127`);
   they simply were not implemented. This protects every other recommendation from regression.
2. **(P0) Harden the `stepAttempts.create` rule:** add `keys().hasOnly([...])`, cap
   `answerPayload` size, and pin `createdAt == request.time`. Decide consciously whether the
   abuse cap should remain a value-check (then document it as cosmetic) or become a real
   volume ceiling.
3. **(P1) Make the abuse cap silent (AC 6):** in `handleCheck`, distinguish a
   `permission-denied` rejection from a transient failure and suppress the save-answer toast —
   or, given D55's forced retries, raise/remove the cap. Today a stuck learner sees a false
   "check your connection" error.
4. **(P1) Add a field allowlist + bounds to the `lessonProgress` write rule** so `state`,
   `slotIndex`, and `completedAt` can't be forged client-side; keeps "completion recorded
   server-side" trustworthy.
5. **(P1, pedagogy) Join the log to the learner model.** Wire first-attempt outcomes into
   `recordLessonExposure` / `buildReportCard`, ideally sourced from the durable `stepAttempts`
   log rather than ephemeral session refs (see §6).
6. **(P2) Tighten the UI/data seam:** only advance `viewSlotIndex` after `advanceSlot`
   succeeds (or reconcile on failure); make `getOrCreateProgress` create-if-absent via a
   transaction; read completion XP from the server write rather than the lagging snapshot.
7. **(P2) Remove the dead `nextSlotIndex` branch** in `recordAttempt` (`progressService.ts:121`,
   `:157-159`) to avoid implying a second slot-advance path.

---

## Executive summary

- **Solid core.** The two-doc model (D14), append-only log (rule-enforced
  `update/delete:false`, `firestore.rules:68`), deterministic FNV-1a variant seeding, live
  `onSnapshot` sync, and "feedback before persistence" are all implemented correctly; ACs 1,
  2, 3, 4, 7, 8, 9 hold in code.
- **Standout strength:** resume is correct *even if the variant-selection write is lost*,
  because the seed `uid|lessonId|attemptId|slotId` deterministically recomputes the same
  variant (`selectVariant.ts:40-47`) — the stored map is a cache, not a correctness dependency.
- **Most severe security concern (P0): the abuse cap doesn't cap writes.**
  `firestore.rules:61-63` only bounds the client-supplied `attemptNumber` value (1–10), so a
  hostile client sending `attemptNumber:1` can write unbounded `stepAttempts` — defeating the
  exact runaway/billing threat D54 cites. Compounded by no `keys().hasOnly`/size cap on the
  create rule (`firestore.rules:59-67`), making the log abusable as arbitrary storage.
- **Coverage gap (P0):** `firebase/firestore.rules.test.ts` tests only the Phase-2
  subcollections — there is **zero** emulator coverage of `lessonProgress`/`stepAttempts`
  privacy, the cap, or append-only, despite the spec listing those tests. "1083/1083 incl.
  rules tests" does not include this feature's security surface.
- **Most severe correctness bug (P1): the cap is not silent (violates AC 9.2.6).** A learner
  forced by D55 "no bail-out" to exceed 10 attempts triggers a rules rejection that surfaces as
  `"We could not save your answer. Check your connection."` (`LessonPlayer.tsx:276-278`,
  `errors.ts:73`) — a misleading error on every subsequent wrong tap.
- **Unvalidated resume doc (P1):** `lessonProgress` has no field allowlist
  (`firestore.rules:54`); a client can self-set `state:'completed'` or skip `slotIndex`.
  Self-scoped only (persisted XP is recomputed server-side in `habitService`, so leaderboard
  integrity is *not* directly exposed), but it weakens "completion recorded server-side."
- **Learning-science gap:** the append-only log is **write-only** — `stepAttempts` has no
  reader (`data-schema.md:125`; confirmed in `src/`). The first-attempt signal that should feed
  the learner model is computed from ephemeral session refs, and the purpose-built
  `recordLessonExposure`/`buildReportCard` are unit-tested but **never called in production**.
  The log is captured but not learned from.
- **Minor races (P2):** local `viewSlotIndex` advances even on a failed `advanceSlot` write
  (`LessonPlayer.tsx:438-445`); `getOrCreateProgress` is a non-atomic read-then-write
  (`progressService.ts:67-86`); completion XP is read from a possibly-stale snapshot.
- **Top improvement:** add the missing emulator rules tests *and* turn the value-only abuse cap
  into a real, silent quota (or document it honestly) — that single pairing closes the largest
  security gap and the most user-visible correctness bug at once.
