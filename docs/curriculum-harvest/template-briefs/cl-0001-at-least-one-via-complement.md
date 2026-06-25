### TEMPLATE-BRIEF — at-least-one-via-complement

- **Build target:** `src/features/practice/templates/at-least-one-via-complement.ts`
- **Topic:** complement
- **Skills:** complement-rule, independence
- **Retrieval form:** procedural
- **Difficulty range:** 900-1300
- **Learner goal:** See that "at least one" is often easier to compute by finding the chance of "zero" first.
- **Params:** `n: 2..8`, `pNum/pDen` from the friendly fraction pool below, `scenarioId` from Pascal-authored independent-attempt contexts.
- **Render shape:** Ask for the probability that at least one success happens across `n` independent attempts, with answer entry as a reduced fraction.
- **Solve:** Compute the complement event: `1 - ((pDen - pNum) / pDen)^n`, then reduce.
- **Simulate:** Run `n` independent Bernoulli trials per experiment; count an experiment as a hit when one or more trials succeeds.
- **Distractors:** add the trial probabilities, compute exactly one success, compute all successes, return the no-success complement, or treat repeated independent trials as changing-probability trials.
- **Interaction fit:** `fill-fraction` for the MVP, with optional multiple-choice distractors when the renderer needs scaffolded practice.
- **Worked solution outline:** name the opposite event -> compute one failure probability -> raise it to `n` for zero successes -> subtract from `1` -> reduce the fraction.
- **Source inspiration:** CL-0001 from `openintro-statistics-readable-batch-0001` CAND-0006 and `openintro-statistics-readable-batch-0002` CAND-0005.
- **Human status:** pending-build

## Pascal-Native Template Details

This template should use only newly authored Pascal scenarios. Good context families:

- A practice app sends `n` independent check-in prompts, each with probability `p` of being noticed.
- A learner tries `n` independent puzzle strategies, each with probability `p` of working.
- A sensor sends `n` independent pings, each with probability `p` of arriving clearly.
- A quality check runs `n` independent tests, each with probability `p` of catching a flaw.

Avoid source-specific wording, named examples, or story details. The mathematical family is adapted with attribution; the learner-facing prompt should be original.

## Exact Params

```ts
type AtLeastOneViaComplementParams = {
  n: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  pNum: number;
  pDen: 2 | 3 | 4 | 5 | 6 | 8 | 10;
  scenarioId: 'checkInPrompt' | 'puzzleStrategy' | 'clearPing' | 'qualityCheck';
};
```

Use this friendly probability pool:

```ts
const friendlyProbabilities = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 6],
  [5, 6],
  [1, 8],
  [3, 8],
  [5, 8],
  [7, 8],
  [1, 10],
  [3, 10],
  [7, 10],
  [9, 10],
] as const;
```

Sampling constraints:

- Always require `0 < pNum < pDen` and `gcd(pNum, pDen) = 1`.
- Keep `pDen ** n <= 10_000_000` for readable reduced answers.
- Prefer `n <= 4` for first exposures, `n <= 6` for normal practice, and `n >= 6` only when the learner rating is high enough.
- Do not sample contexts where the prompt suggests dependence, changing odds, or limited inventory.

Suggested rating function:

```ts
rate(params) =
  clamp(
    900
      + 45 * (params.n - 2)
      + (params.pDen >= 6 ? 90 : 0)
      + (params.pNum !== 1 && params.pNum !== params.pDen - 1 ? 60 : 0),
    900,
    1300
  )
```

## Solve Plan

Use exact integer arithmetic.

1. Let `failureNum = pDen - pNum`.
2. Compute `noneNum = failureNum ** n`.
3. Compute `noneDen = pDen ** n`.
4. Compute `answerNum = noneDen - noneNum`.
5. Return `reduce(answerNum, noneDen)` as `{ kind: 'fraction', num, den }`.

Example expression for feedback only:

```text
P(at least one success) = 1 - P(no successes)
P(no successes) = (1 - p)^n
answer = 1 - ((pDen - pNum) / pDen)^n
```

## Simulate Plan

For each simulation trial:

1. Set `sawSuccess = false`.
2. Repeat `n` times.
3. Draw `rng() < pNum / pDen`.
4. If any draw succeeds, set `sawSuccess = true`.
5. Count the simulation trial as successful when `sawSuccess` is true.

Return `successCount / trials`. The vetting test should compare this estimate to the exact fraction using the standard template tolerance from `spec-practice`.

## Distractors

Use these as authored feedback branches for `fill-fraction`, or as options in a scaffolded `multiple-choice` variant:

- **Adds probabilities:** `n * p`, included only when `n * p <= 1`; feedback: repeated chances do not simply add because overlapping success cases get double-counted.
- **Exactly one success:** `n * p * (1 - p)^(n - 1)`; feedback: this excludes cases with two or more successes.
- **All successes:** `p^n`; feedback: "at least one" includes many more outcomes than all successes.
- **No successes:** `(1 - p)^n`; feedback: this is the complement, so it still needs to be subtracted from `1`.
- **Changing odds:** product such as `(1 - p) * (1 - (p + step))`; feedback: independent trials keep the same success probability each time.

## Worked-Solution Outline

Title: `Use the complement`

Steps:

1. "At least one" can be hard to count directly, so look at the opposite event: zero successes.
2. One attempt fails with probability `{failureNum}/{pDen}`.
3. Because the attempts are independent, all `n` attempts fail with probability `({failureNum}/{pDen})^n`.
4. Subtract from `1`: `1 - ({failureNum}/{pDen})^n`.
5. Reduce the resulting fraction and present the exact answer.

## Without-Replacement Extension

Do not include the without-replacement case in this MVP template. It is valuable but should be a separate follow-up template because the learner goal changes from independence to changing denominators.

Proposed extension id: `at-least-one-without-replacement`.

Extension params:

- `N: 8..30` total items.
- `targetCount: 1..min(10, N - 1)`.
- `draws: 2..min(6, N)`.
- Require `draws <= N - targetCount` for some sampled cases so the no-target complement is possible; also allow guaranteed-at-least-one cases only in a later difficulty band.

Extension solve plan:

```text
P(at least one target) = 1 - C(N - targetCount, draws) / C(N, draws)
```

Extension simulate plan: shuffle or sample without replacement from a generated population, count whether at least one target item appears, and compare to the exact combination result.
