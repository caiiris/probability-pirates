# Cluster Map — Batch 0001

Sources processed:

- `openintro-statistics-readable-batch-0001.md`
- `openintro-statistics-readable-batch-0002.md`
- `openintro-im-batch-0003.md`

## Recommended Build-Now Clusters

### CL-0001 — At least one via complement

- **Candidate refs:** `openintro-statistics-readable-batch-0001` CAND-0006,
  `openintro-statistics-readable-batch-0002` CAND-0005
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Why keep:** Highest-leverage trick; already in the practice MVP plan.
- **Template fit:** Strong. Exact `1 - (1 - p)^n` and without-replacement variant.
- **Suggested status:** `build-now`

### CL-0002 — Conditional probability from a two-way table

- **Candidate refs:** `openintro-statistics-readable-batch-0001` CAND-0009,
  `openintro-statistics-readable-batch-0002` CAND-0003,
  `openintro-im-batch-0003` CAND-0001 through CAND-0006
- **Roadmap target:** Unit 6 — Conditional probability
- **Why keep:** Denominator choice is the central student error in table problems.
- **Template fit:** Strong. Generate 2x2 or 2x3 integer tables and solve exactly.
- **Suggested status:** `build-now`

### CL-0003 — Bayes/base-rate tree

- **Candidate refs:** `openintro-statistics-readable-batch-0001` CAND-0010,
  `openintro-statistics-readable-batch-0002` CAND-0001 and CAND-0002
- **Roadmap target:** Unit 6 — Bayes' theorem, intuitive
- **Why keep:** Strong misconception value; supports the app's wrong-answer feedback.
- **Template fit:** Strong if parameters are friendly percentages.
- **Suggested status:** `build-now`

### CL-0004 — Birthday-style collision via complement

- **Candidate refs:** `openintro-statistics-readable-batch-0002` CAND-0008,
  `openintro-im-batch-0003` CAND-0009
- **Roadmap target:** Unit 5 — Birthday paradox / collisions
- **Why keep:** Directly supports the existing birthday lesson and simulation arc.
- **Template fit:** Strong. Exact falling product plus simulation.
- **Suggested status:** `build-now`

### CL-0005 — Expected value from a discrete model

- **Candidate refs:** `openintro-statistics-readable-batch-0002` CAND-0009 and
  CAND-0010
- **Roadmap target:** Unit 7 — Expected value
- **Why keep:** Matches the roadmap capstone and opens game/insurance contexts.
- **Template fit:** Strong. Weighted sum with exact fractions or cents.
- **Suggested status:** `build-now`

## Strong Backlog Clusters

### CL-0006 — Inclusive or and overlap correction

- **Candidate refs:** `openintro-statistics-readable-batch-0001` CAND-0002,
  CAND-0003, CAND-0004
- **Roadmap target:** Unit 4 / Unit 5 — Inclusion-exclusion and events
- **Why keep:** Good bridge from event sets to Venn diagrams.
- **Template fit:** Strong, but may need a Venn interaction to shine.
- **Suggested status:** `backlog`

### CL-0007 — Independence tests

- **Candidate refs:** `openintro-statistics-readable-batch-0001` CAND-0007,
  CAND-0008, `openintro-statistics-readable-batch-0002` CAND-0004,
  CAND-0006
- **Roadmap target:** Unit 5 / Unit 6 — Independence
- **Why keep:** High misconception value: disjoint versus independent, conditional
  rate versus overall rate.
- **Template fit:** Strong. Classification plus exact fraction comparison.
- **Suggested status:** `backlog`

### CL-0008 — Valid probability distribution

- **Candidate refs:** `openintro-statistics-readable-batch-0001` CAND-0005
- **Roadmap target:** Unit 7 or future statistics track
- **Why keep:** Useful model-checking habit, but less central to current HS
  probability path unless expected value ships soon.
- **Template fit:** Good multiple-choice/reason-selection template.
- **Suggested status:** `backlog`

### CL-0009 — Sampling without replacement

- **Candidate refs:** `openintro-statistics-readable-batch-0002` CAND-0005,
  CAND-0006, CAND-0007
- **Roadmap target:** Unit 5 — Probabilities of multiple events
- **Why keep:** Good extension after independence; helps students see changing
  denominators.
- **Template fit:** Strong. Combination or sequential-product solver.
- **Suggested status:** `backlog`

### CL-0010 — Product sample-space grid basics

- **Candidate refs:** `openintro-im-batch-0003` CAND-0008, CAND-0009,
  CAND-0010
- **Roadmap target:** Unit 2 — Compound experiments
- **Why keep:** Useful for splitting L1/L2 into smaller roadmap lessons.
- **Template fit:** Strong but overlaps with existing two-dice lesson.
- **Suggested status:** `backlog`

## Rejected Or Merge-Away

- `openintro-im-batch-0003` CAND-0001 through CAND-0004 are useful but merge into
  CL-0002 rather than standing alone.
- `openintro-statistics-readable-batch-0001` CAND-0001 merges into CL-0010 and
  the existing sample-space lesson work.

---

# Cluster Map — Batch 0002

Sources processed:

- `new-sources-exercises-batch-0004.md`
- `new-sources-visual-batch-0005.md`

## Recommended Additions

### CL-0011 — Event notation translator

- **Candidate refs:** `new-sources-exercises-batch-0004` CAND-0001
- **Roadmap target:** Unit 3 / Unit 6 — Probability language
- **Why keep:** Low-code, high-value parsing skill. Helps students distinguish
  `and`, `or`, complement, and reverse conditionals before calculation.
- **Template fit:** Strong multiple-choice/card-sort template.
- **Suggested status:** `build-now` if lesson parsing is a priority; otherwise
  `backlog`.

### CL-0012 — Missing category from total mass

- **Candidate refs:** `new-sources-exercises-batch-0004` CAND-0002,
  `new-sources-visual-batch-0005` CAND-0002
- **Roadmap target:** Unit 2 / Unit 3 — Sample spaces and complements
- **Why keep:** Simple complement bridge; useful for middle-school entry level.
- **Template fit:** Strong fill-fraction/numeric-entry template.
- **Suggested status:** `backlog`

### CL-0013 — Multiplication assumption audit

- **Candidate refs:** `new-sources-exercises-batch-0004` CAND-0006
- **Roadmap target:** Unit 5 — Independence and modeling
- **Why keep:** Teaches when multiplication is justified, not just how to multiply.
- **Template fit:** Strong classify-then-calculate template.
- **Suggested status:** `backlog`

### CL-0014 — Fair stake for unequal win chances

- **Candidate refs:** `new-sources-exercises-batch-0004` CAND-0012
- **Roadmap target:** Unit 7 — Expected value
- **Why keep:** Concrete expected-value capstone: fair does not mean equal stakes.
- **Template fit:** Strong equation-builder or fill-currency template.
- **Suggested status:** `backlog`, or `build-now` if expected value moves up.

### CL-0015 — Long-run frequency interaction variants

- **Candidate refs:** `new-sources-visual-batch-0005` CAND-0001, CAND-0002,
  CAND-0006
- **Roadmap target:** Unit 1 / current long-run lesson
- **Why keep:** Reinforces existing Pascal strength: simulation as verification.
- **Template fit:** Strong interaction inspiration, but not necessarily a practice
  template.
- **Suggested status:** `needs-pedagogy-pass`

### CL-0016 — Binomial shape from trial count and chance

- **Candidate refs:** `new-sources-visual-batch-0005` CAND-0009
- **Roadmap target:** Future distributions/binomial extension
- **Why keep:** Strong synthesis of combinations, independence, and distributions.
- **Template fit:** Good, but beyond current classical HS probability scope unless
  distributions return to the roadmap.
- **Suggested status:** `backlog`

## Merge Into Existing Clusters

- `new-sources-exercises-batch-0004` CAND-0003 strengthens CL-0008.
- `new-sources-exercises-batch-0004` CAND-0004 strengthens CL-0002 and CL-0006.
- `new-sources-exercises-batch-0004` CAND-0005 strengthens CL-0007.
- `new-sources-exercises-batch-0004` CAND-0007 and `new-sources-visual-batch-0005`
  CAND-0007 strengthen CL-0003.
- `new-sources-exercises-batch-0004` CAND-0008 and CAND-0009 strengthen CL-0009.
- `new-sources-exercises-batch-0004` CAND-0010 and CAND-0011 strengthen CL-0005
  but may be too advanced if variance remains out of scope.
- `new-sources-visual-batch-0005` CAND-0003 and CAND-0004 strengthen CL-0005 and
  the future expected-value/variability track.
- `new-sources-visual-batch-0005` CAND-0005 strengthens CL-0004.
- `new-sources-visual-batch-0005` CAND-0008 strengthens the existing Monty Hall
  lesson rather than creating a new practice template.

---

# Cluster Map — Batch 0003

Sources processed:

- `openstax-homework-batch-0006.md`
- `open-up-hs-unit10-batch-0007.md`
- `reference-inspiration-batch-0008.md`

## Recommended Additions

### CL-0017 — Complete the contingency table first

- **Candidate refs:** `openstax-homework-batch-0006` CAND-0005,
  `open-up-hs-unit10-batch-0007` CAND-0001
- **Roadmap target:** Unit 6 — Conditional probability from tables
- **Why keep:** Table errors often happen before probability starts; this gives
  learners the bookkeeping foundation for denominator selection.
- **Template fit:** Strong table-fill template followed by one probability question.
- **Suggested status:** `backlog`

### CL-0018 — Choose the best representation

- **Candidate refs:** `open-up-hs-unit10-batch-0007` CAND-0002
- **Roadmap target:** Unit 6 — Representation fluency
- **Why keep:** High-school aligned and conceptually different from calculation
  drills: table, Venn, and tree each make different facts visible.
- **Template fit:** Strong lesson/review activity; may need UI support for multiple
  representations.
- **Suggested status:** `needs-pedagogy-pass`

### CL-0019 — Reverse conditional from joint and marginal

- **Candidate refs:** `openstax-homework-batch-0006` CAND-0003,
  `open-up-hs-unit10-batch-0007` CAND-0003
- **Roadmap target:** Unit 6 — Conditional probability and Bayes bridge
- **Why keep:** Algebraic bridge to Bayes without naming Bayes first.
- **Template fit:** Strong two-step fill-fraction template.
- **Suggested status:** `backlog`

### CL-0020 — Mixed strategy selector

- **Candidate refs:** `reference-inspiration-batch-0008` CAND-0006
- **Roadmap target:** Level reviews / adaptive practice
- **Why keep:** Tests transfer by hiding the topic label and asking for the first
  move before arithmetic.
- **Template fit:** Strong once several template families exist.
- **Suggested status:** `backlog`

### CL-0021 — Distribution reference guardrail

- **Candidate refs:** `reference-inspiration-batch-0008` CAND-0007
- **Roadmap target:** Internal QA for future distribution templates
- **Why keep:** Not learner-facing, but useful to keep formulas and
  parameterizations honest if binomial/distributions come back.
- **Template fit:** Internal validator/checklist only.
- **Suggested status:** `backlog`

## Merge Into Existing Clusters

- `openstax-homework-batch-0006` CAND-0001 strengthens CL-0002 and CL-0011.
- `openstax-homework-batch-0006` CAND-0002 strengthens CL-0007.
- `openstax-homework-batch-0006` CAND-0004 strengthens CL-0006.
- `openstax-homework-batch-0006` CAND-0006 strengthens CL-0001 and CL-0006.
- `openstax-homework-batch-0006` CAND-0007 strengthens CL-0018 and tree-diagram
  support for CL-0003.
- `openstax-homework-batch-0006` CAND-0008 strengthens CL-0009.
- `open-up-hs-unit10-batch-0007` CAND-0004 strengthens CL-0011.
- `open-up-hs-unit10-batch-0007` CAND-0005 strengthens CL-0018.
- `open-up-hs-unit10-batch-0007` CAND-0006 strengthens CL-0007.
- `open-up-hs-unit10-batch-0007` CAND-0007 strengthens CL-0007 and CL-0013.
- `open-up-hs-unit10-batch-0007` CAND-0008 strengthens CL-0015.
- `reference-inspiration-batch-0008` CAND-0001 and CAND-0002 strengthen CL-0015
  and CL-0010.
- `reference-inspiration-batch-0008` CAND-0003 strengthens CL-0002.
- `reference-inspiration-batch-0008` CAND-0004 strengthens tree-diagram support
  for CL-0003 and CL-0018.
- `reference-inspiration-batch-0008` CAND-0005 strengthens CL-0016.

