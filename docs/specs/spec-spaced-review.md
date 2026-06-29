# Spec — Spaced Review ("Daily Warm-up")

> Phase 2.5. Adds evidence-based **spaced retrieval** to Pascal: when skills a
> learner has met are starting to fade, a short retrieval **warm-up** surfaces
> before they start a *new* lesson. Builds directly on the existing learner
> model (`src/features/learner`), code-verified practice templates
> (`src/features/practice/templates`), and practice engine
> (`practiceEngine.ts`). Companion to [`spec-practice.md`](spec-practice.md),
> [`spec-learner-model.md`](spec-learner-model.md), and the Phase-2 PRD §8
> learning-science principles.

## 1. Why (learning science)

- **Spaced retrieval is the highest-leverage durable-learning intervention**
  (distributed practice + testing effect; Cepeda 2006, Roediger & Karpicke
  2006). It is the one mechanism that converts *performance at teaching time*
  into *retained mastery* — the exact gap the audit found (lesson mastery is
  currently measured only at the moment of teaching).
- **Expanding intervals** beat fixed delays. Optimal gap scales with desired
  retention (~10–30% of the retention interval; Cepeda 2008). First review is
  highest-yield in the first 1–2 days (steep early forgetting curve, Ebbinghaus).
- **Adaptive difficulty / Leitner demotion**: a missed review shortens the
  interval; a hit lengthens it — keeping each review at a *desirable difficulty*
  (just hard to recall), not trivial.

## 2. Design principle — soft-but-prominent, not coercive

Pascal's prior decision made practice **fully optional (Alcumus-style)** to
protect autonomy/SDT, and the lesson player guarantees the learner is **never
trapped**. Forced/mandatory tasks risk reactance that kills the daily habit for
an insecure HS learner. So the warm-up is a **soft-but-prominent gate**:

- It gates only **starting a NEW lesson** — never Home, Practice, resuming an
  in-progress lesson, or the celebration screen.
- It is **short** (≤4 items, ~2 min) to respect the 3–5 min session and working
  memory.
- It offers a **once-per-local-day "Skip today"** escape valve. The default path
  runs through review; the escape preserves autonomy.
- It is **framed as help** ("2 skills are fading — quick tune-up"), pays XP, and
  reports "memory strengthened" — a win, not a toll.
- It **fails open**: any read/generation error → no gate. Never block on error.

## 3. Data model

New owner-only subdoc `users/{uid}/reviewSchedule/state`:

```ts
type ReviewEntry = {
  box: number;          // Leitner box 0..5
  dueAt: number;        // epoch ms; review is due when dueAt <= now
  lastReviewedAt: number;
  lapses: number;       // times demoted (diagnostic)
};
type ReviewSchedule = {
  entries: Partial<Record<SkillId, ReviewEntry>>;
  skippedOnDate: string | null; // 'YYYY-MM-DD' local day the learner last skipped
  updatedAt: number;
};
```

Firestore rule (mirror the `learnerModel` block — owner-only):

```
match /users/{uid}/reviewSchedule/{docId} {
  allow read, write: if isOwner(uid);
}
```

## 4. Scheduler math (pure — `reviewSchedule.ts`)

```
INTERVALS_DAYS = [2, 4, 9, 21, 45, 90]   // box 0..5, expanding ~2.2x
```

- **Seed** (on lesson completion, per skill taught): if no entry exists, create
  `{ box: 0, dueAt: now + 2d, lastReviewedAt: now, lapses: 0 }`. If an entry
  exists, leave it (teaching reinforcement is not a scheduled review).
- **applyReviewResult(entry, correct, now)**:
  - correct → `box' = min(box+1, 5)`, `dueAt = now + INTERVALS_DAYS[box']`.
  - wrong → `box' = 0`, `dueAt = now + INTERVALS_DAYS[0]`, `lapses++`.
  - always `lastReviewedAt = now`.
- **dueSkills(schedule, now)** = skill ids with `dueAt <= now`, sorted most-
  overdue first.

All pure, fully unit-tested (expanding promotion, demotion-to-0, due ordering,
seed idempotency).

## 5. Item generation (reuse existing infra)

For each due skill, map `SkillId → Topic` via `SKILLS[skill].topic`, then
`pickNextTemplate({ topic, ratingForTopic, recentTemplateIds: [], rng })` +
`generateInstance()` from `practiceEngine.ts`. Render with the practice
renderers (`InteractionDispatch`) and grade with `checkAnswer` — **every answer
is code-verified**, same as practice. A due skill whose topic has **no template**
is dropped (cannot generate ⇒ not gated on).

## 6. Flow

1. Learner taps a **not-started real lesson** (new-lesson start).
2. Outer guard checks: schedule loaded, `dueSkills` (after template-availability
   filter) non-empty, and `skippedOnDate !== todayLocalDate()`.
   - If gate not warranted → open the lesson normally.
   - Else → redirect to `/warmup?next=/lesson/:lessonId`.
3. `/warmup` serves the due items one at a time (≤ `MAX_WARMUP_ITEMS = 4`,
   most-overdue first). Per item: answer → code-graded feedback → reveal worked
   solution → Next. Each result calls `applyReviewResult` + `recordPracticeAttempt`
   (Engine A) and awards small daily-capped practice XP.
4. On finishing the last item (or "Skip today"): persist the schedule, then
   `navigate(next)`.

## 7. Acceptance criteria

1. **Due surfacing.** When ≥1 reviewable skill is due, starting a new lesson
   routes through the warm-up; with none due, it opens the lesson directly.
2. **Scope.** Home, Practice, in-progress resume, and celebration are never
   gated. Verified by inspection + the redirect predicate.
3. **Code-verified items.** Every warm-up item's answer comes from a template
   `solve()` (no model); fully worked solution shown after answering.
4. **Adaptive schedule.** A correct review lengthens the interval (box up); a
   miss resets it to the shortest box. Unit-tested.
5. **Soft gate.** "Skip today" dismisses the gate for the rest of the local day;
   the next local day it returns if still due.
6. **Fail-open.** Schedule read failure, empty template coverage, or generation
   error ⇒ no gate; the lesson opens normally. Never blocks on error.
7. **XP integration.** Warm-up XP uses the daily-capped practice path; it does
   NOT tick the streak or count as a completed lesson.
8. **Privacy.** Schedule is owner-only (`users/{uid}/reviewSchedule`), enforced
   by rules + an emulator test.

## 8. Edge cases

| # | Case | Resolution |
| --- | --- | --- |
| SR1 | No learner history yet | Empty schedule ⇒ no due skills ⇒ no gate |
| SR2 | Due skill's topic has no template | Drop the skill from the warm-up set |
| SR3 | Reduced motion | Inherit the app-wide `MotionConfig reducedMotion="user"` |
| SR4 | Clock skew / travel | "Skipped today" uses `todayLocalDate()` (same tz logic as streaks) |
| SR5 | Learner abandons mid-warm-up | No completion write; schedule entries already updated per-item are persisted incrementally; `next` not auto-opened |
| SR6 | Offline | Service is best-effort (never throws); gate fails open |

## 9. Out of scope (MVP)

- Seeding reviews from *practice* history (MVP seeds from lesson completion only;
  practice already updates Engine A separately).
- A hard gate with no skip; per-item difficulty recalibration; a dedicated
  "Reviews" home surface (a non-blocking "reviews due" card is a fast follow).
- Dependency note: lesson-completion seeding needs the lesson→skills union; this
  works today from `variant.skills`. (Engine B lesson-exposure wiring is a
  separate, complementary fix.)
