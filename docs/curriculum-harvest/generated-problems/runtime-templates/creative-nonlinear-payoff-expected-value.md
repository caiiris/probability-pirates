# Runtime Review — creative-nonlinear-payoff-expected-value

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `creative-nonlinear-payoff-expected-value`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`
- **Retrieval form:** `application`

## Problem 1 — creative-nonlinear-payoff-expected-value-p01

- **Instance id:** `creative-nonlinear-payoff-expected-value:2936821473`
- **Difficulty:** 1320
- **Params:** {"kind":"gem-packs"}
- **Interaction:** `multiple-choice`
- **Prompt:** A shop sells gem packs. A 12-pack has a discount, so revenue is not just count times unit price. What is the expected revenue per customer?
- **Answer:** choice:correct
- **Rendered answer grades correct:** yes

### Worked Solution

**Expected payoff after converting outcomes**

- Convert each possible purchase into revenue first.
- Compute 80(1/2) + 160(1/5) + 240(3/20) + 480(1/10) + 900(1/20).
- The expected revenue is 201 cents, or $2.01.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

