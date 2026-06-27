# Runtime Review — creative-odds-evens-fairness

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `creative-odds-evens-fairness`
- **Topic:** `counting`
- **Skills:** `sample-space-enumeration`, `multiplication-principle`
- **Retrieval form:** `application`

## Problem 1 — creative-odds-evens-fairness-p01

- **Instance id:** `creative-odds-evens-fairness:3960333201`
- **Difficulty:** 1180
- **Params:** {"evens":3,"odds":4}
- **Interaction:** `fill-fraction`
- **Prompt:** A bag has 3 even tokens and 4 odd tokens. Two tokens are drawn. What is the probability their sum is even?
- **Answer:** 3/7
- **Rendered answer grades correct:** yes

### Worked Solution

**Same parity makes an even sum**

- An even sum comes from two evens or two odds.
- Favorable pairs: C(3,2) + C(4,2) = 3 + 6 = 9.
- All pairs: C(7,2) = 21.
- The probability is 9/21 = 3/7.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

