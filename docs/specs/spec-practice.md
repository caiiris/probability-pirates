# Spec: Practice (Alcumus-style adaptive practice)

> An endless, adaptive problem set — inspired by AoPS **Alcumus** — where problems
> are effectively unlimited and **every problem + solution is vetted for
> correctness before a learner ever sees it**. Lives under `src/features/practice/`.
> Currently shipped as a locked nav stub (alternatives **D85**); this spec defines
> the real feature. The LLM-dependent tracks reopen the "no AI in MVP" decision
> (alternatives **D23**).

## Purpose

Give learners unlimited, right-sized practice on a chosen topic — solve, get
immediate feedback + a worked solution, and have the difficulty track their
ability so they're always working at the edge of competence. Alcumus is the
north star: pick a topic, keep solving, the system adapts.

The product promise is **two things at once**: _unlimited_ (so a learner never
runs out of reps) and _trustworthy_ (so the app never teaches a wrong answer).
Those two goals are in tension — unlimited pushes toward generation, trustworthy
pushes toward control. The whole architecture below exists to satisfy both.

### Learning-science rationale

- **Desirable difficulty / zone of proximal development.** Practice at the edge of
  ability (not too easy, not crushing) maximizes learning. Adaptive difficulty
  (§ Adaptive difficulty) keeps the learner there.
- **Retrieval practice + spacing.** Repeated active retrieval on a topic, spaced
  over time, builds durable memory. An endless bank makes spaced retrieval
  practical.
- **Immediate feedback + worked solutions (learning from errors).** A correct,
  fully worked solution shown right after an attempt is one of the highest-leverage
  learning events — which is exactly why a _wrong_ solution is so damaging, and why
  correctness vetting is non-negotiable.
- **Autonomy (SDT).** The learner chooses the topic and keeps control of pace.

## Non-negotiable principle: correctness

**An unvetted problem or solution must never reach a learner.** A teaching tool that
hands out a wrong answer key actively miseducates and destroys trust. Every other
design choice yields to this one.

Corollary — **the answer must come from code, not from an LLM.** The subject (HS
probability / combinatorics) is _computable_: answers are exact rationals or small
integers that a deterministic program can compute and verify. So the source of
truth for any answer is a solver, never a language model. LLMs are used (if at all)
to author _problems_ and _prose_, never to be the final arbiter of _correctness_.

> **Why not LLM-verifies-LLM as the gate?** Two models share training data and
> failure modes — they will confidently agree on the same wrong answer (correlated
> errors). An LLM verifier is a useful cheap _pre-filter_, but it is never the
> correctness gate.
>
> **Why not Lean / formal proof?** Wrong tool for a computable numeric domain. Lean
> proves theorems; we need to check that a computed number is the correct answer to
> a word problem. Autoformalization is itself error-prone, and a ~20-line exact
> solver is a sufficient correctness oracle here. (Revisit only if proof-style
> problems are ever added — out of scope.)

## Architecture: two tracks

### Track 1 — Parameterized generators (correct _by construction_) — **the Friday MVP**

A **template** is a hand-/LLM-authored problem family with code that computes its
own answer. Example: "two fair dice, P(sum = k)" with `k` a parameter.

A template (`src/features/practice/templates/*.ts`) declares:

- `id`, `topic`, a difficulty rating (or a function of params → rating).
- `sample(rng) → params` — draws a valid parameter set.
- `render(params) → { prompt, choices? }` — the problem statement (reuses the
  existing `{a/b}` Fraction template and interaction kinds from D29).
- `solve(params) → ExactAnswer` — the deterministic answer, as an exact rational
  (bigint numerator/denominator) or integer. **This is the source of truth.**
- `explain(params) → DerivationSteps` — the worked solution, built from the same
  computed quantities (reuses the D77 `derivation` shape).
- _(optional)_ `simulate(params, trials) → estimate` — a Monte-Carlo estimator used
  only to vet the template (see below).

**Why this is correct by construction:** at runtime we `sample → render → solve`.
No LLM is in the answer path, so every generated instance is exactly right. "Unlimited"
comes from the parameter space; "correct" comes from `solve()` being plain code.

**Template vetting (build-time, once per template):**

- Unit test: for ≥1,000 sampled param sets, assert `solve()` agrees with
  `simulate()` within a Monte-Carlo tolerance (`|p̂ − p| < 5·√(p(1−p)/n)` and exact
  cases enumerated where the sample space is small). This catches a buggy `solve()`.
- Human review of the template + a rendered sample before it ships.
- Templates are code in the repo → they go through normal review + CI (D40), same
  as lesson content (D35).

LLM's role here: **accelerate authoring templates** (draft `render`/`explain` prose,
propose new families). A human + the simulation test sign off. The LLM never
computes a served answer.

### Track 2 — Free-form LLM-generated bank (variety, heavily gated) — **post-Friday**

For variety beyond what templates express, an LLM generates one-off problems
**offline, in batches**, and each candidate must clear an independent gauntlet
before being added to the bank:

1. **Structured output.** The model returns `{ prompt, answer, solution, and an
executable solver snippet }` in a strict schema.
2. **Independent code verification (the gate).** Run the solver snippet in a sandbox
   **and** an independent reference computation (exact enumeration / rational
   arithmetic) **and** a Monte-Carlo cross-check. All must agree on `answer` within
   tolerance. Disagreement → reject.
3. **Well-posedness checks.** Single unambiguous answer, no under-/over-specification,
   numbers in sane ranges, answer matches the asked quantity/units.
4. **Second-model pre-filter + self-consistency** (cheap filters, not the gate):
   regenerate the answer N times; a different model critiques. Reduces load on the
   code gate; never replaces it.
5. **Safety / age-appropriateness** content filter.
6. **Human spot-check** of a random sample of each batch before publish; track the
   batch's measured defect rate.

Only candidates passing **1–5** (and sampled into 6) are written to the vetted bank.
**Code agreement (step 2) is the gate; the LLM verifier is only a pre-filter.**

> Generation/verification tooling lives in `scripts/practice/` (Node, offline) — it
> is **not** shipped in the client bundle and makes no runtime model calls.

## Runtime model

- **No live LLM calls at request time.** The app serves from pre-vetted sources:
  Track 1 generates instances client-side from in-repo templates (code, instant);
  Track 2 reads vetted problems from a bank.
- This keeps latency instant, cost bounded, and removes the runtime prompt-injection
  / jailbreak surface. (Generation cost is paid offline, once, per batch.)

## Data model

- **Track 1** needs no problem storage — instances are generated from code templates
  on device. Only the _attempt outcome_ feeds adaptive state.
- **Track 2** vetted bank: `practiceProblems/{problemId}` (public-read, no client
  writes; populated only by the offline pipeline) with `topic`, `rating`, `prompt`,
  `choices?`, `answer`, `solution`, `provenance` (template id or generation batch +
  verification record).
- **Per-user practice state:** `users/{uid}/practice/{topicId}` —
  `{ rating, attempts, correct, lastSeenProblemIds[], updatedAt }`. Owner-only
  read/write (Firestore rules), consistent with the rest of `users/{uid}`. No PII;
  if a public surface is ever wanted, mirror to `publicProfiles` like D80 — out of
  scope here.

## Adaptive difficulty

- Each problem (or template-instance) has a **difficulty rating**; each learner has a
  **per-topic rating**. Serve problems near the learner's current rating (slightly
  above for desirable difficulty).
- Update ratings on each attempt with a lightweight Elo/Glicko-style rule (correct →
  rating up, harder if the problem was hard; incorrect → down). Tunable constants,
  not validated yet (flag as a risk).
- Avoid immediate repeats via `lastSeenProblemIds` / recent-params memory.
- This mirrors Alcumus's rating-based progression; full IRT calibration is out of
  scope for the first version.

## User-facing behavior

- `/practice`: choose a **topic** (mapped to the existing lesson concepts:
  basic probability, counting/combinatorics, conditional probability, …).
- Solve loop: see a problem → answer (reusing existing interaction kinds) → immediate
  correct/incorrect feedback → a fully **worked solution** (D77 derivation shape) →
  "Next problem". Endless until the learner stops.
- Lightweight session signals: streak of correct-in-a-row, count solved, current
  topic rating trend.
- **XP integration (decided):** a correct practice problem awards a small, flat
  amount of XP (`PRACTICE_XP_PER_CORRECT = 5`, vs. a lesson's first-try 10),
  **capped per local day** (`PRACTICE_DAILY_XP_CAP = 100`, ~one lesson / ~20
  problems). Practice XP feeds **total XP (levels) and weekly XP (leaderboard)**
  so XP keeps paying off between content drops, but it does **not** tick the daily
  streak and is **not** counted as a completed lesson — the streak stays tied to
  the core daily goal so practice can't substitute for the path. The cap policy
  is pure, tested logic in `src/lib/practiceXp.ts` (`grantPracticeXp`); the solve
  loop calls it and persists the returned per-day state.
- Empty/again-later states handled like the rest of the app.

## Security & safety

- Per-user practice state is owner-only (Firestore rules), like `users/{uid}`.
- `practiceProblems` is read-only to clients; only the offline pipeline (privileged)
  writes it. No client path can inject an unvetted problem.
- No model API keys in the client build (preserves the D23 §9.10 "no AI in bundle"
  property for the _shipped app_ even after the offline pipeline exists). Keys live
  only in the offline tooling environment.

## Acceptance criteria

1. A learner can pick a topic and solve an unbounded sequence of problems, each with
   immediate feedback and a worked solution.
2. **Every served problem's answer is computed by code** (Track 1) **or** was gated by
   independent code verification before publish (Track 2). No served answer originates
   from an unverified LLM output.
3. Track 1 templates have a passing build-time test that `solve()` matches simulation
   over ≥1,000 sampled params (and exact enumeration where feasible).
4. Difficulty adapts: a learner answering correctly trends toward harder problems and
   vice-versa, within a topic.
5. The shipped client bundle contains no model SDK or API key (`git grep` clean, per
   the D23 §9.10 check).
6. Per-user practice state is owner-only; clients cannot write `practiceProblems`.

## Phasing

- **Friday (v1):** Track 1 only — a handful of parameterized topics, generated
  client-side from in-repo templates, served from code (no Firestore bank, no runtime
  LLM), with rating-based adaptive serving and worked solutions. Correctness is
  guaranteed by construction. Unlock the nav item.
- **v2:** Track 2 offline generation+verification pipeline (`scripts/practice/`),
  vetted `practiceProblems` bank, batch publishing with defect-rate tracking.
- **v3:** Better calibration (IRT), more topics, cross-topic mixed sets, optional
  spaced-review scheduling tie-in with `/progress` (D84).

## Out of scope

- Live, per-request LLM generation (latency/cost/safety — always offline + vetted).
- Lean / formal proof verification for the numeric core (wrong tool; revisit only for
  future proof-style content).
- Proof-based or open-response problems (numeric / multiple-choice / structured only
  for v1–v2).
- Multiplayer / timed competitive practice (Phase 3+).
- Using the practice rating as a public/social ranking (keep it private; revisit with
  D24/D80 framing if ever wanted).

## Open questions

- ~~**XP/streak interaction:**~~ **Resolved** — practice awards a small, flat,
  daily-capped XP (`lib/practiceXp.ts`: 5/correct, 100/day) that feeds levels +
  weekly XP but does **not** tick the streak or count as a lesson. See
  "XP integration (decided)" above.
- **Daily-cap data model:** persist the per-day counter as
  `users/{uid}.practiceXp = { date, earnedToday }` (owner-only, mirrors the rest
  of `users/{uid}`). Resets when `date` rolls over (handled by `grantPracticeXp`).
- **Topic taxonomy:** reuse lesson ids directly, or a finer-grained skill tree?
- **Track 2 acceptable defect rate** and human-review sampling rate before a batch may
  publish.
- **Generation cost ceiling** per topic/batch, and whether a curated seed bank anchors
  generation.
