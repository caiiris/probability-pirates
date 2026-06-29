# Audit 11 — The AI Layer (F2 hint ladder, F4 teach, F6 difficulty)

> Pre-deadline read-only audit of Pascal's AI architecture: safety guarantees,
> prompt grounding, fallback behavior, security (token verification / no key or
> SDK in client / no PII), and learning-science quality of the hints.
>
> Scope (files): `api/hint.ts` (+`hint.test.ts`), `api/_lib/callModel.ts`,
> `api/_lib/prompts.ts`, `api/tsconfig.json`; `src/features/ai/useAiHint.ts`
> (+test); `src/features/practice/PracticeSession.tsx` +
> `ConceptualRound.tsx` (the two live callers); `src/features/flags/*`;
> `vercel.json`; `.env.example`.
>
> Ground truth taken as given (not re-run): `tsc` clean (incl. `api/tsconfig`),
> `eslint` clean, `vitest` 1083/1083 (`api/hint.test.ts` = 75 tests).
> Orientation: `docs/prd-phase2.md` §3/§4/§9.2/§9.4/§9.5/§11,
> `docs/specs/spec-ai-assist.md`, `spec-ai-tutor.md`,
> `spec-ai-difficulty-annotation.md`, `docs/specs/wp/execution-log.md`.

---

## 1. Overview — architecture & what's live vs planned

**Where AI runs.** Exactly one runtime model call path: a single Vercel
serverless function `POST /api/hint` (`api/hint.ts`). The Vite client never
imports a model SDK and never holds a key; it calls the function over `fetch`
with a Firebase ID token. The function verifies the token, rate-limits, builds a
grounded prompt, calls OpenAI via plain `fetch` (`api/_lib/callModel.ts`),
schema-validates the JSON response, and returns it — falling back to `503
{ fallback: true }` on any error so the client renders authored copy.

```
client (PracticeSession / ConceptualRound)
   └─ useAiHint.requestHint()           src/features/ai/useAiHint.ts
        ├─ gate: VITE_AI_ENABLED==='true' else FALLBACK (no network)
        ├─ attach Firebase ID token (Authorization: Bearer …)
        └─ POST {base}/api/hint
              └─ api/hint.ts handler
                   1. verifyFirebaseToken()  (jose + Google securetoken JWKS)
                   2. checkRateLimit()        (per-uid 30/5min, per-IP 60/5min)
                   3. parseAndValidateBody()
                   4. build{Computational,Conceptual}Messages()  api/_lib/prompts.ts
                   5. callModel()             api/_lib/callModel.ts (fetch → OpenAI)
                   6. validateModelOutput()   (schema + no-reveal guard)
                   7. 200 JSON  |  401 | 429 | 400 | 503 {fallback:true}
```

**Provider note (doc drift).** PRD-phase2 §3.5/§6 and most of `spec-ai-assist`
still say **Gemini** / `GEMINI_API_KEY`. The shipped code uses **OpenAI**
(`api.openai.com/v1/chat/completions`, `OPENAI_API_KEY`, `OPENAI_MODEL`),
per the `spec-ai-assist` "Refinement (2026-06-25)" note and the execution log
("OpenAI funded… AI hints confirmed live end-to-end"). The architecture is
provider-agnostic behind `callModel`; the docs simply lag the code.

**Status of the Phase-2 AI features:**

| Feature | Status | Evidence |
| --- | --- | --- |
| **F2 — personalized hint / 3-try ladder** (computational + conceptual) | **LIVE** | `api/hint.ts`, called from `PracticeSession.tsx:339` (computational) and `ConceptualRound.tsx:87,145` (conceptual). Execution log: "AI hints confirmed live end-to-end." |
| **F4 — "teach the recruit"** | **NOT BUILT** (planned) | No `api/teach.ts`, no `teachService.ts`, no teach UI, no rubric/transfer-problem anchor. Grep for `Teach the recruit` / `api/teach` / `/teach` in `src/` → 0 matches. Its *engine* (LLM-maps-free-text-onto-closed-rubric, never judge) is, however, live inside F2 **conceptual** mode. |
| **F5 — offline vetted bank / session recap** | NOT BUILT (planned) | Out of this audit's file set; no runtime path. |
| **F6 — AI difficulty annotation** | **OFFLINE / PLANNED** | `spec-ai-difficulty-annotation.md` says "planned"; no `scripts/practice/annotate-difficulty.ts`. By design it never runs at runtime. |

So the deliverable AI surface is **F2 only**, and F2 is genuinely live with both
its computational and conceptual modes wired into the practice loop.

---

## 2. What works (with AC citations)

**Security — token verification (PRD §9.5 #3, spec-ai-assist AC #3).**
`verifyFirebaseToken` (`api/hint.ts:60-71`) uses `jose` against the **correct**
Firebase JWKS — `securetoken@system.gserviceaccount.com`
(`api/hint.ts:49-50`), explicitly *not* `oauth2/v3/certs` (a documented past
401 bug, execution log "JWKS URL fix"). It checks **issuer**
(`https://securetoken.google.com/<projectId>`), **audience** (`<projectId>`),
**algorithm** (`RS256`), and a non-empty `sub` claim. Missing header → `401`
(`:333`); failed verify → `401` (`:341-343`). Tests cover all three
(`hint.test.ts:546-571`, `:588-601`). This is correct and complete.

**No model SDK in the bundle (PRD §9.5 #4, spec-ai-assist AC #1).**
`package.json` has **no** `openai` / `@google/generative-ai` / equivalent.
`callModel` calls the REST endpoint over `fetch` only (`callModel.ts:36`). The
only crypto/JWT dep (`jose`) is imported solely by `api/hint.ts` (server-side);
grep for `jose|OPENAI|GEMINI|generativelanguage|api.openai.com` in `src/` → 0
matches, so none of it reaches the client bundle.

**No key reachable in the client (PRD §9.5 #4, §4 NN #5).** The key is read as
`process.env.OPENAI_API_KEY` (`callModel.ts:26`), un-prefixed, server-only;
Vite only exposes `VITE_*`. `.env.example` documents this explicitly
("DO NOT prefix with VITE_ — that would bundle the secret"). The client only
sees `VITE_AI_ENABLED` and the optional `VITE_AI_API_BASE` origin.

**No PII in the request body (PRD §9.5 #5, NN #6).** The `HintRequest`
(`useAiHint.ts:8-26`) carries `mode`, `tryNumber`, `problem`, `learnerAnswer`,
`ground`, `learnerSummary` (skill **ids** — `topWeakness`/`recentMisconception`),
`diagnosis`, `history`, `solutionOutline`. **No uid, email, or name.** `uid`
is derived server-side from the verified token and used **only** as a
rate-limit key (`hint.ts:357`); it is **never logged** (the handler has no
logging at all, and `callModel` never logs the payload). PII posture is clean.

**Grounding — graded number always from code, never the model (PRD §3 NN #1,
spec-ai-assist NN #2).** The correct answer is computed by the template's
`solve()` **client-side** (`generateInstance` → `instance.answer`) and the
graded check is `checkAnswer` (client code, `PracticeSession.tsx:318`). The
model never emits a graded number: on the **reveal** turn the canonical solution
shown to the learner is the client-side `DerivationCard`
(`PracticeSession.tsx:446-450`; `ConceptualRound.tsx:198-202`), **not** model
prose. Even better than spec: in the live computational flow the 3rd miss
resolves locally (`PracticeSession.tsx:330-333`) and **never calls the model at
all**, so the model literally never states the computational answer.

**Hint safety — answer withheld on computational hint turns (PRD §9.2 #2,
spec-ai-assist AC #5, AI-E4).** On tries 1–2 the computational prompt **omits
the answer entirely** (`prompts.ts:171` — `...(noReveal ? [] : [Correct answer…])`)
and forwards only a **number-redacted** method outline (`▢`) built client-side
by `redactNumbers` (`PracticeSession.tsx:135-137,260`). The full numeric
`canonicalWhy` is sent in the request body but is **never inserted into the
computational prompt** (it appears nowhere in `buildComputationalMessages`). So
for the dominant (computational) path the model *cannot* leak the graded number
because it is never told it — a structural guarantee stronger than a prompt rule.
Backstopped by a post-response `looksLikeReveal` regex guard on tries < 3
(`hint.ts:232-265`).

**3-try ladder (spec-ai-assist refinement AC #2).** `MAX_TRIES = 3`
(`PracticeSession.tsx:140`): wrong try 1–2 → escalating no-reveal hint + retry;
3rd miss → reveal bank solution, 0 XP. Per-try escalation is encoded in the
prompt (`prompts.ts:121-125`) and within-problem hint history is threaded so
try 2 builds on try 1 (`prompts.ts:159-165`, `PracticeSession.tsx:345-348`).

**Conceptual mode = LLM-as-classifier, not judge (PRD §3 NN #4,
spec-ai-assist AC #3).** Part-1 answer is **code-graded**
(`gradeConceptualAnswer`, accepts equivalent forms); Part-2 "why" is
**classified against a closed set** — `validateModelOutput` rejects any
`classification` outside the four-value enum and any `misconceptionKey` outside
the problem's authored set (`hint.ts:277-293`), and nulls a stray key when the
class isn't `misconception` (`:295-297`). The model maps onto a fixed rubric; it
never open-ends a grade. This is exactly the F4 "student-not-judge" mechanism,
shipped inside F2-conceptual.

**Prompt-injection containment (spec-ai-assist §Security, AI-E5/E7).** All
learner free text is wrapped in explicit DATA delimiters
(`prompts.ts:80-85`, used at `:176` and `:251`) with a system-prompt instruction
to treat it as data, not instructions (`prompts.ts:129,228`). Output is
schema-validated before use; off-schema → `503` fallback.

**Fallback / AI-off (PRD §9.2 #5, NN #2, AI-E1/E2/E3).** `useAiHint` short-
circuits to `FALLBACK` **with no network call** when `VITE_AI_ENABLED !== 'true'`
(`useAiHint.ts:55`), when there's no signed-in user (`:61`), on token failure
(`:67`), on `fetch` throw (`:88`), on any non-2xx incl. 429/503 (`:92`), and on
malformed/short response (`:100-110`). It **never throws** to the caller
(`useAiHint.test.ts:226`). Callers then render authored copy: computational →
`variant.feedbackDefault` (`PracticeSession.tsx:341-342`); conceptual →
a static "re-check…" line (`ConceptualRound.tsx:153-157`) with the hand-authored
`canonicalWhy` on reveal. The lesson/practice loop stays fully completable with
AI off. `.env.example` ships `VITE_AI_ENABLED=false` (default off).

**Structured output enforced (spec-ai-assist AC #7).** `callModel` requests
`response_format: { type: 'json_object' }` (`callModel.ts:32-34`);
`validateModelOutput` JSON-parses and validates shape; parse/schema failure →
`null` → `503` fallback (`hint.ts:255-260,424-428`).

**Rate-limit safe (spec-ai-assist AC #8).** Per-uid 30/5min + per-IP 60/5min
(`hint.ts:75-105,357-364`); 429 → client fallback, no error toast
(`useAiHint.test.ts:199`).

---

## 3. What's missing / incomplete

- **F4 "teach the recruit" — not built (PRD §9.4: all 5 ACs unmet).** No
  `api/teach.ts`, no client surface, no `{ coveredPoints, missingPoints,
  misconceptionFlags, followUpQuestion }` endpoint, and — directly answering the
  audit question — **the rubric/transfer-problem correctness anchor for F4 does
  not exist**. `spec-ai-assist` lists `api/teach.ts` as planned. *Mitigant:* F4's
  hard part (closed-rubric mapping, LLM-not-judge) is already proven and live in
  F2-conceptual, so F4 is mostly a new UI + a transfer-problem wiring on top of
  an existing engine — not greenfield. Status: **stretch, deferred.**
- **F5 (offline bank + recap) — not built.** Planned; no runtime path.
- **F6 (difficulty annotation) — offline & not yet implemented.** By design it
  never touches runtime; no script exists yet. Correct posture, just unbuilt.
- **AC §9.2 #4 wording not literally met (grounding location).** The AC says
  "the function computes `solve()` **server-side** first." In practice `solve()`
  runs **client-side** and the verified answer/outline are passed in the request
  `ground` (`PracticeSession.tsx:248-261`); the server **trusts** `ground`
  (`hint.ts:174-175,385-407`) and never recomputes. The *non-negotiable* (no
  model-served number) still holds because grading + reveal are client code, but
  the literal "server runs the solver" property is not implemented. See P2 below.
- **Few-shot exemplars (spec-ai-assist §"Few-shot strategy") — not implemented.**
  The prompts are hand-written rules, no curated in-voice positives/negatives.
  This is an explicitly-optional enhancement, not a gap against an AC.
- **Doc/feature naming mismatch in the audit brief.** The brief frames
  `RemoteFlagsProvider`/`remoteFlagsConfig` as "`VITE_AI_ENABLED` gating." In
  fact those files gate **lesson availability** (`available_lesson_ids`) and do
  **not** touch AI; AI gating is a **build-time** `import.meta.env.VITE_AI_ENABLED`
  check inside `useAiHint.ts:55`. Two independent mechanisms. (Note, not a bug.)

---

## 4. Bugs & risks (file:line, P0/P1/P2)

Severity rubric (per brief): any token-verification gap / key or PII leak = P0;
answer-leakage in hint mode = P1 unless structurally prevented; fallback gaps.

### P0 — none found.
Token verification is correct (JWKS, issuer, audience, RS256, sub; 401s).
No key or model SDK reaches the client. No uid/email/name in the request body;
uid is never logged. The headline safety guarantees hold.

### P1

- **P1-a — Conceptual hint gives the model the answer; leak guard is shallow and
  is fully disabled on the reveal turn.** Unlike computational mode, the
  conceptual prompt **always** includes the correct answer, even on tries 1–2,
  as "context only; do NOT reveal" (`prompts.ts:247`). The only programmatic
  backstop is the `looksLikeReveal` regex (`hint.ts:232-243`), which matches just
  5 English stock phrases ("the answer is", "the solution is", …). A model can
  trivially leak without those phrases ("You should get 1/2", "It's one-half").
  Worse, the guard is bypassed entirely when `tryNumber === 3`
  (`hint.ts:265`), and `ConceptualRound.finalize` calls the model with
  `tryNumber: 3` (`ConceptualRound.tsx:90`) and renders `res.text` as the verdict
  (`:105,229,243`). So on the conceptual reveal turn the model holds the answer,
  has no regex guard, and its prose is shown.
  *Real-world blast radius is limited* (the conceptual "answer" is usually a tiny
  fact like 1/2 that the client reveals via `canonicalWhy` anyway, and Part-1 is
  code-graded), so this is **answer-leak of a low-stakes value**, not a graded-
  number leak — hence P1, not P0. **Fix:** strengthen `looksLikeReveal`
  (or drop the raw answer from the conceptual prompt and pass only
  rubric/misconceptions), and keep a reveal guard even on `tryNumber 3` for
  conceptual since conceptual *never* legitimately reveals.

### P2

- **P2-a — `looksLikeReveal` is a brittle, English-only allow-by-default filter
  (`hint.ts:232-243`).** Even on computational tries 1–2 it would miss a numeric
  leak phrased without the 5 patterns. Computational is saved by the *structural*
  withholding of the answer (P-good above), so this is P2 there; it becomes the
  P1-a problem in conceptual. Recommend a stronger check (e.g. detect the
  literal `ground.answer` string / its reduced-fraction & decimal forms in the
  output) shared by both modes.
- **P2-b — Server trusts client-supplied `ground` (no server-side `solve()`).**
  `parseAndValidateBody` accepts `ground.answer`/`solutionOutline` verbatim
  (`hint.ts:174-175,206-208`). A tampered client could send a wrong "ground."
  Impact is bounded (model never reveals it to the learner on hint turns; reveal
  & grading are client-side bank content), so no incorrect *graded* answer can be
  served — but it deviates from PRD §9.2 #4 and means the server has no
  independent ground truth. Accept-with-note, or (better) recompute/verify on the
  server for defense-in-depth.
- **P2-c — In-memory rate-limit buckets are per-instance and unbounded
  (`hint.ts:86-87`).** On Vercel each warm instance has its own `Map`, so the
  effective limit is `N_instances × limit` and resets on cold start (weak abuse/
  cost control — spec-acknowledged as "fine for a personal launch"). The Maps
  also never evict expired keys, a slow memory creep on a long-lived instance.
  P2 / acceptable for launch; revisit with a shared store (e.g. Upstash) if
  traffic grows.
- **P2-d — `Access-Control-Allow-Origin: *` (`hint.ts:314`).** Any origin can
  invoke the endpoint. Mitigated by the mandatory Firebase token (a caller still
  needs a valid project token), but combined with no origin allow-list it widens
  the abuse surface. Consider restricting to the known site origin(s).
- **P2-e — Documentation drift: Gemini vs OpenAI.** PRD-phase2 §3/§6, the
  architecture diagram, and parts of `spec-ai-assist` still name Gemini /
  `GEMINI_API_KEY`; the code is OpenAI. Harmless to runtime but misleads future
  maintainers (and an auditor verifying "no key in bundle" might grep the wrong
  var name). Reconcile the docs (a follow-up D-entry is already flagged in the
  refinement note).
- **P2-f — No request-size bound on free-text fields.** `learnerAnswer`/`why`
  are arbitrary-length (`hint.test`-validated for shape, not size); `history`
  capped at 2 and `solutionOutline` at 10, but the strings themselves are
  unbounded → token-cost / abuse vector. Minor; add a length clamp.

---

## 5. Pros / Cons

**Pros**
- Clean separation: one function, one provider seam (`callModel`), one client
  hook. Swapping providers is a one-file change.
- The single most important guarantee — *no model-served graded number* — is
  enforced **structurally** for the computational path (answer never enters the
  prompt; reveal/grade are client code), not merely by a system-prompt plea.
- Fail-safe by construction: every error/quota/parse/flag-off path collapses to
  the same authored fallback, and the hook never throws. AI is genuinely
  additive — the app is fully usable with `VITE_AI_ENABLED=false`.
- Token verification is textbook-correct (right JWKS, issuer+audience+alg+sub),
  and the past `oauth2/v3/certs` bug is fixed and commented to prevent regression.
- Strong privacy: no uid/email/name in the body; uid server-only and unlogged.
- Genuinely good test coverage of the safety-critical units (75 tests on
  `api/hint.ts`: token, rate-limit, body/output validation, no-reveal guard,
  handler status codes).
- Conceptual mode delivers the high-value "right answer, wrong reasoning"
  diagnostic via a closed-set classifier — the F4 engine, already shipping.

**Cons**
- The post-hoc answer-leak guard (`looksLikeReveal`) is shallow and English-only,
  and it's the *only* programmatic protection in conceptual mode (where the model
  is handed the answer). P1-a.
- Grounding is client-trusting (no server `solve()`), so the server has no
  independent source of truth and the PRD's literal AC isn't met.
- Rate limiting is best-effort (per-instance, unbounded map) and CORS is `*`.
- Marquee stretch features (F4 teach, F5 recap) are unbuilt; the F4 transfer-
  problem anchor doesn't exist.
- Heavy doc drift (Gemini→OpenAI) across PRD/spec.

---

## 6. Learning-science assessment

**Does the hint force retrieval of a *corrected idea* without revealing the
answer?** Largely **yes**, and this is the layer's strongest pedagogical move:

- **No-reveal, by design.** Computational hints on tries 1–2 never see the
  number; the model is told to give "the single most useful thing," one sentence
  on try 1, "name what went wrong and point at the next step (do not finish it)"
  on try 2 (`prompts.ts:115-125`). The learner must still generate the answer —
  the scaffold-and-fade ladder matches Vygotsky ZPD / spec-ai-tutor's
  "least help that unblocks."
- **Grounded in *what the learner actually did*.** The hint is anchored to an
  authored, code-derived diagnosis of the *current* wrong answer
  (`buildDiagnosis` → `feedbackByWrong*` + matched misconception fix,
  `PracticeSession.tsx:104-126`) and to a number-redacted method outline so the
  model aims at the **first diverging step** rather than re-teaching what the
  learner already got (`prompts.ts:120,148-156`). The model rephrases the
  diagnosis ("rephrase, never quote", `prompts.ts:141`); it does not invent one.
- **Cognitive-debt avoidance.** The explicit anti-pattern instructions —
  "Sound like a tutor talking, NOT a worksheet… DO NOT write a multi-part
  explanation / numbered list / template" (`prompts.ts:115-116`) and the "do NOT
  invent a misconception" rule (`:119`) — push toward a nudge that makes the
  learner think, not a spoon-fed walkthrough. Worked-example support still
  arrives, correctly *after* the struggle (reveal `DerivationCard` only at
  resolution).
- **LLM-as-student-not-judge.** Conceptual reasoning is *classified* against a
  closed rubric + misconception set with Part-1 correctness in context — never an
  open-ended holistic grade (`prompts.ts:208-231`, validated `hint.ts:277-297`).
  This directly honors the notes' warning that LLMs over-praise free text. The
  "right number / shaky why" penalty (`reasoningMultiplier`,
  `ConceptualRound.tsx:101`) operationalizes "performance ≠ understanding."

**Where the learning science is weaker / opportunities:**
1. **The conceptual reveal can hand the learner the answer-prose (P1-a).** A leak
   on the reveal turn short-circuits retrieval. Fix the guard / withhold the raw
   answer from the conceptual prompt.
2. **Hint quality is unverified at the *sentence* level.** Per spec-ai-tutor's
   honest-limit framing, the conversational layer is best-effort; there is no
   check that a *no-reveal* hint is actually *correct* (it could mis-aim on a
   learner's odd tangent). The redacted-outline grounding bounds but doesn't
   eliminate this. Opportunity: the planned few-shot in-voice positives +
   contrastive negatives (spec-ai-assist §Few-shot) would both lift voice and
   reinforce no-reveal/no-lecture.
3. **No spacing/interleaving signal in the hint itself.** `learnerSummary`
   (top weakness + recent misconception) is plumbed into the prompt
   (`prompts.ts:87-92`) — good — but is only populated opportunistically.
   Opportunity: consistently feed the learner-model summary so hints connect
   today's slip to the learner's standing weakness (the "queued for tomorrow"
   loop the PRD walkthrough promises).
4. **F4 (teach-the-recruit) is the highest-leverage retrieval mode (protégé
   effect) and is unbuilt.** The engine exists; building the surface would add
   the biggest *new* learning win for the least new risk.

---

## 7. Prioritized recommendations

1. **(P1) Harden conceptual answer-leak protection.** Either drop the raw
   `ground.answer` from `buildConceptualMessages` (pass only rubric +
   misconceptions, which is all the classifier needs) **or** strengthen
   `looksLikeReveal` to detect the literal answer string and its equivalent
   fraction/decimal forms, and **keep the reveal guard active for conceptual
   `tryNumber 3`** (conceptual never legitimately reveals). `hint.ts:232-265`,
   `prompts.ts:247`, `ConceptualRound.tsx:90`.
2. **(P2) Make the leak filter answer-aware and shared by both modes.** Compare
   model output against the normalized `ground.answer` rather than 5 stock
   phrases; this also tightens the computational backstop. `hint.ts:232-243`.
3. **(P2) Add server-side defense-in-depth for grounding.** At minimum validate
   `ground` shape more strictly; ideally recompute/verify the answer server-side
   to satisfy PRD §9.2 #4 literally and remove client trust. `hint.ts:385-407`.
4. **(P2) Tighten the perimeter:** restrict CORS to known origins
   (`hint.ts:314`); move rate limiting to a shared store and evict expired
   buckets, or document the per-instance limitation as accepted
   (`hint.ts:86-87`); clamp free-text field lengths in `parseAndValidateBody`.
5. **(P2) Reconcile the Gemini→OpenAI doc drift** across PRD-phase2 §3/§6 and
   `spec-ai-assist`, and land the promised D-entry so future audits check the
   right env var.
6. **(Pedagogy) Ship the planned few-shot block** (in-voice positives +
   contrastive negatives) in `prompts.ts` to raise hint voice/quality and
   reinforce no-reveal/no-lecture; it caches as a static prefix so it's nearly
   free.
7. **(Feature) Build F4 on the existing conceptual engine** — a teach surface +
   transfer-problem anchor — to capture the protégé-effect win at low marginal
   risk. Keep F5/F6 as documented offline/planned work.

---

### Appendix — verification touchpoints (not re-run)
- `api/hint.test.ts` (75 tests): token verify (`:546-571`), handler 401/405/400/
  200/503/204 (`:574-690`), no-reveal guard (`:401-422`), conceptual closed-set
  validation (`:424-512`), rate limit (`:515-543`).
- `src/features/ai/useAiHint.test.ts`: flag-off no-network (`:58-90`), auth
  header (`:137`), fallback on 401/429/503/network/malformed (`:162-226`),
  never-throws (`:226`).
