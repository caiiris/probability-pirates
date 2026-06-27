# Without Replacement / Casework Candidate Batch

> Original harvest candidates for sampling without replacement. Generated with `tsx scripts/curriculum-harvest/verify-without-replacement.ts`; outputs are review artifacts only.

- **Reuse mode:** original-authored
- **Roadmap target:** counting, conditional probability, and complement practice
- **Suggested missing taxonomy IDs:** `without-replacement`, `casework-probability`
- **Existing SkillIds used now:** `sample-space-enumeration`, `favorable-over-total`, `multiplication-principle`, `combinations`, `complement-rule`, `independence`, `conditional-probability`, `addition-principle`
- **Legal notes:** no source copying; contexts, values, and wording are newly authored for Pascal review.

## CAND-WR-0001 — One red and two blue enamel pins

- **Generated problem id:** wr-0001
- **Practice topic:** counting / conditional
- **Difficulty tag:** medium-hard
- **Skills:** `combinations`, `favorable-over-total`, `multiplication-principle`
- **Misconceptions:** uses-with-replacement-denominators, counts-only-one-order, treats-exactly-as-at-least
- **Core trick:** Choose the one red pin: C(5,1).
- **Prompt:** A craft box has 5 red pins, 4 blue pins, and 3 silver pins. You grab 3 pins without looking and do not put any back. What is the probability you get exactly 1 red pin and exactly 2 blue pins?
- **Answer:** 3/22
- **Solver feasibility:** exact arithmetic in `verify-without-replacement.ts` using combinations over unordered 3-pin hands.
- **Verification result:** passed
- **Human status:** pending review

## CAND-WR-0002 — Two matching hardware tokens

- **Generated problem id:** wr-0002
- **Practice topic:** counting / conditional
- **Difficulty tag:** medium
- **Skills:** `combinations`, `favorable-over-total`, `addition-principle`
- **Misconceptions:** assumes-same-and-different-are-equally-likely, forgets-one-category-case, multiplies-counts-across-categories
- **Core trick:** Same-metal pairs can be brass-brass, steel-steel, or copper-copper.
- **Prompt:** A workshop drawer has 6 brass tokens, 5 steel tokens, and 4 copper tokens. Two tokens are drawn without replacement. What is the probability the two tokens are made of the same metal?
- **Answer:** 31/105
- **Solver feasibility:** exact arithmetic in `verify-without-replacement.ts` using casework by metal category.
- **Verification result:** passed
- **Human status:** pending review

## CAND-WR-0003 — At least one mystery book

- **Generated problem id:** wr-0003
- **Practice topic:** counting / conditional
- **Difficulty tag:** medium
- **Skills:** `complement-rule`, `combinations`, `favorable-over-total`
- **Misconceptions:** adds-overlapping-at-least-one-cases, answers-the-complement, treats-draws-as-with-replacement
- **Core trick:** The complement of at least one mystery is no mysteries.
- **Prompt:** A librarian sets aside 4 mystery novels and 8 other novels. A student randomly takes 3 novels without replacement. What is the probability that at least one of the 3 novels is a mystery?
- **Answer:** 41/55
- **Solver feasibility:** exact arithmetic in `verify-without-replacement.ts` using complement rule with combinations.
- **Verification result:** passed
- **Human status:** pending review

## CAND-WR-0004 — Sticker draw with replacement comparison

- **Generated problem id:** wr-0004
- **Practice topic:** counting / conditional
- **Difficulty tag:** medium-hard
- **Skills:** `multiplication-principle`, `independence`, `conditional-probability`
- **Misconceptions:** treats-without-replacement-as-independent, forgets-the-first-star-is-removed, compares-decimals-without-common-denominators
- **Core trick:** With replacement, the bag resets before the second draw.
- **Prompt:** A sticker pouch has 3 star stickers and 7 plain stickers. You draw 2 stickers. Compare the probability of getting 2 stars if you put the first sticker back before drawing again versus if you do not put it back.
- **Answer:** With replacement: 9/100. Without replacement: 1/15. With replacement is higher by 7/300.
- **Solver feasibility:** exact arithmetic in `verify-without-replacement.ts` using sequential products for both sampling rules.
- **Verification result:** passed
- **Human status:** pending review

## CAND-WR-0005 — Exactly two prizes with at least one gold

- **Generated problem id:** wr-0005
- **Practice topic:** counting / conditional
- **Difficulty tag:** hard
- **Skills:** `combinations`, `addition-principle`, `favorable-over-total`
- **Misconceptions:** misses-the-two-gold-case, counts-at-least-one-gold-without-exactly-two-prizes, double-counts-one-gold-one-silver
- **Core trick:** Exactly 2 prize slips means the other 2 slips must be blank.
- **Prompt:** A carnival bowl holds 3 gold prize slips, 5 silver prize slips, and 4 blank slips. Four slips are drawn without replacement. What is the probability that exactly 2 of the slips are prize slips and at least 1 of those prize slips is gold?
- **Answer:** 12/55
- **Solver feasibility:** exact arithmetic in `verify-without-replacement.ts` using disjoint casework over prize composition.
- **Verification result:** passed
- **Human status:** pending review

## CAND-WR-0006 — All different color badges

- **Generated problem id:** wr-0006
- **Practice topic:** counting / conditional
- **Difficulty tag:** medium
- **Skills:** `sample-space-enumeration`, `combinations`, `favorable-over-total`
- **Misconceptions:** counts-color-patterns-instead-of-labeled-badges, forgets-the-single-green-badge, assumes-each-color-is-equally-likely
- **Core trick:** All different means one red, one blue, and one green badge.
- **Prompt:** A badge tray has 2 red badges, 2 blue badges, and 1 green badge. Three badges are drawn without replacement. What is the probability the three badges are all different colors?
- **Answer:** 2/5
- **Solver feasibility:** exact arithmetic in `verify-without-replacement.ts` using combination count checked by exact enumeration.
- **Verification result:** passed
- **Human status:** pending review

