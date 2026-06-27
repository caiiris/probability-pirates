# Runtime Review — creative-ballot-lead-probability

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `creative-ballot-lead-probability`
- **Topic:** `counting`
- **Skills:** `combinations`
- **Retrieval form:** `application`

## Problem 1 — creative-ballot-lead-probability-p01

- **Instance id:** `creative-ballot-lead-probability:3573476162`
- **Difficulty:** 1620
- **Params:** {"a":5,"b":3}
- **Interaction:** `fill-fraction`
- **Prompt:** A finishes with 5 votes and B with 3. If the votes are revealed in random order, what is the chance A is always ahead?
- **Answer:** 1/4
- **Rendered answer grades correct:** yes

### Worked Solution

**Ballot lead by enumeration**

- There are 56 possible reveal orders.
- In 14 of them, A stays strictly ahead after every revealed vote.
- So the probability is 14/56 = 1/4.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

