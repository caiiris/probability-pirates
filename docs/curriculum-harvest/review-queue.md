# Curriculum Harvest Review Queue

Use this file for fast human decisions. Agents may append proposed items under
the correct gate, but only the owner should mark final decisions.

## Gate A — Source Decisions

| Source | Decision needed | Status | Notes |
| --- | --- | --- | --- |
| CK-12 Probability and Statistics | Confirm whether any direct adaptation is allowed. | `inspiration-only` | Current default avoids direct reuse. |
| MIT OCW Probability materials | Decide whether noncommercial sources are acceptable. | `inspiration-only` | Keep inspiration-only until commercial posture is clear. |
| Seeing Theory | Decide whether interaction inspiration from a noncommercial-request project is acceptable. | `inspiration-only` | Do not reuse visualizations or code without a separate review. |
| Evans/Rosenthal Science of Uncertainty | Decide whether no-alter/no-profit sources should stay in the registry. | `inspiration-only` | More advanced; do not directly adapt. |
| Open Up HS Math Unit 10 | Confirm exact attribution wording before direct adaptation. | `adapt-ok-with-attribution` | Strong high-school fit; use Pascal-authored wording by default. |
| CMU OLI Probability & Statistics | Decide whether noncommercial/share-alike sources are acceptable. | `inspiration-only` | Strong interactive pedagogy, but do not directly adapt for a possibly commercial app. |
| OpenLearn probability/Bayes courses | Decide whether noncommercial/share-alike OpenLearn material is acceptable. | `inspiration-only` | Check course acknowledgements for third-party restrictions before any direct use. |
| Harvard Stat 110 / Blitzstein-Hwang | Permission would be needed for direct problem reuse. | `inspiration-only` | Excellent problem design; do not copy problems or solutions. |
| Mathigon | Commercial reuse requires licensing. | `inspiration-only` | Do not ingest/copy; use only as high-level interaction inspiration. |
| NRICH probability tasks | Terms prohibit modification/republishing/text-mining without permission. | `blocked` | Do not ingest or copy; only use as a human-visible reminder of rich task categories. |

## Gate B — Candidate Idea Decisions

First clustered harvest batch is ready in `clusters/cluster-map.md`.

| Cluster | Candidate idea | Suggested status | Owner decision | Notes |
| --- | --- | --- | --- | --- |
| CL-0001 | At least one via complement | `build-now` | `approved-for-review-generation` | Core practice MVP family; exact solver is straightforward. |
| CL-0002 | Conditional probability from a two-way table | `build-now` | `pending` | Highest-value denominator misconception family. |
| CL-0003 | Bayes/base-rate tree | `build-now` | `pending` | Strong "wait, what?" lesson/practice payoff. |
| CL-0004 | Birthday-style collision via complement | `build-now` | `pending` | Supports existing birthday paradox arc. |
| CL-0005 | Expected value from a discrete model | `build-now` | `pending` | Roadmap capstone; useful if Unit 7 is next. |
| CL-0006 | Inclusive or and overlap correction | `backlog` | `pending` | Strong, but likely better after Venn interaction support. |
| CL-0007 | Independence tests | `backlog` | `pending` | Good misconception coverage; can become multiple template families. |
| CL-0008 | Valid probability distribution | `backlog` | `pending` | Useful model-checking habit, less urgent for current app. |
| CL-0009 | Sampling without replacement | `backlog` | `pending` | Good extension after independence and complements. |
| CL-0010 | Product sample-space grid basics | `backlog` | `pending` | Useful for roadmap split, overlaps current two-dice lesson. |
| CL-0011 | Event notation translator | `backlog` | `pending` | Low-code symbolic parsing practice; can become build-now if notation errors show up in testing. |
| CL-0012 | Missing category from total mass | `backlog` | `pending` | Entry-level complement bridge. |
| CL-0013 | Multiplication assumption audit | `backlog` | `pending` | Teaches when independence assumptions are valid. |
| CL-0014 | Fair stake for unequal win chances | `backlog` | `pending` | Expected-value capstone candidate. |
| CL-0015 | Long-run frequency interaction variants | `needs-pedagogy-pass` | `pending` | Interaction inspiration for existing long-run lesson. |
| CL-0016 | Binomial shape from trial count and chance | `backlog` | `pending` | Useful if distributions/binomial returns to scope. |
| CL-0017 | Complete the contingency table first | `backlog` | `pending` | Good prerequisite for conditional table practice. |
| CL-0018 | Choose the best representation | `needs-pedagogy-pass` | `pending` | Table/Venn/tree fluency; likely needs UI support. |
| CL-0019 | Reverse conditional from joint and marginal | `backlog` | `pending` | Strong bridge from conditionals to Bayes. |
| CL-0020 | Mixed strategy selector | `backlog` | `pending` | Best after several practice families exist. |
| CL-0021 | Distribution reference guardrail | `backlog` | `pending` | Internal QA idea for future distribution templates. |
| CL-0022 | Nonlinear payoff expected value | `build-now` | `pending` | **Hard / creative.** Expected-value family; safe via IM CC BY with new Pascal wording. |
| CL-0023 | Last one standing streak survival | `backlog` | `pending` | **Hard / creative.** Complement/binomial extension with strong "many tries make rare events likely" intuition. |
| CL-0024 | Odds-and-evens fairness by parity counts | `backlog` | `pending` | **Medium-hard / creative.** Strong game-fairness task, but source inspiration must be independently authored. |
| CL-0025 | Inverse spinner from frequency chart | `needs-pedagogy-pass` | `pending` | **Hard / creative.** Model-inference task; likely needs a small chart UI. |
| CL-0026 | Non-transitive dice strategy | `backlog` | `pending` | **Expert / creative.** Excellent challenge problem; use custom Pascal dice and exact enumeration only. |

Review for:

- named skill coverage,
- student-facing trick,
- misconception value,
- parameterization potential,
- legal/reuse safety.

Statuses: `approved`, `approved-with-edits`, `reject`, `needs-license-check`,
`needs-pedagogy-pass`, `backlog`.

## Gate C — Build Decisions

First template briefs are ready:

| Brief | Cluster | Suggested action | Owner decision | Notes |
| --- | --- | --- | --- | --- |
| `template-briefs/cl-0001-at-least-one-via-complement.md` | CL-0001 | `build-now` | `approved-for-review-generation` | Independent-trials MVP; without-replacement saved as separate extension. |
| `template-briefs/cl-0002-conditional-two-way-table.md` | CL-0002 | `build-now` | `pending` | Denominator-selection table template. |
| `template-briefs/cl-0003-bayes-base-rate-tree.md` | CL-0003 | `build-now` | `pending` | Non-medical base-rate tree; first rendered samples need human review. |

Approved briefs should be marked:

- `build-now` for the next practice-template batch,
- `backlog` for later,
- `reject` if they fail solver/pedagogy/legal review.

