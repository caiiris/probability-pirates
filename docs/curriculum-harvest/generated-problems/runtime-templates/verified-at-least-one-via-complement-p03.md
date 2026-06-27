# Runtime Review — verified-at-least-one-via-complement-p03

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-at-least-one-via-complement-p03`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`

## Problem 1 — verified-at-least-one-via-complement-p03-p01

- **Instance id:** `verified-at-least-one-via-complement-p03:4048150833`
- **Difficulty:** 845
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
- **Simulation estimate:** 0.422740
- **Absolute diff:** 0.001444
- **5-sigma threshold:** 0.011041
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

