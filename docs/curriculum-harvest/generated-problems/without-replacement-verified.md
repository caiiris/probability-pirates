# Without Replacement / Casework Verification

> Deterministic verification pass for original sampling-without-replacement candidates. These are harvest/review artifacts only; no runtime practice templates or registries are edited.

## Lane Summary

- **Lane id:** `without-replacement-casework-probability`
- **Examples verified:** 6
- **Runtime correctness source:** exact TypeScript solver/verifier using combinations, sequential products, and exact enumeration
- **Missing taxonomy IDs:** `without-replacement`, `casework-probability`
- **Blockers:** none for review artifacts; taxonomy review needed before using the missing IDs as runtime SkillIds
- **Source copying:** none; prompts are original Pascal-authored examples

## wr-0001 — One red and two blue enamel pins

- **Candidate:** CAND-WR-0001
- **Difficulty tag:** medium-hard
- **Skills:** `combinations`, `favorable-over-total`, `multiplication-principle`
- **Misconceptions:** uses-with-replacement-denominators, counts-only-one-order, treats-exactly-as-at-least
- **Prompt:** A craft box has 5 red pins, 4 blue pins, and 3 silver pins. You grab 3 pins without looking and do not put any back. What is the probability you get exactly 1 red pin and exactly 2 blue pins?
- **Answer:** 3/22
- **Solver:** combinations over unordered 3-pin hands; `C(5,1) * C(4,2) / C(12,3)`
- **Verification result:** passed

### Exact Values

- **P(exactly 1 red and 2 blue):** 3/22 (0.136364)

### Solver Steps

- Choose the one red pin: C(5,1).
- Choose the two blue pins: C(4,2).
- Divide by all 3-pin hands from 12 pins: C(12,3).

### Verification Checks

- **ordered sequential casework:** passed via RBB + BRB + BBR sequential products. Expected 3/22; actual 3/22.
  - Combination count gives 3/22.
  - Summing the three possible orders gives 3/22.

## wr-0002 — Two matching hardware tokens

- **Candidate:** CAND-WR-0002
- **Difficulty tag:** medium
- **Skills:** `combinations`, `favorable-over-total`, `addition-principle`
- **Misconceptions:** assumes-same-and-different-are-equally-likely, forgets-one-category-case, multiplies-counts-across-categories
- **Prompt:** A workshop drawer has 6 brass tokens, 5 steel tokens, and 4 copper tokens. Two tokens are drawn without replacement. What is the probability the two tokens are made of the same metal?
- **Answer:** 31/105
- **Solver:** casework by metal category; `(C(6,2) + C(5,2) + C(4,2)) / C(15,2)`
- **Verification result:** passed

### Exact Values

- **P(same metal):** 31/105 (0.295238)

### Solver Steps

- Same-metal pairs can be brass-brass, steel-steel, or copper-copper.
- Add the three same-category counts.
- Divide by all unordered pairs of tokens.

### Verification Checks

- **sequential category sum:** passed via sum c/15 * (c-1)/14 across metals. Expected 31/105; actual 31/105.
  - Same-metal pair count is 31.
  - Sequential probability sum gives 31/105.

## wr-0003 — At least one mystery book

- **Candidate:** CAND-WR-0003
- **Difficulty tag:** medium
- **Skills:** `complement-rule`, `combinations`, `favorable-over-total`
- **Misconceptions:** adds-overlapping-at-least-one-cases, answers-the-complement, treats-draws-as-with-replacement
- **Prompt:** A librarian sets aside 4 mystery novels and 8 other novels. A student randomly takes 3 novels without replacement. What is the probability that at least one of the 3 novels is a mystery?
- **Answer:** 41/55
- **Solver:** complement rule with combinations; `1 - C(8,3) / C(12,3)`
- **Verification result:** passed

### Exact Values

- **P(at least one mystery):** 41/55 (0.745455)
- **P(no mystery):** 14/55 (0.254545)

### Solver Steps

- The complement of at least one mystery is no mysteries.
- No mysteries means all 3 books come from the 8 other novels.
- Subtract that probability from 1.

### Verification Checks

- **direct casework:** passed via exactly 1 mystery + exactly 2 mysteries + exactly 3 mysteries. Expected 41/55; actual 41/55.
  - Complement gives 41/55.
  - Direct casework gives 41/55.

## wr-0004 — Sticker draw with replacement comparison

- **Candidate:** CAND-WR-0004
- **Difficulty tag:** medium-hard
- **Skills:** `multiplication-principle`, `independence`, `conditional-probability`
- **Misconceptions:** treats-without-replacement-as-independent, forgets-the-first-star-is-removed, compares-decimals-without-common-denominators
- **Prompt:** A sticker pouch has 3 star stickers and 7 plain stickers. You draw 2 stickers. Compare the probability of getting 2 stars if you put the first sticker back before drawing again versus if you do not put it back.
- **Answer:** With replacement: 9/100. Without replacement: 1/15. With replacement is higher by 7/300.
- **Solver:** sequential products for both sampling rules; `with replacement: (3/10)(3/10); without replacement: (3/10)(2/9)`
- **Verification result:** passed

### Exact Values

- **P(2 stars with replacement):** 9/100 (0.09)
- **P(2 stars without replacement):** 1/15 (0.066667)
- **with-replacement minus without-replacement:** 7/300 (0.023333)

### Solver Steps

- With replacement, the bag resets before the second draw.
- Without replacement, one star and one total sticker are gone after a first star.
- Compare the exact fractions by subtracting without-replacement from with-replacement.

### Verification Checks

- **without-replacement combination check:** passed via C(3,2) / C(10,2) equals (3/10)(2/9). Expected 1/15; actual 1/15.
  - Sequential without-replacement probability is 1/15.
  - Combination without-replacement probability is 1/15.
- **with-replacement square check:** passed via (3/10)^2 equals 9/100. Expected 9/100; actual 9/100.
  - Independent with-replacement product is 9/100.
  - Direct square is 9/100.

## wr-0005 — Exactly two prizes with at least one gold

- **Candidate:** CAND-WR-0005
- **Difficulty tag:** hard
- **Skills:** `combinations`, `addition-principle`, `favorable-over-total`
- **Misconceptions:** misses-the-two-gold-case, counts-at-least-one-gold-without-exactly-two-prizes, double-counts-one-gold-one-silver
- **Prompt:** A carnival bowl holds 3 gold prize slips, 5 silver prize slips, and 4 blank slips. Four slips are drawn without replacement. What is the probability that exactly 2 of the slips are prize slips and at least 1 of those prize slips is gold?
- **Answer:** 12/55
- **Solver:** disjoint casework over prize composition; `[C(3,1)C(5,1)C(4,2) + C(3,2)C(5,0)C(4,2)] / C(12,4)`
- **Verification result:** passed

### Exact Values

- **P(exactly 2 prizes and at least 1 gold):** 12/55 (0.218182)

### Solver Steps

- Exactly 2 prize slips means the other 2 slips must be blank.
- At least one gold leaves two disjoint prize cases: 1 gold + 1 silver, or 2 gold.
- Add those favorable cases and divide by all 4-slip hands.

### Verification Checks

- **alternate prize-complement count:** passed via [C(8,2) - C(5,2)]C(4,2) / C(12,4). Expected 12/55; actual 12/55.
  - Direct disjoint cases give 12/55.
  - All two-prize choices except all-silver choices give 12/55.

## wr-0006 — All different color badges

- **Candidate:** CAND-WR-0006
- **Difficulty tag:** medium
- **Skills:** `sample-space-enumeration`, `combinations`, `favorable-over-total`
- **Misconceptions:** counts-color-patterns-instead-of-labeled-badges, forgets-the-single-green-badge, assumes-each-color-is-equally-likely
- **Prompt:** A badge tray has 2 red badges, 2 blue badges, and 1 green badge. Three badges are drawn without replacement. What is the probability the three badges are all different colors?
- **Answer:** 2/5
- **Solver:** combination count checked by exact enumeration; `C(2,1) * C(2,1) * C(1,1) / C(5,3)`
- **Verification result:** passed

### Exact Values

- **P(all different colors):** 2/5 (0.4)

### Solver Steps

- All different means one red, one blue, and one green badge.
- Choose the labeled badge from each color group.
- Divide by all labeled 3-badge hands.

### Verification Checks

- **exact labeled-hand enumeration:** passed via enumerate all C(5,3) labeled hands and filter all-different categories. Expected 2/5; actual 2/5.
  - Enumeration listed 10 total labeled hands.
  - Enumeration found 4 all-different hands.

