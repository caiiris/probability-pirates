# Runtime Review — verified-at-least-one-via-complement-p04

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-at-least-one-via-complement-p04`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`

## Problem 1 — verified-at-least-one-via-complement-p04-p01

- **Instance id:** `verified-at-least-one-via-complement-p04:956615306`
- **Difficulty:** 830
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
- **Simulation estimate:** 0.937980
- **Absolute diff:** 0.000480
- **5-sigma threshold:** 0.005413
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

