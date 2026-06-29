# Audit 13 — Captain's Wager

> Pre-deadline audit of the Captain's Wager feature (`src/features/wager/*`, `src/content/wagers/*`, `scripts/wager-*.ts`).
> Auditor lens: learning scientist + software engineer + mathematician.
> Ground truth accepted as given: `tsc` clean, `eslint` clean, `vitest` 1083/1083. Suite not re-run.
> Read-only audit — no source/test files modified.
> Specs of record: [`spec-captains-wager.md`](../specs/spec-captains-wager.md), [`wp-captains-wager.md`](../specs/wp/wp-captains-wager.md).

---

## 1. Overview

Captain's Wager is a rotating probability-estimation game. Every 3 days a "bottle washes ashore" (one wager becomes featured), the learner enters a single numeric guess, and on submit they immediately get: the true answer, a histogram of all submissions with their guess marked, a "you beat X%" pill, a Captain Pascal teach-back that names the underlying concept, and a personal score sparkline. It is deliberately walled off from the learner model (D-CW8) and the lesson streak (§5), grants a small amount of XP (5/10/20), and lives at its own `/wager` route with a sidebar item.

The feature is **well-engineered and largely faithful to the spec**. The pure helpers (`scoring.ts`, `binning.ts`, `wagerXp.ts`, `wagerRotation.ts`) are clean and side-effect-free; the two-step submit flow with self-healing (`submitWager` → `ensureSubmissionScored`) and the `exists()`-gated reveal are implemented carefully, with thoughtful race handling (`subscribeWithRetry`, the `snapped` flag). **All 11 shipped wager probabilities are mathematically correct** — a genuinely strong result for content that is easy to get wrong.

The headline findings are conceptual, not arithmetic: (a) the scoring rule is an **estimation-accuracy metric, not a "proper scoring rule"** in the Brier/log-score sense, and the feature does not actually elicit or measure *calibration* despite the framing; (b) the **N≥20 histogram suppression mandated by the spec (D-CW9, AC#7) has been removed**, re-introducing the "false signal from noise" problem the spec explicitly warned against; (c) a **dormant display bug** in the unused `abs` scoring branch; and (d) a **content-runway / rotation gap** (11 wagers vs. the spec's 30, with a rotation that silently wraps and ignores `openAt`).

---

## 2. What works (with spec citations)

- **Scoring math is correct for what it is.** `computeWagerScore` (`src/features/wager/scoring.ts:21`) implements spec §5 exactly: `logError = |log10(guess) − log10(trueAnswer)|`, `score = clamp(round(100·max(0, 1−logErr)), 0, 100)`. Verified against the §5 worked table: exact→100, 2×→70 (`log10 2 = 0.301`), 5×→30, 10×→0, 100×→0. Symmetric in sign, floors at 0, no negatives. ✔
- **Edge handling for non-positive guesses.** `guess ≤ 0` in the `log` branch returns `{ logError: Infinity, score: 0 }` (`scoring.ts:27`), and the storage layer encodes `Infinity → 9999` (`wagerService.ts:60`, `:591`), which correctly ranks as the worst performer in `percentileBeaten`. ✔
- **Content correctness — every shipped probability checks out** (see §4 table). Birthday-23 = 50.7%, royal flush 1/649,740, Powerball 1/292,201,338, two-child 33.3%, mammogram PPV ≈ 8%, share-your-birthday-100 ≈ 24%, streak-3-in-10 ≈ 50.8% (tribonacci `f(10)=504`), and the four real-world frequencies are all sourced and accurate. ✔
- **Teach-backs teach.** Every wager carries a `revealHeadline` + `revealExplanation` that names a specific concept and (where applicable) the intuition trap — satisfying the D-CW1 "teach-back is the product" mandate and the §10 quality bar. The validator enforces non-empty `revealExplanation` (`scripts/wager-validate.ts:27`). ✔
- **Reveal gating is real, not cosmetic.** The `exists()`-based no-peeking gate is enforced in rules, and the service deliberately does not subscribe to the answer/submissions before the user has submitted (`wagerService.ts:365`, `:421`) — matching §7 and acceptance criteria #1–#3.
- **Two-step submit + self-heal** (D-CW11) is implemented as specified: placeholder create → gated answer read → score-patch transaction; `useUserSubmission` detects the `{score:0, logError:0}` placeholder and retries via `ensureSubmissionScored` (`wagerService.ts:329`). The `{0,0}` sentinel is unambiguous because any real `logError=0` implies `score=100`.
- **XP is correctly walled off.** `wagerXpForScore` (5 + 5@≥50 + 10@≥80) matches §5/C-W3, and `submitWager` writes `xp`/`weeklyXp`/`weekKey` directly rather than through `grantPracticeXp`, keeping it off the practice daily cap (`wagerService.ts:11`, `:615`). It does not touch the streak or learner model (D-CW8). ✔
- **Rotation is deterministic and server-clock-free** (`wagerRotation.ts`) — FNV-1a-seeded Mulberry32 Fisher-Yates over an id-sorted bank, giving every client the same featured wager for the same window without Cloud Functions. Clean and well-documented.
- **Histogram/sparkline are zero-dependency hand-rolled SVG** (per the G boundary), with sensible log/linear axis handling, true-answer + guess markers, and accessible `aria-label`s.

---

## 3. What's missing / incomplete vs. spec

- **N≥20 histogram suppression (D-CW9, AC#7, §9) was removed.** `WagerHistogram.tsx:8-13` documents that the placeholder was dropped on 2026-06-28; the chart now renders for any N≥1, and the percentile is gated only at N≥2 (`WagerCardReveal.tsx:190`). The `HISTOGRAM_MIN_N = 20` constant (`constants.ts:1`) is now effectively dead in production paths. This is a deliberate, documented product change but it **directly contradicts the locked spec** and its learning-science rationale (§9: "a histogram of 3 dots is anti-pedagogical").
- **Content runway: 11 wagers, not 30.** Spec §10 / WP-CW-I require 30 hand-authored wagers (90-day runway). Only 11 exist in `src/content/wagers/`. At 1-per-3-days the bank is exhausted in ~33 days, after which `featuredWager` wraps (`wagerRotation.ts:112`, `k % shuffled.length`) and re-features wagers the user has already answered.
- **No `abs`-scoring content ships.** All 11 wagers use `scoring:"log"`. The `abs` branch (`scoring.ts:35`) — the spec's mechanism for "probabilities near zero" where `log` is undefined — is never exercised by real content, and it carries a latent display bug (§4, P2). So the spec's claim to "handle edge probabilities (0/1)" is unfulfilled in practice: near-0/near-1 probabilities are simply avoided by content design rather than handled.
- **The "calibration" instrument is an accuracy tracker, not a calibration curve.** Spec §6.4 promises a "running calibration line." What ships (`WagerSparkline.tsx`, `wagerStats.averageLogError`/`last10Scores`) plots *score over time* — i.e. estimation accuracy — not calibration (stated confidence vs. observed hit-rate). See §6.
- **`openAt` is decorative.** The rotation ignores `openAt` entirely (it shuffles the whole live bank and indexes by wall-clock window), so a wager with a future `openAt` (e.g. `mammogram-positive-rate` opens `2026-07-06`) can be featured today. R-W4 anticipated operator-driven `status:'live'`, but the implemented rotation makes `openAt`/`sequence` non-authoritative for scheduling.
- **`sequence` ≠ window order.** The bank is shuffled before windowing, so "Wager #N" (`sequence`) does not correspond to the order wagers actually surface — a cosmetic inconsistency with the §7 intent that "sequence numbers match window indices for the first cohort."

---

## 4. Bugs & risks (file:line, severity)

### Scoring-rule correctness

**[P1 — conceptual] Log-distance is not a proper scoring rule, and the feature does not measure calibration.**
`scoring.ts:21`. A *proper scoring rule* (Brier, log/logarithmic, spherical) is defined over an elicited **probability distribution** and is uniquely maximized in expectation by reporting one's true beliefs. Captain's Wager elicits a **point estimate of a fixed quantity** (the true answer is a fact, e.g. 50.7%), so the proper-scoring-rule framework does not strictly apply, and there is no perverse misreporting incentive to guard against. The log-distance metric is a *reasonable* accuracy score: it is monotone-decreasing in `|log error|`, symmetric, and incentive-compatible in the weak sense that a learner's expected-score-maximizing report is the **median of their belief in log-space** (their honest central estimate). 

Impact: the implementation is mathematically sound *as an estimation game*, but the spec's repeated "calibration training… improved Brier scores" framing (§1, §3) over-claims. This trains **Fermi/order-of-magnitude estimation accuracy**, which is valuable but is a distinct skill from calibration. Not a code defect — a correctness-of-claims and learning-design issue (see §6 for the fix).

**[P2] No `trueAnswer ≤ 0` guard in the `log` branch.**
`scoring.ts:30`. If a `log`-scored wager ever had `trueAnswer = 0` (→ `-Infinity`) or negative (→ `NaN`), the score becomes `NaN` (since `clamp(round(100·max(0,1−NaN)))` propagates `NaN`). Currently mitigated entirely at the content layer (`wager-validate.ts:84` enforces `trueAnswer > 0` for `log`), so this is defense-in-depth only, but the pure helper does not self-protect.

**[P2] Edge probabilities of 0 / 1 are not actually handled.**
The `abs` fallback that the spec earmarked for near-zero probabilities is dead (no content uses it) and buggy (below). True probabilities of exactly 0 or 1 would be degenerate wagers; near-0 probabilities currently rely on `log` working on the percent value (fine for 0.35%, but a true value of, say, 0.001% paired against a 0.01% guess scores 0 despite being "1 OoM off and arguably close in absolute terms" — exactly the case D-CW6 wanted `abs` for).

### Content correctness

**No wrong probabilities found.** All 11 spot-checked:

| Wager (file) | Stated `trueAnswer` | Independent check | Verdict |
|---|---|---|---|
| `birthday-paradox-23.json` | 50.7% | `1 − 365!/(342!·365²³) ≈ 0.5073` | ✔ |
| `two-child-boy.json` | 33.3% | `(1/4)/(3/4) = 1/3` | ✔ |
| `left-handed-us-adults.json` | 10.6% | Papadatou-Pastou 2020 meta ≈ 10.6% | ✔ |
| `mammogram-positive-rate.json` | 8% | `(.8·.01)/(.8·.01+.096·.99)=7.8%`→8 | ✔ |
| `met-online-couples-2017.json` | 39% | Rosenfeld 2019 PNAS, 2017 cohort | ✔ |
| `royal-flush-5card.json` | 649,740 | `C(52,5)/4 = 2,598,960/4` | ✔ |
| `share-your-birthday-100.json` | 24% | `1−(364/365)¹⁰⁰ ≈ 0.240` | ✔ |
| `identical-twin-rate-us.json` | 0.35% | ≈3.5/1000 births | ✔ |
| `powerball-jackpot.json` | 292,201,338 | `C(69,5)·26 = 11,238,513·26` | ✔ |
| `lightning-strike-year-us.json` | 1,222,000 | `≈270 / 330M ≈ 1/1.22M` (NWS) | ✔ |
| `streak-3-heads-10-flips.json` | 50.8% | `1 − 504/1024` (tribonacci `f(10)=504`) | ✔ |

Minor content note (not an error): `mammogram` uses Gigerenzer's illustrative ~1% prevalence; true annual incidence for women specifically in their 40s is lower, but the source acknowledges this and cites BCSC ~5–10% PPV, so `8` is defensible.

### Reveal / UX bugs

**[P2 — dormant] `abs`-branch error description computes the wrong number.**
`WagerCardReveal.tsx:62`:
```62:63:src/features/wager/WagerCardReveal.tsx
    const absDiff = Math.abs(submission.guess - submission.logError);
    return `Off by ${absDiff} ${wager.unit}`;
```
In the `abs` branch, `submission.logError` *already is* the absolute error `|guess − trueAnswer|`. Computing `|guess − logError|` yields a meaningless quantity (e.g. guess 30, true 33.3 → stored logError 3.3 → displayed "Off by 26.7", not 3.3). The correct expression is simply `submission.logError`. Also unrounded, so it can render long floats. **Only dormant because no shipped wager uses `abs` scoring** — but it will mis-display the moment one is authored.

**[P2] Percentile denominator includes the user themselves.**
`WagerCardReveal.tsx:190-251`. `percentileBeaten` counts submissions with `logError >` the user's over **all** submissions including the user's own (`binning.ts:151`), and the label reads "You beat {pct}% of {n} wagerers" where `n = submissions.length`. Consequently the best performer can never read 100% (caps at `(N−1)/N`), and at N=2 a clear win reads "beat 50% of 2 wagerers." Matches the literal spec wording ("proportion of submitted guesses with strictly larger logErr") but is slightly deflating/confusing; excluding self would be more intuitive.

**[P2] Thin-histogram regression (the removed D-CW9).**
`WagerHistogram.tsx:80` + `WagerCardReveal.tsx:232`. With the N≥20 gate gone, early submitters see a 1–3 bar "distribution" and a "you beat X% of 3 wagerers" pill. Per §9/D-CW9 this is the exact anti-pedagogical state the spec wanted suppressed (users read signal into noise). Severity is a judgment call (documented product decision), but it is a spec-fidelity and learning-quality regression.

### Risks

- **[P2] Rotation wrap re-serves answered wagers.** `wagerRotation.ts:108-130`. After the 11-wager bank cycles (~33 days), `featuredWager` re-features an already-answered wager; the user is auto-redirected to their old reveal (`WagerListPage.tsx:116`) with no new prompt. `pastFeaturedWagers` is also bounded to one cycle (`:124`), so older reveals fall out of the list. Mitigated only by authoring more content.
- **[P1 known/accepted] Client-authoritative scoring.** `submitWager` computes and writes `score`/`logError`/XP client-side (`wagerService.ts:589-619`); a determined user can forge `score:100` and grant themselves XP. Documented and accepted (R-W3, §7 "knownst limitation") because nothing gates on it — flagged here for completeness, not as a new finding. Becomes a real P0 if wager outcomes ever drive badges/leaderboards.
- **[P2] Duplicate-submit guard is a read-then-write, not atomic** (`wagerService.ts:547`). A two-tab race could double-create; the rules `create` gate (`!exists`) is the real backstop, so impact is limited to a confusing error, not data corruption.

---

## 5. Pros / Cons

**Pros**
- Content is accurate and genuinely educational; teach-backs name concepts and intuition traps (the real differentiator vs. Estimania/Napkin).
- Clean separation of pure helpers vs. React vs. Firebase; helpers are fully deterministic and testable.
- Thoughtful resilience: two-step submit, idempotent self-heal, permission-denied retry with backoff, the `snapped` race fix, and explicit error surfacing (`RevealErrorState`).
- Correct architectural walls: no learner-model contamination, no second streak, XP off the practice cap.
- Zero-dependency SVG charts; accessible labels.

**Cons**
- Scoring/feature is sold as "calibration training" but measures estimation accuracy — a learning-design mismatch.
- Spec drift: D-CW9 (N≥20) dropped; 11/30 content; `openAt`/`sequence` no longer authoritative.
- Dead-but-shipped `abs` branch (with a display bug) and a dead `HISTOGRAM_MIN_N` constant — latent traps for the next author.
- Log-distance is lenient on canonical near-miss misconceptions (see §6), blunting the intended hypercorrection signal.
- Rotation wraps and re-serves content at small bank sizes.

---

## 6. Learning-science assessment

**What the design gets right.** The pillars are sound: estimation forces *generation* (Slamecka & Graf) and *commitment* before reveal (one-shot, D-CW10), the teach-back enables *hypercorrection* (Butterfield & Metcalfe), the four flavors *interleave* topics (Bjork), and the real-world frequency items support *far transfer*. The mandatory concept-naming teach-back is the strongest pedagogical element and is faithfully implemented.

**The core gap: this trains estimation accuracy, not calibration.** Calibration is the property that, across the events you assign "70% confidence," ~70% actually occur. Measuring/training it requires eliciting a **confidence or probability** and scoring realized outcomes with a **proper scoring rule** (Brier/log) — then plotting stated confidence vs. observed frequency (a reliability/calibration curve). Captain's Wager instead asks for a point estimate of a known fact and scores distance from it. That is a legitimate, useful skill (Fermi reasoning, base-rate sense) and the RCT evidence cited (Greenberg 2024, GJP) is real — but those interventions trained *probabilistic forecasting with confidence*, not point-estimate accuracy. The shipped "calibration" sparkline/`averageLogError` is therefore an **accuracy trend mislabeled as calibration**. D-CW2 consciously rejected confidence intervals for novices; that's defensible, but the feature should then stop calling the output "calibration."

**Feedback-quality issue: the score is too forgiving of canonical misconceptions.** Because `log`-distance is gentle within ~1.5×, the *textbook wrong answers* score high:
- Two-child problem (true 33.3%): the classic "50%" intuition → `log10(50/33.3)=0.176` → **score 82**.
- Birthday-share-100 (true 24%): an overshoot to 70% → `log10(70/24)=0.46` → score 54.

A learner who commits to the canonical error still gets a "great job" green chip, which works *against* the hypercorrection mechanism the spec relies on (the wrong belief isn't clearly marked wrong). The histogram + teach-back partly compensate, but the headline number undercuts them.

**Opportunities (ranked by leverage):**
1. **Decide what the feature is, then align the copy.** If it stays a point-estimate game, rename "calibration" → "estimation accuracy" everywhere (sparkline, profile, explainer) and lean into Fermi/base-rate framing. If real calibration is the goal, add an optional confidence input (e.g. a low–high range or a confidence %) and score it with a Brier/interval-coverage rule — then the sparkline becomes a true reliability curve. This is the single highest-value change.
2. **Restore (or soften) the N-gate** so early users don't read noise as a distribution, per D-CW9 — e.g. show the chart but suppress the "you beat X%" pill and add a "small sample" caption below ~10–20.
3. **Sharpen the score around known misconception values** (e.g. a steeper falloff, or surface the *direction* of error and the named misconception inline) so the canonical wrong answer feels wrong, reinforcing hypercorrection.
4. **Annotate the histogram with the misconception spike** the teach-back references (§6.3 promised "Notice the spike near 8%…"), turning the distribution into evidence the learner can see, not just read about.
5. **Add a few `abs`-scored near-0/near-1 wagers** (and fix the display bug) to actually exercise the path the spec designed for, broadening the probability range beyond "comfortably mid-range percentages."

---

## 7. Prioritized recommendations

1. **(P1, copy/learning-design)** Resolve the calibration vs. accuracy mismatch — either add confidence elicitation + a proper scoring rule, or relabel "calibration" as "estimation accuracy" across UI and spec. Highest leverage, low code cost for the relabel option.
2. **(P1, content)** Author the remaining ~19 wagers (toward the §10 target of 30) before the 11-wager bank wraps in ~33 days; otherwise users hit re-served reveals. Consider also guarding `featuredWager` against re-serving already-answered wagers.
3. **(P1/P2, spec fidelity)** Re-decide D-CW9 explicitly: either restore the N≥20 histogram/percentile suppression or amend the spec and at minimum gate the "you beat X%" pill + add a small-sample caption.
4. **(P2, bug)** Fix `WagerCardReveal.tsx:62` to display `submission.logError` (rounded) for `abs` scoring before any `abs` wager ships.
5. **(P2, robustness)** Add a `trueAnswer ≤ 0`/non-finite guard inside `computeWagerScore`'s `log` branch as defense-in-depth (don't rely solely on the validator).
6. **(P2, UX)** Exclude the user from the percentile denominator so "you beat X%" can reach 100% and reads sensibly at small N.
7. **(P2, clarity)** Either wire `openAt`/`sequence` into scheduling/display or document that rotation is purely window-driven and these fields are advisory — and remove or repurpose the now-dead `HISTOGRAM_MIN_N`.
8. **(P2, pedagogy)** Steepen scoring near canonical misconception values and/or surface the named misconception inline with the score to restore the hypercorrection signal.

---

## Executive summary

- **Scoring rule:** `computeWagerScore` (`scoring.ts:21`) is mathematically correct and matches spec §5 exactly, but it is **not a "proper scoring rule"** (Brier/log) — nor does it need to be, because it scores a *point estimate of a fixed quantity*, not an elicited probability. It is incentive-compatible in the weak sense (best report = your honest central estimate, the log-space median). The "honest probability reporting" framing doesn't apply; there's no misreporting incentive to defeat.
- **Calibration claim is over-stated (top learning-science issue):** the feature trains **estimation accuracy**, not calibration; the "calibration" sparkline/`averageLogError` is an accuracy trend mislabeled. To truly train calibration you must elicit confidence and score it with a proper rule — otherwise relabel the output.
- **Wrong probabilities found: none.** All 11 wager `trueAnswer`s verified correct (birthday-23 = 50.7, two-child = 33.3, royal flush = 649,740, Powerball = 292,201,338, mammogram PPV ≈ 8%, share-birthday-100 ≈ 24, streak-3-in-10 = 50.8 via tribonacci `f(10)=504`, left-handed 10.6, met-online 39, identical-twin 0.35, lightning 1/1,222,000).
- **Most severe code bug:** `WagerCardReveal.tsx:62` computes `Math.abs(guess − logError)` for `abs` scoring, but `logError` already *is* the absolute error — wrong/garbled "Off by X" output. P2 only because no shipped wager uses `abs` scoring (a latent trap).
- **Spec regression:** the mandated N≥20 histogram suppression (D-CW9, AC#7, §9) was removed (`WagerHistogram.tsx:8-13`); thin 2–3-bar histograms + "you beat X% of 3 wagerers" now show, re-introducing the "noise read as signal" problem the spec warned against. `HISTOGRAM_MIN_N` is now dead.
- **Content/rotation gap:** 11 wagers vs. the spec's 30; `featuredWager` (`wagerRotation.ts:108`) wraps after ~33 days and re-serves answered wagers, and `openAt`/`sequence` are ignored by scheduling.
- **Minor correctness:** `log` branch has no `trueAnswer ≤ 0`/`NaN` guard (mitigated only by the content validator); percentile denominator includes the user (best score caps at `(N−1)/N`).
- **Top learning-science improvement:** make the score (and feedback) actually penalize *canonical misconceptions* — today the textbook wrong answers score high (two-child "50%" → 82), undermining the hypercorrection mechanism the design depends on. Either steepen the curve near known traps and surface the misconception inline, or add confidence elicitation to convert the game into genuine calibration training.
