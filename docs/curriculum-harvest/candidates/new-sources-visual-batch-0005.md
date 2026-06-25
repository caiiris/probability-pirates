### CAND-0001 — Long-run frequency settles down

- **Source ids:** seeing-theory-basic-probability chunk-0001 Chance Events, onlinestatbook-probability chunk-0001 overview
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 4 — Probability as long-run frequency
- **Practice topic:** long-run-frequency
- **Skills:** experimental-probability, theoretical-probability, relative-frequency, simulation
- **Misconceptions:** expects-exact-target-rate-in-small-samples, overreacts-to-early-runs, confuses-randomness-with-even-alternation
- **Core trick:** Compare a noisy running proportion to the fixed theoretical probability and notice that larger samples usually make the gap smaller.
- **Why it matters:** This builds the bridge between intuitive chance experiments and the simulation checks Pascal uses throughout probability practice.
- **Template sketch:** Generate a two-outcome event with probability `p`, then show batches of simulated trials. Ask learners to predict which run size is more likely to land close to `p`, or fill the running relative frequency after a generated tally.
- **Interaction fit:** run-size slider, animated tally, or choose-the-more-stable-run comparison.
- **Solver feasibility:** exact Fraction for theoretical `p`; simulation can use seeded Bernoulli trials and deterministic tolerance checks.
- **Legal notes:** Seeing Theory is used only for the interaction principle of linking repeated trials to convergence; all visuals, copy, scenarios, and code should be newly authored. Online Stat Book provides broad topic provenance.
- **Human status:** pending

### CAND-0002 — Make the coin unfair, then predict

- **Source ids:** seeing-theory-basic-probability chunk-0001 Chance Events
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 4 — Probability models and simple events
- **Practice topic:** biased-two-outcome-models
- **Skills:** probability-scale, complements, expected-relative-frequency, random-variable-encoding
- **Misconceptions:** assumes-two-outcome-means-even-chance, treats-complement-as-independent-number, ignores-that-probabilities-sum-to-one
- **Core trick:** Once one outcome has probability `p`, the other outcome is forced to have probability `1 - p`.
- **Why it matters:** Students often carry fair-coin instincts into weighted situations; this family makes the probability model explicit before adding compound events.
- **Template sketch:** Present a two-outcome spinner, token draw, or yes/no event with an adjustable probability. Ask for the complement probability and the expected number of target outcomes in `n` trials.
- **Interaction fit:** probability bar adjustment followed by fill-fraction or expected-count prompt.
- **Solver feasibility:** exact Fraction using friendly `p` values and integer `n`; expected count is `n * p`.
- **Legal notes:** Do not copy the source's coin interface or wording; use newly designed controls and contexts inspired only by the principle of adjustable outcome weights.
- **Human status:** pending

### CAND-0003 — Expected value as a weighted average

- **Source ids:** seeing-theory-basic-probability chunk-0001 Expectation, onlinestatbook-probability chunk-0001 overview
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 8 — Expected value
- **Practice topic:** expected-value
- **Skills:** random-variables, weighted-average, probability-distribution, exact-arithmetic
- **Misconceptions:** averages-outcomes-without-weights, chooses-most-likely-outcome-as-expected-value, expects-result-must-be-possible-outcome
- **Core trick:** Multiply each value by its probability, then add the products.
- **Why it matters:** Expected value is the reusable tool behind fair games, simulations, and later distribution reasoning.
- **Template sketch:** Generate a small discrete random variable with 3-5 outcomes and friendly probabilities. Ask for the expected value, then optionally ask which changed probability would move the expected value up or down.
- **Interaction fit:** draggable probability table, product-sum builder, or multiple-choice with weighted-average distractors.
- **Solver feasibility:** exact Fraction for each `value * probability`; final answer can be reduced fraction or terminating decimal when friendly.
- **Legal notes:** The final task should use fresh distributions and contexts; Seeing Theory is inspiration-only for the idea of connecting distribution weights to a center value.
- **Human status:** pending

### CAND-0004 — Same center, different spread

- **Source ids:** seeing-theory-basic-probability chunk-0001 Variance
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 8 — Expected value and variability
- **Practice topic:** variance-intuition
- **Skills:** expected-value, deviations-from-mean, variance, distribution-comparison
- **Misconceptions:** thinks-same-mean-implies-same-risk, uses-absolute-distance-when-square-is-needed, ignores-probability-weights
- **Core trick:** Measure spread by weighting squared distances from the expected value, not by looking only at the center.
- **Why it matters:** A middle-school-friendly spread comparison prepares students to understand why two games with equal average payoff can feel very different.
- **Template sketch:** Generate two small distributions with the same expected value but different concentration around that value. Ask which has larger spread and then compute one variance from a guided table of squared deviations.
- **Interaction fit:** distribution comparison cards, table-fill for deviations, or choose-the-riskier-game prompt.
- **Solver feasibility:** exact Fraction with small integer outcomes and friendly probabilities; variance can be computed deterministically from `sum p * (x - mean)^2`.
- **Legal notes:** Do not copy the source card-drawing design or visual layout; only the interaction principle of comparing running spread to a theoretical value is used.
- **Human status:** pending

### CAND-0005 — Birthday-style collision through complements

- **Source ids:** onlinestatbook-probability chunk-0001 overview
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Practice topic:** collision-probability
- **Skills:** complement-rule, multiplication-rule, without-replacement-counting, estimation
- **Misconceptions:** underestimates-collision-risk, adds-pair-probabilities-naively, treats-draws-as-independent-after-exclusion
- **Core trick:** Compute the chance that every draw is different first, then subtract from 1.
- **Why it matters:** Collision problems are surprising, memorable examples of why complements and sequential products can beat direct counting.
- **Template sketch:** Replace birthdays with a fresh high-school setting such as students choosing lockers, usernames, or colored tokens from `m` possibilities. Ask for P(at least one match) among `n` people or draws.
- **Interaction fit:** stepwise product builder, simulation toggle, or estimate-then-reveal multiple choice.
- **Solver feasibility:** exact Fraction for `1 - (m)_n / m^n` with small `n` and `m`; simulation can verify via seeded repeated trials.
- **Legal notes:** Online Stat Book mentions the demonstration topic only; learner-facing scenarios and parameters should be newly authored with attribution handled outside the prompt if needed.
- **Human status:** pending

### CAND-0006 — Streaks do not make a reversal due

- **Source ids:** onlinestatbook-probability chunk-0001 overview
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 5 — Independence and repeated trials
- **Practice topic:** gamblers-fallacy
- **Skills:** independence, conditional-probability, simulation, complements
- **Misconceptions:** expects-short-run-balancing, thinks-past-independent-results-change-next-probability, confuses-unlikely-streak-with-impossible-streak
- **Core trick:** For independent trials, the next-trial probability stays the same even after an unusual streak.
- **Why it matters:** This is a practical misconception trap that appears in games, sports, and risk decisions.
- **Template sketch:** Generate a streak from an independent two-outcome process, then ask for the probability of the next outcome or the chance of seeing a streak of length `k` somewhere in a short run.
- **Interaction fit:** streak simulator, next-outcome multiple choice, or before-after probability comparison.
- **Solver feasibility:** exact Fraction for next-trial questions; small streak questions can be solved by dynamic programming or exhaustive enumeration over binary strings.
- **Legal notes:** Use only the abstract fallacy and simulation idea; avoid copying any source demo framing or examples.
- **Human status:** pending

### CAND-0007 — Base rates before signals

- **Source ids:** onlinestatbook-probability chunk-0001 overview
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and Bayes
- **Practice topic:** bayes-base-rates
- **Skills:** base-rate-reasoning, bayes-rule, tree-diagrams, law-of-total-probability
- **Misconceptions:** treats-accuracy-as-posterior, ignores-rare-starting-rate, denominator-omits-false-positives
- **Core trick:** Count or weight all ways a positive signal can happen, then divide the target path by that total.
- **Why it matters:** Base-rate reasoning is one of the most important real-world applications of conditional probability.
- **Template sketch:** Use a synthetic population of `N` people/items with a rare trait, a hit rate, and a false-alarm rate. Ask for P(trait | positive signal) using either tree branches or expected counts.
- **Interaction fit:** tree-builder, population-grid counting, or denominator-selection prompt.
- **Solver feasibility:** exact Fraction over integer counts chosen so hit and false-alarm counts are whole numbers.
- **Legal notes:** Online Stat Book supplies only the topic cue; all contexts, wording, and numbers should be newly created with attribution recorded as required.
- **Human status:** pending

### CAND-0008 — Switching wins more often

- **Source ids:** onlinestatbook-probability chunk-0001 overview
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 6 — Conditional probability and counterintuitive games
- **Practice topic:** monty-hall
- **Skills:** conditional-probability, sample-space, strategy-comparison, simulation
- **Misconceptions:** assumes-two-remaining-options-are-equally-likely, ignores-host-information, conditions-on-the-wrong-process
- **Core trick:** Separate the first choice from the host's constrained reveal; the initial miss probability becomes the switch-win probability.
- **Why it matters:** This challenge makes conditional information concrete and gives students a reason to trust structured sample spaces over intuition.
- **Template sketch:** Use a newly themed hidden-prize game with `d` doors, one initial pick, and a host who reveals losing options according to a fixed rule. Ask whether stay or switch has higher win probability, starting with the classic three-door case and extending only if clear.
- **Interaction fit:** strategy simulator, sample-space table, or choose-the-better-strategy explanation.
- **Solver feasibility:** exact Fraction for classic `1/3` stay and `2/3` switch; generalized cases can be solved by enumerating prize location and host action rules.
- **Legal notes:** The Monty Hall problem is a common mathematical scenario, but final copy should use a fresh theme and avoid source demo wording or visual design.
- **Human status:** pending

### CAND-0009 — Binomial shape from trial count and chance

- **Source ids:** onlinestatbook-probability chunk-0001 overview, seeing-theory-basic-probability chunk-0001 Chance Events
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 7 — Binomial distributions
- **Practice topic:** binomial-counts
- **Skills:** independent-trials, binomial-probability, combinations, distribution-shape
- **Misconceptions:** multiplies-by-number-of-successes-instead-of-combinations, forgets-failure-factor, thinks-most-likely-count-must-equal-n-times-p-exactly
- **Core trick:** A count of successes needs three pieces: choose the success positions, multiply success probabilities, and multiply failure probabilities.
- **Why it matters:** Binomial reasoning ties together independence, complements, combinations, and visual distribution sense.
- **Template sketch:** Generate `n` repeated independent trials with success probability `p`. Ask for P(exactly `k` successes), then ask how the likely counts shift when `p` or `n` changes.
- **Interaction fit:** histogram prediction, formula-part matching, or slider-driven parameter comparison.
- **Solver feasibility:** exact Fraction for `C(n,k) p^k (1-p)^(n-k)` with small `n`; histogram values can be computed deterministically.
- **Legal notes:** Seeing Theory contributes only the broad interaction principle of changing a probability model and observing output changes; Online Stat Book provides topic provenance. Do not reuse source visuals, code, or prose.
- **Human status:** pending
