# Challenge Games Candidate Verification

> Deterministic verification pass for `challenge-games-batch.md`. These are review artifacts only; no runtime templates, registry entries, or taxonomy files were edited.

## Summary

- **Verified problems:** 6
- **Source posture:** Pascal-authored contexts and values; no proprietary sources or copied problem text.
- **Verification posture:** Exact enumeration or closed-form exact count for every answer; deterministic simulations appear only as sanity checks.
- **Runtime status:** review artifact only.

## Missing Taxonomy IDs

- misconception:assumes_each_draw_adds_new_type
- misconception:assumes_transitivity
- misconception:compares_averages_instead_of_win_probability
- misconception:expected_count_as_probability
- misconception:final_margin_equals_staying_ahead
- misconception:ignores_duplicates
- misconception:ignores_payout_weights
- misconception:ignores_without_replacement_dependence
- misconception:symmetry_means_fair
- skill:ballot-path-counting
- skill:coupon-collector
- skill:expected-value
- skill:fair-game
- skill:pairwise-comparison
- skill:simulation
- skill:streak-survival

## challenge-game-0001 - Skyship non-transitive dice draft

- **Candidate:** CG-CAND-0001
- **Category:** non-transitive dice / custom dice strategy
- **Difficulty tag:** extreme
- **Prompt:** In a skyship duel, your opponent picks one of three six-sided custom dice first. You may then pick either remaining die. A higher roll wins the round. Which reply should you make to each opponent die, and why is there no single best die?
- **Answer:** Pick A against B, B against C, and C against A; each favored matchup wins 5/9 of rounds.
- **Solver:** Enumerate the 36 equally likely roll pairs for each matchup and choose the die with more winning pairs.
- **Exact method:** Exact enumeration over 36 ordered roll pairs per matchup.
- **Skill tags:** sample-space-enumeration, favorable-over-total, pairwise-comparison, fair-game
- **Misconception traps:** compares_averages_instead_of_win_probability, assumes_transitivity
- **Missing taxonomy IDs:** skill:pairwise-comparison, skill:fair-game, misconception:compares_averages_instead_of_win_probability, misconception:assumes_transitivity
- **Passed:** yes

### Verification

- Die A faces: 4, 4, 6, 6, 11, 11; mean 7/1.
- Die B faces: 3, 3, 8, 8, 10, 10; mean 7/1.
- Die C faces: 5, 5, 7, 7, 9, 9; mean 7/1.
- A beats B: 5/9.
- B beats C: 5/9.
- C beats A: 5/9.

## challenge-game-0002 - Three-token scoring booth

- **Candidate:** CG-CAND-0002
- **Category:** fair/unfair token games
- **Difficulty tag:** hard
- **Prompt:** A booth has 5 amber, 4 blue, and 3 crimson tokens. Draw 3 without replacement. You score +5 for exactly two colors, -4 for all one color, and -2 for all three colors. Is the game fair to the player?
- **Answer:** No. The expected score is 109/44 points, so the player has an edge.
- **Solver:** Count unordered 3-token hands by color pattern, then average the score over all C(12, 3) hands.
- **Exact method:** Exact combination counts for all 3-token hands.
- **Skill tags:** combinations, favorable-over-total, expected-value, fair-game
- **Misconception traps:** ordered_vs_unordered, symmetry_means_fair, ignores_payout_weights
- **Missing taxonomy IDs:** skill:expected-value, skill:fair-game, misconception:symmetry_means_fair, misconception:ignores_payout_weights
- **Passed:** yes

### Verification

- Total hands: C(12, 3) = 220.
- All one color: C(5, 3) + C(4, 3) + C(3, 3) = 15.
- All three colors: 5 x 4 x 3 = 60.
- Exactly two colors: 145.
- Expected score: 5(145)/220 - 4(15)/220 - 2(60)/220 = 109/44.

## challenge-game-0003 - Streak survival finale

- **Candidate:** CG-CAND-0003
- **Category:** last-one-standing streak survival
- **Difficulty tag:** hard
- **Prompt:** Fifteen finalists each flip a fair coin 5 times. A finalist survives if their row contains at least 4 heads in a row. What is the probability at least one finalist survives?
- **Answer:** 29149743115358977268619/37778931862957161709568 (0.772)
- **Solver:** First enumerate the 32 possible 5-flip rows for one finalist, then use the complement that no finalist survives.
- **Exact method:** Exact row enumeration plus formula 1 - (1 - 3/32)^15.
- **Skill tags:** complement-rule, independence, long-run-vs-single-trial, streak-survival
- **Misconception traps:** gambler, complement_inversion, expected_count_as_probability
- **Missing taxonomy IDs:** skill:streak-survival, misconception:expected_count_as_probability
- **Passed:** yes

### Verification

- 3 of 32 one-player flip rows contain a run of 4 heads.
- Individual survival probability: 3/32.
- Exact formula: 1 - (1 - 3/32)^15 = 29149743115358977268619/37778931862957161709568.
- Simulation sanity check over 120,000 contests: 0.773.
- Absolute simulation difference: 0.001.

## challenge-game-0004 - Vault crest coupon chase

- **Candidate:** CG-CAND-0004
- **Category:** coupon collector small sets
- **Difficulty tag:** hard
- **Prompt:** A puzzle vault has 4 equally likely crest tokens. You open 7 boxes, each with one random crest. What is the probability you have seen all 4 crests by then?
- **Answer:** 525/1024 (0.513)
- **Solver:** Use inclusion-exclusion on missing crest types, and verify by enumerating all 4^7 draw strings.
- **Exact method:** Exact inclusion-exclusion formula compared with exhaustive enumeration of all draw strings.
- **Skill tags:** inclusion-exclusion, multiplication-principle, coupon-collector, simulation
- **Misconception traps:** ignores_duplicates, assumes_each_draw_adds_new_type, gambler
- **Missing taxonomy IDs:** skill:coupon-collector, skill:simulation, misconception:ignores_duplicates, misconception:assumes_each_draw_adds_new_type
- **Passed:** yes

### Verification

- Formula count: 4^7 - 4 x 3^7 + 6 x 2^7 - 4 x 1^7 = 8400.
- Enumeration count over 16384 draw strings: 8400.
- Exact probability: 525/1024.
- Simulation sanity check over 120,000 vaults: 0.514.
- Absolute simulation difference: 0.001.

## challenge-game-0005 - Scoreboard lead lock

- **Candidate:** CG-CAND-0005
- **Category:** ballot/lead probability for small totals
- **Difficulty tag:** extreme
- **Prompt:** A match ended Red 6, Blue 4. The 10 scoring cards are shuffled and revealed in random order. Given that final score, what is the chance Red is strictly ahead after every reveal?
- **Answer:** 1/5 (0.200)
- **Solver:** Enumerate all scoring-card orders with six Red cards and four Blue cards, then compare to the ballot formula.
- **Exact method:** Exact enumeration of C(10, 4) reveal orders, checked against (a - b) / (a + b).
- **Skill tags:** ordered-vs-unordered, combinations, ballot-path-counting
- **Misconception traps:** ordered_vs_unordered, final_margin_equals_staying_ahead
- **Missing taxonomy IDs:** skill:ballot-path-counting, misconception:final_margin_equals_staying_ahead
- **Passed:** yes

### Verification

- Total reveal orders: C(10, 4) = 210.
- Strictly-ahead orders: 42.
- Enumeration probability: 1/5.
- Ballot formula check: (6 - 4) / (6 + 4) = 1/5.

## challenge-game-0006 - First-ruby token duel

- **Candidate:** CG-CAND-0006
- **Category:** fair/unfair token games
- **Difficulty tag:** hard
- **Prompt:** A cup holds 4 ruby tokens and 5 slate tokens. Tokens are drawn without replacement until the first ruby appears. Mina wins if that first ruby is on an odd-numbered draw; Sol wins if it is on an even-numbered draw. Is the duel fair?
- **Answer:** No. Mina wins with probability 40/63 (0.635).
- **Solver:** Choose the positions of the 4 ruby tokens among 9 positions; Mina wins when the earliest ruby position is 1, 3, or 5.
- **Exact method:** Exact position enumeration using combinations.
- **Skill tags:** combinations, complement-rule, fair-game, ordered-vs-unordered
- **Misconception traps:** symmetry_means_fair, ignores_without_replacement_dependence
- **Missing taxonomy IDs:** skill:fair-game, misconception:symmetry_means_fair, misconception:ignores_without_replacement_dependence
- **Passed:** yes

### Verification

- Total ruby-position sets: C(9, 4) = 126.
- Earliest ruby at position 1: C(8, 3) = 56.
- Earliest ruby at position 3: C(6, 3) = 20.
- Earliest ruby at position 5: C(4, 3) = 4.
- Favorable sets: 80.
- Mina win probability: 40/63.
