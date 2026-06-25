### CAND-0001 — Conditional statement denominator finder

- **Source ids:** openstax-statistics-homework chunk-0001 §3.1, openstax-statistics-homework chunk-0003 §3.4
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability
- **Practice topic:** conditional-probability
- **Skills:** conditional-denominator, notation-translation, table-reading
- **Misconceptions:** uses-whole-sample-as-denominator, reverses-given-and-target, confuses-and-with-given
- **Core trick:** In `P(A | B)`, shrink the sample space to `B` first, then count the part that also satisfies `A`.
- **Why it matters:** Denominator choice is the central move in two-way table work and unlocks later Bayes reasoning.
- **Template sketch:** Generate a small two-way or three-way count table with friendly totals. Ask for a conditional probability from symbolic notation and from a sentence version, then require the learner to identify the denominator before computing the fraction.
- **Interaction fit:** denominator-highlighting plus fill-fraction.
- **Solver feasibility:** exact integer counts with Fraction reduction.
- **Legal notes:** CC BY 4.0 source permits adaptation with attribution; final prompts should use newly authored tables and contexts with no copied wording or source-specific entities.
- **Human status:** pending

### CAND-0002 — Independence versus disjoint evidence sorter

- **Source ids:** openstax-statistics-homework chunk-0002 §3.3, openstax-statistics-homework chunk-0003 §3.4
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 / Unit 6 — Independence and mutually exclusive events
- **Practice topic:** independence
- **Skills:** independence-test, mutually-exclusive-test, joint-probability, conditional-probability
- **Misconceptions:** treats-mutually-exclusive-as-independent, accepts-zero-overlap-as-no-relationship, compares-wrong-probabilities
- **Core trick:** Test disjointness with overlap, but test independence by comparing `P(A | B)` with `P(A)` or `P(A AND B)` with `P(A)P(B)`.
- **Why it matters:** Students often merge two different relationship ideas; separating the evidence prevents false claims in compound-event problems.
- **Template sketch:** Generate event counts or probabilities where events may be disjoint, independent, both in a degenerate case, or neither. Ask learners to classify the relationship and choose the numerical evidence that proves it.
- **Interaction fit:** multiple-choice classification followed by evidence selection.
- **Solver feasibility:** exact Fractions; generator can enforce each relationship case by construction.
- **Legal notes:** Inspired by OpenStax relationship-classification homework only; use new event labels, data, and wording. Attribute source in internal provenance.
- **Human status:** pending

### CAND-0003 — Reverse conditional from joint and marginal

- **Source ids:** openstax-statistics-homework chunk-0002 §3.3
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability
- **Practice topic:** conditional-probability
- **Skills:** joint-from-conditional, reverse-conditional, fraction-division
- **Misconceptions:** assumes-p-a-given-b-equals-p-b-given-a, forgets-to-find-joint-first, divides-by-wrong-marginal
- **Core trick:** Use the given conditional to find the overlap, then divide that overlap by the other event's probability.
- **Why it matters:** This is the algebraic bridge from basic conditionals to Bayes without introducing the theorem as a memorized formula.
- **Template sketch:** Provide `P(A)`, `P(B)`, and `P(A | B)` with friendly decimals or fractions. Ask for `P(A AND B)`, then `P(B | A)`, and optionally ask whether the events are independent.
- **Interaction fit:** two-step fill-fraction with an intermediate checkpoint.
- **Solver feasibility:** exact rational arithmetic from generated numerator/denominator pairs.
- **Legal notes:** No source scenario should be reused; this candidate extracts only the probability structure. CC BY 4.0 attribution required for adapted use.
- **Human status:** pending

### CAND-0004 — Missing marginal from independent union

- **Source ids:** openstax-statistics-homework chunk-0002 §3.3
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Addition rule and independence
- **Practice topic:** addition-rule
- **Skills:** inclusion-exclusion, independence, solve-for-unknown-probability
- **Misconceptions:** adds-probabilities-without-overlap, treats-independent-as-mutually-exclusive, cannot-rearrange-union-rule
- **Core trick:** For independent events, replace the overlap in the addition rule with a product, then solve the resulting one-variable equation.
- **Why it matters:** This turns formulas into relationships students can reason with, strengthening inclusion-exclusion beyond plug-in arithmetic.
- **Template sketch:** Give `P(A OR B)` and `P(A)` for independent events. Ask learners to rewrite the addition rule and solve for `P(B)` using friendly fractions or percentages.
- **Interaction fit:** equation-builder plus numeric-entry.
- **Solver feasibility:** generator can choose `P(A)` and `P(B)` first, compute the union, and ask the inverse problem.
- **Legal notes:** Adapt only the abstract inverse-probability move; write new labels and context. Include OpenStax attribution if promoted beyond candidate docs.
- **Human status:** pending

### CAND-0005 — Complete the contingency table

- **Source ids:** openstax-statistics-homework chunk-0003 §3.4
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 3 / Unit 6 — Tables as sample spaces
- **Practice topic:** contingency-tables
- **Skills:** table-total-accounting, missing-cell-inference, marginal-counts, complement-counts
- **Misconceptions:** fills-margins-before-cells, ignores-grand-total, double-counts-row-and-column-totals
- **Core trick:** Use row totals, column totals, and the grand total as constraints until every missing count is forced.
- **Why it matters:** Many probability table errors happen before probability begins; table completion builds the bookkeeping needed for reliable denominators.
- **Template sketch:** Generate a partially filled two-way table with one to four missing entries. Ask learners to fill the missing counts, then answer one probability question from the completed table.
- **Interaction fit:** table-cell entry followed by fill-fraction.
- **Solver feasibility:** exact integer table generation with consistency checks; probability answer reduces by Fraction.
- **Legal notes:** Source uses several real-data tables, but final templates should use synthetic categories and counts. No copied table labels, contexts, or numbers.
- **Human status:** pending

### CAND-0006 — Complement of a compound table condition

- **Source ids:** openstax-statistics-homework chunk-0001 §3.3, openstax-statistics-homework chunk-0002 §3.3
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Complements and compound events
- **Practice topic:** complement
- **Skills:** complement-rule, compound-event-notation, table-reading, de-morgan-intuition
- **Misconceptions:** negates-only-one-condition, confuses-not-a-and-b-with-not-a-or-not-b, counts-direct-event-when-complement-is-easier
- **Core trick:** Translate the forbidden compound event precisely, then subtract its probability from 1.
- **Why it matters:** This strengthens complement work beyond "not A" and prepares students for inclusive-or and Venn reasoning.
- **Template sketch:** Generate a small categorized sample space and ask for the chance of "not both" or "not this specific combined category." Include a prompt that asks learners to choose the matching complement statement before computing.
- **Interaction fit:** statement matching plus fill-fraction.
- **Solver feasibility:** exact count tables; complement computed as `(total - excludedCount) / total`.
- **Legal notes:** Use newly authored categories and learner-facing phrasing. Source is CC BY 4.0, but OpenStax/TEA attribution and trademark exclusions should be respected in downstream use.
- **Human status:** pending

### CAND-0007 — Sequential branch product reader

- **Source ids:** openstax-statistics-homework chunk-0003 §3.5
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** tree-diagrams
- **Skills:** tree-branch-products, compound-events, marginal-from-tree, independence
- **Misconceptions:** adds-branches-along-one-path, ignores-second-stage-denominator, assumes-all-branches-have-equal-chance
- **Core trick:** Multiply along one complete path; add only when combining separate paths.
- **Why it matters:** Tree diagrams give a visual route into compound probability, especially when stage probabilities are unequal.
- **Template sketch:** Generate a two-stage experiment with branch probabilities shown as fractions. Ask for one path probability and one marginal probability that requires adding all paths ending in a target outcome.
- **Interaction fit:** clickable path selection plus fill-fraction.
- **Solver feasibility:** exact Fraction multiplication and summation over generated branch arrays.
- **Legal notes:** Inspired by tree-diagram structure only; final scenarios, objects, and branch values should be new. Attribute OpenStax if adapted into docs or product credits.
- **Human status:** pending

### CAND-0008 — Without-replacement same-or-different paths

- **Source ids:** openstax-statistics-homework chunk-0003 §3.5
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Sampling without replacement
- **Practice topic:** without-replacement
- **Skills:** dependent-trials, tree-branch-products, complement-rule, add-disjoint-paths
- **Misconceptions:** keeps-denominator-fixed-after-draw, treats-different-outcomes-as-one-path, forgets-symmetric-paths
- **Core trick:** After the first draw, update the counts; compute same-category paths directly or use the complement of different-category paths.
- **Why it matters:** This is a concrete way to show why independence is a modeling assumption, not a default rule.
- **Template sketch:** Generate a container with two or three item categories and draw two items without replacement. Ask for probability of matching categories, different categories, or a specific ordered path, with an optional "solve two ways" complement prompt.
- **Interaction fit:** tree-fill interaction plus fill-fraction.
- **Solver feasibility:** exact sequential-count solver; simulation can draw from a finite array for validation.
- **Legal notes:** Do not reuse source food/object framing or wording. CC BY 4.0 adaptation is allowed with attribution, but candidate remains abstract.
- **Human status:** pending
