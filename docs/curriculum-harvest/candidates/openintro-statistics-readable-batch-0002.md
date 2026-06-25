### CAND-0001 — Base-rate reversal from a positive signal

- **Source ids:** openintro-statistics chunk-0008 §3.2, openintro-statistics chunk-0009 exercises 3.20-3.22, openintro-statistics chunk-0014 exercise 3.41
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and Bayes
- **Practice topic:** bayes-base-rates
- **Skills:** conditional-probability, bayes-rule, base-rate-reasoning, tree-diagrams
- **Misconceptions:** ignores-base-rate, treats-test-accuracy-as-posterior, denominator-omits-false-positives
- **Core trick:** Split a positive signal into true-positive and false-positive paths, then compare the target path to all positive paths.
- **Why it matters:** Students often overtrust accurate-sounding signals when the target condition is rare; this family builds the denominator habit that makes Bayes intuitive.
- **Template sketch:** Given a rare category rate, a hit rate for members, and a false-alarm rate for nonmembers, ask for P(member | positive signal). Generate friendly percentages and solve as `(hit * prior) / (hit * prior + falseAlarm * (1 - prior))`.
- **Interaction fit:** tree-builder, fill-fraction, or multiple-choice with misconception distractors.
- **Solver feasibility:** exact Fraction using integer percentages or basis-point counts over a synthetic population.
- **Legal notes:** Inspired by Bayes/base-rate structures only; learner-facing contexts, wording, and parameters should be newly authored with OpenIntro attribution in docs or credits as required.
- **Human status:** pending

### CAND-0002 — Which explanation caused the observed result?

- **Source ids:** openintro-statistics chunk-0008 Guided Practice 3.43-3.46
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and Bayes
- **Practice topic:** competing-causes
- **Skills:** bayes-rule, law-of-total-probability, conditional-probability, complements
- **Misconceptions:** chooses-largest-likelihood-only, forgets-that-posteriors-share-one-denominator, posterior-probabilities-do-not-sum-to-one
- **Core trick:** For several possible causes, weight each cause by how likely it makes the observed result, then normalize those weights.
- **Why it matters:** This is the high-school-friendly form of Bayesian updating and gives students a reusable way to reason about diagnoses, alerts, and clues.
- **Template sketch:** Generate three mutually exclusive causes with priors summing to 1 and likelihoods for the same observation. Ask for the posterior of one cause, then optionally ask for another posterior or the remaining complement.
- **Interaction fit:** sortable-table, fill-fraction, or stepwise worked-solution cards.
- **Solver feasibility:** exact Fraction over small integer weights; denominator is the sum of all weighted paths.
- **Legal notes:** No source scenario or prose should be copied; the candidate abstracts the multi-cause normalization move.
- **Human status:** pending

### CAND-0003 — Table denominator switch

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001 Lesson 4.3, openintro-statistics chunk-0008 exercises 3.15-3.16, openintro-statistics chunk-0009 exercises 3.17-3.18
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability from tables
- **Practice topic:** two-way-tables
- **Skills:** joint-probability, marginal-probability, conditional-probability, relative-frequency
- **Misconceptions:** always-divides-by-grand-total, swaps-given-and-target, confuses-joint-with-conditional
- **Core trick:** The word after "given" or "among" selects the row or column total; joint questions use the grand total.
- **Why it matters:** Denominator choice is the central skill for reading two-way tables and underlies independence checks and Bayes later.
- **Template sketch:** Generate a two-way count table with row and column totals. Ask a mix of P(A and B), P(A), P(A | B), and P(B | A), highlighting that similar words require different denominators.
- **Interaction fit:** table-cell-highlighting followed by fill-fraction.
- **Solver feasibility:** deterministic table generator with positive integer counts and exact reduced fractions.
- **Legal notes:** Use newly authored categories and counts; retain source provenance because the table-question pattern is adapted from CC-licensed materials.
- **Human status:** pending

### CAND-0004 — Independence by comparing conditional rates

- **Source ids:** openintro-statistics chunk-0008 exercises 3.13 and 3.15-3.16, openintro-statistics chunk-0009 exercises 3.17-3.18, openintro-statistics chunk-0014 exercise 3.38
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and independence
- **Practice topic:** independence
- **Skills:** conditional-probability, independence, two-way-tables, marginal-probability
- **Misconceptions:** thinks-overlap-means-dependence, compares-raw-counts-instead-of-rates, treats-mutual-exclusivity-as-independence
- **Core trick:** Compare a conditional rate to the corresponding overall rate; if they differ, the variables are not independent.
- **Why it matters:** Students need a rate-based test for association before simulation and statistical inference topics.
- **Template sketch:** Generate a two-way table where one row has a visibly different success rate. Ask whether two attributes appear independent and require the key comparison `P(A | B)` versus `P(A)`.
- **Interaction fit:** multiple-choice with explanation, table-highlighting, or short numeric comparison.
- **Solver feasibility:** exact Fraction comparisons; generator can produce independent and dependent cases with controlled gaps.
- **Legal notes:** Abstracts the reasoning pattern only; contexts and counts should be newly created.
- **Human status:** pending

### CAND-0005 — At least one success without replacement

- **Source ids:** openintro-statistics chunk-0009 Examples 3.47-3.50, openintro-statistics chunk-0010 Guided Practice 3.52-3.53
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** sampling-without-replacement
- **Skills:** complement-rule, general-multiplication-rule, conditional-probability, without-replacement
- **Misconceptions:** uses-same-probability-each-draw, counts-exactly-one-instead-of-at-least-one, forgets-complement
- **Core trick:** To find "at least one" in repeated draws, compute the chance of zero target outcomes using shrinking counts, then subtract from 1.
- **Why it matters:** This connects complements to dependent trials and keeps small-population sampling from becoming a case-counting mess.
- **Template sketch:** A learner owns `t` target items among `N` items and `k` draws are made without replacement. Ask P(at least one target). Solve as `1 - C(N - t, k) / C(N, k)` or the equivalent product of non-target fractions.
- **Interaction fit:** fill-fraction, product-builder, or simulation comparison.
- **Solver feasibility:** exact Fraction via combinations or sequential products with small `N` and `k`.
- **Legal notes:** No final problem wording or story details should mirror the source; the mathematical family is adapted with attribution.
- **Human status:** pending

### CAND-0006 — With replacement versus without replacement

- **Source ids:** openintro-statistics chunk-0009 Examples 3.48-3.50, openintro-statistics chunk-0010 Guided Practice 3.52-3.53 and exercise 3.26
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** replacement-comparison
- **Skills:** independence, without-replacement, complement-rule, conditional-probability
- **Misconceptions:** assumes-all-repeated-draws-are-independent, cannot-explain-why-answers-are-close, ignores-population-fraction
- **Core trick:** Replacement keeps each draw's denominator unchanged; without replacement updates counts, but the answers get close when the sample is small relative to the population.
- **Why it matters:** This builds practical intuition for when independence is a useful approximation and when exact dependent reasoning is needed.
- **Template sketch:** Generate a population size, target count, and number of draws. Ask learners to compute or compare P(no target) under both sampling methods, then identify which process is independent.
- **Interaction fit:** side-by-side fill-fraction, comparison slider, or choose-the-valid-model.
- **Solver feasibility:** exact Fraction for both products; optional decimal difference for explanation.
- **Legal notes:** Reuse the abstract contrast only; final items should use fresh scenarios and attribution notes.
- **Human status:** pending

### CAND-0007 — Specified mix in unordered draws

- **Source ids:** openintro-statistics chunk-0010 exercises 3.24-3.27 and 3.31
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** small-population-draws
- **Skills:** without-replacement, combinations, general-multiplication-rule, sample-space
- **Misconceptions:** counts-one-order-only, replaces-items-accidentally, double-counts-overlapping-cases
- **Core trick:** For an unordered sample with a required composition, count favorable combinations by category and divide by all possible samples.
- **Why it matters:** Many small-population questions become easier and less error-prone when students recognize "composition, not order."
- **Template sketch:** Generate 3-4 categories with small counts and draw `k` items without replacement. Ask for exactly a specified mix, such as two from one category and one from another. Solve as product of combinations over `C(total, k)`.
- **Interaction fit:** drag-counts-into-combination-formula or fill-fraction.
- **Solver feasibility:** exact Fraction using small binomial coefficients.
- **Legal notes:** Contexts and categories should be newly authored; do not copy source object collections or wording.
- **Human status:** pending

### CAND-0008 — Birthday-style collision via complement

- **Source ids:** openintro-statistics chunk-0010 exercise 3.28
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** collisions
- **Skills:** complement-rule, without-replacement-modeling, general-multiplication-rule, sample-space
- **Misconceptions:** only-checks-first-pair, assumes-collisions-are-rare-without-calculation, subtracts-pair-probabilities-directly
- **Core trick:** For "at least two match," compute the probability all outcomes are different first.
- **Why it matters:** Collision problems are memorable and prepare students for complements, counting, and surprising probability growth.
- **Template sketch:** Generate `n` selections from `m` equally likely labels with replacement and ask P(at least one repeated label). Solve as `1 - (m)_n / m^n` for friendly small values.
- **Interaction fit:** product-builder, simulation-before-exact-answer, or multiple-choice estimate.
- **Solver feasibility:** exact Fraction for small `m` and `n`; simulation can visualize the counterintuitive growth.
- **Legal notes:** Use new contexts rather than birthdays if desired; the source supplies the abstract complement method.
- **Human status:** pending

### CAND-0009 — Expected value from a discrete model

- **Source ids:** openintro-statistics chunk-0010 Examples 3.54-3.57, openintro-statistics chunk-0011 Guided Practice 3.59, openintro-statistics chunk-0012 exercises 3.29-3.30, openintro-statistics chunk-0013 exercises 3.33-3.35
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Expected value
- **Practice topic:** expected-value
- **Skills:** random-variable, probability-distribution, expected-value, weighted-average
- **Misconceptions:** averages-outcomes-without-probabilities, chooses-most-likely-outcome-as-average, expects-the-exact-average-every-time
- **Core trick:** Multiply each outcome by its probability and add; the result is a long-run average, not a guaranteed single-trial result.
- **Why it matters:** Expected value is the bridge from probability rules to decision-making, games, insurance, and revenue models.
- **Template sketch:** Generate a small probability distribution with 3-4 numeric outcomes and probabilities summing to 1. Ask for E(X) and then ask whether an individual trial must equal that value.
- **Interaction fit:** weighted-sum table, fill-number, or sort-outcome-probability pairs.
- **Solver feasibility:** exact Fraction or cents-safe integer arithmetic for expected value.
- **Legal notes:** Abstracts the discrete-random-variable structure; final contexts and figures should be original.
- **Human status:** pending

### CAND-0010 — Fair price for a chance game

- **Source ids:** openintro-statistics chunk-0012 exercise 3.30, openintro-statistics chunk-0013 exercises 3.31-3.36
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Expected value
- **Practice topic:** fair-games
- **Skills:** expected-value, net-profit, probability-distribution, complement-rule
- **Misconceptions:** ignores-cost-to-play, confuses-payout-with-profit, thinks-positive-top-prize-implies-positive-expected-value
- **Core trick:** Convert payouts to net profit first, then compute the weighted average to decide whether the game is favorable.
- **Why it matters:** This is a concrete way to make expected value feel useful and to challenge "big prize" intuition.
- **Template sketch:** Generate a simple game with mutually exclusive outcomes, payouts, and an entry cost. Ask for expected net profit and the maximum fair entry price.
- **Interaction fit:** payout-table builder, multiple-choice recommendation, or fill-cents.
- **Solver feasibility:** exact Fraction over finite outcomes; generator can keep all payouts integral and reduce to cents.
- **Legal notes:** Do not copy card or roulette setups directly into learner-facing content unless intentionally adapted with attribution; new random mechanisms are preferred.
- **Human status:** pending
