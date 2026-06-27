# Runtime Review — verified-pick-k-of-n-unordered-p02

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-pick-k-of-n-unordered-p02`
- **Topic:** `counting`
- **Skills:** `ordered-vs-unordered`, `combinations`
- **Retrieval form:** `definition`

## Problem 1 — verified-pick-k-of-n-unordered-p02-p01

- **Instance id:** `verified-pick-k-of-n-unordered-p02:316936412`
- **Difficulty:** 875
- **Params:** {"n":8,"k":2}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 2 people is chosen from a group of 8. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 2 from 8 (unordered)**

- We want to count subsets of size 2 from 8 elements.
- Order does not matter. {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(8,2) = 8!/(8−2)! = 56.
- Each unordered subset appears in 2! = 2 orderings, so divide by 2!.
- C(8,2) = P(8,2) / 2! = 56 / 2 = 28.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

