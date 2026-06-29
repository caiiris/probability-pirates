# Pascal — Consolidated Audit Summary (2026-06-28)

Synthesis of the 14 per-feature audits in this folder. Read the individual docs
for `file:line` detail; this is the cross-cutting picture and the prioritized
plan.

## The verdict in one paragraph

The codebase is **mechanically excellent and mathematically airtight** — `tsc`
clean, `eslint` clean, 1083/1083 tests, and across the content, practice,
wager, and misconception audits **zero math errors were found** (every
probability, fraction, count, and solver verified correct). The problems are
**not bugs in what runs** — they are **pedagogically central systems that were
built and tested but never plugged in**, plus a **half-finished curriculum**.
That is great news under deadline: the fixes are concentrated and additive.

## Theme 1 — The "built but unplugged" cluster (highest learning-science leverage)

Five separate audits independently traced to the **same root cause**: the lesson
player records a generic attempt and then stops. As a result, four
pedagogically-central, already-written, already-tested systems are **dead in
production**:

| Dead system | Why it matters (learning science) | Root cause |
| --- | --- | --- |
| **commit-once pretrieval** (lesson player P0) | The "predict → reveal" trap slots that open nearly every lesson can't continue on the intended wrong answer; they wrongly trip the no-bail-out gate. Inverts the signature *guess-before-learn* pedagogy. | `LessonPlayer` never reads `slot.commitOnce` / passes `allowContinueOnWrong` (`LessonPlayer.tsx:650-662`; prop ready at `LessonFooter.tsx:39`) |
| **Engine B** (learner model P0) | Lesson exposure/struggle/misconceptions never captured → "Introduced" panel empty, no durable retention signal | `recordLessonExposure` has no caller in `LessonPlayer.tsx` |
| **Lesson report card** (habit loop) | Celebration gives *reward without retrieval feedback* — "you nailed X / watch the gambler's fallacy" never shows | `buildReportCard` correct but never rendered by `CelebrationScreen.tsx` |
| **Lesson-sourced misconceptions** (misconception capture P1) | "You fell for the gambler's fallacy"-style confrontation never fires from lessons | same dead `recordLessonExposure` path |

Plus the content-side multiplier: **0% of live-lesson variants are
`skills:`-tagged** (0 of 59 problem variants; practice templates *are* tagged).
So even once Engine B is wired, lessons feed no skill signal until tagged.

**Conclusion:** one small wiring change in `LessonPlayer` + `CelebrationScreen`
revives four learning-science systems at once, and is a **prerequisite** for new
house-style lessons (which all use commit-once discovery traps).

## Theme 2 — The curriculum is half-finished (the "finish the lessons" task)

11 playable lessons inside a 34-node roadmap; **23 empty stubs**. The course is
authored through Unit 4 (Counting) and **stops** — every PRD-named payoff result
is a stub: **independent events, birthday paradox, the whole Conditional unit
(intuition, formula, trees, Bayes, Monty Hall), and the whole Expected Value
unit.** Reservoir `lesson4`/`lesson5` already contain *correct* Monty-Hall and
birthday content to harvest; `tree-diagrams`, `bayes-theorem`, and all of
Expected Value must be authored fresh.

## Theme 3 — Real bugs worth fixing (by severity)

**P0 / ship-blockers**
- **Auth: login-by-username is broken** — `signIn` reads owner-only `/users` while unauthenticated (`userService.ts:155` vs `firestore.rules:13`); fails exactly at the "come back tomorrow" moment, and throws outside try/catch so the form hangs on "Signing in…". (`01-auth.md`)
- **Progress: the abuse cap doesn't cap writes** — rules only bound the client-supplied `attemptNumber` value, so unbounded `stepAttempts` writes are possible; zero emulator coverage of `lessonProgress`/`stepAttempts` rules. (`05-progress-persistence.md`)

**P1 — correctness/trust**
- **Re-completion double-awards XP / lessonsCompleted / weeklyXp** (no completed-guard; `habitService.ts:200`); reachable via browser Back. Found independently by habit-loop *and* profile audits; also corrupts profile/leaderboard stats. (`06`, `08`)
- **Grid wrong-flash is global, not localized**; **tap-event shows no wrong feedback** — both violate the "only wrong selections flash" interaction contract. (`04-interactions.md`)
- **Home lies / dead-ends**: a progress read error renders Home as a brand-new user; post-completion offers no next action; locked-tap toast claims a false sequential unlock. (`07-course-path.md`)
- **Leaderboard weeklyXp is spoofable**; client can self-grant coins (cosmetic). (`14-engagement-economy.md`)
- **AI conceptual hint can leak the answer on try 3** (reveal guard disabled exactly then). (`11-ai-layer.md`)
- **Practice: gambler-fallacy template has a broken distractor** (2 of 3 flavors render duplicate options); adaptive serving window is centered *too hard* (~50%+ miss vs the 20–30% target). (`09-practice.md`)
- **Profile: avatar upload is entirely absent** though PRD AC4/AC6 advertise it. (`08-profile.md`)

**P2 — polish/spec-drift**: streak resets on westward travel (`streak.ts`); `streak-100` milestone dropped; pasted-decimal handling in numeric inputs; wager histogram N≥20 suppression removed; lesson copy typos (`multiplication-principle.ts:155` etc.); pervasive Gemini→OpenAI and "5 interaction kinds"/"6-lesson spine" doc drift.

## Prioritized plan for the remaining hours

**Tier 0 — unblock pedagogy (small, prerequisite for everything content):**
1. Wire `commitOnce` in `LessonPlayer`/`LessonFooter` (revives pretrieval).
2. Call `recordLessonExposure` on first-attempt + render `buildReportCard` on the celebration (revives Engine B + report card + lesson misconceptions).

**Tier 1 — finish the payoff lessons (the headline deliverable):**
3. Conditional unit: `conditional-intuition`, `conditional-formula`, `monty-hall` (harvest `lesson5`).
4. `independent-events` + `birthday-paradox` (harvest `lesson4`).
5. Expected Value unit: `expected-value-intuition`, `computing-expected-value`, `fair-games` (fresh).
6. Skill-tag every new (and ideally existing) variant as authored.

**Tier 2 — high-trust bug fixes if time allows:**
7. Re-completion double-award guard (one fix, clears habit + profile P1s).
8. Auth login-by-username (unauthenticated username→email lookup + rules test).
9. Localized grid/tap-event wrong feedback.

**Deferred (document, don't fix under deadline):** server-authoritative
economy/leaderboard (needs Cloud Functions / Blaze), avatar upload, full
practice difficulty recalibration, wager calibration redesign.
