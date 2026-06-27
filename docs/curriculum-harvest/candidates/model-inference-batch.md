### MI-CAND-0001 — Choose the spinner from frequency counts

- **Source ids:** self-authored; creative-hard-batch-0009 CAND-0005 as internal pattern only
- **Reuse mode:** original
- **Roadmap target:** Unit 1 / Unit 5 — Experimental vs theoretical probability
- **Practice topic:** model-inference
- **Difficulty tag:** medium-hard / model inference
- **Skills:** relative-frequency, expected-counts, model-selection, inverse-spinner
- **Misconceptions:** expects-observed-counts-to-match-exactly, ignores-total-sample-size, chooses-largest-section-from-largest-count-only
- **Core trick:** Convert each candidate spinner to expected counts, then choose the closest overall pattern.
- **Why it matters:** Students practice the reverse direction of probability: use data to infer the model that likely produced it.
- **Template sketch:** Generate 3-section spinners with simple fractions and a count table from one intended spinner. Score by squared distance from expected counts for the first version.
- **Interaction fit:** frequency bar chart plus spinner-card multiple choice; reveal expected counts after selection.
- **Solver feasibility:** deterministic expected-count distance over all candidate probability vectors.
- **Legal notes:** Fully Pascal-authored values and wording. No source visual copying.
- **Verification:** `scripts/curriculum-harvest/verify-model-inference.ts` writes `model-inference-verified.json` and `model-inference-verified.md`.
- **Human status:** pending

### MI-CAND-0002 — Fair coin or biased coin from one run

- **Source ids:** self-authored
- **Reuse mode:** original
- **Roadmap target:** Unit 1 / Unit 5 — Experimental probability and fair games
- **Practice topic:** model-inference
- **Difficulty tag:** medium-hard / simulation interpretation
- **Skills:** relative-frequency, fairness, sampling-noise, model-selection
- **Misconceptions:** calls-any-imbalance-proof-of-bias, ignores-that-random-runs-are-uneven, overweights-last-few-flips
- **Core trick:** A small imbalance can still be better explained by a fair model than by a strongly biased model.
- **Why it matters:** This is a direct antidote to the common "not exactly half, so unfair" misconception.
- **Template sketch:** Generate coin-count runs near 50/50 and compare fair, heads-biased, and tails-biased models.
- **Interaction fit:** ask "Which model is most supported?" followed by a one-line likelihood or expected-count explanation.
- **Solver feasibility:** deterministic multinomial log likelihood.
- **Legal notes:** Fully Pascal-authored values and wording. No source visual copying.
- **Verification:** `scripts/curriculum-harvest/verify-model-inference.ts` confirms the fair model wins.
- **Human status:** pending

### MI-CAND-0003 — Loaded die or fair die

- **Source ids:** self-authored
- **Reuse mode:** original
- **Roadmap target:** Unit 5 — Fair games and experimental probability
- **Practice topic:** model-inference
- **Difficulty tag:** hard / model inference
- **Skills:** relative-frequency, multinomial-likelihood, fairness, die-models
- **Misconceptions:** checks-only-one-face-instead-of-the-whole-pattern, assumes-every-nonuniform-run-is-fair-noise, confuses-most-common-face-with-complete-model
- **Core trick:** Match the whole six-face pattern, not just the single largest count.
- **Why it matters:** It distinguishes real-looking bias from ordinary random variation while remaining concrete.
- **Template sketch:** Generate fair, high-face, and middle-heavy dice; provide a run that favors one full distribution.
- **Interaction fit:** die-face table plus multiple-choice model cards.
- **Solver feasibility:** deterministic multinomial log likelihood over the six face counts.
- **Legal notes:** Fully Pascal-authored values and wording. No source visual copying.
- **Verification:** `scripts/curriculum-harvest/verify-model-inference.ts` confirms the intended loaded model wins.
- **Human status:** pending

### MI-CAND-0004 — Small sample chart with no exact match

- **Source ids:** self-authored
- **Reuse mode:** original
- **Roadmap target:** Unit 1 — Long-run probability
- **Practice topic:** model-inference
- **Difficulty tag:** medium-hard / visual model match
- **Skills:** expected-counts, small-sample-noise, chart-interpretation, model-selection
- **Misconceptions:** rejects-best-model-because-it-is-not-exact, forgets-small-samples-are-lumpy, chooses-the-model-with-the-same-largest-bar-only
- **Core trick:** With only 10 spins, the best visual match can be off by one or two spins.
- **Why it matters:** It teaches students not to demand exact matches from small random samples.
- **Template sketch:** Generate a 10-spin bar chart and three spinner cards. Ensure the intended spinner is closest but not exact.
- **Interaction fit:** "best visual match" selection with a follow-up asking why exact matching is unrealistic.
- **Solver feasibility:** deterministic expected-count distance; test fixture should assert selected model is intended and counts are not exact.
- **Legal notes:** Fully Pascal-authored values and wording. No source visual copying.
- **Verification:** `scripts/curriculum-harvest/verify-model-inference.ts` includes the required non-exact small-sample case.
- **Human status:** pending

### MI-CAND-0005 — Match a simulation table to a model

- **Source ids:** self-authored
- **Reuse mode:** original
- **Roadmap target:** Unit 1 / Unit 5 — Simulations and model comparison
- **Practice topic:** model-inference
- **Difficulty tag:** hard / simulation interpretation
- **Skills:** simulation-table, relative-frequency, multinomial-likelihood, model-selection
- **Misconceptions:** compares-only-the-largest-category, ignores-low-frequency-categories, treats-a-simulation-table-as-a-guaranteed-ratio
- **Core trick:** Compare all table categories to the candidate probability models.
- **Why it matters:** It broadens inverse probability reasoning beyond coins, dice, and spinners.
- **Template sketch:** Generate four-category tables with accessible contexts such as project topics, snack choices, or route choices.
- **Interaction fit:** table reading plus model-card choice; solution uses percentages before likelihood scores.
- **Solver feasibility:** deterministic multinomial log likelihood.
- **Legal notes:** Fully Pascal-authored values and wording. No source visual copying.
- **Verification:** `scripts/curriculum-harvest/verify-model-inference.ts` confirms the intended table model wins.
- **Human status:** pending

### MI-CAND-0006 — Noise or bias on an equal spinner

- **Source ids:** self-authored
- **Reuse mode:** original
- **Roadmap target:** Unit 1 / Unit 5 — Experimental probability and fair games
- **Practice topic:** model-inference
- **Difficulty tag:** medium-hard / sampling noise
- **Skills:** sampling-noise, fairness, relative-frequency, model-selection
- **Misconceptions:** declares-bias-from-a-small-lead, expects-equal-spinner-counts-to-be-equal-every-time, ignores-plausible-random-variation
- **Core trick:** A 9, 8, 7 split over 24 spins is close enough to 8, 8, 8 that the equal spinner still wins.
- **Why it matters:** It explicitly separates "uneven data" from "evidence of bias."
- **Template sketch:** Generate near-equal counts from an equal spinner and compare against strongly favored alternatives.
- **Interaction fit:** student claim critique: "Is red really favored?" followed by model selection.
- **Solver feasibility:** deterministic multinomial log likelihood.
- **Legal notes:** Fully Pascal-authored values and wording. No source visual copying.
- **Verification:** `scripts/curriculum-harvest/verify-model-inference.ts` confirms the fair/equal model wins.
- **Human status:** pending

## Batch Notes

- **Generation lane:** `scripts/curriculum-harvest/verify-model-inference.ts`
- **Verified JSON:** `docs/curriculum-harvest/generated-problems/model-inference-verified.json`
- **Verified Markdown:** `docs/curriculum-harvest/generated-problems/model-inference-verified.md`
- **Runtime status:** review artifacts only; no app/runtime code edits yet
- **Blockers:** none for this review lane
- **Missing taxonomy IDs:** model-inference, inverse-spinner, sampling-noise, visual-model-match, simulation-table-match, multinomial-likelihood
