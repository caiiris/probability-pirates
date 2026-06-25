# WP-9 — Lesson report card on the celebration screen (Engine B)

> **Type:** UI + pure fold. **Depends on:** WP-2 (skills/labels), WP-T (component-test harness); consumes the `SlotFirstTry[]` produced by WP-2T's lesson-player wiring. **Blocks:** nothing. **Server/AI:** no (entirely client-side, grounded in the learner's own first-attempt results).
>
> The Khan-style "here's what you did well / what to watch" recap, shown immediately at lesson end. This is **Engine B's** visible payoff (README open-question #7).

## Goal

After a lesson, show a formative report card on the celebration screen: which skills the learner nailed on the first try, which to review, and any misconception they revealed — built purely from the lesson session's first-attempt results. No AI, no mastery rating involved.

## Files

- **Add** `src/features/learner/buildReportCard` is already in WP-5's `learnerModel.ts` (C7b) — WP-9 consumes it, does not re-implement.
- **Add** `src/features/habit/LessonReportCard.tsx` — presentational: given a `LessonReportCard`, render "Nailed" (green) / "Worth a review" (amber) skill chips using `SKILLS[id].label`, and a friendly misconception line using `MISCONCEPTIONS[key].label` (e.g. "Watch the gambler's fallacy"). Includes a gentle, NON-blocking "Practice these" invitation linking to `/practice` (never a gate).
- **Edit** `src/features/habit/CelebrationScreen.tsx` — render `<LessonReportCard>` in the celebration flow (after the XP/streak beats, before "Back to Home") when report data is present.
- **Coordinate the data handoff** with WP-2T: the lesson player passes `SlotFirstTry[]` to the celebration route. Use the celebration screen's existing refresh-safe pattern (it already carries state via URL params per habit-loop AC #8) — if the array is too large for URL params, use a short-lived session store (`sessionStorage` keyed by lessonId) written on completion and read on the celebration screen. Pick the simplest that keeps the screen refresh-tolerant; document the choice.

## Steps (loop until green)

1. Confirm `buildReportCard(lessonId, results)` (WP-5/C7b) exists; if WP-5 isn't merged yet, implement against its frozen signature and switch to the import when it lands.
2. Build `LessonReportCard.tsx` (pure presentational given a `LessonReportCard`): empty/degenerate states (all nailed -> celebratory "Clean run!"; nothing tagged -> render nothing).
3. Wire it into `CelebrationScreen`: read the handoff data; if absent (e.g. older completion, or a lesson with no tagged skills), render nothing (the celebration screen must still work without it).
4. Ensure refresh-safety: reloading the celebration URL either re-shows the card (if data persisted) or omits it gracefully — never crashes.
5. `npm run typecheck`; `npm run build`; component test via WP-T.

## Test plan / Definition of Done

- Given a `LessonReportCard` with `nailed:['favorable-over-total']`, `review:['ordered-vs-unordered']`, `misconceptions:['gambler']`, the component renders the right labelled chips + a "watch the gambler's fallacy" line + a non-blocking practice invite.
- "Clean run" state (all nailed, no review) renders the celebratory variant.
- Absent/empty data -> the celebration screen renders normally with no report card and no error.
- The practice invitation is a link, NOT a gate (no blocking, no forced navigation).
- RTL component test (WP-T) covers the three states.
- `npm run typecheck` + `npm run build` clean; the existing celebration tests still pass.

## Boundaries (do NOT touch)

- Do NOT read or move the mastery Elo here — the report card is built from the session's `SlotFirstTry[]` (Engine B), independent of practice.
- Do NOT make the practice invitation a gate or auto-redirect (practice stays fully optional — README #7).
- Do NOT add AI / `/api` calls — this is grounded entirely in the learner's own first-attempt results + the in-repo taxonomy labels.
- Do not change the celebration screen's existing XP/streak/milestone beats; add the card alongside them.
