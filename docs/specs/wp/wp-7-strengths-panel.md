# WP-7 — Strengths / growth panel (Progress + Profile)

> **Type:** UI. **Depends on:** WP-5 (`subscribeLearnerModel`, `LearnerModel`), WP-T (component-test harness). **Blocks:** nothing. **Server/AI:** no.
>
> Read-only visualization of the learner model so adaptation is visible. Fully parallelizable once WP-5's read API exists.

## Goal

Show the learner their top strengths and growth areas. Per the two-engine model (README #7), distinguish **Practiced** skills (Engine A — `skills`/`weakestSkills`/`strongestSkills`, the mastery Elo) from **Introduced** skills (Engine B — `exposure`, met in lessons but not yet practiced). Surface on the Profile page and unlock the currently-locked `/progress` page for the fuller view.

## Files

- **Add** `src/features/learner/StrengthsPanel.tsx` — given a `LearnerModel`, render three groups:
  - **Strong (practiced):** top 2-3 of `strongestSkills` (Engine A) with a 0-3 mastery pip derived from `recentCorrect` (NOT raw Elo numbers).
  - **Keep working on (practiced):** top 2-3 of `weakestSkills` (Engine A).
  - **Introduced (from lessons, not yet practiced):** skills present in `exposure` but absent from `skills` (Engine A) — labelled as "met in lessons, try practice"; flag those with `lessonFirstTryStruggles > 0` as gentle "worth a practice" *invitations* (never gates).
  - Empty state when neither engine has data ("Do a lesson or some practice to see your strengths").
- **Add** `src/features/learner/useLearnerModel.ts` — thin hook wrapping `subscribeLearnerModel(uid, cb)` -> `{ model, loading }`.
- **Edit** `src/features/progress/ProgressPage.tsx` — replace the locked stub content with `StrengthsPanel` (+ keep the page's existing shell/heading).
- **Edit** `src/components/AppShell.tsx` — remove `locked: true` from the `/progress` nav entry.
- **Edit** the Profile page (`src/features/profile/ProfileBody.tsx` or equivalent) — add a compact `StrengthsPanel` section (reuse the same component, maybe a `compact` prop).

## Steps (loop until green)

1. Build `useLearnerModel` (subscribe + loading state; unsubscribe on unmount).
2. Build `StrengthsPanel` (pure presentational given a model + loading): shaped skeleton while loading (match the app's skeleton convention), empty state when `model` is null or has no skills, else two columns/sections (Strengths / Keep working on) listing labels + pips.
3. Unlock `/progress`; render the panel there with the page's standard header.
4. Add the compact panel to Profile.
5. `npm run typecheck`; `npm run build`; manual check both surfaces render with and without data.

## Test plan / Definition of Done

- With a model containing several PRACTICED skills, the panel lists the correct top-3 weakest and strongest from the Engine-A arrays.
- A skill present only in `exposure` (lessons) shows under **Introduced**, NOT under Strong/Keep-working-on (those are practiced/Engine-A only).
- Mastery pips derive from `recentCorrect` (e.g. <0.4 -> 1 pip, 0.4-0.7 -> 2, >0.7 -> 3); no raw Elo number shown.
- Empty/loading states render (no flash of empty content).
- `/progress` is no longer locked; Profile shows the compact panel.
- A **React Testing Library** component test (via WP-T harness) feeds a sample `LearnerModel` and asserts the three groups render with the right labels.
- `npm run typecheck` + `npm run build` clean.

## Boundaries (do NOT touch)

- Do not write to the learner model here (read-only surface).
- Do not show raw ratings or pseudo-scientific numbers — labels + pips only.
- Do not add public/social exposure of strengths (private only).
- No AI.
