# Runtime Review — verified-k-heads-in-n-p04

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-k-heads-in-n-p04`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`, `independence`
- **Retrieval form:** `operation`

## Problem 1 — verified-k-heads-in-n-p04-p01

- **Instance id:** `verified-k-heads-in-n-p04:383899793`
- **Difficulty:** 920
- **Params:** {"n":8,"k":3}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 8 times. What is the probability of getting exactly 3 heads?
- **Answer:** 7/32
- **Rendered answer grades correct:** yes

### Worked Solution

**P(exactly 3 heads in 8 flips)**

- Each flip is independent with P(heads) = 1/2.
- Total equally-likely sequences: 2^8 = 256.
- Sequences with exactly 3 heads: C(8, 3) = 56.
- P(exactly 3 heads) = 56/256 = 7/32.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.218750
- **Simulation estimate:** 0.218340
- **Absolute diff:** 0.000410
- **5-sigma threshold:** 0.009244
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

