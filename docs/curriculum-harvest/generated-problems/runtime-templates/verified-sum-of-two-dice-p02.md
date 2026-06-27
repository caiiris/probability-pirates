# Runtime Review — verified-sum-of-two-dice-p02

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-sum-of-two-dice-p02`
- **Topic:** `counting`
- **Skills:** `sample-space-enumeration`, `equally-likely-outcomes`
- **Retrieval form:** `operation`

## Problem 1 — verified-sum-of-two-dice-p02-p01

- **Instance id:** `verified-sum-of-two-dice-p02:1401792082`
- **Difficulty:** 790
- **Params:** {"k":8}
- **Interaction:** `fill-fraction`
- **Prompt:** You roll two fair six-sided dice. What is the probability the sum equals 8?
- **Answer:** 5/36
- **Rendered answer grades correct:** yes

### Worked Solution

**P(sum = 8) by enumeration**

- Rolling two dice produces 6 × 6 = 36 equally-likely ordered outcomes.
- Pairs (a, b) with a + b = 8: (2,6), (3,5), (4,4), (5,3), (6,2).
- Favorable outcomes: 5.
- P(sum = 8) = 5/36.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.138889
- **Simulation estimate:** 0.139500
- **Absolute diff:** 0.000611
- **5-sigma threshold:** 0.007733
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

