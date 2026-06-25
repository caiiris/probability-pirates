### CAND-0001 — Simulated trials versus exact probability

- **Source ids:** cmu-oli-probability-statistics chunk-0001 Module 8, cmu-oli-probability-statistics chunk-0002 Module 12
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 4 — Probability as long-run frequency
- **Practice topic:** simulation
- **Skills:** relative-frequency, theoretical-probability, simulation, sampling-variability
- **Misconceptions:** expects-small-samples-to-match-exactly, treats-simulation-as-proof, ignores-run-size
- **Core trick:** Use exact probability as the target and simulation as noisy evidence whose relative frequency usually stabilizes with more trials.
- **Why it matters:** It connects Pascal's simulation-first interactions to formal probability without implying that a short random run must be exact.
- **Template sketch:** Generate a simple Bernoulli or equally likely finite experiment, show seeded trial batches of different sizes, and ask which batch gives stronger evidence for the theoretical probability or to compute a running relative frequency.
- **Interaction fit:** animated tally, run-size comparison, or fill-fraction from simulated counts.
- **Solver feasibility:** exact Fraction for the theoretical probability; seeded simulation output can be generated deterministically and checked by count.
- **Legal notes:** CMU OLI is inspiration-only; do not copy its course wording, interactive activity design, or scenarios. Create fresh experiments and copy.
- **Human status:** pending

### CAND-0002 — Sample space before probability

- **Source ids:** cmu-oli-probability-statistics chunk-0001 Module 9
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 2 — Sample spaces and probability models
- **Practice topic:** sample-space
- **Skills:** sample-space-enumeration, equally-likely-outcomes, event-counting, probability-as-favorable-over-total
- **Misconceptions:** counts-categories-instead-of-outcomes, omits-ordered-outcomes, assumes-outcomes-are-equally-likely-without-model
- **Core trick:** List the possible outcomes under the stated model first, then count the outcomes that satisfy the event.
- **Why it matters:** This is the foundation for later complement, union, and conditional probability work; errors here silently corrupt every later calculation.
- **Template sketch:** Generate a two-stage age-appropriate experiment with small outcome sets, ask learners to complete or inspect the sample space, then compute the probability of a target event.
- **Interaction fit:** outcome-grid builder, multiple-select event membership, or fill-fraction.
- **Solver feasibility:** exact enumeration over generated finite outcomes, with Fraction reduction for the final probability.
- **Legal notes:** CMU OLI provides only topic inspiration; use newly authored contexts, labels, and event wording.
- **Human status:** pending

### CAND-0003 — Conditional denominator finder

- **Source ids:** cmu-oli-probability-statistics chunk-0001 Module 10, stat110-probability chunk-0001 Strategic Practice and Homework Problems
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 6 — Conditional probability
- **Practice topic:** conditional-probability
- **Skills:** conditional-probability, denominator-selection, two-way-tables, probability-interpretation
- **Misconceptions:** uses-grand-total-for-conditional, reverses-P-A-given-B, treats-condition-as-extra-event-to-add
- **Core trick:** Restrict attention to the condition first; the denominator is the size or probability of that restricted group.
- **Why it matters:** Denominator errors are the main failure mode in conditional probability and Bayes problems.
- **Template sketch:** Generate a two-way table or small population grid with two binary attributes, ask for P(A | B) or P(B | A), and require learners to identify the denominator before computing.
- **Interaction fit:** highlight-the-denominator plus fill-fraction, or table-click followed by numeric entry.
- **Solver feasibility:** exact Fraction from generated integer counts; answer validation can separately check denominator choice and final reduction.
- **Legal notes:** CMU OLI and Stat110 are inspiration-only here; no problem wording, solutions, homework framing, or distinctive scenarios should be reused.
- **Human status:** pending

### CAND-0004 — Probability tree path products

- **Source ids:** cmu-oli-probability-statistics chunk-0001 Module 10, stat110-probability chunk-0001 Strategic Practice and Homework Problems
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** probability-trees
- **Skills:** tree-diagram, multiplication-rule, conditional-branch-probability, joint-probability
- **Misconceptions:** adds-along-a-path, multiplies-by-unconditional-probability-after-branching, forgets-branch-probabilities-change
- **Core trick:** A single path probability is the product of the branch probabilities encountered along that path.
- **Why it matters:** Tree fluency gives learners a visual route into conditional probability, dependent events, and Bayes without memorizing formulas first.
- **Template sketch:** Generate a two-step process with either replacement or conditional branch weights, ask for the probability of one named path, and optionally compare it with a nearby path.
- **Interaction fit:** branch-label fill, path-highlighting, or fill-fraction after selecting the path.
- **Solver feasibility:** exact Fraction products over generated branch probabilities; tree labels can be generated from integer counts.
- **Legal notes:** Use only the abstract tree/multiplication learning objective; author all contexts and prompts from scratch.
- **Human status:** pending

### CAND-0005 — Binomial model fit checklist

- **Source ids:** cmu-oli-probability-statistics chunk-0001 Module 11, nist-stat-handbook-distributions chunk-0001 Discrete Distributions
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 7 — Random variables and distributions
- **Practice topic:** binomial
- **Skills:** binomial-conditions, independent-trials, fixed-number-of-trials, constant-success-probability, distribution-selection
- **Misconceptions:** uses-binomial-for-changing-probability, ignores-fixed-trial-count, treats-any-two-outcome-process-as-binomial
- **Core trick:** Before calculating, check for a fixed number of independent trials with the same success probability on each trial.
- **Why it matters:** A binomial formula is only useful when the model conditions are true; this candidate teaches model choice before computation.
- **Template sketch:** Present short newly authored experiment descriptions and ask whether a binomial model fits; when it fits, ask for one simple probability such as exactly k successes.
- **Interaction fit:** checklist classification followed by optional fill-fraction or multiple-choice calculation.
- **Solver feasibility:** model-fit classification is rule-based from generated flags; exact probability can use combinations and Fraction arithmetic for small n.
- **Legal notes:** CMU OLI is inspiration-only. NIST is used only as a reference source to verify distribution naming and formula conventions, not as learner-facing copy.
- **Human status:** pending

### CAND-0006 — Mixed-concept probability tool selector

- **Source ids:** stat110-probability chunk-0001 Strategic Practice and Homework Problems, cmu-oli-probability-statistics chunk-0001 Modules 9-11
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 6 — Mixed probability strategy review
- **Practice topic:** strategy-selection
- **Skills:** sample-space, complement-rule, multiplication-rule, conditional-probability, binomial-model-selection
- **Misconceptions:** grabs-the-most-recent-formula, misses-complement-shortcut, cannot-identify-problem-type-without-a-label
- **Core trick:** Choose the probability tool from the structure of the question before doing arithmetic.
- **Why it matters:** Learners can often solve tagged drills but struggle when the prompt does not announce the concept; mixed review builds transfer.
- **Template sketch:** Generate one compact prompt from a known-safe template family, hide the topic label, and ask learners to choose the best first move: enumerate outcomes, use a complement, multiply path probabilities, condition on a group, or check binomial conditions.
- **Interaction fit:** strategy multiple-choice, first-step card sort, or classify-then-solve.
- **Solver feasibility:** each generated prompt carries an internal strategy tag and optional deterministic solver from its source template family.
- **Legal notes:** Stat110 inspires only the concept-organized versus mixed-practice structure; do not copy any homework problems, solutions, document organization, or scenarios.
- **Human status:** pending

### CAND-0007 — Distribution reference guardrail

- **Source ids:** nist-stat-handbook-distributions chunk-0001 Gallery of Distributions
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Random variables and distributions
- **Practice topic:** distribution-reference
- **Skills:** formula-verification, parameterization-awareness, distribution-validity, reference-checking
- **Misconceptions:** mixes-parameterizations, trusts-formula-memory-without-checking, confuses-discrete-and-continuous-distributions
- **Core trick:** Treat distribution formulas as implementation references with explicit parameterization checks before building learner-facing templates.
- **Why it matters:** Probability templates that use named distributions need internal correctness checks so generated answers remain mathematically trustworthy.
- **Template sketch:** For internal template QA, compare Pascal's generated PMF/PDF or probability routine metadata against a reference note for distribution type, support, parameters, and expected solver method; do not expose NIST prose to learners.
- **Interaction fit:** internal validator checklist or authoring-time review aid, not a learner-facing activity.
- **Solver feasibility:** deterministic metadata and numeric spot checks for discrete distributions such as binomial and Poisson; continuous distributions should use approved library/reference checks with tolerances.
- **Legal notes:** NIST is a public-domain/reference source, but this batch uses it only for formula and parameterization correctness checks, not for copied explanatory text or student prompts.
- **Human status:** pending
