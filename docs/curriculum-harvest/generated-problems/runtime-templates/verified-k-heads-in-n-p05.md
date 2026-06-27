# Runtime Review — verified-k-heads-in-n-p05

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-k-heads-in-n-p05`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`, `independence`
- **Retrieval form:** `operation`

## Problem 1 — verified-k-heads-in-n-p05-p01

- **Instance id:** `verified-k-heads-in-n-p05:549092248`
- **Difficulty:** 800
- **Params:** {"n":2,"k":0}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 2 times. What is the probability of getting exactly 0 heads?
- **Answer:** 1/4
- **Rendered answer grades correct:** yes

### Worked Solution

**P(exactly 0 heads in 2 flips)**

- Each flip is independent with P(heads) = 1/2.
- Total equally-likely sequences: 2^2 = 4.
- Sequences with exactly 0 heads: C(2, 0) = 1.
- P(exactly 0 heads) = 1/4 = 1/4.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.250000
- **Simulation estimate:** 0.248900
- **Absolute diff:** 0.001100
- **5-sigma threshold:** 0.009682
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

