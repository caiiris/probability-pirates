# Runtime Review — verified-at-least-one-via-complement-p05

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-at-least-one-via-complement-p05`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`

## Problem 1 — verified-at-least-one-via-complement-p05-p01

- **Instance id:** `verified-at-least-one-via-complement-p05:890490568`
- **Difficulty:** 760
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
- **Simulation estimate:** 0.751380
- **Absolute diff:** 0.001380
- **5-sigma threshold:** 0.009682
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

