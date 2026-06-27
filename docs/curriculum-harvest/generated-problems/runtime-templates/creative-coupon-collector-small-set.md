# Runtime Review — creative-coupon-collector-small-set

> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.

## Template Metadata

- **Template:** `creative-coupon-collector-small-set`
- **Topic:** `distributions`
- **Skills:** `binomial-pmf`
- **Retrieval form:** `application`

## Problem 1 — creative-coupon-collector-small-set-p01

- **Instance id:** `creative-coupon-collector-small-set:1107267843`
- **Difficulty:** 1340
- **Params:** {"stickerTypes":4}
- **Interaction:** `fill-fraction`
- **Prompt:** There are 4 sticker types. Each pack has one random sticker. What is the expected number of packs needed to complete the set?
- **Answer:** 25/3
- **Rendered answer grades correct:** yes

### Worked Solution

**Wait times for new stickers**

- The first new sticker takes 1 draw on average.
- The next new sticker has chance 3/4 each draw, so it takes 4/3 draws on average.
- Then the wait times are 2 and 4.
- Total expected draws: 1 + 4/3 + 2 + 4 = 25/3.

### Verification

- **Method:** solver-render-structural
- **Note:** No simulator declared; structural render/answer check only.
- **Passed:** yes

## Human Review Notes

- Check prompt voice and age fit.
- Check whether the worked solution teaches the intended move.
- Check whether this should ship as-is or needs scenario/copy polish.

