# Runtime Review — verified-conditional-bayes-2x2-p03

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-conditional-bayes-2x2-p03`
- **Topic:** `conditional`
- **Skills:** `conditional-probability`, `base-rate`
- **Retrieval form:** `application`

## Problem 1 — verified-conditional-bayes-2x2-p03-p01

- **Instance id:** `verified-conditional-bayes-2x2-p03:2837935584`
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
- **Simulation estimate:** 0.201500
- **Absolute diff:** 0.002582
- **5-sigma threshold:** 0.009012
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

