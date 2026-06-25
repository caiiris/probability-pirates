# Phase 2 — Brainlift (outline)

> The brief's required artifact: a record of _what we considered, what we shipped, and what we deliberately left out_ for Phase 2 AI. This file is the outline. Full reasoning lives in [`docs/alternatives.md`](alternatives.md) **D92–D98** (and the amended **D23**); the user-facing contract lives in [`docs/prd-phase2.md`](prd-phase2.md). This outline is for the grader / reader who wants the "why" at a glance.

---

## Mission (one paragraph, for the top)

Pascal's Phase 2 added an AI layer that is **grounded** (every feature reads structured lesson state, never raw text), **verified** (every served number comes from a code solver, never the model), and **additive** (the MVP keeps teaching with AI turned off). The headline win for our audience — motivated young self-learners new to probability — is _the course never runs dry, and every wrong answer gets explained in terms of what they actually did_. We deliberately did not bolt on a chatbot.

---

## What we shipped

| # | Feature | What it is | Why it helps the persona |
| --- | --- | --- | --- |
| F1 | **Track 1 adaptive practice** | Unlimited probability problems generated client-side from in-repo parameterized templates. `solve()` is plain code; the answer is correct by construction. Difficulty adapts per skill (Elo-like) with a target ~20–30% miss rate. | A motivated self-learner finishes 5 lessons in a week. Without unlimited practice the course visibly runs dry. |
| F2 | **Personalized hint / wrong-answer explanation** | A Vercel serverless function calls Gemini via plain `fetch` (no SDK), grounded in the learner's actual `answerPayload` + weak skills + the **code-verified correct answer**. Never reveals the answer in hint mode. Hand-written fallback when AI is off. | Specific feedback — "you fell for the gambler's fallacy" — beats generic "Try again," especially for an insecure first-timer. |
| F3 | **Per-learner mastery model** | Owner-only `users/{uid}/learnerModel/state` doc: per-skill Elo + recency-weighted accuracy + misconception counts. Materialized from the existing append-only `stepAttempts` log. Drives F1 difficulty + topic suggestion + F2 personalization, and surfaces a "Strengths / keep working on" panel. | Makes the adaptation _visible_. The learner sees the app respond to them, which closes the loop. |

If time permits (stretch):

| # | Feature | What it is |
| --- | --- | --- |
| F4 | **Teach the recruit** (protege effect, done safely) | Learner tutors a green crew-member; the LLM is the _student, not the judge_. Structured-JSON mapping onto a hand-authored rubric (3–5 key points), one Socratic follow-up, then a **code-verified transfer problem decides "got it."** Misconceptions log to F3. AI-off fallback shows the rubric as a self-check. |
| F5 | **Offline vetted problem bank + end-of-session AI recap** | A small `scripts/practice/` pipeline asks Gemini to draft batches offline; each candidate is gated by `solve()` + Monte-Carlo agreement; survivors land in a public-read `practiceProblems/` collection. The "AI recap" is one call grounded in the learner model ("complements: solid; gambler's fallacy got you twice — queued"). |

---

## What we considered (and rejected, with the reason)

| Considered | Rejected because | Pointer |
| --- | --- | --- |
| **An open chatbot** ("ask Pascal anything") | Off-topic surface, no structured state to ground in, exactly the failure mode the brief warned against ("don't bolt on a chatbot"). For an insecure first-timer, an unbounded chat is more confusing than helpful. | D96, prd §10 |
| **RAG / embeddings / vector DB** | The corpus is 5 lessons of structured TypeScript — the relevant context is always "this slot + this learner," which we inject directly. Retrieval has nothing to retrieve. Adds infra + a new failure mode for zero benefit. | D97 |
| **Full lesson-path reordering by AI** | Each Phase 1 lesson is sequenced so the previous tool _breaks down_ (counting → simulation → combinatorics → birthday paradox → conditional → distributions). Reordering destroys the pedagogy. Adaptivity lives in practice difficulty + topic auto-suggest + hint targeting, not curriculum order. | prd §10, D94 |
| **Live per-request problem generation by the LLM** | Cost, latency, prompt-injection surface, and — fatally — no correctness gate. Track 1's code-computed `solve()` gives "unlimited" without the "wrong" risk. | spec-practice §"Non-negotiable principle" |
| **Firebase AI Logic / on-client Gemini SDK** | Tempting (already in our workspace skills), but puts a model SDK in `package.json` / the bundle and weakens the "code computes the answer first, then grounds the prompt" pattern. Breaks PRD §9.10 AC #1's literal property. | D93 |
| **Firebase Cloud Functions (Blaze)** | Would require a credit card and a second backend. Vercel Hobby has the same shape, free, already in the deploy pipeline. | D92 |
| **A model SDK (`@google/generative-ai`) in the function** | Even server-side it adds a model SDK to `package.json`; we preserve the "no SDK" property by calling Gemini via plain `fetch` to the REST endpoint. | D93 |
| **LLM as final grader of free-text explanations** | Sycophancy gives false signals of mastery; the notes explicitly warn that "learners are poor self-judges" — flattery becomes harmful. Two LLMs share training data and agree on the same wrong answer. We use the LLM only to map onto a hand-authored rubric + closed-set misconception enum; correctness comes from the transfer problem's `solve()`. | D96 |
| **Bayesian Knowledge Tracing / Deep Knowledge Tracing / IRT** | Right tools for a richer Phase 3. Phase 2's data volume won't calibrate them; Elo + accuracy + misconception counters are sufficient _and_ interpretable. | D94 |
| **Scrape problems from textbooks and "change the numbers"** | Copyright (a numbers-changed problem is still a derivative work; substantial similarity survives the edit); the human vetting that made the original good evaporates the moment you mutate it; and our `solve()` oracle gives a _stronger_ guarantee per-instance than textbook vetting did once. We took the legitimate path: textbooks inspire which families to build; we author template prose ourselves and verify with code. | spec-practice §"Phase 2 — Track 1 implementation specifics", D97 |
| **Auto-discovering misconceptions via embedding clustering** | "No taxonomy maintenance" at the cost of explainability. For an app whose USP is "the math is right," a hand-authored, debuggable closed enum wins. | D97 |
| **Reverting PRD §9.10 AC #1 entirely** ("OK, ship Gemini in the client") | Defeats the deliberate property: every PR can be `git grep`'d to verify no SDK in bundle. Vercel + `fetch` keeps the property literally true. | D23 amendment, D93 |
| **Streaming responses for hints** | Single-shot JSON wins for a 1–3 sentence hint; streaming buys little and complicates schema validation + parse-fail fallback. | spec-ai-assist §"Out of scope" |
| **Multi-turn chat with the recruit** | Multi-turn lets the model drift; one turn + a transfer problem keeps the surface bounded and falsifiable. | spec-ai-assist §"API contracts" |

---

## What we deliberately left out (for v1, with what would change our mind)

| Left out for v1 | What we'd want to see before adding |
| --- | --- |
| Open chatbot tutor | A clear pedagogical role we can't already serve with hint/explain/teach. (We don't expect to find one.) |
| RAG / vector retrieval | The lesson corpus growing 10× so "find a similar example from another lesson" becomes a real need. |
| Lesson-path reordering | Multiple equally-valid Phase 3 curriculum branches where reorder is a feature, not a bug. |
| Live per-request LLM problem generation | A verifier strong enough to gate per-request output in <100ms. (The offline path is sufficient.) |
| BKT / DKT / IRT | Enough attempt volume to calibrate the parameters; current scale doesn't support it. |
| Public mastery leaderboard | Per-skill ratings on a public surface (consistent with Phase 1's social posture: cosmetic / engagement signals, not academic ones). |
| Real-time spaced-review queue | A learner who returns after a long gap and we can see retention dropping without intervention. |
| Profanity / safety post-filter beyond Gemini's built-in | Evidence of an offensive output Gemini's safety layer missed. |

---

## How we know it's safe (the verification story)

This is the part the grader should be able to reproduce in five minutes.

1. **The answer comes from code.** Every served number in F1 (practice) and every "ground truth" passed into the F2 prompt comes from `solve()` in [`src/lib/probability/exact.ts`](../src/lib/probability/exact.ts) (exact `Fraction` over bigints + small combinatorics).
2. **The solver is cross-checked.** Each Track 1 template ships a CI test asserting `solve()` agrees with `simulate()` over ≥1,000 sampled parameter sets (Monte-Carlo tolerance `5·√(p(1−p)/n)`), with exact enumeration where the sample space is small. CI blocks merge on disagreement.
3. **No model SDK in the bundle.** `npm ls` and `git grep` over `dist/` are clean. The Gemini key is a Vercel-only env var.
4. **The model never speaks numbers.** Both functions compute `solve()` first and pass it into the prompt as ground truth. System prompts forbid revealing the answer in hint mode; parsers reject any answer-revealing output as malformed.
5. **AI-off works end-to-end.** Flip `VITE_AI_ENABLED=false`: a learner can complete a full lesson and a 10-problem practice session with only hand-written copy. Demoable live.
6. **No PII leaves the client.** Request bodies carry structured slot/template data + an anonymized attempt + a learner-model summary. No name, no email, no `uid` (server attaches uid from the verified token for rate limiting only).

---

## The learning-science levers we leaned on

(Refining ambition with discipline — these aren't decorations, they're why we built _these_ features and not others.)

- **Retrieval is the learning process, not a test of it.** F1 is spaced retrieval; F2 forces retrieval of the corrected idea; F4 is teaching, the strongest retrieval mode known.
- **Desirable difficulty has a ceiling.** F1's adaptive target is ~20–30% miss, _not_ "hardest possible" — failure >50% demotivates.
- **Performance ≠ learning.** F3 weights _delayed_ retrieval (returning after a gap) higher than first-try-after-teaching. Engagement and time-on-task are not mastery signals.
- **Worked-example effect.** Practice always renders `explain()` after a miss; F2 explanation mode shows the worked solution alongside the model's tuned phrasing.
- **Pretrieval (guess-before-learn).** Phase 1's `commitOnce` slots are kept; Phase 2 doesn't dilute them.
- **Chunking / 4–7 working-memory limit.** Phase 2 adds no on-screen complexity inside a slot; surfaces live in existing after-2-strikes affordances.
- **Interleaving — within domain only.** F1 interleaves skill types within probability; never cross-subject.
- **20% drives 80%.** Foundational skills (sample space, complement, conditional, long-run share) get templates first; edge topics later.
- **Cognitive debt risk.** Hints never reveal answers; teach-the-recruit never grades holistically. The learner does the thinking; the LLM phrases the nudge.

---

## Open risks we're carrying knowingly

- **Free-tier prompts may train Google's models.** Acceptable because payloads carry only structured slot data + anonymized attempts (no name/email/uid). Documented in D95.
- **Gemini free-tier rate limit** (≈10 RPM / 1,500 RPD per project) is per-project, not per-user. A burst would hit the ceiling; we fall back to hand-written copy on 429 without UI disruption.
- **Mastery math constants** (`K = 24`, `ALPHA = 0.2`, delayed-retrieval bonus cap 1.5×) are first-cut; tune with real attempt data.
- **Misconception coverage is bounded by the closed enum.** Novel misconceptions outside the enum aren't detected until we add a key.
- **Adaptive serving with a small template surface** could feel repetitive in long practice sessions. Mitigation: parameter space per template is large; topic-cycling at the engine level.

---

## What changed in the PRD

Phase 1 PRD properties preserved:

- **AI-off works.** Inherits Phase 1's hand-written feedback as the fallback.
- **Bundle is clean.** No model SDK in `package.json`; no key in the build.
- **Lesson-level state machine** (`not_started` / `in_progress` / `completed`) unchanged.
- **No bail-out** (D55) unchanged — the hint never unlocks the Continue CTA.

Phase 1 PRD properties intentionally reversed:

- **§9.10 AC #1 "no runtime AI"** → reversed (with the bundle/key property kept literally). See **D23 amendment** + **D92–D98**.
- **§9.10 AC #8 "no mastery scoring"** → reversed _partially_ (per-skill rating in; lesson-level state machine unchanged). See **D94**.

---

## Companion files (for the grader)

- [`docs/prd-phase2.md`](prd-phase2.md) — Phase 2 PRD (the user-facing contract).
- [`docs/specs/spec-practice.md`](specs/spec-practice.md) — extended with Phase 2 Track 1 specifics.
- [`docs/specs/spec-learner-model.md`](specs/spec-learner-model.md) — new.
- [`docs/specs/spec-ai-assist.md`](specs/spec-ai-assist.md) — new.
- [`docs/alternatives.md`](alternatives.md) — D92–D98 (the new section "M. Phase 2 — AI") and the **D23 amendment**.
- [`docs/design-iterations.md`](design-iterations.md) — dated Phase 2 entry summarizing this plan.
