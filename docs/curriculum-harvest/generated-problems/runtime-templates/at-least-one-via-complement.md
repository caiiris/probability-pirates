# Runtime Review — at-least-one-via-complement

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`

## Problem 1 — at-least-one-via-complement-p01

- **Instance id:** `at-least-one-via-complement:2175510829`
- **Difficulty:** 1250
- **Params:** {"m":4,"n":5}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair 4-sided die is rolled 5 times independently. What is the probability of getting a 1 at least once?
- **Answer:** 781/1024
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one 1 in 5 rolls)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/4 = 3/4.
- Trials are independent, so P(miss all 5) = (3/4)^5 = 243/1024.
- P(at least one) = 1 − 243/1024 = 781/1024.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.762695
- **Simulation estimate:** 0.761800
- **Absolute diff:** 0.000895
- **5-sigma threshold:** 0.009513
- **Passed:** yes

## Problem 2 — at-least-one-via-complement-p02

- **Instance id:** `at-least-one-via-complement:2174672186`
- **Difficulty:** 950
- **Params:** {"m":4,"n":2}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair 4-sided die is rolled 2 times independently. What is the probability of getting a 1 at least once?
- **Answer:** 7/16
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one 1 in 2 rolls)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/4 = 3/4.
- Trials are independent, so P(miss all 2) = (3/4)^2 = 9/16.
- P(at least one) = 1 − 9/16 = 7/16.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.437500
- **Simulation estimate:** 0.437380
- **Absolute diff:** 0.000120
- **5-sigma threshold:** 0.011093
- **Passed:** yes

## Problem 3 — at-least-one-via-complement-p03

- **Instance id:** `at-least-one-via-complement:4048150833`
- **Difficulty:** 1100
- **Params:** {"m":6,"n":3}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair six-sided die is rolled 3 times independently. What is the probability of getting a 6 at least once?
- **Answer:** 91/216
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one 6 in 3 rolls)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/6 = 5/6.
- Trials are independent, so P(miss all 3) = (5/6)^3 = 125/216.
- P(at least one) = 1 − 125/216 = 91/216.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.421296
- **Simulation estimate:** 0.416920
- **Absolute diff:** 0.004376
- **5-sigma threshold:** 0.011041
- **Passed:** yes

## Problem 4 — at-least-one-via-complement-p04

- **Instance id:** `at-least-one-via-complement:956615306`
- **Difficulty:** 1100
- **Params:** {"m":2,"n":4}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 4 times independently. What is the probability of getting heads at least once?
- **Answer:** 15/16
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one head in 4 flips)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/2 = 1/2.
- Trials are independent, so P(miss all 4) = (1/2)^4 = 1/16.
- P(at least one) = 1 − 1/16 = 15/16.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.937500
- **Simulation estimate:** 0.938340
- **Absolute diff:** 0.000840
- **5-sigma threshold:** 0.005413
- **Passed:** yes

## Problem 5 — at-least-one-via-complement-p05

- **Instance id:** `at-least-one-via-complement:890490568`
- **Difficulty:** 900
- **Params:** {"m":2,"n":2}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 2 times independently. What is the probability of getting heads at least once?
- **Answer:** 3/4
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one head in 2 flips)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/2 = 1/2.
- Trials are independent, so P(miss all 2) = (1/2)^2 = 1/4.
- P(at least one) = 1 − 1/4 = 3/4.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.750000
- **Simulation estimate:** 0.751420
- **Absolute diff:** 0.001420
- **5-sigma threshold:** 0.009682
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

