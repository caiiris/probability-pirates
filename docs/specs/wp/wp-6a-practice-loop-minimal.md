# WP-6a — Minimal practice solve loop (one template, no adaptivity)

> **Type:** UI + integration. **Depends on:** WP-0 (checkAnswer in lib), WP-3 (engine), WP-4 (>= 1 template registered), WP-8 (rules — only if persisting; 6a can run with no writes). **Blocks:** WP-6b, WP-6c. **Server/AI:** no.
>
> The de-risking phase: get one problem generating, rendering, grading, and showing a worked solution end-to-end. No adaptivity, no XP, no learner-model write yet.

## Goal

Replace the locked Practice stub with a working, endless solve loop that serves problems from a single fixed template, reusing the existing interaction renderers and `checkAnswer`.

## Files

- **Rewrite** `src/features/practice/PracticePage.tsx` (currently the locked stub).
- **Add** `src/features/practice/PracticeSession.tsx` — the solve-loop component.
- **Add** `src/features/practice/InteractionDispatch.tsx` — maps `variant.interactionKind` -> renderer (mirror the switch in [`ProblemSlotView.tsx`](../../../src/features/lesson/ProblemSlotView.tsx), but standalone: it takes a `variant` + `InteractionProps`-style callbacks, with NO progress/Firestore).
- **Edit** `src/components/AppShell.tsx` — remove `locked: true` from the `/practice` nav entry.

## Behavior (Alcumus-style, NOT the lesson's no-bail-out)

1. On mount, generate an instance: `generateInstance(TEMPLATES[0], mulberry32(seed))` with a fresh seed per problem (e.g. `Date.now()` xored with a counter).
2. Render the instance's `variant` via `InteractionDispatch`, with a local `useSlotState`-style state (you may reuse `useSlotState` directly).
3. Footer CTA = **Check**. On Check, grade with `checkAnswer(instance.variant, currentAnswer)`:
   - **Correct** -> show `feedbackCorrect` + reveal the worked solution (`DerivationCard` with `instance.explanation`); CTA becomes **Next problem**.
   - **Wrong** -> show wrong feedback; **immediately reveal the worked solution** and switch CTA to **Next problem**. Practice does NOT lock until correct (unlike lessons) — one attempt, learn from the solution, move on.
4. **Next problem** -> generate a new instance, reset state.
5. Reuse `LessonFooter` for the feedback tray + CTA, or a trimmed local footer if `LessonFooter`'s props don't fit cleanly (document the choice).

## Steps (loop until green)

1. Build `InteractionDispatch` (switch over the 5 core kinds used by templates: at minimum `multiple-choice`, `fill-fraction`; include `tap-event`/`grid-event` if a template uses them).
2. Build `PracticeSession` with the generate -> render -> check -> solution -> next loop and local state.
3. Rewrite `PracticePage` to render a simple header ("Practice") + `<PracticeSession />`. Keep it behind no flag (it's non-AI).
4. Unlock the nav entry.
5. `npm run typecheck`; `npm run build`; manual smoke (or a component test) that a problem renders, Check grades, and Next advances.

## Test plan / Definition of Done

- `/practice` renders a real problem (not the locked stub); the nav lock badge is gone.
- Checking a correct answer shows the worked solution and a "Next problem" CTA; Next yields a different problem.
- Checking a wrong answer also reveals the worked solution and lets the learner move on (no infinite lock).
- A component/integration test (Vitest + Testing Library, matching repo conventions) covers: render -> submit correct -> solution visible -> next. (If the repo has no component-test harness, add a minimal smoke test and note it.)
- `npm run typecheck` + `npm run build` clean. No Firebase writes in 6a.

## Boundaries (do NOT touch)

- Do not add adaptivity, topic picker, XP, streaks, or learner-model writes (those are 6b/6c).
- Do not modify the lesson player or `ProblemSlotView` (mirror its switch in the new `InteractionDispatch`, don't refactor the original).
- Do not call any `/api` endpoint or AI (this WP is AI-free).
- Reuse `checkAnswer` from `@/lib/checkAnswer` (WP-0) — do not reimplement grading.
