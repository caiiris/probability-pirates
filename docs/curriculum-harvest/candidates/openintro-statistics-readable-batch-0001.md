### CAND-0001 — Event Or Complement Sorting

- **Source ids:** openintro-statistics chunk-0001 §3.1.2-3.1.3, openintro-statistics chunk-0003 §3.1.6
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Sample spaces and complements
- **Practice topic:** sample-space
- **Skills:** identify-sample-space, define-event, complement-rule
- **Misconceptions:** treats-complement-as-opposite-label-only, omits-valid-outcomes, includes-overlapping-outcomes
- **Core trick:** Build the whole outcome set first, then classify each outcome as inside the event or inside its complement.
- **Why it matters:** Students need a concrete bridge from everyday random processes to formal event notation before probability rules feel meaningful.
- **Template sketch:** Generate a small finite process with 4-12 equally likely outcomes and a rule-defined event A. Ask learners to list or count A, Ac, and the full sample space before computing P(A) and P(Ac).
- **Interaction fit:** card-sort or multi-select with immediate set-size feedback.
- **Solver feasibility:** exact enumeration of generated outcomes with Fraction probabilities.
- **Legal notes:** No learner-facing wording copied; use newly authored processes and labels while retaining internal attribution.
- **Human status:** pending

### CAND-0002 — Disjoint Or Not

- **Source ids:** openintro-statistics chunk-0001 §3.1.3, openintro-statistics chunk-0002 §3.1.3
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** disjoint-events
- **Skills:** identify-disjoint-events, event-overlap, addition-rule-disjoint
- **Misconceptions:** assumes-different-labels-mean-disjoint, confuses-disjoint-with-independent, overlooks-shared-outcomes
- **Core trick:** Two events are disjoint only when their outcome sets have no overlap.
- **Why it matters:** Disjointness determines whether simple addition is valid and prevents students from applying formulas by keyword.
- **Template sketch:** Generate two named events from a shared finite sample space. Ask whether they can happen together, then compute P(A or B) when the overlap is empty.
- **Interaction fit:** yes-no classification followed by fill-fraction.
- **Solver feasibility:** exact set intersection and Fraction arithmetic.
- **Legal notes:** Scenarios, outcome labels, and prompts should be original; source is used for the abstract event-classification move.
- **Human status:** pending

### CAND-0003 — Inclusive Or Double Count

- **Source ids:** openintro-statistics chunk-0002 §3.1.4
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** general-addition-rule
- **Skills:** inclusive-or, intersection, general-addition-rule, venn-diagram-reading
- **Misconceptions:** interprets-or-as-exclusive, double-counts-overlap, subtracts-wrong-region
- **Core trick:** Add both event probabilities, then subtract the intersection once because it was counted twice.
- **Why it matters:** This is the first durable repair for "or" problems where events can overlap, and it supports later conditional table work.
- **Template sketch:** Provide counts or probabilities for A, B, and A and B in a finite population. Ask for P(A or B), with a distractor equal to P(A)+P(B).
- **Interaction fit:** Venn-region selection plus fill-fraction.
- **Solver feasibility:** exact Fraction arithmetic from generated counts with consistency checks.
- **Legal notes:** Avoid source-specific card and dataset wording in final copy; use fresh contexts and parameters.
- **Human status:** pending

### CAND-0004 — Neither From A Venn Diagram

- **Source ids:** openintro-statistics chunk-0002 §3.1.4, openintro-statistics chunk-0004 exercises 3.7-3.8
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Events, complements, and overlap
- **Practice topic:** complements
- **Skills:** general-addition-rule, complement-rule, venn-diagram-reading
- **Misconceptions:** treats-neither-as-intersection, forgets-total-must-be-one, subtracts-only-one-event
- **Core trick:** Find the union first, then take its complement to get the probability that neither event occurs.
- **Why it matters:** "Neither" questions test whether students can combine event algebra moves rather than follow a single formula cue.
- **Template sketch:** Generate a two-event survey-style setup with P(A), P(B), and P(A and B). Ask for P(neither A nor B), expecting 1 - [P(A)+P(B)-P(A and B)].
- **Interaction fit:** fill-fraction or drag labels into Venn regions.
- **Solver feasibility:** exact Fraction arithmetic with generated integer totals.
- **Legal notes:** Use newly authored survey variables and counts; no source wording or named data sets copied.
- **Human status:** pending

### CAND-0005 — Valid Probability Distribution

- **Source ids:** openintro-statistics chunk-0002 §3.1.5, openintro-statistics chunk-0003 §3.1.5
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Sample spaces and distributions
- **Practice topic:** probability-distributions
- **Skills:** validate-distribution, disjoint-outcomes, probability-sum-to-one
- **Misconceptions:** accepts-negative-probability, ignores-total-probability, treats-overlapping-categories-as-distribution
- **Core trick:** A proposed distribution is valid only when outcomes are disjoint, each probability is between 0 and 1, and the total is exactly 1.
- **Why it matters:** This builds a habit of checking probability models before computing from them.
- **Template sketch:** Present three candidate distributions over small categories. Exactly one is valid; the invalid options violate either range, total, or disjointness.
- **Interaction fit:** multiple-choice with reason selection.
- **Solver feasibility:** generated tables can be validated deterministically by checking range, sum, and category uniqueness.
- **Legal notes:** Use original categories and numbers; retain source attribution only in internal docs.
- **Human status:** pending

### CAND-0006 — At Least One Via Complement

- **Source ids:** openintro-statistics chunk-0003 §3.1.6, openintro-statistics chunk-0004 guided practice 3.23 and exercises 3.5, 3.10
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Complements and independent trials
- **Practice topic:** complement
- **Skills:** complement-rule, independent-trials, multiplication-rule
- **Misconceptions:** adds-trial-probabilities, counts-success-cases-directly, misses-that-at-least-one-is-not-none
- **Core trick:** Compute the probability of zero successes, then subtract that result from 1.
- **Why it matters:** This is a high-leverage shortcut for common "at least one" questions and prepares students for more advanced repeated-trial reasoning.
- **Template sketch:** Generate n independent attempts with success probability p. Ask P(at least one success), solved as 1 - (1 - p)^n.
- **Interaction fit:** fill-fraction with optional step prompt for the complement event.
- **Solver feasibility:** exact Fraction exponentiation for small n and rational p.
- **Legal notes:** Avoid copying source scenarios; use generic Pascal-authored contexts such as attempts, signals, or selections.
- **Human status:** pending

### CAND-0007 — Independent And Chain

- **Source ids:** openintro-statistics chunk-0003 §3.1.7, openintro-statistics chunk-0004 guided practices 3.23-3.24
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Independence and multiplication
- **Practice topic:** independence
- **Skills:** multiplication-rule, independent-processes, compound-event
- **Misconceptions:** adds-independent-probabilities, assumes-repeated-events-get-more-likely, forgets-complement-probability
- **Core trick:** For independent processes, multiply each required branch probability in the chain.
- **Why it matters:** Students need a simple, parameterizable model for "all of these happen" before conditional tree diagrams add dependency.
- **Template sketch:** Generate 2-5 independent selections or trials with one or more required attributes. Ask for the probability that all specified outcomes occur.
- **Interaction fit:** stepwise expression builder or fill-fraction.
- **Solver feasibility:** exact Fraction multiplication across generated factors.
- **Legal notes:** Use original contexts and labels; source is only the pedagogy for independent multiplication.
- **Human status:** pending

### CAND-0008 — Independence Test From Event Data

- **Source ids:** openintro-statistics chunk-0004 §3.1.7 and exercises 3.7-3.9, openintro-statistics chunk-0007 §3.2.6
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Independence versus disjointness
- **Practice topic:** independence
- **Skills:** test-independence, compare-product-to-intersection, distinguish-disjoint-independent
- **Misconceptions:** thinks-overlap-implies-independence, thinks-disjoint-events-are-independent, compares-to-wrong-marginal
- **Core trick:** Check whether P(A and B) equals P(A) times P(B); disjoint nonzero events fail this test automatically.
- **Why it matters:** Independence is a conceptual trap because it sounds like "separate categories" rather than "unchanged probability."
- **Template sketch:** Provide P(A), P(B), and P(A and B), sometimes with zero overlap. Ask whether the events are independent, disjoint, both, or neither.
- **Interaction fit:** four-option classification with calculated feedback.
- **Solver feasibility:** exact Fraction comparison and optional generated Venn consistency.
- **Legal notes:** Avoid source exercise wording; use newly generated event pairs.
- **Human status:** pending

### CAND-0009 — Conditional Probability From A Table

- **Source ids:** openintro-statistics chunk-0005 §3.2.1-3.2.3, openintro-statistics chunk-0006 §3.2.3-3.2.4
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability
- **Practice topic:** conditional-probability
- **Skills:** read-contingency-table, marginal-probability, joint-probability, conditional-probability
- **Misconceptions:** divides-by-grand-total-instead-of-condition, swaps-outcome-and-condition, uses-row-total-when-column-total-is-needed
- **Core trick:** Restrict attention to the condition group, then divide the matching joint count by that condition total.
- **Why it matters:** This is the core table-reading move behind diagnostics, classifier accuracy, survey breakdowns, and base-rate lessons.
- **Template sketch:** Generate a 2x2 contingency table with row and column totals. Ask for P(A|B), P(B|A), and a marginal or joint probability for contrast.
- **Interaction fit:** table cell highlighting followed by fill-fraction.
- **Solver feasibility:** exact integer counts with reduced Fraction answers.
- **Legal notes:** Do not reuse source datasets or wording; create new tables from generated counts.
- **Human status:** pending

### CAND-0010 — Tree Diagram Reverse Conditional

- **Source ids:** openintro-statistics chunk-0007 §3.2.7-3.2.8
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Probability trees and Bayes/base rates
- **Practice topic:** Bayes-base-rates
- **Skills:** probability-tree, general-multiplication-rule, total-probability, reverse-conditional
- **Misconceptions:** confuses-P-A-given-B-with-P-B-given-A, ignores-base-rate, uses-only-the-true-positive-branch
- **Core trick:** Multiply along branches to get joint probabilities, add all branches matching the observed result, then divide the target branch by that total.
- **Why it matters:** This makes base-rate neglect visible and turns Bayes' theorem into a sequence of concrete tree operations.
- **Template sketch:** Generate a two-stage situation with base rate P(A), conditional rates P(B|A) and P(B|Ac), then ask for P(A|B). Include distractors for P(B|A) and the target joint probability.
- **Interaction fit:** interactive tree fill-in followed by fill-fraction or multiple-choice.
- **Solver feasibility:** exact Fraction branch multiplication and total-probability denominator.
- **Legal notes:** Use original non-medical or carefully authored contexts unless human review approves sensitive domains; no source wording copied.
- **Human status:** pending
