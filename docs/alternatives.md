# Alternatives & Gaps Log

> Companion to the PRD. Every meaningful tradeoff captured: **what we chose**, **what we considered**, and the **gaps / risks** the chosen path leaves us with. Updated as new decisions are made during the build.

## How to read an entry

Each entry has a fixed shape so it stays scannable:

- **ID + title** — stable identifier for cross-reference
- **Status** — `resolved` or `open`
- **Chose** — the path we're taking
- **Considered** — the alternatives we evaluated and rejected
- **Gaps / risks** — the price we're paying for the chosen path; things to revisit later

D-numbers are **stable IDs**, not section indices: once assigned, an entry keeps its number even if its section grouping changes. Within a section, entries are listed in ascending numeric order.

## Section index

| Section | Topic                         | Entries                                                                               |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| A       | Product & Pedagogy            | D1–D8, D55, D56, D69, D70, D73, D75, D76, D77, D78, D84, D85, D86, D88, D89, D90, D91 |
| B       | Stack                         | D9–D12                                                                                |
| C       | Data & Persistence            | D13–D16                                                                               |
| D       | Auth & Identity               | D17–D18                                                                               |
| E       | Visual & Motion               | D19–D21, D67, D87                                                                     |
| F       | Streaks & Engagement          | D22                                                                                   |
| G       | Scope Exclusions              | D23–D27                                                                               |
| H       | Motivation & Habit Loop       | D28–D35, D79, D80, D82, D83                                                           |
| I       | UI Stack                      | D36–D37, D68                                                                          |
| J       | Project Structure & Tooling   | D38–D48, D64, D74, D81                                                                |
| K       | PRD Acceptance Criteria Style | D49–D54, D57–D62                                                                      |
| L       | Platform & Responsive         | D63, D65, D66                                                                         |
| M       | Phase 2 — AI                  | D92–D101                                                                              |

---

## A. Product & Pedagogy

### D1 — Subject

- **Status:** resolved
- **Chose:** Probability
- **Considered:** Algebra (slope, balancing equations), Geometry (Pythagorean theorem, angles), Logic puzzles
- **Gaps / risks:**
  - Probability assumes the learner already grasps fractions and basic counting — a shakier-than-expected persona could trip on the very first concept ("favorable / total")
  - Probability has class-anxiety associations for some HS students
  - Less _tangible_ than geometry — no spatial intuition to lean on for free; we have to construct the intuition entirely with visuals

### D2 — Persona

- **Status:** resolved
- **Chose:** High school student learning probability for the first time (algebra background, no calculus)
- **Considered:** Curious adult (poker/investing/news), Intro college / AP Stats student, Test prep (SAT/GRE)
- **Gaps / risks:**
  - HS students rarely _choose_ learning apps voluntarily — distribution/marketing is a real challenge later (out of scope for Phase 1, but real)
  - The test-prep persona would have more urgency and a clearer "done" state
  - Tone calibration is delicate: must be friendly without being childish
  - HS students vary wildly in math background — designing for "any HS student" is harder than designing for AP-specific

### D3 — MVP lesson choice

- **Status:** resolved
- **Chose:** Lesson 1 — _"What is probability?"_ (sample space + counting + 6×6 grid payoff)
- **Considered:** Lesson 2 (Law of Large Numbers — more visceral hook), Lesson 4 (Monty Hall — maximum wow factor)
- **Gaps / risks:**
  - Less viral than Monty Hall — the demo might be less memorable for graders / first-look reviewers
  - Doesn't yet show the simulation capability that becomes the spine of the course in Lesson 2+
  - The grid is tap-based, not drag-based — less _tactile_ than a slider with a live chart

### D4 — Rich interaction (beyond multiple choice)

- **Status:** resolved
- **Chose:** Two-dice **6×6 grid** for compound events; learner taps cells matching an event, live counter shows `X / 36`
- **Considered:** Single-die only (too thin), draggable spinner (more visual but conceptually mismatched with "counting outcomes")
- **Gaps / risks:**
  - 36 cells on a 390px viewport gets tight — sizing/touch-target work required
  - Tap-based, not drag-based — less "tactile" than Brilliant's sliders
  - "Wrong cells flash red" could feel punitive on mobile if a learner is poking around exploratively — need to tune so it's a gentle nudge, not a reprimand

### D5 — Lesson length

- **Status:** resolved
- **Chose:** 9 steps, target ~4 minutes
- **Considered:** 6 steps (faster but loses the counterintuitive payoff setup)
- **Gaps / risks:**
  - 9 steps = more hand-authored copy to write
  - If pacing isn't tight, can drift past 5 min and lose the "before bed" promise
  - No data yet on whether 9 is _actually_ the right number — instinct, not validated

### D6 — Course spine (6 lessons, 5 locked stubs)

- **Status:** resolved
- **Chose:** Show all 6 lessons in the course path; only Lesson 1 is real, Lessons 2–6 are visible-but-locked with title + blurb
- **Considered:** Hide future lessons entirely; build two real lessons in MVP
- **Gaps / risks:**
  - Stubs without content could feel hollow if a learner is curious enough to tap them
  - "Unlocks after Lesson N" toast for stubs is a tiny lie — Lesson N exists but unlocks nothing real
  - We're committing publicly to a course shape we might want to revise after user feedback

### D7 — Wrong-answer handling

- **Status:** resolved
- **Chose:** ~~2 strikes then full hand-written explanation appears and Continue unlocks — learner is never trapped~~ **Updated 2026-06-23 (superseded by D55):** 2 strikes show the variant's `explanation` as a hint alongside per-wrong feedback. **Continue stays locked until the learner produces a correct answer.** No bail-out, ever.
- **Considered:** Infinite retries (frustrating), single attempt then move on (no learning loop), adaptive limits
- **Gaps / risks:**
  - 2 strikes might be too few for genuinely hard concepts later
  - ~~"Continued without ever getting it right" isn't currently captured as a mastery signal (relevant for Phase 3)~~ — **Resolved 2026-06-23 by D55:** no learner can complete a lesson without answering every problem correctly; lesson completion is now a stronger mastery signal by construction.
  - Same limit for all step types — some (e.g. grid taps with many cells) might warrant more attempts
- **See also:** D55 (current rule), D31 (XP curve updated as a consequence)

### D8 — Feedback authoring strategy

- **Status:** resolved
- **Chose:** `feedbackByWrongValue` / `feedbackByWrongAnswer` maps per step in the content model — one hint per _anticipated_ wrong answer, plus a `feedbackDefault` for the rest
- **Considered:** Single "Not quite, try again" default (too generic), AI-generated specific hints (Phase 2 territory, forbidden in Phase 1)
- **Gaps / risks:**
  - Authoring burden is significant — every step needs us to brainstorm common wrong answers
  - Unanticipated wrong answers fall through to a generic default — exactly the gap Phase 2 AI could close
  - Hint quality is bounded by the author's imagination, not the learner's actual mistakes
- **See also:** D69 (`feedbackByCell` per-cell extension to the grid renderer)

### D55 — Progressive hint model (no bail-out)

- **Status:** resolved (supersedes D7's unlock behavior; triggered the D31 XP curve update)
- **Chose:** **Continue is locked until the learner produces a correct answer on every problem slot.** After 2 wrong attempts on the same slot, the variant's `explanation` field (new, optional, on `BaseVariant`) is shown as an additional hint beneath the per-wrong feedback. The learner is never trapped _in the lesson_ (they can always close and resume), but they cannot _bypass a problem_.
- **Considered:**
  - **Original D7 model** — explanation appears and Continue unlocks. Rejected because the unlock incentivizes cognitive offloading (learner learns to guess wrong twice to skip).
  - **Strict — no explanation at all** — per-wrong feedback is the only help. Rejected because it risks rage-quit on hard problems.
  - **Required `explanation` on every variant** — rejected for MVP to avoid backfilling 8 explanations on the already-shipped Lesson 1; the field is optional and authors opt in where it matters most.
  - **Full progressive hint array (`hints: [{ afterStrike, text }]`) in MVP** — rejected as YAGNI for Phase 1; intermediate hand-authored hints are a high authoring burden without proportional MVP value.
- **Gaps / risks:**
  - A learner who genuinely cannot answer a hard problem will be stuck on that slot until they figure it out or close the app and never come back; we accept this for the pedagogy win and rely on the variant pool + replay to give them a fresh angle on return.
  - Lesson 1 variants currently have no `explanation` field populated; until backfilled, the post-2-wrong behavior is a softer presentation of the same per-wrong copy (no new content). Backfill is a follow-up author task.
  - "Cannot complete the lesson" becomes a real failure mode that the streak and progress system experience for the first time — if it happens often, we'll see it in the `stepAttempts` log and can add a "skip with mastery debt" lever in Phase 3.
  - Schema is intentionally small (`explanation?: string`) rather than future-shaped (`hints: [{ afterStrike, text }]`); Phase 2 will migrate when the LLM lands and the richer structure pays for itself. The migration is additive — no breaking change to existing content.
  - Same threshold (N=2) for every problem slot, regardless of difficulty. A hard grid problem and a binary multiple-choice get the same trigger. Easy to tune per-slot later if needed.
- **See also:** D7 (original superseded rule), D31 (XP curve consequence)

### D56 — Exploration vs commit in interactions

- **Status:** resolved
- **Chose:** **Keep the 2-step build-then-check model** with no separate exploration mode. Every tap during the build phase is reversible with no feedback; Check is the explicit commit. Add per-kind UX affordance copy ("Tap to mark. Tap again to unmark.") so first-time learners see the build-as-exploration distinction. (Option E + D from the design exploration.)
- **Considered:**
  - **A: 3-step Lock-In + Check** — separate explicit commit before evaluation. Rejected as ceremony; learners who skip Lock-In get stuck; demos slow down.
  - **B: Side panel for exploration** — physical separation between scratch space and answer area. Rejected: doesn't fit 390px mobile; sandbox semantics differ wildly per kind (what does "explore" mean for fill-fraction or multiple-choice?).
  - **C: Long-press to inspect** — long-press a grid cell to see info popover without selecting it. Rejected for MVP only — discoverability is weak on mobile and there's no clean desktop equivalent. Genuinely promising Phase 2/3 once grids get richer in Lesson 3+.
  - **E alone (status quo)** — keep current model with no new copy. Rejected because the build-as-exploration affordance is currently invisible to first-time learners; small copy investment unlocks the clarity at near-zero cost.
- **Gaps / risks:**
  - Anxious or low-confidence learners may still hesitate to tap freely; the copy helps but doesn't remove the underlying anxiety
  - Long-press inspect (option C) remains a real Phase 2/3 candidate — when Lesson 3+ ships with richer grids, the case strengthens
  - No "what if?" sandbox — learners can't try a hypothesis without committing to it as their answer
  - Per-kind copy adds a small authoring/translation surface — if we ever localize, every kind needs translated affordance copy
  - Dismissible hint stored in `localStorage` means a learner who logs in on a second device sees the hint again — acceptable, but worth noting

### D69 — `feedbackByCell` extension to `GridEventVariant`

- **Status:** resolved
- **Chose:** Add an optional `feedbackByCell?: Record<string, string>` map to `GridEventVariant` (keyed by `"row,col"`, 1-indexed). When a learner taps a wrong cell, the renderer prefers the per-cell hint over the variant's `feedbackDefault`. This is a targeted extension of D8's authoring pattern for the grid kind only — the other four interaction kinds keep `feedbackByWrong*` as their lookup.
- **Considered:**
  - **No per-cell hints** — fall back to `feedbackDefault` on every wrong grid cell. Rejected because the grid is the brief's "rich interaction" and the most expressive place to teach (e.g. for "sum to 7", the cell `(2,4)` deserves "Close — that's sum 6" while `(1,1)` deserves "That's sum 2 — way too low"). One-size-fits-all defaults waste the surface.
  - **Generalize to a per-kind hint table on `BaseVariant`** — would unify the four `feedbackByWrong*` patterns into one. Rejected as YAGNI for MVP: each kind's "wrong answer" has a different shape (set vs scalar vs cell coord), and the per-kind specialization is what gives type-safe lookup. Revisit if a sixth interaction kind is added.
  - **Author per-cell hints as a sparse comment in code** — no schema change, hint text lives near the cell coords in a comment. Rejected: not addressable by `scripts/audit-feedback.ts`; not testable; defeats the typed-content advantage.
- **Gaps / risks:**
  - Authoring per-cell hints for all 36 cells of a 6×6 grid is impractical; in practice authors will hand-write hints for ~5–10 high-value "close miss" cells and let the rest fall through to `feedbackDefault`. `audit-feedback.ts` should treat sparse per-cell hints as acceptable.
  - String keys (`"row,col"`) are stringly-typed; a typo (`"1,7"` on a 6-col grid) silently never fires. A runtime invariant could catch out-of-bounds keys at load time (cheap follow-up).
  - Extension is grid-only; if we add another grid-like kind in Phase 2 (e.g. tree-event), we'll need to decide whether to copy the pattern or generalize it.

### D70 — Empty-Home first-session welcome card

- **Status:** resolved (2026-06-23, addresses I008)
- **Chose:** When a brand-new user (no `lessonProgress` docs **and** `profile.stepsCompleted === 0`) lands on Home, the hero card renders as `"Welcome, {displayUsername}. Let's begin."` with a Start CTA pointing at Lesson 1. As soon as the learner advances any slot, the condition flips false and the hero reverts to the standard Start/Resume/All-caught-up logic from `spec-course-path`. No client-side state, no localStorage flag — the welcome moment is derived from server data, which keeps it consistent across devices and reload.
- **Considered:**
  - **(a) Default to the standard `"Start Lesson 1: What is probability?"` hero with no personalization** — simplest, but skips the one moment in the product where a name acknowledgement reads warm rather than filler. Borderline acceptable; we chose welcome for the small humanization win.
  - **(c) Skip Home on first session and route registration straight to `/lesson/what-is-probability`** — denies the learner a first sighting of the course shape (6 cards, locked future lessons) before being thrown into a problem. Rejected: the course-path view is part of the product's "what am I doing" answer and should be the first thing they see.
- **Gaps / risks:**
  - "Brand new" is derived from `stepsCompleted === 0` + empty `lessonProgress`. If a learner abandons mid-first-slot before any correct check, they'll still see the welcome on next visit. Acceptable (it just means they didn't get past hello).
  - Copy is one sentence with a period (no exclamation, no tagline) per `docs/ui-directive.md`.
  - This is the only personalized greeting in the product; no further "Hey {username}" sprinkled elsewhere.

### D73 — Two simulation interaction kinds for Lessons 2-4 (`simulate-proportion`, `monty-hall`)

- **Status:** resolved (2026-06-23, addresses I028)
- **Chose:** Extend the `InteractionKind` union from five to seven, adding `simulate-proportion` and `monty-hall`, to carry the three simulation payoffs in Lessons 2-4 (law-of-large-numbers convergence, birthday paradox, Monty Hall). `simulate-proportion` is scenario-driven (`coin` / `die-six` / `birthday`) and plots a running proportion converging to a theoretical reference line; `monty-hall` is one slot with hand-played rounds plus an autopilot batch racing switch vs stay toward 2/3 and 1/3. Both **grade on engagement**: the renderer emits a non-null answer only once `minTrials` / `minGames` is reached, so Check stays disabled until the learner has run the simulation. They share `ProportionChart` (inline SVG, no chart library) and `src/lib/simulations.ts` (pure, unit-tested generators). Two illustrations (`Door`, `Calendar`) and two `IllustrationRef.kind` values (`'doors'`, `'calendar'`) were added.
- **Considered:**
  - **Stay at five kinds; render simulations as multiple-choice or static SVG.** Rejected: the PRD's premise is "every claim is verifiable by simulation," and Monty Hall is explicitly the payoff lesson. Telling the punchline instead of letting the learner watch it converge defeats the product's reason to exist.
  - **One generic `simulate` kind with a loose config blob.** Rejected: a single mega-variant type would be weakly typed and the renderer a tangle of conditionals. `simulate-proportion` stays cohesive (one converging series) while `monty-hall` is genuinely different (two strategies plus an interactive door reveal), so two kinds keep each renderer and variant type honest.
  - **Three kinds (split the birthday paradox out).** Rejected: birthday is a binary trial converging to a fixed probability, exactly what `simulate-proportion` already does; only the per-trial visual differs, which the `scenario` field handles.
  - **Model the simulation as an enhanced concept slot with a "must interact" gate.** Rejected: would need new plumbing in `ConceptSlotView` + `LessonFooter`. Making it a problem slot reuses the entire player/footer/XP/progress/resume machinery untouched.
- **Gaps / risks:**
  - The `feedbackByWrongValue.incomplete` hint is near-unreachable in normal play (Check is disabled below the threshold), kept only as a safety net. Parallels B045 (tap-outcomes `duplicate`): a dead-but-harmless content key.
  - Mid-simulation trial counts live in component state, not Firestore. Closing mid-sim resets the counter on resume (the slot was never marked correct, so `slotIndex` did not advance). Consistent with the spec's key-based slot reset; acceptable for MVP.
  - First-load JS is now 287 KB gz, close to the 300 KB ceiling (D64). The next heavy addition should be route-split or the budget breaks.
  - `spec-interactions.md` and `spec-content-model.md` now document seven kinds; if an eighth grid-like kind arrives, revisit whether to keep per-kind specialization or generalize (same tension flagged in D69).
- **See also:** D8 (per-wrong feedback authoring), D55 (no bail-out — preserved by the engagement gate), D64 (bundle budget), D74 (copy authorship for these lessons)

### D75 — Enriched concept slot (title + body + worked example) instead of a one-liner

- **Status:** resolved (2026-06-23, Lesson 1 pedagogy pass)
- **Chose:** Extend `ConceptSlot` with three optional fields — `title` (short heading), `body` (paragraph array), and `example` (`{ title?, steps[] }`) — and rewrite Lesson 1 as a three-act arc (one random thing → events → two dice) that uses richer concept beats to scaffold vocabulary and carry short proof walkthroughs. The legacy thin shape (only `prompt` + `illustration`) still renders the previous centered one-liner, so Lessons 2-4 stay visually intact until each is converted on its own pass. Worked-example steps support a minimal `{a/b}` template that renders via a tiny CSS-only `<Fraction>` component for the stacked textbook look. Lesson 1 is now ~14 slots and ~7 minutes; the 4-minute target is no longer the cap (owner-approved).
- **Considered:**
  - **(a) Keep concept slots thin and add more of them with tighter copy and segues.** Lowest effort. Rejected: the cohesion problem was structural, not just sequencing — there is no room for definitions, intuition, or proof beats in a single sentence. More one-liners would still read as "fact, task, fact, task."
  - **(c) A dedicated new slot kind (e.g. `teach`) with definition / example / proof as first-class fields.** Most expressive. Rejected for now: would force every existing lesson to dispatch a new renderer and double the surface in `LessonPlayer`, `assertLessonInvariants`, and tests. The enriched concept slot reaches 95% of the same expressiveness as a strict subset (all fields optional) with zero migration cost. Promote to a dedicated kind if a future lesson needs structural fields the body/example pair cannot carry.
  - **A markdown body string instead of a paragraph array.** Rejected: markdown invites stray styling drift (bold, italics, links) that fights the UI directive and the lesson voice. A typed paragraph array keeps content as plain prose and is trivially testable. The one inline affordance — `{a/b}` for fractions — is small enough to live as a tiny regex parser in the renderer.
  - **Pull in KaTeX or MathJax for proper math typesetting.** Rejected as overkill for MVP: the only typeset math Lesson 1 needs is a few stacked fractions and one multiplication step. A ~20-line `<Fraction>` component covers it without adding ~280 KB to the bundle (D64).
- **Gaps / risks:**
  - The enriched shape is opt-in, so we now have two visual patterns for concept slots living in the same lesson player. Until L2-4 are converted, the course mixes "centered one-liner" with "left-aligned teach." Acceptable transitional state; the renderer branch is one `if (hasTeach)` and self-explanatory.
  - Authors can now make concept slots arbitrarily long. The directive ("nothing extra") still applies, but invariants only check non-empty strings, not length. Soft cap is editorial discipline; if it becomes a real problem we can add a `body[].length <= 320` invariant later.
  - The `{a/b}` template is the only inline affordance. If a future lesson needs anything else (subscripts, sigma, exponents) we will either extend the template or escalate to KaTeX. Flagged early so we do not creep features into the parser.
  - Lesson 1 estimated time bumped from 4 to ~7 minutes. The owner accepted longer lessons in this pass; the home-screen `estimatedMinutes` field stays informational only and does not gate anything.
- **See also:** D8 (per-wrong feedback authoring; concept slots have no per-key feedback), D43 (Lessons 2-6 visible-but-locked at MVP — pattern still holds; this pass only enriches L1), D55 (no bail-out — concept slots remain non-gating "Got it" advances), D64 (bundle budget — `<Fraction>` adds ~0.2 KB; no library added), D74 (agent-authored copy exception)

### D76 — Insert a combinatorics lesson as L3; drop the CLT stub to keep the course at 6

- **Status:** resolved (2026-06-23, addresses the L3 "uses combinatorics but never teaches it" gap surfaced during the L1 pedagogy redesign)
- **Chose:** Insert a new **L3 "Counting carefully"** between L2 (LLN) and the current birthday lesson, teaching four counting tools: multiplication principle (deeper than L1's single application), addition principle (short, one beat), permutations and combinations (with the proof beat that nCk = ordered/k!), and complement counting (the trick that drives the birthday paradox). Renumber the existing L3 → L4 (counting-gets-hard / birthday), L4 → L5 (conditional-probability / Monty Hall), L5 → L6 (distributions, still coming-soon). **Drop the L6 CLT stub** so the course stays at 6 lessons. A new `'tree'` glyph is added to `LessonGlyph` for the L3 course-path node (the multiplication principle's canonical visualization).
- **Considered:**
  - **(b) Insert and grow the course to 7 lessons; keep both Distributions and CLT stubs.** Rejected: CLT was always speculative for MVP, sits two tiers of abstraction beyond Distributions, and rebuilding the course path for 7 nodes is structural work for a stub no learner will reach. Cleaner to ship 6 real-or-near-real lessons than 7 with a far-future placeholder.
  - **(c) Don't add a new lesson; fold the combinatorics teach beats into the front of the current L3.** Rejected: combinatorics is genuinely its own topic with its own arc (four named tools, a discrimination beat, a proof). Cramming it into the birthday lesson pushes that lesson to ~12+ minutes and dilutes both topics. Two focused lessons beat one long muddle.
  - **Skip combinatorics entirely; rely on the per-variant `explanation` fields to teach `(n × (n-1))/2` as it arises.** Status quo. Rejected because that is exactly what the L1 pedagogy redesign called out as the failure mode in the existing L3: the formulas appear as after-the-fact explanations, the learner has no name for them, and the birthday-paradox proof reads as a black box.
  - **Place the combinatorics lesson between L4 and L5 (right before Monty).** Rejected: Monty Hall is about conditioning, not counting. The dependent lesson is the birthday paradox; that is where combinatorics needs to sit.
- **Gaps / risks:**
  - The L4 (birthday) `explanation` strings were authored when the lesson was L3 and assumed no prior combinatorics teaching. They are still correct, but the pedagogy is now redundant in places (e.g., "23 people form 253 pairs" is now backed by 23C2 being a named tool). Tightening that copy is a follow-up review pass on L4, not a blocker.
  - Distributions stays as the sole coming-soon stub (L6); I015 narrows accordingly. CLT can be reintroduced later with no doc churn since D76 records the trade-off.
  - The new lesson reuses existing interaction kinds (`multiple-choice`, `fill-fraction`) plus the L1-enriched concept slots; no new interaction surface, no new content-model fields.
  - Renumbering touched `lesson.number` fields, file names, exported symbol names (`lesson3` / `lesson4` / `lesson5`), test files, the course catalog test, `content/index.ts`, the Remote Config default list, the L2 wrap segue, and the `lessonVisuals` map. Mechanical but spread across many files; future renumbering should be avoided once user lessons are persisted to Firestore by id (ids did not change here, so resume + replay are unaffected).
- **See also:** D43 (Lessons 2-6 visible-but-locked at MVP), D73 (the simulation interactions L4 still uses), D75 (enriched concept slot — the new L3 is its second user), I015 (coming-soon stubs).

### D77 — Named-theorem callout and bookmarked-derivation page as separate concept-slot affordances

- **Status:** resolved (2026-06-23, theorem + derivation pass across L1/L3/L4/L5)
- **Chose:** Add two optional fields to `ConceptSlot` (D75) and render them as two visually distinct elements:
  - **`theorem: { name?, statement }`** — a bordered, primary-tinted callout with a violet left rule and a small uppercase eyebrow ("THEOREM · _name_"). Used wherever a named rule appears: L1's equally-likely formula, L3's five counting principles, L5's conditional-probability rule. The statement is the formal version; intuition stays in `body` paragraphs and applied numbers stay in `example`.
  - **`derivation: { title, steps[] }`** — a "bookmarked notebook page": a card with a small amber tab labeled "Derivation" peeking off the top-left, the proof title in display face, and step-numbered mono lines. Used for actual proof beats: L1's "Why {3/6} = {1/2}", L1's "Why 6 × 6 = 36", L3's "Why we divide by k!", L4's birthday-paradox product. `example` (the muted gray block) is reserved for short numerical worked examples; `derivation` is reserved for proofs and chained algebra. Both reuse the existing `{a/b}` `<Fraction>` template so an authored statement can render P(A | B) = {P(A and B) / P(B)} natively.
- **Considered:**
  - **(a) Reuse the existing `example` field for theorems and derivations by adding a `flavor` enum.** Rejected: the three artifacts read very differently in a textbook (callout vs. worked example vs. derivation), and overloading one field invites authors to mash them together. Two named fields with separate renderers force the author to pick the right tool, and the renderer can give each its own visual weight.
  - **(b) A dedicated `theorem` slot kind that owns the whole slide.** Rejected: a theorem slide that says nothing else is a tap to advance with no payoff. Pedagogically the theorem belongs next to the intuition that surrounds it. The callout-inside-concept-slot pattern matches how a math textbook lesson reads: lede → boxed theorem → justifying paragraphs → example → exercises (owner-requested order, 2026-06-23: theorem above explanations so the formal statement is the first structured artifact after the lede).
  - **(c) Pull KaTeX in for theorem statements so we can write `\frac{n!}{k!(n-k)!}` natively.** Rejected for the same reasons as D75: the only inline math we need is stacked fractions and a few subscripts/exponents; the existing `{a/b}` template plus plain Unicode (× ÷ − ≈ ≤ ≥) covers it; KaTeX adds ~280 KB. If a future lesson genuinely needs typeset summation or integrals, escalate then.
  - **(d) A more elaborate "page" treatment for derivations: faux-handwritten font, simulated rule lines, dog-eared corner.** Rejected as cute-overload: a small amber tab + display-face title + mono steps already reads as "page from a notebook" without fighting the design system. Visual flourish for its own sake is exactly what UI-Directive D31 cautions against. Tab-only stays accessible (one extra `aside` with `aria-label`) and prints cleanly on any background.
- **Gaps / risks:**
  - Authors now have three structured artifacts (theorem, example, derivation) on a single slot. The matrix is simple — _is it a named rule?_ → theorem; _is it a quick numeric demonstration?_ → example; _is it a proof?_ → derivation — but a future content review should check each enriched slot against that matrix.
  - The amber tab on the derivation card uses `--amber-soft` / `--amber-deep`, which shows up nowhere else in the lesson player today. Acceptable as a single visual signal for "this is a proof page"; if the streak/progress UI ever lands on amber too we will revisit (cross-reference at the design-token level, not here).
  - Adding a derivation slot to L4 (birthday paradox) bumps that lesson from 8 to 9 slots / ~6.5 min. Still inside the post-D75 longer-lessons budget.
  - The L5 conditional-probability theorem hardcodes the formula in the statement string. If we ever extend conditional probability (Bayes' rule, total probability) we will likely add their own theorem callouts on new slides — the field supports it natively.
- **See also:** D75 (enriched concept slot — D77 extends it without changing its contract), D76 (the new L3 — D77 lands the textbook-style theorem statements its principles needed), D31 (design system tone — the callout/page pattern is restrained on purpose), D64 (bundle budget — D77 adds zero new dependencies), D78 (flashcard upgrade for derivations).

### D78 — Flashcard mode for derivations (question front, derivation back)

- **Status:** resolved (2026-06-23, owner-requested for L1 `two-dice-intro`)
- **Chose:** Add a single optional field, `derivation.question?: string`, to the existing D77 derivation type. When present, `DerivationCard` (new component at `src/features/lesson/DerivationCard.tsx`) renders the page as a 3D-flippable flashcard: front face shows the question with a violet "QUESTION" tab and a small "Tap to reveal" hint; back face is the existing amber-tabbed derivation page. The flip uses the same CSS-3D pattern as `Coin3D` (rotateY spring + two `backface-hidden` faces). When `question` is absent, the card renders as before — fully visible, no flip — so all existing derivations (L1 reduce was deleted in the same pass; L3 combinations; L4 birthday) keep their static behavior with zero content changes.
- **Considered:**
  - **(a) Always-flashcard: every derivation auto-generates a question from its title and starts hidden.** Rejected: a derivation that is already short or self-explanatory (the L3 combinations one runs 5 steps including a sanity check) reads better as visible reference material. Forcing the click adds an interaction tax with no payoff.
  - **(b) A separate slot kind for flashcards (e.g. `flashcard-derivation`).** Rejected for the same reason D75 didn't fork concept slots: a new field on an existing type beats a new type when 95% of the rendering machinery is shared.
  - **(c) Reveal one step at a time on tap (drill-down style).** Rejected as harder to implement (per-step animation timing, state machine for partial reveals) for unclear pedagogical gain. The two-state flip already gives "think first, then see the answer" — which is the question the owner posed.
  - **(d) Move the flashcard logic into a single shared `Flashcard` primitive that accepts arbitrary front/back JSX.** Tempting but rejected for now — only one consumer exists (derivations). If a second use case appears (e.g. quiz-style theorem cards in L3), promote then; the flip and grid-stacking machinery is ~25 lines and straightforward to refactor.
- **Gaps / risks:**
  - The derivation card's height is now driven by whichever face is taller (the back / derivation in every realistic case). Both faces share a CSS grid cell so the layout never reflows on flip — but if a future derivation has only 1-2 steps and a long question, the question face might overflow its bounding box. Soft-check: keep questions ≤ 28 ch; the existing `max-w-[28ch]` on the question prevents runaway widths.
  - Flipping is reversible. Owner asked only for "click → reveal", not "click again → hide". Reversible felt right (lets the learner compare the two sides) and matches the Coin3D precedent. Easy to make one-way later if it tests poorly.
  - The `renderInline` helper that lived inside `ConceptSlotView` was extracted to `renderInlineMath` in `src/components/Fraction.tsx` so both the static card body and the new `DerivationCard` share the parser. No behavior change to the regex (still `/\{([^/{}]+)\/([^/{}]+)\}/g`); the helper is just newly importable.
- **See also:** D77 (derivation field — D78 extends it with the optional question), Coin3D entry in `design-iterations.md` (same CSS-3D flip pattern), D75 (enriched concept slot lineage).

### D84 — Progress section shipped as a locked stub (future AI insights)

- **Status:** open (placeholder shipped; the feature itself is deferred)
- **Chose:** Add a **"Progress" entry to the primary nav now**, rendered with a lock badge + "Soon" tag, routing to a read-only `/progress` placeholder (`features/progress/ProgressPage.tsx`) that previews what's coming (strengths & gaps, smart review, AI-assisted insights). No data fetching, no writes. The eventual feature will read real attempt/streak data — and likely use AI — to summarize how a learner is actually doing.
- **Considered:**
  - **Hide it entirely until built.** Rejected: surfacing a locked entry sets the expectation and reserves the IA slot, and is cheap. (Same playbook as D6's visible-but-locked lesson stubs and D43.)
  - **A toast / disabled item that doesn't navigate.** Rejected: a real placeholder page can explain _what's coming_ and reads as intentional rather than broken.
  - **Build a basic non-AI progress dashboard now** (charts off existing XP/streak/lesson data). Deferred, not rejected — viable as an interim step, but the owner's intent is an AI-assisted read of real performance (D23 governs the AI timing), so we stubbed rather than half-built.
- **Gaps / risks:**
  - A locked nav item can frustrate if it lingers — it should ship real or be removed before launch, not sit locked forever.
  - The AI angle inherits D23 (no AI in MVP): this stays a stub until the AI scope decision is revisited.
  - When built, progress analytics must avoid becoming a comparison/anxiety surface — keep it informational (self-determination), consistent with the leaderboard framing in `spec-social.md`.
- **See also:** D23 (no AI in MVP — gates the real feature), D6 / D43 (visible-but-locked stub precedent), D71 (the `Sidebar` nav this entry lives in).

### D85 — Practice section (Alcumus-style, LLM-generated) shipped as a locked stub

- **Status:** open (placeholder shipped; full feature targeted for the Friday update)
- **Chose:** Add a **"Practice" entry to the primary nav now**, lock-badged → a read-only `/practice` placeholder (`features/practice/PracticePage.tsx`) that previews the planned feature: an [AoPS **Alcumus**](https://artofproblemsolving.com/alcumus)-style adaptive problem set where an **LLM generates effectively unlimited problems + worked solutions**, each **vetted for correctness before it reaches the learner**, with difficulty that adapts as they solve. Same locked-stub pattern as D84 (Progress).
- **Considered:**
  - **A fixed, hand-authored problem bank (no LLM).** Rejected as the _destination_ — the whole point of the owner's idea is _unlimited_ fresh practice, which a static bank can't give. (A small curated bank may still seed/anchor generation — open design question.)
  - **Generate problems live with no correctness gate.** Rejected hard: an LLM that ships a wrong answer key actively miseducates. Correctness vetting (e.g. programmatic/symbolic check, solver cross-validation, or a verifier model) is a _gating requirement_, not a nice-to-have — this is the central risk of the feature.
  - **Hide the tab until Friday.** Rejected: surfacing the locked entry now sets expectations and reserves the IA slot (consistent with D6 / D43 / D84). The "Arriving Friday" badge communicates the timeline.
- **Gaps / risks:**
  - **Correctness is the hard part.** Generation is easy; _guaranteeing_ the problem is well-posed and the solution is right is the engineering challenge. Needs a concrete vetting pipeline before launch — unvetted output must never reach a learner.
  - Inherits **D23** (no AI in MVP): this is the first deliberately AI-dependent learning feature, so it also forces the AI-scope/cost/safety conversation D23 deferred (model choice, latency, cost per problem, prompt-injection/jailbreak surface, age-appropriate content).
  - Generation latency/cost vs. the "instant next problem" feel — likely needs pre-generation/caching of a vetted problem queue rather than per-tap synchronous calls.
  - Friday is an aggressive target for a feature whose correctness bar is this high; the locked stub de-risks the _nav/IA_ commitment even if the engine slips.
- **Design:** full architecture in [`spec-practice.md`](specs/spec-practice.md). Headline: the answer always comes from **code, not an LLM** (the domain is computable). Track 1 = parameterized generators correct _by construction_ (the Friday MVP); Track 2 = offline LLM-generated bank gated by _independent code verification_ (Monte-Carlo + exact solver agreement), with LLM-verifies-LLM only as a pre-filter. Lean rejected for the numeric core.
- **See also:** D84 (Progress — same locked-stub precedent), D23 (no AI in MVP — this is the feature that reopens it), D29 / D30 / D33 (existing slot/variant + deterministic-seed model the generated problems would plug into), D6 / D43 (visible-but-locked stubs), [`spec-practice.md`](specs/spec-practice.md).

### D86 — Full probability curriculum scaffolded as locked stubs (9 units, ~51 lessons)

- **Status:** open (skeleton shipped; content authored incrementally)
- **Chose:** Lay out the entire forward-looking curriculum from [`curriculum-roadmap.md`](curriculum-roadmap.md) — 9 units, ~51 lessons — as **blank, locked lesson stubs** that render on the course path _below_ the live content. Mechanics:
  - Stubs live in one file (`src/content/lessons/roadmapStubs.ts`) as `Lesson`s with a real `title`/`blurb` but `slots: []` and `comingSoon: true`. They are appended after the six authored lessons in `src/content/index.ts`, numbered 7…57 so "Lesson N" stays monotonic down the path.
  - Grouping into the 9 named units is done in `src/features/course/chapters.ts` (the existing chapter/"world" mechanism), keeping the three live chapters untouched and adding nine more.
  - **No shipped lesson content was edited** — only the catalog array, the chapter map, one test, and two small course-path guards (below).
- **Considered:**
  - **Integrate the stubs _among_ the live lessons at their natural unit positions** (e.g. put the dense "What is probability?" inside the new "Sample Spaces" unit next to a "The sample space" stub). Rejected for now: it would reorder the catalog array, and `nextRecommendedLesson` picks the first non-coming-soon lesson _by array order_ — so a new learner could be sent to a different starting lesson. Keeping the live five first preserves "Start here" exactly. The roadmap's split/migration of dense lessons is deferred (see roadmap §7).
  - **One file per stub** (the existing `NN-name.ts` convention). Rejected: ~51 near-identical 6-line files is noise; a single `roadmapStubs.ts` with a `stub()` helper is easier to scan and maintain, and clearly separates "authored content" from "skeleton."
  - **Only render unit headers, not individual lesson stubs.** Rejected: the owner explicitly wanted the full ~40-lesson skeleton visible as a roadmap preview.
  - **Gate stubs purely via Remote Config** (`available_lesson_ids`). Belt-and-suspenders instead: stubs are `comingSoon: true` _and_ contentless, and `useLessons` already force-locks any empty-slots lesson regardless of the flag. A stub can't be accidentally turned on until it actually has content.
- **Gaps / risks:**
  - **Trophy placement.** `CoursePath` previously marked the _last_ chapter's checkpoint as the course-complete trophy. Appending nine all-locked chapters would have (a) demoted the live final chapter's reward from the 250-coin trophy to a 100-coin chest and (b) parked the trophy behind unreachable content. Fixed by computing the trophy chapter as the **last chapter that still has a playable lesson** (`CoursePath.tsx`), which reproduces today's behavior exactly and migrates the trophy forward as units go live. Trade-off: the "Course complete" trophy now sits mid-path with locked previews below it — acceptable, and self-corrects as content ships.
  - **Empty-unit chrome.** A unit with no playable lessons would have shown a meaningless "0/0" in its `ChapterBanner`. Fixed to render a "Soon" lock chip when a chapter has zero available lessons. Per-chapter `Checkpoint`s for all-stub units already render their correct locked ("Clear … to unlock") state — no change needed there.
  - **Long path.** Twelve chapters / ~57 nodes is a lot to scroll. Acceptable for a roadmap preview; if it becomes heavy, a future collapse-locked-units affordance is the natural follow-up.
  - **Numbering churn on split.** When a dense live lesson is eventually split into its unit's stubs, lesson `number`s shift. `number` is display-only (no logic depends on it), so this is cosmetic, but the catalog test pins monotonic numbering to catch accidental gaps.
  - Many stub ids now exist; they must stay globally unique. Guarded by a new catalog test (unique ids) and a new `chapters.test.ts` (every chapter id resolves, no double-assignment, no orphans).
- **See also:** D6 / D43 / D84 / D85 (visible-but-locked stub precedent), D76 (course renumbering), D77 / D78 (the theorem/derivation/flashcard content shapes these stubs will use), [`curriculum-roadmap.md`](curriculum-roadmap.md).

### D88 — Collapse to the 9-unit plan; ship the `how-likely` course opener, lock the rest

- **Status:** resolved (on the `two-dice-demo` branch; `main` unchanged)
- **Amends:** D86. D86 appended the roadmap stubs _below_ the live six-lesson spine, so the same material showed twice (a dense lesson and a granular locked stub). D88 makes the course path read as one coherent 9-unit plan led by a single polished opener, under a tonight deadline.
- **Chose:**
  - The live catalog (`src/content/index.ts`) is the `how-likely` opener followed by the 9-unit roadmap as locked stubs. `how-likely` is the one authored, playable lesson; every other unit lesson (including the `two-dice` stub, reserved for the future Unit 3 compound lesson) stays blank and locked. Numbers are assigned by array position (1…N) so display order is always monotonic regardless of stub ordering.
  - `how-likely` (`src/content/lessons/how-likely.ts`) is a **gentle-ramp course opener** carved/extended from Lesson 1's two-dice act. Arc: **welcome + a pull-quote** (Oscar Wilde, via a new optional `ConceptSlot.quote` field + `ConceptSlotView` treatment) → **the famous hard questions** (lottery, soulmate, shared birthday) → **tap one die's faces** (`tap-outcomes`) → a **tap-to-count even-number question** (`fill-fraction`, inputs annotated favorable/total) → **define probability** rigorously → **apply it** to P(rolling a 3) → **Captain Pascal's commit-once challenge** (fair game? he wins on 7, you win on 2) → the signature 6×6 grid → derive the 36-roll count by cases → wrap. Opens big-and-human, then lands on the humble die (owner call); the one-die-vs-two-dice contrast is the lesson (one die: counting trivial, all equal; two dice: rolls equal, totals not). The tap-to-count question is placed before the definition (you can tap to discover favorable/total; the definition then names it). It sits in a lead **"Start Here"** chapter ahead of Unit 1. This **revives the `tap-outcomes` interaction** (unused since Lesson 1 went multiple-choice) and adds three small, reusable extensions: **`ProblemSlot.commitOnce`** (a no-retry prediction/challenge that unlocks Continue right or wrong, a deliberate exception to the no-bail-out gate D55, via a new `allowContinueOnWrong` footer prop), **`ProblemSlot.challenge`** (a Captain Pascal "Challenge question" banner), and **`FillFractionVariant.numeratorLabel`/`denominatorLabel`** (annotated fraction inputs).
  - **Rigorous definition of probability, up front (owner request).** A `definition` beat after the one-die tap states it precisely as a named `theorem` ("Probability", `{k/N}`) with a plain gloss: favorable / total when outcomes are equally likely, a number from 0 (never / rare) to 1 (always / common). **Terminology:** the defined quantity is **probability**, not "likelihood" — in statistics "likelihood" is a distinct technical term (the likelihood function), so naming the concept "likelihood" is imprecise; "likely" stays as casual English. (Resolved by **D89**: the "Likelihood" chapter was merged into Sample Spaces and renamed "Defining Probability".)
  - **Introduction order (owner review):** the 36 count is derived _after_ the grid, by **enumeration / cases** ("first die 1 → 6 rolls, first die 2 → 6 rolls, …, six cases of 6 = 36"), not via a named multiplication-principle theorem and not using the term "sample space" — both are deferred to their own later lessons. An earlier draft put a "6 × 6 = 36" multiplication page _before_ the grid; removed. The rule: show the idea concretely, name the tool in its own lesson. The one principled exception is the course's core object, **probability** itself, which is fair to define in the opener (vs deferring tools/techniques).
  - The old three-chapter spine (`foundations` / `counting` / `deeper`) was removed from `chapters.ts`; chapters are now "Start Here" (1) + the nine units (2–10).
  - Lock the rest by narrowing the bundled Remote Config default to `['how-likely']`, plus a **defaults-as-floor** change in `RemoteFlagsProvider` (below).
  - **Non-destructive:** the five dense lessons (`lesson1`–`lesson5`) and the `distributions` stub are kept imported and re-exported from `content/index.ts` as the content reservoir for the later Unit 2-4 / 5 / 7 splits; their files and per-file tests are untouched. `main` still holds the prior arrangement.
- **Considered:**
  - **Ship Lesson 1 as the demo unchanged** (lowest risk, already complete). Rejected: it is the dense lesson the plan explicitly wants to split, and the owner wanted the opener to model the new one-idea shape.
  - **Two-dice alone as the opener** (the first cut of this work). Superseded in-session: the owner noted two dice is "kinda hard," so a one-die tap-and-count ramp was added in front of it. The lesson grew from a Unit 3 mid-path node into the course's front-door hook.
  - **Keep the opener inside Unit 3 / reorder units so Compound is Unit 1.** Rejected: it breaks the intuition-first progression. A standalone "Start Here" hook ahead of Unit 1 keeps the cold-open without resequencing the curriculum.
  - **Delete the old lessons to resolve the overlap.** Rejected: destructive; they are the source for the future splits.
- **Gaps / risks:**
  - **Live Remote Config is shared across branches and lists the old five lessons (v3), not `how-likely`.** Once `fetchAndActivate` resolves it overrides the bundled default. The Firebase MCP could not publish a fix (permission). **Mitigation shipped:** `RemoteFlagsProvider` now unions the live list with the bundled defaults, so a lesson this build ships as available can never be hidden by a stale shared template; the opener stays unlocked locally and when deployed without any RC publish. **Trade-off:** a defaulted id can no longer be taken down purely via RC (acceptable here; the default set is just the opener). If `main` ever adopts this floor, its default set would gain the same property.
  - **First playable node is now Lesson 1** (the opener leads the path), which removed the earlier "first playable node is mid-path" wart.
  - **Numbering by position** means the per-file `number` on stubs is advisory; the catalog re-numbers on load. `number` is display-only and stubs carry no persisted progress, so this is safe; the catalog test pins monotonic numbering.
  - **`how-likely` lightly touches likelihood, equally-likely, and compound counting** that later units formalize. That is the intended cold-open trade (hook breadth now, rigor later), not a sequencing violation, because it names none of the tools.
- **See also:** D86 (the skeleton this amends), D77 / D78 (derivation + flashcard shapes), the `tap-outcomes` removal in `design-iterations.md` ("Sample-space slot"), [`curriculum-roadmap.md`](curriculum-roadmap.md) (the split mapping deferred here).

### D89 — Merge "Likelihood" + "Sample Spaces" into "Defining Probability"; drop two lessons covered by `how-likely`

- **Status:** resolved
- **Amends:** D86 (curriculum skeleton) and D88 (the 9-unit collapse + the `how-likely` opener). Resolves D88's open suggestion to rename the "Likelihood" chapter on terminology grounds.
- **Chose:** Collapse the original Unit 1 ("Likelihood") and Unit 2 ("Sample Spaces") into a single new **"Defining Probability"** unit (chapter id `defining-probability`, subtitle _"From the long-run feeling to the favorable-over-total formula"_). Within that merged unit, drop two lessons:
  - `likelihood-compare` ("Which is more likely?") — `how-likely` already builds comparative-likelihood intuition by tapping a die's faces and asking which roll is more likely than another.
  - `probability-scale` ("The probability scale") — `how-likely`'s rigorous definition of probability already states the 0..1 scale ("a number from 0 (never / rare) to 1 (always / common)"); a separate slider lesson would re-teach that.

  The merged unit keeps `long-run-frequency` (intuition lead-in), `sample-space`, `equally-likely-outcomes`, `practice-single-events`, and `review-sample-spaces` (the unit's single Level Review; the old `review-likelihood` was dropped to avoid two reviews back-to-back).

- **Wiring fixes that fell out of the merge:**
  - `how-likely`'s wrap `segueToLessonId: 'likelihood-compare'` → `'long-run-frequency'`.
  - `chapters.test.ts` updated to assert the new `groups[1].chapter.id === 'defining-probability'` and that `long-run-frequency` is its first lesson.
  - The catalog count fell to 1 + 48 = 49 lessons (was 1 + 51 = 52). Numbering still assigned by position in `content/index.ts`, so display order stays monotonic.
- **Considered:**
  - **Drop only the two lessons; keep two thin units.** Rejected: a 2-lesson "Likelihood" unit (`long-run-frequency` + `review-likelihood`) reads as filler next to the much richer Sample Spaces unit, especially with `how-likely` already covering comparative likelihood and the 0..1 scale.
  - **Rename "Likelihood" to "Defining Probability" and keep both units.** Rejected for the same reason: still two thin units doing one job; the merge is the substance and the rename was D88's open suggestion.
  - **Keep the chapter id `sample-spaces` (just rename title).** Rejected: the unit's character changes (it now opens with the long-run lesson and is the home of the _definition_, not just the listing technique). A fresh id (`defining-probability`) makes the merge explicit in the codebase and keeps the `sample-space` lesson id distinct from the chapter id.
  - **Drop `long-run-frequency` too.** Rejected: the long-run idea is the _other_ definition of probability (frequentist), and it's the bridge to L2's Law of Large Numbers material later. `how-likely` doesn't teach it — it only counts equally-likely outcomes. The unit needs both definitions.
- **Gaps / risks:**
  - **Subtle pedagogy:** "Defining Probability" now contains a frequentist intuition (`long-run-frequency`) followed by a classical definition (`equally-likely-outcomes`), without explicitly naming the two interpretations. That's intentional for the cold-open arc, but the eventual prose for `equally-likely-outcomes` should briefly acknowledge "this is one of two ways to define probability, and we'll see they agree" so the unit doesn't read as inconsistent.
  - **Single review covers a slightly larger surface.** `review-sample-spaces` now has to mix in the long-run-frequency idea. Acceptable, and the renamed copy ("Defining probability review") signals it.
  - **Lesson ids carry old framing.** `sample-space`, `review-sample-spaces`, etc. are still in the merged "Defining Probability" unit. Renaming lesson ids would invalidate any future progress data and cascade through Remote Config; not worth it. Chapter id and titles take the new framing; lesson ids stay stable.
- **See also:** D88 (the 9-unit plan this amends), [`curriculum-roadmap.md`](curriculum-roadmap.md) (now reflects 8 units), `roadmapStubs.ts` header comment.

### D90 — Scope as classical probability ending on Expected Value; drop the statistics-track Unit 8 ("Famous Distributions") and trim Unit 7 to EV

- **Status:** resolved
- **Amends:** D86 / D88 / D89 (curriculum scope decisions). Final unit count is **7** (under the "Start Here" lead chapter).
- **Trigger:** owner pushback — _"i think random variables and expected value and whatnot are not classic probability, no? more statistics."_ Half-right: in academic math (Pitman, Ross) random variables, EV, variance, CLT, and the named distributions all live in the _probability_ course. But in the **AP / high-school taxonomy** that the persona (D2) actually meets, the line moves: AP Stats covers RVs, EV, binomial, normal, and CLT, and HS "probability" effectively ends at conditional probability + Bayes. Given the persona, the HS line is the right one to draw — with one carve-out.
- **Chose:**
  - **Keep Expected Value** as the closing unit. EV is a genuine probability capstone — every probability textbook ends here, and Brilliant's own probability path ends on EV. Pedagogically it's the natural payoff of "given a probability of X, what payoff do you expect?"
  - **Drop the formal "random variable" abstraction.** An HS course can teach EV without ever invoking "an RV is a function Ω → ℝ." Skipping the abstraction lets the unit lead with payoffs, not formalism, and removes a stand-alone lesson that would have been pure vocabulary.
  - **Drop variance / spread.** Useful, but it's where statistics begins (you start measuring spread once you have samples). Out of scope.
  - **Drop the entire "Famous Distributions" unit:** binomial, normal, CLT, Monte Carlo, capstone problem set. CLT is technically a probability theorem but pedagogically it's the doorway to inferential statistics; binomial and normal pair with sampling/inference more naturally; Monte Carlo is a technique that L2's LLN already foreshadows. All belong in a future Statistics course, not this one.
  - **Reshape Unit 7** from 7 lessons → 5: `expected-value-intuition` → `computing-expected-value` → **`fair-games`** (new — when E(X) = 0 the bet is break-even) → `practice-expected-value` (retitled to "Practice: gambles and insurance") → `review-expected-value` (renamed from `review-random-variables`, since the unit is no longer about RVs). Chapter id renamed `random-variables` → `expected-value`.
  - **Delete the dropped stubs from the path entirely** (per owner — no "Statistics course-2" placeholder yet). The roadmap doc records that they belong to a future track but the path itself stays focused.
- **Considered:**
  - **Drop EV too — end on Conditional Probability.** Rejected: EV is universally treated as the probability capstone in the relevant textbooks (Pitman, Ross) and in Brilliant's own probability path. Conditional probability is the _deepest_ idea, but EV is the _most useful_ — and the "given P(X), what payoff do you expect?" framing is the natural closer for an HS-targeted course.
  - **Keep binomial in probability** (it pairs naturally with combinations). Rejected: binomial _as a named distribution_ belongs with sampling and the normal approximation. The combinations work itself stays — it's already in Unit 4. A future stats course would build on Unit 4 to introduce the binomial.
  - **Add a "Statistics (course 2)" locked-stub chapter at the bottom of the path** as a "next course" preview. Rejected (owner): keeps the IA tight and avoids advertising scope we don't yet plan to author.
  - **Keep `review-random-variables` id and just retitle.** Rejected: the lesson is unauthored, so renaming the id is purely cosmetic with zero cascade (no Remote Config flag, no progress data, no reference from any other file). `review-expected-value` matches the unit it lives in.
- **Gaps / risks:**
  - **Lost the CLT moment.** CLT is one of the most beautiful results in the subject, and the path now stops short of it. Acceptable for an HS first course; if the persona ever broadens (test prep / college intro), reopen this decision and revive Unit 8 as a stats-track addition.
  - **`fair-games` is new ground.** It needs a clean "is this game worth playing?" framing to be the bridge between the formula and the application; the practice lesson then naturally attacks lotteries / insurance / casinos. Easy to author, just hadn't been listed before.
  - **Dropped stub ids are gone, not orphaned.** No file or test references `random-variable`, `distributions-intro`, `variance-spread`, `binomial-distribution`, `normal-distribution`, `central-limit-theorem`, `monte-carlo`, or `capstone-problem-set` after this change. The catalog test (uniqueness, monotonic numbering) and chapter test (no orphans, no fallback "More to Explore") catch any future re-introduction at the wrong layer.
  - **The roadmap doc kept the 8-unit framing under D89; this brings it to 7.** Updated `curriculum-roadmap.md` § 3 with a short "out of scope" callout naming the dropped material, so a future stats track has a starting point.
- **See also:** D88 (the 9-unit plan), D89 (the previous merge), [`curriculum-roadmap.md`](curriculum-roadmap.md) (now reflects 7 units + an "Out of scope" note for the statistics track).

### D91 — Course progress counts the _whole planned course_; locked stubs render with no progress; stale Firestore docs are pruned

- **Status:** resolved
- **Trigger:** owner observed two cosmetic warts on the live path: _"right now path and 1/1 done look a little odd. anything better we can say while still encoding progress?"_ — the home header read "1 / 1 done" once `how-likely` was finished, implying course completion while the path obviously continued; and _"two dice is randomly in the middle, can we lock it and delete the progress on it"_ — the `two-dice` lesson was a locked stub on this branch but rendered with a green completed-check from a stale Firestore progress doc left over from an earlier authoring branch.
- **Chose:** three small, complementary changes:
  - **Course-progress denominator now counts the whole planned course** (live + locked stubs), not just non-coming-soon lessons. The header reads "1 / 42 lessons" instead of "1 / 1 done" — honestly encoding the user's share of the planned curriculum, with the locked nodes on the path itself communicating "more is coming." `courseProgress(lessons, progressMap)` was rewritten: `total = lessons.length`, `completed = lessons that have authored slots and are completed` (so a stale completed-state on a now-blank stub never inflates the count). Reverses the older `total = real.length` rationale (which assumed unavailable lessons were a fluke; they are now an intentional roadmap preview).
  - **Header copy** in `HomePage` shifted from `{n} / {n} done` to `{n} / {n} lessons`. Drops the implication of finality. Profile's `StatsGrid` already labels its row "Course" and shows `1 / 42`, so no copy change there.
  - **`allCompleted` everywhere now requires the _full_ catalog to be done.** Pre-D91 the celebration / "all caught up" hero fired on completing the single authored lesson because `realLessons.every(...)` is trivially satisfied with one lesson. Updated in `HomePage`, `HeroCard`, `CelebrationScreen.courseTotal`, `PublicProfilePage`, and `LessonPlayer.courseTotal` (which feeds the **'course-cleared' achievement** in `lib/achievements.ts` — without this fix the achievement would have been awarded on the very first lesson, since `lessonsCompleted >= courseTotal` trivially holds when `courseTotal === 1`). The CaptainsLog daily tip already covers the "you've done what's available, more coming" case for the home screen.
  - **Stale-progress fixes (the `two-dice` issue):**
    - **Visual guard in `LessonNode`:** when `lesson.comingSoon` is true, the component now treats `progress.state` as `undefined` regardless of what Firestore says. A coming-soon lesson always renders as locked — no green check, no "Completed · tap to review" meta, no in-progress label. Defensive: handles any future re-locked lesson, not just `two-dice`.
    - **Data fix via `pruneStaleProgress`:** new helper in `progressService.ts` that batches deletes for a given list of `lessonProgress` ids. A one-shot `useEffect` in `HomePage` runs it with the ids of lessons that exist in the user's progress map but have empty `slots` in the catalog. Idempotent (`prunedRef` keeps a per-session set so a Firestore snapshot re-emit after the delete doesn't refire), best-effort (errors logged, never thrown). Single-id case takes the `deleteDoc` fast path; multi-id case batches.
- **Considered:**
  - **Hide the count entirely when only one lesson is authored.** Rejected: the user wanted progress encoded, not hidden, and "1 / 42 lessons" is honest scope-setting (the locked nodes on the path back this up).
  - **Keep `total = real.length` and just hide the hero.** Rejected: the underlying mismatch (denominator says one thing, path shows another) would still leak into Profile and Public Profile.
  - **Filter stale entries client-side without an actual delete.** Rejected: the owner's ask was to _delete_ the progress, not just hide it. The filter (visual guard in `LessonNode`) handles the immediate render; the delete makes the cleanup durable.
  - **Run the prune from the auth provider on login** instead of from `HomePage`. Rejected: `HomePage` is where both the lessons hook and the progress subscription already live, so the effect lands naturally; running it from auth would require duplicating both subscriptions.
  - **Mark lessons that have a stale progress doc with a special "archived" flag** (so review is still possible). Rejected: the stub literally has no slots, so review would crash. Wiping the progress is the right move.
- **Gaps / risks:**
  - **`profile.lessonsCompleted`** (a separate Firestore counter on `users/{uid}`) can still be off-by-one if a lesson was completed and then re-locked, since `lessonsCompleted` is a server-side `increment`. Not addressed here — out of scope for the cosmetic fix the owner asked for. The Profile UI uses `Math.min(profile.lessonsCompleted, courseTotal)` which clamps it visually; the Firestore field stays slightly higher than reality until the user does enough new lessons to "catch up."
  - **Pre-existing achievements stay awarded.** A user who hit the `course-cleared` achievement on the broken pre-D91 threshold (when `courseTotal` was 1 and finishing `how-likely` was enough) keeps the achievement on their profile — `award()` is idempotent and never revokes. New users won't earn it until they actually complete the full 42-lesson course. Acceptable: revoking an achievement would feel worse than the (rare) early-bird false positive.
  - **Prune semantics are catalog-driven.** A lesson going coming-soon via Remote Config (with content still in `slots`) will _not_ prune the user's progress, because the criterion is `slots.length === 0` (i.e., truly contentless), not `comingSoon`. That's the intended distinction: a temporarily-flagged-off lesson is still "real," and its progress should resume if the lesson is flipped back on.
  - **No prune for `stepAttempts` or `users/{uid}/...` counters.** Same reason as the `lessonsCompleted` carve-out: out of scope for this pass. Could be added later if attempt history feels stale on Profile.
  - **The denominator can shrink over time.** If a future authoring pass deletes a stub (e.g., D90 dropped 8), the planned count drops. A user mid-course would see "5 / 42 → 5 / 34" between sessions. Acceptable: the path itself is the visible truth, and the count tracks it.
- **Tests:** `recommendations.test.ts` updated:
  - `'counts only available (non-coming-soon) lessons as the total'` → `'counts the full planned course as the total (live + locked stubs)'` (now `total = 2` on the 2-lesson fixture, was `1`).
  - `'returns 1/1 after completing the only available lesson'` → `'after completing the one real lesson, returns 1/2 (not 1/1)'`.
  - New: `'ignores stale progress on lessons that are blank stubs (no slots)'` exercises the guard in `courseProgress`.
  - Test fixture's `makeLesson` was updated so non-coming-soon lessons now have a single concept slot (modeling the "real, authored content" distinction the function uses).
  - 27/27 test files, 206/206 tests still green.
- **See also:** D86 / D88 / D90 (the catalog/scope decisions this builds on), D58 (PRD §9.6 acceptance — the "course progress" AC; the visible-on-path denominator is consistent with what the user can see), D55 (no bail-out — celebration only fires on real completion).

### D100 — Content-aware problem helpers, not a generic scratchpad

- **Status:** resolved (2026-06-25)
- **Chose:** Skip a generic per-lesson "scratchpad" / "logbook" surface. Instead, extend the existing pattern of small, problem-shaped helpers embedded in the interaction itself — ungraded, ignorable, scoped to the question they help with. The d6 reference behind `showDieContext: true` on fill-fraction problems (`how-likely.ts`) is the canonical example: tap faces to highlight, count, then enter the fraction. It never affects progress and disappears with the slot.
- **Why:** Content-aware helpers have no discoverability problem (the tool is in the problem), no mode-switching friction (no open/close), and scaffold the right move per question rather than a generic textarea that's passable at everything and great at nothing. They also read as bespoke ("made on purpose") rather than "we added a notes feature," consistent with the anti-vibe-coded direction.
- **Considered:**
  - **Generic text scratchpad (rejected).** Per-lesson bottom sheet on mobile / side panel on desktop, monospace `<textarea>` plus a "math row" of quick-insert chips (tally, fraction, ×, ÷, →, =), in-memory only. Cheaper to build, catches anything, but never *great* at any one task and adds modal friction on every problem that doesn't need it.
  - **Generic drawing scratchpad (rejected).** Same surface, HTML5 canvas. Even worse on desktop (mouse-drawing is miserable) and only marginally better on mobile (finger imprecision). Implementation cost is also disproportionate — pointer events, stroke buffering, eraser UX, resize-on-rotate.
  - **Always-on sidebar scratchpad (rejected).** No discoverability problem but eats screen real estate constantly and pressures learners to "use it" even when the problem doesn't need it.
  - **Per-problem on-demand text scratchpad (rejected).** A "tap to open" version of the generic option. Still suffers from the "generic = generically useful" problem; the d6-style helper already proves the bespoke pattern beats it.
- **What gets built instead (sketch list, build as the curriculum needs each one):**
  - Single die → existing `showDieContext` d6 ✓
  - Single coin → two coin faces, tap to highlight
  - Cards → 52-card grid that highlights on tap
  - Two-coins / two-dice → 4-cell or 36-cell mini-grid, mark-up only
  - "How many ways" counting → tally chip with +/−
  - Tree problems → tree skeleton with labelable branches
  - Sample-space listing → blank list with quick "add outcome" inputs
- **When to revisit:** if a future reasoning-heavy problem (Bayes word problems, complement-rule arguments, "is this fair?" setups) lands and learners visibly struggle without somewhere to write text and arithmetic, add a generic logbook then — as the backstop, not the default. Don't build the generic tool before the content demands it.
- **Gaps / risks:**
  - Implementation cost scales with problem types. Mitigation: each helper is small (30–80 lines of React), and you only build them when authoring a problem that needs one.
  - Risk of over-scaffolding — if a helper does too much of the counting for the learner, it weakens the retrieval/effort that makes the practice stick. Each helper should reveal *what to count*, not *the count*. (D8 / D55 mindset: never bail the learner out.)
  - Possible inconsistency if helpers diverge stylistically across problem types. Mitigation: shared shell (size, tap-affordance, color of "highlighted" state) defined once and reused.
- **See also:** `how-likely.ts` (existing `showDieContext` usage), D55 (no-bail-out rule that constrains helper behavior).

---

## B. Stack

### D9 — Frontend framework

- **Status:** resolved
- **Chose:** Vite + React 18 + TypeScript
- **Considered:** Next.js 14 (App Router), Remix, plain CRA
- **Gaps / risks:**
  - Vite SPA = no SSR → poor first-load SEO (acceptable: this is a logged-in learning app, not a marketing site)
  - No built-in serverless functions — Phase 2 (AI calls) will need Firebase Functions or a separate server, vs Next.js where API routes come free
  - Manual setup for some things Next.js gives free (file-based routing, image optimization, route prefetching)

### D10 — Backend / data

- **Status:** resolved
- **Chose:** Firebase — Auth, Firestore, Storage
- **Considered:** Supabase (Postgres + Auth), Convex, Clerk + Convex, NextAuth + SQLite/Prisma + Railway
- **Gaps / risks:**
  - Firestore is NoSQL → no native unique constraints (we work around with the `/usernames/` sentinel pattern), no JOINs, harder ad-hoc analytical queries
  - Firestore pricing scales with reads — a popular Phase 3+ app with many real-time listeners could get pricey
  - Vendor lock-in: schema, security rules, and SDK are Firebase-specific; migrating off is non-trivial
  - Firebase Auth doesn't natively support "login by username" — we build a workaround
  - No server-side functions until we add Firebase Functions (cold-start latency a future consideration)

### D11 — Routing

- **Status:** resolved
- **Chose:** React Router v6
- **Considered:** TanStack Router, manual hash routing
- **Gaps / risks:**
  - Guarded-route boilerplate is hand-rolled (one `<RequireAuth>` wrapper) — minor, but a thing
  - React Router data APIs are still relatively new; we'll keep usage minimal for MVP

### D12 — Hosting

- **Status:** resolved
- **Chose:** Vercel (static SPA)
- **Considered:** Netlify, Firebase Hosting, Cloudflare Pages
- **Gaps / risks:**
  - Firebase Hosting would consolidate everything under one Google bill — a small ops simplification we're declining for Vercel's better DX
  - Vercel + Firebase = two providers, two dashboards, two billing pages

---

## C. Data & Persistence

### D13 — Content model storage

- **Status:** resolved
- **Chose:** Lessons live as **TypeScript files in the repo** (typed `Lesson` objects), bundled with the client
- **Considered:** Lessons in Firestore (enables a future authoring UI), Headless CMS (Sanity, Contentful)
- **Gaps / risks:**
  - Editing a lesson requires a code change + redeploy
  - Non-developers can't author content (irrelevant for MVP; matters if we ever bring on a content team)
  - Localization later requires a migration to a real CMS
  - Trade win: zero DB reads on the critical path → easy <2s load target; type-checked content; version-controlled

### D14 — Progress persistence model

- **Status:** resolved
- **Chose:** Two-doc pattern — `/users/{uid}/lessonProgress/{lessonId}` for current state, `/users/{uid}/stepAttempts/{autoId}` as an **append-only** log of every check
- **Considered:** Single `lessonProgress` doc only (no history), summary stats only (correct/total per lesson)
- **Gaps / risks:**
  - More writes per user — Firestore writes are cheap but not free
  - More data to delete if a user requests account deletion (Phase 3 / compliance concern)
  - Trade win: free Phase 3 seed data for spaced repetition; verifiable "did the learner _actually_ finish" trail

### D15 — Mastery model

- **Status:** resolved
- **Chose:** 3-state machine per lesson — `not_started`, `in_progress`, `completed`
- **Considered:** Per-concept mastery score (0–100%), spaced repetition intervals (FSRS-style)
- **Gaps / risks:**
  - Crude — doesn't distinguish "got it on first try" from "struggled through with 2 strikes per step"
  - "Recommend next" is trivial today (first `in_progress`, else first `not_started`) — doesn't reflect mastery gaps
  - Will likely be replaced/augmented in Phase 3 by a richer score that the `stepAttempts` log can feed

### D16 — Username uniqueness pattern

- **Status:** resolved (renames enabled 2026-06-24 — see amendment below)
- **Chose:** Sentinel doc per username — `/usernames/{lowercased}` containing `{ uid }`, created in the same `runTransaction` that writes `/users/{uid}`
- **Considered:** Firestore extension for unique fields (heavyweight), Cloud Function trigger (latency)
- **Gaps / risks:**
  - Doubles the writes at registration (one to sentinel, one to user doc)
  - Sentinel is **never released** in MVP — if a user deletes their account (Phase 3), their username stays claimed
  - If the Firebase Auth `createUserWithEmailAndPassword` succeeds but the Firestore transaction fails, we need to clean up the orphan auth user (must implement)
- **Amendment (2026-06-24) — renames now allowed.** The original "sentinels are write-once, no renames in MVP" stance was reversed because the permanence created registration anxiety. A rename runs through `userService.changeUsername`:
  - Case-only edits (same lowercased key) just rewrite `displayUsername` on `/users` + `/publicProfiles`.
  - Real renames run one `runTransaction` that reserves the new `/usernames/{newLower}` (failing on `username-taken`), releases the old sentinel (`delete`), and re-points `/users/{uid}` and `/publicProfiles/{uid}`.
  - **Rules changed:** `/usernames` now allows `delete` for the sentinel owner (`resource.data.uid == auth.uid`); `/users` update allowlist adds `username` + `displayUsername` with a lowercase + ≤30-char guard.
  - **Accepted gap:** usernames denormalized into social edges (`publicProfiles/{x}/followers|following/{…}`) and historical notifications are NOT rewritten on rename — rules only let each user write their own edges, so a full fan-out needs Cloud Functions (none on Spark). Authoritative surfaces (app header, own/public profile, leaderboard) read live and reflect the new name immediately; stale names only linger in follow lists until that relationship is re-established. Revisit with a Cloud Function fan-out if it becomes noticeable.
  - **Not added:** server-side rename rate-limiting (no Cloud Functions); acceptable for current scale.

---

## D. Auth & Identity

### D17 — Auth providers

- **Status:** resolved
- **Chose:** Email + username + password only via Firebase Auth
- **Considered:** Add Google sign-in (one toggle in Firebase Auth + a button)
- **Gaps / risks:**
  - Higher signup friction on mobile (typing email + password + confirm vs one-tap)
  - More forgot-password support burden (Firebase handles the mechanics, but it's still a UX flow)
  - HS students who only use school-managed Google accounts can't onboard
  - Cheap to add later — flag for revisit if Phase 2 measures show signup drop-off

### D18 — Login mechanism

- **Status:** resolved
- **Chose:** Accept email **or** username + password. If input isn't email-shaped, look up `/usernames/{lowercased}` → fetch `/users/{uid}.email` → call `signInWithEmailAndPassword` with that email
- **Considered:** Email only (simpler)
- **Gaps / risks:**
  - One extra Firestore read per username-based login (cheap)
  - Couples the username sentinel pattern to login flow — if we ever change the username system, login breaks
  - Mirroring `email` into `/users/{uid}` means we have two sources of truth for email — must keep in sync if Firebase Auth email is ever changed

---

## E. Visual & Motion

### D19 — Color palette

- **Status:** resolved
- **Chose:** Indigo `#4F46E5` primary, emerald `#10B981` correct, rose `#F43F5E` wrong, amber `#F59E0B` streak/flame, near-white `#FAFAFA` bg, near-black `#0F172A` text
- **Considered:** Teal primary (more "math/science"), coral primary (warmer)
- **Gaps / risks:**
  - Indigo is _safe_ but very common (Linear, every modern SaaS) — may not feel distinctive
  - Rose for wrong is gentler than hard red but some users might miss the cue
  - No dark mode in MVP — phone-at-night users will get a bright screen
- **See also:** D67 (dark mode deferred but tracked)

### D20 — Typography

- **Status:** resolved
- **Chose:** Inter for all UI (body, prompts, headings), 16px minimum body, 22–32px for prompts
- **Considered:** Aktiv Grotesk (paid — Brilliant's font), Geist, system font stack
- **Gaps / risks:**
  - Inter is free and excellent but ubiquitous — won't carry distinctive brand on its own
  - Extra ~50KB on first load for the font files (acceptable, but a perf cost)

### D21 — Form factor

- **Status:** resolved
- **Chose:** PWA-friendly responsive web app, mobile-first, no native packaging
- **Considered:** React Native, Capacitor wrap (App Store from same React codebase)
- **Gaps / risks:**
  - No App Store / Play Store presence — major discoverability gap for an HS-student audience
  - No reliable push notifications on iOS (PWA push is recent and limited)
  - Add-to-Home-Screen on iOS is browser-dependent and weak
  - Capacitor is a real escape hatch later — same React code, but native shell
  - "PWA-friendly" means the app loads and works in a PWA context but ships no PWA features in MVP (no manifest, no service worker, no offline). Phase 2 candidate; until then PRD §1 reads "web app (PWA-friendly)" rather than committing to PWA features.

### D67 — Dark mode (`prefers-color-scheme`) deferred but tracked

- **Status:** **open — Phase 2/3 candidate, intentionally tracked**
- **Chose:** **No dark mode in Phase 1.** App ships light-mode only; no `prefers-color-scheme` media query handling. Acknowledged as a Phase 2/3 enhancement worth revisiting (user flagged it as interesting; HS students on phones at night is a real use case for the persona).
- **Considered:**
  - **Full dark mode in MVP** — design dual palettes for every color token, test contrast in both modes, add a toggle in Profile. Rejected: doubles design work, adds another testing dimension, and the brief doesn't require it.
  - **Auto-only dark mode (no toggle)** — respect `prefers-color-scheme` silently. Less work than a full toggle but still requires both palettes. Rejected for MVP, same reason.
  - **System-toggle support via Tailwind's `dark:` variant from day 1** — design only light, but use `dark:` prefixes throughout so adding dark mode later is mostly token work. Rejected: still requires picking dark token values eventually; YAGNI.
- **Gaps / risks:**
  - Phone-at-night learner gets a bright screen — known persona friction
  - Some learners prefer dark for cognitive reasons (sensitivity, focus); we exclude them
  - Re-themeing for dark mode in Phase 2 will touch every component that uses raw color tokens (manageable since shadcn CSS variables centralize the palette)
  - **Follow-up:** evaluate during Phase 2 alongside the LLM integration; if Phase 2 demos show frequent late-evening usage, prioritize. Track in this entry.
- **See also:** D19 (color palette source; dark variants will need to be defined here)

### D87 — "Probability Pirates" course-path scene: sky dice, fish dice, a sailing fleet, and a lavish final treasure chest

- **Status:** resolved (shipped + deployed 2026-06-24)
- **Chose:** Lean the home course path fully into the **Probability Pirates** theme (D81) so the ocean backdrop reads coherently now that the curriculum spans many chapters (D86). Concretely, in `OceanScene.tsx` / `CoursePath.tsx` / `FlyingDie.tsx` / `Checkpoint.tsx`:
  - **Two flavours of the magical d6, placed by element.** A single `FlyingDie` component takes a `variant`: `flying` (winged + sparkle, bobs up) lives in the **sky**; `swimming` (fins + forked tail + rising bubbles, wiggles) is a **fish die** that lives in the **sea**. Both keep the colored glow aura. Exposed as `FishDie` for call sites. Rationale: a winged die floating _in the water_ (or a ship floating _in the clouds_) "doesn't make sense" — match each motif to its medium.
  - **Sky band that clears the banners.** The path gets extra top padding (`pt-24`) so the sky decorations (sun, clouds, gulls, three flying dice spread at 13/45/78%) sit in a clear band **above the first `ChapterBanner`** rather than being occluded by it.
  - **Dice further down live _in the path column_, not the margins.** A couple of route dice (keyed on the prev lesson's global index, every 4th boundary from #5) render as **flying** instead of swimming, so airborne dice appear partway down the voyage too. Earlier attempt parked them in the `OceanScene` side gutters; rejected because those gutters collapse to ~0 on narrow/split-screen widths and the path then hides them.
  - **A sailing fleet, kept in the sea.** Three `PirateShip`s distributed down the voyage (≈34/58/82% height), pinned to the side margins (behind the path so they never cross the lesson islands), each tracing a slow figure-eight (horizontal sway at 2× the vertical loop) over ~22–26s. Replaces the previous single ship.
  - **Lavish final treasure chest replaces the trophy.** The final checkpoint variant is renamed `trophy` → `treasure`; `TrophyLand` → `TreasureLand` now plants a big, ornate `TreasureChest` (wood + gold bands, jeweled lock, overflowing coins/gems, warm radial glow) on the landfall island, sized up (`max-w-[280px]`, chest at 64% width). Copy changed to a pirate payoff: locked "X marks the spot" / "Finish every lesson to claim the buried treasure"; complete "Treasure unearthed! Course complete!" with the existing 250-coin (`TROPHY_REWARD`, D83) claim flow and confetti. The chest stays flung open once claimed.
- **Considered:**
  - **Keep the trophy.** Rejected: a sports trophy is off-theme for a pirate voyage; a buried treasure chest is the natural climax and reuses the existing chest/claim mechanics.
  - **All flying dice clustered at the very top.** Rejected per user feedback — "the gulls and flying dice and sun are all stuck at the very top"; spreading some down the path balances the scene.
  - **Ambient decor positioned only in `OceanScene` (percent-of-height) margins.** Works on wide desktop but fails on narrow widths where the path fills the column; the reliable open space at every width is the path's own weave gaps, so mid-path dice live there.
- **Gaps / risks:**
  - On very narrow viewports the side-margin ships are largely occluded behind the path (acceptable: they're purely ambient and the in-path fish/flying dice carry the theme).
  - All motion is decorative and reduced-motion-safe via the global `MotionConfig`; dice remain `aria-hidden` and non-focusable, tappable only as an easter-egg tumble.
- **See also:** D81 (Probability Pirates brand + Captain Pascal), D86 (multi-chapter curriculum that made the longer path need filling), D83 (coin economy — the treasure chest's 250-coin payout), D19 (palette the gem/gold colors draw from)

---

## F. Streaks & Engagement

### D22 — Streak timezone

- **Status:** resolved
- **Chose:** Auto-detect from the browser via `Intl.DateTimeFormat().resolvedOptions().timeZone`; store `lastActiveDate` as `YYYY-MM-DD` in that timezone. **Detection happens per session, not persisted** (so a traveler picks up their new local-tz boundary automatically the next time they open the app)
- **Considered:** Explicit timezone selector in Profile, UTC-only, persist-tz-at-registration
- **Gaps / risks (all accepted for MVP; revisit if a real user complains):**
  - Travelers crossing timezones can have weird-feeling streak day boundaries
  - One weird DST transition per year (off-by-an-hour boundary)
  - Devices with wrong system timezone (rare) get wrong streak math
  - No way for the user to correct it without a Phase 3 settings screen
  - Two devices in different timezones used the same day could double-count or miss a day; rare enough to ignore in MVP

---

## G. Scope Exclusions (each is a decision)

### D23 — No AI features in MVP

- **Status:** resolved (gate from the brief). **Amended 2026-06-25 for Phase 2 — see footer.**
- **Chose:** Zero AI in Phase 1 — no model calls, no generated content, no chatbot tutor, no AI grading
- **Considered:** Sneaking in an AI-generated hint here or there
- **Gaps / risks:**
  - All hint coverage is human-authored — limited to what we anticipated
  - Demo "wow factor" comes from the interaction quality alone, not AI tricks
  - Phase 2 (Friday) is where AI lands; this is a sequencing choice, not a permanent one
- **Amendment (2026-06-25) — Phase 2 reversal, with the "no SDK / no key in bundle" property preserved.** D92–D98 land Phase 2's AI layer. The PRD §9.10 AC #1 wording ("no model SDK in `package.json`, no API key in `.env` or the deployed build") is preserved _literally_ — the AI runtime lives in a Vercel serverless function and calls Gemini via plain `fetch` to the REST endpoint (no SDK), with `GEMINI_API_KEY` only as a Vercel server-side env var. The shipped client bundle stays clean. The "no LLM at runtime in the answer path" property is preserved by design: every served number comes from a code solver, not the model. So D23's _spirit_ (the app never teaches a wrong answer; the bundle has no model SDK) holds, while its _letter_ (no runtime model calls anywhere) is relaxed for the after-2-strikes hint, the practice wrong-answer explanation, and (stretch) the teach-the-recruit surface. See [`spec-ai-assist`](specs/spec-ai-assist.md), [`prd-phase2`](prd-phase2.md), and **D92–D98** below.
- **See also:** D92 (Vercel-over-Cloud-Functions), D93 (Vercel-over-Firebase-AI-Logic), D94 (mastery scoring reopened), D95 (Gemini free tier + Project Spend Cap), D96 (LLM-not-judge for free text), D97 (no RAG / no embeddings), D98 (Phase 2 implementation order).

### D24 — No social features

- **Status:** resolved
- **Chose:** Solo experience — no follow/followers, no comments, no leaderboards, no friends
- **Considered:** Friend leaderboards (known engagement lever), public profiles
- **Gaps / risks:**
  - Missing a proven retention mechanism (Duolingo / Brilliant both use social comparison)
  - Phase 3 candidate
  - Avatars + bios are in scope as personal-identity touches, but no graph

### D25 — No offline / local persistence

- **Status:** resolved
- **Chose:** Server-side persistence only; no localStorage fallback, no Firestore offline mode toggle
- **Considered:** Local-first with Firestore offline persistence (one config flag)
- **Gaps / risks:**
  - User on a plane / weak network is stuck
  - Mobile networks drop briefly — could feel laggy mid-lesson
  - Cheap to revisit — the Firestore SDK has offline persistence built in; we can opt in later

### D26 — No content authoring UI

- **Status:** resolved
- **Chose:** Lessons authored by writing TypeScript files in the repo
- **Considered:** Admin CMS for non-developers
- **Gaps / risks:**
  - Adding/editing a lesson requires a deploy
  - Locks lesson-writing to people who can use git
  - Will become a real bottleneck if we ever want a content team

### D27 — No push / email reminders

- **Status:** resolved
- **Chose:** No push notifications, no email digest, no streak-warning emails in MVP
- **Considered:** Daily streak reminder email, browser push
- **Gaps / risks:**
  - Misses a known engagement lever — streak retention drops without nudges
  - Phase 3 territory
  - iOS PWA push is limited anyway; would need a native shell to do this well

---

## H. Motivation & Habit Loop

### D28 — Motivation system scope

- **Status:** resolved
- **Chose:** **Standard** — streaks + best streak + daily goal + XP + streak milestones (3/7/14/30/60/100) + lifetime stats + lesson completion celebration with confetti, XP count-up, streak update, milestone card, course progress, next-lesson recommendation
- **Considered:** Light (streaks + celebration only), Heavy (+ trophies/badges + daily challenges)
- **Gaps / risks:**
  - More to build → real schedule pressure against the Wednesday gate
  - XP without leaderboards is a weaker hook than Duolingo's social XP — solo XP can feel hollow without comparison
  - Milestone celebrations only trigger on the _next_ lesson completion, not the moment the streak hits the threshold — slight delay, but keeps the celebration in one consolidated screen
  - No "comeback" mechanic — a learner who broke a long streak gets no special encouragement (Phase 3 candidate)

### D29 — Question bank pattern

- **Status:** resolved
- **Chose:** **Slot/variant model** — each lesson is a sequence of slots; problem slots carry a pool of 1+ variants; one variant is materialized per slot per attempt
- **Considered:** Fixed steps (no bank, every learner sees the same content always), per-step pools (smaller granularity than per-slot), random per-render with no seeding
- **Gaps / risks:**
  - The author must reason about both _slot shape_ (interaction kind) and _variant content_ (specific parameters) — slightly more conceptual overhead than "just a step"
  - Variants in a slot share an interaction kind — can't mix a grid question and a fill-fraction question in the same slot (good for renderer simplicity; minor authoring constraint)
  - Type guards needed to enforce that all variants in a slot match the slot's `interactionKind` (runtime + unit test, not just type system)

### D30 — Variants per slot in MVP Lesson 1

- **Status:** resolved
- **Chose:** **2 variants per problem slot** for the shipped Lesson 1
- **Considered:** Structure-only (1 variant), 3+ variants for real practice depth
- **Gaps / risks:**
  - 2 variants means a second-pass replay is fresh, but a _third_ pass shows variant A again — pattern detectable
  - Authoring cost ~doubles for problem slots (concept and wrap slots are unaffected since they're fixed)
  - Cheap to extend later — just append a variant object literal

### D31 — XP awarding rule

- **Status:** resolved
- **Chose:** ~~10 XP first-try correct / 5 XP second-try correct / 2 XP unlocked-after-2-strikes / +50 XP lesson completion bonus. XP never decreases.~~ **Updated 2026-06-23 (consequence of D55):** 10 XP first-try correct / 5 XP second-try correct / **2 XP for third-try-or-later correct (persistence reward)** / 0 XP for any wrong attempt / +50 XP lesson completion bonus. XP never decreases. The third bucket no longer rewards "unlocked-without-getting-it-right" (D55 removed that case); it now rewards "got it eventually after struggling."
- **Considered:** Flat XP regardless of attempts (no incentive to try hard), XP decaying steeply per attempt (punishing), no XP at all (lighter), no XP for 3rd+ attempts (rejected: would punish persistence under the no-bail-out rule)
- **Gaps / risks:**
  - The 10/5/2 curve is intuition, not validated — could be tuned later from real attempt data
  - Lesson bonus is a flat 50 XP regardless of lesson length — short lessons feel "more rewarding per minute" than long ones
  - No XP differentiation by difficulty / interaction kind — a tap-outcomes step pays the same as a grid-event step despite different cognitive load
  - Same 2 XP for 3rd-, 4th-, 5th-try correct — diminishing returns are coarse; could be smoother (e.g. `max(2, floor(10/attemptNumber))`) but YAGNI for MVP
- **See also:** D55 (pedagogy decision that drove this update), D7 (original wrong-answer model that the old XP curve was built for)

### D32 — Streak milestones

- **Status:** resolved
- **Chose:** Celebrate at `{3, 7, 14, 30, 60, 100}` days; each milestone triggers once (tracked in `milestonesReached`); celebration happens on the _next_ lesson completion after the threshold is crossed
- **Considered:** Famous-only `{7, 30}`, dense `{1, 2, 3, 5, 7, 10, 14, 21, 30, ...}`, Duolingo-style every-10 forever
- **Gaps / risks:**
  - 6 milestones might be too dense at the start (3 → 7 is fast) and too sparse later (60 → 100 is a long gap)
  - No celebration at the exact moment of crossing — there's a delay until the next lesson completion (acceptable: keeps surface UI consolidated)
  - 100 days is the ceiling for MVP — beyond that there are no further milestones until we add them

### D33 — Variant selection seeding

- **Status:** resolved
- **Chose:** Deterministic selection via `hash(userId + lessonId + attemptId + slotId) mod variants.length`, persisted to `selectedVariantIds` on first slot-visit
- **Considered:** Pure random per render (breaks resume), random + persist (works but no deterministic replay debugging), round-robin (skips personalization potential later)
- **Gaps / risks:**
  - Hash function choice matters — must be stable across deploys (use a tiny pure-function hash, not anything depending on engine internals)
  - Without `attemptId` regeneration on replay, second-pass would show identical variants — requires careful replay-handling code
  - Future per-user balancing (e.g. "this learner always sees the easier variant") is not free with this approach — would need additional logic

### D34 — No streak freeze / save mechanism

- **Status:** ~~resolved~~ **superseded by D79 (2026-06-23)** — we shipped a streak freeze after all.
- **Chose (original):** Miss a day → `currentStreak` resets to 0. No freeze, no save, no buy-back.
- **Reversal:** D79 adds a coin-bought Streak Freeze that auto-consumes on a missed day _before_ the reset fires. The "rigid streaks can feel punishing and drive churn" risk below is exactly what drove the reversal, and the "easy to add later — add a counter and consume one before reset" note was effectively the implementation plan we followed (`streakFreezes` on `users/{uid}`, consumed in `nextStreak()`).
- **Considered:** Duolingo-style streak freeze (cosmetic or paid), grace period of one missed day
- **Gaps / risks:**
  - Real-world life gets in the way; rigid streaks can feel punishing and drive churn
  - No revenue surface for streak-related purchases (irrelevant: MVP isn't monetized)
  - Easy to add later — just add a `streakFreezesAvailable` counter and consume one before reset

### D35 — Authoring workflow

- **Status:** resolved
- **Chose:** One TypeScript file per lesson under `src/content/lessons/`. Variants for a slot live inline with the slot. Adding a hint = small edit to a single variant. Adding a variant = appending an object literal. Type system enforces presence of `feedbackCorrect` and `feedbackDefault`.
- **Considered:** Separate `questions.json` files per slot, a YAML/MDX content format, a small admin CMS
- **Gaps / risks:**
  - Lesson files can grow long with multiple slots × multiple variants — could exceed several hundred lines
  - No syntax highlighting for hand-written feedback as it's just TypeScript strings
  - No preview of how a variant _looks_ without running the app — author needs a dev mode "lesson preview" page
  - Files-in-repo means lesson updates require a git push and Vercel deploy

### D83 — Coin economy (cosmetic-only soft currency)

- **Status:** resolved
- **Chose:** A soft currency, **coins**, earned _only_ from genuine accomplishment — checkpoint chests (`CHEST_REWARD` = 100), the trophy checkpoint (`TROPHY_REWARD` = 250), and each achievement earned (`COINS_PER_ACHIEVEMENT` = 25) — and spendable _only_ on non-pedagogical items (Streak Freeze D79, cosmetics D80). No coins for raw XP/correctness, no purchasable learning advantages, no real money. Balance lives on the private `users/{uid}` doc; all awards/spends are idempotent Firestore transactions (`claimedChests` guards double-claim).
- **Considered:** XP-as-currency (conflates the progress signal with a spending balance), pay-for-hints / skip-a-step (rejected — directly undermines learning), real-money IAP (out of scope and risky for a minor-heavy persona)
- **Gaps / risks:**
  - **Over-justification effect** — extrinsic rewards can crowd out intrinsic motivation. Mitigated by keeping coins strictly cosmetic + forgiveness, and by tying _earning_ to real milestones rather than rote activity.
  - Economy is unbalanced against real data — reward/price numbers are intuition, tunable later.
  - Coins are client-awarded (no Cloud Functions); the transaction guards prevent double-claims but a determined client could still probe rules. Acceptable for MVP (cosmetic stakes only).

### D79 — Streak Freeze as a forgiveness mechanic (supersedes D34)

- **Status:** resolved
- **Chose:** A coin-bought **Streak Freeze** (`STREAK_FREEZE_COST` = 200, hold up to `MAX_STREAK_FREEZES` = 2). On a missed day, `nextStreak()` auto-consumes one freeze per missed day to preserve the streak instead of resetting to 0; surfaced with a toast on the next session and a snowflake chip on Home. Reverses D34.
- **Considered:** A free automatic grace day (no agency, no coin sink), a real-money freeze (rejected with monetization), unlimited freezes (defeats the point of a streak)
- **Gaps / risks:**
  - A learner could hoard freezes to mask genuine lapses — the cap of 2 bounds this.
  - Consumption is silent until the learner returns; the toast is the only signal a freeze was spent.
  - Self-determination framing: keeps streaks from feeling punishing (autonomy/relatedness) without trivializing them. Logic is pure + unit-tested in `streak.ts`.

### D80 — Cosmetic identity items: avatar styles + profile flair

- **Status:** resolved
- **Chose:** Two cosmetic coin sinks that double as social-identity signals. **Avatar styles** = background/ring treatments for `DefaultAvatar` (`classic` free + default; paid ~150; `gold` 300 with a ring). **Profile flair** = a titled gradient badge under the display name (`none` free; 150–400). Both are bought once (`ownedAvatarStyles` / `ownedFlair`, private on `users/{uid}`), and the _equipped_ value is mirrored to `publicProfiles/{uid}` (`avatarStyle` / `profileFlair`) so others see it — PII-free, consistent with the existing public-profile mirroring pattern.
- **Considered:** Avatar **image upload** (blocked by D72 — Firebase Storage deferred), unlock-by-XP only (no coin sink), purely private cosmetics (weaker — the social visibility is the motivational point)
- **Gaps / risks:**
  - Catalogs are hand-curated pure data (`avatarStyles.ts` / `profileFlair.ts`, unit-tested); adding items is an append.
  - `equip` is a non-transactional batch write to two docs — acceptable since the _purchase_ is the guarded step and equip is idempotent/cosmetic.
  - Public mirror can drift if a batch write half-fails; self-heals on next equip.

### D82 — In-app schedule reminder + event detail (distinct from push/email D27)

- **Status:** resolved
- **Chose:** A **home-screen reminder dialog** that surfaces _today's_ unfinished schedule events, at most once per day (dismissal persisted in `localStorage` per `uid`+date). The query is scoped to a single day, so past days drop off automatically — satisfying "if the day has passed, remove" without a cleanup job. Plus a **tappable event detail dialog** that resolves a linked `lessonId` to its name + deep-links into the lesson, and shows full notes (the day-list row only previews them).
- **Considered:** Push / email reminders (still **excluded** — see D27; this is in-app only, no FCM/email), nag-on-every-visit (annoying), a persistent inline banner (less noticeable than a modal)
- **Gaps / risks:**
  - In-app only — it can nudge a learner who _opened the app_, but cannot pull them back the way push would. **D27 still stands** for off-app re-engagement.
  - `localStorage` dismissal is best-effort (private mode / cleared storage re-shows the popup — harmless).
  - Decision logic (`pendingToday`, dismissal) is pure + unit-tested in `reminderRules.ts`.

---

## I. UI Stack

### D36 — Component library foundation

- **Status:** resolved
- **Chose:** [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS for all app chrome — buttons, cards, inputs, progress, badges, avatars, dialogs, toasts. Components copied into the repo via CLI, themed once with PRD color tokens as CSS variables.
- **Considered:** Headless UI + custom Tailwind (more boilerplate), MUI/Chakra (heavier, harder to match Brilliant aesthetic), Radix primitives directly (shadcn is already Radix + Tailwind)
- **Gaps / risks:**
  - shadcn components need initial setup time (`npx shadcn init` + adding ~10 components)
  - Default shadcn aesthetic skews "SaaS dashboard" — requires deliberate theming to feel Brilliant-like
  - Community registry items vary in quality — must review before installing
  - Tied to Tailwind v4/v3 migration path as shadcn evolves

### D37 — Animation layer (Framer + selective Animbits)

- **Status:** resolved
- **Chose:** Framer Motion as the primary animation layer for lesson player (slot transitions, correct/wrong feedback, tap states). [Animbits](https://www.animbits.dev/) used selectively (max 2–3 components) for celebration-screen polish only — confetti, XP count-up. Install via `npx shadcn add @animbits/<component>`.
- **Considered:** Framer only (no Animbits), Animbits for all interactions (inconsistent with shadcn motion feel), CSS animations only (harder to coordinate sequences), React Spring
- **Gaps / risks:**
  - Two animation sources (Framer + Animbits) can feel inconsistent if Animbits spreads beyond celebration
  - Animbits is a third-party shadcn registry — must review generated code on install
  - Framer Motion adds ~30KB gzip — acceptable for the interaction quality it enables
  - If Animbits confetti doesn't fit, fall back to a short Framer particle snippet — no hard dependency

### D68 — Impeccable as future UI tooling (deferred, tracked)

- **Status:** **open — Phase 2 candidate, intentionally tracked**
- **Chose:** **Do not adopt [Impeccable](https://impeccable.style/designing/) for the Phase 1 MVP.** Continue with the current UI workflow: shadcn/ui scaffolded by hand, Framer Motion + selective Animbits for motion, all rules in [`docs/ui-stack.md`](ui-stack.md). Revisit Impeccable after the MVP first iteration ships, ideally as part of the Phase 2 brand/polish pass.
- **Considered:**
  - **Adopt Impeccable now (Phase 1)** — would require writing `PRODUCT.md` and `DESIGN.md` context files, learning the 23-command surface, and reconciling its opinions with `docs/ui-stack.md`. Rejected: pulls focus from shipping the MVP; the brief explicitly prioritizes "deployed and public" by Wednesday.
  - **Subset adoption: `/impeccable detect` in CI only** — the anti-pattern detector runs deterministically (`npx impeccable detect src/`) with a JSON output and exit code, so it would slot into CI without changing the design workflow. Genuinely appealing but still requires the context files to be useful; deferred along with the full tool to keep the Phase 2 conversation in one place.
  - **Skip Impeccable entirely** — Loses a real lever for the Phase 2 brand pass (Impeccable's `/extract` consolidates drift, `/document` re-captures the system, `/critique` and `/audit` add a structured review surface). Rejected as too final; better to keep on the radar.
- **Gaps / risks:**
  - We will accumulate **design debt during MVP** that Impeccable's `/extract` and `/document` are literally designed to pay down later — acceptable per the "build first, polish second" sequencing, but it means Phase 2 will have a real consolidation chunk
  - **Conflict warning from Impeccable's own docs:** running Impeccable alongside Anthropic's `frontend-design` skill cancels both out ("they collide on vocabulary"). We currently have `frontend-design` installed at `~/.claude/plugins/cache/claude-plugins-official/frontend-design/`. When we adopt Impeccable we'll need to retire `frontend-design` or pick one per task — decision to make at adoption time.
  - **Tool requires context files** Impeccable expects `PRODUCT.md` (audience, voice, anti-references) and `DESIGN.md` (tokens, components). `docs/prd.md` is most of `PRODUCT.md` already; `docs/ui-stack.md` is most of `DESIGN.md`. A short adapter pass at Phase 2 should map these over rather than re-authoring.
  - **Skill activation policy** Per D46, ambient skills must be opt-in. When we install Impeccable, follow the same pattern (`disable-model-invocation: true` unless we want auto-firing on UI tasks).
  - **Follow-up:** evaluate adoption at the start of Phase 2 alongside the LLM integration; lesson 2–6 build-out is the natural moment to invest in design tooling since we'll be touching UI heavily. Track in this entry.

**Canonical reference:** [`docs/ui-stack.md`](./ui-stack.md) — all specs must point here for UI implementation rules.

---

## J. Project Structure & Tooling

### D38 — Product name

- **Status:** resolved
- **Chose:** **Pascal** (after Blaise Pascal, co-founder of probability theory)
- **Considered:** Generic working names ("brilliant-clone"), subject-themed names (Dicey, Roll, Bayes), placeholder until launch
- **Gaps / risks:**
  - "Pascal" is also a programming language — possible name collision in search results
  - If we ever expand beyond probability, the name no longer reflects subject (likely fine — most great learning brands aren't subject-bound)
  - Domain availability not checked
- **See also:** D81 (public brand is now "Probability Pirates"; "Pascal" survives as the internal identifier + motif)

### D81 — Brand identity: "Probability Pirates" + Captain Pascal (extends D38)

- **Status:** resolved
- **Chose:** The **user-facing product name is "Probability Pirates"** with a friendly guide mascot, **Captain Pascal**. The **internal npm package, code namespace, analytics event prefix, and the Pascal's-Triangle motif stay `pascal`** — only the surfaced brand changed (wordmark, auth pages, `<title>`, mascot illustration + contextual lines, the "Captain's Log" daily-tip card, and a lesson-intro cameo).
- **Considered:** Keep plain "Pascal" (accurate but academic — less inviting for the HS persona), a _full_ rename including the package + analytics (churns imports and breaks analytics continuity for no user benefit)
- **Gaps / risks:**
  - Dual naming (public "Probability Pirates" vs internal `pascal`) can confuse new contributors — this entry + the package-name comment are the disambiguation.
  - Mascot copy must stay grounded in real learning science (the Captain's tips reinforce spacing, retrieval, learning-from-errors), not become gimmicky filler.
  - D38 still governs the _internal_ identifier; this entry governs the _public_ brand.

### D39 — Spec structure (PRD vs detailed specs)

- **Status:** resolved
- **Chose:** Slim high-level PRD + one detailed spec per major feature under `docs/specs/spec-*.md`. Each spec implementation detail is one sentence appropriate for a junior engineer.
- **Considered:** Single monolithic PRD with every detail inline, no specs at all
- **Gaps / risks:**
  - Cross-spec consistency requires manual diligence — easy to update one spec and forget another (e.g. progress schema referenced from auth, lesson player, course path)
  - Specs duplicate small amounts of context (e.g. data model snippets appear in multiple places)
  - More files to keep in sync as we make build-time decisions

### D40 — Linting + formatting + CI gate

- **Status:** resolved
- **Chose:** ESLint flat config (typescript-eslint) + Prettier + EditorConfig; CI runs `typecheck && lint && format:check && test && audit-feedback` on every push / PR
- **Considered:** Biome (all-in-one, faster), no CI for MVP (relying on local discipline), Husky pre-commit hooks
- **Gaps / risks:**
  - ESLint + Prettier is the slower combo vs Biome (~2× cold-start)
  - No pre-commit hooks means lint errors can be pushed before CI catches them
  - `audit-feedback` is a custom script — not standard; new contributors won't know what it does without reading `scripts/audit-feedback.ts`

### D41 — Sentry as the only error tracker

- **Status:** resolved
- **Chose:** Sentry for client-side error tracking, React Error Boundary at the route level, inline toasts for persistence failures
- **Considered:** Firebase Crashlytics (Firebase-native), no error tracking for MVP, console-only
- **Gaps / risks:**
  - Sentry free tier has event limits — could be hit during demo-day traffic spike
  - Two dashboards to check post-incident (Sentry + Firebase console + Vercel logs = three)
  - Sentry SDK adds ~50KB gzip — acceptable but real

### D42 — One Firebase project + local emulator strategy

- **Status:** resolved
- **Chose:** One shared Firebase project for MVP. Local development uses the Firebase emulator suite (no real reads/writes during dev). Production data goes straight to the shared project.
- **Considered:** Separate dev/staging/prod Firebase projects (cleaner but ~3× setup), production-only (no emulator — every dev test hits real DB)
- **Gaps / risks:**
  - No staging environment — any breaking schema change ships directly to "prod"
  - Test data could accumulate in the prod project during pre-launch development
  - Emulator behavior diverges from prod in edge cases (security rule evaluation, timestamps)
  - Phase 2 candidate: split into dev/prod projects before adding paying users or partner accounts

### D43 — Lesson stub policy

- **Status:** resolved
- **Chose:** Lessons 2–6 ship as one-file stubs with title, blurb, `comingSoon: true` flag, and zero slots; lesson player refuses to start them; course path shows them as locked
- **Considered:** Hide future lessons entirely until built, ship stubs with placeholder lorem-ipsum content
- **Gaps / risks:**
  - Type system needs to allow `comingSoon: true` AND empty `slots: []` together — a `Lesson` type variant
  - Tests must skip invariant checks for `comingSoon` lessons (e.g. don't enforce ≥1 slot)
  - Tappable-but-locked lessons might frustrate exploratory learners who tap to peek

### D44 — Documentation in `docs/`, not in code comments

- **Status:** resolved
- **Chose:** All architectural decisions, specs, and rationale live in `docs/*.md`. Code comments only explain non-obvious _implementation_ trade-offs (per agent code-style rules), not design motivation.
- **Considered:** JSDoc-heavy code with design rationale inline, README-only documentation, Notion/external wiki
- **Gaps / risks:**
  - Devs reading only code might not discover the spec — onboarding requires reading `docs/` first
  - Two places to keep in sync if a decision changes (code + docs)
  - Cross-linking between specs is manual

### D45 — `docs/architecture.md` as the cross-cutting source of truth

- **Status:** resolved
- **Chose:** A single architecture doc covers state management, directory layout, environment strategy, routing, error handling, observability, performance budget, and testing — all things multiple specs reference
- **Considered:** Inline these concerns into each spec individually (duplication risk), skip architecture doc entirely for MVP
- **Gaps / risks:**
  - Architecture doc must be kept current — drift between it and individual specs is a documentation smell
  - Heavy single file (~290 lines) — devs may not read it cover-to-cover before working on a feature

### D46 — Skill policy in `~/.cursor/skills/`

- **Status:** resolved
- **Chose:** Superpowers (14 skills) installed with `disable-model-invocation: true` — they activate only when explicitly named. Vercel React Best Practices left ambient — auto-activates on React work.
- **Considered:** Auto-activate all Superpowers (heavy context every chat), install Superpowers per-project under `.cursor/skills/` (no sharing across projects), don't install at all
- **Gaps / risks:**
  - Easy to forget Superpowers skills exist since they don't auto-prompt — requires the user to name them
  - Skills live in a personal directory, not in the repo — a teammate cloning the repo wouldn't get them automatically (project-local copy at `.cursor/skills/` would be required for that)
  - Vercel skill auto-firing on any React work could pull React/Next.js-flavored advice into Vite-specific contexts (mostly fine; Vite is React)

### D47 — Brainstorming-first workflow for new docs

- **Status:** resolved
- **Chose:** Use the `brainstorming` skill explicitly when authoring new design artifacts (e.g. alternatives log, PRD). Skip the skill for routine doc edits or pure-extraction tasks (e.g. moving an already-drafted log into the repo).
- **Considered:** Always invoke brainstorming, never invoke brainstorming, invoke for every doc regardless of size
- **Gaps / risks:**
  - "Routine vs design" is a judgment call — risk of skipping brainstorm when we shouldn't
  - The skill's HARD-GATE wants approval before any artifact is written — for pure extraction this slows us down without value

### D48 — Age gate at registration

- **Status:** resolved
- **Chose:** **No age-gate checkbox at registration in MVP.** Registration captures email, username, and password only. The `/users/{uid}` doc does not store an `ageGate13` field, and the security rule does not require one.
- **Considered:** "I am at least 13 years old" self-attestation checkbox (originally in `spec-auth.md`); hard age verification via ID upload (heavy, out of scope); blocking under-18 users entirely (cuts a chunk of the HS persona)
- **Gaps / risks:**
  - COPPA technically applies to data collection from children under 13 in the US; without a gate we have no documented defense for "we did not knowingly collect from under-13"
  - The HS persona includes 9th graders, some of whom are 13 — soft edge case; we'll be relying on parental / institutional context (school issuing access, parent installing PWA)
  - `docs/privacy.md` (pending) must now state the posture explicitly: "We do not collect data from users under 13 knowingly. We do not currently age-gate; we rely on the deployment context (HS students, no public marketing) until Phase 2."
  - Cheap to add back later — one checkbox at registration, one field on the user doc, one line in the security rule
  - If we ever do a real launch (App Store, public marketing), an age gate becomes a hard requirement, not a soft one

### D64 — Bundle-size CI enforcement deferred

- **Status:** resolved (with follow-up)
- **Amended 2026-06-23 (owner):** the hard 300 KB ceiling is relaxed to a **soft
  ≤ 350 KB gz target on the eager (entry) chunk**, with **load performance as the
  real gate** (Lighthouse mobile Performance ≥ 90, healthy TTI) rather than the
  raw byte count. Heavy non-entry routes are now `React.lazy` code-split
  (lesson player, celebration, schedule, profile), so the entry chunk sits at
  ~281 KB gz with room to grow for the design overhaul.
- **Chose:** **Bundle-size budget (≤300 KB gz first-load JS) is checked manually on every deploy, not enforced in CI for MVP.** Performance AC #4 states the budget; the deploy checklist (pending) gates on a manual check.
- **Considered:**
  - **CI enforcement now** via `@vercel/budget` or `bundlewatch` (would catch regressions automatically, but adds CI complexity and risks spurious failures during scaffolding)
  - **No budget at all** (relies on Lighthouse score alone — too coarse; Lighthouse can pass while bundle balloons)
- **Gaps / risks:**
  - A dev can ship a regression that bumps bundle from 280 → 350 KB and only catch it at deploy time, not in PR
  - Lighthouse desktop run will likely surface large bundles via Performance score, but only after deploy
  - Easy to wire in CI later — `bundlewatch` integrates with Vercel; the AC contract doesn't change, just the enforcement mechanism
  - **Follow-up:** add `bundlewatch` (or equivalent) to CI in Phase 2 polish pass; track in `docs/deploy-checklist.md` (pending)

### D74 — Agent-authored lesson copy for Lessons 2-4 (scoped exception to §12.6)

- **Status:** resolved (2026-06-23, addresses I029)
- **Chose:** For the Lessons 2-4 build, the agent authored all learner-facing strings (prompts, `feedbackCorrect`, `feedbackDefault`, per-wrong hints, and `explanation`) directly, in Lesson 1's voice and under `docs/ui-directive.md`, rather than leaving `FEEDBACK_TODO()` placeholders. This is a **one-time, owner-approved exception** to architecture §12.6 ("do not invent feedback copy"), granted because the owner asked for finished lessons. `explanation` is populated on every variant, so these lessons do not carry the I001 gap.
- **Considered:**
  - **Follow §12.6 strictly — ship `FEEDBACK_TODO()` everywhere and have the owner write copy.** Rejected for this task: it would hand back empty shells, the opposite of the "build good lessons" request. §12.6 remains the default for future work; this exception does not repeal it.
  - **Author only prompts, stub the feedback.** Rejected as a confusing half-measure that still blocks playtesting.
- **Gaps / risks:**
  - Probability feedback is largely factual, but voice calibration is the owner's call; the copy is flagged for review in I029 and is editable in `src/content/lessons/0{2,3,4}-*.ts`.
  - This sets a precedent; keep it scoped. §12.6 still governs by default, and any future agent-authored copy should be logged the same way (issue + decision entry) so it stays auditable.
- **See also:** D73 (the lessons this copy belongs to), I023 / I024 (Lesson 1 copy review pattern), architecture §12.6 (the guardrail this scopes an exception to)

---

## K. PRD Acceptance Criteria Style

> Captured during the AC walkthrough that produces `docs/prd.md`. Each entry locks in how PRD-level AC bullets are written so future feature ACs follow the same pattern.

### D49 — AC grain: validation rules

- **Status:** resolved
- **Chose:** One PRD-level AC bullet per _category_ of validation ("client-side validation rejects invalid inputs and shows a specific message per failure mode"). The spec's test plan enumerates per-rule cases.
- **Considered:** One bullet per validation rule (~5 bullets in Auth alone), one umbrella bullet with no enumeration at all
- **Gaps / risks:**
  - A PRD reader who wants to know exactly which rules fire (email format vs username regex vs password length) has to open `spec-auth.md`
  - If a rule is dropped or added later, the PRD bullet doesn't change — drift between PRD and spec is possible if we forget to re-sync
  - Trade win: PRD stays scannable; reviewers can read the contract in one screen

### D50 — AC copy enshrinement

- **Status:** resolved
- **Chose:** PRD ACs describe error messages by _intent_ ("a single generic message — never reveals whether the identifier exists"), not exact strings. The spec owns the wording.
- **Considered:** Enshrining exact strings in the PRD (e.g. "Email/username or password is incorrect."), which would make the PRD the canonical copy source
- **Gaps / risks:**
  - Copywriting changes don't force a PRD update — good for velocity, but means a casual PRD reader doesn't see the actual user-visible string
  - Two sources of truth (PRD + spec) for the same constraint; reviewer must trust the spec for the final string
  - For UX-critical phrases (security messages especially), small copy changes can change _meaning_; spec owners must be careful

### D51 — Double-submit protection as PRD-level AC

- **Status:** resolved
- **Chose:** Include a dedicated AC bullet for "form is disabled during in-flight request" on Auth, and presumably any later forms (Profile edit, etc.). It's a real failure mode worth contracting on at PRD level.
- **Considered:** Leave it implicit; assume any framework's loading state will give it to us for free; only call it out in the spec
- **Gaps / risks:**
  - Slightly duplicative — most form frameworks (and our shadcn `Button` with `disabled` prop) make this trivial
  - But the AC catches the case where a dev forgets the `disabled` binding — the test plan now requires it explicitly
  - If we ship many forms, this pattern should appear in `docs/ui-stack.md` as a UI convention so individual specs don't re-derive it

### D52 — Cross-device sync latency contract

- **Status:** resolved
- **Chose:** AC for cross-device sync says "within one refresh" without committing to a specific latency number (e.g. "<2s via Firestore listeners")
- **Considered:** Hard latency promise ("Firestore listeners propagate within 2s"), lazy-only ("changes show on next reload, no real-time")
- **Gaps / risks:**
  - We don't make a real-time promise — if Firestore latency degrades, we have no contractual recourse; we're inheriting Firebase's SLA
  - "One refresh" is vague — a reviewer might interpret it as "user must hit reload" when in practice Firestore's `onSnapshot` updates are sub-second
  - The spec's test plan can be more concrete (emulator + manual cross-device verification)

### D53 — Replay variant freshness wording

- **Status:** resolved
- **Chose:** AC #3 (Progress) says "produces a _different mix_ of variants when slots have ≥2 variants" without an explicit probability number
- **Considered:** Spell out the probability ("~94% chance at least one slot differs in MVP Lesson 1"); require strictly-guaranteed-different (would need a different selection algorithm that tracks history)
- **Gaps / risks:**
  - A learner who happens to draw the same variants on replay might feel cheated — possible in MVP since only 2 variants per problem slot
  - The `attemptId` regeneration makes this rare but not impossible; the spec's test plan acknowledges "with high probability"
  - Once Lesson 2+ ships with 3+ variants per slot, the probability of an identical-mix replay drops to near-zero — the AC will naturally tighten in practice without re-wording

### D54 — Server-side abuse cap (rule + naming)

- **Status:** resolved
- **Chose:** A server-side Firestore security rule rejects any `stepAttempt` create whose `attemptNumber` exceeds **10** on a single slot in one sitting. The rule is named **"abuse cap"** in PRD AC §9.2 #6 and in `spec-progress-persistence.md`. The cap is silent — the UI never surfaces it for legitimate use.
- **Considered:**
  - **No cap** — trust the client to retry sensibly. Rejected: a runaway client (or hostile script) could write thousands of attempts before billing notices.
  - **Higher cap of 25** — less likely to false-positive on a genuinely struggling learner. Rejected for MVP: under D55 the learner _must_ eventually answer correctly, so the realistic distribution of attempts/slot is heavily skewed toward ≤5; 10 leaves wide headroom while keeping the cap meaningful.
  - **Soft client-only throttle** — visible to the user, defeats the protection against a buggy/hostile client.
  - **Alternative naming: "stuck-client cap"** — friendlier framing but less honest about the threat model.
  - **No label at all** — rule exists, isn't named. Rejected: makes cross-doc references awkward ("the >10 thing").
- **Gaps / risks:**
  - "Abuse cap" frames the threat model as adversarial; the cap actually protects against both bad actors and buggy clients — minor terminology friction. Affects PR/marketing language if the rule ever surfaces externally; not user-visible.
  - A reviewer reading "abuse cap" might wonder whether we have other abuse defenses (we don't — this is the only one in MVP); doc accordingly if it ever comes up.
  - Cap of 10 is intuition, not validated — could be tuned later if the `stepAttempts` log shows many legitimate >10-attempt sessions under D55's no-bail-out rule.
  - Cap is per-create-call, not per-window — a determined client could close and reopen the lesson to reset; acceptable for MVP since `attemptId` regeneration on resume is mostly continuous within a single session.

### D57 — Numeric magnitudes in PRD AC

- **Status:** resolved
- **Chose:** PRD-level AC bullets describe the _shape_ of numeric mechanics, not their _magnitudes_. Specific values (XP values `10 / 5 / 2 / +50`, milestone thresholds `{3,7,14,30,60,100}`, attempt cap `10`, etc.) live in the spec and `docs/alternatives.md` decision entries.
- **Considered:** Enshrine the magnitudes in PRD ACs (more concrete contract, easier to verify, but tightens the PRD to every tuning pass); omit numeric AC bullets entirely (loses the shape-level contract)
- **Gaps / risks:**
  - A PRD reader wanting to know "how much XP for first-try?" must follow the link to spec/D31 — one extra hop
  - Shape-level wording ("progressively less but always >0") is loose enough that two implementations could both satisfy it differently; the spec is the source of truth for the actual curve
  - When we tune values in Phase 2, only the spec + alternatives entry need updating — no PRD churn

### D58 — Visual tokens in PRD AC

- **Status:** resolved
- **Chose:** PRD AC bullets describe state _intent_ ("visually distinguished when active vs zero") rather than specific tokens ("amber when active, gray when zero"). `docs/ui-stack.md` owns the actual color/typography tokens.
- **Considered:** Enshrine the color names in PRD AC (more concrete but couples PRD to design churn); make no claim about the visual distinction at all (loses the contract that there _is_ a distinction)
- **Gaps / risks:**
  - A reviewer reading the PRD doesn't see what the active state looks like without opening `ui-stack.md`
  - "Visually distinguished" is satisfiable by many treatments (color, weight, icon) — gives implementers freedom but loses precision
  - Color tokens are already named in PRD §4 (UI Direction) as a high-level palette commitment; the duplication-avoidance argument applies

### D59 — Daily goal rollover semantics in AC

- **Status:** resolved
- **Chose:** AC #9 (Habit Loop) explicitly says the daily-goal pill rolls over at **local midnight in the learner's detected timezone (per D22)** — not "nightly" or "every 24 hours."
- **Considered:** "Resets nightly" (vague — could mean a server-side cron at UTC midnight), "every 24 hours after last completion" (sliding window, would feel buggy), UTC-only (would break for non-UTC learners)
- **Gaps / risks:**
  - Couples the AC to D22's timezone-detection mechanism; if D22 is ever revisited (e.g. explicit timezone picker), this AC needs an update
  - Travelers crossing timezones see the boundary shift (already a gap noted in D22)
  - "Detected timezone" puts trust in `Intl.DateTimeFormat().resolvedOptions().timeZone`; broken on devices with misconfigured system clocks (rare)

### D60 — Replay UX granularity in PRD AC

- **Status:** resolved
- **Chose:** AC #8 (Course Path) says "a Replay affordance" — the existence of the path is the contract; the UX mechanism (button vs dialog vs slide-up sheet) is owned by `spec-course-path`.
- **Considered:** Require an explicit confirmation dialog in the AC ("Replay opens a confirm dialog"); skip the Replay AC entirely (let the spec own it); require a one-tap replay with no confirmation
- **Gaps / risks:**
  - A spec author could implement a one-tap replay (no confirmation) and satisfy the AC, even though the spec's edge-case section currently calls for a confirmation dialog — minor drift risk
  - If user testing reveals confirmation friction, the spec can change without a PRD update
  - PRD doesn't lock in _when_ replay variant reshuffling happens — that's covered by Progress AC #3

### D61 — Validation magnitudes vs tuning magnitudes in PRD AC

- **Status:** resolved
- **Chose:** **Two postures toward numbers in PRD AC bullets, by kind:**
  - **Validation magnitudes** (user-facing constraints that appear in error messages or limit user input): enshrined as concrete numbers in the AC. Examples: username 3–20 chars, password ≥6 chars, bio ≤150 chars, avatar ≤2 MB, abuse cap = 10 attempts/slot.
  - **Tuning magnitudes** (mechanic values the learner doesn't see numerically): shape-level in PRD, magnitudes in spec. Examples: XP curve (`10/5/2/+50`), milestone thresholds (`{3,7,14,30,60,100}`), performance budgets (`<100ms`, `<2s`, `60 FPS`).
- **Considered:** All magnitudes in spec only (extends D57 universally — PRD reader has to dig for every number); all magnitudes in PRD AC (concrete contract but tightens PRD to every tuning pass).
- **Gaps / risks:**
  - The boundary is fuzzy in edge cases — is the abuse cap of 10 a _validation_ (security/quota boundary, user could hit it) or a _tuning_ (defense against runaway clients)? We currently treat it as validation because it's a hard server-side rejection.
  - Performance budgets (`<100ms`, `<2s`) are arguably user-facing ("feedback should feel instant") but expressed as numbers a learner never sees; D57 treats them as tuning. Slight inconsistency with the "user sees the number" heuristic.
  - Future AC reviewers must apply this rule consistently; ambiguity will resurface. Default rule of thumb: **if the user sees the number in a UI string or in their own actions hitting the limit, it's validation → PRD AC concrete.**

### D62 — "One-refresh contract" consolidation

- **Status:** resolved (PRD assembly pass, 2026-06-23)
- **Chose:** **Keep per-feature** with cross-references. Three ACs restate the one-refresh contract independently: Progress AC #2 (cross-device sync), Course Path AC #10 (Home updates after completion), Profile AC #10 (stats update after completion). The latter two explicitly cite "same one-refresh contract as Progress AC #2" so the canonical source is Progress AC #2.
- **Considered:** Promote to a single cross-cutting AC under §9.8 Performance; create a new "Data Freshness" bucket (would be 1-AC-thick — over-cutting); never consolidate (accept the duplication without cross-refs).
- **Gaps / risks:**
  - 3× references — if the freshness contract tightens (e.g. to "<2s via real-time listener"), Progress AC #2 changes and the other two cite it; cheap to update
  - Implementation cost is identical for all three (one Firestore `onSnapshot` per relevant collection); no per-feature divergence expected
  - Trade win: each feature's AC list reads as self-contained for that bucket reviewer

---

## L. Platform & Responsive

### D63 — Desktop strategy: truly responsive (Pattern B)

- **Status:** resolved
- **Chose:** **Pattern B — truly responsive design with per-breakpoint layouts.** Every screen reflows for mobile (≤640px), tablet (`md:` 768px+), and desktop (`lg:` 1024px+). Tailwind responsive prefixes throughout. Bottom nav on mobile transitions to sidebar on `md:`. Home lesson list goes 1-col → 2-col → 3-col grid. Profile stats grid 2-col → 3-col. Lesson player capped at `max-w-2xl` and centered on wide viewports. Interaction touch targets scale up (44px → 56px → 64px). Both mobile and desktop are first-class.
- **Considered:**
  - **Pattern A: Phone-shaped container** (Brilliant/Duolingo style — fixed `max-w-[430px]` centered on neutral background). Rejected: user explicitly flagged desktop as "arguably more important than mobile" (demos, teachers projecting, parents installing).
  - **Pattern C: Mobile-only with desktop blocker** (QR code "open on your phone"). Rejected: kills demo accessibility.
- **Gaps / risks:**
  - **~30–40% more UI work** vs Pattern A — every screen needs explicit breakpoint layouts; cross-breakpoint visual regressions are a new risk
  - **Wednesday-deadline pressure** — design + implementation work both grow; some polish may slip
  - **Per-breakpoint testing** — Lighthouse desktop + mobile audits both gate deploys; manual testing matrix expands
  - **Lesson player desktop UX is under-specified** — wider viewport invites "side panel for hints / illustrations" but adding that turns into a Pattern B+ design pass; for MVP just center the mobile player in a `max-w-2xl` container and leave side panels for Phase 2
  - **Orientation** — landscape phone view is now a real case (phone is "wide-ish"); reuse the desktop layout for landscape rather than designing a third state
  - **Grid sizing** — 6×6 grid on a 1080p monitor with 64×64 cells is visually small; consider scaling more aggressively (96×96?) once we see it in context
- **See also:** D65 (verification scope), D66 (orientation policy that falls out of Pattern B)

### D65 — Pattern B verification scope

- **Status:** resolved
- **Chose:** **Qualitative layout-shift verification on resize**; **320px minimum supported viewport width**; **measurement via Lighthouse + Chrome DevTools (no custom CLS-on-resize tooling)**.
- **Considered:**
  - **Strict CLS measurement on resize** (e.g. Chrome DevTools Performance > Layout Shift recording across resize events) — more rigorous but high-effort for MVP; Phase 2 polish
  - **Lower viewport floor (280px) for ancient Androids** — D2 persona doesn't include sub-320px devices; 320px is iPhone SE width and the modern floor
  - **Higher viewport floor (375px)** — would exclude iPhone SE; rejected
- **Gaps / risks:**
  - "No layout flash" is qualitative — two implementations could both satisfy it differently
  - 320px floor means iPhone SE works but no older devices; acceptable per persona
  - Resize regressions can ship between Lighthouse audits — depend on dev discipline to verify resize manually

### D66 — Orientation: graceful degradation, no force-lock

- **Status:** resolved
- **Chose:** **No orientation lock.** Phone landscape automatically activates the `md:` (tablet) layout since the viewport now meets that breakpoint. No third "landscape phone" layout is designed; no JavaScript or `<meta>` is used to force portrait.
- **Considered:**
  - **Force portrait via `screen.orientation.lock('portrait')` or CSS rotation** — feels paternalistic; breaks user agency (iPad-in-landscape, learner-in-bed cases); browser support is patchy
  - **Design a third dedicated landscape-phone layout** — extra work for a rare orientation; the desktop layout already works well enough at landscape-phone dimensions
- **Gaps / risks:**
  - Landscape phone keyboard takes up significant vertical space — fill-fraction input may need scrolling
  - The desktop layout at landscape-phone width (e.g. 844×390) leaves cramped grid cells; the breakpoint scaling treats 844px-wide as desktop-tier (64px cells) which may feel oversized
  - Could add a more refined landscape adjustment later if user testing flags it

### D71 — Tablet+ navigation uses the shadcn `Sidebar` block

- **Status:** resolved (2026-06-23, addresses I016)
- **Chose:** At `md:` and above, navigation chrome is the **shadcn `Sidebar` block** (installed via `npx shadcn add sidebar`). Collapsible, mobile-aware out of the box. Bottom nav is preserved at mobile widths; the sidebar replaces it at `md:` per D63. Hidden entirely on `/lesson/:id` and `/celebration/:id` at every breakpoint (lesson/celebration are immersive).
- **Considered:**
  - **Hand-roll a flex sidebar from shadcn `Button` + `Avatar` primitives** — more control, less code we don't own, but no real benefit for a two-item nav (Home, Profile); the shadcn block already handles the collapse, focus management, and mobile-aware behavior we'd otherwise rebuild.
- **Gaps / risks:**
  - The shadcn `Sidebar` block ships with a default look (rail + variants) that we need to tune to match the rest of the app's visual register; trivial CSS work but worth not skipping per the UI directive's "no defaults shipped as choices" rule.
  - Only two nav items in MVP (Home, Profile), so the sidebar will feel sparse on desktop. Acceptable; do not pad it with link sections that don't exist.

### D72 — Firebase Storage deferred (Spark plan; avatar upload out of MVP scope for now)

- **Status:** resolved (2026-06-23, addresses I026)
- **Chose:** **Do not enable Cloud Storage on the Firebase project for MVP.** Cloud Storage requires the Blaze (pay-as-you-go) plan; the project stays on Spark. Avatar upload is **out of scope until Storage is enabled.** Profile shows `DefaultAvatar` (colored circle + initial) for all users. Bio edit, stats, milestones, and log out ship normally. `avatarUrl` on `/users/{uid}` stays `null`.
- **Considered:**
  - **Upgrade to Blaze now** — free tier covers MVP avatar traffic; requires a card on file. Rejected for now because the owner has no card / no budget headroom; revisit when ready.
  - **Store avatars in Firestore as base64** — blows doc size limits and read costs; rejected.
  - **Use a third-party image host** — adds dependency and auth complexity; rejected for MVP.
- **Implementer rules:**
  - Do **not** wire `avatarService.uploadAvatar`, Storage rules deploy, or the "Change photo" control in Edit Profile for MVP.
  - Do **not** block on Storage emulator setup for spec-profile; skip avatar upload tests until D72 is reversed.
  - `firebase/storage.rules` and Storage emulator config may be omitted from the initial `firebase/` scaffold; add them when Blaze is enabled.
  - `VITE_FIREBASE_STORAGE_BUCKET` may remain in `.env.local` (harmless; unused until Storage ships).
- **Gaps / risks:**
  - Learners cannot personalize with a photo until Blaze + Storage are enabled and spec-profile avatar upload is implemented.
  - Re-enabling later is a small, self-contained spec-profile follow-up (upload UI + `avatarService` + rules deploy).
- **Reversal trigger:** Owner upgrades Firebase project to Blaze, enables Storage in console, then closes I026 and implements avatar upload per `spec-profile.md`.

---

---

## M. Phase 2 — AI

### D92 — AI runtime lives in a Vercel serverless function (not Firebase Cloud Functions)

- **Status:** resolved (2026-06-25)
- **Chose:** Put the AI runtime in a Vercel serverless function (`/api/hint.ts`, `/api/teach.ts`) auto-deployed alongside the Vite build. `GEMINI_API_KEY` is a server-side Vercel env var; the client bundle never sees it.
- **Considered:**
  - **Firebase Cloud Functions** — would require upgrading the project from Spark to Blaze, attaching a card, and managing a second backend. Rejected: Vercel Hobby is already part of the deploy pipeline, has a generous free tier (1M invocations/mo), and the function lives next to the SPA build with zero new infrastructure.
  - **Calling the model from the client** (e.g. via Firebase AI Logic) — separately rejected in **D93**.
  - **A dedicated Node server (Express/Fastify) elsewhere** — too much ops for a personal launch; same code-shape benefit without the operational burden lives in a Vercel function.
- **Gaps / risks:**
  - Vercel cold starts add a perceptible first-call delay (~300–600ms). Acceptable for an after-2-strikes hint; would matter more for a chat-style interface (we don't have one).
  - Two clouds (Firebase for data, Vercel for AI) means two dashboards. Already true in MVP (Firebase + Vercel hosting), so no new operational drag.
  - In-memory rate limiting in serverless is per-region/cold-instance — imperfect; acceptable for personal-scale Phase 2.

### D93 — Call Gemini via `fetch` to the REST endpoint, NOT via an SDK

- **Status:** resolved (2026-06-25)
- **Chose:** The Vercel function calls Gemini through `fetch('https://generativelanguage.googleapis.com/v1beta/models/...:generateContent', ...)`. **No `@google/generative-ai` or any other model SDK is added to `package.json`.**
- **Considered:**
  - **`@google/generative-ai` (the official Gemini SDK)** — would add a model SDK as a dependency. Even server-side it would show in `package.json`, weakening the "no model SDK in bundle" property the PRD §9.10 AC #1 chose. Rejected.
  - **Firebase AI Logic (client-side Gemini via the Firebase SDK + App Check)** — Firebase's "AI Logic" surface lets the client call Gemini directly. Rejected because (1) it puts a model SDK in the client bundle, breaking the §9.10 AC literal property; (2) it makes the "code computes the verified answer first, then grounds the prompt" pattern weaker (the solver would have to ship + the client would have to be trusted to call it before the model); (3) it couples AI to the data backend, where we've been deliberately separating them.
- **Gaps / risks:**
  - We're writing the request/response handling by hand (small: a `callModel({ system, payload })` helper). Worth it for the bundle property.
  - When swapping providers later, we re-implement the same one-file helper — minor.
  - We don't get SDK conveniences like streaming or structured-output helpers; for short-JSON outputs we don't need them.
- **See also:** D23 (the property we're preserving), D92 (where the function lives).

### D94 — Reopen "no mastery scoring" for a per-skill learner model

- **Status:** resolved (2026-06-25)
- **Chose:** Build a small, owner-only **learner model** (`users/{uid}/learnerModel/state`) with per-skill Elo + recency-weighted accuracy + misconception counts. Drives adaptive practice difficulty, topic auto-suggestion, AI hint personalization, and a visible "Strengths / keep working on" UI panel. Reverses [PRD §9.10 #8 "no mastery scoring / spaced repetition"] _partially_: per-skill rating is in, lesson-level state machine (`not_started`/`in_progress`/`completed`) is unchanged.
- **Considered:**
  - **Keep the 3-state lesson machine and nothing else** (Phase 1 status quo). Rejected: with Phase 2 practice landing, the engine needs _some_ signal to adapt difficulty and recommend topics; without it adaptivity is theatre.
  - **Bayesian Knowledge Tracing (BKT)** — the textbook learning-science model. Rejected for v1: more parameters per skill, more data required to be useful; we don't have the volume to calibrate. Strong v2 candidate.
  - **Deep Knowledge Tracing (DKT, LSTM over attempt sequences)** — overkill, data-hungry, opaque. Rejected outright.
  - **One spec for everything**: roll the learner model into spec-practice. Rejected: it has a separate, additive write path (any attempt anywhere can update it), so it deserves its own spec.
- **Gaps / risks:**
  - Constants (`K = 24`, `ALPHA = 0.2`, delayed-retrieval bonus cap 1.5×) are first-cut; tune with real data.
  - Multi-skill credit assignment (a variant tagged with two skills) is applied independently to each → mildly double-counts cross-cutting problems. Acceptable.
  - Public visibility (a leaderboard of mastery, a public showcase) explicitly out of scope; the model stays private (consistent with D24 / D80 framing).
- **See also:** [`spec-learner-model`](specs/spec-learner-model.md), D15 (original 3-state mastery decision).

### D95 — Gemini free tier (no credit card) with Project Spend Cap as the escalation path

- **Status:** resolved (2026-06-25)
- **Chose:** Use Gemini via Google AI Studio's **free tier** for Phase 2 demo + personal launch. No credit card. Gemini 3 Flash gives ~1,500 RPD / 10 RPM, comfortably above expected traffic. If usage ever grows past the free tier, attach billing _with a Project Spend Cap_ (e.g. $5/mo) so cost cannot surprise.
- **Considered:**
  - **OpenAI / Anthropic** — both fine providers; neither offers a no-card free tier with a daily budget Gemini does. Rejected on cost only — the function isolates the call behind a `callModel(...)` helper so swapping later is one file.
  - **A local model** (e.g. running Llama on a server) — wrong shape for a personal-launch demo; no infrastructure.
  - **Self-hosted on Cloudflare Workers AI** — viable v2 swap; not worth the migration cost now.
- **Gaps / risks:**
  - **Free-tier prompts may be used by Google to improve their products.** Acceptable because the request body carries only structured slot data + an anonymized attempt (no name/email/uid). Documented for the Brainlift.
  - Free-tier rate limits are per-project not per-user; a burst of concurrent learners could hit 10 RPM. Mitigated by client-side fallback to authored copy on any 429.
  - "Free forever" is at the provider's discretion. If pricing changes mid-Phase, the Project Spend Cap is the safety net.

### D96 — LLM is a STUDENT for free-text inputs, never a JUDGE

- **Status:** resolved (2026-06-25)
- **Chose:** Anywhere a learner produces **free text** (Phase 2 → only the "teach the recruit" surface, F4), the LLM does **not** grade. It maps the text onto a hand-authored rubric (closed-set point ids) + a closed-set misconception enum, and asks a Socratic follow-up. Correctness is decided by a **code-verified transfer problem**, not by the model's praise.
- **Considered:**
  - **Let the LLM grade free-text explanations holistically** (a "you got it!" / "not quite" judgment). Rejected: matches the failure mode the learning-science notes explicitly warned about (sycophancy gives a false signal of mastery; two LLMs share training data and agree on the same wrong answer; learners are poor self-judges, so they accept the false signal).
  - **Don't let learners type free text at all in Phase 2.** Rejected: gives up the protege effect entirely, which is the most pedagogically powerful AI surface we can build.
  - **Run a second LLM as a "judge"** to vet the first's grade. Rejected: correlated errors — they will agree on the same wrong answer with high confidence.
- **Gaps / risks:**
  - The rubric must be hand-authored per concept — authoring burden, but bounded (a few rubrics for the demo concepts).
  - Novel misconceptions outside the closed enum aren't detected. Acceptable: the closed enum can be extended in a single PR.
  - We accept that the recruit's verbal response (the follow-up question) might miss nuance the learner expressed; the transfer problem still grades fairly.
- **See also:** [`spec-ai-assist`](specs/spec-ai-assist.md) §"Teach the recruit", [`spec-learner-model`](specs/spec-learner-model.md) §"Misconception flow".

### D97 — No RAG, no embeddings, no vector DB

- **Status:** resolved (2026-06-25)
- **Chose:** Phase 2 ships **without any retrieval layer**. The hint/explanation/teach functions inject the entire relevant context directly into the prompt: the structured slot, the learner's attempt, the learner-model summary, the code-verified answer. The total prompt size is < 1k tokens per request.
- **Considered:**
  - **RAG over lesson prose + textbook excerpts** — retrieve relevant chunks at request time. Rejected: the corpus is small (5 lessons) and already structured at the source; "relevant context" is always exactly "this slot + this learner," which we inject directly. RAG adds infra and a new failure mode for zero retrieval benefit.
  - **Embeddings to cluster misconceptions automatically** — auto-discover what the learner is bad at instead of using a closed enum. Rejected: hand-authored tags + Elo + counters are more interpretable, more debuggable, and ship in a day. Embeddings buy "no taxonomy maintenance" at the cost of explainability — not the right tradeoff for an app whose USP is "the math is right."
  - **A vector DB like Pinecone / pgvector** — too much for the corpus size; nothing to retrieve.
- **Gaps / risks:**
  - If lesson prose grows 10x and we want a "find a relevant example from another lesson" feature, RAG might re-enter the picture. Until then it's solving a problem we don't have.
  - Closed misconception enum has to be extended manually for new patterns. Acceptable.

### D98 — Phase 2 implementation order: verification core → learner model → practice → AI assist → stretch

- **Status:** resolved (2026-06-25)
- **Chose:** Build in the order: (1) verification core (`src/lib/probability/exact.ts` + Monte-Carlo cross-check), (2) learner model write-path + UI panel, (3) Track 1 practice engine + first 6 templates, (4) `/api/hint` + client adapter + fallback, (5) stretch (`/api/teach`, offline vetted bank, session recap). Each step ends deployable; the AI-off path stays intact at every step.
- **Considered:**
  - **AI hint first, practice later** — the most visible "AI" surface. Rejected: builds the wow before the foundation, and the hint feature _depends_ on the solver (the function needs `solve()` to ground prompts). Verification core has to come first.
  - **Learner model last** — touch it only when needed for adaptivity. Rejected: the learner model write-path is tiny once we have the skill taxonomy in place, and shipping it early means the hint feature can use it on day one. Building it late means a refactor of `/api/hint` to add learner-summary context.
  - **Stretch features (teach-the-recruit, vetted bank) before the spine** — high risk, ambitious. Rejected: Friday is the Phase 2 deadline; the spine is the deliverable. Stretch ships only if ahead.
- **Gaps / risks:**
  - If verification core hits a snag, the whole chain slips. Mitigation: it's pure TS with a small surface (Fraction, nCr, nPr); risk is low.
  - Step 3 (practice) is the biggest single chunk. Mitigation: the templates can ship one at a time once the engine is built; CI gate catches buggy `solve()` early.
- **See also:** [`prd-phase2`](prd-phase2.md) §7 "Workflow," [`docs/design-iterations.md`](design-iterations.md) Phase 2 entry.

### D99 — Practice templates live in topic folders, not a flat `templates/` directory

- **Status:** resolved (2026-06-25)
- **Chose:** Runtime Track 1 practice templates live under `src/features/practice/templates/<topic>/<id>.ts`, with sibling tests in the same topic folder. WP-3 still owns one flat `TEMPLATES` registry in `src/features/practice/practiceEngine.ts`; topic folders are an implementation layout, not a new runtime contract.
- **Why now:** The curriculum-harvest pipeline produced enough credible future families (complements, conditional tables, Bayes/base-rate, independence, expected value, representation choice, etc.) that the original WP-4 flat path would become noisy almost immediately. This is a major maintainability decision that should be made before WP-4 agents start creating files.
- **Considered:**
  - **Keep WP-4's original flat layout** (`src/features/practice/templates/<id>.ts`). Simpler for the first six templates, but it fails the moment the problem bank grows beyond the initial surface and makes later moves/renames likely.
  - **One registry per topic** (`templates/complement/index.ts`, etc.). Rejected for v1: it adds a second registry layer and makes WP-6 serving more complex for no runtime benefit. A single `TEMPLATES` array already gives the engine the topic metadata it needs.
  - **Put generated/static problems beside runtime templates.** Rejected: Track 1 templates are executable source code; Track 2 vetted static problems are curriculum content and should live later under `src/content/practiceProblems/` if/when that bank ships.
  - **Keep review-generated JSON as seed content.** Rejected for CL-0001: the product should ship the parameterized template, not five fixed review examples. Review artifacts stay in `docs/curriculum-harvest/generated-problems/`.
- **Gaps / risks:**
  - WP-4's original spec and `spec-practice.md` both mentioned flat template paths; they must be updated before a WP-4 agent starts so agents do not fight the approved layout.
  - Existing in-progress WP-4 work may already have created flat files. If so, move them into topic folders and update only imports/registry paths; do not change C5/C6 behavior.
  - Topic folders reduce file clutter but do not eliminate the shared-registry edit conflict. Parallel WP-4 agents still coordinate when appending to `TEMPLATES`.
  - `testUtils.ts` remains at `src/features/practice/templates/testUtils.ts`, so sibling tests inside topic folders import it via `../testUtils`.
- **Implementer rules:**
  - Do **not** edit `wp-contracts.md` for this decision. C5/C6 are unchanged.
  - Do **not** change learner-model, XP, Firestore, or practice UI responsibilities. This is layout only.
  - Use exact taxonomy topic ids (`counting`, `long-run`, `complement`, `conditional`, `distributions`) for folder names where possible.
- **See also:** [`wp-4-layout-handoff`](specs/wp/wp-4-layout-handoff.md), [`problem-bank-layout-proposal`](curriculum-harvest/problem-bank-layout-proposal.md), [`spec-practice`](specs/spec-practice.md) §"First template families".

### D100 — Practice XP scales with difficulty (supersedes flat 5)

- **Status:** resolved (2026-06-25)
- **Chose:** A correct practice problem awards **difficulty-scaled XP** — Easy 3 / Medium 5 / Hard 8 / Expert 12 (`PRACTICE_XP_BY_DIFFICULTY`), bucketed from the problem's Elo difficulty (`difficultyBucket`) — still bounded by the existing `PRACTICE_DAILY_XP_CAP = 100`. Supersedes the original flat `PRACTICE_XP_PER_CORRECT = 5`.
- **Trigger:** the practice page showed a difficulty label next to a flat "+5 XP" badge — harder and easier problems paid the same, which read as broken and under-motivated challenge.
- **Considered:**
  - **Keep flat 5/correct** (original spec). Rejected: doesn't reward harder problems; the difficulty label next to it is misleading. (Alternative kept available: drop the per-problem XP badge instead — owner chose scaling.)
  - **Continuous XP as a function of Elo** (e.g. `round(elo/200)`). Rejected for v1: bucketed values are legible to learners and easy to reason about; revisit if buckets feel coarse.
  - **Remove the daily cap so hard grinding pays unbounded.** Rejected: the cap is what stops practice from dwarfing the lesson path (D43 rationale); scaling within the cap keeps both properties.
- **Gaps / risks:**
  - Difficulty buckets depend on each template's hand-rated `rate(params)`; a mis-rated template would mis-pay. Mitigated by the existing monotonicity/range tests and (later) D101 annotation + data calibration.
  - `grantPracticeXp` changes from a `wasCorrect: boolean` arg to an explicit `award: number` (caller computes `xpForDifficulty(elo)`); its tests update accordingly.
- **See also:** [`spec-practice`](specs/spec-practice.md) §"XP integration", D43 (practice XP cap policy), D101 (difficulty annotation), [`prd-phase2`](prd-phase2.md) F1.

### D101 — AI difficulty annotation is offline + baked-in (LLM as estimator, not runtime oracle)

- **Status:** resolved as a design choice (planned; not yet implemented) (2026-06-25)
- **Chose:** When we use an LLM to rate problem difficulty, it runs **offline in batch** (a `scripts/` job), is validated + human-reviewed, and the result is **baked in as a constant** the deterministic runtime reads. The LLM is an _estimator_ only; it never rates difficulty at request time.
- **Why allowed (vs. the "no LLM-served numbers" rule):** difficulty is an _estimate_, not a _correctness claim_. Served answers must come from `solve()` (verifiable); difficulty has no single verifiable truth, so an LLM prior is legitimate — provided it's offline, bounded (Elo `[700,2000]` + monotonicity), and human-gated.
- **Considered:**
  - **Runtime LLM difficulty call.** Rejected: non-deterministic serving, latency/cost, a model in the hot path — breaks the app's "no live model at runtime" posture.
  - **Data calibration first (IRT / item-Elo from attempt data).** Deferred, not rejected: the most principled approach, but it needs a user base we don't have yet. It becomes the _posterior_ on top of the LLM prior once usage grows. _(Owner: "I don't have many users, so #3 doesn't work yet — future work.")_
  - **Keep hand-written `rate()` only.** Fine for six families; doesn't scale or stay consistent as the harvested bank grows.
  - **Annotate the `rate()` formula instead of rendered instances.** Kept as a secondary option; primary is rating concrete instances (more reliable, transfers to the static bank).
- **Gaps / risks:**
  - LLM ratings can be miscalibrated/inconsistent; mitigated by single-batch relative rating + range/monotonicity guardrails + human spot-check.
  - Lives in the offline pipeline currently owned by the curriculum-harvest workstream — must be coordinated to avoid concurrent edits to the same files.
- **See also:** [`spec-ai-difficulty-annotation`](specs/spec-ai-difficulty-annotation.md), [`spec-practice`](specs/spec-practice.md) §"Adaptive serving", D100, [`prd-phase2`](prd-phase2.md) F6.

---

## Update Protocol

This document is updated whenever:

1. **A new decision is made** during the build that has at least one rejected alternative — add a new `D{n}` entry in the appropriate section. D-numbers are stable IDs assigned in resolution order, not section indices; within a section, entries are listed in ascending numeric order.
2. **An existing decision is changed** — strikethrough the old line, add a `**Updated:** YYYY-MM-DD` note and the new choice. Don't delete history. If the change is large enough to warrant a new entry, supersede with a new `D{n}` and cross-link both ways (see D7 ↔ D55 ↔ D31 for the canonical pattern).
3. **A risk in `Gaps / risks` materializes** — annotate with `**Realized:** YYYY-MM-DD — <what happened>` so we know which warnings were prescient and which were noise.
4. **We hit a Phase boundary** (Phase 2 Friday, Phase 3 Sunday) — sweep the doc, mark which gaps are now resolved, retired, or escalated.

Cross-link conventions:

- Use `**See also:** D## (one-line label)` at the bottom of an entry to point forward/sideways to related entries.
- When entry A supersedes entry B, strike through the superseded text in B with an `**Updated YYYY-MM-DD (superseded by D##):**` note, and have A name B in its own status line.
