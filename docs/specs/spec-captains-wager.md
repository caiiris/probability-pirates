# Spec: Captain's Wager (estimation game)

> A periodic, app-wide probability-estimation challenge: one prompt every three days, same prompt for everyone, single numeric guess, reveal-on-submit, with a distribution-style "where your guess sits" view and a Captain Pascal teach-back. Lives at `/wager` (its own sidebar destination, not a Home banner).
>
> The pedagogical purpose is to train **calibration** — a metacognitive skill that the lesson and practice loops can't reach directly — and to give us a long-running, shareable surface for probability-flavored Fermi-style problems.
>
> Companions: [`spec-practice.md`](spec-practice.md) (separate XP-policy + adaptive surface), [`spec-learner-model.md`](spec-learner-model.md) (wager attempts are *not* a learner-model signal), [`spec-social.md`](spec-social.md) (friends-mini-board is post-MVP), [`docs/alternatives.md`](../alternatives.md) §C-W D-entries.
>
> Work breakdown: [`wp/wp-captains-wager.md`](wp/wp-captains-wager.md) — 9 parallelizable build units (A-I) with frozen contracts.
>
> Status: **design locked, unbuilt.** Target: ship MVP after F2 (free-response practice) lands.

---

## 1. The problem this fills

The course path teaches probability *technique*. Practice drills *fluency*. Neither trains **calibration** — the metacognitive skill of putting a number on how confident you are, then learning from being wrong about your confidence. Calibration is:

- Research-validated as trainable: a 2024 RCT (Greenberg et al., *Futures & Foresight Science*) saw measurable reductions in overconfidence and improved Brier scores after under 30 minutes of training. The Good Judgment Project (Tetlock et al., 2014–2017) showed training, teaming, and tracking all improve forecasting accuracy and reduce overconfidence (~3% → 1%) across multi-year tournaments.
- The skill that *uses* probability rather than computes it. It bridges textbook problems and real-world reasoning.
- Famously under-trained: most people are systematically overconfident on hard items and underconfident on easy ones (the "hard-easy effect" — Lichtenstein, Fischhoff & Phillips, 1982).

There's also a product-side gap. The market has five active daily-estimation games (Estimania, Napkin, HowMany, Magnitudle, Fermi Questions) and none of them **teach** — the reveal is "here's the answer, share your score." A learning app with the same daily-loop ergonomics + a real teach-back is an unoccupied niche, and Brilliant — the closest analog — no longer ships a daily-problem feature.

## 2. Goals & non-goals

**Goals:**
- A low-friction, shareable surface that pulls learners back every few days.
- A real calibration-training instrument: numeric estimation → log-distance feedback → conceptual teach-back → over time, a personal calibration curve.
- A *learning* destination, not just an entertainment one — every reveal carries a 2-3 sentence probability-reasoning teach-back that names the concept and (where applicable) links to the relevant course-path lesson.
- Distribution-style feedback ("you beat 62% of wagerers") that motivates the *whole* user base, not only the top 5%.

**Non-goals:**
- A replacement for the practice loop. Wager is *generative + calibrative*; practice is *retrieval + fluency*. They feed different cognitive systems.
- A learner-model signal. Wager attempts do **not** update `model.mastery`, `model.misconceptions`, or the Elo ratings. They live in a separate store ([`spec-learner-model.md`](spec-learner-model.md) Engine A/B is unchanged).
- A daily mechanic. We are deliberately at 1-per-3-days, not 1-per-day (§4).
- A ranked global leaderboard. The leaderboard is intentionally distributional, not positional (D-CW3).

## 3. Grounding (learning science + product research)

### Why this *works* pedagogically
- **Calibration training has measurable effects in <1 hour** (Greenberg et al., 2024; Mellers et al., 2014). The effect persists across years in the GJP cohorts.
- **Generation effect** (Slamecka & Graf, 1978): producing an estimate is more memorable than reading one. Estimation is generation by construction.
- **Hypercorrection** (Butterfield & Metcalfe, 2001): high-confidence errors, once committed and then corrected, are more durably fixed than low-confidence ones. Estimation forces commitment → wrong answers (which most will be) are pedagogically valuable, not embarrassing.
- **Desirable difficulties + interleaving** (Bjork): wager prompts cycle topics (counting / conditional / base-rate / expected-value) — automatic interleaving across weeks.
- **Far transfer**: real-world quantities ("what % of NBA games go to OT?") build the bridge from grid problems to applied probability. Course path can't do this without becoming a trivia app.

### Caveats the design respects
- **Hard-easy effect**: question difficulty has to be tuned so the distribution of guesses isn't flat or trivial. Content authoring guideline in §10.
- **Recognition > production** for calibration training of *novices* (one LessWrong A/B with N=11): single-number estimation outperforms confidence-interval estimation as a learning instrument. Validates the point-estimate choice over CI (D-CW2).
- **Articulation ≠ understanding** (Ericsson & Simon): we do not ask "explain your guess" — we let the number itself be the data.

### Competitor scan (what shipped, what's missing)
| App | Format | Cadence | Scoring | Teach-back? |
|---|---|---|---|---|
| Estimania | 5/day | daily, midnight UTC | log-scale 0-100/Q | no |
| Napkin | 3/day | daily 3:14 PM | power-of-10 band (5/3/1/0) | no |
| HowMany | 1/day | daily | Wordle-style (6 guesses, ±20%) | no |
| Magnitudle | 1/day | daily | single guess, one score | no |
| Fermi Questions | 1/day | daily | confidence slider | minimal |
| Brilliant | n/a | (discontinued) | n/a | n/a |

Universal across the field: log-scale scoring, daily cadence, viral share, ranked or score-based leaderboards. Universally missing: a conceptual reveal that *teaches*. That's our wedge.

## 4. The mechanic (MVP)

**Cadence: one new wager every 3 days.** Not daily. Reasons:
- We are not a Wordle-volume product; daily content is unsustainable hand-authored.
- A 3-day window lets the histogram fill before each submitter sees it.
- Probability-flavored Fermi prompts deserve more time-per-prompt than general trivia.

**Submission window: open forever.** Once a wager opens, it never closes. A learner who finds the app on day 7 can still submit to wager #1. Trade-off (D-CW4): we lose the "drop-time" anticipation loop but gain inclusivity and reduce streak-anxiety for an audience whose primary loop is *lessons*, not the wager.

**Reveal: per-user, on submit.** When a learner submits their guess, *immediately*: they see the true answer, the histogram of all submissions so far, their guess marked on the histogram, and the Captain Pascal teach-back. There is no shared global "reveal moment." This is the inverse of Estimania/Napkin's drop-time-and-wait, and it's the right shape given the open-forever window (D-CW4).

**Answer shape: free-form numeric input.** Units are explicit in the prompt ("Answer in %", "Answer as a count", "Answer as a fraction 0–1"). The histogram x-axis is *log-scaled* even though the user enters a regular number — this is invisible to the user but matters for the visualization.

**Three flavors of prompt (rotation):**
1. **Real-world frequencies** — "What % of US weddings are between people who met online?" *(accessible, shareable; the majority of the bank)*
2. **Counting / combinatorics** — "How many 5-card poker hands beat a flush?" *(closer to the course material; satisfying when you can derive it)*
3. **Counterintuition classics** — "In a group of 23 randomly chosen people, what's the probability that at least two share a birthday?" *(the highest-pedagogy variant; harder to author well)*
4. **Bayesian / base-rate** — "10% of emails are spam. A filter catches 95% of spam and flags 5% of normal mail. If an email is flagged, what's the chance it's actually spam?" *(rare, hardest to write, most pedagogically valuable)*

Target launch mix: ~50% (1), 20% (2), 20% (3), 10% (4). Most-accessible content goes first so the early experience is "I had a number, I was off, I learned why."

## 5. Scoring

**Log-distance score, 0–100.** Matches the field convention:

```
logErr  = | log10(guess) − log10(trueAnswer) |
score   = max(0, round(100 × max(0, 1 − logErr)))
```

Worked examples:
| guess vs. true | logErr | score |
|---|---|---|
| exact | 0.00 | 100 |
| 2× off | 0.30 | 70 |
| 5× off | 0.70 | 30 |
| 10× off (1 OoM) | 1.00 | 0 |
| 100× off | 2.00 | 0 |

So order-of-magnitude correct ≈ ≥50; wildly off floors at 0 without punishing further (no negative scores). Sign-of-error doesn't matter (guess too high vs. too low scored identically).

For prompts where the true answer is a probability in `[0, 1]`, we use `% off in absolute terms` instead, with a softer falloff — log-distance is undefined near zero. Stored on each wager doc as `scoring: 'log' | 'abs'`.

**XP reward.** Submitting at all = **5 XP** (the participation bounty). Score ≥ 50 = **+5 XP**. Score ≥ 80 = **+10 XP**. No coin reward in MVP (coins are tied to streak + economy). XP is capped at this small amount because wager is generative, not retrieval — it's a different learning loop and shouldn't compete with practice for XP.

**No streak.** Deliberately. The lesson streak is the habit-loop primitive ([`spec-habit-loop.md`](spec-habit-loop.md)); adding a second streak fragments motivation. Wager attempts are summarized in `/profile` as a count and a calibration curve, not as a streak.

## 6. The reveal screen (where the learning lives)

After submit, in this order:

1. **The number reveal** — true answer in a large card with one-line source attribution ("Pew Research, 2023") and a small "How did we get this number?" expander.
2. **The distribution histogram** — log-scaled x-axis, ~20 buckets, height = count. The user's guess marked with a violet dot/line; the true answer marked with a green dashed line. A small annotation: "you beat 62% of wagerers" (proportion of submitted guesses with strictly larger `logErr` than the user's).
3. **Captain Pascal's teach-back** — 2-3 sentences that:
   - Name the concept ("This is the birthday paradox — independent pairings grow combinatorially, not linearly.")
   - Note the most common intuition error visible in the histogram ("Notice the spike near 8% — most people anchor on '23 out of 365'.")
   - When applicable, link to the course-path lesson: "Want to nail this kind of problem? → [Conditional Probability]"
4. **The user's running calibration line** — a tiny inline chart of their last 10 wagers' log-errors, with a trendline. Not a leaderboard. A personal-best.

The teach-back is **non-negotiable**. Without it, this is a guessing game; with it, it's a learning instrument. Content production budget for each wager includes the teach-back as a first-class artifact (§10).

**Note on reveal timing:** The reveal screen renders only after BOTH the placeholder create (step 1) AND the score-patch (step 4) of the two-step submit flow complete (see D-CW11). While `submitWager` awaits both steps, the UI shows a "Submitting…" state. If step 4 fails and the submission is self-healed by `ensureSubmissionScored`, the reveal may briefly display a placeholder score (0) before the real score lands — the `useUserSubmission` hook self-heals within one snapshot cycle.

## 7. Data model

### Firestore layout
```
/wagers/{wagerId}                              // wagerId is a slug like "2026-06-27-birthdays"
  - id: string
  - openAt: Timestamp                           // when the wager became active
  - sequence: number                            // 1, 2, 3, ... (for "Wager #14" display)
  - prompt: string
  - unit: 'percent' | 'count' | 'fraction'
  - tags: string[]                              // ['birthday-paradox', 'conditional']
  - flavor: 'frequency' | 'combinatorics' | 'counterintuition' | 'bayesian'
  - scoring: 'log' | 'abs'
  - relatedLessonId?: string
  - status: 'live' | 'archived'
  - createdBy: 'system'                          // future: community submissions

/wagers/{wagerId}/private/answer                 // gated: only readable after the user submitted
  - trueAnswer: number
  - source: string                                // citation
  - sourceUrl?: string
  - revealHeadline: string                        // 'It's the birthday paradox'
  - revealExplanation: string                     // 2-3 sentences
  - revealWorked?: string                         // optional fuller derivation (expander)

/wagers/{wagerId}/submissions/{uid}              // one per user per wager
  - uid: string
  - guess: number
  - logError: number                              // computed client-side on submit
  - score: number                                 // 0-100
  - submittedAt: Timestamp

/users/{uid}/wagerStats/summary                  // denormalized for /profile
  - totalSubmitted: number
  - averageScore: number
  - averageLogError: number
  - lastWagerId?: string
  - last10Scores: number[]                        // for the personal calibration sparkline
```

The split into `/wagers/{id}` (public) and `/wagers/{id}/private/answer` (gated) is what lets us hide the reveal from non-submitters even though the prompt is public.

### Histogram computation
On reveal, the client does a one-shot read of `/wagers/{id}/submissions` (collection query, ordered by submittedAt desc, limit 1000 for MVP) and bins client-side into log-spaced buckets. For wagers with >1000 submissions we sample; the histogram is statistical, not literal.

This is **not scalable to 100k users on a popular wager** — the read cost climbs. Phase 2 mitigation: pre-aggregate buckets into the wager doc via a Cloud Function on submission write (deferred — we don't have Cloud Functions in Phase 1).

### Security rules (sketch — codified later in `firebase/firestore.rules`)
```
match /wagers/{wagerId} {
  allow read: if request.auth != null;
  allow write: if false;                          // admin via console only

  match /private/answer {
    allow read: if request.auth != null
              && exists(/databases/$(db)/documents/wagers/$(wagerId)/submissions/$(request.auth.uid));
    allow write: if false;
  }

  match /submissions/{uid} {
    allow create: if request.auth.uid == uid
                  && !exists(/databases/$(db)/documents/wagers/$(wagerId)/submissions/$(uid))
                  && request.resource.data.keys().hasOnly(['uid','guess','logError','score','submittedAt'])
                  && request.resource.data.guess is number;
    allow read:   if request.auth != null
                  && exists(/databases/$(db)/documents/wagers/$(wagerId)/submissions/$(request.auth.uid));
    // One-time score-patch: allowed only while both score and logError are still 0
    // (the two-step submit flow's placeholder state). Only score and logError may change.
    allow update: if request.auth != null
                  && request.auth.uid == uid
                  && resource.data.score == 0 && resource.data.logError == 0
                  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['score','logError'])
                  && request.resource.data.score is number
                  && request.resource.data.logError is number;
    allow delete: if false;
  }
}
```

The "you can only read the answer/other submissions after you submit your own" pattern uses Firestore's `exists()` rule and is well-established. Cost is one extra rule-read per fetched doc — acceptable.

### Client-authoritative scoring (knownst limitation)
Score and `logError` are computed client-side and written by the user. Theoretically the user could submit a fabricated `score: 100`. This matches the rest of the app's client-authoritative posture (D-AS1, etc.) and is documented as a known limitation. If the wager later gates a real reward (badge, leaderboard rank), we'd move scoring server-side — explicit follow-up in §13.

## 8. UI surfaces

**Route: `/wager`.** Independent sidebar item with a bottle icon (or compass). Not a Home banner. The sidebar item carries an unread dot when a new wager is live and the user hasn't yet submitted.

**Three screens at `/wager`:**

1. **Bottle list** (entry point) — vertical list of wagers, latest at top. Each row: sequence + flavor tag + prompt preview + status chip (`Submit` / `Submitted, score 72` / `Archived`). Tapping a row opens the wager card.
2. **Wager card (pre-submit)** — prompt, unit, "Submit your wager" input field, an unobtrusive "How does this work?" link to a short explainer modal. No history, no score, no answer visible.
3. **Wager card (post-submit / reveal)** — the §6 reveal screen.

**`/profile` integration:** a small "Wagers" subsection showing `total submitted`, `average score`, and the last-10 calibration sparkline. No badge for MVP (post-MVP: "Wager #50", "Captain of the Compass" for sustained low log-error).

**No Home presence in MVP.** The user explicitly placed this as its own destination, not a Home card. Sidebar dot is enough discovery.

## 9. Cold-start (the real risk)

The histogram is the headline UX moment. With N=5 submissions, a histogram of 5 dots is *not* compelling. Two mitigations layered:

- **Hide histogram below N=20.** Until 20 people have submitted, the reveal shows the answer + teach-back + a placeholder card ("the distribution will fill in as more pirates wager"). User still gets the learning; we just don't show a thin histogram.
- **Seed with a "Captain's Archive" line** (post-N=20, before N=100). A subtle dashed overlay shows the distribution from the *previous* wager of the same flavor as context: "the last frequency wager had this shape." Helps new wagers look populated by leaning on prior ones.

We deliberately do *not* seed with synthetic guesses. False data corrupts the calibration training instrument.

## 10. Content production

**Author 30 wagers before launch** = 90 days of runway at 1-per-3-days. With Phase 2's free-response practice + AI assist landing, the author bandwidth is constrained; 30 is realistic.

**Authoring contract:** each wager is a `/wagers/{id}.json` file with the full payload (prompt, unit, true answer, source, reveal headline, reveal explanation, related lesson). A small `scripts/wager-validate.ts` validates the schema + sanity-checks the scoring band (the true answer should land near the middle of a plausible guess range).

**Quality bar (from the hard-easy effect):**
- Prompts must have an authoritative source (Pew, Census, official sports stats, peer-reviewed paper). No "approximate" answers.
- True answer should fall in a range where typical intuition is wrong by 2-10× — that's the sweet spot. Trivially-easy and trivially-hard prompts both fail.
- The reveal teach-back must name a specific probability concept; "interesting fact" prompts without a teachable concept get cut.

**Source-of-content phasing:**
- **Phase 1 (launch + 90 days):** 30 hand-authored prompts. Validated through internal review.
- **Phase 2 (after launch):** AI generation pipeline produces 3-5 candidate prompts/week using Phase-2 AI assist; human picks 1, edits the teach-back, ships. Each candidate is sanity-checked for source veracity by hand — LLM-generated probability claims are *not* trustworthy unsupervised.
- **Phase 3 (post-Phase-2):** community submissions — registered users can propose a prompt + source + teach-back, gated by editorial review. Cold-start hostile, deferred.

## 11. Acceptance criteria

1. A learner can read `/wagers/{id}` (prompt + meta) without having submitted.
2. A learner who has *not* submitted **cannot** read `/wagers/{id}/private/answer` or any other learner's submission, verified by emulator-suite rules tests.
3. A learner who *has* submitted can read the answer doc and the submissions subcollection for that wager.
4. Submission is **one-shot**: a second `create` to `/wagers/{id}/submissions/{uid}` is rejected. The score-patch `update` is permitted exactly once — only while both `score` and `logError` are still 0 (the placeholder state written by step 1 of the two-step submit flow). Once either field is non-zero, the update gate closes permanently.
5. Score is computed correctly per the §5 formula in a pure helper (`computeWagerScore(guess, true, scoring): { logError, score }`), unit-tested across edge cases (exact, 10×, 100×, near-zero with `abs` scoring).
6. The reveal screen renders within 500ms of submission acknowledgement (snapshot of submissions for the histogram fetched in parallel with the answer doc).
7. The histogram is **suppressed below N=20 submissions**, replaced by a placeholder; the "you beat X%" callout is also suppressed below N=20.
8. `/profile` shows `total submitted`, `average score`, and the last-10 sparkline; values match the wager submissions in Firestore.
9. The teach-back is present on every shipped wager. A wager missing `revealExplanation` fails the content validator and cannot be activated.
10. Wager XP rewards do **not** affect lesson XP, practice XP, or the streak counter — verified by attempt-recording tests.

## 12. Decisions & alternatives

- **D-CW1 — The teach-back is the product, not garnish.** Chose a 2-3 sentence Captain Pascal explanation as a mandatory artifact of every wager, including the concept name and (where applicable) a course-path lesson link. *Considered and rejected:* (a) just-show-the-answer (the universal pattern in Estimania/Napkin/HowMany) — turns the feature into a guessing game with no compounding value; (b) AI-generated reveal at runtime — quality risk on probabilistic claims is unacceptable, and offline-authored teach-backs are cheap relative to the prompt itself.
- **D-CW2 — Point estimate, not confidence interval.** Chose single-number input with log-distance scoring. *Considered:* (a) low/high bound (CI), the calibration-purest form. Rejected for MVP per the LessWrong A/B finding that CI calibration trains *less* effectively than multiple-choice/point-estimate calibration in novices, and per Fermi-Questions-style sliders being a higher-friction UI on mobile. CI capture is a Phase-2-or-later option if users mature into wanting it.
- **D-CW3 — Distribution-only leaderboard, no global rank.** Chose: histogram of all guesses + "you beat X%" callout. *Considered and rejected:* (a) Estimania-style global rank — motivates the top 5% and deflates everyone else (Dweck mastery/performance orientation); (b) friends-only mini-board — deferred to post-MVP per user direction; (c) all-time calibration leaderboard — interesting but adds N-dependent ranking that the small user base can't yet support.
- **D-CW4 — Open-forever submission window, no global reveal moment.** Chose: each wager stays open indefinitely once posted; reveal is per-user on submit. *Considered and rejected:* (a) hard 72-hour window with global reveal at close (most habit-forming, matches Wordle) — too punishing for an audience whose primary loop is *lessons*, fragments motivation; (b) hybrid (reveal at 72h but late submissions allowed off-leaderboard) — added complexity without commensurate engagement gain at our scale.
- **D-CW5 — Hand-authored content for launch.** Chose: 30 hand-authored prompts to launch (90-day runway), AI generation layered in Phase 2 with human review. *Considered and rejected:* (a) AI-generate from day one — LLM-generated probability claims are unreliable without source verification, and the teach-back is the differentiator (D-CW1) — outsourcing it weakens the product; (b) launch with just 5 prompts and decide — risks a stall in the first month while we author more.
- **D-CW6 — Log-distance scoring with `abs` fallback for probabilities near zero.** Chose: log-distance is the field-standard scoring and matches how Fermi reasoning works (order-of-magnitude correctness is the goal). `abs` fallback for probabilities-near-zero prompts because `log(0)` is undefined and a guess of "0.01% vs 0.001%" shouldn't be punished as 1 OoM off. *Considered and rejected:* (a) banded scoring (Napkin's 5/3/1/0) — too coarse; the histogram already does the qualitative job and we want a fine-grained `score` for the calibration trendline.
- **D-CW7 — Own route (`/wager`), sidebar item, not Home banner.** Chose per user direction: standalone destination with a sidebar entry and an unread dot. *Considered and rejected:* (a) Home card — would compete with the path's primacy and pull learners away from the lesson loop; (b) modal-only — no permanent home, harder to discover archived wagers.
- **D-CW8 — Wager data is NOT a learner-model signal.** Chose: wager submissions don't update `model.mastery`, `model.misconceptions`, or Elo. *Why:* the Wager bank is too small (one prompt every 3 days, ~10/month) to be a useful mastery signal, the question domain is *far* from practice templates (real-world Fermi vs. textbook setups), and conflating the two would distort the learner model. Calibration *is* the learning here — tracked separately as `wagerStats.averageLogError`, not as `mastery`.
- **D-CW9 — Histogram suppressed below N=20.** Chose: hide the histogram and the "beat X%" callout until at least 20 submissions exist for that wager. *Considered and rejected:* (a) show always — a histogram of 3 dots is anti-pedagogical (the user reads false signal into noise); (b) seed with synthetic guesses — corrupts the training instrument; once we tell users this is "everyone's guesses," it has to actually be that.
- **D-CW10 — One-shot submission, no edits.** Chose: a learner submits exactly once per wager and cannot change their guess. *Why:* the whole point is commitment — hypercorrection (Butterfield & Metcalfe) requires that the wrong answer be *believed* at submission time. Allowing edits before reveal would let users re-tune toward the histogram (which they can see for prior wagers); allowing edits after reveal turns it into a study-game. The score-patch `update` permitted by D-CW11 is an implementation detail of the scoring flow, not an edit to the user's commitment — `guess` is immutable in the update rule.
- **D-CW11 — Two-step submit flow: placeholder create → score-patch.** Chose: `submitWager` writes a placeholder `{ score: 0, logError: 0 }` first, then reads the (now-unlocked) answer doc, computes the real score, and patches the submission in a second transaction. *Trade-off accepted:* two Firestore round-trips per submit for a clean rules story — the `exists()`-based no-peeking gate is preserved without any cloud-function dependency. *Self-healing:* if the score-patch transaction fails (network), `useUserSubmission` detects the placeholder state and calls `ensureSubmissionScored` to retry, making the system robust. *Considered and rejected:* (a) public `trueAnswer` (defeats no-peeking — users could read the answer before submitting by querying the field directly); (b) Cloud Function that writes score server-side (Cloud Functions are out of scope for Phase 1); (c) passing `trueAnswer` from the caller (circular — caller cannot read the gated doc before the submission exists).

## 13. Out of scope (now), tracked

- **Friends mini-leaderboard.** Post-MVP per user direction. Adds a per-wager view of friends' submissions; ties into the existing follow graph.
- **All-time calibration leaderboard.** Sorted by rolling 10- or 30-wager average log-error. Mastery-orientation framing.
- **Confidence intervals (low/high) instead of point estimate.** Promote to "expert mode" once a user has submitted N≥10 wagers and we have evidence they're calibrated.
- **Server-side scoring (anti-cheat).** Required if wager outcomes ever gate real rewards (badges, social signaling). Today's client-authoritative posture is fine.
- **Pre-aggregated histograms in the wager doc.** Required when popular wagers cross ~1000 submissions and the on-read query becomes expensive. Needs a Cloud Function or batch job.
- **Community-submitted wagers.** Phase 3, after we've validated the loop and have the editorial bandwidth.
- **Topic-themed weeks.** "All counterintuition wagers, next 5 prompts." Content-side decision, not a feature.
- **Push notifications when a new wager drops.** Out of scope per D27 (in-app reminders only) in `alternatives.md`.

## 14. Phasing

- **Phase W1 (MVP):** §4 mechanic + §5 scoring + §6 reveal (with teach-back) + §7 data model + §8 UI surfaces + §9 cold-start + §11 acceptance criteria. Ships with 30 hand-authored wagers.
- **Phase W2:** Friends mini-board (uses social graph from `spec-social.md`). All-time calibration leaderboard. AI-generated wager candidates with human review (uses Phase-2 AI assist infra).
- **Phase W3:** Server-side scoring + pre-aggregated histograms (when usage warrants). Community submissions pipeline.
- **Phase W4:** Confidence-interval "expert mode." Themed weeks. Wager-derived badges in the medallion grid.
