# WP-1 — Verification core (exact arithmetic + sim cross-check)

> **Type:** pure library + tests. **Depends on:** nothing (reuses `src/lib/simulations.ts`). **Blocks:** WP-3, WP-4. **Server/AI:** no.
>
> The foundation everything grounds on. 100% pure TypeScript, no React, no Firebase. A small model can build and verify this entirely from the test suite.

## Goal

Provide the exact-arithmetic oracle (rationals + combinatorics) that computes correct answers, and the Monte-Carlo cross-check helper that vets templates. Implements contracts [C1](wp-contracts.md#c1-exact-arithmetic-owned-by-wp-1-consumed-by-wp-3-wp-4) and [C2](wp-contracts.md#c2-exactanswer-owned-by-wp-1-consumed-by-wp-3-wp-4-wp-6).

## Files

- `src/lib/probability/exact.ts` — implements C1 + C2.
- `src/lib/probability/exact.test.ts` — unit tests on known values.
- `src/features/practice/templates/testUtils.ts` — the `expectTemplateAgrees` vetting helper (used by WP-4 tests).
- `src/features/practice/templates/testUtils.test.ts` — a self-test of the helper with a trivial known template stub.

> Note: `testUtils.ts` imports the `Template` type from `templates/types.ts` (WP-3). To avoid a build-order dependency, import the type only (`import type { Template }`). If WP-3 isn't merged yet, define a local minimal structural type matching [C5](wp-contracts.md#c5-template-contract-owned-by-wp-3-implemented-by-wp-4-consumed-by-wp-6) and leave a `// TODO: replace with import once WP-3 lands` — types-only, never blocks.

## Steps (loop until green)

1. Implement `Fraction`, `frac`, `reduce` (Euclid gcd over bigint, sign normalized so `den > 0`), `addF/subF/mulF/divF`, `eqF` (compare after reduce), `toNumber`.
2. Implement `factorial`, `nPr`, `nCr` over `bigint`. Throw `RangeError` on negative inputs or `n < r`.
3. Implement the `ExactAnswer` type (C2).
4. Implement `expectTemplateAgrees(template, opts)` in `testUtils.ts`:
   - Seed `mulberry32(opts.seed ?? 0xC0FFEE)`.
   - Draw `opts.samples` (default 1000) param sets via `template.sample(rng)`.
   - For each: compute `p = template.solve(params)`.
     - If `template.simulate` is defined and `p` is a `fraction`/`int` probability in [0,1]: estimate `pHat = template.simulate(params, opts.trials ?? 10000, rng)` and assert `|pHat - toNumber(p)| < (opts.tolerance ?? 5) * sqrt(pq/n)`.
     - Always assert `render(params)` is internally consistent: `checkAnswer(render(params), answerToPayload(p, render(params)))` is `wasCorrect: true`. (Import `checkAnswer` from `@/lib/checkAnswer` (WP-0) and `answerToPayload` from the engine (WP-3); if WP-3 isn't merged, accept an injected `answerToPayload` via `opts` so the helper stays buildable.)
   - Provide a separate `expectExactEnumeration(template, enumerate)` path for small sample spaces.
5. Run `npm test -- exact` and `npm test -- testUtils` until green; `npm run typecheck`.

## Test plan / Definition of Done

`exact.test.ts` covers at minimum:
- `frac(3,6)` reduces to `1/2`; `frac(-1,-2)` -> `1/2`; `frac(1,-2)` -> `-1/2`.
- `frac(1,0)` throws.
- `addF(1/2, 1/3) = 5/6`; `mulF(2/3, 3/4) = 1/2`; `divF(1/2, 1/4) = 2/1`.
- `eqF(3/6, 1/2)` is true; `eqF(1/2, 1/3)` is false.
- `factorial(0)=1n`, `factorial(5)=120n`; `nCr(5,2)=10n`, `nCr(52,5)=2598960n`; `nPr(5,2)=20n`.
- `nCr(3,5)` throws; `factorial(-1)` throws.
- `toNumber(1/4) === 0.25`.

`testUtils.test.ts`:
- A trivial stub template (`P(heads)=1/2`, with a `simulate` using `flipIsHeads`) passes `expectTemplateAgrees`.
- A deliberately-buggy stub (solve returns `1/3` but simulate is fair coin) FAILS the assertion (prove the gate bites).

DoD: both test files green, `npm run typecheck` clean, no React/Firebase imports anywhere in `exact.ts`.

## Boundaries (do NOT touch)

- Do not modify `src/lib/simulations.ts` (import from it only).
- Do not add a dependency (no `mathjs`, no `fraction.js`) — bigint is sufficient.
- Do not import anything from `src/features/*` in `exact.ts` (testUtils may import types only).
