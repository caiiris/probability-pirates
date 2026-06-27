# Runtime Review — verified-k-heads-in-n-p03

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-k-heads-in-n-p03`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`, `independence`
- **Retrieval form:** `operation`

## Problem 1 — verified-k-heads-in-n-p03-p01

- **Instance id:** `verified-k-heads-in-n-p03:1404620174`
- **Difficulty:** 880
- **Params:** {"n":6,"k":6}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 6 times. What is the probability of getting exactly 6 heads?
- **Answer:** 1/64
- **Rendered answer grades correct:** yes

### Worked Solution

**P(exactly 6 heads in 6 flips)**

- Each flip is independent with P(heads) = 1/2.
- Total equally-likely sequences: 2^6 = 64.
- Sequences with exactly 6 heads: C(6, 6) = 1.
- P(exactly 6 heads) = 1/64 = 1/64.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.015625
- **Simulation estimate:** 0.015020
- **Absolute diff:** 0.000605
- **5-sigma threshold:** 0.002773
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

