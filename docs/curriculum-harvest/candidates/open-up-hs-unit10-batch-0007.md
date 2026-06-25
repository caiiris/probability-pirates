### CAND-0001 — Rebuild a two-way table from partial summaries

- **Source ids:** open-up-hs-math-unit10-representations chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability from tables
- **Practice topic:** two-way-tables
- **Skills:** two-way-tables, percent-to-count, marginal-totals, joint-counts
- **Misconceptions:** uses-percent-of-whole-instead-of-row, forgets-table-totals-must-balance, rounds-before-finishing-counts
- **Core trick:** Convert each partial clue into the right row, column, or joint cell, then use margins to fill the remaining cells.
- **Why it matters:** Students often cannot reason with conditional probabilities until they can first reconstruct the data structure cleanly.
- **Template sketch:** Generate a 2x2 context with two group totals and either one joint count plus one conditional percent, or two compatible conditional clues. Ask learners to complete the table before finding any probability.
- **Interaction fit:** table-fill with locked margin cells and immediate balance checks.
- **Solver feasibility:** exact integer arithmetic; choose totals and percentages so every generated cell is whole.
- **Legal notes:** Inspired by the source's use of mixed counts and percentages, but all contexts, labels, and values should be newly authored.
- **Human status:** pending

### CAND-0002 — Choose the easiest representation for a probability

- **Source ids:** open-up-hs-math-unit10-representations chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional and compound probability
- **Practice topic:** representation-choice
- **Skills:** two-way-tables, venn-diagrams, tree-diagrams, conditional-probability, joint-probability
- **Misconceptions:** treats-all-representations-as-equally-readable, reads-branch-probabilities-as-counts, misses-overlap-in-venn-diagrams
- **Core trick:** Match the probability question to the representation where the needed numerator and denominator are most visible.
- **Why it matters:** Representation fluency lowers cognitive load and helps students pick efficient solution paths instead of memorizing one format.
- **Template sketch:** Show the same generated 2x2 data as a table, Venn diagram, and tree. Ask which representation makes a requested marginal, joint, or conditional probability easiest to read, then ask for the value.
- **Interaction fit:** representation-card choice followed by fill-fraction.
- **Solver feasibility:** one canonical generated data model can render all three views; answers are exact Fractions from the same cell counts.
- **Legal notes:** The abstract comparison among table, Venn, and tree formats is adapted from the source; final visuals and prompts should be original.
- **Human status:** pending

### CAND-0003 — Reverse the condition, change the denominator

- **Source ids:** open-up-hs-math-unit10-representations chunk-0001, open-up-hs-math-unit10-independence chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability
- **Practice topic:** conditional-denominators
- **Skills:** conditional-probability, two-way-tables, notation-translation, denominator-selection
- **Misconceptions:** assumes-p-a-given-b-equals-p-b-given-a, uses-overall-total-for-conditional, chooses-numerator-correctly-but-denominator-wrong
- **Core trick:** The event after the vertical bar defines the restricted group, so reversing the condition usually changes the denominator.
- **Why it matters:** Denominator errors are the central failure mode in table-based conditional probability and later Bayes reasoning.
- **Template sketch:** Generate a 2x2 table and ask paired questions such as `P(A | B)` and `P(B | A)`. Include a step where learners select the denominator before simplifying the fraction.
- **Interaction fit:** denominator highlight, fraction builder, or paired multiple-choice comparison.
- **Solver feasibility:** exact Fraction from generated table counts; distractors are easy to derive from whole-total and reversed-denominator mistakes.
- **Legal notes:** Uses only the general table-and-notation move from the source chunks; no source scenarios or wording should appear in learner copy.
- **Human status:** pending

### CAND-0004 — Translate probability notation into an event statement

- **Source ids:** open-up-hs-math-unit10-representations chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Probability notation and meaning
- **Practice topic:** notation-translation
- **Skills:** probability-notation, conditional-probability, joint-probability, complement-language
- **Misconceptions:** reads-and-as-or, ignores-given-condition, treats-not-a-or-b-as-not-a-and-not-b
- **Core trick:** Parse the symbol first: joint, conditional, complement, or union; then state the matching event in ordinary language.
- **Why it matters:** Students need notation-to-meaning fluency before formulas become useful rather than mechanical.
- **Template sketch:** Generate two everyday binary attributes with neutral labels. Ask learners to match expressions like `P(A and B)`, `P(A | B)`, `P(not A or B)`, or a displayed fraction to a plain-language event.
- **Interaction fit:** notation-to-card matching, sentence completion, or select-the-event multiple choice.
- **Solver feasibility:** deterministic symbolic templates with generated event names; no numeric solving required beyond optional fraction checks.
- **Legal notes:** The source includes notation interpretation prompts, but final event labels and wording must be freshly written.
- **Human status:** pending

### CAND-0005 — Use probabilities to support a data claim

- **Source ids:** open-up-hs-math-unit10-representations chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Interpreting probability from data
- **Practice topic:** evidence-from-probabilities
- **Skills:** marginal-probability, conditional-probability, comparative-reasoning, representation-interpretation
- **Misconceptions:** relies-on-raw-counts-when-groups-are-different-sizes, cherry-picks-one-rate, confuses-majority-overall-with-majority-within-groups
- **Core trick:** Compare rates with matching denominators before making a claim about which event is more common or more associated with a group.
- **Why it matters:** Probability should support interpretation, not just computation; this family connects tables to real data literacy.
- **Template sketch:** Generate two groups with different sizes and two outcomes. Ask which claim is best supported by the data, requiring at least one marginal probability and one conditional probability comparison.
- **Interaction fit:** claim-choice cards with required probability evidence slots.
- **Solver feasibility:** exact Fraction and percent comparison; generator can ensure one tempting raw-count claim conflicts with the rate-based conclusion.
- **Legal notes:** Adapts the pedagogical move of using multiple representations to justify a claim; source story, labels, and numeric structure should not be reused.
- **Human status:** pending

### CAND-0006 — Test independence by comparing conditional and marginal rates

- **Source ids:** open-up-hs-math-unit10-independence chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Independence
- **Practice topic:** independence-tests
- **Skills:** independence, conditional-probability, marginal-probability, two-way-tables
- **Misconceptions:** thinks-any-visible-difference-in-counts-means-dependence, compares-counts-instead-of-rates, treats-large-groups-as-automatically-dependent
- **Core trick:** Events are independent when the conditional probability matches the corresponding marginal probability.
- **Why it matters:** This gives students a concrete table-based test for independence before they use the multiplication rule abstractly.
- **Template sketch:** Generate 2x2 tables that are exactly independent, nearly but not exactly independent, or clearly dependent. Ask learners to compute `P(A | B)` and `P(A)`, then classify the relationship.
- **Interaction fit:** side-by-side fraction comparison with independent/dependent classification.
- **Solver feasibility:** exact Fraction comparison; independent tables can be generated from products of row and column margins.
- **Legal notes:** The source's independence-test structure is used with attribution; final contexts and numbers should be new.
- **Human status:** pending

### CAND-0007 — Use the multiplication rule after independence is established

- **Source ids:** open-up-hs-math-unit10-independence chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** multiplication-rule-independent
- **Skills:** multiplication-rule, independence, compound-events, repeated-trials
- **Misconceptions:** adds-probabilities-for-and, multiplies-without-checking-independence, forgets-to-include-each-required-stage
- **Core trick:** Once events are independent, multiply their individual probabilities to find the probability that all required events happen.
- **Why it matters:** The multiplication rule is a reusable engine for multi-step probability, from simple games to simulations and binomial reasoning.
- **Template sketch:** Generate two or three independent trials with friendly probabilities, using a new context such as app notifications, practice attempts, or spinner sections. Ask for the chance of a specified ordered sequence or all-success event.
- **Interaction fit:** stepwise product builder or tree path selection.
- **Solver feasibility:** exact Fraction product over small denominators; seeded simulation can verify long-run frequency.
- **Legal notes:** Based on the general independent-trial move; do not copy the source's dice, wheel, restaurant, or candy contexts.
- **Human status:** pending

### CAND-0008 — A streak does not change the next independent trial

- **Source ids:** open-up-hs-math-unit10-independence chunk-0001
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Independence and repeated trials
- **Practice topic:** gamblers-fallacy
- **Skills:** independence, conditional-probability, repeated-trials, fairness-reasoning
- **Misconceptions:** expects-short-run-balancing, thinks-a-rare-streak-forces-the-next-result, confuses-unusual-with-impossible
- **Core trick:** In an independent process, previous outcomes may be surprising evidence to investigate, but they do not by themselves change the next-trial probability.
- **Why it matters:** This is one of the most durable probability misconceptions and a strong bridge from formulas to real decision-making.
- **Template sketch:** Generate a fair or biased independent device and show a recent streak. Ask for the next-trial probability, then optionally ask what kind of long-run evidence would justify questioning the model.
- **Interaction fit:** next-outcome multiple choice plus simulation or evidence-threshold discussion card.
- **Solver feasibility:** exact Fraction for next-trial probability; optional fairness checks can compare observed counts to deterministic thresholds chosen by the template.
- **Legal notes:** The misconception structure is adapted from the source, but all final scenarios, labels, and copy should be newly authored.
- **Human status:** pending
