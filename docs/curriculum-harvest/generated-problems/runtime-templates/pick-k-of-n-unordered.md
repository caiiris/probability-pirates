# Runtime Review — pick-k-of-n-unordered

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `pick-k-of-n-unordered`
- **Topic:** `counting`
- **Skills:** `ordered-vs-unordered`, `combinations`
- **Retrieval form:** `definition`

## Problem 1 — pick-k-of-n-unordered-p01

- **Instance id:** `pick-k-of-n-unordered:1337803888`
- **Difficulty:** 1260
- **Params:** {"n":6,"k":4}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 4 people is chosen from a group of 6. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 4 from 6 (unordered)**

- We want to count subsets of size 4 from 6 elements.
- Order doesn't matter — {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(6,4) = 6!/(6−4)! = 360.
- Each unordered subset appears in 4! = 24 orderings, so divide by 4!.
- C(6,4) = P(6,4) / 4! = 360 / 24 = 15.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 2 — pick-k-of-n-unordered-p02

- **Instance id:** `pick-k-of-n-unordered:316936412`
- **Difficulty:** 1340
- **Params:** {"n":8,"k":2}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 2 people is chosen from a group of 8. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 2 from 8 (unordered)**

- We want to count subsets of size 2 from 8 elements.
- Order doesn't matter — {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(8,2) = 8!/(8−2)! = 56.
- Each unordered subset appears in 2! = 2 orderings, so divide by 2!.
- C(8,2) = P(8,2) / 2! = 56 / 2 = 28.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 3 — pick-k-of-n-unordered-p03

- **Instance id:** `pick-k-of-n-unordered:3248169788`
- **Difficulty:** 1380
- **Params:** {"n":7,"k":5}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 5 people is chosen from a group of 7. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 5 from 7 (unordered)**

- We want to count subsets of size 5 from 7 elements.
- Order doesn't matter — {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(7,5) = 7!/(7−5)! = 2520.
- Each unordered subset appears in 5! = 120 orderings, so divide by 5!.
- C(7,5) = P(7,5) / 5! = 2520 / 120 = 21.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 4 — pick-k-of-n-unordered-p04

- **Instance id:** `pick-k-of-n-unordered:1403928626`
- **Difficulty:** 1180
- **Params:** {"n":6,"k":2}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 2 people is chosen from a group of 6. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 2 from 6 (unordered)**

- We want to count subsets of size 2 from 6 elements.
- Order doesn't matter — {A,B} and {B,A} count as one committee.
- Ordered selections (permutations): P(6,2) = 6!/(6−2)! = 30.
- Each unordered subset appears in 2! = 2 orderings, so divide by 2!.
- C(6,2) = P(6,2) / 2! = 30 / 2 = 15.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Problem 5 — pick-k-of-n-unordered-p05

- **Instance id:** `pick-k-of-n-unordered:1404767269`
- **Difficulty:** 1300
- **Params:** {"n":6,"k":5}
- **Interaction:** `multiple-choice`
- **Prompt:** A committee of 5 people is chosen from a group of 6. How many different committees are possible? (Order does not matter.)
- **Answer:** choice:combo
- **Rendered answer grades correct:** yes

### Worked Solution

**Choosing 5 from 6 (unordered)**

- We want to count subsets of size 5 from 6 elements.
- Order doesn't matter — {A,B} and {B,A} count as one committee.
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

