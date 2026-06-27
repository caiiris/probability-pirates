# Challenge Games Candidate Batch

> Pascal-authored creative challenge game candidates. These are review artifacts only; do not wire them into runtime templates or the registry from this file.

## Batch Notes

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Verification artifact:** `docs/curriculum-harvest/generated-problems/challenge-games-verified.md`
- **Legal notes:** No proprietary sources, NRICH text, AoPS text, or copied problem wording. Contexts and numbers are authored for this repository.
- **Taxonomy notes:** Missing IDs are listed per candidate; do not add ad hoc IDs inside problem records.

### CG-CAND-0001 - Skyship non-transitive dice draft

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Roadmap target:** Challenge practice / creative probability games
- **Practice topic:** non-transitive dice / custom dice strategy
- **Difficulty tag:** extreme
- **Skills:** sample-space-enumeration, favorable-over-total, pairwise-comparison, fair-game
- **Misconceptions:** compares_averages_instead_of_win_probability, assumes_transitivity
- **Missing taxonomy IDs:** skill:pairwise-comparison, skill:fair-game, misconception:compares_averages_instead_of_win_probability, misconception:assumes_transitivity
- **Core trick:** Enumerate the 36 equally likely roll pairs for each matchup and choose the die with more winning pairs.
- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.
- **Template sketch:** In a skyship duel, your opponent picks one of three six-sided custom dice first. You may then pick either remaining die. A higher roll wins the round. Which reply should you make to each opponent die, and why is there no single best die?
- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.
- **Solver feasibility:** Exact enumeration over 36 ordered roll pairs per matchup.
- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.
- **Human status:** pending

### CG-CAND-0002 - Three-token scoring booth

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Roadmap target:** Challenge practice / creative probability games
- **Practice topic:** fair/unfair token games
- **Difficulty tag:** hard
- **Skills:** combinations, favorable-over-total, expected-value, fair-game
- **Misconceptions:** ordered_vs_unordered, symmetry_means_fair, ignores_payout_weights
- **Missing taxonomy IDs:** skill:expected-value, skill:fair-game, misconception:symmetry_means_fair, misconception:ignores_payout_weights
- **Core trick:** Count unordered 3-token hands by color pattern, then average the score over all C(12, 3) hands.
- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.
- **Template sketch:** A booth has 5 amber, 4 blue, and 3 crimson tokens. Draw 3 without replacement. You score +5 for exactly two colors, -4 for all one color, and -2 for all three colors. Is the game fair to the player?
- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.
- **Solver feasibility:** Exact combination counts for all 3-token hands.
- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.
- **Human status:** pending

### CG-CAND-0003 - Streak survival finale

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Roadmap target:** Challenge practice / creative probability games
- **Practice topic:** last-one-standing streak survival
- **Difficulty tag:** hard
- **Skills:** complement-rule, independence, long-run-vs-single-trial, streak-survival
- **Misconceptions:** gambler, complement_inversion, expected_count_as_probability
- **Missing taxonomy IDs:** skill:streak-survival, misconception:expected_count_as_probability
- **Core trick:** First enumerate the 32 possible 5-flip rows for one finalist, then use the complement that no finalist survives.
- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.
- **Template sketch:** Fifteen finalists each flip a fair coin 5 times. A finalist survives if their row contains at least 4 heads in a row. What is the probability at least one finalist survives?
- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.
- **Solver feasibility:** Exact row enumeration plus formula 1 - (1 - 3/32)^15.
- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.
- **Human status:** pending

### CG-CAND-0004 - Vault crest coupon chase

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Roadmap target:** Challenge practice / creative probability games
- **Practice topic:** coupon collector small sets
- **Difficulty tag:** hard
- **Skills:** inclusion-exclusion, multiplication-principle, coupon-collector, simulation
- **Misconceptions:** ignores_duplicates, assumes_each_draw_adds_new_type, gambler
- **Missing taxonomy IDs:** skill:coupon-collector, skill:simulation, misconception:ignores_duplicates, misconception:assumes_each_draw_adds_new_type
- **Core trick:** Use inclusion-exclusion on missing crest types, and verify by enumerating all 4^7 draw strings.
- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.
- **Template sketch:** A puzzle vault has 4 equally likely crest tokens. You open 7 boxes, each with one random crest. What is the probability you have seen all 4 crests by then?
- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.
- **Solver feasibility:** Exact inclusion-exclusion formula compared with exhaustive enumeration of all draw strings.
- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.
- **Human status:** pending

### CG-CAND-0005 - Scoreboard lead lock

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Roadmap target:** Challenge practice / creative probability games
- **Practice topic:** ballot/lead probability for small totals
- **Difficulty tag:** extreme
- **Skills:** ordered-vs-unordered, combinations, ballot-path-counting
- **Misconceptions:** ordered_vs_unordered, final_margin_equals_staying_ahead
- **Missing taxonomy IDs:** skill:ballot-path-counting, misconception:final_margin_equals_staying_ahead
- **Core trick:** Enumerate all scoring-card orders with six Red cards and four Blue cards, then compare to the ballot formula.
- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.
- **Template sketch:** A match ended Red 6, Blue 4. The 10 scoring cards are shuffled and revealed in random order. Given that final score, what is the chance Red is strictly ahead after every reveal?
- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.
- **Solver feasibility:** Exact enumeration of C(10, 4) reveal orders, checked against (a - b) / (a + b).
- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.
- **Human status:** pending

### CG-CAND-0006 - First-ruby token duel

- **Source ids:** pascal-authored-challenge-games
- **Reuse mode:** original-authoring-only
- **Roadmap target:** Challenge practice / creative probability games
- **Practice topic:** fair/unfair token games
- **Difficulty tag:** hard
- **Skills:** combinations, complement-rule, fair-game, ordered-vs-unordered
- **Misconceptions:** symmetry_means_fair, ignores_without_replacement_dependence
- **Missing taxonomy IDs:** skill:fair-game, misconception:symmetry_means_fair, misconception:ignores_without_replacement_dependence
- **Core trick:** Choose the positions of the 4 ruby tokens among 9 positions; Mina wins when the earliest ruby position is 1, 3, or 5.
- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.
- **Template sketch:** A cup holds 4 ruby tokens and 5 slate tokens. Tokens are drawn without replacement until the first ruby appears. Mina wins if that first ruby is on an odd-numbered draw; Sol wins if it is on an even-numbered draw. Is the duel fair?
- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.
- **Solver feasibility:** Exact position enumeration using combinations.
- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.
- **Human status:** pending
