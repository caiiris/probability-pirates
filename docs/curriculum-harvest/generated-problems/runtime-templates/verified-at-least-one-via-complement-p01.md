# Runtime Review — verified-at-least-one-via-complement-p01

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-at-least-one-via-complement-p01`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`

## Problem 1 — verified-at-least-one-via-complement-p01-p01

- **Instance id:** `verified-at-least-one-via-complement-p01:2175510829`
- **Difficulty:** 890
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
- **Simulation estimate:** 0.759940
- **Absolute diff:** 0.002755
- **5-sigma threshold:** 0.009513
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

