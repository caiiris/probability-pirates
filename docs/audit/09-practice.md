# Audit 09 — Adaptive infinite practice (F1, Track 1 generators)

> Pre-deadline read-only audit. Reviewer lens: learning scientist + mathematician +
> software engineer. Ground truth assumed green (`tsc`, `eslint`,
> `vitest` 1083/1083 incl. template solver-vs-Monte-Carlo gates — **not re-run**).
> Scope: the template bank + solvers, the exact rational oracle + sim cross-check,
> the adaptive serving engine, the 3-try hint ladder, difficulty-scaled daily-capped
> XP, conceptual two-part interleaving, and topic auto-suggest.
>
> Source of record: `docs/prd-phase2.md` §4 F1 + §9.1 (7 ACs) + §8 (learning
> science), `docs/specs/spec-practice.md`, `docs/specs/spec-ai-difficulty-annotation.md`,
> `docs/specs/wp/wp-3-template-engine.md`, `wp-4-template-families.md`, `wp-6a/6b/6c`.

---

## 1. Overview — engine, templates, session loop

The feature delivers the headline Phase-2 promise — **"the course never runs
dry."** Unlimited probability problems are generated client-side from in-repo
parameterized templates; every served answer comes from a deterministic
`solve()` (no LLM in the answer path), cross-checked at build time by Monte-Carlo.

**Template contract** (`templates/types.ts`): each `Template<P>` ships
`id`, `topic`, `skills[]`, `retrievalForm`, `rate(params)→Elo`, `sample(rng)→params`,
`solve(params)→ExactAnswer` (**single source of truth**), `render(params)→Variant`
(must derive correctness fields from `solve`), `explain(params)→{title,steps}`, and
an optional `simulate(params,trials,rng)→p̂` (required for probability answers).

**Exact oracle** (`src/lib/probability/exact.ts`): `Fraction` over `bigint`
(always reduced, `den>0`), `add/sub/mul/div/eq`, `factorial`, `nPr`, `nCr`
(uses the `min(r,n-r)` symmetric form), and the `ExactAnswer` union
(`int | fraction | choice`). Clean, dependency-free, lossless.

**Vetting gate** (`templates/testUtils.ts` → `expectTemplateAgrees`): seeds
`mulberry32`, draws ≥1000 param sets, and for each probability answer asserts
`|p̂ − p| < 5·√(p(1−p)/trials)` over 10 000 trials, plus exact enumeration where
feasible, plus an optional `checkAnswer(render, answerToPayload(solve))`
render-consistency round-trip. A failing template blocks CI (AI-E6 / AC3).

**Bank** (`templates/index.ts → ALL_TEMPLATES`): ~30 base families across the 7
topics + 15 verified-seed wrappers (`verifiedSeeds.ts`, delegating to base
`solve/render/explain/simulate`) + 7 fixed creative-hard instances
(`creative/creative-hard.ts`). Topics: `counting`, `permutations-combinations`,
`inclusion-exclusion`, `long-run`, `complement`, `conditional`, `distributions`
(`content/skills.ts`).

**Serving** (`practiceEngine.ts`):
- `generateInstance(template, rng)` → `sample → solve → render → explain → rate`,
  `instanceId = ${id}:${fnv1a32(JSON.stringify(params))}`.
- `pickNextTemplate({topic, ratingForTopic, recentTemplateIds, rng})`: candidates =
  topic templates not in the last-3 `recentTemplateIds`; representative difficulty
  via one `t.rate(t.sample(rng))` draw; keep those in `[r−50, r+100]`; widen ±100
  until non-empty; uniform pick.
- `answerToPayload(answer, variant)` maps each `ExactAnswer` kind to the renderer's
  payload (`choice→optionId`, `fraction→num/den`, `int→{value}` for `number-fill`
  / `num/1` for `fill-fraction`, **throws** for `int`+`multiple-choice`).

**Session loop** (`PracticeSession.tsx`): per-problem state (instance, pending
answer, resolved flag, ladder hint). After a graded answer it calls
`recordResult` (per-topic Elo, `usePracticeState`), `recordPracticeAttempt`
(Engine A per-skill Elo), and `awardXp` (`usePracticeXp`, daily-capped). Every
`INTERLEAVE_EVERY = 4` template problems it tries a same-topic concept-check
(`ConceptualRound` + `conceptual.ts`). `PracticePage.tsx` owns the rating, the
topic chips (`TopicPicker.tsx`, weakest-skill auto-suggest), and a localStorage
per-topic/band progress dialog.

---

## 2. What works (with AC citations)

- **AC1 — Unlock visible.** `/practice` renders the live `PracticePage`, not the
  stub.
- **AC2 — Endless solve loop.** `newInstance()` / `handleNext()` regenerate
  indefinitely; immediate correct/wrong feedback + a `DerivationCard` worked
  solution; "Next problem" repeats.
- **AC3 — Every answer code-computed + Monte-Carlo gate.** Confirmed: `solve()` is
  the only correctness source; `render`/`verifiedSeeds` derive from it. The
  `expectTemplateAgrees` 5σ gate (1000 samples × 10 000 trials) + exact
  enumeration is wired per template (AI-E6). **I hand-checked ~30 solvers + the 7
  creative instances and found no math error** (see §6 spot-checks below).
- **AC4 — Adaptive difficulty observable.** Per-answer Elo (`applyElo`,
  `usePracticeState`) + the per-skill Elo (`applyPracticeAttempt`); the header
  `RatingChip` shows the rating and a flashing ±delta. Streak-up/miss-down emerges
  from Elo accumulation (no separate streak counter).
- **AC6 — XP integration.** `practiceBandForElo` → `Easy 3 / Medium 5 / Hard 8 /
  Extreme 12` (`practiceXp.ts`), per-try decay (`practiceTryMultiplier`:
  1 / 0.5 / 0.25 / 0), daily cap 100 (`grantPracticeXp`). **Verified it does NOT
  tick the streak or count as a lesson**: `usePracticeXp` writes only `xp`,
  `weeklyXp`, `weekKey` via `awardPracticeXp` — never `currentStreak`,
  `lastActiveDate`, `lessonsCompleted`. A reveal (3rd miss) earns 0.
- **AC7 — Topic auto-suggest.** `TopicPicker` subscribes to the learner model and
  preselects the topic owning `weakestSkills[0]` once at mount; a `?topic=` deep
  link disables auto-suggest so an explicit choice sticks.
- **3-try ladder.** `handleCheck`: try 1–2 wrong → fetch an escalating, **no-reveal**
  hint (with authored-feedback fallback when AI is off / errors); 3rd miss →
  `resolve(false)` reveals the canonical `DerivationCard`. Hint requests redact all
  numbers from the solution outline (`redactNumbers`) so the model can localize how
  far the learner got without leaking the answer. Sound leak-safety design.
- **Conceptual two-part (F2).** `ConceptualRound`: Part 1 (the number) graded in
  **code** (`gradeConceptualAnswer`, accepts equivalent forms 1/2 = 2/4 = 0.5) —
  the only thing that earns XP/mastery; Part 2 (the "why") is LLM-classified and
  only ever *reduces* XP (`reasoningMultiplier`, 0.5) and feeds the misconception
  signal. Concept-checks deliberately do **not** move the per-topic Elo. Matches
  the "LLM is a student, never a judge" non-negotiable.
- **I-WP-H resolved.** `pick-k-of-n-unordered` now ships `interactionKind:
  'number-fill'` with `{kind:'int'}` (was the `int`-vs-`multiple-choice` clash that
  would throw in `answerToPayload`). The ordered-count trap `nPr(n,k)` is preserved
  via `misconceptionByValue`. Confirmed clean.

---

## 3. What's missing / incomplete

1. **Retrieval-form interleaving is metadata-only (AC 9.1-addendum #8 unmet).**
   Every template declares `retrievalForm`, but `pickNextTemplate` never reads it,
   and `PracticeInstance` doesn't even carry it. The engine interleaves only
   template-vs-concept-check (every 4) and by difficulty window — it does **not**
   mix definition/operation/procedural/application within a topic as the spec's
   "interleaving lever" requires. (`practiceEngine.ts:141-194`; grep confirms
   `retrievalForm` appears only in template defs + the seed passthrough.)
2. **Conceptual interleave covers only 4/7 topics.** `content/conceptual/problems.ts`
   has problems for `long-run`, `conditional`, `permutations-combinations`,
   `complement` only. In `counting`, `inclusion-exclusion`, `distributions`,
   `pickConceptualProblem` returns `null` and the loop silently stays on templates —
   the two-part round never appears for those topics.
3. **Difficulty calibration is hand-rated and uncalibrated** (as the spec itself
   flags). The offline LLM annotation pass (`spec-ai-difficulty-annotation`, F6) is
   **planned / not implemented**; there is no `scripts/practice/annotate-difficulty.ts`.
   `rate()` values are author guesses, so the Elo scale that drives serving + XP
   banding is unvalidated.
4. **Variant memory is template-level, not instance-level.** Anti-repeat tracks the
   last 3 `templateId`s, not `instanceId`s, so low-cardinality families re-serve the
   *same* concrete problem (see §4).
5. **No Track-2 vetted bank / session recap (F5)** — out of scope for the Friday
   surface, correctly deferred.

---

## 4. Bugs & risks (file:line, P0/P1/P2)

> No P0 found. Every `solve()` reviewed is mathematically correct, and the
> solver-vs-simulation gate backs that up.

### P1

- **`gambler-fallacy-mc` — duplicate + wrong-direction distractor in 2 of 3
  flavors.** `long-run/gambler-fallacy-mc.ts:82-89`. For `flavor === 0` (coin,
  P(tails)) and `flavor === 2` (free throw, P(miss)), the `due` and `hot` options
  **both render `'Greater than 1/2'`** — two visually identical answer choices.
  Worse, the `hot` (hot-hand) distractor is the wrong direction: for the probability
  of the *non-streak* outcome, the hot-hand belief implies **less** than 1/2, not
  greater. Grading is unaffected (`correctOptionId = 'independent'` stays unique, so
  the suite is green and `solve` is correct), but a learner sees a broken question.
  Only `flavor === 1` (die) is well-formed. **Fix:** make `hot` label
  `'Less than 1/2'` for flavors 0/2.
- **Retrieval-form serving unimplemented (AC 9.1-add #8).** See §3.1. The
  acceptance criterion "the engine respects both [retrievalForm and skills] when
  serving" is not met — `retrievalForm` is inert at runtime. `practiceEngine.ts:166-193`.

### P2

- **Adaptive targeting is coarse vs the ~20–30% miss ceiling.** Three compounding
  causes:
  - *Window biased above rating.* `[r−50, r+100]` (midpoint ≈ r+25). On the
    Elo curve (`expected = 1/(1+10^((d−r)/400))`, K=24) a problem at r+100 implies
    only ~36% expected-correct → ~64% miss; the window midpoint implies ~46%
    correct → ~54% miss. To actually target 20–30% miss you serve ~150–250 Elo
    *below* rating. So the window direction fights the stated desirable-difficulty
    ceiling. (`practiceEngine.ts:176-177`.)
  - *Bimodal/clustered difficulty.* Many base families are intentionally clamped to
    the Easy band (e.g. `sum-of-two-dice` 760–910, `single-event-prob` 760–880,
    `k-heads-in-n` ~800–920, `gambler-fallacy` 760–860), while harder coverage jumps
    to creative seeds (1180/1320/1620/1650). Within e.g. `distributions` there is a
    gap from ~920 to ~1150, so a learner at 1000 finds **nothing** in the
    `[950,1100]` window and the widener bounces between a too-easy and a too-hard
    problem instead of centering. Practically, an improving learner soon out-rates
    the Easy cluster and gets near-everything right (miss < 20%, boredom) — the
    opposite of the ceiling.
  - *Filter difficulty ≠ served difficulty.* `pickNextTemplate` filters on a
    representative `t.rate(t.sample(rng))` draw, then `generateInstance` draws params
    **again** — for wide-range families (`conditional-two-way-table` 1050–1300,
    `binomial-at-least-k` 1440–1700) the served instance's difficulty can land well
    outside the window. By-design per WP-3, but it decouples serving from target.
- **"Below-level can't drop Bounty" weakens "misses trend down."**
  `usePracticeState.ts:66` returns `max(currentRating, nextRating)` when
  `difficulty < currentRating`, so a miss on a below-rating problem leaves the
  visible rating flat. Mostly cosmetic (the Engine-A per-skill rating *does* drop,
  so adaptation still works), but it deviates from AC4's literal wording.
- **Low-variety re-serves in small families.** `sum-of-two-dice` (11 distinct `k`),
  `monty-hall-n-doors` (4 `n`), `derangement-probability` (4 `n`),
  `expected-value-die-game` (5 `s`), and all 7 creative + 15 seed templates have
  fixed/tiny param spaces. With anti-repeat keyed on `templateId` (last 3) and not
  `instanceId`, the *identical* problem recurs quickly. Not true exhaustion (the
  loop never dries up — AI-E8 holds), but variety is thin for those topics.
- **Two creative problems are under-specified (well-posedness).**
  `creative/creative-hard.ts`: `creative-nonlinear-payoff-expected-value` (l.80-99)
  asks for expected revenue but the **prompt gives no distribution or prices** — the
  $2.01 answer is only derivable from the hidden `explain` steps; and
  `creative-non-transitive-dice` (l.206-226) asks for the pairwise win probability
  but **never states the dice faces**, so 5/9 isn't computable from the statement.
  The answers are internally correct, but these ship as unsolvable-as-written MC
  items. (The other five creative problems are self-contained and correct.)
- **No Monte-Carlo cross-check on creative / count-only templates.** Creative
  problems and pure-count families (`pick-k`, `committee`, `circular`,
  `permutations-with-repetition`, `conditional-two-way-table`) define no `simulate`,
  so their correctness rests on author + the structural/enumeration test only — a
  thinner net than the probability families enjoy. Acceptable given they're small
  and hand-verified, but worth stating.

### P3 / nits

- Doc-comment topic drift: `inclusion-exclusion-divisible.ts` header says
  "Topic: counting" but `topic: 'inclusion-exclusion'`; `pick-k-of-n-unordered.ts`
  header says "Topic: counting" but `topic: 'permutations-combinations'`.
- `registry.test.ts:44` comment says "five topics" though `TOPICS` has 7 (the test
  iterates `TOPICS`, so it still validates correctly).

---

## 5. Pros / Cons

**Pros**
- Correct-by-construction architecture is real: `solve()` is the single source of
  truth, `render` and seeds derive from it, and the 5σ Monte-Carlo + exact-enum gate
  genuinely guards it. **Zero LLM in the answer path.**
- The exact `bigint` `Fraction` oracle eliminates floating-point error in answer
  keys — the right call for a "never teach a wrong answer" product.
- Clean separation: pure engine/templates (no React/Firebase), hooks own I/O,
  optimistic writes never block the UI.
- The 3-try ladder + number-redacted hint outline is a thoughtful, leak-safe
  realization of "the learner does the thinking, the LLM phrases the nudge."
- XP policy is exactly to spec (difficulty-scaled, try-decayed, daily-capped, no
  streak/lesson contamination) and well isolated in pure logic.

**Cons**
- The adaptive engine's *math* is sound but its *calibration* is not — difficulty
  labels are uncalibrated guesses and the serving window points the wrong way for
  the 20–30% target.
- Two of the three flagship "gambler's fallacy" variants render a broken question.
- `retrievalForm` and same-domain interleaving — a headline learning-science lever
  in the spec — are declared but not exercised at serve time.
- Variety is uneven across topics (rich in `conditional`/`complement`, thin/clustered
  in `counting`/`distributions`).

---

## 6. Learning-science assessment

Spot-checks I verified by hand (all correct):
`monty-hall-n-doors` = (n−1)/(n(n−2)) (n=3→2/3, matches `simulate`);
`derangement-probability` Dₙ/n! via the (k−1)(D₍ₖ₋₁₎+D₍ₖ₋₂₎) recurrence;
`binomial-at-least-k` ΣC(n,i)/2ⁿ; `inclusion-exclusion-{two,three}-divisors` with
correct lcm bookkeeping; `without/three-draws` chained conditionals;
`geometric-first-success` ((m−1)/m)^(k−1)·(1/m); `expected-trials` m/k; EV die
(s+1)/2; `permutations-with-repetition` (BANANA 60, LEVEL 30, PEPPER 60, LETTER
180, SUCCESS 420); `committee-with-constraint` C(g,j)·C(b,k−j); `circular` (n−1)!;
creative coupon-collector 4·H₄=25/3, ballot (5−3)/(5+3)=1/4, odds/evens
(C(3,2)+C(4,2))/C(7,2)=3/7, last-one-standing 1−(31/32)³⁰≈0.61. **No solver error.**

Against the §8 principles:

- **Spaced retrieval** — strong in spirit (endless reps), but spacing is
  *intra-session* only; there's no cross-day review scheduling tie-in (deferred to
  v3). The delayed-retrieval bonus exists in Engine A (`learnerModel.ts:293`) but
  not in the serving choice.
- **Desirable difficulty ceiling (~20–30% miss)** — **the weakest link.** As §4
  shows, the window is biased above rating *and* the difficulty distribution is
  clustered/uncalibrated, so the actual miss rate is unlikely to sit at 20–30%
  without the (still-unbuilt) calibration pass. AC #9 already loosens this to
  15–40% and "tightens in v2," so this is an acknowledged gap, not a surprise.
- **Worked-example effect** — well realized: the `DerivationCard` always appears
  after a miss (and behind a disclosure after a correct answer per the renderer
  pattern), built from the same `solve`-derived quantities.
- **Interleaving (same domain only)** — partially realized: template-vs-concept
  interleave works, but the four-retrieval-form interleave is not implemented and
  3 topics have no concept-checks. Cross-subject mixing is correctly avoided.
- **20% drives 80%** — honored in authoring: the foundational families
  (sample space, complement, conditional, long-run, binomial) anchor the bank;
  edge/creative families sit in the harder bands.
- **Performance ≠ learning** — respected: mastery credit is try-weighted
  (`masteryCreditForTry`), so "right after two hints" reads as less mastery; a
  reveal earns nothing; the misconception slip-guard avoids over-reacting to a
  single trap hit.

**Opportunities** (highest leverage first): (a) re-center the serving window
*below* rating to actually hit the 20–30% ceiling, and calibrate `rate()` (even a
quick offline LLM anchor pass per the existing spec); (b) make `pickNextTemplate`
respect `retrievalForm` so a topic mixes definition→operation→procedural→
application; (c) add concept-checks for the 3 uncovered topics; (d) add a
cross-day spaced-review surface that re-queues surfaced misconceptions.

---

## 7. Prioritized recommendations

1. **(P1) Fix `gambler-fallacy-mc` flavors 0 & 2** — set the `hot` label to
   `'Less than 1/2'` so the two distractors differ and the hot-hand option points
   the right way. One-line change; user-visible.
2. **(P1) Implement retrieval-form interleaving** — have `pickNextTemplate` (or a
   thin wrapper) avoid repeating the last `retrievalForm` within a topic, closing
   AC 9.1-add #8.
3. **(P2) Re-center / calibrate adaptive serving** — shift the window to roughly
   `[r−250, r+50]` (target P(correct) ≈ 0.7–0.8) and land the offline difficulty
   annotation pass (`spec-ai-difficulty-annotation`) so the Elo scale is real. This
   is the single biggest learning-science win.
4. **(P2) Fill difficulty gaps + add concept-checks** for `counting`,
   `inclusion-exclusion`, `distributions` so every topic has both mid-band template
   coverage and a two-part round.
5. **(P2) Track `instanceId` (not just `templateId`) in anti-repeat** for
   low-cardinality families, or widen their param spaces, to cut identical re-serves.
6. **(P2) Repair the two under-specified creative prompts** — put the gem-pack
   distribution / dice faces into the statement (or drop them) so every served
   problem is solvable as written.
7. **(P3) Tidy doc-comment topic mismatches** and the "five topics" test comment.
