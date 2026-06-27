# Runtime Review — creative-last-one-standing-streak

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `creative-last-one-standing-streak`
- **Topic:** `distributions`
- **Skills:** `independence`, `complement-rule`, `binomial-pmf`
- **Retrieval form:** `application`

## Problem 1 — creative-last-one-standing-streak-p01

- **Instance id:** `creative-last-one-standing-streak:2052249575`
- **Difficulty:** 1370
- **Params:** {"players":30,"streak":5}
- **Interaction:** `multiple-choice`
- **Prompt:** 30 players each try for 5 heads in a row. What is the probability at least one player succeeds?
- **Answer:** choice:correct
- **Rendered answer grades correct:** yes

### Worked Solution

**Use the complement across players**

- One player gets 5 heads in a row with probability 1/32.
- One player misses that streak with probability 31/32.
- All 30 players miss with probability (31/32)^30.
- At least one succeeds with probability 1 - (31/32)^30, about 0.61.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

