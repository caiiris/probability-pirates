# Runtime Review — verified-conditional-bayes-2x2-p02

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-conditional-bayes-2x2-p02`
- **Topic:** `conditional`
- **Skills:** `conditional-probability`, `base-rate`
- **Retrieval form:** `application`

## Problem 1 — verified-conditional-bayes-2x2-p02-p01

- **Instance id:** `verified-conditional-bayes-2x2-p02:2230768738`
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
- **Simulation estimate:** 0.118780
- **Absolute diff:** 0.001759
- **5-sigma threshold:** 0.007188
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

