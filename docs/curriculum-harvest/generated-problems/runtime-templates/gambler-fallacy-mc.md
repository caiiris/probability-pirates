# Runtime Review — gambler-fallacy-mc

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `gambler-fallacy-mc`
- **Topic:** `long-run`
- **Skills:** `long-run-vs-single-trial`, `independence`
- **Retrieval form:** `definition`

## Problem 1 — gambler-fallacy-mc-p01

- **Instance id:** `gambler-fallacy-mc:1068915428`
- **Difficulty:** 950
- **Params:** {"streakLen":8,"flavor":2}
- **Interaction:** `multiple-choice`
- **Prompt:** A basketball player has made 8 free throws in a row. Assuming each free throw is an independent 50/50 shot, what is the probability the next attempt is a miss?
- **Answer:** choice:independent
- **Rendered answer grades correct:** yes

### Worked Solution

**Independence and the gambler's fallacy**

- A fair shot has P(outcome) = 1/2 on every trial.
- Each trial is independent: the outcome does not depend on previous results.
- A streak of 8 free throws in a row is surprising, but it doesn't "use up" probability.
- P(next outcome) = 1/2, exactly as before the streak began.
- The gambler's fallacy is the mistaken belief that a streak makes the opposite outcome "due."

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 2 — gambler-fallacy-mc-p02

- **Instance id:** `gambler-fallacy-mc:2128681955`
- **Difficulty:** 830
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

## Problem 3 — gambler-fallacy-mc-p03

- **Instance id:** `gambler-fallacy-mc:4126551075`
- **Difficulty:** 800
- **Params:** {"streakLen":3,"flavor":0}
- **Interaction:** `multiple-choice`
- **Prompt:** A fair coin has been flipped and landed on heads 3 times in a row. What is the probability the next flip lands tails?
- **Answer:** choice:independent
- **Rendered answer grades correct:** yes

### Worked Solution

**Independence and the gambler's fallacy**

- A fair coin has P(outcome) = 1/2 on every trial.
- Each trial is independent: the outcome does not depend on previous results.
- A streak of 3 heads is surprising, but it doesn't "use up" probability.
- P(next outcome) = 1/2, exactly as before the streak began.
- The gambler's fallacy is the mistaken belief that a streak makes the opposite outcome "due."

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 4 — gambler-fallacy-mc-p04

- **Instance id:** `gambler-fallacy-mc:891047577`
- **Difficulty:** 920
- **Params:** {"streakLen":7,"flavor":2}
- **Interaction:** `multiple-choice`
- **Prompt:** A basketball player has made 7 free throws in a row. Assuming each free throw is an independent 50/50 shot, what is the probability the next attempt is a miss?
- **Answer:** choice:independent
- **Rendered answer grades correct:** yes

### Worked Solution

**Independence and the gambler's fallacy**

- A fair shot has P(outcome) = 1/2 on every trial.
- Each trial is independent: the outcome does not depend on previous results.
- A streak of 7 free throws in a row is surprising, but it doesn't "use up" probability.
- P(next outcome) = 1/2, exactly as before the streak began.
- The gambler's fallacy is the mistaken belief that a streak makes the opposite outcome "due."

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 5 — gambler-fallacy-mc-p05

- **Instance id:** `gambler-fallacy-mc:791400800`
- **Difficulty:** 890
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

