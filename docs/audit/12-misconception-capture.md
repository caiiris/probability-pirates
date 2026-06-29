# Audit 12 — Misconception Capture & Wrong-Answer Diagnosis

> **Scope:** the misconception taxonomy, the deterministic wrong-answer diagnoser, the per-variant trap mappings, and how a captured misconception flows into the learner model (Engine B), the "Watch out for" panel, the lesson report card, and the F2 hint.
> **Method:** read-only static audit against `tsc`/`eslint`/`vitest`-clean ground truth (suite not re-run). Trap math spot-checked by hand across 6 representative families.
> **Primary files:** `src/content/misconceptions.ts`, `src/features/practice/diagnoseWrongAnswer.ts`, `src/content/types.ts`, `src/features/learner/learnerModel.ts`, `src/features/learner/StrengthsPanel.tsx`, `src/features/practice/PracticeSession.tsx`, `src/features/practice/ConceptualRound.tsx`, `api/_lib/prompts.ts`, the 30 template families under `src/features/practice/templates/`.
> **Design refs:** `docs/specs/spec-misconception-capture.md`, `docs/specs/wp/wp-misconception-capture.md`, `docs/prd-phase2.md`.

---

## 1. Overview

### 1.1 The taxonomy

`src/content/misconceptions.ts` defines a **closed set of 9 keys**, each with `{ label, description, fix, relatedSkills }`:

| Key | Friendly label | What it names | Wired as a trap? |
| --- | --- | --- | --- |
| `gambler` | Gambler's fallacy | Past independent results change the next outcome | ✅ practice + conceptual |
| `ordered_vs_unordered` | Treats unordered as ordered | Counts arrangements when only the selection matters | ✅ practice + conceptual |
| `conjunction` | Conjunction fallacy | P(A and B) rated above P(A) or P(B) | ❌ **orphan — never diagnosed** |
| `base_rate_neglect` | Ignores the base rate | Judges from test accuracy, ignores prevalence | ✅ practice + conceptual |
| `complement_inversion` | Confuses event with complement | Uses P when 1 − P is needed | ✅ practice + conceptual |
| `replacement_confusion` | Ignores "without replacement" | Treats dependent draws as independent | ✅ practice |
| `add_vs_multiply` | Adds when it should multiply | AND/OR ↔ ×/+ confusion | ✅ practice |
| `forgot_overlap` | Forgets to subtract the overlap | Inclusion–exclusion double-count | ✅ practice |
| `arrange_without_selecting` | Arranges without selecting | Computes k! instead of P(n,k) | ✅ practice |

The closed set is enforced at the boundary: `applyPracticeAttempt`/`surfacedMisconceptions` ignore keys not in `MISCONCEPTIONS` (`learnerModel.ts:419`), and `assertLessonInvariants.ts:167-178` rejects unknown `misconceptionByOption` keys at lesson-load time. `MisconceptionKey = keyof typeof MISCONCEPTIONS`, so trap maps are type-checked.

> Note: the spec/WP froze **8** keys (the original 5 + `replacement_confusion`, `add_vs_multiply`, `forgot_overlap`). The shipped set adds a 9th, `arrange_without_selecting`, which is reasonable and well-built but was introduced outside the frozen contract list — a documentation drift, not a defect.

### 1.2 The diagnosis flow

`diagnoseWrongAnswer(variant, payload): MisconceptionKey | null` (`diagnoseWrongAnswer.ts`) is a pure, side-effect-free lookup over three interaction kinds:

- **number-fill** → `variant.misconceptionByValue?.[payload.value]`
- **multiple-choice** → `variant.misconceptionByOption?.[payload.optionId]`
- **fill-fraction** → first `misconceptionByFraction` entry whose `{num,den}` equals the submitted fraction by **reduced value** (`eqF`), so `2/4` matches a `1/2` trap. Guards `denominator === 0`.
- everything else → `null`.

Templates compute the trap value in code from their parameters (e.g. the with-replacement product, the un-complemented `P`, the combination count) and attach it to the variant. This is a textbook **bug library** (Brown & Burton): an exact numeric match to a pre-computed malrule is high-precision evidence.

### 1.3 Where a captured misconception is consumed

```
Practice wrong answer ──► diagnoseWrongAnswer ──► misconceptionSignal{key, source:'trap'}
                                                        │
ConceptualRound (LLM "why") ──► source:'llm' ───────────┤
                                                        ▼
                                  applyPracticeAttempt (learnerModel.ts)
                                    • weight by source (trap .7 / chip .6 / llm .5)
                                    • record-time mastery slip-guard (×0.5)
                                    • accumulate {count, score, lastSeenAt}
                                                        │
                                                        ▼
                       surfacedMisconceptions(model, threshold=1.0)
                                                        │
                                                        ▼
                       StrengthsPanel "Watch out for" (ProgressPage, ProfileBody)
                       + F2 computational hint diagnosis (PracticeSession → prompts.ts)
```

**Live, working consumers:** the practice loop (`PracticeSession.tsx:275-305`), the conceptual round (`ConceptualRound.tsx:97-127`), the weighted/threshold-gated panel (`StrengthsPanel.tsx:280, 336-347` — mounted in `ProgressPage` and `ProfileBody`), and the F2 hint, which folds the matched misconception's `label: fix` into the hint prompt (`PracticeSession.tsx:104-126` → `prompts.ts:144-146`).

**Defined but dead consumers:** the Engine-B lesson path. `applyLessonExposure` and `buildReportCard` (`learnerModel.ts:350-470`) accept/emit misconceptions and are unit-tested, but **no caller invokes them** (see §4 P1-A).

---

## 2. What works

1. **The diagnoser is clean and correct.** `diagnoseWrongAnswer` is pure, exhaustively typed over the variant union, and its reduced-fraction matching (`eqF`) correctly handles `2/4 ≡ 1/2`. Tests cover all three kinds, the reduced-match case, the `den=0` guard, multi-entry lists, and wrong-payload-shape null paths (`diagnoseWrongAnswer.test.ts`).
2. **The trap math is sound.** Hand-checked across `pick-k-of-n-unordered` (nPr trap → `ordered_vs_unordered`), `permutations-arrange-k-of-n` (nCr → `ordered_vs_unordered`, every plausible m! → `arrange_without_selecting`), `without-replacement-two-draws` ((r/total)² → `replacement_confusion`), `at-least-one-via-complement` (((m−1)/m)^n → `complement_inversion`), `addition-multiplication-combined` (a×c×p and a+c+p → `add_vs_multiply`), and `conditional-bayes-2x2` (tp/(tp+fn) → `base_rate_neglect`). Every trap is the *correct* malrule value and maps to a defensible key. **No math errors found in trap detection.**
3. **Collision-safety is handled.** Templates guard against a trap value colliding with the correct answer (`conditional-bayes-2x2.ts:63` `!eqF(trap, answer)`; `permutations-arrange-k-of-n.ts:56,70` skip `f === correct` and double-mapping). Because `diagnoseWrongAnswer` only runs on a code-graded **wrong** answer, a trap that happens to equal the answer can never produce a false positive.
4. **The labels are clear and mathematically accurate.** `description`/`fix` pairs are concise and correct (e.g. conjunction: "P(A and B) can never be larger than P(A) or P(B)"; complement: "check whether the question asks for the event or its opposite before subtracting from 1"). They read as student-friendly, not jargon.
5. **The confidence model is well-grounded.** Source-weighted scoring with `SURFACE_THRESHOLD = 1.0` and `trap = 0.7` means **no single observation surfaces** (`learnerModel.ts:37-44`); surfacing needs repetition or corroboration — a real slip-vs-mistake filter. The record-time mastery slip-guard (`isStrongBefore`, ×`SLIP_DISCOUNT`, `learnerModel.ts:170-179, 320-322`) correctly reads mastery *before* the miss drags it down. Back-compat normalisation (`score ?? count × trap`) is handled in both the bump and the selector.
6. **Final-answer-only recording is an effective built-in slip filter.** In practice, the misconception is diagnosed from `currentAnswer` at `resolve` time, which only fires on a correct solve (records nothing) or the 3rd miss (`PracticeSession.tsx:268-307`). A trap entered on try 1 then self-corrected never reaches the model — exactly as the spec intends.
7. **The panel closes the loop.** Each surfaced misconception renders its `fix` plus a one-tap deep link into targeted practice for the related skill (`StrengthsPanel.tsx:137-160`).

---

## 3. What's missing / incomplete (coverage gaps)

### 3.1 Practice template coverage — quantified

- **30 generative template families** are registered (`templates/index.ts`).
- **16 declare a misconception trap** (`misconceptionByValue`/`Option`/`Fraction`): `pick-k-of-n-unordered`, `permutations-arrange-k-of-n`, `gambler-fallacy-mc`, `conditional-bayes-2x2`, `at-least-one-via-complement`, `addition-multiplication-combined`, `without-replacement-two-draws`, `conditional-three-draws-all-red`, the 4 `inclusion-exclusion-*` families, and the 4 `complement-union*/at-least-one-*` families.
- **14 declare none (~47%).** Several have an *obvious, high-value* trap and are the natural home for the most famous HS misconceptions:

| Untagged family | Topic | Missing diagnostic trap | Misconception it would catch |
| --- | --- | --- | --- |
| `sum-of-two-dice` | counting | "all sums 2–12 equally likely" → 1/11 | **equiprobability bias** (no key exists, see §3.4) |
| `conditional-two-way-table` | conditional | P(B\|A) reported for P(A\|B) | reversal / `base_rate_neglect` |
| `k-heads-in-n` | distributions | dropped the C(n,k) coefficient → p^k(1−p)^(n−k) | a binomial-structure error |
| `binomial-at-least-k` | distributions | P(exactly k) instead of summing the tail | `complement_inversion`-adjacent |
| `circular-permutations` | counting | n! instead of (n−1)! | over-counting rotations |
| `permutations-with-repetition` | counting | n! without dividing by duplicate factorials | over-counting |
| `geometric-first-success`, `committee-with-constraint`, `derangement-probability`, `expected-value-*`, `single-event-prob` | mixed | various | various |

This **violates spec acceptance criterion #1** ("every template family … tags at least one diagnostic wrong answer where a meaningful one exists"). The 7 `creative-hard` families and the `verifiedSeeds` re-wraps inherit (or lack) their base family's tags; the creative ones add no traps.

### 3.2 Live-lesson coverage — zero

**No lesson under `src/content/lessons/` declares a single misconception trap.** A `grep` for `misconceptionBy*` across all ~20 lesson files returns nothing; the only "misconception" hits are prose/comments. The entire taxonomy is exercised **only** by the practice engine (Engine A) and the 4 conceptual problems — never by the lesson player (Engine B), which is where most learners first meet each concept.

### 3.3 Conceptual problem coverage — 4 keys

`src/content/conceptual/problems.ts` carries exactly **4 problems**, one each for `gambler`, `base_rate_neglect`, `ordered_vs_unordered`, `complement_inversion`. The LLM "why" classifier can therefore only attribute those 4 keys; `conjunction`, `add_vs_multiply`, `forgot_overlap`, `replacement_confusion`, `arrange_without_selecting`, and (absent) equiprobability bias are unreachable via the reasoning path.

### 3.4 Taxonomy gaps for HS probability

- **`conjunction` is an orphan key:** defined in the taxonomy but never attached to any trap or conceptual problem, so it can never be recorded or surfaced. Dead taxonomy weight.
- **No `equiprobability_bias` key**, despite `sum-of-two-dice` and the `grid-event` sum problems being the canonical setting for it ("every sum is equally likely"). This is one of the most documented HS probability misconceptions and is both unnamed and undiagnosed.
- **No distinct `inverse_conditional` / "confusion of the inverse" key.** `conditional-bayes-2x2` folds the P(test+|disease)-for-P(disease|test+) reversal into `base_rate_neglect` (defensible, but it conflates two distinct errors — see §4 P2-D).

### 3.5 Unwired consumers (see §4 P1-A)

The lesson report card ("what you nailed / what to watch", `prd-phase2.md` F-feature) and all lesson-sourced misconception recording are **defined and tested but never called**.

---

## 4. Bugs & risks

### P1-A — Engine-B lesson misconception capture + report card are entirely unwired *(unwired consumer)*
`applyLessonExposure` (`learnerModel.ts:350-399`) and `buildReportCard` (`learnerModel.ts:437-470`) are implemented and unit-tested, and `recordLessonExposure` exists in `learnerModelService.ts:69`. **No production code calls any of them.** `LessonPlayer.tsx` records progress via `recordAttempt`/`recordVariantSelection`/`markLessonCompleted` only (`LessonPlayer.tsx:10-12, 191, 265, 335`) and never derives a `misconceptionKey`, never calls `recordLessonExposure`, and never accumulates a `SlotFirstTry[]`. `CelebrationScreen.tsx` renders no report card. 
**Impact:** the PRD-phase2 promise "Misconceptions revealed feed Engine B" and the lesson report card are non-functional. Combined with §3.2 (no lesson traps), the lesson side contributes **zero** misconception signal even if it were wired.

### P1-B — Coverage gap starves the only live consumer *(coverage)*
With lessons contributing nothing and 14/30 practice families untagged, the "Watch out for" panel is fed almost entirely by a minority of practice families. Because `SURFACE_THRESHOLD = 1.0` needs ≥2 trap hits (or corroboration) on the *same* key, and untagged high-frequency families (`sum-of-two-dice`, `conditional-two-way-table`, the distributions) emit nothing, the panel will be empty for most learners — the exact "starved signal" failure mode the spec set out to fix (`spec-misconception-capture.md` §1). 
**Files:** `templates/counting/sum-of-two-dice.ts`, `templates/conditional/conditional-two-way-table.ts`, `templates/distributions/*.ts` (no `misconceptionBy*`).

### P2-C — `conjunction` key is undiagnosable; equiprobability bias unnamed *(taxonomy)*
`conjunction` (`misconceptions.ts:22-27`) is never referenced by a trap or conceptual problem, and there is no equiprobability-bias key for `sum-of-two-dice`. 
**Impact:** taxonomy advertises coverage it cannot deliver; a real, common HS error has no home.

### P2-D — `conditional-bayes-2x2` trap conflates reversal with base-rate neglect *(mapping precision)*
`conditional-bayes-2x2.ts:62` maps the sensitivity value `tp/(tp+fn)` to `base_rate_neglect`. Strictly, entering `tp/(tp+fn)` is **confusion of the inverse** — reporting P(test+|disease) for P(disease|test+). It correlates with base-rate neglect but is a distinct error; the friendly copy ("Judging a result from the test accuracy alone") only partly matches the malrule. 
**Impact:** a learner who simply inverted the conditional gets told they "ignore the base rate," which may misdirect the fix. Low severity (the recommended practice is still conditional probability).

### P2-E — Stale weight comment in `applyLessonExposure` *(doc/code drift)*
`learnerModel.ts:346-349` says lesson misconceptions are "treated as source 'trap' (weight 1.0) for back-compat," but the code uses `SOURCE_WEIGHT.trap` = **0.7** (`learnerModel.ts:388`). Harmless today (no caller), but if Engine B is wired per P1-A, a single lesson miss will (correctly, per D-MC5) stay below threshold — contradicting the comment's stated intent. Fix the comment, or decide the intended lesson weight deliberately.

### P2-F — `gambler-fallacy-mc` leaves the hot-hand distractor untagged *(missed diagnostic)*
The `hot` option ("a streak makes the *same* outcome more likely", `gambler-fallacy-mc.ts:86-89`) is a diagnosable cousin of the gambler's fallacy but `misconceptionByOption` only maps `due` (`gambler-fallacy-mc.ts:96-98`). Half the wrong-but-named answers on this item record nothing. Mapping `hot → gambler` (or a new hot-hand key) would roughly double the capture rate on the canonical gambler item.

### Risk — report card has no slip filter (latent)
`buildReportCard` collects a misconception from a **single** first-try miss (`learnerModel.ts:462-467`), with no threshold. This is acceptable for an in-the-moment recap (distinct from the persistent "Watch out for"), but if it were ever promoted into the model it would contradict D-MC5. Note for whoever wires P1-A.

---

## 5. Pros / Cons

**Pros**
- Behaviour-first design (deterministic traps as the highest-weight signal) is the right call and is implemented faithfully, including the precision-biased threshold and the record-time mastery guard.
- The diagnoser is pure, typed, well-tested, and correct; trap math is uniformly accurate.
- The closed-set discipline (type-level + runtime invariant + boundary filtering) makes the taxonomy safe against drift and stale persisted keys.
- The F2 hint already personalises on the diagnosed misconception, so the "name the mistake" payoff exists on the practice side.

**Cons**
- Coverage is the weak link: ~47% of practice families and 100% of lessons carry no trap; the panel that depends on this signal will usually be empty.
- The biggest *designed* consumer (lesson report card + Engine-B lesson capture) is dead code.
- Two taxonomy keys are effectively unusable (`conjunction` orphaned; equiprobability bias missing), and one mapping conflates two distinct errors.
- No spaced-review queue (out of scope per spec §11, but worth flagging that the only "review" affordance is a topic deep-link).

---

## 6. Learning-science assessment

**Diagnostic specificity (good, where present).** The deterministic traps are genuine *malrule fingerprints*: nPr-for-nCr, with-replacement-squared, the un-complemented P, k!-instead-of-P(n,k). Each isolates one mechanism, which is exactly what a bug-library diagnosis needs (Brown & Burton; VanLehn). The slip-vs-mistake handling (final-answer-only recording + repetition threshold + mastery discount) is unusually principled for a product at this stage and directly prevents the classic "one arithmetic slip = labelled with a misconception" false positive.

**Confrontation / refutation (partly realised).** The pieces for refutational feedback exist: the F2 computational hint is told "Likely misconception at play: `<label>: <fix>`" and instructed to "name it briefly in plain words and nudge the fix" (`prompts.ts:118, 144-146`). So a learner *can* get a "this looks like the gambler's fallacy — independent trials have no memory" style nudge. **But:**
- The prompt deliberately suppresses any structured "you fell for X" template ("DO NOT write a … 'misconception / what's wrong / correct approach' template", `prompts.ts:116`), so the confrontation is softened to a one-liner and is non-deterministic (it depends on the LLM, and falls back to generic authored copy when AI is off).
- The **worked solution** (`DerivationCard`) shown on reveal is generic to the template, *not* tailored to the specific misconception the learner exhibited — so the strongest hypercorrection moment (commit → contrast against *your* error) is missed.
- The "Watch out for" panel surfaces the `fix` text, but only after the score threshold and only from practice — most learners won't trigger it.

So the "you fell for the gambler's fallacy"-style feedback is **reachable on the practice path via the AI hint**, but not guaranteed, not on the lesson path, and not turned into an explicit refutation in the worked solution.

**Validity/equity (good).** Routing reliable measurement through behaviour (traps) and treating LLM "why" as low-weight corroboration (0.5) protects young/ESL learners from being mislabelled on articulation ability — a real strength of the design that the code honours.

**Opportunities**
1. **Tailor the reveal to the diagnosed misconception** — append the matched `fix` (and a one-line refutation) to the worked solution on a wrong-resolve, so the contrast is explicit and AI-independent (hypercorrection effect, Butterfield & Metcalfe).
2. **Close the loop on the lesson side** (wire P1-A) so the most pedagogically valuable moment — first exposure — actually produces signal and a report card.
3. **Add equiprobability bias** and tag `sum-of-two-dice`/grid-sum problems; it's the highest-yield missing diagnostic in HS probability.
4. **Reach `conjunction`** with a Linda-style conceptual problem (or retire the key).

---

## 7. Prioritised recommendations

1. **(P1-A) Wire Engine B.** In `LessonPlayer`, on the first committed attempt per slot derive `diagnoseWrongAnswer(variant, payload)` (reuse the helper — don't re-implement the inline `misconceptionByOption` lookup the WP draft suggested), call `recordLessonExposure(uid, { skills, firstTryCorrect, misconceptionKey })`, accumulate a `SlotFirstTry[]`, and render `buildReportCard(...)` on the celebration screen. This activates the single largest dead consumer.
2. **(P1-B) Close the practice coverage gap.** Tag the high-value untagged families first: `sum-of-two-dice` (needs the new equiprobability key), `conditional-two-way-table` (reversal), `k-heads-in-n` / `binomial-at-least-k` (binomial coefficient / tail), and the over-counting permutation families. Target spec AC#1: every family with a meaningful trap declares one, asserted in its test.
3. **(P2-C) Fix the taxonomy edges.** Add `equiprobability_bias`; either give `conjunction` a conceptual problem or remove it.
4. **(P2-F) Tag the hot-hand distractor** in `gambler-fallacy-mc` (map `hot`), to roughly double capture on the flagship gambler item.
5. **(P2-D) Disambiguate the Bayes trap.** Either add an `inverse_conditional` key and map `tp/(tp+fn)` to it, or soften the `base_rate_neglect` copy to also fit the reversal case.
6. **(P2-E) Repair the stale `weight 1.0` comment** in `applyLessonExposure` and decide the intended lesson-trap weight when wiring P1-A.
7. **(learning) Misconception-tailored reveal.** Append the matched `fix` + a one-line refutation to the worked solution on a wrong-resolve, so confrontation/hypercorrection happens deterministically, not only via the optional AI hint.

---

## Executive summary

- **Taxonomy quality — strong but slightly over/under-built.** 9 well-named, mathematically accurate keys with clear student-facing `description`/`fix` copy, enforced as a closed set at type, invariant, and selector boundaries. But `conjunction` is an **orphan** (defined, never diagnosable) and there is **no equiprobability-bias key** despite `sum-of-two-dice` being its natural home.
- **Diagnoser & trap math — clean and correct.** `diagnoseWrongAnswer` is pure, fully typed, reduced-fraction-aware (`2/4 ≡ 1/2`), and well-tested. Hand-checked trap values across 6 families are all the right malrule and map to the right key — **no math errors in trap detection**.
- **Coverage gap (quantified) — the core weakness.** Only **16 of 30 practice template families (~53%)** declare a trap, and **0 of ~20 live lessons** declare any. The reasoning path reaches only **4 conceptual problems / 4 keys**. This violates spec acceptance criterion #1 and starves the one live consumer.
- **Most severe issue (P1) — the lesson misconception path is dead code.** `recordLessonExposure` + `buildReportCard` (`learnerModel.ts:350-470`) are implemented and tested but **never called**; `LessonPlayer.tsx` (records via `recordAttempt` at `:265`, never `recordLessonExposure`) and `CelebrationScreen.tsx` (no report card) leave the PRD-phase2 report card and all lesson-sourced misconceptions non-functional.
- **Second issue (P1) — coverage starves "Watch out for."** High-frequency families `sum-of-two-dice` and `conditional-two-way-table` and the distributions templates emit no signal; with `SURFACE_THRESHOLD = 1.0` needing repetition, the panel is empty for most learners.
- **Notable lower-severity bugs.** `gambler-fallacy-mc.ts:86-98` leaves the hot-hand `hot` distractor untagged (half the named wrong answers record nothing); `conditional-bayes-2x2.ts:62` labels the inverse-conditional value `base_rate_neglect` (conflates two errors); `learnerModel.ts:346-388` has a stale "weight 1.0" comment while the code uses 0.7.
- **What genuinely works.** Behaviour-first, precision-biased confidence model (no single observation surfaces; record-time mastery slip-guard), and the F2 computational hint already personalises on the diagnosed misconception — so a "this looks like the gambler's fallacy" nudge is reachable on the practice path.
- **Top learning-science improvement.** Make refutation deterministic: append the matched `fix` + a one-line refutation to the worked solution on every wrong-resolve (and wire the lesson report card), so confrontation/hypercorrection happens for every learner rather than only when the optional AI hint fires.
