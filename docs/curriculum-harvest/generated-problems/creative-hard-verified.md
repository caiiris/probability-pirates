# Creative / Hard Candidate Verification

> Deterministic verification pass for `creative-hard-batch-0009.md`. These are review artifacts, not runtime practice templates yet.

## creative-0001 — Nonlinear payoff expected value

- **Candidate:** CAND-0001
- **Difficulty tag:** hard / creative
- **Prompt:** A shop sells gem packs. A 12-pack has a discount, so payoff is not just count times unit price. What is the expected revenue per customer?
- **Answer:** $2.01 (201/1 cents)
- **Solver:** sum payoffCents(outcome) * P(outcome)
- **Passed:** yes

### Verification

- Probability mass sums to 1/1.
- Exact expected revenue is 201/1 cents.
- Naive unit-price shortcut gives 204/1 cents, so the trap is real.

## creative-0002 — Coupon collector small-set challenge

- **Candidate:** CAND-0002
- **Difficulty tag:** hard / creative
- **Prompt:** There are 4 sticker types. Each pack has one random sticker. What is the expected number of packs to complete the set?
- **Answer:** 25/3 packs (8.333)
- **Solver:** k * (1 + 1/2 + ... + 1/k)
- **Passed:** yes

### Verification

- Exact expectation is 25/3.
- Simulation mean over 80,000 runs is 8.314.
- Absolute difference is 0.020.

## creative-0003 — Ballot lead probability

- **Candidate:** CAND-0003
- **Difficulty tag:** expert / creative
- **Prompt:** A finishes with 5 votes and B with 3. If the votes are revealed in random order, what is the chance A is always ahead?
- **Answer:** 1/4
- **Solver:** exact enumeration for small totals; formula check (a-b)/(a+b)
- **Passed:** yes

### Verification

- 14 favorable sequences out of 56.
- Enumeration gives 1/4.
- Ballot formula gives 1/4.

## creative-0004 — Odds-and-evens fairness by parity counts

- **Candidate:** CAND-0004
- **Difficulty tag:** medium-hard / creative
- **Prompt:** A bag has 3 even tokens and 4 odd tokens. Two tokens are drawn. You win if their sum is even. Is this fair?
- **Answer:** 3/7. Not fair.
- **Solver:** (C(even,2) + C(odd,2)) / C(total,2)
- **Passed:** yes

### Verification

- Same-parity pairs: C(3,2) + C(4,2) = 9.
- All pairs: C(7,2) = 21.
- Win probability is 3/7.

## creative-0005 — Inverse spinner from frequency chart

- **Candidate:** CAND-0005
- **Difficulty tag:** hard / creative
- **Prompt:** A spinner produced counts 24, 17, and 9 over 50 spins. Which candidate spinner most likely generated it?
- **Answer:** Spinner A
- **Solver:** choose largest multinomial log likelihood
- **Passed:** yes

### Verification

- Spinner A: log likelihood -51.438
- Spinner B: log likelihood -54.931
- Spinner C: log likelihood -56.317

## creative-0006 — Last one standing streak survival

- **Candidate:** CAND-0006
- **Difficulty tag:** hard / creative
- **Prompt:** 30 players each try for 5 heads in a row. What is the probability at least one player succeeds?
- **Answer:** 876629172360049043683749097544355950703884223/1427247692705959881058285969449495136382746624 (0.614)
- **Solver:** 1 - (1 - 1/2^5)^30
- **Passed:** yes

### Verification

- Exact complement is 550618520345910837374536871905139185678862401/1427247692705959881058285969449495136382746624.
- Simulation estimate over 80,000 runs is 0.615.
- Absolute difference is 0.001.

## creative-0007 — Non-transitive dice strategy

- **Candidate:** CAND-0007
- **Difficulty tag:** expert / creative
- **Prompt:** Three custom dice form a cycle: A tends to beat B, B tends to beat C, and C tends to beat A. Verify the cycle.
- **Answer:** A beats B: 5/9; B beats C: 5/9; C beats A: 5/9
- **Solver:** exact enumeration over 36 pair outcomes for each matchup
- **Passed:** yes

### Verification

- Die A: 2, 2, 4, 4, 9, 9
- Die B: 1, 1, 6, 6, 8, 8
- Die C: 3, 3, 5, 5, 7, 7
- A over B: 5/9
- B over C: 5/9
- C over A: 5/9

