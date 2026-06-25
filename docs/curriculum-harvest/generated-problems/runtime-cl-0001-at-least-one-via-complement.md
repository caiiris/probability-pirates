# Runtime CL-0001 Review Set — At Least One Via Complement

> Generated from the actual runtime template via `generateInstance(atLeastOneViaComplementTemplate, rng)`, not from the earlier brief-only generator.
> Each item is checked by `answerToPayload` + `checkAnswer` and Monte-Carlo verified against `solve()`.

## Problem 1 — runtime-cl0001-p01

- **Instance id:** `at-least-one-via-complement:2175510829`
- **Template:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`
- **Difficulty:** 1250
- **Params:** {"m":4,"n":5}
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

- **Exact probability:** 0.762695
- **Simulation estimate:** 0.761380
- **Absolute diff:** 0.001315
- **5-sigma threshold:** 0.009513
- **Passed:** yes

## Problem 2 — runtime-cl0001-p02

- **Instance id:** `at-least-one-via-complement:889357735`
- **Template:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`
- **Difficulty:** 1200
- **Params:** {"m":2,"n":5}
- **Prompt:** A fair coin is flipped 5 times independently. What is the probability of getting heads at least once?
- **Answer:** 31/32
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one head in 5 flips)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/2 = 1/2.
- Trials are independent, so P(miss all 5) = (1/2)^5 = 1/32.
- P(at least one) = 1 − 1/32 = 31/32.

### Verification

- **Exact probability:** 0.968750
- **Simulation estimate:** 0.968100
- **Absolute diff:** 0.000650
- **5-sigma threshold:** 0.003891
- **Passed:** yes

## Problem 3 — runtime-cl0001-p03

- **Instance id:** `at-least-one-via-complement:957453949`
- **Template:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`
- **Difficulty:** 1000
- **Params:** {"m":2,"n":3}
- **Prompt:** A fair coin is flipped 3 times independently. What is the probability of getting heads at least once?
- **Answer:** 7/8
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one head in 3 flips)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/2 = 1/2.
- Trials are independent, so P(miss all 3) = (1/2)^3 = 1/8.
- P(at least one) = 1 − 1/8 = 7/8.

### Verification

- **Exact probability:** 0.875000
- **Simulation estimate:** 0.876400
- **Absolute diff:** 0.001400
- **5-sigma threshold:** 0.007395
- **Passed:** yes

## Problem 4 — runtime-cl0001-p04

- **Instance id:** `at-least-one-via-complement:4048695286`
- **Template:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`
- **Difficulty:** 1200
- **Params:** {"m":6,"n":4}
- **Prompt:** A fair six-sided die is rolled 4 times independently. What is the probability of getting a 6 at least once?
- **Answer:** 671/1296
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one 6 in 4 rolls)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/6 = 5/6.
- Trials are independent, so P(miss all 4) = (5/6)^4 = 625/1296.
- P(at least one) = 1 − 625/1296 = 671/1296.

### Verification

- **Exact probability:** 0.517747
- **Simulation estimate:** 0.517220
- **Absolute diff:** 0.000527
- **5-sigma threshold:** 0.011173
- **Passed:** yes

## Problem 5 — runtime-cl0001-p05

- **Instance id:** `at-least-one-via-complement:2107414615`
- **Template:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`
- **Difficulty:** 1050
- **Params:** {"m":4,"n":3}
- **Prompt:** A fair 4-sided die is rolled 3 times independently. What is the probability of getting a 1 at least once?
- **Answer:** 37/64
- **Rendered answer grades correct:** yes

### Worked Solution

**P(at least one 1 in 3 rolls)**

- Complement rule: P(at least one) = 1 − P(zero occurrences).
- P(miss on a single trial) = 1 − 1/4 = 3/4.
- Trials are independent, so P(miss all 3) = (3/4)^3 = 27/64.
- P(at least one) = 1 − 27/64 = 37/64.

### Verification

- **Exact probability:** 0.578125
- **Simulation estimate:** 0.576640
- **Absolute diff:** 0.001485
- **5-sigma threshold:** 0.011043
- **Passed:** yes

## Review Notes

- These are real runtime template instances.
- Review prompt voice, scenario variety, and whether the denominator labels feel appropriate.
- If approved, the next step is wiring a minimal practice UI to serve generated instances.

