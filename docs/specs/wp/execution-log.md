# Phase 2 — WP execution log

> Running record of the Phase 2 work-package build: what got built/merged, the design decisions made during execution, and every issue/bug hit. Kept in `docs/specs/wp/` (a folder only this workstream owns) to avoid write-races with the other agents currently editing the hot shared docs (`alternatives.md`, `design-iterations.md`, `issues.md`). **Promote the decision entries below into `alternatives.md` (D-numbers) once the working tree is quiescent.**

## Wave 1 — status (2026-06-25)

Built by four parallel Sonnet 4.6 subagents, each in an isolated git worktree (branched from `025a720`), then merged into the main working tree.

| WP | Built | Tests | Merged into main | Notes |
| --- | --- | --- | --- | --- |
| WP-0 | relocate `checkAnswer` -> `src/lib/` | 23 pass | yes (this session) | uncommitted in main |
| WP-T | RTL + jsdom harness | full suite green | yes (by another process, pre-merged) | union devDeps present |
| WP-1 | `exact.ts` + `testUtils` | 44 pass (incl. gate self-test) | yes (this session, copied from worktree) | decoupled from WP-0/WP-3 |
| WP-2 | `skills.ts` / `misconceptions.ts` + type/invariant edits | 9 pass | **HELD** | collides with live fill-text edits |
| WP-8 | Firestore rules + emulator tests | 15 pass | yes (by another process, pre-merged) | added a rules-test harness |

WP-1's verification gate is confirmed working: a deliberately-wrong `solve()` (returns 1/3 for a fair coin) is caught by the Monte-Carlo cross-check. This is the property the whole "the AI never serves a wrong answer" claim rests on.

## Major design decisions made during execution

> These were settled with the owner this session. Pointers to where each is already specced; all should also become formal D-entries in [`../../alternatives.md`](../../alternatives.md) when safe to edit it.

1. **Two-engine learner model.** Practice attempts drive an Elo **mastery** rating (Engine A); lesson first-attempts drive **exposure/struggle + misconceptions** (Engine B) and feed an in-lesson report card. **Lessons never move the mastery Elo.** Rationale: a correct answer right after being taught is weak evidence of durable mastery (performance != learning), and no-bail-out (D55) forces every completed lesson problem to end correct, so lesson "correctness" carries little mastery signal. Recorded in [`wp-contracts.md`](wp-contracts.md) C7, [`../spec-learner-model.md`](../spec-learner-model.md), and [`README.md`](README.md) open-question #7. **-> promote as a D-entry.**
2. **Practice is fully optional / Alcumus-style.** No forced practice gates to "earn" the next lesson; weak skills surface as invitations, never requirements (preserves autonomy/SDT). **-> promote as a D-entry.**
3. **Lesson report card (Engine B), WP-9.** Khan-style "what you nailed / what to watch" on the celebration screen, built purely from the session's first-attempt results + the in-repo taxonomy labels. No AI. Recorded in [`wp-9-lesson-report-card.md`](wp-9-lesson-report-card.md).
4. **Component-test harness adopted (WP-T).** Owner chose React Testing Library + jsdom over a pure-logic-only test approach for the UI WPs (reliability over speed). Recorded in [`wp-t-test-harness.md`](wp-t-test-harness.md). **-> promote as a D-entry.**
5. **`checkAnswer` relocated to `src/lib/` (WP-0)** so practice can reuse the grader without importing the lesson feature folder.
6. **Build process: one isolated git worktree per WP.** To prevent cross-agent collisions in a shared working tree, each WP was built by a subagent in its own worktree/branch, then merged deliberately. This is what surfaced the collision in the next section before any damage was done.

## Issues / bugs encountered

### I-WP-A — Cross-agent shared-working-tree collision (process issue; live)

- **What:** The main working tree contains concurrent uncommitted work from OTHER agents — a `fill-text` interaction (`FillTextVariant`, `interactionKind: 'fill-text'`), a new `sample-space` lesson, `FillText.tsx`, and the whole `curriculum-harvest` effort — alongside this workstream's output.
- **Findings:** WP-T and WP-8 were **already applied to main by another process** before this session merged anything (package.json already had the union of all three devDeps; `firestore.rules` already had the three owner-only blocks; `src/test/` + `firebase/*.test.ts` already present).
- **Conflict:** WP-2 must add `skills?` + `misconceptionByOption` into `types.ts` and skill-validation into `assertLessonInvariants.ts` — the **same two files the fill-text agent is editing**. Copying WP-2's versions would delete the fill-text work.
- **Resolution:** **WP-2 merge HELD** (owner decision) until the fill-text work commits/settles, then apply WP-2 as an additive 3-way merge (two optional fields + two validation checks) plus `skills.test.ts`. WP-1 (new files, zero overlap) was merged safely.
- **Risk:** shared-working-tree multi-agent edits are last-writer-wins. Mitigation going forward: keep new work in isolated worktrees; hold any merge that touches a file another agent is live in.

### I-WP-B — No existing Firestore rules-test harness (WP-8)

- The repo had no `@firebase/rules-unit-testing` setup. WP-8 added `@firebase/rules-unit-testing@^3.0.4` (v5 requires `firebase@^12`; repo is on `firebase@^10`) and a separate `firebase/vitest.config.ts` so rules tests don't pollute the main suite. This was a necessary deviation from the WP-8 "don't touch package.json" boundary (flagged by the agent).

### I-WP-C — firebase-tools / Java version mismatch (WP-8; CI follow-up)

- Global `firebase-tools@15` requires Java 21; this machine has Java 17, so the emulator refuses to start. Workaround: run rules tests via `npx firebase-tools@14` (warns about future deprecation but works on Java 17).
- **Action needed:** for CI, either pin `firebase-tools@14` for the rules-test job or upgrade the Java runtime to 21.

### I-WP-D — Curly-apostrophe parse error (WP-8; resolved)

- The editor inserted a Unicode right single quote (`'`) inside single-quoted JS string literals in the rules test descriptions, causing a parse error. Fixed by removing possessives. Watch item for other generated test/string files.

### I-WP-E — Pre-existing npm audit vulnerabilities (WP-T; informational)

- `npm audit` reports 15 vulnerabilities (12 moderate, 2 high, 1 critical), tracing to `node-domexception` (a transitive dep of `jsdom`). Pre-existing, not introduced by Phase 2 work. Untouched.

### I-WP-F — `MinimalTemplate` placeholder in testUtils (WP-1; cleanup follow-up)

- To stay decoupled from WP-3 (not yet built), `src/features/practice/templates/testUtils.ts` defines a local `MinimalTemplate<P>` structural type and injects `checkAnswer`/`answerToPayload` via opts. **Action:** replace `MinimalTemplate` with the real `Template` import from `templates/types.ts` once WP-3 lands.

## Wave 2 — status (2026-06-25)

| WP | Built | Tests | In main | Notes |
| --- | --- | --- | --- | --- |
| WP-3 | template engine + registry | 18 pass | yes (shared-tree agent) | `TEMPLATES` populated via `templates/index.ts` barrel + module-load push |
| WP-5 | two-engine learner model | 38 pass | yes (shared-tree agent) | `applyLessonExposure` proven not to move Elo |
| WP-4 | six template families | 49 pass | yes (shared-tree agent) | then reorganized into topic folders (below) |

After WP-3/WP-4/WP-5 landed, the full suite is **green: 43 files / 419 tests, typecheck exit 0** (the concurrent `sample-space` lesson also went green in the same window).

### WP-4 topic-folder reorganization (owner decision; D99)

WP-4 was authored flat (`templates/<id>.ts`) per its original spec, but the approved problem-bank direction ([`wp-4-layout-handoff.md`](wp-4-layout-handoff.md), D99) groups templates by topic. After WP-4 finished green, the six families + their tests were moved into topic subfolders:

```
templates/
  counting/      sum-of-two-dice(.test).ts, pick-k-of-n-unordered(.test).ts
  complement/    at-least-one-via-complement(.test).ts
  distributions/ k-heads-in-n(.test).ts
  conditional/   conditional-bayes-2x2(.test).ts
  long-run/      gambler-fallacy-mc(.test).ts
  index.ts, types.ts, testUtils.ts(.test)  (stay at root)
```

Import fixes: family files `./types` -> `../types`; test files `./testUtils` -> `../testUtils` (sibling template imports unchanged); `index.ts` import paths now point at topic folders; `practiceEngine.ts` import of `./templates/index` + `./templates/types` unchanged (both stay at root). `spec-practice.md` and `wp-4-template-families.md` already reference the topic-folder paths (updated by the curriculum workstream). Re-verified: typecheck clean, 419 tests green.

## Issues / bugs encountered (Wave 2)

### I-WP-G — WP-3 engine tests collided with WP-4 registry population (resolved)

- **What:** `practiceEngine.test.ts` (WP-3) was written assuming the global `TEMPLATES` registry starts empty, using a `registerStubs` helper that *appended* stub templates. WP-4 populates `TEMPLATES` with six real families at module-load (side-effect on import), so importing the engine in the test pre-filled the registry. Result: 5 `pickNextTemplate` tests failed (extra real templates in `counting`; `distributions` no longer empty so the "throws when no templates" test didn't throw).
- **Why it surfaced late:** the WP-4 agent ran only its own family + registry tests (8 files), not WP-3's engine test, so the collision wasn't caught until the full-suite check during the reorg.
- **Fix (test-only, no contract/runtime change):** made the `pickNextTemplate` tests hermetic — save + clear the global `TEMPLATES`, install only the stubs in `beforeEach`, restore the real templates in `afterEach`. Removed the now-unused `registerStubs` helper.
- **Lesson:** a module-load side-effect that mutates a shared exported array is fragile for unit tests. Acceptable for now; if it bites again, consider building `TEMPLATES` directly in `index.ts` (no push side-effect) or having engine fns take an injected registry.

### I-WP-H — `pick-k-of-n-unordered`: `int` answer + multiple-choice render (OPEN; for WP-6)

- **What:** this family's `solve` returns `{ kind: 'int', value: nCr(n,k) }`, but it renders as `multiple-choice`, and `answerToPayload` throws on `int` + `multiple-choice` (by C6 design). So WP-6 cannot grade this family via the normal `generateInstance` -> `answerToPayload` -> `checkAnswer` path. The vetting test deliberately uses `expectExactEnumeration` (which never calls `answerToPayload`) to sidestep this.
- **Status:** OPEN. Logged as README risk R2. **Recommended fix when WP-6 lands:** change this family's `solve` to return `{ kind: 'choice', optionId }` (the graded answer is the chosen option, not a typed integer), keeping the displayed count as the option label. WP-6 must not ship this family until resolved.

## F2 Stage 2 — free-response + 3-try AI hint ladder + scaled XP (LANDED)

Built directly on main after the practice-redesign agent landed (tree quiescent; no live collision). All additive; MVP still works with AI off.

- **S2.1 — XP (D100 + F2 decay).** `src/lib/practiceXp.ts`: difficulty-scaled base (`PRACTICE_XP_BY_BAND` Easy 3 / Medium 5 / Hard 8 / Extreme 12, cutoffs mirror `difficultyLabel`) + per-try decay (`practiceTryMultiplier`: 1 / ½ / ¼ / 0). `grantPracticeXp`/`practiceXpForResult` gained an optional `opts` (back-compat: no opts → flat 5, full credit, so all prior tests stand). `usePracticeXp.award(wasCorrect, opts?)` threads it through. Badge now shows the scaled base. **+12 tests.**
- **S2.3 — 3-try ladder.** `PracticeSession.tsx`: wrong on try 1–2 calls `useAiHint.requestHint` (computational), shows an escalating hint, lets the learner retry **without revealing**; the 3rd miss (or any correct answer) `resolve()`s — reveals the `DerivationCard` and records signals once. XP awarded only on a correct solve, decayed by the solving try (reveal = 0). `ground` = code-verified answer (MC → correct option label) + canonical steps. Degrades to authored `feedbackDefault` when AI off / any failure. **Test rewritten for the ladder.**
- **S2.2 — `number-fill` interaction kind (dormant, additive).** Added to the shared `InteractionKind`/`Variant` union + `NumberFillVariant`; grading in `checkAnswer` (exact int eq); validation in `assertLessonInvariants`; `{ value:number }` added to `AttemptPayload`; `answerToPayload` int → `{ value }`; `audit-feedback.ts` Record entry; new keyed dispatch adapter `renderers/NumberFillInteraction.tsx` wrapping F2-D's `NumberFill`. No template emits it yet → fully dormant. **Resolves I-WP-H's spirit:** count problems can now be free-response instead of MC. **+3 tests.**
- **Hosting scaffolding.** `vercel.json` (whole-app Vercel: `npm run build` → `dist`, SPA rewrite excluding `/api/`, `api/hint.ts` maxDuration 30) + `.env.example` AI vars (`VITE_AI_ENABLED`, `VITE_AI_API_BASE`, `OPENAI_MODEL`, `FIREBASE_PROJECT_ID`).

- **S2.4 — conceptual two-part serving (interleave).** Tagged the C-4 bank with `topic` + `skills`. New pure `conceptual.ts`: `parseAnswerString`/`gradeConceptualAnswer` (Part 1 graded in code, accepts any equivalent form — 1/2 = 2/4 = 0.5), `pickConceptualProblem` (topic-matched, anti-repeat), and `reasoningMultiplier` (flagged "why" halves XP; `REASONING_PENALTY` = 0.5; never penalizes on no signal / AI off). `PracticeXpOpts` gained `reasoningMultiplier` (clamped [0,1], only reduces). New `ConceptualRound.tsx` — self-contained two-part loop: code-grades the answer with the same 3-try ladder, sends `{answer, why}` to the conceptual `/api/hint` for reasoning-aware no-reveal hints, reveals the hand-authored `canonicalWhy`, and on resolve awards (penalty-adjusted) XP + records the per-skill/misconception signal. **Concept-checks do NOT move per-topic Elo** (stays anchored to the template stream). `PracticeSession` interleaves one matching-topic concept-check after every 4 template problems (falls back to templates when a topic has none). **Per the user's calls:** right-answer-but-flagged-reasoning earns partial XP; the "why" is required; answers accept any equivalent form. **+16 tests.**

**Verify (cumulative Stage 2):** `tsc` clean · `tsc --project api/tsconfig.json` clean · **643/643 tests** · `npm run build` clean.

**Still open:** Stage 3 (owner deploy + secrets + flip flag). Possible follow-up: convert select MC count templates to `number-fill` now that the kind exists; rate conceptual problems individually instead of the fixed Medium nominal.

## F2 Wave 2 — fallback no-reveal polish, free-response conversion, +6 families (LANDED)

- **No-reveal fallback:** audited every template `feedbackDefault`; all are already no-reveal (the `= 21` leak the user saw was a stale deployed bundle, not current code).
- **pick-k-of-n-unordered → free-response:** converted from multiple-choice to `number-fill` (solve now `{kind:'int'}`). Added `misconceptionByValue` to `NumberFillVariant` + a derivation branch in `PracticeSession.resolve`, so typing the permutation count `nPr(n,k)` still flags `ordered_vs_unordered` — the misconception signal the MC distractor used to provide. Test rewritten.
- **6 new code-verified families** (broaden topics + add Medium→Extreme difficulty so the adaptive engine has room above Easy):
  | family | topic | difficulty | interaction | vetting |
  |---|---|---|---|---|
  | `single-event-prob` | counting | Easy | fill-fraction | MC 5σ |
  | `permutations-arrange-k-of-n` | counting | Medium | number-fill | exact enumeration + render round-trip |
  | `without-replacement-two-draws` | conditional | Hard | fill-fraction | MC 5σ |
  | `geometric-first-success` | distributions | Med→Hard | fill-fraction | MC 5σ |
  | `binomial-at-least-k` | distributions | Hard→Extreme | fill-fraction | MC 5σ |
  | `expected-value-die-game` | long-run | Medium | fill-fraction | sample-mean vs exact E |
  Registered in `templates/index.ts` (now 12 base families + 30 verified seeds + 7 creative).
- **Deploy fixes (production):** `/api` import specifiers → `.js` (Vercel Node ESM transpiles per-file; `.ts`/extensionless crash at module load) + `vitest.workspace.ts` `extensionAlias` so tests still resolve. **JWKS URL fix** — Firebase ID tokens are verified against `securetoken@system.gserviceaccount.com` keys, not `oauth2/v3/certs` (the wrong set caused 401s). All env vars set in Vercel; OpenAI funded. AI hints confirmed live end-to-end.

**Verify (cumulative):** `tsc` + api `tsc` clean · **657/657 tests** · `npm run build` clean.

## Follow-ups / TODO

- [x] Merge **WP-2** once fill-text settles — DONE (additive 3-way; fill-text preserved; 312 tests green).
- [x] **WP-3 + WP-5 + WP-4** dispatched (shared-tree) and integrated; full suite 419 green.
- [x] WP-4 reorganized into topic folders (D99); WP-3/WP-4 registry test collision fixed (I-WP-G).
- [ ] **WP-6** must resolve I-WP-H (`pick-k-of-n-unordered` int->choice) before serving that family.
- [ ] **WP-2T** (lesson tagging + Engine-B wiring) and **WP-9** (report card) still HELD — they edit hot files (`LessonPlayer.tsx`, `CelebrationScreen.tsx`, content lessons) the curriculum/sample-space workstream touches; apply when those settle. WP-2T also needs WP-5 (now in tree).
- [ ] Promote decisions #1, #2, #4 above into formal `alternatives.md` D-entries when the tree is quiescent.
- [ ] Replace `MinimalTemplate` in `testUtils.ts` with the WP-3 `Template` import.
- [ ] Resolve the Java 17 / firebase-tools issue for rules-test CI.
- [ ] Confirm WP-T's `@testing-library/*` and `@firebase/rules-unit-testing` devDeps are reflected in `package-lock.json` (run `npm install` after the next clean merge).
