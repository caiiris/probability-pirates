# WP-4 — Template families (x6)

> **Type:** content templates + vetting tests. **Depends on:** WP-1 (exact), WP-3 (Template type, `TEMPLATES` registry, `answerToPayload`). **Blocks:** WP-6 (needs >= 1 template). **Server/AI:** no.
>
> **Each family is an independent sub-task.** Six agents (or one agent looping six times) can build these in parallel; they share no files except appending to the `TEMPLATES` registry (WP-3). Build them one at a time, each with its own passing vetting test, before moving on.
>
> **Layout decision (D99):** templates live in topic folders (`templates/<topic>/<id>.ts`), not a flat `templates/<id>.ts` directory. Read [`wp-4-layout-handoff.md`](wp-4-layout-handoff.md) before implementing this WP.

## Goal

Implement six `Template`s (contract [C5](wp-contracts.md#c5-template-contract-owned-by-wp-3-implemented-by-wp-4-consumed-by-wp-6)), each correct-by-construction and vetted by `expectTemplateAgrees` (WP-1). Together they cover the foundational skills across all five topics.

## Shared rules for every family

- File: `src/features/practice/templates/<topic>/<id>.ts` exporting a `Template`; sibling `<id>.test.ts` in the same topic folder calling `expectTemplateAgrees(template)` (or `expectExactEnumeration` for count/conceptual families). See D99.
- `render(params)` MUST build the `Variant`'s correctness fields from `solve(params)` — never hardcode an answer. Reuse an existing `interactionKind` (`multiple-choice` or `fill-fraction` for v1; `tap-event`/`grid-event` allowed if natural).
- Provide `feedbackCorrect` and `feedbackDefault` (generic is fine — the worked solution is the real feedback). Per-distractor `feedbackByOption` optional.
- Set `skills` (from `SKILLS`), `topic`, `retrievalForm`, and `rate(params)` on the Elo scale (~700-2000: easy ~800, medium ~1100, hard ~1500+). `rate` should grow with the params' difficulty (bigger n, rarer event, etc.).
- Register the template in `TEMPLATES` (WP-3 `practiceEngine.ts`).
- After each family: `npm test -- <id>` and `npm run typecheck`.

## The six families

| id | topic | skills | retrievalForm | interaction | solve | simulate? |
| --- | --- | --- | --- | --- | --- | --- |
| `sum-of-two-dice` | counting | `sample-space-enumeration`, `equally-likely-outcomes` | operation | fill-fraction | enumerate 36 outcomes; `P(sum=k)` reduced | yes (roll 2 dice) |
| `at-least-one-via-complement` | complement | `complement-rule`, `independence` | procedural | fill-fraction | `1 - (1 - 1/m)^n` exact via Fraction pow | yes (n independent trials) |
| `k-heads-in-n` | distributions | `binomial-pmf`, `independence` | operation | fill-fraction | `nCr(n,k) * 1/2^n` exact | yes (n flips, count k heads) |
| `pick-k-of-n-unordered` | counting | `ordered-vs-unordered`, `combinations` | definition | multiple-choice | `nCr(n,k)` (a COUNT, integer answer) | no -> use exact enumeration check |
| `conditional-bayes-2x2` | conditional | `conditional-probability`, `base-rate` | application | fill-fraction | exact posterior from a 2x2 table of integer counts | yes (sample a population) |
| `gambler-fallacy-mc` | long-run | `long-run-vs-single-trial`, `independence` | definition | multiple-choice | correct option = "still 1/2 / independent" (choice answer, no number) | no -> structural assertion |

Target file layout:

```text
src/features/practice/templates/
  counting/
    sum-of-two-dice.ts
    sum-of-two-dice.test.ts
    pick-k-of-n-unordered.ts
    pick-k-of-n-unordered.test.ts
  complement/
    at-least-one-via-complement.ts
    at-least-one-via-complement.test.ts
  conditional/
    conditional-bayes-2x2.ts
    conditional-bayes-2x2.test.ts
  distributions/
    k-heads-in-n.ts
    k-heads-in-n.test.ts
  long-run/
    gambler-fallacy-mc.ts
    gambler-fallacy-mc.test.ts
```

The single WP-3 registry (`src/features/practice/practiceEngine.ts`) imports from
these topic folders and exports one flat `TEMPLATES` array. Do not create
per-topic registries for v1.

### Per-family notes

- **sum-of-two-dice:** `sample` -> `k in 2..12`. `solve` -> count pairs `(a,b)` with `a+b=k`, `frac(count, 36)`. `rate` higher for k near 2/12 (rarer). `simulate` rolls two `1..6` dice. Render as fill-fraction with `numeratorLabel`/`denominatorLabel`.
- **at-least-one-via-complement:** `sample` -> event prob `1/m` (m in {2,4,6}) and `n in 2..5`. `solve` -> `subF(frac(1,1), powF(subF(1, 1/m), n))` (implement integer-exponent `powF` locally or inline via repeated `mulF`). `simulate` runs n independent trials, success if >=1 hit.
- **k-heads-in-n:** `sample` -> `n in 2..8`, `k in 0..n`. `solve` -> `frac(nCr(n,k), 2n)` where `2n = 2^n` as bigint. `rate` grows with n. `simulate` flips n fair coins, success if exactly k heads (note: this estimates the pmf; tolerance applies).
- **pick-k-of-n-unordered:** integer COUNT answer (how many committees / hands). `solve` -> `{ kind:'int', value: Number(nCr(n,k)) }`. Render as multiple-choice with the correct count + 3 plausible distractors (e.g. `nPr(n,k)`, `nCr(n,k)+/-`, `n*k`) — distractors derived in code, mapped via `misconceptionByOption` where one is the ordered-count trap (`ordered_vs_unordered`). No `simulate`; vet with `expectExactEnumeration` (assert `solve` equals a brute-force subset count for small n).
- **conditional-bayes-2x2:** `sample` -> integer cell counts for a 2x2 table (disease/no-disease x test+/test-), or a (prevalence, sensitivity, specificity) triple with integer-friendly values. `solve` -> exact `P(disease | test+)` as a reduced Fraction from the counts. `simulate` -> sample a population of N from the table proportions, estimate the conditional. Render fill-fraction.
- **gambler-fallacy-mc:** conceptual. `sample` -> a streak length / scenario flavor. `solve` -> `{ kind:'choice', optionId:'independent' }`. Render multiple-choice with options: independent (correct), "due for tails" (`gambler`), "biased" etc. `misconceptionByOption: { due:'gambler' }`. Vet with a structural test: the correct option id is always present and equals `solve(params).optionId`, and exactly one option is correct.

## Test plan / Definition of Done (per family)

- The family's vetting test passes (`expectTemplateAgrees` within tolerance, or exact enumeration / structural assertion for the count + conceptual families).
- `render(params)` grades correct against `answerToPayload(solve(params), variant)` for >= 200 sampled params (this is built into `expectTemplateAgrees`).
- `rate(params)` returns finite numbers in ~700-2000 and increases with difficulty (assert monotonicity on a couple of param pairs).
- Registered in `TEMPLATES`. `npm run typecheck` clean.

Overall WP-4 DoD: all six green; `TEMPLATES.length >= 6`; one template per topic in `TOPICS`.

## Boundaries (do NOT touch)

- Do not modify the engine, exact lib, or `Variant` type.
- Do not import Firebase/React; templates are pure.
- Do not invent skill ids or misconception keys (closed sets from WP-2). Log + consult if one is missing.
- Distractors and prose may be drafted with LLM help but the answer fields MUST come from `solve` (never hardcode a number the test can't re-derive).
