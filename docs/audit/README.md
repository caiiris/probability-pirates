# Pascal — Feature Audit (2026-06-28)

> Pre-deadline audit. One doc per major feature, each produced by a dedicated
> agent acting as a learning scientist + software engineer + mathematician.
> Goal: establish exactly **what works, what doesn't, the pros/cons, the bugs,
> and the learning-science opportunities** for each feature, so we can finish
> the lessons where needed and deepen the pedagogy before ship.

## Ground truth at audit time

- `tsc --noEmit`: **clean**
- `eslint . --max-warnings=0`: **clean (0 warnings)**
- `vitest run`: **1083 passed / 1083 (99 files)**
- Conclusion: automated health is excellent. The real risk is in **content
  correctness, learning-science design, UX edge cases, and unfinished lessons**,
  not crashes.

## Headline finding

The live teaching path is `how-likely` + 10 authored roadmap lessons (**11
playable**), embedded in a **33-node roadmap**. **23 roadmap stubs are empty**
(`slots: []`, `comingSoon: true`), and they include the pedagogically central
payoff lessons — **conditional probability, Bayes, Monty Hall, the birthday
paradox, independent events, and the entire Expected Value capstone unit** —
plus every `practice-*` / `review-*` node. Meanwhile fully-authored dense
`lesson1`–`lesson5` (which already contain Monty Hall + birthday-paradox
content) sit unused as a "reservoir." Closing this gap is the core of "finish
the lessons where needed."

## Each feature doc follows this structure

1. **Overview** — what the feature is, files/routes, entry points.
2. **What works** — verified-working behavior (cite ACs from PRD/spec).
3. **What's missing / incomplete** — gaps vs. spec, unfinished content.
4. **Bugs & risks** — concrete issues with `file:line` and severity (P0/P1/P2).
5. **Pros / Cons.**
6. **Learning-science assessment** — alignment with the science-of-learning
   principles in `docs/prd-phase2.md` §8 and `docs/brainlift-phase2.md`, plus
   concrete opportunities to deepen the pedagogy.
7. **Recommendations before deadline** — prioritized (P0 = ship-blocker,
   P1 = high-value, P2 = nice-to-have).

## Index

| # | Feature | Doc | Primary code | Spec |
| --- | --- | --- | --- | --- |
| 01 | Auth & account | `01-auth.md` | `src/features/auth` | `spec-auth.md` |
| 02 | Content & curriculum (lesson completeness) | `02-content-curriculum.md` | `src/content` | `spec-content-model.md`, `curriculum-roadmap.md` |
| 03 | Lesson player & slot engine | `03-lesson-player.md` | `src/features/lesson` | `spec-lesson-player.md` |
| 04 | Interaction renderers | `04-interactions.md` | `src/features/lesson/interactions` | `spec-interactions.md` |
| 05 | Progress persistence | `05-progress-persistence.md` | `src/features/progress`, `firebase` | `spec-progress-persistence.md` |
| 06 | Habit loop (XP/streak/milestones/celebration/report card) | `06-habit-loop.md` | `src/features/habit`, `src/lib` | `spec-habit-loop.md` |
| 07 | Course path / Home | `07-course-path.md` | `src/features/course` | `spec-course-path.md` |
| 08 | Profile & stats | `08-profile.md` | `src/features/profile` | `spec-profile.md` |
| 09 | Adaptive practice | `09-practice.md` | `src/features/practice` | `spec-practice.md` |
| 10 | Learner model & progress insights | `10-learner-model.md` | `src/features/learner` | `spec-learner-model.md`, `spec-progress-insights.md` |
| 11 | AI layer (hint/explain/tutor/difficulty) | `11-ai-layer.md` | `api`, `src/features/ai` | `spec-ai-assist.md`, `spec-ai-tutor.md` |
| 12 | Misconception capture | `12-misconception-capture.md` | `src/content/misconceptions.ts`, `src/features/practice/diagnoseWrongAnswer.ts` | `spec-misconception-capture.md` |
| 13 | Captain's Wager | `13-captains-wager.md` | `src/features/wager` | `spec-captains-wager.md` |
| 14 | Engagement & economy (coins/store/social/schedule/notifications/feedback/flags/captain) | `14-engagement-economy.md` | `src/features/{economy,social,schedule,notifications,feedback,flags,captain}` | `spec-social.md` |
