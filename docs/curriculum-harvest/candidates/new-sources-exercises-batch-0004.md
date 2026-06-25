### CAND-0001 — Event notation translator

- **Source ids:** openstax-statistics-practice §3.1 chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 3 — Probability language and event notation
- **Practice topic:** event-notation
- **Skills:** complement-notation, union-notation, intersection-notation, conditional-notation
- **Misconceptions:** confuses-and-with-or, reverses-conditional-direction, treats-complement-as-opposite-category-only
- **Core trick:** Translate the words first, then choose the probability symbol that preserves the condition and event order.
- **Why it matters:** Students often fail later table and tree problems because they can compute but cannot parse the event statement.
- **Template sketch:** Generate two binary attributes with named events A/B and ask learners to match a short phrase to one of P(A), P(A^c), P(A and B), P(A or B), P(A|B), or P(B|A).
- **Interaction fit:** multiple-choice or card-sort.
- **Solver feasibility:** symbolic answer key only; no numeric solver needed beyond generated labels.
- **Legal notes:** No wording copied; use newly authored attributes and phrases. OpenStax attribution required if adapted beyond abstract inspiration.
- **Human status:** pending

### CAND-0002 — Missing category from total mass

- **Source ids:** openstax-statistics-practice §3.1 chunk-0001, libretexts-openintro-probability-exercises §2.1 chunk-0002
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 2 — Sample spaces and probability models
- **Practice topic:** complement
- **Skills:** total-probability, complement-rule, probability-model-validation
- **Misconceptions:** ignores-unlisted-outcome, denominator-confusion, assumes-visible-categories-are-complete
- **Core trick:** Use total probability 1, or total count N, to recover the category that was not stated directly.
- **Why it matters:** This is a lightweight bridge from counting outcomes to probability distributions and prepares learners for complement reasoning.
- **Template sketch:** Provide counts or probabilities for all but one category in a finite sample space, then ask for the missing category probability or count.
- **Interaction fit:** fill-fraction or numeric-entry.
- **Solver feasibility:** exact integer subtraction or Fraction subtraction with generated totals.
- **Legal notes:** No source category names or tables should be reused; generate fresh contexts and attribute if direct adaptation is used.
- **Human status:** pending

### CAND-0003 — Probability model validity checker

- **Source ids:** libretexts-openintro-probability-exercises §2.1 chunk-0002
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Random variables and expected value
- **Practice topic:** probability-distributions
- **Skills:** distribution-validity, nonnegative-probabilities, sum-to-one
- **Misconceptions:** checks-only-the-sum, allows-negative-probability, rejects-zero-probability-outcomes
- **Core trick:** A valid finite probability model needs every entry between 0 and 1 and all entries summing exactly to 1.
- **Why it matters:** Expected value templates depend on learners trusting and checking a probability model before using it.
- **Template sketch:** Generate several short probability rows over labeled outcomes, each with one possible flaw: sum too high, sum too low, negative entry, entry above 1, or valid with zeros.
- **Interaction fit:** multiple-select with reason chips.
- **Solver feasibility:** exact Fraction validation over generated rows.
- **Legal notes:** Stronger variant of CL-0008; no source wording or grade-distribution context copied.
- **Human status:** pending

### CAND-0004 — Two-way table operation switchboard

- **Source ids:** libretexts-openintro-probability-exercises §2.1 chunk-0002, openstax-statistics-practice §3.4 chunk-0002
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability
- **Practice topic:** contingency-tables
- **Skills:** joint-probability, marginal-probability, union-rule, conditional-probability
- **Misconceptions:** uses-total-denominator-for-conditional, double-counts-overlap-in-union, reads-row-and-column-backwards
- **Core trick:** Identify whether the prompt asks for a cell, margin, union, or conditional slice before calculating.
- **Why it matters:** This is the core table fluency behind many applied probability questions and a strong diagnostic for denominator errors.
- **Template sketch:** Generate a 2x3 integer table with row and column totals, then ask one randomly chosen operation type and require the matching fraction.
- **Interaction fit:** table-click plus fill-fraction, or multiple-choice with highlighted denominator.
- **Solver feasibility:** exact Fraction from generated cell, margin, union, or conditional denominator.
- **Legal notes:** Variant of CL-0002/CL-0006 with broader operation switching; generate new table labels and scenarios.
- **Human status:** pending

### CAND-0005 — Disjoint independent neither classifier

- **Source ids:** libretexts-openintro-probability-exercises §2.1 chunk-0001, openstax-statistics-practice §3.2 chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** independence
- **Skills:** disjoint-events, independence-test, conditional-probability
- **Misconceptions:** thinks-disjoint-means-independent, treats-overlap-as-dependence-proof, ignores-zero-probability-edge-case
- **Core trick:** Disjoint is about overlap being impossible; independence is about one event not changing the other's probability.
- **Why it matters:** This misconception is persistent and blocks correct reasoning about both Venn diagrams and conditional probabilities.
- **Template sketch:** Give either a short finite scenario or values for P(A), P(B), P(A and B), and ask learners to classify the relationship as disjoint, independent, both-impossible-edge, or neither.
- **Interaction fit:** multiple-choice with required explanation chip.
- **Solver feasibility:** exact comparisons: P(A and B) = 0 for disjoint and P(A and B) = P(A)P(B) for independent when probabilities are positive.
- **Legal notes:** Stronger variant of CL-0007; no source examples or wording copied.
- **Human status:** pending

### CAND-0006 — Multiplication assumption audit

- **Source ids:** libretexts-openintro-probability-exercises §2.1 chunk-0002, libretexts-openintro-probability-exercises §2.3 chunk-0003
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** independence
- **Skills:** independence-assumption, multiplication-rule, model-critique
- **Misconceptions:** multiplies-marginals-without-assumption, assumes-real-people-are-independent, confuses-random-pairing-with-related-outcomes
- **Core trick:** Multiplication of separate probabilities is a model choice unless independence is stated or justified.
- **Why it matters:** It turns probability from formula use into modeling judgment, especially in social or paired data contexts.
- **Template sketch:** Present two rates for paired or repeated selections and ask whether P(A and B) can be computed directly, requires an independence assumption, or should use provided joint data.
- **Interaction fit:** classify-then-calculate, with a short reason selection.
- **Solver feasibility:** exact Fraction multiplication only when the generated prompt marks the assumption valid; otherwise answer is a classification.
- **Legal notes:** Abstracted from repeated assumption-check exercises; create new contexts and avoid source-specific survey pairings.
- **Human status:** pending

### CAND-0007 — Base-rate diagnostic reversal

- **Source ids:** libretexts-openintro-probability-exercises §2.3 chunk-0003, openstax-statistics-practice §3.5 chunk-0002
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Bayes' theorem, intuitive
- **Practice topic:** bayes
- **Skills:** base-rate, conditional-reversal, tree-diagram, false-positive-rate
- **Misconceptions:** swaps-P-positive-given-condition-with-P-condition-given-positive, ignores-false-positives, overweights-test-accuracy
- **Core trick:** Split the population by true state first, then compare true positives to all positives.
- **Why it matters:** This is one of the clearest places where intuitive probability fails and a tree diagram fixes it.
- **Template sketch:** Generate a rare/common condition, sensitivity, and specificity; ask for P(condition | positive) or for the true-positive share among positive results.
- **Interaction fit:** tree-fill plus fill-percent.
- **Solver feasibility:** exact Fraction using friendly per-1000 or per-10000 counts.
- **Legal notes:** Variant of CL-0003; use fictional tests and neutral contexts, with attribution if directly adapted.
- **Human status:** pending

### CAND-0008 — Without-replacement target mix

- **Source ids:** libretexts-openintro-probability-exercises §2.4 chunk-0003
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** sampling-without-replacement
- **Skills:** without-replacement, combinations, sequential-products, unordered-outcomes
- **Misconceptions:** forgets-changing-denominator, counts-one-order-only, treats-unordered-as-ordered
- **Core trick:** Compute one valid order and multiply by the number of distinct orders, or use combinations directly.
- **Why it matters:** Learners need this move to go beyond "two of the same" draws into mixed-outcome sampling.
- **Template sketch:** Generate a small collection with 3-4 categories, draw k items without replacement, and ask for exactly a target composition such as one A and two B.
- **Interaction fit:** fill-fraction with order-builder support.
- **Solver feasibility:** exact Fraction via combinations or summed ordered products for small counts.
- **Legal notes:** Stronger variant of CL-0009; use new object sets and avoid source contexts.
- **Human status:** pending

### CAND-0009 — Replacement mode comparison

- **Source ids:** libretexts-openintro-probability-exercises §2.4 chunk-0003
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** sampling-without-replacement
- **Skills:** with-replacement, without-replacement, independence, denominator-update
- **Misconceptions:** uses-same-denominator-after-removal, assumes-similar-answers-mean-same-model, misses-when-replacement-restores-independence
- **Core trick:** Replacement keeps each draw's probability fixed; no replacement changes the next numerator and denominator.
- **Why it matters:** Comparing the two modes side by side makes independence visible rather than just named.
- **Template sketch:** Use the same generated collection and target event, ask for the probability under replacement and without replacement, then ask which mode gives the larger result.
- **Interaction fit:** two-step fill-fraction plus comparison choice.
- **Solver feasibility:** exact Fraction products with shared generated counts.
- **Legal notes:** Builds on CL-0009 but emphasizes contrast; no source wording copied.
- **Human status:** pending

### CAND-0010 — Prize table expected value with fee

- **Source ids:** libretexts-openintro-probability-exercises §2.5 chunk-0003, libretexts-openintro-probability-exercises §2.5 chunk-0004
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Expected value
- **Practice topic:** expected-value
- **Skills:** expected-value, net-gain, weighted-average, fair-game
- **Misconceptions:** averages-prize-amounts-equally, forgets-entry-fee, treats-largest-prize-as-most-important
- **Core trick:** Multiply each net outcome by its probability, then add the products.
- **Why it matters:** It connects probability models to decisions about games, prices, and risk.
- **Template sketch:** Generate a small prize schedule with mutually exclusive outcomes and an optional play cost; ask for expected net gain or the fair entry fee.
- **Interaction fit:** table-fill plus numeric-entry in cents or Fraction dollars.
- **Solver feasibility:** exact rational cents over small finite outcome spaces.
- **Legal notes:** Variant of CL-0005; create new prize structures and scenarios rather than copying card or roulette examples.
- **Human status:** pending

### CAND-0011 — Mean and spread under linear combinations

- **Source ids:** libretexts-openintro-probability-exercises §2.5 chunk-0004
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Expected value and variability
- **Practice topic:** random-variable-combinations
- **Skills:** expected-value-linearity, variance-addition, standard-deviation-scaling, independence
- **Misconceptions:** adds-standard-deviations-instead-of-variances, changes-mean-but-not-spread-under-scaling, thinks-subtracting-random-variables-subtracts-variances
- **Core trick:** Means add with signs and scaling; independent variances add after scaling by the square of the coefficient.
- **Why it matters:** It is a high-value extension once learners know expected value, especially for totals, net gains, and repeated plays.
- **Template sketch:** Generate two independent random quantities with means and standard deviations, then ask for the mean and standard deviation of aX + bY.
- **Interaction fit:** multi-step numeric-entry with variance scratchpad.
- **Solver feasibility:** exact arithmetic when variances are perfect squares or friendly decimals; otherwise use rounded decimal answers with tolerance.
- **Legal notes:** Abstracted from random-variable-combination exercises; no source contexts or wording copied.
- **Human status:** pending

### CAND-0012 — Fair stake for unequal win chances

- **Source ids:** libretexts-openintro-probability-exercises §2.5 chunk-0004
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Expected value
- **Practice topic:** fair-game
- **Skills:** expected-value, solve-for-unknown-payoff, odds, fairness
- **Misconceptions:** sets-stakes-equal-when-probabilities-differ, ignores-expected-loss, confuses-probability-with-payout
- **Core trick:** A fair wager makes expected value zero, so the less likely side needs the larger payoff.
- **Why it matters:** It gives expected value a concrete purpose and helps learners see why "fair" is not the same as "same amount."
- **Template sketch:** Generate a two-outcome contest with P(A) and P(B), one player's stake fixed, and ask what opposing stake makes the expected value zero.
- **Interaction fit:** fill-currency or equation-builder.
- **Solver feasibility:** exact Fraction or cents calculation from p * winAmount = (1 - p) * lossAmount.
- **Legal notes:** Inspired by abstract fair-bet structure only; use newly authored scenarios and avoid source team names.
- **Human status:** pending
