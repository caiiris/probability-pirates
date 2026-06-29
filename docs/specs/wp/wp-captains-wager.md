# Work Packages — Captain's Wager

> Parallelizable build units for [`../spec-captains-wager.md`](../spec-captains-wager.md). Same rule as the existing WP batches: **build against the frozen contracts in §A, never against a sibling WP's internals.** Each WP ends with `npm run typecheck` + its tests green; UI WPs also `npm run build` clean. The app stays deployable after each WP.
>
> Each WP has the shape: **Goal → Files → Steps → Definition of Done → Boundaries (do NOT touch).**
>
> Companion: [`wp-contracts.md`](wp-contracts.md) (Phase-2 contracts — wager doesn't change them, only adds), [`spec-captains-wager`](../spec-captains-wager.md) (full design with D-CW1..10).

---

## A. Frozen contracts (freeze BEFORE any WP starts)

### C-W1 — TypeScript types (owned by WP-CW-A)
File: `src/features/wager/types.ts`

```ts
export type WagerFlavor = 'frequency' | 'combinatorics' | 'counterintuition' | 'bayesian';
export type WagerUnit = 'percent' | 'count' | 'fraction';
export type WagerScoring = 'log' | 'abs';
export type WagerStatus = 'live' | 'archived';

/** Public-readable. Anyone authenticated can read. */
export type Wager = {
  id: string;                 // slug, e.g. "2026-06-27-birthdays"
  sequence: number;           // 1, 2, 3, ... (for "Wager #14")
  openAt: number;             // Firestore Timestamp -> ms
  prompt: string;
  unit: WagerUnit;
  tags: string[];
  flavor: WagerFlavor;
  scoring: WagerScoring;
  relatedLessonId?: string;
  status: WagerStatus;
  createdBy: 'system';        // 'community' reserved for future
};

/** Gated: readable only AFTER the user has a submission for this wager. */
export type WagerAnswer = {
  trueAnswer: number;
  source: string;
  sourceUrl?: string;
  revealHeadline: string;
  revealExplanation: string;  // 2-3 sentences, the teach-back
  revealWorked?: string;      // optional fuller derivation
};

/** Per-user, one-shot. */
export type WagerSubmission = {
  uid: string;
  guess: number;
  logError: number;           // computed client-side at submit (see C-W2)
  score: number;              // 0-100 (see C-W2)
  submittedAt: number;
};

/** Denormalized per-user summary at /users/{uid}/wagerStats/summary. */
export type WagerStats = {
  totalSubmitted: number;
  averageScore: number;
  averageLogError: number;
  lastWagerId?: string;
  last10Scores: number[];     // for the personal calibration sparkline
};

export type HistogramBucket = {
  /** log10 lower bound (for log scoring) or absolute lower bound (for abs). */
  lo: number;
  /** log10 upper bound (for log scoring) or absolute upper bound (for abs). */
  hi: number;
  count: number;
};

export type Histogram = {
  buckets: HistogramBucket[];
  n: number;                  // total submissions
  scoring: WagerScoring;      // matches the source wager
};
```

### C-W2 — Pure helpers (owned by WP-CW-B, consumed by WP-CW-D + WP-CW-G)
Files: `src/features/wager/scoring.ts`, `src/features/wager/binning.ts`

```ts
/** Score formula from spec §5. Symmetric (sign of error doesn't matter). */
export function computeWagerScore(
  guess: number,
  trueAnswer: number,
  scoring: WagerScoring,
): { logError: number; score: number };
// 'log' branch:  logError = |log10(guess) - log10(trueAnswer)|; score = max(0, round(100 * max(0, 1 - logError)))
// 'abs' branch:  logError = |guess - trueAnswer|; score = max(0, round(100 * max(0, 1 - (logError / max(trueAnswer, 0.01) * 0.5))))
// guess <= 0 in 'log' branch  → score 0, logError = Infinity (encoded as a large finite sentinel in storage; helper returns Infinity)

/** ~20 log-spaced buckets covering the submitted range, with the true answer guaranteed to fall on a bucket boundary. */
export function binSubmissions(
  submissions: Pick<WagerSubmission, 'guess'>[],
  trueAnswer: number,
  scoring: WagerScoring,
): HistogramBucket[];

/** What fraction of submissions had a strictly larger logError than the user's. */
export function percentileBeaten(
  submissions: Pick<WagerSubmission, 'logError'>[],
  userLogError: number,
): number; // in [0, 1]; suppress the callout below HISTOGRAM_MIN_N

export const HISTOGRAM_MIN_N = 20;
```

### C-W3 — XP policy (owned by WP-CW-D)
Wager XP is small, separate from lesson XP, and routed through the existing habit XP write path:

```ts
// src/features/wager/wagerXp.ts (new)
export function wagerXpForScore(score: number): number; // 5 base + 5 if score>=50 + 10 if score>=80, total 5-20
```

**Wager XP is granted by the existing `grantPracticeXp`-style helper** (allowlisted `xp`/`weeklyXp`/`weekKey` write — D-AS1, R3 in `wp/README.md`). Do NOT invent a new write path; **do NOT** touch the streak counter.

### C-W4 — Firestore data model (owned by WP-CW-C, consumed by WP-CW-D)
```
/wagers/{wagerId}                          (public read)
/wagers/{wagerId}/private/answer            (gated read via exists() on own submission)
/wagers/{wagerId}/submissions/{uid}         (gated read via exists() on own submission; create-only + one-time score-patch)
/users/{uid}/wagerStats/summary             (owner read/write only)
```

Submission shape is exactly `WagerSubmission` (C-W1). The `exists()`-based gating is the lock that makes "no peeking" enforceable in rules; it's also why scoring is client-computed but the answer doc is server-of-record.

**C-W4.5 — Relaxed submission update rule (two-step submit flow):**
The submission subcollection allows a one-time score-patch update from placeholder state. Rule conditions:
- `request.auth.uid == uid` (owner only)
- `resource.data.score == 0 && resource.data.logError == 0` (placeholder guard — both fields must be 0)
- `affectedKeys().hasOnly(['score', 'logError'])` (only these two may change)
- `uid`, `guess`, and `submittedAt` must remain unchanged
- Both updated fields must be `is number`

This gate closes permanently once either `score` or `logError` is non-zero, making the patch idempotent and the `guess` commitment immutable. See D-CW11 in the spec.

### C-W5 — Service layer hooks (owned by WP-CW-D, consumed by WP-CW-E/F/G/H)
File: `src/features/wager/wagerService.ts`

```ts
/** Realtime list of live wagers, newest first. */
export function useLiveWagers(): { wagers: Wager[]; loading: boolean };

/** Single wager by id. */
export function useWagerById(id: string): { wager: Wager | null; loading: boolean };

/** The current user's submission for a wager, or null if not yet submitted.
 *  Optional `scoring` param: when provided and submission is in placeholder state
 *  (score=0, logError=0), auto-calls ensureSubmissionScored to self-heal. */
export function useUserSubmission(uid: string | null, wagerId: string, scoring?: WagerScoring):
  { submission: WagerSubmission | null; loading: boolean };

/** Other users' submissions for a wager — gated; returns null until the user has submitted. */
export function useWagerSubmissions(uid: string | null, wagerId: string):
  { submissions: WagerSubmission[] | null; loading: boolean };

/** The wager's answer doc — gated; returns null until the user has submitted. */
export function useWagerAnswer(uid: string | null, wagerId: string):
  { answer: WagerAnswer | null; loading: boolean };

/** Submit a wager. Resolves with the persisted submission; rejects on duplicate. */
export function submitWager(input: {
  uid: string;
  wagerId: string;
  guess: number;
  scoring: WagerScoring;
}): Promise<WagerSubmission>;
// Two-step flow (D-CW11):
//   1. setDoc placeholder { uid, guess, logError: 0, score: 0, submittedAt }.
//   2. getDoc /wagers/{id}/private/answer (now unlocked by the exists() gate).
//   3. computeWagerScore(guess, trueAnswer, scoring).
//   4. runTransaction: txn.update submission { logError, score } + set stats + update XP.
// If step 4 fails, useUserSubmission self-heals via ensureSubmissionScored.
// trueAnswer is resolved internally — callers do NOT pass it.

/** Denormalized user wager summary. */
export function useWagerStats(uid: string | null):
  { stats: WagerStats | null; loading: boolean };

/**
 * Idempotent self-healer. Reads the submission; if score===0 && logError===0,
 * reads the answer doc and patches score+logError in a transaction.
 * No-op if submission is already scored, missing, or the answer doc is missing.
 * Called automatically by useUserSubmission. Also exported for direct testing.
 */
export async function ensureSubmissionScored(input: {
  uid: string;
  wagerId: string;
  scoring: WagerScoring;
}): Promise<void>;
```

**Implementation note:** the user MUST NOT be able to read the answer or other submissions until their own submission is written. Service implementation reads in the correct order (submit → then read answer + others) and is **NOT** allowed to circumvent the rules client-side (would just fail; the rules are the actual gate).

### C-W6 — Sub-component props (owned by WP-CW-G; consumed by reveal screen)
```ts
type WagerHistogramProps = {
  bins: HistogramBucket[];
  userGuess: number;
  trueAnswer: number;
  scoring: WagerScoring;
  unit: WagerUnit;
  n: number;                       // total submissions
  className?: string;
};

type WagerSparklineProps = {
  scores: number[];                // 0-100, oldest to newest, up to 10
  className?: string;
};
```

### C-W7 — Content schema (owned by WP-CW-A, consumed by WP-CW-I)
Files: `src/content/wagers/{id}.json` — one JSON per wager. Shape matches `Wager` (C-W1) flat-merged with `WagerAnswer` (i.e. authoring is one file; the data is split into two Firestore docs at deploy time):

```jsonc
// src/content/wagers/2026-06-27-birthdays.json
{
  "id": "2026-06-27-birthdays",
  "sequence": 1,
  "openAt": "2026-06-27T00:00:00Z",   // ISO string in source; converted to ms on deploy
  "prompt": "In a group of 23 randomly chosen people, what is the probability that at least two share a birthday?",
  "unit": "percent",
  "tags": ["birthday-paradox", "combinatorics"],
  "flavor": "counterintuition",
  "scoring": "log",
  "relatedLessonId": "conditional-probability",
  "status": "live",
  "trueAnswer": 50.7,
  "source": "Standard birthday-paradox calculation; see e.g. Grimstead & Snell §3.1",
  "revealHeadline": "It's the birthday paradox.",
  "revealExplanation": "Pairs grow combinatorially, not linearly. In a group of 23 there are C(23,2)=253 pairs, each with a ~1/365 chance of matching. The intuition error: people anchor on '23 out of 365' and miss the pair multiplication."
}
```

Validator: `scripts/wager-validate.ts` walks `src/content/wagers/*.json`, enforces required fields, sanity-checks `trueAnswer > 0` for `log` scoring, asserts `revealExplanation` non-empty, and prints a per-file pass/fail.

---

## B. Work packages

### WP-CW-A — Contracts: types, content schema, validator *(freezes C-W1, C-W7)*
- **Goal:** drop the TypeScript types from §A and the content validator script. Nothing else depends on a sibling WP yet — A unblocks the whole tree.
- **Files:**
  - `src/features/wager/types.ts` (new) — exactly the types in C-W1.
  - `src/features/wager/constants.ts` (new) — `HISTOGRAM_MIN_N = 20`, `WAGER_CADENCE_DAYS = 3` (advisory, not enforced in code).
  - `scripts/wager-validate.ts` (new) — Node script: walks `src/content/wagers/*.json`, validates, exits non-zero on any failure. No deps beyond `fs`/`path`.
  - `src/content/wagers/.gitkeep` (new dir).
  - `package.json` — add `"wager:validate": "tsx scripts/wager-validate.ts"`.
- **Steps:** write types → write validator → run validator over zero files (passes trivially) → typecheck.
- **DoD:** `npm run typecheck` green; `npm run wager:validate` exits 0 with empty content dir; types importable from `@/features/wager/types`.
- **Boundaries:** do NOT create any service hooks, components, or Firestore rules. **Only** types + validator + dirs.
- **Parallel-safe with:** every other WP after merge. Must merge **first**.

### WP-CW-B — Pure helpers: scoring + binning *(freezes C-W2)*
- **Goal:** the math the rest of the feature depends on, in pure functions with comprehensive unit tests.
- **Files:**
  - `src/features/wager/scoring.ts` (new) — `computeWagerScore`.
  - `src/features/wager/binning.ts` (new) — `binSubmissions`, `percentileBeaten`.
  - `src/features/wager/scoring.test.ts` — exact, 2×, 10× off (log), abs-branch near zero, guess ≤ 0 sentinel, identical-guess edge.
  - `src/features/wager/binning.test.ts` — deterministic seed: 100 random log-normal guesses bin to the expected shape; true-answer falls on a boundary; `percentileBeaten` returns 0 / 1 / 0.5 edge cases; below `HISTOGRAM_MIN_N` the caller (not helper) is responsible for suppression — helper still computes.
- **Steps:** implement scoring with the two branches from C-W2 → unit tests (table-driven) → implement binning with log-spaced buckets, edges aligned to the true answer → tests → `percentileBeaten`.
- **DoD:** ≥ 95% coverage of the two files; all tests green; `npm run typecheck` green.
- **Boundaries:** **pure** — no React, no Firebase, no `Date.now()`, no `Math.random()` (tests pass a seeded RNG if needed). Does not import from `wagerService`. Imports only types from C-W1.
- **Parallel-safe with:** every WP after WP-CW-A merges.

### WP-CW-C — Firestore rules + emulator tests *(freezes C-W4)*
- **Goal:** the security rules that make the gating work, with emulator-suite tests verifying every gate.
- **Files:**
  - `firebase/firestore.rules` — add the `/wagers/...` and `/users/{uid}/wagerStats/...` blocks per spec §7.
  - `firebase/rules-tests/wagers.test.ts` (new) — emulator-suite tests (matches `notifications.test.ts` pattern):
    - public can read `/wagers/{id}` (auth required)
    - public **cannot** read `/wagers/{id}/private/answer` until they have a submission
    - public **cannot** read `/wagers/{id}/submissions/{other}` until they have their own
    - submission `create` works once; second `create` is rejected; `update`/`delete` rejected
    - submission must have exactly the C-W1 keys; extra fields rejected
    - `/users/{uid}/wagerStats/summary` is owner read/write only
- **Steps:** add rules → write the test cases (one `describe` per gate) → run emulator suite → green.
- **DoD:** every gate has at least one positive + one negative test; emulator tests green in CI.
- **Boundaries:** do NOT add `community` createdBy rules (that's W3). Do NOT touch any other rule block.
- **Parallel-safe with:** A, B, H, I (everything except D which writes against these rules — sequence D after C lands).

### WP-CW-D — Service layer *(freezes C-W5; depends on C-W1, C-W2, C-W4, existing XP write path)*
- **Goal:** the hooks and the `submitWager` mutator from C-W5. Mirrors the structure of `notificationsService.ts`.
- **Files:**
  - `src/features/wager/wagerService.ts` (new) — hooks + `submitWager` + `ensureSubmissionScored`. Use `onSnapshot` for the realtime hooks. The "gated" hooks short-circuit to `null` when no submission exists for the current user.
  - `src/features/wager/wagerXp.ts` (new) — the small XP formula from C-W3.
  - `src/features/wager/wagerService.test.ts` (Vitest, with `@firebase/rules-unit-testing`):
    - `submitWager` step 1 writes a placeholder (score=0, logError=0) via `setDoc`.
    - `submitWager` step 4 patches submission with real score+logError in a transaction.
    - `submitWager` resolves with the final `WagerSubmission` (real score, not placeholder).
    - `submitWager` on a non-positive guess produces `score:0, logError:9999`.
    - duplicate `submitWager` rejects with `{ code: 'AlreadySubmitted' }`.
    - `ensureSubmissionScored` patches a placeholder submission and is a no-op on a real one.
    - `useUserSubmission` with `scoring` arg auto-calls `ensureSubmissionScored` on placeholder.
    - `useUserSubmission` returns the submission after submit.
    - `useWagerAnswer` returns `null` before submit, returns the answer after.
    - `useWagerSubmissions` returns `null` before submit, returns the list after.
    - `useWagerStats.last10Scores` updates on a fresh submission.
- **Steps:** sketch the hooks (re-use the `onSnapshot` + `useEffect` pattern from `notificationsService`) → implement `submitWager` with two-step flow (C-W4.5 + D-CW11) → implement `ensureSubmissionScored` → wire self-heal into `useUserSubmission` with `useRef` guard → write tests.
- **Two-step submit flow (D-CW11):**
  1. Duplicate guard via `getDoc`.
  2. `setDoc` placeholder `{ uid, guess, logError: 0, score: 0, submittedAt }`.
  3. `getDoc` answer doc (now unlocked by the `exists()` gate).
  4. `computeWagerScore`; encode Infinity → 9999.
  5. `runTransaction`: `txn.update` submission `{ logError, score }` + `txn.set` stats + `txn.update` user XP.
  Stats are only updated in step 5 — not during the placeholder create.
- **DoD:** all tests green; typecheck + build green; existing app deploys without regression (no rule conflicts).
- **Boundaries:** do NOT write to a "global histogram" doc (that's a W3 optimization). Do NOT touch `learnerModel.ts` or `progressService.ts` — wager is a separate signal (D-CW8). Stats updates use the user's own write path, **not** the wager subcollection.
- **Depends on:** WP-CW-A (types), WP-CW-B (`computeWagerScore`), WP-CW-C (rules merged so emulator tests run).

### WP-CW-E — Wager list page + sidebar item + route
- **Goal:** the entry point at `/wager` — a list of wagers with status chips, plus sidebar wiring and an unread dot.
- **Files:**
  - `src/features/wager/WagerListPage.tsx` (new) — vertical list, latest at top. Each row: `Wager #14`, flavor tag, prompt preview, status chip (`Submit` / `Score 72` / `Archived`). Tapping a row navigates to `/wager/{id}` (the card screen — owned by E+F+G's sub-route handler).
  - `src/features/wager/WagerSidebarLink.tsx` (new) — sidebar nav item with an unread dot (live wagers the user hasn't submitted yet).
  - `src/App.tsx` — register `/wager` and `/wager/:id` routes.
  - `src/components/AppShell.tsx` — add `WagerSidebarLink` near the bottom of the existing sidebar, with the bottle/compass icon (use an existing Lucide icon — see Boundaries).
  - `src/features/wager/WagerListPage.test.tsx` — RTL: renders rows for live wagers; status chip reflects submission state; sidebar dot appears when there's an unsubmitted wager.
- **Steps:** list page + skeleton state → sidebar link with unread-dot derivation (`useLiveWagers` + `useUserSubmission` per wager — fine at low N) → route registration → tests.
- **Boundaries:** do **NOT** add a Home banner (D-CW7). Use an existing Lucide icon (e.g. `Sailboat`, `Anchor`, `Compass`, or `MessageCircleQuestion`) — no new SVG asset in this WP. Visual styling follows D55 (one-hero-per-page; list rows are NOT elevated). Coordinate the route paths with WP-CW-F/G — they own the `/wager/:id` screen.
- **Depends on:** WP-CW-D.
- **Parallel-safe with:** WP-CW-F, WP-CW-G, WP-CW-H (different files).

### WP-CW-F — Pre-submit wager card
- **Goal:** the screen at `/wager/:id` when the user has NOT yet submitted. Prompt, unit hint, numeric input, submit button, "How does this work?" link.
- **Files:**
  - `src/features/wager/WagerCardPreSubmit.tsx` (new) — receives `wager: Wager` + `onSubmit(guess: number)`. Pure: parent does the submit.
  - `src/features/wager/WagerExplainerDialog.tsx` (new) — small modal explaining the rules + scoring (one-time read; copy lives in this file).
  - `src/features/wager/WagerCardPage.tsx` (new) — the route handler at `/wager/:id` that picks between pre-submit (this WP) and reveal (WP-CW-G) based on `useUserSubmission`.
  - `src/features/wager/WagerCardPreSubmit.test.tsx` — RTL: empty → submit disabled; invalid number → submit disabled; valid number → submit fires `onSubmit` with parsed value.
- **Steps:** card layout (no histogram, no answer — peek-proof by construction since service gates the data) → number input with unit-suffix display → explainer dialog (re-use the `Dialog` primitive) → wire into `WagerCardPage` → tests.
- **Boundaries:** do NOT render anything from `useWagerAnswer` or `useWagerSubmissions` in this card — they'd return `null` anyway, but explicitly **don't subscribe** before submission (saves a wasted listener). Do NOT touch `WagerCardPage` once WP-CW-G is in flight — coordinate ownership of that file (this WP creates it; G adds the post-submit branch).
- **Depends on:** WP-CW-A (types), WP-CW-D (`submitWager`, `useUserSubmission`).
- **Parallel-safe with:** WP-CW-E (different files), WP-CW-G (coordinate `WagerCardPage`).

### WP-CW-G — Reveal card: histogram + sparkline + teach-back layout
- **Goal:** the screen at `/wager/:id` AFTER the user has submitted. Renders true answer, distribution histogram with the user's guess marked, "you beat X%" callout (suppressed below N=20), Captain Pascal teach-back with optional lesson link, and the personal calibration sparkline of the user's last 10 scores.
- **Files:**
  - `src/features/wager/WagerHistogram.tsx` (new) — presentational, props per C-W6. SVG (no chart library; ~80 LoC). Log-scaled x-axis when `scoring='log'`, linear when `'abs'`. User-guess marker = violet vertical line + dot at top; true-answer marker = green dashed line. Below `HISTOGRAM_MIN_N` the component renders an "empty histogram" placeholder, not a thin chart (the placeholder shape lives here).
  - `src/features/wager/WagerSparkline.tsx` (new) — presentational, props per C-W6. SVG (~40 LoC). Tiny inline line chart of last-10 scores with a trendline.
  - `src/features/wager/WagerCardReveal.tsx` (new) — receives `wager`, `submission`, `answer`, `submissions`, `stats`. Composes: header (true answer + source) → `WagerHistogram` → "you beat X%" pill → Captain Pascal teach-back card (with optional lesson link) → "Your calibration" mini-section with `WagerSparkline`.
  - `src/features/wager/WagerCardPage.tsx` — extend (created in WP-CW-F): post-submit branch renders `WagerCardReveal`.
  - Tests: `WagerHistogram.test.tsx` (RTL + snapshot of the SVG structure for a 5-bucket case), `WagerSparkline.test.tsx`, `WagerCardReveal.test.tsx` (RTL: assert answer renders, teach-back renders, "beat X%" suppressed below N=20, lesson link renders when `relatedLessonId` set, hidden when absent).
- **Steps:** Histogram (SVG axis, log-spaced ticks, marker rendering, placeholder branch) → tests → Sparkline → tests → Reveal layout (compose; pull the percentile from `percentileBeaten` C-W2; teach-back uses `revealHeadline` + `revealExplanation` from C-W1) → wire into `WagerCardPage` → tests.
- **Boundaries:** do NOT introduce a charting library (recharts/visx/etc.) — both components are simple enough that an SVG by hand is cleaner and zero-bundle-impact. Follow existing visual language: violet primary, green for "correct/true," coral for "wrong" if surfaced. Do NOT add a "share" button in MVP (post-W1 feature). Do NOT touch `WagerCardPreSubmit` (owned by F).
- **Depends on:** WP-CW-A (types), WP-CW-B (`percentileBeaten`, `binSubmissions`), WP-CW-D (`useWagerAnswer`, `useWagerSubmissions`, `useWagerStats`), WP-CW-F (the page shell).
- **Parallel-safe with:** WP-CW-E, WP-CW-H, WP-CW-I (different files / different concerns). Coordinate `WagerCardPage` ownership with WP-CW-F.

### WP-CW-H — Profile wager-stats subsection
- **Goal:** add a "Wagers" subsection to `/profile` showing `total submitted`, `average score`, and the last-10 calibration sparkline.
- **Files:**
  - `src/features/profile/ProfileBody.tsx` — add a `<Section>` (using the existing `elevated`-aware Section component — see D55) for wager stats. Reuse `WagerSparkline` from WP-CW-G.
  - Test: `ProfileBody.test.tsx` (existing test extended): with `wagerStats` mock, the section renders; without `wagerStats`, the section is hidden (no empty card on a brand-new account).
- **Steps:** read `useWagerStats(uid)` → render the section under the existing "Stats" / "Activity" rows, NOT elevated (per D55 — Profile already has its one elevated hero) → empty-state handling → test.
- **Boundaries:** do NOT add a badge or medallion (that's W4). Do NOT alter the existing Profile sections' content.
- **Depends on:** WP-CW-D (`useWagerStats`), WP-CW-G (`WagerSparkline`).
- **Parallel-safe with:** WP-CW-E, WP-CW-F, WP-CW-G (different files except for ProfileBody — but H is the only one editing it).

### WP-CW-I — Seed content (30 hand-authored wagers)
- **Goal:** the 30 launch wagers in `src/content/wagers/*.json`, validated by the WP-CW-A validator.
- **Files:** `src/content/wagers/{id}.json` × 30, following the C-W7 schema. Flavor mix: ~50% frequency, 20% combinatorics, 20% counterintuition, 10% bayesian (spec §4).
- **Steps:** per wager: pick concept → research a sourced answer → write prompt + teach-back → run `npm run wager:validate` → commit. **Each wager teach-back must name a specific probability concept** (per spec §10 quality bar).
- **DoD:** 30 wagers; `npm run wager:validate` green; `revealExplanation` non-empty on every file; flavors hit the target mix within ±2.
- **Boundaries:** do NOT alter the schema (that's A's contract). If a wager needs a field the schema doesn't have, surface it as an Open Question in §D of this doc.
- **Depends on:** WP-CW-A (validator + schema).
- **Parallel-safe with:** everything; this is content, not code.
- **Owner candidate:** a human author or a high-judgment LLM agent; either way, every wager goes through a quality review against the §10 bar before merging.

---

## C. Dependency waves

```
Wave 0 — freeze contracts §A (this doc).

Wave 1 (parallel):
  WP-CW-A (types/schema/validator)   ⟵ unblocks everyone; merge first
  WP-CW-B (pure helpers)             ⟵ no deps on A's content; safe in parallel
  WP-CW-C (firestore rules)          ⟵ safe in parallel

Wave 2 (after A + B + C merge):
  WP-CW-D (service layer)            ⟵ depends on A, B, C
  WP-CW-I (seed content)             ⟵ depends on A only; can also start in Wave 1

Wave 3 (after D):
  WP-CW-E (list + sidebar + route)
  WP-CW-F (pre-submit card + page shell)
  WP-CW-H (profile subsection)

Wave 4 (after F + G's components exist):
  WP-CW-G (reveal card)              ⟵ shares WagerCardPage with F; sequence F → G
```

**Single-agent path:** A → B → C → D → I (in parallel from Wave 1) → E → F → G → H.

**Practical parallelization for Sonnet runs:**
- Spawn A + B + C concurrently. ~1 hour each, no contention.
- After merge: D is the bottleneck single WP. Run it alone.
- Spawn E + F + H concurrently. ~1 hour each.
- G last (touches the page shell F set up).
- I anytime after A.

---

## D. Risks / open questions

- **R-W1 — `WagerCardPage` shared ownership (F + G).** F creates the file with a pre-submit branch; G extends it with a post-submit branch. Mitigation: F's PR lands with a `// TODO(WP-CW-G): post-submit branch` placeholder so G has a stable insertion point.
- **R-W2 — Histogram fetch cost at scale.** `useWagerSubmissions` reads every submission for the wager. Fine for the first months; needs pre-aggregation if a single wager crosses ~1000 submissions. Mitigation: tracked as a Phase-W3 follow-up in [`spec-captains-wager`](../spec-captains-wager.md) §13; not a launch blocker.
- **R-W3 — Client-authoritative score.** A determined user can write `score: 100`. Accepted because no rewards gate on it and the rest of the app is client-authoritative (D-AS1 et al.). Server-side scoring becomes mandatory if Wager outcomes ever drive social signaling (W3 trigger).
- **R-W4 — `openAt` timestamp authority.** Source files use ISO strings; deploy-time conversion to ms is in WP-CW-A's validator. Live wagers don't depend on real-time clocks ("opens at midnight") because the cadence is operator-driven (an admin marks a wager `status: 'live'` when ready), so timezone bugs don't break the loop. **OPEN if we add scheduled drops:** swap to Firestore `serverTimestamp` and a small `wager:publish` script.
- **R-W5 — `relatedLessonId` validity.** If a wager references a lessonId that doesn't exist (typo, lesson removed), the reveal teach-back link 404s. Mitigation: WP-CW-A's validator cross-checks `relatedLessonId` against the live `LESSONS` registry from `src/content/index.ts` — fails the file if the id doesn't resolve. Cheap because `src/content/index.ts` is the single source of truth.
- **R-W6 — Wager XP collides with the daily practice XP cap.** Wager XP goes through the same allowlisted `xp`/`weeklyXp` write as practice. The daily practice cap (D100) should NOT apply to wager XP (different loop). Mitigation: `wagerXpForScore` is small enough (max 20/wager, ~10/month) that even if it ends up under the same cap, it's a rounding error. If meaningful, add a separate `wagerXp`/`weeklyWagerXp` field per spec-future. **OPEN — owner to call** if Wager and Practice XP need to be distinguishable in user-facing tallies.
- **R-W7 — Cold start histogram suppression interacts with WP-CW-G's tests.** Below N=20 the histogram is replaced by a placeholder. Tests must explicitly cover both branches (N=15 → placeholder, N=25 → real histogram). Listed as an acceptance item in WP-CW-G's DoD.
- **R-W8 — C-W5 contract change: `trueAnswer` removed from `submitWager` input.** The original C-W5 spec included `trueAnswer: number` in `submitWager`'s input, expecting the caller to supply it. WP-CW-F discovered this is impossible because the answer doc is gated behind having a submission (circular dependency). Resolution: `submitWager` now resolves `trueAnswer` internally via the two-step flow (D-CW11) — callers pass only `{ uid, wagerId, guess, scoring }`. The frozen contract in §A C-W5 has been updated. WP-CW-E/F/G/H consumers must use the new signature. The `useUserSubmission` hook gains an optional `scoring?: WagerScoring` param for self-healing.
