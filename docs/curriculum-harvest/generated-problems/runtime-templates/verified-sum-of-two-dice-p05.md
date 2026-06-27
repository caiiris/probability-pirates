# Runtime Review — verified-sum-of-two-dice-p05

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-sum-of-two-dice-p05`
- **Topic:** `counting`
- **Skills:** `sample-space-enumeration`, `equally-likely-outcomes`
- **Retrieval form:** `operation`

## Problem 1 — verified-sum-of-two-dice-p05-p01

- **Instance id:** `verified-sum-of-two-dice-p05:1333695868`
- **Difficulty:** 910
- **Params:** {"k":2}
- **Interaction:** `fill-fraction`
- **Prompt:** You roll two fair six-sided dice. What is the probability the sum equals 2?
- **Answer:** 1/36
- **Rendered answer grades correct:** yes

### Worked Solution

**P(sum = 2) by enumeration**

- Rolling two dice produces 6 × 6 = 36 equally-likely ordered outcomes.
- Pairs (a, b) with a + b = 2: (1,1).
- Favorable outcomes: 1.
- P(sum = 2) = 1/36.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.027778
- **Simulation estimate:** 0.027460
- **Absolute diff:** 0.000318
- **5-sigma threshold:** 0.003675
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

