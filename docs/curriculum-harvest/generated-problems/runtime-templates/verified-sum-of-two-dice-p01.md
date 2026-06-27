# Runtime Review — verified-sum-of-two-dice-p01

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-sum-of-two-dice-p01`
- **Topic:** `counting`
- **Skills:** `sample-space-enumeration`, `equally-likely-outcomes`
- **Retrieval form:** `operation`

## Problem 1 — verified-sum-of-two-dice-p01-p01

- **Instance id:** `verified-sum-of-two-dice-p01:3740118599`
- **Difficulty:** 850
- **Params:** {"k":10}
- **Interaction:** `fill-fraction`
- **Prompt:** You roll two fair six-sided dice. What is the probability the sum equals 10?
- **Answer:** 1/12
- **Rendered answer grades correct:** yes

### Worked Solution

**P(sum = 10) by enumeration**

- Rolling two dice produces 6 × 6 = 36 equally-likely ordered outcomes.
- Pairs (a, b) with a + b = 10: (4,6), (5,5), (6,4).
- Favorable outcomes: 3.
- P(sum = 10) = 3/36 = 1/12.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.083333
- **Simulation estimate:** 0.083800
- **Absolute diff:** 0.000467
- **5-sigma threshold:** 0.006180
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

