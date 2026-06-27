# Runtime Review — verified-conditional-bayes-2x2-p04

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-conditional-bayes-2x2-p04`
- **Topic:** `conditional`
- **Skills:** `conditional-probability`, `base-rate`
- **Retrieval form:** `application`

## Problem 1 — verified-conditional-bayes-2x2-p04-p01

- **Instance id:** `verified-conditional-bayes-2x2-p04:2390938879`
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
- **Simulation estimate:** 0.369940
- **Absolute diff:** 0.005060
- **5-sigma threshold:** 0.010825
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

