# Audit 10 — Per-learner model (two engines) + progress insights

> Pre-deadline read-only audit. Reviewer lens: learning science (psychometrics /
> knowledge tracing) + software engineering. Ground truth assumed green (`tsc`,
> `eslint`, `vitest` 1083/1083 — not re-run). Scope: the two-engine learner
> model, the mastery math (Elo + recency-weighted accuracy), skill-taxonomy
> coverage, and whether the learner can actually see/benefit from the adaptation.
>
> Source of record: `docs/prd-phase2.md` §4 F3/F3b + §9.3 (6 ACs),
> `docs/specs/spec-learner-model.md`, `docs/specs/wp/wp-5/-7/-9/-2t`,
> `docs/alternatives.md` (D94 + two-engine resolution).

---

## 1. Overview — two engines, data flow, files

The feature gives Pascal a small, owner-only, interpretable model of "what each
learner is good and bad at." Per the D94 two-engine resolution it deliberately
splits the model by **input source**, because the two sources carry very
different evidence quality:

- **Engine A — mastery (Elo).** Per-skill `rating` + recency-weighted accuracy
  (`recentCorrect`). Fed **only by practice** (deliberate, spaced, learner-chosen
  retrieval — the valid mastery signal). Owns `skills{}`, `weakestSkills`,
  `strongestSkills`. API: `applyPracticeAttempt` (pure) / `recordPracticeAttempt`
  (Firestore).
- **Engine B — exposure / struggle / misconceptions.** Per-skill `exposure{}`
  (introduced-in-a-lesson + first-try struggle counts). Fed **only by lesson
  first-attempts** (review excluded, first committed attempt per slot only).
  **Must never move the Elo.** API: `applyLessonExposure` (pure) /
  `recordLessonExposure` (Firestore). Also feeds the lesson report card
  (`buildReportCard`, C7b).

Both are meant to materialize from the append-only `stepAttempts` log
(`progressService.ts`), which stays the source of truth; the
`users/{uid}/learnerModel/state` doc is an eventually-consistent cache.

**Data flow as built:**

```
PRACTICE solve  ──> recordPracticeAttempt(uid, {skills, wasCorrect, difficulty, solvedOnTry, misconceptionSignal})
   (PracticeSession.tsx:296, ConceptualRound.tsx:120)        ──> applyPracticeAttempt ──> learnerModel/state.skills{} (+rating, +recentCorrect, misconceptions{})

LESSON first attempt  ──>  (NOTHING — recordLessonExposure is never called)  ──X── Engine B is dead in production

READ:  useLearnerModel ──> subscribeLearnerModel ──> StrengthsPanel (ProgressPage.tsx, ProfileBody.tsx)
       TopicPicker.tsx:69 ──> weakestSkills[0] → default practice topic
```

**Files in scope**

| File | Role | State |
| --- | --- | --- |
| `src/features/learner/learnerModel.ts` | Pure math: both engines, Elo, recency, report card, misconception scoring | Solid; well-tested |
| `src/features/learner/learnerModelService.ts` | Firestore read-modify-write per engine + subscribe | Solid; `recordLessonExposure` (l.69) exported but **unused** |
| `src/features/learner/topicSummary.ts` | Per-topic practice rollup for `/progress` | Works; double-counts multi-skill variants |
| `src/features/learner/useLearnerModel.ts` | React subscription hook | Fine |
| `src/features/learner/StrengthsPanel.tsx` | Strong / Keep working on / Introduced / Watch-out-for | Good; "Introduced" can never populate from lessons today |
| `src/content/skills.ts` | Closed skill taxonomy (18 ids, 7 topics) | Meets AC #1 |
| `src/content/misconceptions.ts` | Closed misconception taxonomy (9 keys) | Meets AC #2 |
| `src/content/types.ts` | `BaseVariant.skills?` + `*.misconceptionByOption?` | Optional fields present |
| `src/features/progress/ProgressPage.tsx` | `/progress` surface | Renders panel + topic table |

---

## 2. What works (ACs verified, math checked)

**Skill taxonomy (spec AC #1 / PRD §9.3 #1 taxonomy half).** `SKILLS` has **18
ids** across 7 topics (`skills.ts:1-20`) — comfortably ≥15. `Topic` is derived
from the table; `TOPICS` lists the 7 picker groups. Misconceptions
(`misconceptions.ts`) define **9 keys** including the required `gambler`,
`ordered_vs_unordered`, `base_rate_neglect`, `complement_inversion` → **AC #2
met**.

**Two recorders, two engines, no engine bleed (spec AC #4) — verified.**
`applyLessonExposure` (`learnerModel.ts:350-399`) touches only `exposure{}` and
`misconceptions{}`; it explicitly does **not** write `skills`, `rating`,
`weakestSkills`, or `strongestSkills` (l.392-399 comment + code). The first-attempt
recency/Elo path is entirely in `applyPracticeAttempt`. The "Engine B never moves
the Elo" invariant holds at the pure-math layer. This is the single most important
correctness property and it is clean.

**Elo update is mathematically sound (Engine A).** `learnerModel.ts:294-295`:

```
expected = 1 / (1 + 10^((difficulty - rating) / 400))
newRating = rating + K * bonus * (actual - expected)      // K = 24
```

- Logistic expected-score with the standard 400 divisor — correct.
- `K = 24` (`ELO_K`) is a reasonable chess-starter constant (spec-sanctioned, tunable).
- `actual ∈ {0,1}`; per-skill update applied once per tagged skill (spec's
  "applied independently to each" decision). Bounded move per attempt ≈ `K·bonus·1`
  = up to 36. Deterministic given `now`. Correct.

**Delayed-retrieval bonus (the learning-science adjustment).**
`learnerModel.ts:281,293`: `bonus = wasCorrect ? min(1 + daysSinceLastSeen/10, 1.5) : 1`,
read from `oldLastSeenAt` **before** bootstrapping (so a brand-new skill sees gap
= 0, no spurious bonus). Correct-after-a-gap earns up to 1.5× rating credit;
wrong answers get no bonus. This is a faithful, conservative implementation of
"first retrieval after forgetting has outsized effect."

**Recency-weighted accuracy is correct.** `learnerModel.ts:296`:
`recentCorrect = 0.2·masteryCredit + 0.8·recentCorrect` (EWMA, `ACC_ALPHA=0.2`),
bootstrapped at `0.5` so one early miss doesn't read as 0%. The
**try-weighted mastery credit** (`masteryCreditForTry`, l.224-230: first-try = 1,
2nd = 0.5, 3rd = 0.25, reveal = 0) is a genuinely nice nuance — "right after two
hints" no longer reads as mastered. This drives the visible pip/level
(`StrengthsPanel.tsx:36-51`).

**Misconception confidence model (C-MC3) is thoughtful.** Source-weighted
accumulator (`trap` 0.7 / `chip` 0.6 / `llm` 0.5) with a `SURFACE_THRESHOLD` of
1.0 means **no single observation surfaces a misconception** (slip vs. systematic
error, Norman 1981). The mastery-aware **slip guard** (`isStrongBefore` +
`SLIP_DISCOUNT`, l.170-179, 320-322) discounts a trap hit from a learner already
strong on the skill, judged from the pre-attempt model — correctly reasoned
(judging at surface time would be self-defeating because the very miss drags
`recentCorrect` down). `surfacedMisconceptions` also filters stale keys against
the closed `MISCONCEPTIONS` set (l.419). Strong work.

**Owner-only Firestore scoping (spec AC #5 / PRD §9.3 #3) — correct.**
`firestore.rules:72-74`: `match /users/{uid}/learnerModel/{docId}` allows
read/write only when `request.auth.uid == uid`. No cross-user read/write path
exists; there is no public projection. The scoping itself is right (see §4 for a
hardening nit on field validation).

**Strengths panel is visible (spec AC #7 / PRD §9.3 #4) — for Engine A.**
`StrengthsPanel` renders Strong / Keep-working-on (Engine A) with friendly
`SKILLS[id].label` and a 0–3 mastery pip, **no raw Elo numbers** (l.12-16), plus
a "Watch out for" misconception group with one-tap deep links to targeted
practice (`MisconceptionRow`, l.137-161). It is wired into both `/progress`
(`ProgressPage.tsx:45`) and Profile (`ProfileBody.tsx`). Loading/empty states
present.

**Topic auto-suggest feeds F1 (part of PRD §9.3 #5 / §9.2 #7).**
`TopicPicker.tsx:69-74` preselects the topic owning `weakestSkills[0]` from the
live model — a real, working adaptation the learner benefits from.

**Practice templates are fully skill-tagged.** Every practice template file
carries `skills:` (31/31 template files; `practiceEngine.ts:115` propagates
`template.skills` into the instance, consumed at `PracticeSession.tsx:298`). So
**Engine A receives correct skill tags** for every practice attempt.

---

## 3. What's missing / incomplete

### 3.1 Skill-tagging coverage gap — quantified (the headline gap)

**0 of the live-lesson problem variants are tagged with `skills`.** A
project-wide search for `skills:` in `src/content/lessons/*.ts` returns **zero
matches**. Across the **11 live lessons** (`how-likely`, `long-run-frequency`,
`sample-space`, `equally-likely-outcomes`, `compound-experiments`,
`multiplication-principle`, `addition-principle`, `complement-rule`,
`inclusion-exclusion`, `permutations`, `combinations` — per
`01-what-is-probability.test.ts:145-157`):

| Metric | Count |
| --- | --- |
| Live lessons | 11 |
| Problem slots (`kind: 'problem'`) | 58 |
| Problem **variants** | **59** |
| Variants tagged with `skills` | **0** |
| **% of live-lesson variants untagged** | **100%** |
| Live-lesson MC variants with `misconceptionByOption` | **0** |

(Variant count = 117 `interactionKind:` occurrences − 58 problem-slot
declarations across the 11 live lessons.) This is the source of the many
`[WP-2] variant … has no skills tagged` warnings (emitted at
`assertLessonInvariants.ts:280`).

**Consequence:** spec AC #3 ("All live lesson variants are tagged") and PRD §9.3
#1 ("Every variant in the live lessons has `skills`") are **fully unmet**. The
assertion only `console.warn`s (l.278-283); it never throws, so this never blocks
CI. WP-2T (lesson tagging) was logged as **HELD/unmerged** in
`docs/specs/wp/execution-log.md:140` — and indeed it never landed.

### 3.2 Engine B is never wired into the lesson player (the biggest functional hole)

`recordLessonExposure`, `applyLessonExposure`, and `buildReportCard` are
**referenced only inside `src/features/learner/` and the spec** — a search across
`src/**/*.{ts,tsx}` finds **no caller in any lesson player or celebration
screen**. `LessonPlayer.tsx` does not import the learner-model service at all.

Therefore, in the shipped build:
- `exposure{}` is **always empty** → the StrengthsPanel "Introduced" group
  (`StrengthsPanel.tsx:268-275, 322-333`) can **never** populate from lessons.
- **Lesson misconceptions are never captured** (lessons also have 0
  `misconceptionByOption`, so even a wired Engine B would record nothing).
- The **lesson report card (F3b / PRD §4)** is never rendered — `buildReportCard`
  is dead code; WP-9 wiring never landed.
- The **first-attempt-only / review-excluded** rule has nothing to enforce,
  because the recorder is never invoked (the pure function does not self-dedupe;
  dedupe was specced to live in the missing WP-2T player hook).

Net: **the lesson half of the two-engine model is entirely non-functional.** The
two-engine *design* exists in the pure layer; only Engine A is alive end-to-end.

### 3.3 F2 hint targeting from the model is not wired

`HintRequest.learnerSummary?: { topWeakness, recentMisconception }`
(`useAiHint.ts:19`) is **never populated**. `buildHintRequest`
(`PracticeSession.tsx:241-262`) omits it, and `ConceptualRound`'s `requestHint`
calls do too. Hints do use a per-answer authored `diagnosis` (C-MC2), but **not**
the persistent learner model's top weakness or most-recent misconception.
→ PRD §9.3 #5 (second half: "F2's hint prompt includes the learner's top
weakness + most-recent misconception") is **unmet**.

### 3.4 F1 difficulty reads per-topic Elo, not per-skill rating

Adaptive serving (`pickNextTemplate`, `practiceEngine.ts:141-194`) windows on
`ratingForTopic`, which comes from `usePracticeState` (the `practiceState/{topic}`
doc), **not** from the learner model's per-skill `rating`
(`PracticeSession.tsx:190-192`). The Engine-A per-skill `rating` is effectively
**write-only for difficulty purposes** — it is read only to compute
`weakestSkills`/`strongestSkills` (which feed the topic picker + panel). → PRD
§9.3 #5 ("Practice's adaptive engine reads `rating`") is **only partially met**:
the model picks the *topic*, but a parallel per-topic Elo (not the per-skill one)
picks the *difficulty*.

### 3.5 Other missing items
- **No rebuild script (spec AC #10).** `scripts/rebuild-learner-model.ts` does
  not exist. The model is theoretically replayable (pure fns + append-only log),
  but Engine B could not be reconstructed anyway (lessons neither tag skills nor
  write exposure).
- **No PII enforced by rules (spec AC #6).** The "no PII" guarantee is by
  convention only; the rule does not validate the doc shape (see §4 P2).
- **No rating decay.** `lastSeenAt` is stored but ratings never drift back toward
  1000 (deferred to Phase 3 per spec, but see §6).

---

## 4. Bugs & risks (file:line, severity)

### P0 — blocks a headline feature

- **P0-1 — Engine B is dead in production.** `recordLessonExposure`
  (`learnerModelService.ts:69`) / `applyLessonExposure`
  (`learnerModel.ts:350`) / `buildReportCard` (`learnerModel.ts:437`) have **no
  caller** outside the learner module; `LessonPlayer.tsx` never imports the
  service. Half of the advertised two-engine model (exposure, "Introduced"
  view, lesson misconceptions, F3b report card) does not function. *Fix:* land
  the WP-2T lesson-player hook (first-attempt-per-slot, review-excluded,
  fire-and-forget `recordLessonExposure`) + WP-9 report card.

### P1 — unmet acceptance criteria, learner sees less adaptation

- **P1-1 — 100% of live-lesson variants untagged.** `src/content/lessons/*.ts`
  (no `skills:`); assertion only warns at `assertLessonInvariants.ts:280`.
  Fails spec AC #3 / PRD §9.3 #1. Even if P0-1 were fixed, every lesson attempt
  would pass `skills: []` (per the WP-2T plan `variant.skills ?? []`) and no-op.
- **P1-2 — F2 hint not personalized from the model.** `learnerSummary` declared
  (`useAiHint.ts:19`) but never set; `buildHintRequest`
  (`PracticeSession.tsx:241-262`) omits it. Fails PRD §9.3 #5 (hint half).
- **P1-3 — Difficulty ignores the per-skill Elo.** `pickNextTemplate` uses the
  per-topic rating (`practiceEngine.ts:141`, `PracticeSession.tsx:190`); the
  learner-model `rating` is not consulted for serving. Partially fails PRD
  §9.3 #5 (rating half). Risk: the two Elo stores can diverge (per-topic vs.
  per-skill) and the more granular signal is unused.

### P2 — correctness nits / hardening / inconsistency

- **P2-1 — No Elo floor/ceiling.** `learnerModel.ts:295` clamps nothing; a long
  miss streak can push `rating` arbitrarily low (even <0 in theory) and a long
  win streak arbitrarily high. Low impact at K=24 but unbounded; the audit's
  floor/ceiling question is answered: **there are none.** *Fix:* clamp to e.g.
  [400, 2400].
- **P2-2 — Multi-skill double-counting in topic rollup.** A variant tagged with
  N skills in one topic adds N to both `solved` and `attempts`
  (`applyPracticeAttempt` loop `learnerModel.ts:276-306` → `topicSummary.ts:30-31`).
  One problem inflates the topic's "X solved" by its skill count. Spec-acknowledged
  open question; cosmetic but visible on `/progress`.
- **P2-3 — Recency signal is not delayed-retrieval-weighted.** Spec
  §"Delayed-retrieval weight" says bias **both** the Elo and the recency-weighted
  accuracy; the code applies `bonus` only to `rating` (`learnerModel.ts:293`),
  not to `recentCorrect` (l.296). So the *visible* mastery pip — the thing the
  learner sees — does **not** reward retrieval-after-a-gap, only the hidden
  rating does.
- **P2-4 — Doc/code mismatch on lesson misconception weight.**
  `applyLessonExposure` comment (`learnerModel.ts:348`) says lessons use weight
  **1.0**, but the code passes `SOURCE_WEIGHT.trap` = **0.7** (l.388). Moot while
  Engine B is unwired, but will mislead whoever wires it.
- **P2-5 — `learnerModel` rule lacks field/shape validation.**
  `firestore.rules:72-74` allows the owner to write *any* fields to their own
  `learnerModel/state` (no allowlist, no size cap), unlike the hardened
  `users/{uid}` (l.27-48) and `stepAttempts` (l.59-67) blocks. Scoping is safe
  (owner-only), but the spec's "No PII / closed shape" (AC #6) is not
  rule-enforced. Low risk (a client can only corrupt its own cache).

---

## 5. Pros / Cons

**Pros**
- Clean separation of concerns: pure math (`learnerModel.ts`) is Firebase/React-free,
  deterministic given `now`, and the engine-bleed invariant is structurally enforced.
- The Elo + EWMA + try-weighted-credit + source-weighted-misconception stack is
  interpretable, defensible, and right-sized (no BKT/DKT/IRT over-engineering).
- Genuinely thoughtful learning-science touches: delayed-retrieval bonus,
  try-weighted mastery credit, mastery-aware slip guard, repetition/corroboration
  threshold for misconceptions.
- Read surface is honest: no raw ratings shown; friendly labels + pips; "Introduced"
  vs. "Practiced" kept distinct so un-practiced skills never read as mastery.
- Best-effort writes that never throw; the model is correctly treated as a cache,
  not a gate.

**Cons**
- Only one of the two engines is alive end-to-end; the lesson side (Engine B +
  report card) is built but unplugged.
- The skill taxonomy is unused by the half that was supposed to consume it
  (lessons): 100% untagged.
- The model's richest output (per-skill rating, top weakness, recent
  misconception) is under-consumed: difficulty uses a different Elo, hints ignore
  the summary. The learner benefits mainly via the topic picker.
- Several specced ACs (#3, #6, #9-hint, #10) are unmet; a few are silent failures
  (warn-not-throw) that green CI hides.

---

## 6. Learning-science assessment

**Does the model capture durable mastery or just recent performance?** As
*designed*, it leans toward durable mastery: the two-engine split is exactly the
right response to *performance ≠ learning* — lessons (correct-right-after-being-
taught, under no-bail-out) are weak evidence and are quarantined in Engine B,
while only practice (chosen, spaced, retrieval-based) moves the Elo. That is a
sound, literature-aligned instinct (testing effect, desirable difficulties,
spacing).

**As built, however, it captures recent practice performance only**, for three
compounding reasons:
1. **Engine B is dead (P0-1)** — the entire "this was just-taught, treat it as
   exposure not mastery" guardrail never fires, and the only honest signal that a
   skill is *new* (vs. *retained*) is absent.
2. **No forgetting decay** — `lastSeenAt` is recorded but ratings/`recentCorrect`
   never decay. A learner who crammed practice last week reads "Mastered"
   indefinitely; the model freezes a snapshot of recent performance rather than
   tracking retention over time.
3. **The delayed-retrieval weighting only touches the hidden rating, not the
   visible `recentCorrect` (P2-3)** — so the *visible* mastery signal is a plain
   EWMA of recent attempts (α=0.2 ≈ last ~5–10 attempts dominate). That is, by
   construction, a *recent-performance* meter, not a *retention* meter.

So the model **performance ≠ learning** principle is honored in architecture but
partially undone in the live build: the part that distinguishes performance from
learning (Engine B + delayed-retrieval on the visible signal + decay) is the part
that is missing or hidden.

**Delayed-retrieval weighting** is present and correct *where it exists* (rating,
up to 1.5× for ≥5-day gaps) — a real strength. The gap is that it does not reach
the learner-facing signal and there is no scheduling/"due for review" surface to
turn `lastSeenAt` into spaced retrieval (Phase 3 per spec).

**Opportunities**
- Wire Engine B + tag lessons so the model can actually say "introduced, not yet
  retrieved" vs. "retrieved cold after a gap" — the core performance≠learning
  distinction the design promises.
- Apply the delayed-retrieval bonus (and/or a half-life decay on `recentCorrect`)
  to the **visible** mastery signal, so "Mastered" means *retained*, not
  *recently correct*.
- Add a gentle forgetting decay toward 1000 keyed on `now - lastSeenAt`, and use
  `lastSeenAt` to surface a non-gating "due for review" nudge (turns the existing
  field into spaced retrieval without a full FSRS).
- Feed `weakestSkills[0]` + `surfacedMisconceptions()[0]` into the F2 hint
  `learnerSummary` (the data already exists) so hints become personalized.

---

## 7. Prioritized recommendations

1. **(P0) Wire Engine B end-to-end (WP-2T + WP-9).** Add the first-attempt-per-
   slot, review-excluded `recordLessonExposure` hook in `LessonPlayer.tsx` and
   render `buildReportCard` on the celebration screen. This revives exposure, the
   "Introduced" view, lesson misconception capture, and the F3b report card in
   one stroke.
2. **(P1) Tag the 59 live-lesson variants** with `skills` (and
   `misconceptionByOption` on diagnostic MC distractors). Without this, fixing #1
   still yields empty exposure. Then flip the assertion from `warn` to `throw` so
   the gap can't silently regrow (`assertLessonInvariants.ts:278-283`).
3. **(P1) Personalize F2 hints from the model.** Populate
   `HintRequest.learnerSummary` in `buildHintRequest` (`PracticeSession.tsx:241`)
   from `weakestSkills[0]` + most-recent surfaced misconception.
4. **(P1) Decide the difficulty-Elo story.** Either have `pickNextTemplate`
   consult the per-skill learner-model rating, or explicitly document that
   per-topic Elo drives difficulty and the per-skill rating drives ordering only
   (and update PRD §9.3 #5 accordingly) to remove the divergence risk.
5. **(P2) Learning-science hardening:** clamp the Elo (P2-1); apply
   delayed-retrieval weight + a half-life decay to the **visible** `recentCorrect`
   (P2-3); fix the multi-skill double-count in `topicSummary` (P2-2).
6. **(P2) Tighten the `learnerModel` Firestore rule** with a field allowlist +
   size cap to make the "No PII / closed shape" AC #6 rule-enforced, matching the
   `users/{uid}` pattern (P2-5); fix the 0.7-vs-1.0 doc comment (P2-4).
7. **(P2) Add `scripts/rebuild-learner-model.ts`** (spec AC #10) once #1/#2 land,
   so support can replay `stepAttempts` into a correct model for both engines.
