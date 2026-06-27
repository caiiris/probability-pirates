# Runtime Review — verified-conditional-bayes-2x2-p05

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-conditional-bayes-2x2-p05`
- **Topic:** `conditional`
- **Skills:** `conditional-probability`, `base-rate`
- **Retrieval form:** `application`

## Problem 1 — verified-conditional-bayes-2x2-p05-p01

- **Instance id:** `verified-conditional-bayes-2x2-p05:2100122985`
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
- **Simulation estimate:** 0.168420
- **Absolute diff:** 0.001753
- **5-sigma threshold:** 0.008333
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

