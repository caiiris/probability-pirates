# Runtime Review — verified-k-heads-in-n-p02

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-k-heads-in-n-p02`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`, `independence`
- **Retrieval form:** `operation`

## Problem 1 — verified-k-heads-in-n-p02-p01

- **Instance id:** `verified-k-heads-in-n-p02:3314986074`
- **Difficulty:** 900
- **Params:** {"n":7,"k":7}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 7 times. What is the probability of getting exactly 7 heads?
- **Answer:** 1/128
- **Rendered answer grades correct:** yes

### Worked Solution

**P(exactly 7 heads in 7 flips)**

- Each flip is independent with P(heads) = 1/2.
- Total equally-likely sequences: 2^7 = 128.
- Sequences with exactly 7 heads: C(7, 7) = 1.
- P(exactly 7 heads) = 1/128 = 1/128.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.007813
- **Simulation estimate:** 0.007980
- **Absolute diff:** 0.000167
- **5-sigma threshold:** 0.001969
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

