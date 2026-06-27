# Runtime Review — verified-gambler-fallacy-mc-p02

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-gambler-fallacy-mc-p02`
- **Topic:** `long-run`
- **Skills:** `long-run-vs-single-trial`, `independence`
- **Retrieval form:** `definition`

## Problem 1 — verified-gambler-fallacy-mc-p02-p01

- **Instance id:** `verified-gambler-fallacy-mc-p02:2128681955`
- **Difficulty:** 780
- **Params:** {"streakLen":4,"flavor":1}
- **Interaction:** `multiple-choice`
- **Prompt:** A fair six-sided die has been rolled and landed on sixes 4 times in a row. What is the probability the next roll is also a 6?
- **Answer:** choice:independent
- **Rendered answer grades correct:** yes

### Worked Solution

**Independence and the gambler's fallacy**

- A fair six-sided die has P(outcome) = 1/6 on every trial.
- Each trial is independent: the outcome does not depend on previous results.
- A streak of 4 sixes is surprising, but it doesn't "use up" probability.
- P(next outcome) = 1/6, exactly as before the streak began.
- The gambler's fallacy is the mistaken belief that a streak makes the opposite outcome "due."

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

