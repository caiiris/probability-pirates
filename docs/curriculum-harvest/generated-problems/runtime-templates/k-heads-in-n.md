# Runtime Review — k-heads-in-n

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `k-heads-in-n`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`, `independence`
- **Retrieval form:** `operation`

## Problem 1 — k-heads-in-n-p01

- **Instance id:** `k-heads-in-n:1404767269`
- **Difficulty:** 1300
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
- **Simulation estimate:** 0.090720
- **Absolute diff:** 0.003030
- **5-sigma threshold:** 0.006518
- **Passed:** yes

## Problem 2 — k-heads-in-n-p02

- **Instance id:** `k-heads-in-n:3314986074`
- **Difficulty:** 1400
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
- **Simulation estimate:** 0.007540
- **Absolute diff:** 0.000273
- **5-sigma threshold:** 0.001969
- **Passed:** yes

## Problem 3 — k-heads-in-n-p03

- **Instance id:** `k-heads-in-n:1404620174`
- **Difficulty:** 1300
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
- **Simulation estimate:** 0.015540
- **Absolute diff:** 0.000085
- **5-sigma threshold:** 0.002773
- **Passed:** yes

## Problem 4 — k-heads-in-n-p04

- **Instance id:** `k-heads-in-n:383899793`
- **Difficulty:** 1500
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
- **Simulation estimate:** 0.219860
- **Absolute diff:** 0.001110
- **5-sigma threshold:** 0.009244
- **Passed:** yes

## Problem 5 — k-heads-in-n-p05

- **Instance id:** `k-heads-in-n:549092248`
- **Difficulty:** 900
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
- **Simulation estimate:** 0.246320
- **Absolute diff:** 0.003680
- **5-sigma threshold:** 0.009682
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

