# Runtime Review — verified-at-least-one-via-complement-p02

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-at-least-one-via-complement-p02`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`

## Problem 1 — verified-at-least-one-via-complement-p02-p01

- **Instance id:** `verified-at-least-one-via-complement-p02:2174672186`
- **Difficulty:** 785
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
- **Simulation estimate:** 0.439660
- **Absolute diff:** 0.002160
- **5-sigma threshold:** 0.011093
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

