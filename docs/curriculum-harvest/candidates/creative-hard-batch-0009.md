### CAND-0001 — Nonlinear payoff expected value

- **Source ids:** illustrative-mathematics-bobs-bagel-shop; new-sources-exercises-batch-0004 CAND-0010
- **Reuse mode:** adapt-ok-with-attribution
- **Roadmap target:** Unit 7 — Expected value
- **Practice topic:** expected-value
- **Difficulty tag:** hard / creative
- **Skills:** expected-value, probability-distribution, weighted-average, payoff-modeling
- **Misconceptions:** multiplies-expected-count-by-unit-price, ignores-discount-or-bonus-rule, chooses-most-likely-outcome-as-average
- **Core trick:** Convert each outcome to its payoff first, then take the weighted average over payoffs.
- **Why it matters:** This is more creative than a plain prize table because the payoff is not linear in the count; students must model the random variable carefully.
- **Template sketch:** Generate a small distribution over bundle sizes or game outcomes, with a nonlinear price/bonus rule (bulk discount, jackpot bonus, penalty after threshold). Ask for expected revenue/payoff.
- **Interaction fit:** payoff-table builder followed by fill-currency or decimal entry.
- **Solver feasibility:** exact cents arithmetic: sum `payoffCents(outcome) * probability(outcome)`.
- **Legal notes:** Use new store/game contexts and values. Source is CC BY, but final wording should be Pascal-authored and pass wording audit.
- **Human status:** pending

### CAND-0002 — Coupon collector small-set challenge

- **Source ids:** grinstead-snell; nrich-probability blocked only as broad inspiration; public classic problem references
- **Reuse mode:** inspiration-only until a directly approved source chunk is harvested
- **Roadmap target:** Unit 7 / challenge practice
- **Practice topic:** expected-value
- **Difficulty tag:** hard / creative
- **Skills:** expected-value, geometric-waiting-time, complement-rule, simulation
- **Misconceptions:** expects-collection-time-to-equal-number-of-types, ignores-duplicates, assumes-each draw guarantees progress
- **Core trick:** The chance of getting a new item shrinks as the collection fills.
- **Why it matters:** It is surprising, game-like, and explains why collecting all items takes much longer than collecting one.
- **Template sketch:** For `k = 3..6` sticker types, ask for expected draws to complete the set using `k * H_k`, or ask via simulation which run length is plausible.
- **Interaction fit:** simulation-first challenge, then expected-value step cards.
- **Solver feasibility:** exact rational harmonic sum for small `k`; simulation by repeated draws until all types seen.
- **Legal notes:** Do not use NRICH text. Prefer Grinstead-Snell/FDL or public-domain/own-authored framing before build.
- **Human status:** pending

### CAND-0003 — Ballot lead probability

- **Source ids:** public classic Bertrand ballot theorem references; stat110-probability inspiration-only
- **Reuse mode:** inspiration-only
- **Roadmap target:** Challenge practice / counting extension
- **Practice topic:** counting
- **Difficulty tag:** expert / creative
- **Skills:** combinations, ordered-sequences, complement-rule
- **Misconceptions:** thinks final winner probability equals staying-ahead probability, ignores order of reveal, treats all margins alike
- **Core trick:** The final margin controls the chance one side stays ahead throughout the count.
- **Why it matters:** It is a genuinely elegant harder counting problem, but it may be too abstract for the main path.
- **Template sketch:** Given two vote totals `a > b`, ask whether the winner is likely to stay ahead throughout a random reveal. For small totals, exact-enumerate all sequences; for extension, introduce `(a-b)/(a+b)`.
- **Interaction fit:** sequence simulator plus multiple-choice estimate.
- **Solver feasibility:** exact enumeration for `a+b <= 12`; formula for challenge version.
- **Legal notes:** Use only as challenge; source/license must be checked before direct adaptation. Avoid copied proof wording.
- **Human status:** pending

### CAND-0004 — Odds-and-evens fairness by parity counts

- **Source ids:** nrich-probability blocked only as human-visible inspiration; OpenStax/OpenUp event-counting sources for safe structure
- **Reuse mode:** inspiration-only unless rebuilt from scratch
- **Roadmap target:** Unit 5 — Fair games and compound events
- **Practice topic:** counting
- **Difficulty tag:** medium-hard / creative
- **Skills:** sample-space-enumeration, multiplication-principle, complement-rule, fair-game
- **Misconceptions:** checks examples instead of exhaustive cases, assumes symmetric-looking games are fair, forgets odd+odd and even+even both make even
- **Core trick:** Count parity classes, not individual labels: even sums come from same-parity pairs.
- **Why it matters:** It is a nice bridge from sample-space counting to game fairness.
- **Template sketch:** Generate a bag with `e` even-numbered tokens and `o` odd-numbered tokens. Two tokens are drawn. Ask whether "sum is even" is fair, and compute the probability.
- **Interaction fit:** classify tokens by parity, then fill-fraction or fair/unfair choice.
- **Solver feasibility:** exact count using combinations without replacement: `C(e,2)+C(o,2)` over `C(e+o,2)`.
- **Legal notes:** Do not copy NRICH task text. This can be independently authored from the parity-counting structure.
- **Human status:** pending

### CAND-0005 — Inverse spinner from frequency chart

- **Source ids:** nrich-probability blocked only as broad inspiration; seeing-theory-basic-probability inspiration-only
- **Reuse mode:** inspiration-only
- **Roadmap target:** Unit 1 / Unit 5 — Experimental vs theoretical probability
- **Practice topic:** long-run
- **Difficulty tag:** hard / creative
- **Skills:** relative-frequency, theoretical-probability, model-selection
- **Misconceptions:** overfits small-sample noise, ignores sample size, chooses exact match instead of closest plausible model
- **Core trick:** Use long-run frequencies to infer which probability model most likely generated the data.
- **Why it matters:** Creative reverse direction: not "simulate from model", but "infer model from simulation output."
- **Template sketch:** Generate three candidate spinners and a seeded frequency chart from one spinner. Ask which spinner likely generated the data, with sample size controlling difficulty.
- **Interaction fit:** visual chart + multiple-choice model selection.
- **Solver feasibility:** deterministic generation; score candidates by likelihood/multinomial log probability or simpler distance for v1.
- **Legal notes:** Do not use NRICH/Seeing Theory visual designs. Author a simple Pascal visual if built.
- **Human status:** pending

### CAND-0006 — Last one standing streak survival

- **Source ids:** nrich-probability blocked only as human-visible inspiration; OnlineStatBook/binomial public-domain concepts
- **Reuse mode:** adapt-ok-with-attribution if grounded in OnlineStatBook/binomial; otherwise inspiration-only
- **Roadmap target:** Unit 7 — Binomial / streaks
- **Practice topic:** distributions
- **Difficulty tag:** hard / creative
- **Skills:** independence, complement-rule, binomial-pmf, long-run-vs-single-trial
- **Misconceptions:** thinks long streaks are impossible, confuses expected count with probability at least one exists, ignores many-person amplification
- **Core trick:** Even rare individual streaks become likely when many people try.
- **Why it matters:** This is a vivid, high-school-friendly extension of "at least one" and binomial thinking.
- **Template sketch:** `N` players each flip until tails. Ask expected number who get at least `k` heads, or probability at least one gets `k` heads using complement: `1 - (1 - 2^-k)^N`.
- **Interaction fit:** prediction challenge + simulation reveal + exact complement.
- **Solver feasibility:** exact Fraction for small `k`, `N`; simulation over players.
- **Legal notes:** Do not copy NRICH text. Can be Pascal-authored from public binomial/complement principles.
- **Human status:** pending

### CAND-0007 — Non-transitive dice strategy

- **Source ids:** nrich-probability blocked only as human-visible inspiration; public mathematical topic references
- **Reuse mode:** inspiration-only
- **Roadmap target:** Challenge practice / probability games
- **Practice topic:** counting
- **Difficulty tag:** expert / creative
- **Skills:** sample-space-enumeration, pairwise-comparison, fair-game
- **Misconceptions:** assumes if A beats B and B beats C then A beats C, compares averages instead of win probabilities
- **Core trick:** Pairwise win probability can be non-transitive even when dice look ordinary.
- **Why it matters:** Very creative "wait, what?" game, but probably a challenge or extension rather than core path.
- **Template sketch:** Provide three custom dice with small face sets. Ask which die is best against a chosen opponent, then enumerate pairwise wins.
- **Interaction fit:** grid comparison between two dice; multiple-choice strategy.
- **Solver feasibility:** exact enumeration over 36 pair outcomes per pair.
- **Legal notes:** Use custom Pascal-authored dice faces; do not copy source sets unless license is checked.
- **Human status:** pending

