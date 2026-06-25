# Runtime Review — conditional-bayes-2x2

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `conditional-bayes-2x2`
- **Topic:** `conditional`
- **Skills:** `conditional-probability`, `base-rate`
- **Retrieval form:** `application`

## Problem 1 — conditional-bayes-2x2-p01

- **Instance id:** `conditional-bayes-2x2:2258743503`
- **Difficulty:** 912
- **Params:** {"tp":3,"fp":25,"fn":6,"tn":422}
- **Interaction:** `fill-fraction`
- **Prompt:** Given that a person tests positive, what is the probability they truly have the signal?
- **Context:**

In a study, 456 people were tested for a rare signal:
• 3 tested positive and truly had the signal
• 25 tested positive but did not have the signal
• 6 tested negative but truly had the signal
• 422 tested negative and did not have the signal
- **Answer:** 3/28
- **Rendered answer grades correct:** yes

### Worked Solution

**P(signal | test positive)**

- Total people: 456. Test-positive people: 3 + 25 = 28.
- Among test-positive, 3 truly have the signal.
- Condition on test+: P(signal | test+) = 3 / 28.
- Reduced: 3 / 28.
- Note: even a sensitive test can have a low true-signal rate among positives when the signal is rare (base-rate neglect).

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.107143
- **Simulation estimate:** 0.105220
- **Absolute diff:** 0.001923
- **5-sigma threshold:** 0.006916
- **Passed:** yes

## Problem 2 — conditional-bayes-2x2-p02

- **Instance id:** `conditional-bayes-2x2:2230768738`
- **Difficulty:** 910
- **Params:** {"tp":11,"fp":83,"fn":14,"tn":441}
- **Interaction:** `fill-fraction`
- **Prompt:** Given that a person tests positive, what is the probability they truly have the signal?
- **Context:**

In a study, 549 people were tested for a rare signal:
• 11 tested positive and truly had the signal
• 83 tested positive but did not have the signal
• 14 tested negative but truly had the signal
• 441 tested negative and did not have the signal
- **Answer:** 11/94
- **Rendered answer grades correct:** yes

### Worked Solution

**P(signal | test positive)**

- Total people: 549. Test-positive people: 11 + 83 = 94.
- Among test-positive, 11 truly have the signal.
- Condition on test+: P(signal | test+) = 11 / 94.
- Reduced: 11 / 94.
- Note: even a sensitive test can have a low true-signal rate among positives when the signal is rare (base-rate neglect).

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.117021
- **Simulation estimate:** 0.114660
- **Absolute diff:** 0.002361
- **5-sigma threshold:** 0.007188
- **Passed:** yes

## Problem 3 — conditional-bayes-2x2-p03

- **Instance id:** `conditional-bayes-2x2:2837935584`
- **Difficulty:** 895
- **Params:** {"tp":20,"fp":78,"fn":19,"tn":248}
- **Interaction:** `fill-fraction`
- **Prompt:** Given that a person tests positive, what is the probability they truly have the signal?
- **Context:**

In a study, 365 people were tested for a rare signal:
• 20 tested positive and truly had the signal
• 78 tested positive but did not have the signal
• 19 tested negative but truly had the signal
• 248 tested negative and did not have the signal
- **Answer:** 10/49
- **Rendered answer grades correct:** yes

### Worked Solution

**P(signal | test positive)**

- Total people: 365. Test-positive people: 20 + 78 = 98.
- Among test-positive, 20 truly have the signal.
- Condition on test+: P(signal | test+) = 20 / 98.
- Reduced: 10 / 49.
- Note: even a sensitive test can have a low true-signal rate among positives when the signal is rare (base-rate neglect).

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.204082
- **Simulation estimate:** 0.203500
- **Absolute diff:** 0.000582
- **5-sigma threshold:** 0.009012
- **Passed:** yes

## Problem 4 — conditional-bayes-2x2-p04

- **Instance id:** `conditional-bayes-2x2:2390938879`
- **Difficulty:** 866
- **Params:** {"tp":24,"fp":40,"fn":10,"tn":438}
- **Interaction:** `fill-fraction`
- **Prompt:** Given that a person tests positive, what is the probability they truly have the signal?
- **Context:**

In a study, 512 people were tested for a rare signal:
• 24 tested positive and truly had the signal
• 40 tested positive but did not have the signal
• 10 tested negative but truly had the signal
• 438 tested negative and did not have the signal
- **Answer:** 3/8
- **Rendered answer grades correct:** yes

### Worked Solution

**P(signal | test positive)**

- Total people: 512. Test-positive people: 24 + 40 = 64.
- Among test-positive, 24 truly have the signal.
- Condition on test+: P(signal | test+) = 24 / 64.
- Reduced: 3 / 8.
- Note: even a sensitive test can have a low true-signal rate among positives when the signal is rare (base-rate neglect).

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.375000
- **Simulation estimate:** 0.378940
- **Absolute diff:** 0.003940
- **5-sigma threshold:** 0.010825
- **Passed:** yes

## Problem 5 — conditional-bayes-2x2-p05

- **Instance id:** `conditional-bayes-2x2:2100122985`
- **Difficulty:** 902
- **Params:** {"tp":12,"fp":60,"fn":4,"tn":182}
- **Interaction:** `fill-fraction`
- **Prompt:** Given that a person tests positive, what is the probability they truly have the signal?
- **Context:**

In a study, 258 people were tested for a rare signal:
• 12 tested positive and truly had the signal
• 60 tested positive but did not have the signal
• 4 tested negative but truly had the signal
• 182 tested negative and did not have the signal
- **Answer:** 1/6
- **Rendered answer grades correct:** yes

### Worked Solution

**P(signal | test positive)**

- Total people: 258. Test-positive people: 12 + 60 = 72.
- Among test-positive, 12 truly have the signal.
- Condition on test+: P(signal | test+) = 12 / 72.
- Reduced: 1 / 6.
- Note: even a sensitive test can have a low true-signal rate among positives when the signal is rare (base-rate neglect).

### Verification

- **Method:** solver-render-simulation
- **Exact probability:** 0.166667
- **Simulation estimate:** 0.167500
- **Absolute diff:** 0.000833
- **5-sigma threshold:** 0.008333
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

