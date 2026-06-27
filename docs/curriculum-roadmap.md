# Curriculum Roadmap — Probability

> Forward-looking plan for a fuller probability sequence. Today's lineup
> (L1–L5 shipped, L6 stubbed) is a sampler; this doc is the curriculum we'd
> grow into. Companion to [`prd.md`](prd.md) (product scope),
> [`alternatives.md`](alternatives.md) (decision history), and
> [`specs/spec-practice.md`](specs/spec-practice.md) (the _separate_
> adaptive-practice surface — `/practice`, D85 — which draws on this content
> but is not the teaching path).
>
> **Status:** proposal · not committed. Today's deadline is L1; nothing here
> needs to ship now. Build unit-by-unit and ship as we go.

---

## 1. Pedagogical premises

- **One idea per lesson.** Each lesson teaches a single named concept and ends
  with **one concept slot + 2–3 practice problems**. Target **3–5 minutes**, not
  the current 5–7. Smaller chunks → better completion rates, more frequent "win"
  moments, lower cognitive load. There's room for a separate practice-only or
  review lesson without it feeling repetitive.
- **Start at intuition, not at formulas.** Likelihood-as-language comes before
  sample-space arithmetic; sample spaces before counting principles; counting
  before conditional reasoning.
- **One anchor object per unit.** Within a unit, lean on a consistent prop
  (Unit 3 = dice, Unit 5 = cards) so cohesion compounds. Vary _across_ units so
  the learner keeps hearing "probability is about the **structure**, not the prop."
- **Diverge from Brilliant in two places.** (a) Isolate "what does probability
  even mean?" as its own unit — Brilliant jumps straight from "Counting Outcomes"
  to "Possibilities and Probability"; novices need the footing a real textbook
  opening gives. (b) Don't wrap every lesson in one framing (Brilliant commits to
  the card deck) — we stay mixed (dice/coins/cards/M&Ms), closer to Khan Academy.

---

## 2. Where we are today (5 shipped + 1 stub)

| #   | Lesson                  | What it covers                                                | Density                                         |
| --- | ----------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| L1  | What is probability?    | Sample space, equally-likely, events, single events, two-dice | **Very dense** — 7 min, ~11 slots, 4 sub-topics |
| L2  | Law of large numbers    | Empirical-vs-theoretical, convergence                         | Single concept                                  |
| L3  | Counting carefully      | Mult, add, perm, comb, complement (5 principles in one)       | **Very dense**                                  |
| L4  | Counting gets hard      | Combinations applied + birthday paradox                       | Two-concept                                     |
| L5  | Conditional probability | Conditional formula + Monty Hall                              | Two-concept                                     |
| L6  | Distributions           | Stub (`comingSoon`)                                           | —                                               |

**L1 and L3 are way too dense** for the "one idea per lesson" model. Splitting
them is most of the work.

---

## 3. Proposed full sequence — 7 units, ~41 short lessons

> **Updated 2026-06-24 (D89, D90):** scope is **classical HS probability**,
> ending on Expected Value.
>
> - D89 merged "Likelihood" into "Sample Spaces" → "Defining Probability"
>   (`Which is more likely?` and `The probability scale` dropped because the
>   `how-likely` opener already covers comparative likelihood and the 0..1
>   scale; `review-likelihood` folded into the unit review).
> - D90 dropped the statistics-track material — the formal "random variable"
>   abstraction, variance, the named distributions (binomial, normal),
>   Central Limit Theorem, Monte Carlo, and the catch-all capstone — as
>   out-of-scope for HS probability. Unit 7 was reshaped to **Expected
>   Value** (the genuine probability capstone), and the original Unit 8
>   ("Famous Distributions") was removed. See the "Out of scope" callout at
>   the end of § 3 for what's reserved for a future Statistics track.

Short focused lessons grouped into units, with a **Level Review** at the end of
each unit (new lesson kind — see § 5).

### Unit 1 — Defining Probability

_Goal: turn the `how-likely` opener's intuition into a precise definition —
both the long-run interpretation and the equally-likely-outcomes formula._

1. **The long-run idea** — Probability as the share you'd see if you repeated
   forever. (Light flavor of L2; LLN proper comes later.)
2. **The sample space** — {H, T} and {1..6}. Listing every possibility.
3. **Equally-likely outcomes** — favorable/total formula, with theorem callout.
4. **Practice — single events** (practice-only lesson — new lesson kind).
5. **Level review.**

### Unit 2 — Compound experiments (counting outcomes)

_Goal: how the sample space grows when experiments combine, and the two
fundamental counting principles that handle it._ (Anchor: dice.)

1. **Two coins** — HH, HT, TH, TT. The easy starter.
2. **Two dice** — The 6×6 grid; sums.
3. **Tree diagrams** — Visualizing branching choices (new interaction).
4. **The multiplication principle** — Theorem; why 6 × 6 = 36 (the existing
   two-dice flashcard slots here). **AND** = multiply.
5. **The addition principle** — Disjoint cases combine by addition.
   **OR** = add. Moved into Unit 2 from the old Unit 4 (D95) so the
   AND/OR pair is taught together as a single counting toolkit.
6. **Practice — counting outcomes.**
7. **Level review.**

### Unit 3 — Events

_Goal: events as subsets, not as numbers._

1. **An event is a set** — Even rolls, hearts, sums of 7.
2. **P(event) by counting** — Use the equally-likely formula on subsets.
3. **The complement rule** — When "not X" is faster.
4. **Practice — events on dice and cards.**
5. **Level review.**

### Unit 4 — Counting techniques

_Goal: tools when listing every outcome stops working._ (Anchor: cards.)

1. **Inclusion–exclusion** — Overlap correction. The follow-up to Unit 2's
   addition principle, for the case where cases are NOT disjoint.
2. **Permutations** — Order matters.
3. **Combinations** — Order doesn't.
4. **Why divide by k!** — The current L3 derivation, on its own page.
5. **Practice — counting word problems.**
6. **Level review.**

### Unit 5 — Probabilities of multiple events

_Goal: combining probabilities (not just outcomes)._

1. **Independent events** — Multiply.
2. **Mutually exclusive events** — Add.
3. **"At least one"** — Complement trick.
4. **The birthday paradox** — Capstone application.
5. **Practice — multi-step compound.**
6. **Level review.**

### Unit 6 — Conditional probability

_Goal: how new information changes belief._

1. **Given that X happened** — Pure intuition (urns, cards).
2. **The conditional formula** — Theorem callout.
3. **Independence revisited** — P(A|B) = P(A).
4. **Bayes' theorem (intuitive)** — Disease-test or detective example.
5. **Monty Hall** — Capstone.
6. **Practice — trees + Bayes.**
7. **Level review.**

### Unit 7 — Expected Value

_Goal: when you bet on a probability, what payoff do you expect?_ The genuine
probability capstone — every probability textbook ends here, and the unit lands
on real-world decisions (gambles, insurance) rather than formal abstraction.

1. **Expected value (intuition)** — Long-run average payoff of a chance event.
2. **Computing E(X)** — Weighted sums on dice, spinners, and cards.
3. **Fair games** — When is a bet fair? E(X) = 0 says break-even.
4. **Practice — gambles and insurance** — Lotteries, casinos, and insurance,
   settled by expected value.
5. **Level review.**

> **~41 lessons total, ~3–5 min each.** ≈2.5 hours of content vs. today's ~6 min
> — a real curriculum, not a sampler. Smaller than the original 9-unit
> projection (D86) because (a) the merge in D89 collapsed two thin units into
> one and (b) the statistics-track material in D90 moved to a future course.

### Out of scope (future Statistics track)

Per **D90**, this curriculum is _classical HS probability_ and ends on Expected
Value. The following sit on the statistics side of the high-school taxonomy and
would belong in a future "Statistics" course-2, not here:

- **Random variables as a formal abstraction** ("an RV is a function Ω → ℝ").
  Unit 7 teaches Expected Value without ever needing the term — by talking
  about "average payoff," not "the expectation of a random variable."
- **Variance and standard deviation.** Useful, but the moment you start
  _measuring_ spread you've crossed into descriptive statistics.
- **Named distributions:** binomial, geometric, Poisson, uniform (continuous),
  normal. The combinations work that _generates_ the binomial coefficients
  stays in Unit 4; the named distribution itself goes to stats.
- **Central Limit Theorem.** Technically a probability theorem, but
  pedagogically it's the doorway to inferential statistics (sampling
  distributions → confidence intervals → hypothesis tests).
- **Monte Carlo as a method.** L2's Law of Large Numbers already foreshadows
  it; a full treatment belongs alongside resampling and bootstrap in stats.

These ideas are _not_ hidden anywhere in the path: the stub lessons that
covered them (`random-variable`, `distributions-intro`, `variance-spread`,
`binomial-distribution`, `normal-distribution`, `central-limit-theorem`,
`monte-carlo`, `capstone-problem-set`) and the old "Famous Distributions"
chapter were deleted in D90, not parked as locked previews. Keeping the IA
focused on what we plan to author is the explicit design choice.

---

## 4. How current lessons map in

| Today    | Becomes                                                            |
| -------- | ------------------------------------------------------------------ |
| L1       | Unit 2.1 + 2.2 + 3.1 + 3.2 + 4.1 + 4.2 (split into 6 lessons)      |
| L2 (LLN) | Unit 1.3 (light) + Unit 9.4 (proper return with CLT / Monte Carlo) |
| L3       | Unit 3.4 + 5.1 + 5.3 + 5.4 + 5.5                                   |
| L4       | Unit 5.4 (combos applied) + Unit 6.4 (birthday)                    |
| L5       | Unit 7 (split across 5–6 lessons)                                  |
| L6       | Units 8 + 9                                                        |

The existing slot model (`ConceptSlot` / `ProblemSlot` / `WrapSlot`) handles all
of this **with no schema changes**. The biggest content moves are mechanical
splits, not rewrites.

---

## 5. What's new beyond content

Capabilities the new sequence wants but we don't have yet:

1. **Practice-only lesson shape** — All `ProblemSlot`s, no teaching. Today every
   lesson has a concept→problem rhythm. We'd want a different `WrapSlot`
   ("nice work, X/Y on first try") and probably skip the captain cameo.
2. **Level review** — A mixed problem set drawing from a unit's lessons. Could be
   a special `Lesson` kind that pulls variants from across its unit. New
   analytics: per-concept retention.
3. **Probability slider** — New interaction kind for "set the likelihood"
   (Unit 1.2).
4. **Tree diagram** — New interaction kind, click-to-expand branches. Reusable
   across Unit 3.3, 6.x, 7.x.
5. **Likelihood comparator** — Drag-to-rank, for the very-first lesson. Could be
   a sub-mode of `multiple-choice` rather than its own kind.
6. **Unit / level structure on the home page** — The course path needs visual
   unit dividers (Brilliant's "LEVEL 1" / "LEVEL 2" headers). Today the path is
   flat.

---

## 6. Trade-offs to flag

- **Authoring volume.** ~40 lessons is real work. Realistic cadence: 3–5
  lessons/week of focused authoring → **8–13 weeks** to ship the full sequence.
  Do it unit-by-unit and ship as we go.
- **Splitting existing lessons isn't a clean win.** L1 today flows as one arc;
  chopping it up creates pacing seams (each new lesson needs its own hook/wrap).
  Worth it for the learning model, but expect 1–2 passes of pacing fixes per split.
- **Smaller lessons need a different reward rhythm.** XP-per-lesson, streak
  credit, and the celebration screen are all calibrated for 5–7 min lessons. With
  3-min lessons we may want lower XP-per-lesson but more lessons-per-day for streak.
- **"Level Review" is a real feature, not just content.** A different lesson kind
  with cross-lesson variant pulling.

---

## 7. Suggested build order (when ready, not today)

1. **Add the unit-level structure to the path UI first** (LEVEL 1 / LEVEL 2
   headers). Cheap, visible, unblocks everything else. Even with today's 5
   lessons, grouping them into "Foundations" feels more like a curriculum.
2. **Split L1 into Unit 2** (3 lessons + practice). Highest-leverage move — L1 is
   the front door and the most overstuffed.
3. **Then Unit 3** — repurposes the two-dice flashcard, adds tree diagrams.
4. **Then back-fill Unit 1** (the pure-intuition lessons). These are the _hardest_
   to author well — comparative likelihood needs new interactions and very careful
   copy — so they shouldn't be the first thing shipped under deadline pressure,
   even though they're #1 in the order.
5. **Splits of L3 / L4 / L5** can happen lazily as we re-touch each.
6. **Units 8 / 9** (RVs, distributions, CLT) are a substantial second project —
   basically a course-2.

---

## 8. A note on Brilliant's path

Their path (per the reference screenshots) is useful but I'd diverge in two
places:

- **They don't isolate "what does probability even mean?"** They jump straight
  from "Counting Outcomes" to "Possibilities and Probability" in their L1. The
  instinct to make "defining likelihood" / "defining probability" their own
  lessons is better — it's how a real textbook opens, and gives novices a footing
  the Brilliant path skips.
- **They wrap their card-deck framing around everything**, a pedagogical
  commitment (concrete object → familiarity). We've been mixed (dice, coins,
  cards, M&Ms) — closer to Khan Academy. Keep the variety because it stresses that
  probability is about the _structure_, not the prop — but within a single unit,
  pick one anchor object (Unit 3 = dice, Unit 5 = cards) for cohesion.
