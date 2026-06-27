# Runtime Review — verified-conditional-bayes-2x2-p01

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-conditional-bayes-2x2-p01`
- **Topic:** `conditional`
- **Skills:** `conditional-probability`, `base-rate`
- **Retrieval form:** `application`

## Problem 1 — verified-conditional-bayes-2x2-p01-p01

- **Instance id:** `verified-conditional-bayes-2x2-p01:2258743503`
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
- **Simulation estimate:** 0.105900
- **Absolute diff:** 0.001243
- **5-sigma threshold:** 0.006916
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

