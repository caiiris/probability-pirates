# Work Packages — Misconception Capture & Reasoning Elicitation

> Parallelizable build units for [`../spec-misconception-capture.md`](../spec-misconception-capture.md). Same rule as the Phase-2 WPs: **build against the frozen contracts in §A, never against a sibling WP's internals.** Each WP ends with `npm run typecheck` + its tests green; UI WPs also `npm run build` clean. The app stays deployable after each WP.
>
> Each WP has the shape: **Goal → Files → Steps → Definition of Done → Boundaries (do NOT touch).**

---

## A. Frozen contracts (freeze BEFORE any WP starts)

### C-MC1 — Taxonomy (owned by WP-MC-A)
`src/content/misconceptions.ts` entries use `{ label, description, fix, relatedSkills }`. The **closed key set** after this work:

```
gambler · ordered_vs_unordered · conjunction · base_rate_neglect · complement_inversion
+ replacement_confusion · add_vs_multiply · forgot_overlap
```

`MisconceptionKey = keyof typeof MISCONCEPTIONS`. No runtime invention of keys.

### C-MC2 — Diagnosis helper (owned by WP-MC-C, consumed by PracticeSession + WP-MC-B tests)
A pure function centralizing today's inline derivation in `PracticeSession.resolve`:

```ts
// src/features/practice/diagnoseWrongAnswer.ts
export function diagnoseWrongAnswer(
  variant: Variant,
  payload: AttemptPayload,
): MisconceptionKey | null;
// number-fill     → variant.misconceptionByValue?.[payload.value]
// multiple-choice → variant.misconceptionByOption?.[payload.optionId]
// fill-fraction   → first entry of variant.misconceptionByFraction whose {num,den}
//                   equals the reduced payload {numerator,denominator} (eqF), else null
// else → null
```

Templates expose trap values via these variant fields:
- **number-fill** → `misconceptionByValue?: Record<number, MisconceptionKey>` (existing).
- **multiple-choice** → `misconceptionByOption?: Record<string, MisconceptionKey>` (existing).
- **fill-fraction** → `misconceptionByFraction?: { num: number; den: number; key: MisconceptionKey }[]` (**added at contract-freeze, 2026-06-26**; matched by exact reduced value via `eqF`, so `2/4` matches a `1/2` trap). Authors compute the trap with `frac(num, den)` and store `{ num: Number(f.num), den: Number(f.den), key }`.

### C-MC3 — Confidence model (owned by WP-MC-C)
Learner-model misconception record gains a weighted score:

```ts
type MisconceptionStat = { count: number; score: number; lastSeenAt: number };
// back-compat: a persisted {count,lastSeenAt} is read as score = count * SOURCE_WEIGHT.trap

type MisconceptionSource = 'trap' | 'chip' | 'llm';
// Tuned so NO single observation surfaces (slip filter, D-MC5): the strongest
// single signal (trap) is 0.7 < threshold 1.0 → needs repetition or corroboration.
const SOURCE_WEIGHT: Record<MisconceptionSource, number> = { trap: 0.7, chip: 0.6, llm: 0.5 };
const SURFACE_THRESHOLD = 1.0;
// Mastery slip guard (D-MC6): a trap from a learner already strong on the
// problem's skill is halved at RECORD time (read from pre-attempt mastery).
const SLIP_DISCOUNT = 0.5; const MASTERY_STRONG_ACC = 0.8; const MASTERY_MIN_ATTEMPTS = 3;

// applyPracticeAttempt input gains (optional, replaces the bare misconceptionKey):
//   misconceptionSignal?: { key: MisconceptionKey; source: MisconceptionSource } | null
// (keep misconceptionKey accepted too, mapped to source 'trap', for a smooth migration)

export function surfacedMisconceptions(
  model: LearnerModel,
  threshold = SURFACE_THRESHOLD,
): MisconceptionKey[]; // score ≥ threshold, sorted by score desc then lastSeenAt desc
```

### C-MC4 — Reasoning options (owned by WP-MC-D)
```ts
type ReasoningOption = { id: string; label: string; misconceptionKey?: MisconceptionKey }; // omit key on the "sound" option
// optional per-variant override:
//   variant.reasoningOptions?: ReasoningOption[]
// fallback: a per-skill default bank keyed by SkillId
// Chip selection → misconceptionSignal { key, source: 'chip' } (only if a wrong/flagged option chosen)
```

### C-MC5 — Triggering (owned by WP-MC-D)
```ts
// src/features/practice/reasoningTrigger.ts
export function shouldElicitReasoning(input: {
  topic: Topic;
  skills: SkillId[];
  masteryBySkill: Partial<Record<SkillId, number>>; // Elo; missing ⇒ treat as low
  hasTrap: boolean;       // variant has misconceptionBy*
  rng: () => number;
}): boolean; // conceptual handled elsewhere; here: hasTrap || lowMastery || sample(p); fades as mastery rises
```

---

## B. Work packages

### WP-MC-A — Taxonomy expansion *(content only; freezes C-MC1)*
- **Goal:** add `replacement_confusion`, `add_vs_multiply`, `forgot_overlap` with `label/description/fix/relatedSkills`; keep existing five.
- **Files:** `src/content/misconceptions.ts`; touch tests asserting key counts if any.
- **Steps:** add entries → ensure `relatedSkills` are valid `SkillId`s → typecheck.
- **DoD:** `skills.test`/misconception invariants green; keys importable.
- **Boundaries:** do NOT touch templates, learner model, or UI.
- **Parallel:** wave 1; everyone else depends only on the *frozen keys* (already listed in C-MC1), so they don't wait on the file.

### WP-MC-B — Diagnostic trap tagging across the bank *(split per topic; like WP-4)*
- **Goal:** for each template family, compute the diagnostic wrong answer(s) in code and add `misconceptionByValue`/`misconceptionByOption`.
- **Files (one subagent per topic folder, no cross-edits):**
  - `templates/conditional/*` → `replacement_confusion` on without-replacement & three-draws
  - `templates/counting/*` → `add_vs_multiply` (addition×multiplication), `forgot_overlap` (inclusion-exclusion families), `ordered_vs_unordered` (already on perms/combos — verify)
  - `templates/complement/*` → `complement_inversion` (the un-complemented `P`)
  - `templates/distributions/*`, `templates/long-run/*` → tag where a meaningful trap exists; skip where none does (don't force).
- **Steps:** per family, compute the trap value from params (e.g. the with-replacement product), add the tag, extend the family test to assert `variant.misconceptionByValue?.[trap] === key`.
- **DoD:** each touched family's test asserts the tag; full suite green.
- **Boundaries:** edit only template files + their tests. Do NOT touch `index.ts`, the learner model, or `PracticeSession`. Use only C-MC1 keys.
- **Parallel:** wave 1, N subagents (one per topic folder).

### WP-MC-C — Confidence model + selector + panel wiring *(freezes C-MC2, C-MC3)*
- **Goal:** weighted score accumulation, `surfacedMisconceptions`, `diagnoseWrongAnswer`, back-compat migration; switch the panel to the selector.
- **Files:** `learnerModel.ts` (record shape + `applyPracticeAttempt` signal + weights), `learnerModelService.ts` (pass-through), `diagnoseWrongAnswer.ts` (new), `PracticeSession.tsx` + `ConceptualRound.tsx` (use `diagnoseWrongAnswer` / pass `misconceptionSignal`), `StrengthsPanel.tsx` (use `surfacedMisconceptions`), plus tests.
- **Steps:** add score+weights (back-compat read) → add `misconceptionSignal` (keep `misconceptionKey` alias=trap) → extract `diagnoseWrongAnswer` → `surfacedMisconceptions` selector → panel uses it → unit tests for accumulation + threshold + back-compat.
- **DoD:** learnerModel tests cover weighting/threshold/back-compat; StrengthsPanel test asserts threshold gating; suite green.
- **Boundaries:** do NOT change the two-engine split or template files. Coordinate the `PracticeSession` edit region with WP-MC-D (this WP only swaps in `diagnoseWrongAnswer`; D adds chip UI).
- **Depends on:** C-MC1 keys. **Parallel with:** WP-MC-B.

### WP-MC-D — Recognition chips + concurrent capture + triggering *(freezes C-MC4, C-MC5)*
- **Goal:** pre-verdict "which is closest to your thinking?" chips → `chip` signal; a-priori, mastery-faded triggering.
- **Files:** `reasoningTrigger.ts` (new, pure), per-skill default chip bank (new content), `ReasoningChips.tsx` (new), `PracticeSession.tsx` (render chips when triggered, capture selection, emit `misconceptionSignal{source:'chip'}`), tests.
- **Steps:** pure trigger fn + tests → chip component + bank → wire into PracticeSession answer step (before check) → record chip signal on resolve → RTL test.
- **DoD:** trigger fn unit-tested (fade + sample + trap/lowMastery); chips render only when triggered; chip→signal verified; suite + build green.
- **Boundaries:** do NOT alter correctness grading. Build on C-MC3's `misconceptionSignal`. Sequence **after** WP-MC-C (shares `PracticeSession`).
- **Depends on:** WP-MC-C, C-MC1.

### WP-MC-E — Free-text enrichment tier (conservative classifier) 
- **Goal:** optional "in your own words" escalation; ensure the classifier can return `insufficient` and is precision-biased; wire `llm` signal at weight 0.5.
- **Files:** `api/_lib/prompts.ts` (reinforce closed-set + `insufficient`/null bias), `api/hint.ts` (validation already rejects off-set keys — verify), client wiring in `ConceptualRound.tsx`/`ReasoningChips.tsx` (optional free-text → classify → `misconceptionSignal{source:'llm'}`), tests.
- **DoD:** `api/hint.test.ts` covers terse/junk → null; client records `llm` signal only on a recognized key; suite green.
- **Boundaries:** LLM never grades correctness; never the sole basis (threshold enforced by C-MC3).
- **Depends on:** WP-MC-C; complements WP-MC-D.

### WP-MC-F — Post-solution reflection (learning only)
- **Goal:** after reveal, a "here's the path — where did yours differ?" reflection using `explain()`. **No data capture.**
- **Files:** a small component used by `PracticeSession`/`ConceptualRound` on the resolved/reveal state; tests.
- **DoD:** renders on reveal; issues no misconception writes (assert in test); build green.
- **Boundaries:** read-only; no learner-model writes. **Parallel-safe** with everything (own component, reveal-state only).

---

## C. Dependency waves

```
Wave 0 — freeze contracts §A (this doc).
Wave 1 (parallel):  WP-MC-A (taxonomy) · WP-MC-B ×topics (trap tagging) · WP-MC-C (confidence model)
Wave 2:             WP-MC-D (chips/triggering, after C) · WP-MC-E (free-text, after C)
Wave 3 (anytime):   WP-MC-F (reflection)
```

Single-agent path: A → C → B → D → E → F.

## D. Risks / notes
- **R-MC1 — schema migration.** Persisted `{count,lastSeenAt}` docs must read as `score = count × trap weight`. Covered by a back-compat test in WP-MC-C.
- **R-MC2 — `PracticeSession` contention** between WP-MC-C (swap in `diagnoseWrongAnswer`) and WP-MC-D (chips). Mitigation: sequence C→D; C touches only the derivation line, D adds the chip block.
- **R-MC3 — false positives.** Precision-bias the threshold (D-MC5); chips/LLM need corroboration; trap matches are high-precision and may surface alone.
- **R-MC4 — friction creep.** Triggering must fade with mastery and sample sparsely; validate the rate in testing before raising it.
