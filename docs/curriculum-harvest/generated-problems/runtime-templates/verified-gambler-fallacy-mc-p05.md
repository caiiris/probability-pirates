# Runtime Review — verified-gambler-fallacy-mc-p05

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-gambler-fallacy-mc-p05`
- **Topic:** `long-run`
- **Skills:** `long-run-vs-single-trial`, `independence`
- **Retrieval form:** `definition`

## Problem 1 — verified-gambler-fallacy-mc-p05-p01

- **Instance id:** `verified-gambler-fallacy-mc-p05:791400800`
- **Difficulty:** 820
- **Params:** {"streakLen":6,"flavor":0}
- **Interaction:** `multiple-choice`
- **Prompt:** A fair coin has been flipped and landed on heads 6 times in a row. What is the probability the next flip lands tails?
- **Answer:** choice:independent
- **Rendered answer grades correct:** yes

### Worked Solution

**Independence and the gambler's fallacy**

- A fair coin has P(outcome) = 1/2 on every trial.
- Each trial is independent: the outcome does not depend on previous results.
- A streak of 6 heads is surprising, but it doesn't "use up" probability.
- P(next outcome) = 1/2, exactly as before the streak began.
- The gambler's fallacy is the mistaken belief that a streak makes the opposite outcome "due."

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

