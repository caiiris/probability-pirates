# Runtime Review — verified-pick-k-of-n-unordered-p01

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `verified-pick-k-of-n-unordered-p01`
- **Topic:** `counting`
- **Skills:** `ordered-vs-unordered`, `combinations`
- **Retrieval form:** `definition`

## Problem 1 — verified-pick-k-of-n-unordered-p01-p01

- **Instance id:** `verified-pick-k-of-n-unordered-p01:1337803888`
- **Difficulty:** 865
- **Params:** {"n":6,"k":4}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 4 people is chosen from a group of 6. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 4 from 6 (unordered)**

- We want to count subsets of size 4 from 6 elements.
- Order does not matter. {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(6,4) = 6!/(6−4)! = 360.
- Each unordered subset appears in 4! = 24 orderings, so divide by 4!.
- C(6,4) = P(6,4) / 4! = 360 / 24 = 15.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

