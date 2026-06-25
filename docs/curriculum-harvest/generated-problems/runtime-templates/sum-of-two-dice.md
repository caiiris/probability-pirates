# Runtime Review — sum-of-two-dice

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `sum-of-two-dice`
- **Topic:** `counting`
- **Skills:** `sample-space-enumeration`, `equally-likely-outcomes`
- **Retrieval form:** `operation`

## Problem 1 — sum-of-two-dice-p01

- **Instance id:** `sum-of-two-dice:3740118599`
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
- **Simulation estimate:** 0.082920
- **Absolute diff:** 0.000413
- **5-sigma threshold:** 0.006180
- **Passed:** yes

## Problem 2 — sum-of-two-dice-p02

- **Instance id:** `sum-of-two-dice:1401792082`
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
- **Simulation estimate:** 0.139120
- **Absolute diff:** 0.000231
- **5-sigma threshold:** 0.007733
- **Passed:** yes

## Problem 3 — sum-of-two-dice-p03

- **Instance id:** `sum-of-two-dice:1401203702`
- **Difficulty:** 850
- **Params:** {"k":4}
- **Interaction:** `fill-fraction`
- **Prompt:** You roll two fair six-sided dice. What is the probability the sum equals 4?
- **Answer:** 1/12
- **Rendered answer grades correct:** yes

### Worked Solution

**P(sum = 4) by enumeration**

- Rolling two dice produces 6 × 6 = 36 equally-likely ordered outcomes.
- Pairs (a, b) with a + b = 4: (1,3), (2,2), (3,1).
- Favorable outcomes: 3.
- P(sum = 4) = 3/36 = 1/12.

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.083333
- **Simulation estimate:** 0.083960
- **Absolute diff:** 0.000627
- **5-sigma threshold:** 0.006180
- **Passed:** yes

## Problem 4 — sum-of-two-dice-p04

- **Instance id:** `sum-of-two-dice:1400659249`
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
- **Simulation estimate:** 0.054980
- **Absolute diff:** 0.000576
- **5-sigma threshold:** 0.005122
- **Passed:** yes

## Problem 5 — sum-of-two-dice-p05

- **Instance id:** `sum-of-two-dice:1333695868`
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
- **Simulation estimate:** 0.028380
- **Absolute diff:** 0.000602
- **5-sigma threshold:** 0.003675
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

