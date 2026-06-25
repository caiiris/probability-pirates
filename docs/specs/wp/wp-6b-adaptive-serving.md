# WP-6b — Adaptive serving + topic picker

> **Type:** integration. **Depends on:** WP-6a (the loop), WP-5 (learner model), WP-3 (`pickNextTemplate`), WP-8 (rules for `practiceState`). **Blocks:** WP-6c (XP/signals build on this). **Server/AI:** no.

## Goal

Make the solve loop adaptive: pick the next template by the learner's per-topic rating, let the learner choose a topic (defaulting to their weakest), and persist per-topic rating + recent templates in `users/{uid}/practiceState/{topicId}`.

## Files

- **Add** `src/features/practice/usePracticeState.ts` — hook: read/write `users/{uid}/practiceState/{topicId}` per [C8](wp-contracts.md#c8-firestore-paths-owned-by-wp-8-consumed-by-wp-5-wp-6); expose `{ rating, recentTemplateIds, recordResult(wasCorrect, difficulty, templateId) }`.
- **Add** `src/features/practice/TopicPicker.tsx` — topic chooser over `TOPICS`; default-selects the topic owning the learner's `weakestSkills[0]` (from `subscribeLearnerModel`, WP-5).
- **Edit** `PracticeSession.tsx` — use `pickNextTemplate({ topic, ratingForTopic, recentTemplateIds, rng })` instead of `TEMPLATES[0]`; after each graded answer, update per-topic rating via the same Elo rule used in WP-5 (reuse the `elo()` helper / `applyPracticeAttempt`'s formula, or store rating updates through `usePracticeState`).
- **Edit** `PracticePage.tsx` — render `TopicPicker` above the session; switching topic restarts the loop in that topic.

## Steps (loop until green)

1. Build `usePracticeState`: subscribe to the topic's doc; default `rating = DEFAULT_RATING`, `lastSeenTemplateIds = []`. `recordResult` applies the Elo update (`ELO_K`, 400-divisor — import the helper from WP-5's `learnerModel.ts` or a shared `elo()` util) and pushes the templateId (keep last 3), then writes the doc.
2. Build `TopicPicker`: list `TOPICS` as chips; preselect from learner model weakness; controlled by `PracticeSession`.
3. Wire `PracticeSession` to pick adaptively and to call both `usePracticeState.recordResult(...)` AND `recordPracticeAttempt(uid, { skills: instance.skills, wasCorrect, difficulty: instance.difficulty, misconceptionKey })` (WP-5, Engine A) after each answer. Derive `misconceptionKey` from the variant's `misconceptionByOption?.[chosenWrongOptionId]` when present. (Practice uses `recordPracticeAttempt` — the Elo engine; lessons use `recordLessonExposure`. Do not mix them.)
4. `npm run typecheck`; `npm run build`; manual check that difficulty trends with performance and topic switching works.

## Test plan / Definition of Done

- Selecting a topic serves problems from that topic only; default selection matches the learner's weakest topic when a model exists.
- Repeated correct answers raise the per-topic rating (persisted across reloads); repeated misses lower it.
- `recentTemplateIds` prevents immediate repeats (no template served twice in a row when alternatives exist).
- Each answer writes both `practiceState/{topic}` and `learnerModel/state` via `recordPracticeAttempt` (Engine A); verify the Elo `rating` moves (this is practice, so moving the rating is correct — unlike lessons).
- Pure helpers (Elo update, recent-list trimming) have unit tests; `npm run typecheck` clean.

## Boundaries (do NOT touch)

- Do not change the `pickNextTemplate` signature (WP-3); call it as specified.
- Do not block the UI on Firestore writes (optimistic local state; persist in the background, like the lesson player).
- Do not add XP / streak / session-summary here (WP-6c).
- No AI / `/api` calls.
