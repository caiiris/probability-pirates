# Spec: Misconception Capture & Reasoning Elicitation

> How the app **detects** a learner's probability misconceptions reliably, and how it **elicits reasoning** in a way that helps learning without degrading the practice loop or producing junk data. This is the design behind the `/progress` "Watch out for" section ([`spec-progress-insights.md`](spec-progress-insights.md) §S1), which today renders `model.misconceptions` but is fed by a very thin signal.
>
> Companions: [`spec-learner-model.md`](spec-learner-model.md) (the data store, two-engine split), [`spec-ai-assist.md`](spec-ai-assist.md) (the `/api/hint` closed-set classifier), [`spec-practice.md`](spec-practice.md) (the practice loop). Work breakdown: [`wp/wp-misconception-capture.md`](wp/wp-misconception-capture.md).
>
> Status: **design locked, unbuilt.** Supersedes the implicit "misconceptions come from sparse tagging" assumption.

---

## 1. The problem

The learner model already has a `misconceptions: { [key]: { count, lastSeenAt } }` field, and the Progress page surfaces it as "Watch out for." But in practice the section is almost always **empty**, because the signal feeding it is extremely thin:

| Source today | Mechanism | Coverage |
| --- | --- | --- |
| **Deterministic tags** | `misconceptionByValue` (number-fill) / `misconceptionByOption` (MC). A wrong answer that *exactly equals* a pre-authored trap value records the key. | Only **3 templates** carry tags (`pick-k-of-n-unordered`, `permutations-arrange-k-of-n`, `gambler-fallacy-mc`). |
| **LLM classification** | Conceptual "why" free-text classified against the problem's closed set in `/api/hint`. | Only the **4 topics** with conceptual problems; fires ~every 4th problem. |

So the highest-value insight in the product is starved of data. The goal of this spec is to make misconception detection **reliable, well-covered, and honest** — and to do it without turning the fast practice loop into a writing exercise.

## 2. What this is really about: two goals that must be decoupled

The central design realization (see §4 dialogue) is that we kept conflating two different goals:

- **Measurement** — *estimating which misconception a learner holds.* Must be reliable, precise, and fair across learners.
- **Learning** — *helping the learner reason better.* Self-explanation, prediction, and reflection all help here.

**These take different inputs and must not be forced to share one mechanism.** Self-explanation is fantastic *pedagogy* even when it's useless as *data*; a learner's wrong answer is great *data* even though it teaches nothing by itself. The design below uses **behavior for measurement** and **elicited reasoning for learning** (with reasoning contributing to measurement only as low-weight corroboration).

## 3. Grounding (learning science + ML)

What the design leans on, and what it deliberately avoids.

### Supports eliciting reasoning (for *learning*)
- **Self-explanation effect** (Chi et al., 1989/1994): prompting "why" improves retention and *transfer*.
- **Generation / prediction effect** (Slamecka & Graf, 1978; Kornell): committing to an answer/reason *before* feedback improves learning even when the commitment is wrong.
- **Hypercorrection effect** (Butterfield & Metcalfe, 2001): high-confidence errors, once committed and then corrected, are *more* likely to be fixed. → commit-then-contrast is powerful.

### Cautions against *forcing articulation everywhere* / trusting it as data
- **Cognitive load** (Sweller): a writing task on every item adds extraneous load and slows the retrieval rep that fluency practice depends on.
- **Expertise-reversal effect** (Kalyuga): explanation prompts help novices but become redundant/harmful for fluent learners → must **fade with mastery**.
- **Verbal overshadowing** (Schooler & Engstler-Schooler, 1990) and **Type-3 verbalization** (Ericsson & Simon): asking for *justification* can *alter or fabricate* the cognition rather than report it → forcing a "why" can manufacture a misconception that wasn't there (false positive).
- **Concurrent vs retrospective report** (Ericsson & Simon; Nisbett & Wilson, 1977): reasoning reported *after* knowing the outcome is reconstructed, not real → retrospective "why were you wrong" is contaminated.
- **Articulation ≠ understanding**: much novice probability judgment is intuitive/tacit (System 1; Kahneman); articulation ability confounds with language proficiency and verbal effort. Our audience is *young self-learners*, so free-text scoring would systematically mislabel weak *writers* as weak *reasoners* — a validity and equity failure.
- **Recognition > production**: people recognize the right explanation far more reliably than they produce it → prefer "pick the statement closest to your thinking" over a blank box.

### ML basis for the detection approach
- **Bug libraries / behavioral diagnosis** (Brown & Burton, *BUGGY/DEBUGGY*, 1978): misconceptions ("malrules") were historically and reliably inferred from **systematic error patterns**, not self-report. The deterministic trap value *is* a bug-library entry.
- **Slips vs. mistakes** (Norman, 1981; VanLehn): a wrong answer may be a careless execution **slip** despite correct understanding, not a systematic **mistake**. A single observation *cannot* separate the two — only **repetition** can. So no single event (not even a deterministic trap match) may assert a misconception; it must recur or be corroborated. This is the core tuning principle (§5 Step 2, D-MC5).
- **Constrained classification, not open clustering**: matching free text to a *closed* taxonomy is a textual-entailment task LLMs do well and calibratably; open clustering of free-text "tags" into emergent buckets is the hard, drift-prone part — **we avoid it at runtime**.
- **Evidence accumulation** (cf. Bayesian Knowledge Tracing): treat a misconception as a *latent variable* estimated from multiple weak signals with a confidence threshold, never asserted from one observation.

## 4. How we got here (design dialogue → decisions)

This design was reached by stress-testing each idea; recording it so the rationale survives.

1. **"Is the signal tagging or LLM-generated?"** → Both exist; both are thin. Tagging is deterministic but sparse; the LLM path is closed-set (good) but only on conceptual problems.
2. **"Could the LLM generate misconceptions? But bucketing free-text seems hard."** → Right to worry. **Decision D-MC1:** never cluster free text at runtime. Give the LLM the *closed taxonomy* and make it a pick-from-list classification (already how `/api/hint` works). Taxonomy growth happens **offline** by curating logged misses, not live.
3. **"Force a reasoning sentence — good pedagogy and good for matching."** → Half-right. **Decision D-MC2:** elicit reasoning, but **triggered + tiered + mastery-faded**, not universal (cognitive load, expertise reversal, flow).
4. **"Asking in retrospect is weird unless they can compare to a solution."** → Correct, and it invalidated "trigger on a wrong answer." **Decision D-MC3:** capture reasoning **concurrently** (bundled with the answer, *before* the verdict), triggered by *a-priori* signals (problem type, mastery, sampling) — never by correctness. Retrospective prompts are **reflection only**, shown *after* the worked solution, and are not used as data.
5. **"But ability to articulate is itself unreliable."** → The decisive critique. **Decision D-MC4 (inversion):** behavior is primary, words are corroboration. Rank the signals by reliability: (1) the wrong answer itself (deterministic trap), (2) cross-item error patterns, (3) recognition chips, (4) free text. Make the unreliable legs the *least* load-bearing.

## 5. The four-step capture hierarchy (the design)

Ordered by reliability and by build priority. Each later step is additive and optional.

### Step 1 — Behavioral inference is primary (deterministic traps) — *highest reliability, lowest cost*
For every template family, compute the **diagnostic wrong answer(s)** in code and tag them, so a wrong answer that matches maps to a misconception with **no articulation required** and **no LLM**.

- Examples to add across the bank:
  - without-replacement → the *with-replacement* value ⇒ `replacement_confusion`
  - addition×multiplication → the *multiplied groups* value ⇒ `add_vs_multiply`; the *added everything* value ⇒ (same or a structure key)
  - complement families → the *un-complemented* `P` value (forgot `1 − P`) ⇒ `complement_inversion`
  - permutations ↔ combinations → the swapped count ⇒ `ordered_vs_unordered` (already done for two families)
  - inclusion-exclusion → the *no-overlap-subtracted* sum ⇒ a new `forgot_overlap` key
- This is a **bug library**: the trap value is a malrule fingerprint. High precision (an exact numeric match is strong evidence).
- Requires expanding the closed taxonomy by ~2–4 keys (§6).

### Step 2 — Aggregate; never trust a single shot — *confidence, not raw counts*
Treat a misconception as a **latent variable**. Each observation carries a **source weight**; surface in "Watch out for" only past a **confidence threshold**. This is the **slip filter**: a misconception is systematic, so it must *recur or be corroborated*.

- Source weights (tuned, see D-MC5): `trap = 0.7`, `chip = 0.6`, `llm = 0.5`. Accumulate `score` (Σ weights) alongside `count`; surface when `score ≥ 1.0` (`SURFACE_THRESHOLD`).
- **No single observation surfaces** — even the strongest single signal (a deterministic trap) is 0.7 < 1.0. Surfacing needs **repetition** (2 traps = 1.4) or **corroboration** (trap + chip = 1.3; chip + chip = 1.2; …). A one-off is treated as a slip and stays latent.
- **Mastery slip guard (D-MC6):** when the learner is *already strong* on the problem's skill, a trap match is more likely a slip, so its `trap` weight is halved at **record time** (`SLIP_DISCOUNT = 0.5` → 0.35), read from mastery **before** this attempt updates it. (Record-time, not surface-time: the miss itself drags `recentCorrect` down, so a surface-time check would mis-read a strong learner as weak exactly when the guard should fire.)
- **Self-correction is already filtered upstream:** a misconception is recorded **only on the learner's final answer** (a correct solve records nothing; the trap is recorded only if it is the answer after the 3-try ladder). A trap entered then self-corrected never reaches the model — a built-in slip filter.
- Bias for **precision over recall**: a false "you have the gambler's fallacy" is worse than a miss.
- Recency: show "caught Nx recently"; sort by score then recency.

### Step 3 — Recognition over production (reasoning chips) — *concurrent, language-light*
When reasoning is elicited, default to **"which is closest to your thinking?"** chips, mapped to misconception keys, captured **concurrently** (with the answer, pre-verdict).

- Sidesteps the articulation-ability confound (recognition ≫ production), minimal friction, deterministic mapping (no LLM, source `chip`).
- **Triggering (a-priori, mastery-faded):** conceptual problems → always (existing "why"); computational → fire when (skill mastery is low/shaky) OR (problem carries a trap) OR (sampled at rate `p`), and **fade out as Elo rises**. Never triggered on correctness (unknown at capture time).
- Catches **right-answer-wrong-reason** because it runs before the verdict, including on correct answers.

### Step 4 — Free text as optional enrichment — *richest, least reliable; lowest weight*
An optional "in your own words" box escalates to the existing closed-set `/api/hint` classifier.

- Constrained to the problem's closed set; must be allowed to return **`insufficient`/`irrelevant`** and bias toward `null`. Terse junk ("idk", "guessed") ⇒ no attribution.
- Source weight `llm = 0.5`; never the sole basis for a surfaced misconception (needs corroboration via the threshold).

### Cross-cutting: post-solution reflection (learning only, not data)
After the worked solution is revealed (we already generate `explain()`), optionally show **"here's the path — where did yours differ?"**. This is the *retrospective* moment, used purely for repair/hypercorrection; **never recorded** as a misconception signal.

## 6. Taxonomy additions

Current closed set (`src/content/misconceptions.ts`): `gambler`, `ordered_vs_unordered`, `conjunction`, `base_rate_neglect`, `complement_inversion`.

Add (each needs `label`, `description`, `fix`, `relatedSkills` per the enriched content shape):

| Key | Mistake | Likely related skills |
| --- | --- | --- |
| `replacement_confusion` | Treats draws *without* replacement as independent (denominator doesn't shrink). | `conditional-probability`, `independence` |
| `add_vs_multiply` | Adds when stages should multiply (AND/OR confusion) or vice-versa. | `multiplication-principle`, `addition-principle` |
| `forgot_overlap` | Adds set sizes without subtracting the intersection (inclusion-exclusion). | `inclusion-exclusion` |

Keep the set **small and curated**. New keys are added by humans (offline curation of logged misses), never invented at runtime.

## 7. Contracts (frozen — see WP doc for full signatures)

- **C-MC1 — Taxonomy**: the enriched `MISCONCEPTIONS` entries + the new keys above.
- **C-MC2 — Diagnosis**: `diagnoseWrongAnswer(variant, payload): MisconceptionKey | null` (centralizes today's inline derivation in `PracticeSession.resolve`). Templates expose trap values via existing `misconceptionByValue`/`misconceptionByOption`.
- **C-MC3 — Confidence model**: learner-model misconception record becomes `{ count, score, lastSeenAt }` (back-compat: missing `score` ⇒ `count × trapWeight`); `applyPracticeAttempt` accepts `misconceptionSignal?: { key, source }`; a pure selector `surfacedMisconceptions(model, threshold)` powers the panel.
- **C-MC4 — Reasoning options**: optional `reasoningOptions?: { id; label; misconceptionKey?: MisconceptionKey }[]` (one "sound" option, others mapped), with a per-skill default bank fallback; chip selection records source `chip`.
- **C-MC5 — Triggering**: pure `shouldElicitReasoning({ topic, skills, masteryBySkill, hasTrap, rng }): boolean`, mastery-faded + sampled. Testable in isolation.

## 8. Phasing

- **Phase 1 (biggest win, no AI):** Step 1 (trap tagging across the bank) + §6 keys + Step 2 (confidence threshold). Fills "Watch out for" reliably with zero latency/cost. *(WP-MC-A, B, C.)*
- **Phase 2:** Step 3 (recognition chips + concurrent capture + triggering). *(WP-MC-D, E-triggering.)*
- **Phase 3:** Step 4 (free-text enrichment, conservative) + post-solution reflection. *(WP-MC-E, F.)*
- **Phase 4 (later, offline):** taxonomy-growth loop — log raw "why" text, batch-review misses, promote recurring patterns into the closed set by hand.

## 9. Acceptance criteria

1. Every template family in the bank tags at least one diagnostic wrong answer (where a meaningful one exists) via `misconceptionByValue`/`misconceptionByOption`, verified by tests.
2. The learner-model misconception record carries a weighted `score`; `surfacedMisconceptions` returns only items above threshold; back-compat with existing `{count,lastSeenAt}` docs.
3. "Watch out for" surfaces a misconception only on **repetition** (≥2 trap hits) or **corroboration** (trap + a soft signal); a **single** trap match — and any single soft signal — stays latent (slip filter). A strong learner's trap match is discounted further.
4. Reasoning is captured **concurrently** (pre-verdict), **a-priori-triggered**, and **faded by mastery**; never triggered by correctness.
5. Chips (recognition) are the default elicitation; free text is optional and never the sole basis for a surfaced misconception.
6. Correctness stays **code-verified**; the LLM only classifies the "why" against the closed set and may return `insufficient`.
7. Post-solution reflection issues **no** misconception writes.
8. Pure functions (`diagnoseWrongAnswer`, `surfacedMisconceptions`, `shouldElicitReasoning`) have unit tests; UI pieces have RTL tests.

## 10. Decisions & alternatives

- **D-MC1 — Closed-set classification, never runtime clustering.** Chose constrained pick-from-taxonomy. Rejected free-text clustering (drift, needs embeddings + thresholds + human review of clusters; unreliable). Taxonomy grows offline.
- **D-MC2 — Triggered/faded elicitation, not universal.** Chose mastery-faded, sampled prompts. Rejected "every problem" (cognitive load, expertise reversal, flow/motivation collapse on mobile).
- **D-MC3 — Concurrent capture; retrospective is reflection-only.** Chose pre-verdict capture for clean data + commitment/hypercorrection. Rejected retrospective "why were you wrong" as data (hindsight reconstruction, failure framing).
- **D-MC4 — Behavior-first inversion.** Chose answer-pattern (trap) as the primary, highest-weight signal; words as corroboration. Rejected articulation-as-primary (verbal overshadowing, language confound, unfair to young/ESL learners).
- **D-MC5 — Repetition/corroboration threshold (the slip filter).** Chose weighted latent-variable estimation where **no single observation surfaces**: `trap = 0.7 < SURFACE_THRESHOLD = 1.0`, so a misconception needs repetition (2 traps = 1.4) or corroboration (trap + chip = 1.3). Grounded in slips-vs-mistakes (Norman, 1981) and bug-pattern diagnosis (Brown & Burton; VanLehn) — a misconception is systematic; a one-off arithmetic slip is not. *Considered and rejected:* (a) single-trap-surfaces (`trap = 1.0`) — the original tuning; rejected because a dumb calculation error that happens to land on the (most-natural) trap value would falsely assert a misconception; (b) raw `count ≥ 1` — same over-claim, ignores signal quality.
- **D-MC6 — Mastery slip guard, applied at record time.** A trap match from a learner *already strong* on the skill is more likely a slip, so its weight is halved (`SLIP_DISCOUNT = 0.5`). **Chose record-time** weighting, read from mastery *before* the attempt's update. *Considered and rejected:* (a) a **surface-time** mastery threshold — rejected because the recency-weighted accuracy (`recentCorrect`, EMA α=0.2) is dragged down by the very miss being judged, so a previously-strong learner reads as not-strong exactly when the guard should fire (self-defeating); (b) **rating-based** gate at surface time — Elo is stickier but climbs slowly at K=24, making a "strong" band hard to calibrate without data; deferred. The record-time approach uses the accurate pre-miss snapshot the code already holds. *Trade-off accepted:* the policy is baked into the stored `score` (not re-tunable post-hoc), justified because the miss's context (was the learner fluent?) is legitimately part of the evidence.
- **D-MC7 — Reasoning as the eventual slip/bug disambiguator (Wave 2/3).** The answer alone is ambiguous; *answer + reasoning* resolves slip vs. bug directly (wrong-on-trap with sound reasoning = slip → don't flag; wrong-on-trap with the matching faulty reasoning = real misconception). This is a primary justification for the recognition-chip / free-text layer beyond coverage. Until then, repetition + the mastery guard + final-answer-only recording carry the precision.

## 11. Out of scope

- Open-vocabulary / emergent misconception discovery at runtime (offline curation only — Phase 4).
- A full BKT/IRT psychometric model (the weighted-score threshold is the intentionally simple stand-in).
- Spaced-review scheduling driven by misconceptions (Phase 3+ of the broader roadmap).
- Changing the two-engine learner-model split (Engine A practice / Engine B lessons) — unchanged here.
