### CAND-0001 — Joint probability from a two-way table

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and two-way tables
- **Practice topic:** joint-probability
- **Skills:** two-way-table, joint-event, denominator-selection
- **Misconceptions:** uses-row-total-for-joint-event, confuses-and-with-or
- **Core trick:** For "A and B," use the interior cell count over the grand total.
- **Why it matters:** Joint events are the entry point for reading data tables as probability models.
- **Template sketch:** Generate a 2-by-3 or 3-by-3 table with positive integer counts, ask for the probability that a randomly selected item has one row category and one column category. Answer is cell / grandTotal.
- **Interaction fit:** fill-fraction or table-cell-select.
- **Solver feasibility:** exact Fraction from integer cell count and total.
- **Legal notes:** Inspired by table-reading structure only; scenarios, categories, and counts should be newly authored.
- **Human status:** pending

### CAND-0002 — Marginal probability from row or column totals

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and two-way tables
- **Practice topic:** marginal-probability
- **Skills:** two-way-table, marginal-total, denominator-selection
- **Misconceptions:** uses-an-interior-cell-instead-of-total, ignores-table-totals
- **Core trick:** Collapse across the irrelevant category, then divide the matching row or column total by the grand total.
- **Why it matters:** Marginal probabilities make students distinguish single-category events from combined events.
- **Template sketch:** Generate a completed two-way table, ask for P(row category) or P(column category). Answer is selected margin / grandTotal.
- **Interaction fit:** fill-fraction or highlight-row-column.
- **Solver feasibility:** exact Fraction from row or column sum and grand total.
- **Legal notes:** No source wording copied; use new contexts and generated table values.
- **Human status:** pending

### CAND-0003 — Conditional probability from a row restriction

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and two-way tables
- **Practice topic:** conditional-probability
- **Skills:** conditional-denominator, two-way-table, row-total
- **Misconceptions:** divides-by-grand-total-after-given-condition, reverses-given-and-asked
- **Core trick:** When a row condition is given, shrink the sample space to that row before reading the requested column.
- **Why it matters:** This is the concrete table version of P(A | B).
- **Template sketch:** Generate a table with row and column labels, give a row category, and ask for the probability of a column category among that row. Answer is cell / rowTotal.
- **Interaction fit:** fill-fraction with row-highlight.
- **Solver feasibility:** exact Fraction from selected cell and row total.
- **Legal notes:** Abstracted from the lesson's conditional-table move; final prompts should use original categories.
- **Human status:** pending

### CAND-0004 — Conditional probability from a column restriction

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and two-way tables
- **Practice topic:** conditional-probability
- **Skills:** conditional-denominator, two-way-table, column-total
- **Misconceptions:** uses-matching-row-total, treats-conditioning-as-symmetric
- **Core trick:** When a column condition is given, use the column total as the denominator, not the row total or grand total.
- **Why it matters:** Alternating row-given and column-given questions builds the habit of finding the conditioned sample space first.
- **Template sketch:** Generate a two-way table, give a column category, and ask for the probability of a row category among that column. Answer is cell / columnTotal.
- **Interaction fit:** fill-fraction with column-highlight.
- **Solver feasibility:** exact Fraction from selected cell and column total.
- **Legal notes:** New tables and language required; only the mathematical structure is reused.
- **Human status:** pending

### CAND-0005 — Same cell, different denominators

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and two-way tables
- **Practice topic:** conditional-vs-joint
- **Skills:** joint-event, conditional-denominator, compare-probabilities
- **Misconceptions:** thinks-cell-count-determines-probability-alone, denominator-neglect
- **Core trick:** The numerator can stay the same while the denominator changes with the question.
- **Why it matters:** Students often memorize table locations but miss that "given" changes the sample space.
- **Template sketch:** Use one highlighted cell and ask two questions: the joint probability over everyone and the conditional probability within a row or column. Answers are cell / grandTotal and cell / conditionalTotal.
- **Interaction fit:** paired fill-fraction or side-by-side comparison.
- **Solver feasibility:** exact Fractions for both ratios; compare by cross multiplication if needed.
- **Legal notes:** No learner-facing wording copied; use generated contexts and counts.
- **Human status:** pending

### CAND-0006 — Reverse conditionals are not interchangeable

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Conditional probability and base rates
- **Practice topic:** reverse-conditional
- **Skills:** conditional-probability, base-rate-awareness, two-way-table
- **Misconceptions:** assumes-p-a-given-b-equals-p-b-given-a, ignores-base-rates
- **Core trick:** P(A | B) and P(B | A) use the same cell but different denominators.
- **Why it matters:** This prepares students for Bayes and base-rate errors without starting with formulas.
- **Template sketch:** Generate a two-way table with uneven margins, ask for both P(row | column) and P(column | row), then ask which is larger. Answers use cell / columnTotal and cell / rowTotal.
- **Interaction fit:** two fill-fractions plus multiple-choice comparison.
- **Solver feasibility:** exact Fractions and deterministic comparison.
- **Legal notes:** Derived from generic two-way-table reasoning; scenarios must be original.
- **Human status:** pending

### CAND-0007 — Relative frequency table from counts

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 3 — Probability from data
- **Practice topic:** relative-frequency
- **Skills:** frequency-table, relative-frequency, decimal-or-fraction-conversion
- **Misconceptions:** divides-by-row-total-when-global-relative-frequency-is-asked, rounds-too-early
- **Core trick:** Convert each count to a probability by dividing by the total number of observations.
- **Why it matters:** Relative frequency connects empirical data to probability estimates.
- **Template sketch:** Generate a small count table and ask for one or several relative frequencies. Answer each as count / grandTotal, optionally rounded to a requested place.
- **Interaction fit:** table-fill, fill-decimal, or fill-fraction.
- **Solver feasibility:** exact Fraction plus deterministic decimal rounding.
- **Legal notes:** Use new survey categories and generated counts; attribution retained in metadata.
- **Human status:** pending

### CAND-0008 — Empirical table versus expected sample space

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 4 — Sample spaces and simulations
- **Practice topic:** simulation-vs-theory
- **Skills:** sample-space, relative-frequency, simulation-variation
- **Misconceptions:** expects-small-samples-to-match-exactly, treats-frequency-as-fixed-probability
- **Core trick:** A simulation table estimates theoretical probabilities, but small samples wobble around the expected pattern.
- **Why it matters:** It links sample spaces to long-run frequency before formal probability rules.
- **Template sketch:** Generate simulated outcomes for two independent uniform devices, display a count grid, and ask whether one result is plausible relative to the theoretical 1 / n^2 chance.
- **Interaction fit:** multiple-choice explanation or table-cell probability estimate.
- **Solver feasibility:** exact theoretical probability plus seeded simulation counts for display.
- **Legal notes:** Activity structure is generic; final version should use Pascal-authored devices and generated data.
- **Human status:** pending

### CAND-0009 — Diagonal event in a product sample space

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** sample-space-counting
- **Skills:** product-sample-space, event-counting, favorable-outcomes
- **Misconceptions:** counts-one-matching-outcome-only, uses-addition-instead-of-product-for-total-outcomes
- **Core trick:** In an n-by-n outcome grid, "both match" is the diagonal, so there are n favorable outcomes out of n^2.
- **Why it matters:** The diagonal visual is a durable counting shortcut for equality events.
- **Template sketch:** Choose n from 3 to 10 for two identical independent randomizers, ask for P(same outcome). Answer is n / n^2, reduced to 1 / n.
- **Interaction fit:** grid-highlight or fill-fraction.
- **Solver feasibility:** exact Fraction over small integers.
- **Legal notes:** Inspired by the two-roll table idea; use original wording and visuals.
- **Human status:** pending

### CAND-0010 — One ordered pair in a product sample space

- **Source ids:** illustrative-mathematics-hs-first-edition chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 4 — Sample spaces and simulations
- **Practice topic:** ordered-outcomes
- **Skills:** product-rule, ordered-pair, sample-space-size
- **Misconceptions:** treats-ordered-pair-as-unordered, counts-n-plus-m-instead-of-n-times-m
- **Core trick:** A specific ordered pair is one cell in an n-by-m grid.
- **Why it matters:** Ordered outcomes are the foundation for probability trees, tables, and later conditional paths.
- **Template sketch:** Generate two independent randomizers with n and m outcomes, ask for the probability of a specified first outcome and specified second outcome. Answer is 1 / (n * m), or weighted variants if each device has nonuniform probabilities.
- **Interaction fit:** fill-fraction or select-cell-on-grid.
- **Solver feasibility:** exact Fraction; uniform version requires only integer multiplication.
- **Legal notes:** No copied wording; source only informs the grid-based interaction pattern.
- **Human status:** pending
