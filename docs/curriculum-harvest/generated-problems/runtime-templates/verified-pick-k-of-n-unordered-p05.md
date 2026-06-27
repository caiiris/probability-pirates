# Runtime Review — verified-pick-k-of-n-unordered-p05

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-pick-k-of-n-unordered-p05`
- **Topic:** `counting`
- **Skills:** `ordered-vs-unordered`, `combinations`
- **Retrieval form:** `definition`

## Problem 1 — verified-pick-k-of-n-unordered-p05-p01

- **Instance id:** `verified-pick-k-of-n-unordered-p05:1404767269`
- **Difficulty:** 880
- **Params:** {"n":6,"k":5}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 5 people is chosen from a group of 6. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 5 from 6 (unordered)**

- We want to count subsets of size 5 from 6 elements.
- Order does not matter. {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(6,5) = 6!/(6−5)! = 720.
- Each unordered subset appears in 5! = 120 orderings, so divide by 5!.
- C(6,5) = P(6,5) / 5! = 720 / 120 = 6.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

