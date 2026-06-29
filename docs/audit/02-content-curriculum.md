# Audit 02 — Content Curriculum: Completeness & Mathematical/Pedagogical Correctness

> **Scope.** The live teaching catalog (`src/content/index.ts`), its roadmap stubs
> (`src/content/lessons/roadmapStubs.ts`), chaptering (`src/features/course/chapters.ts`),
> the 11 authored lessons, the content model (`src/content/types.ts`), and the
> reservoir lessons (`src/content/lessons/01..06`). Read-only audit; no source/test
> files were modified. `tsc`/`eslint`/`vitest` (1083/1083) taken as green; not re-run.
>
> **Headline.** **11 lessons are playable; 23 roadmap nodes are empty stubs** (34
> nodes total on the path). The 11 authored lessons are **mathematically correct**
> — every probability, fraction, and count checks out — with only **4 cosmetic copy
> typos** and zero `[TODO]`/`FEEDBACK_TODO` markers in shipped copy. The unfinished
> work is the back half of the course: the entire **Conditional** and **Expected
> Value** units, plus **independent events** and the two flagship payoff lessons
> (**Monty Hall**, **birthday paradox**). The reservoir lessons `lesson4`/`lesson5`
> contain correct birthday + Monty-Hall + conditional content that should be
> **harvested for math/interactions but re-authored into the house style**, not
> dropped in verbatim.

---

## 1. Overview + exact inventory table

### How the catalog is assembled

`src/content/index.ts` builds the live catalog as `[howLikely, ...liveRoadmap]`,
where `liveRoadmap` is `roadmapStubLessons` with any authored lesson swapped in by
`id`. Every node is then **renumbered by position** (`number = i + 1`), so the
hard-coded `number` fields inside the authored lesson files are overridden (see
B-07). Grouping into 7 display chapters lives in `chapters.ts`. A contentless
lesson (`slots: []`) is locked two ways: `comingSoon: true` and the empty-slots
safety net in `useLessons`.

- **Total nodes on the path:** 34 (1 opener + 33 roadmap stubs).
- **Playable (authored, non-stub):** 11.
- **Empty stubs (`slots: []`, `comingSoon: true`):** 23 — split **11 teaching
  stubs** + **12 practice/review stubs**.

### Inventory table

Legend: **P** = playable, **STUB** = empty (`slots: []`). "#" is the renumbered
catalog position. Interaction kinds are the distinct `interactionKind`s used.

| #  | id | Chapter (unit) | Title | Status | Slots | Interaction kinds |
|----|----|----|----|----|----|----|
| 1  | `how-likely` | 1 Start Here | How likely is it? | **P** | 16 | tap-outcomes, fill-fraction, multiple-choice, grid-event |
| 2  | `long-run-frequency` | 2 Defining Probability | The long run | **P** | 11 | multiple-choice, scrub-trials, simulate-proportion |
| 3  | `sample-space` | 2 Defining Probability | Naming the toolkit | **P** | 14 | tap-outcomes, fill-text, multiple-choice, fill-fraction |
| 4  | `equally-likely-outcomes` | 2 Defining Probability | Equally likely outcomes | **P** | 11 | multiple-choice, fill-fraction, fill-text |
| 5  | `practice-single-events` | 2 Defining Probability | Practice: single events | **STUB** | 0 | — |
| 6  | `review-sample-spaces` | 2 Defining Probability | Defining probability review | **STUB** | 0 | — |
| 7  | `compound-experiments` | 3 Compound Experiments | Compound experiments | **P** | 8 | tap-outcomes, fill-text, multiple-choice |
| 8  | `multiplication-principle` | 3 Compound Experiments | The multiplication principle | **P** | 10 | fill-text, multiple-choice |
| 9  | `addition-principle` | 3 Compound Experiments | The addition principle | **P** | 7 | multiple-choice |
| 10 | `practice-counting-outcomes` | 3 Compound Experiments | Practice: counting outcomes | **STUB** | 0 | — |
| 11 | `review-compound` | 3 Compound Experiments | Compound experiments review | **STUB** | 0 | — |
| 12 | `complement-rule` | 4 Counting Techniques | The complement rule | **P** | 10 | multiple-choice, fill-fraction |
| 13 | `inclusion-exclusion` | 4 Counting Techniques | Inclusion and exclusion | **P** | 8 | multiple-choice, fill-fraction |
| 14 | `permutations` | 4 Counting Techniques | Permutations | **P** | 14 | multiple-choice, multiply-steps, fill-text |
| 15 | `combinations` | 4 Counting Techniques | Combinations | **P** | 10 | multiple-choice, fill-text |
| 16 | `practice-counting-techniques` | 4 Counting Techniques | Practice: counting techniques | **STUB** | 0 | — |
| 17 | `review-counting-techniques` | 4 Counting Techniques | Counting techniques review | **STUB** | 0 | — |
| 18 | `independent-events` | 5 Combining Probabilities | Independent events | **STUB** | 0 | — |
| 19 | `birthday-paradox` | 5 Combining Probabilities | The birthday paradox | **STUB** | 0 | — |
| 20 | `practice-multi-event` | 5 Combining Probabilities | Practice: multiple events | **STUB** | 0 | — |
| 21 | `review-combining` | 5 Combining Probabilities | Combining probabilities review | **STUB** | 0 | — |
| 22 | `conditional-intuition` | 6 Conditional Probability | Given that X happened | **STUB** | 0 | — |
| 23 | `conditional-formula` | 6 Conditional Probability | The conditional formula | **STUB** | 0 | — |
| 24 | `tree-diagrams` | 6 Conditional Probability | Tree diagrams | **STUB** | 0 | — |
| 25 | `independence-revisited` | 6 Conditional Probability | Independence revisited | **STUB** | 0 | — |
| 26 | `bayes-theorem` | 6 Conditional Probability | Bayes' theorem | **STUB** | 0 | — |
| 27 | `monty-hall` | 6 Conditional Probability | Monty Hall | **STUB** | 0 | — |
| 28 | `practice-conditional` | 6 Conditional Probability | Practice: conditional probability | **STUB** | 0 | — |
| 29 | `review-conditional` | 6 Conditional Probability | Conditional probability review | **STUB** | 0 | — |
| 30 | `expected-value-intuition` | 7 Expected Value | Expected value | **STUB** | 0 | — |
| 31 | `computing-expected-value` | 7 Expected Value | Computing E(X) | **STUB** | 0 | — |
| 32 | `fair-games` | 7 Expected Value | Fair games | **STUB** | 0 | — |
| 33 | `practice-expected-value` | 7 Expected Value | Practice: gambles and insurance | **STUB** | 0 | — |
| 34 | `review-expected-value` | 7 Expected Value | Expected value review | **STUB** | 0 | — |

### Which lessons are unfinished — precisely

**11 EMPTY teaching stubs** (the real authoring work):
`independent-events` (18), `birthday-paradox` (19), `conditional-intuition` (22),
`conditional-formula` (23), `tree-diagrams` (24), `independence-revisited` (25),
`bayes-theorem` (26), `monty-hall` (27), `expected-value-intuition` (30),
`computing-expected-value` (31), `fair-games` (32).

**12 EMPTY practice/review stubs** (probably *not* hand-authored — see §3):
`practice-single-events` (5), `review-sample-spaces` (6),
`practice-counting-outcomes` (10), `review-compound` (11),
`practice-counting-techniques` (16), `review-counting-techniques` (17),
`practice-multi-event` (20), `review-combining` (21), `practice-conditional` (28),
`review-conditional` (29), `practice-expected-value` (33),
`review-expected-value` (34).

**Reservoir (NOT on the path, kept as content source):** `lesson1`–`lesson6`
(`01-what-is-probability` … `06-distributions`). `lesson4` holds finished
birthday-paradox content; `lesson5` holds finished Monty-Hall + conditional content.

---

## 2. What works (authored lessons, correctness)

All 11 authored lessons share a disciplined house style and a consistent
pedagogical rhythm. **Every mathematical claim I checked is correct.** Spot-check
log:

- **`how-likely`** — single-die `k/N` (1/6, 3/6, 2/6, 1/67), two-dice grid with
  6/36 for sum 7 and 1/36 for sum 2; the 36 total is derived **by cases**
  (6+6+6+6+6+6), deliberately *before* the multiplication principle exists. The
  "fair game?" challenge (`commitOnce`) is a clean cognitive hook. ✔
- **`long-run-frequency`** — `P(heads)=1/2`, `P(six)=1/6`; gambler's-fallacy beat
  separates *independence* from *convergence* (the subtle, correct point that the
  average settles because early flips get swamped, not because the coin "corrects").
  The "exactly 50 heads in 100 ≈ 8%" figure is accurate (C(100,50)/2¹⁰⁰ ≈ 0.0796). ✔
- **`sample-space`** — outcome/sample-space/set/subset/event defined cleanly; two-coin
  space {HH,HT,TH,TT}; `P(at least one head)=3/4`; `P(club)=13/52`; three-coin space
  = 8 strings. Good use of the blue **definition** callout vs the violet **theorem**
  callout. ✔
- **`equally-likely-outcomes`** — the granularity trap done right: `P(exactly one
  head)=1/2`, with the {0H,1H,2H} = 1/4,2/4,1/4 demonstration; `P(sum=7)=6/36`;
  wheel 270°/90° = 3/4 vs 1/4; sums-sample-space = 11 (not equally likely); the
  equal space = 36. Excellent diagnostic wrong-answer feedback (`1/11`, `6/11`). ✔
- **`compound-experiments`** — (coin, die) = 12 by *listing only* (6+6), with the
  multiplication shortcut deliberately withheld for the next lesson. ✔
- **`multiplication-principle`** — 3×2=6, 2×4=8, 42×42=1,764 (and the `882 = (42×42)/2`
  distractor is correctly debunked), 10⁴=10,000, 4×3×2=24. Concreteness-fading arc
  (picker → road-fork figure → named rule → abstract lock). ✔
- **`addition-principle`** — 3+5=8 (OR), contrasted with 3×2=6 (AND); end-to-end
  recognition `(4+3)×2 = 14` with both canonical traps (24 = all-AND, 9 = all-OR). ✔
- **`complement-rule`** — `P(at least one six)=1−25/36=11/36`; `P(not 6)=5/6` checked
  two ways; `P(≥1 head in 3)=1−1/8=7/8`; overlap teaser (hearts OR queens = 16). ✔
- **`inclusion-exclusion`** — 12+9−5=16; hearts-or-face = 13+12−3=22; `P(heart or
  queen)=16/52=4/13`; correctly frames the addition principle as the zero-overlap
  special case. ✔
- **`permutations`** — 3!=6, 4!=24 (via `multiply-steps`), 8×7×6=336=8!/5!,
  10×9×8=720; nPk derived with a flippable "winners/non-winners" card; circular
  arrangement (n−1)! with the pin-one-down derivation, 5 pirates = 24. ✔
- **`combinations`** — C(5,3)=60/6=10; C(4,2)=6; C(6,2)=15 handshakes; stars-and-bars
  challenge C(8,2)=28 (and 3⁶=729 correctly debunked as the "distinct" case). ✔

**Authoring quality signals that are genuinely strong:**

- Rich content model used to its full extent: `theorem` vs `definition` callouts,
  `derivation` (flippable flashcards), `example`, `figure` (settling-line,
  two-coins-grid, road-fork, order-builder, circle-builder), `commitOnce`
  prediction beats, `challenge` banners, `afterNote`, per-wrong-answer feedback.
- Consistent voice (declarative, no em dashes, no AI-isms), age-appropriate (8–15).
- Misconception-aware wrong-answer copy on nearly every problem variant.
- Invariants enforced at load (`assertLessonInvariants`) — fractions must satisfy
  `0 ≤ numerator ≤ denominator`, regexes compile, options reference valid ids, etc.

---

## 3. What's missing / incomplete

### 3a. The empty stubs (the back half of the course)

The course is **fully authored through Unit 4 (Counting Techniques)** and then
stops. Units 5–7 are entirely unbuilt at the teaching level:

- **Unit 5 — Combining Probabilities:** `independent-events`, `birthday-paradox`
  both empty. This is where the multiply-independent-probabilities idea lives, and
  it is a prerequisite for the conditional unit.
- **Unit 6 — Conditional Probability (8 nodes, all empty):** `conditional-intuition`,
  `conditional-formula`, `tree-diagrams`, `independence-revisited`, `bayes-theorem`,
  `monty-hall`, plus practice/review. This is the single biggest content gap and
  contains **two of the four PRD-named "payoff" results** (Monty Hall, base rates).
- **Unit 7 — Expected Value (5 nodes, all empty):** `expected-value-intuition`,
  `computing-expected-value`, `fair-games`, plus practice/review. This is the
  course capstone/ending; nothing exists yet.

### 3b. The reservoir mismatch (important)

`lesson1`–`lesson6` are imported and re-exported but **not on the path**. Two of
them are high-value:

- **`lesson4` (`counting-gets-hard`)** — a complete, correct birthday-paradox
  lesson: `simulate-proportion` with the `birthday` scenario (rooms of 23 → ~50.7%,
  30 → ~70.6%), the complement-rule derivation (365/365 × 364/365 × … × 343/365 ≈
  0.493 → 0.507), and the "23 vs 57 vs 183" intuition MCQs. It also has C(4,2)=6 /
  C(5,2)=10 combination warm-ups.
- **`lesson5` (`conditional-probability`)** — a complete, correct Monty-Hall +
  conditional lesson: the `conditional-probability` theorem statement
  `P(A|B)=P(A∩B)/P(B)`, the door-probability MCQs (your door 1/3, the other two 2/3),
  the `monty-hall` interaction (play + autopilot batch), and the switch/stay
  fraction problems (2/3, 1/3).

**The mismatch:** these reservoir lessons are in the **old terse style** — many
concept slots are a bare `prompt` + `illustration` with no `title`, no
`definition`/`theorem` callout, no `body[]`, no `mascotLine`, no `afterNote`, no
`misconceptionByOption`, and **no `commitOnce` discovery arc**. They also do not
match the new **granular** unit split: `lesson5` crams conditional-intuition +
(partial) conditional-formula + Monty-Hall into one lesson, while the live roadmap
expects those as **separate** nodes (22, 23, 27), and has *no* reservoir at all for
`tree-diagrams` (24), `independence-revisited` (25), or `bayes-theorem` (26). The
**Expected Value** unit has **zero** reservoir content (the old `lesson6` is
*distributions*/binomial, which D90 explicitly dropped from scope).

Net: the reservoir is a **math/interaction head-start for ~3 stubs**
(`birthday-paradox`, `monty-hall`, `conditional-intuition`), not a drop-in.

### 3c. `[TODO]` / `FEEDBACK_TODO` copy

**None.** `FEEDBACK_TODO`/`isFeedbackTodo`/`[TODO]` appear only in
`src/content/types.ts` (the helper definitions). No authored lesson ships a
placeholder. The mechanism exists but is currently unused in content.

### 3d. Learner-model skill tags absent

**No authored lesson tags any variant with `skills`.** Every problem variant omits
the optional `skills?: SkillId[]` field, so `assertLessonInvariants` emits a
`[WP-2] variant … has no skills tagged` console warning for each. The taxonomy
(`src/content/skills.ts`, 19 skills incl. `conditional-probability`, `base-rate`,
`monty-hall-reasoning`, `birthday-paradox`) is ready, but the lessons don't feed the
learner model. This weakens any adaptive/mastery features that depend on per-lesson
skill signal. (Optional "during migration," but it has not been done.)

### 3e. Practice/review nodes vs the practice engine

The 12 `practice-*`/`review-*` stubs on the path are **separate** from the live,
adaptive `/practice` route, which is template-engine driven
(`src/features/practice/practiceEngine.ts`, `templates/<topic>/<id>.ts`,
`verifiedTemplateSeeds.ts`) and already has verified template banks for counting,
inclusion-exclusion, expected value, conditional/Bayes 2×2, gambler's fallacy, etc.
**Recommendation:** do not hand-author the 12 practice/review course nodes as fixed
lessons — either wire them to the topic-based practice engine or leave them as
"see Practice" entry points. Treat them as **near-zero authoring cost** and focus
human effort on the 11 teaching stubs.

---

## 4. Bugs & math-correctness issues

No mathematical errors were found in any playable lesson. The issues below are
copy/typo and maintainability only.

| ID | Sev | File:line | Issue |
|----|-----|-----------|-------|
| B-01 | **P2** | `src/content/lessons/multiplication-principle.ts:155` | Two typos in one line: "**Previosly**" (→ Previously) and "2 x 2 = **4instead**" (missing space → "4 instead"). Learner-visible body copy. |
| B-02 | **P2** | `src/content/lessons/multiplication-principle.ts:154` | "rolling **two die**" → should be "two **dice**". Learner-visible body copy. |
| B-03 | **P2** | `src/content/lessons/multiplication-principle.ts:104` | Run-on / missing punctuation: "…splits again into 2 branches **Therefore**, there are…" (missing period before "Therefore"). |
| B-04 | **P2** | `src/content/lessons/equally-likely-outcomes.ts:125` | Typo "counting **posisbilities**" (→ possibilities). Learner-visible body copy. |
| B-05 | **P2** | `src/content/lessons/sample-space.ts:169` | Stray space before comma: "the same item twice **,**". |
| B-06 | **P2** | `src/content/lessons/long-run-frequency.ts:290–301` | Internal id/label mismatch: option `id: 'h30'` carries `label: '25 heads'` (and `feedbackByOption` key is `h30`). Grading is correct (25 heads is the right "surprise"), but the id is misleading for maintenance. Cosmetic. |
| B-07 | **P2** | `complement-rule.ts:47`, `inclusion-exclusion.ts:48`, `permutations.ts:58`, `combinations.ts:46`, `multiplication-principle.ts:27` (and others) | Hard-coded `number:` fields are **stale** relative to catalog position (e.g. `complement-rule` says `number: 11` but renders as #12; `multiplication-principle` says `number: 5` but renders as #8). Harmless because `index.ts` renumbers by position, but the literals are dead/misleading and invite confusion. |
| B-08 | **P1 (process)** | all 11 lessons | No `skills:` tags on any variant (see §3d). Not a correctness bug, but it silently disables learner-model signal and generates load-time warnings. Worth fixing before relying on adaptivity. |
| B-09 | **P2 (docs)** | `docs/prd.md` §5 (lines 102–131) | PRD still describes the **old 6-lesson spine** (What is probability / LLN / Counting carefully / Counting gets hard / Conditional / Distributions) and "Course progress: 0/6", which no longer matches the live 7-chapter / 34-node roadmap. Documentation drift, not a code bug. |

> There are no P0 issues. No incorrect probabilities, wrong fractions, out-of-range
> `k/N`, mis-keyed correct options, or misleading derivations were found in the
> playable catalog.

---

## 5. Pros / Cons

### Pros

- **Mathematically clean.** 11/11 lessons correct; traps and distractors are
  pedagogically chosen and their feedback is accurate.
- **Strong, consistent house style.** Discovery-first arc, dual theorem/definition
  callouts, derivations as flippable cards, manipulative figures, and
  misconception-aware feedback — far above textbook baseline.
- **The hard part is done well.** Counting (the conceptually trickiest HS strand:
  multiplication, addition, complement, inclusion-exclusion, permutations,
  combinations, even stars-and-bars and circular permutations) is fully and
  correctly authored.
- **Reusable infrastructure already exists for the gaps.** The `birthday`
  `simulate-proportion` scenario, the `monty-hall` interaction, the `tree-diagram`
  figure, and verified practice templates for conditional/Bayes/expected-value are
  all built and tested — the unbuilt lessons are content, not engine, work.
- **Reservoir de-risks 3 of the highest-value stubs.**

### Cons

- **Course is only ~half complete by teaching node** (11 playable / 22 if you also
  count practice-review intent), and the unbuilt half contains the marquee "wow"
  results the product's value prop is built on (Monty Hall, birthday, base rates).
- **The ending is missing.** The whole Expected Value capstone is unbuilt and has no
  reservoir to draw from.
- **Learner model is unfed** (no skill tags), so personalization/mastery cannot work
  off lesson play yet.
- **Documentation drift** (PRD §5) makes the "6 lessons" contract misleading against
  the 34-node reality.
- **No expected-value or independence interaction** is exercised by any lesson yet
  (e.g. a weighted-sum builder), so those lessons may need a new interaction or a
  creative reuse of `multiply-steps`/`fill-text`/`multiple-choice`.

---

## 6. Learning-science assessment + concrete opportunities

### Where pedagogy is strong

- **One-idea-per-lesson.** Cleanly held: `sample-space` is vocabulary only (no
  `k/N` calc), `compound-experiments` lists only (no multiply rule), `addition` is
  the OR move only. Each lesson's docstring explicitly names what is *deferred* to
  protect the next lesson's punchline.
- **Intuition-before-formula.** Every "rule" lesson opens with a `commitOnce`
  prediction that surfaces the misconception, then a `resolve` concept, then the
  named `theorem`. The formula lands as a *fix*, not a *fact* (textbook-inverted, in
  a good way).
- **Pretrieval via `commitOnce`.** Used in 7 lessons (long-run, equally-likely,
  multiplication, addition, complement, permutations ×2, combinations ×2) — answer
  once, see feedback, continue right or wrong, with the payoff on the next slots.
  This is exactly the "generate-then-study" effect, applied consistently.
- **Worked examples & derivations.** `how-likely` derives the 36 by cases;
  `permutations` derives nPk and (n−1)! with flippable cards; `combinations`
  derives ÷k!. Concreteness fading is explicit in `multiplication-principle`.
- **Concept → problem → wrap rhythm.** Every lesson ends on a `wrap` with a
  `mascotLine` and (where the next lesson is authored) a `segueToLessonId`,
  reinforcing the "each tool breaks, the next fixes it" spine.
- **Verify-by-simulation** (a PRD differentiator): `scrub-trials`,
  `simulate-proportion`, and `monty-hall` let the learner *see* the claim, not be
  told it.

### Where pedagogy is thin / opportunities

1. **(Highest-value) Interleaving / cumulative retrieval is weak.** Lessons retrieve
   *within* a unit (e.g. `multiplication-principle`'s `look-back` reuses L1/L3), but
   there is no cross-unit mixed retrieval on the path because the `practice-*` and
   `review-*` nodes are empty. The single biggest learning-science win is to **wire
   the review/practice nodes to the existing adaptive practice engine** so spaced,
   interleaved retrieval actually happens between units. The engine and verified
   banks already exist; only the wiring/enabling is missing.
2. **Feed the learner model.** Add `skills:` tags to every variant (taxonomy already
   defined). Without it, mastery/adaptivity has no per-lesson signal — a large
   payoff for low effort.
3. **The payoff lessons that justify the product are unbuilt.** The PRD's emotional
   thesis ("repeated *wait, what? → ohhh*") rests on Monty Hall, birthday, and base
   rates. Until Units 5–6 ship, the course delivers competence (counting) but not
   the signature *surprise*. Prioritize these (see §7).
4. **Segues dangle at the Unit-4 boundary.** `combinations` and
   `inclusion-exclusion` wraps have no `segueToLessonId` (next node is an unauthored
   stub). Once `independent-events`/`birthday-paradox` ship, re-link the segues so
   the path narrative is unbroken.
5. **Expected Value needs an interaction, not just MCQs.** To keep the "the
   interaction *is* the explanation" promise, `computing-expected-value` should get a
   weighted-sum manipulative (or reuse `multiply-steps` per outcome) rather than
   leaning entirely on `multiple-choice`/`fill-text`.

---

## 7. Prioritized "finish the lessons" plan

**Guiding principle:** author the **11 teaching stubs**; wire (don't author) the **12
practice/review stubs** to the existing engine. Sequence by value × prerequisite
order, front-loading the PRD-named payoff results. Effort assumes the established
house style (~8–14 slots, theorem/definition callouts, commit-once arc, misconception
feedback) and is in ideal engineering-days.

### Tier 0 — wiring, not authoring (do first; unblocks interleaving)

| Task | Effort | Notes |
|------|--------|-------|
| Wire the 12 `practice-*`/`review-*` nodes to the topic-based practice engine (or convert to "Practice" entry points) | **~1 day total** | Engine + verified banks exist; this is the biggest learning-science ROI. |
| Add `skills:` tags to all 11 authored lessons' variants | **~0.5 day** | Kills load warnings; feeds learner model. |

### Tier 1 — flagship payoff lessons (highest product value)

| # | Stub | Effort | Source strategy |
|---|------|--------|-----------------|
| 18 | `independent-events` | **0.5 day** | Fresh, conceptually light (multiply independent P; contrast with disjoint-OR). Prereq for 19 + Unit 6. |
| 19 | `birthday-paradox` | **0.75 day** | **Harvest `lesson4`** (birthday simulate-proportion + complement derivation + intuition MCQs); **re-author** into house style (add commit-once "how many people?" hook, theorem/definition callouts, mascotLine). Interaction already built. |
| 22 | `conditional-intuition` | **0.75 day** | **Harvest `lesson5` intro + door MCQs** ("the other two hold 2/3"); re-style; add commit-once. |
| 23 | `conditional-formula` | **1 day** | `lesson5` already states `P(A|B)=P(A∩B)/P(B)`; build the worked-example + fill-fraction beats around it. Use verified `conditional-bayes-2x2` banks for problem ideas. |
| 27 | `monty-hall` | **0.75 day** | **Harvest `lesson5` Monty-Hall** (the `monty-hall` interaction + switch/stay fractions); re-author to house style. The single most iconic lesson. |

### Tier 2 — complete the Conditional unit

| # | Stub | Effort | Source strategy |
|---|------|--------|-----------------|
| 24 | `tree-diagrams` | **1 day** | Fresh; `tree-diagram` figure exists. Sequential dependent choices, stage-by-stage probabilities. |
| 25 | `independence-revisited` | **0.5 day** | Fresh, light; "when conditioning changes nothing," `P(A|B)=P(A)`. Builds on 18 + 23. |
| 26 | `bayes-theorem` | **1.5 days** | **Fresh, hardest conceptually** (base rates / false-positive intuition — a PRD payoff). Use verified `conditional-bayes-2x2` banks; consider a 2×2 figure. |

### Tier 3 — the Expected Value capstone (no reservoir; build the ending)

| # | Stub | Effort | Source strategy |
|---|------|--------|-----------------|
| 30 | `expected-value-intuition` | **1 day** | Fresh; long-run-average framing (ties back to `long-run-frequency`). |
| 31 | `computing-expected-value` | **1.25 days** | Fresh; **needs a weighted-sum interaction** (new, or reuse `multiply-steps` per outcome). Use verified `expected-value` banks. |
| 32 | `fair-games` | **0.75 day** | Fresh; `E(X)=0` break-even; lotteries/casino/insurance framing (callback to `how-likely`'s "fair game?" hook). |

### Rough totals

- **Teaching stubs (11):** ≈ **10.25 ideal-days**.
- **Wiring/tagging (Tier 0):** ≈ **1.5 days**.
- **Grand total to a fully playable course:** ≈ **11.75 ideal-days** of focused
  authoring (add buffer for review/QA; each lesson should pass
  `assertLessonInvariants` + a vitest content snapshot like the existing 11).

### Reservoir-porting recommendation (explicit)

**Port the *math and interactions*, re-author the *prose*.** `lesson4` and `lesson5`
are correct and save real time on `birthday-paradox`, `conditional-intuition`, and
`monty-hall` (≈3 of 11 stubs get a head start). But do **not** drop them in
verbatim: they predate the granular unit split and the current house style (missing
titles, callouts, commit-once beats, mascot lines, misconception feedback). Treat
them as a verified answer key + ready interaction wiring, and write the lessons to
match `complement-rule`/`permutations` quality. `tree-diagrams`,
`independence-revisited`, `bayes-theorem`, and the **entire Expected Value unit**
have **no reservoir** and must be authored fresh.

---

### Appendix — verification method

Each authored lesson was read in full and its probabilities/fractions/counts
recomputed by hand (logged in §2). Stub status was confirmed against
`roadmapStubs.ts` (`slots: []`, `comingSoon: true`) and the assembly logic in
`index.ts`. `[TODO]`/`FEEDBACK_TODO` were searched repo-wide (only the
`types.ts` definitions matched). The practice-engine vs course-node distinction
was confirmed against `practiceEngine.ts` and
`docs/curriculum-harvest/runtime-generation-workflow.md`.
