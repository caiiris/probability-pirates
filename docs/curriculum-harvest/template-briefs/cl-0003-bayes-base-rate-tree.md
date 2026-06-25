### TEMPLATE-BRIEF — bayes-base-rate-tree

- **Build target:** `src/features/practice/templates/bayes-base-rate-tree.ts`
- **Topic:** conditional
- **Skills:** conditional-probability, bayes-rule, base-rate-reasoning, probability-tree, total-probability, reverse-conditional
- **Retrieval form:** application
- **Difficulty range:** 1250-1650
- **Learner goal:** See that a positive signal is not the same as membership in the target group; the base rate and false-alarm path both belong in the denominator.
- **Params:**
  - `contextKind`: one of `robot-quality-check`, `plant-water-sensor`, `wildlife-camera`, `game-achievement-flag`, `library-recommendation`
  - `targetLabel`: context-specific target group, such as `actually needs review`, `has a rare badge`, or `is a fox`
  - `signalLabel`: context-specific observed signal, such as `gets flagged`, `sends an alert`, or `shows the badge icon`
  - `baseRatePct`: one of `[2, 5, 10, 15, 20, 25, 30, 40]`
  - `hitRatePct`: one of `[70, 75, 80, 85, 90, 95]`
  - `falseAlarmPct`: one of `[1, 2, 5, 10, 15, 20, 25]`
  - Generator constraints: `falseAlarmPct < hitRatePct`; avoid `baseRatePct >= 30` with `falseAlarmPct <= 2` for early difficulty; reject instances where the final reduced denominator exceeds `10_000`; no medical diagnosis, legal guilt, threat, or surveillance scenarios in the default generator.
  - Suggested difficulty rating: start at `1250`, add `100` when `baseRatePct <= 5`, add `100` when `falseAlarmPct >= 15`, add `100` when the correct posterior is below both `hitRatePct` and `50%`, cap at `1650`.
- **Render shape:** Present a short Pascal-authored scenario with a rare target category and an imperfect positive signal. Ask: "Among the items that show the signal, what fraction are actually in the target group?" Prefer `fill-fraction` for the main answer. An optional scaffolded variant can first ask learners to fill the two positive-signal branches in a tree.
- **Solve:** Convert percentages to exact fractions. Let `b = baseRatePct / 100`, `h = hitRatePct / 100`, and `f = falseAlarmPct / 100`.
  - Target-and-signal path: `targetSignal = b * h`
  - Non-target-and-signal path: `nonTargetSignal = (1 - b) * f`
  - Total signal probability: `signalTotal = targetSignal + nonTargetSignal`
  - Answer: `targetSignal / signalTotal`, reduced as an exact fraction.
  - Implementation note: compute with integer counts over a synthetic population of `10_000`: `target = 100 * baseRatePct`, `nonTarget = 10_000 - target`, `targetSignal = target * hitRatePct / 100`, `nonTargetSignal = nonTarget * falseAlarmPct / 100`, answer `targetSignal / (targetSignal + nonTargetSignal)`. With the allowed percent values, all intermediate counts are integers.
- **Simulate / exact enumeration plan:** Include both a direct enumeration check and a Monte Carlo estimator for template vetting.
  - Exact enumeration: build a `10_000`-item synthetic population from the params; count target items that signal and all items that signal; assert the enumerated fraction equals `solve(params)`.
  - Simulation: for each trial, sample whether the item is target using `baseRatePct`, then sample whether it signals using `hitRatePct` or `falseAlarmPct`; estimate `P(target | signal)` as `targetAndSignalCount / signalCount`. If `signalCount` is `0` in a very small trial batch, rerun or aggregate; with `10_000` trials this should be rare for allowed params.
  - CI vetting: use the standard template helper over at least `1_000` sampled param sets with `10_000` simulation trials, plus exact enumeration for every sampled param set.
- **Distractors:**
  - `hitRatePct / 100`: treats `P(signal | target)` as `P(target | signal)`.
  - `targetSignal`: gives the joint probability instead of conditioning on the signal.
  - `baseRatePct / 100`: ignores the new signal entirely.
  - `targetSignal / (targetSignal + falseAlarmPct / 100)`: mixes a joint probability with a conditional false-alarm rate.
  - `(baseRatePct * hitRatePct) / 10_000 + falseAlarmPct / 100`: adds the false-positive branch but never normalizes.
- **Interaction fit:** Strong for `fill-fraction` with authored wrong-answer feedback keyed to the distractors above. A later richer version can use an interactive two-level tree: first split target versus not target, then signal versus no signal, then tap the branches included in the denominator.
- **Worked solution outline:**
  1. Define the target group and the observed signal.
  2. Start with a friendly population of `10_000` items so percentages become counts.
  3. Count target items: `baseRatePct%` of `10_000`.
  4. Count target items with the signal using `hitRatePct`.
  5. Count non-target items with the signal using `falseAlarmPct`.
  6. Add both signal branches to form the denominator.
  7. Divide the target-and-signal branch by all signal branches, then reduce the fraction.
  8. Close with the misconception repair: the signal can be accurate and still have many false alarms when the target group is uncommon.
- **Source inspiration:** `openintro-statistics-readable-batch-0001` CAND-0010; `openintro-statistics-readable-batch-0002` CAND-0001 and CAND-0002; clustered as CL-0003 in `docs/curriculum-harvest/clusters/cluster-map.md`. Reuse mode is `adapt-ok-with-attribution`; final learner-facing wording, contexts, and parameter sets must be Pascal-authored.
- **Human status:** pending-build. Human review should approve the first rendered samples and any future sensitive-domain context. The default build should ship only age-appropriate, non-medical, non-punitive contexts.
