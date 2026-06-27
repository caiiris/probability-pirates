# Runtime Review — verified-sum-of-two-dice-p04

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-sum-of-two-dice-p04`
- **Topic:** `counting`
- **Skills:** `sample-space-enumeration`, `equally-likely-outcomes`
- **Retrieval form:** `operation`

## Problem 1 — verified-sum-of-two-dice-p04-p01

- **Instance id:** `verified-sum-of-two-dice-p04:1400659249`
- **Difficulty:** 880
- **Params:** {"k":3}
- **Interaction:** `fill-fraction`
- **Prompt:** You roll two fair six-sided dice. What is the probability the sum equals 3?
- **Answer:** 1/18
- **Rendered answer grades correct:** yes

### Worked Solution

**P(sum = 3) by enumeration**

- Rolling two dice produces 6 × 6 = 36 equally-likely ordered outcomes.
- Pairs (a, b) with a + b = 3: (1,2), (2,1).
- Favorable outcomes: 2.
- P(sum = 3) = 2/36 = 1/18.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.055556
- **Simulation estimate:** 0.053840
- **Absolute diff:** 0.001716
- **5-sigma threshold:** 0.005122
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

