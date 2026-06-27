# Model Inference Candidate Verification

> Deterministic generation and verification for self-authored model inference, simulation interpretation, and inverse spinner candidates.
> These are review artifacts only; no runtime app code is changed.

- **Problems verified:** 6
- **Generation mode:** static authored examples with deterministic scoring; no model/API calls
- **Source visual policy:** no source visual copying; any future visuals should be Pascal-authored
- **Missing taxonomy IDs:** `model-inference`, `inverse-spinner`, `sampling-noise`, `visual-model-match`, `simulation-table-match`, `multinomial-likelihood`

## model-inference-0001 — Choose the spinner from frequency counts

- **Candidate:** MI-CAND-0001
- **Difficulty tag:** medium-hard / model inference
- **Skill tags:** `relative-frequency`, `expected-counts`, `model-selection`, `inverse-spinner`
- **Misconceptions:** `expects-observed-counts-to-match-exactly`, `ignores-total-sample-size`, `chooses-largest-section-from-largest-count-only`
- **Taxonomy status:** `missing-canonical-topic:model-inference`, `missing-skill-id:inverse-spinner`
- **Sample size:** 60
- **Observed counts:** red 33, blue 17, yellow 10
- **Prompt:** A hidden 3-color spinner was spun 60 times. The counts were red 33, blue 17, yellow 10. Which candidate spinner is the best match?
- **Answer:** Spinner A is the best match.
- **Scoring method:** `expected-count-distance`
- **Verification result:** passed; selected A, intended A

### Candidate Scores

- **A:** red 1/2, blue 1/3, yellow 1/6; expected red 30, blue 20, yellow 10; score 18.000
- **C:** red 2/3, blue 1/6, yellow 1/6; expected red 40, blue 10, yellow 10; score 98.000
- **B:** red 1/3, blue 1/3, yellow 1/3; expected red 20, blue 20, yellow 20; score 278.000

### Worked Solution

- Convert each spinner to expected counts out of 60 spins.
- Spinner A expects about 30 red, 20 blue, and 10 yellow.
- That is closer to 33, 17, 10 than the fair spinner or the very-red spinner.

### Notes

- Uses distance from expected counts so students can reason visually before seeing likelihood language.
- Selected A because it has the smallest squared distance from expected counts.

## model-inference-0002 — Fair coin or biased coin from one run

- **Candidate:** MI-CAND-0002
- **Difficulty tag:** medium-hard / simulation interpretation
- **Skill tags:** `relative-frequency`, `fairness`, `sampling-noise`, `model-selection`
- **Misconceptions:** `calls-any-imbalance-proof-of-bias`, `ignores-that-random-runs-are-uneven`, `overweights-last-few-flips`
- **Taxonomy status:** `missing-canonical-topic:model-inference`, `missing-skill-id:sampling-noise`
- **Sample size:** 60
- **Observed counts:** heads 32, tails 28
- **Prompt:** A coin is flipped 60 times and lands heads 32 times, tails 28 times. Which model is most supported: fair, heads-biased, or tails-biased?
- **Answer:** The fair coin model is most supported.
- **Scoring method:** `multinomial-log-likelihood`
- **Verification result:** passed; selected A, intended A

### Candidate Scores

- **A:** fair coin: heads 1/2, tails 1/2; expected heads 30, tails 30; score -41.589
- **B:** heads-biased coin: heads 13/20, tails 7/20; expected heads 39, tails 21; score -43.180
- **C:** tails-biased coin: heads 7/20, tails 13/20; expected heads 21, tails 39; score -45.656

### Worked Solution

- A fair coin would expect 30 heads and 30 tails in 60 flips.
- The observed run is slightly high on heads, but 32 to 28 is still close to fair.
- The biased models make one side much too common compared with the data.

### Notes

- This is a sampling-noise example: uneven counts do not automatically mean a coin is unfair.
- Selected A because it has the largest multinomial log likelihood.

## model-inference-0003 — Loaded die or fair die

- **Candidate:** MI-CAND-0003
- **Difficulty tag:** hard / model inference
- **Skill tags:** `relative-frequency`, `multinomial-likelihood`, `fairness`, `die-models`
- **Misconceptions:** `checks-only-one-face-instead-of-the-whole-pattern`, `assumes-every-nonuniform-run-is-fair-noise`, `confuses-most-common-face-with-complete-model`
- **Taxonomy status:** `missing-canonical-topic:model-inference`, `missing-skill-id:multinomial-likelihood`
- **Sample size:** 60
- **Observed counts:** 1 6, 2 7, 3 8, 4 10, 5 12, 6 17
- **Prompt:** A six-sided die is rolled 60 times. The counts for faces 1 through 6 are 6, 7, 8, 10, 12, 17. Which model best explains the run?
- **Answer:** The high-face die model is most likely.
- **Scoring method:** `multinomial-log-likelihood`
- **Verification result:** passed; selected B, intended B

### Candidate Scores

- **B:** high-face die: 1/10, 1/10, 3/20, 3/20, 1/5, 3/10; expected 1 6, 2 6, 3 9, 4 9, 5 12, 6 18; score -103.863
- **A:** fair die: each face 1/6; expected 1 10, 2 10, 3 10, 4 10, 5 10, 6 10; score -107.506
- **C:** middle-heavy die: 1/10, 3/20, 1/4, 1/4, 3/20, 1/10; expected 1 6, 2 9, 3 15, 4 15, 5 9, 6 6; score -113.958

### Worked Solution

- The counts rise steadily toward the larger faces.
- The high-face model expects 6, 6, 9, 9, 12, 18 rolls across the six faces.
- That whole pattern is closer than a fair die or a middle-heavy die.

### Notes

- This is the real-bias counterpart to the fair-coin sampling-noise item.
- Selected B because it has the largest multinomial log likelihood.

## model-inference-0004 — Small sample chart with no exact match

- **Candidate:** MI-CAND-0004
- **Difficulty tag:** medium-hard / visual model match
- **Skill tags:** `expected-counts`, `small-sample-noise`, `chart-interpretation`, `model-selection`
- **Misconceptions:** `rejects-best-model-because-it-is-not-exact`, `forgets-small-samples-are-lumpy`, `chooses-the-model-with-the-same-largest-bar-only`
- **Taxonomy status:** `missing-canonical-topic:model-inference`, `missing-skill-id:visual-model-match`
- **Sample size:** 10
- **Observed counts:** red 4, blue 4, yellow 2
- **Prompt:** A short simulation made this bar chart after 10 spins: red 4, blue 4, yellow 2. Which spinner is the best visual match, even though none matches exactly?
- **Answer:** Spinner A is the best visual match, even though the observed bars are not exact.
- **Scoring method:** `expected-count-distance`
- **Verification result:** passed; selected A, intended A

### Candidate Scores

- **A:** red 1/2, blue 3/10, yellow 1/5; expected red 5, blue 3, yellow 2; score 2.000
- **B:** red 1/3, blue 1/3, yellow 1/3; expected red 3.333, blue 3.333, yellow 3.333; score 2.667
- **C:** red 3/5, blue 1/5, yellow 1/5; expected red 6, blue 2, yellow 2; score 8.000

### Worked Solution

- Out of 10 spins, Spinner A expects 5 red, 3 blue, and 2 yellow.
- The chart shows 4 red, 4 blue, and 2 yellow, only one spin away in red and blue.
- With only 10 spins, exact matching is not expected.

### Notes

- Required small-sample example: the best visual match is deliberately not exact.
- Selected A because it has the smallest squared distance from expected counts.

## model-inference-0005 — Match a simulation table to a model

- **Candidate:** MI-CAND-0005
- **Difficulty tag:** hard / simulation interpretation
- **Skill tags:** `simulation-table`, `relative-frequency`, `multinomial-likelihood`, `model-selection`
- **Misconceptions:** `compares-only-the-largest-category`, `ignores-low-frequency-categories`, `treats-a-simulation-table-as-a-guaranteed-ratio`
- **Taxonomy status:** `missing-canonical-topic:model-inference`, `missing-skill-id:simulation-table-match`
- **Sample size:** 80
- **Observed counts:** art 37, robotics 24, ecology 12, music 7
- **Prompt:** A classroom simulator assigns each student one of four project topics. In 80 simulated students, the table was art 37, robotics 24, ecology 12, music 7. Which probability model most likely generated the table?
- **Answer:** The art-leaning model is most likely.
- **Scoring method:** `multinomial-log-likelihood`
- **Verification result:** passed; selected B, intended B

### Candidate Scores

- **B:** art-leaning: 9/20, 3/10, 3/20, 1/10; expected art 36, robotics 24, ecology 12, music 8; score -97.324
- **C:** robotics-leaning: 3/10, 2/5, 1/5, 1/10; expected art 24, robotics 32, ecology 16, music 8; score -101.969
- **A:** balanced: 1/4 each; expected art 20, robotics 20, ecology 20, music 20; score -110.904

### Worked Solution

- The observed table is about 46%, 30%, 15%, and 9%.
- The art-leaning model expects 45%, 30%, 15%, and 10%.
- That matches all four categories better than a balanced or robotics-leaning model.

### Notes

- Uses a non-spinner context while keeping the reasoning probability-first.
- Selected B because it has the largest multinomial log likelihood.

## model-inference-0006 — Noise or bias on an equal spinner

- **Candidate:** MI-CAND-0006
- **Difficulty tag:** medium-hard / sampling noise
- **Skill tags:** `sampling-noise`, `fairness`, `relative-frequency`, `model-selection`
- **Misconceptions:** `declares-bias-from-a-small-lead`, `expects-equal-spinner-counts-to-be-equal-every-time`, `ignores-plausible-random-variation`
- **Taxonomy status:** `missing-canonical-topic:model-inference`, `missing-skill-id:sampling-noise`
- **Sample size:** 24
- **Observed counts:** red 9, blue 8, yellow 7
- **Prompt:** An equal 3-section spinner is tested for 24 spins and gives red 9, blue 8, yellow 7. A student says red must be favored. Which model is best supported?
- **Answer:** The equal spinner model is still best supported.
- **Scoring method:** `multinomial-log-likelihood`
- **Verification result:** passed; selected A, intended A

### Candidate Scores

- **A:** equal spinner: 1/3, 1/3, 1/3; expected red 8, blue 8, yellow 8; score -26.367
- **B:** red-favored spinner: 9/20, 7/20, 1/5; expected red 10.800, blue 8.400, yellow 4.800; score -26.851
- **C:** yellow-favored spinner: 1/5, 7/20, 9/20; expected red 4.800, blue 8.400, yellow 10.800; score -28.473

### Worked Solution

- An equal spinner expects 8, 8, and 8 spins in 24 tries.
- The observed 9, 8, 7 is very close to that expectation.
- The red-favored model would predict a bigger red lead and a smaller yellow count than we saw.

### Notes

- Explicitly contrasts sampling noise with a claim of real bias.
- Selected A because it has the largest multinomial log likelihood.

