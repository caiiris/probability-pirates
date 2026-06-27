# Runtime Review — verified-k-heads-in-n-p01

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-k-heads-in-n-p01`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`, `independence`
- **Retrieval form:** `operation`

## Problem 1 — verified-k-heads-in-n-p01-p01

- **Instance id:** `verified-k-heads-in-n-p01:1404767269`
- **Difficulty:** 880
- **Params:** {"n":6,"k":5}
- **Interaction:** `fill-fraction`
- **Prompt:** A fair coin is flipped 6 times. What is the probability of getting exactly 5 heads?
- **Answer:** 3/32
- **Rendered answer grades correct:** yes

### Worked Solution

**P(exactly 5 heads in 6 flips)**

- Each flip is independent with P(heads) = 1/2.
- Total equally-likely sequences: 2^6 = 64.
- Sequences with exactly 5 heads: C(6, 5) = 6.
- P(exactly 5 heads) = 6/64 = 3/32.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.093750
- **Simulation estimate:** 0.094460
- **Absolute diff:** 0.000710
- **5-sigma threshold:** 0.006518
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

