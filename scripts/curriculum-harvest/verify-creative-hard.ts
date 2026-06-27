import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { addF, frac, mulF, nCr, subF, toNumber, type Fraction } from '@/lib/probability/exact';
import { mulberry32, type Rng } from '@/lib/simulations';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const JSON_PATH = path.join(OUT_DIR, 'creative-hard-verified.json');
const MD_PATH = path.join(OUT_DIR, 'creative-hard-verified.md');

type CreativeVerification = {
  id: string;
  candidateId: string;
  title: string;
  difficultyTag: string;
  prompt: string;
  answer: string;
  solver: string;
  verification: string[];
  passed: boolean;
};

function formatF(f: Fraction): string {
  return `${f.num.toString()}/${f.den.toString()}`;
}

function powF(base: Fraction, exp: number): Fraction {
  let result = frac(1);
  for (let i = 0; i < exp; i += 1) {
    result = mulF(result, base);
  }
  return result;
}

function simulateMean(draw: (rng: Rng) => number, trials: number, rng: Rng): number {
  let total = 0;
  for (let i = 0; i < trials; i += 1) {
    total += draw(rng);
  }
  return total / trials;
}

function verifyNonlinearPayoff(): CreativeVerification {
  const outcomes = [
    { count: 1, probability: frac(1, 2), payoffCents: 80 },
    { count: 2, probability: frac(1, 5), payoffCents: 160 },
    { count: 3, probability: frac(3, 20), payoffCents: 240 },
    { count: 6, probability: frac(1, 10), payoffCents: 480 },
    { count: 12, probability: frac(1, 20), payoffCents: 900 },
  ];

  const expectedCents = outcomes.reduce(
    (sum, outcome) => addF(sum, mulF(frac(outcome.payoffCents), outcome.probability)),
    frac(0),
  );

  const probabilitySum = outcomes.reduce((sum, outcome) => addF(sum, outcome.probability), frac(0));
  const naiveExpectedCount = outcomes.reduce(
    (sum, outcome) => addF(sum, mulF(frac(outcome.count), outcome.probability)),
    frac(0),
  );
  const naiveCents = mulF(naiveExpectedCount, frac(80));

  return {
    id: 'creative-0001',
    candidateId: 'CAND-0001',
    title: 'Nonlinear payoff expected value',
    difficultyTag: 'hard / creative',
    prompt:
      'A shop sells gem packs. A 12-pack has a discount, so payoff is not just count times unit price. What is the expected revenue per customer?',
    answer: `$${(toNumber(expectedCents) / 100).toFixed(2)} (${formatF(expectedCents)} cents)`,
    solver: 'sum payoffCents(outcome) * P(outcome)',
    verification: [
      `Probability mass sums to ${formatF(probabilitySum)}.`,
      `Exact expected revenue is ${formatF(expectedCents)} cents.`,
      `Naive unit-price shortcut gives ${formatF(naiveCents)} cents, so the trap is real.`,
    ],
    passed: probabilitySum.num === probabilitySum.den && expectedCents.num === 201n && expectedCents.den === 1n,
  };
}

function verifyCouponCollector(): CreativeVerification {
  const k = 4;
  let expected = frac(0);
  for (let i = 1; i <= k; i += 1) {
    expected = addF(expected, frac(k, i));
  }

  function oneRun(rng: Rng): number {
    const seen = new Set<number>();
    let draws = 0;
    while (seen.size < k) {
      seen.add(Math.floor(rng() * k));
      draws += 1;
    }
    return draws;
  }

  const estimate = simulateMean(oneRun, 80_000, mulberry32(0xc0ffee));
  const diff = Math.abs(estimate - toNumber(expected));

  return {
    id: 'creative-0002',
    candidateId: 'CAND-0002',
    title: 'Coupon collector small-set challenge',
    difficultyTag: 'hard / creative',
    prompt: 'There are 4 sticker types. Each pack has one random sticker. What is the expected number of packs to complete the set?',
    answer: `${formatF(expected)} packs (${toNumber(expected).toFixed(3)})`,
    solver: 'k * (1 + 1/2 + ... + 1/k)',
    verification: [
      `Exact expectation is ${formatF(expected)}.`,
      `Simulation mean over 80,000 runs is ${estimate.toFixed(3)}.`,
      `Absolute difference is ${diff.toFixed(3)}.`,
    ],
    passed: expected.num === 25n && expected.den === 3n && diff < 0.08,
  };
}

function ballotSequences(a: number, b: number): string[][] {
  const sequences: string[][] = [];
  function step(prefix: string[], leftA: number, leftB: number): void {
    if (leftA === 0 && leftB === 0) {
      sequences.push(prefix);
      return;
    }
    if (leftA > 0) step([...prefix, 'A'], leftA - 1, leftB);
    if (leftB > 0) step([...prefix, 'B'], leftA, leftB - 1);
  }
  step([], a, b);
  return sequences;
}

function verifyBallotLead(): CreativeVerification {
  const a = 5;
  const b = 3;
  const sequences = ballotSequences(a, b);
  const favorable = sequences.filter((sequence) => {
    let lead = 0;
    return sequence.every((vote) => {
      lead += vote === 'A' ? 1 : -1;
      return lead > 0;
    });
  });
  const exact = frac(favorable.length, sequences.length);
  const formula = frac(a - b, a + b);

  return {
    id: 'creative-0003',
    candidateId: 'CAND-0003',
    title: 'Ballot lead probability',
    difficultyTag: 'expert / creative',
    prompt: 'A finishes with 5 votes and B with 3. If the votes are revealed in random order, what is the chance A is always ahead?',
    answer: formatF(exact),
    solver: 'exact enumeration for small totals; formula check (a-b)/(a+b)',
    verification: [
      `${favorable.length} favorable sequences out of ${sequences.length}.`,
      `Enumeration gives ${formatF(exact)}.`,
      `Ballot formula gives ${formatF(formula)}.`,
    ],
    passed: exact.num === formula.num && exact.den === formula.den,
  };
}

function verifyOddsEvens(): CreativeVerification {
  const evens = 3;
  const odds = 4;
  const favorable = nCr(evens, 2) + nCr(odds, 2);
  const total = nCr(evens + odds, 2);
  const exact = frac(favorable, total);

  return {
    id: 'creative-0004',
    candidateId: 'CAND-0004',
    title: 'Odds-and-evens fairness by parity counts',
    difficultyTag: 'medium-hard / creative',
    prompt: 'A bag has 3 even tokens and 4 odd tokens. Two tokens are drawn. You win if their sum is even. Is this fair?',
    answer: `${formatF(exact)}. Not fair.`,
    solver: '(C(even,2) + C(odd,2)) / C(total,2)',
    verification: [
      `Same-parity pairs: C(3,2) + C(4,2) = ${favorable.toString()}.`,
      `All pairs: C(7,2) = ${total.toString()}.`,
      `Win probability is ${formatF(exact)}.`,
    ],
    passed: exact.num === 3n && exact.den === 7n,
  };
}

function multinomialLogLikelihood(probabilities: number[], counts: number[]): number {
  return counts.reduce((sum, count, index) => sum + count * Math.log(probabilities[index]), 0);
}

function verifyInverseSpinner(): CreativeVerification {
  const counts = [24, 17, 9];
  const candidates = [
    { id: 'A', probabilities: [1 / 2, 1 / 3, 1 / 6] },
    { id: 'B', probabilities: [1 / 3, 1 / 3, 1 / 3] },
    { id: 'C', probabilities: [2 / 3, 1 / 6, 1 / 6] },
  ];
  const scored = candidates.map((candidate) => ({
    id: candidate.id,
    score: multinomialLogLikelihood(candidate.probabilities, counts),
  }));
  const best = [...scored].sort((a, b) => b.score - a.score)[0];

  return {
    id: 'creative-0005',
    candidateId: 'CAND-0005',
    title: 'Inverse spinner from frequency chart',
    difficultyTag: 'hard / creative',
    prompt: 'A spinner produced counts 24, 17, and 9 over 50 spins. Which candidate spinner most likely generated it?',
    answer: `Spinner ${best.id}`,
    solver: 'choose largest multinomial log likelihood',
    verification: scored.map((entry) => `Spinner ${entry.id}: log likelihood ${entry.score.toFixed(3)}`),
    passed: best.id === 'A',
  };
}

function verifyLastOneStanding(): CreativeVerification {
  const players = 30;
  const streak = 5;
  const individual = frac(1, 2 ** streak);
  const none = powF(subF(frac(1), individual), players);
  const atLeastOne = subF(frac(1), none);

  function oneRun(rng: Rng): number {
    for (let player = 0; player < players; player += 1) {
      let allHeads = true;
      for (let flip = 0; flip < streak; flip += 1) {
        if (rng() >= 0.5) {
          allHeads = false;
        }
      }
      if (allHeads) return 1;
    }
    return 0;
  }

  const estimate = simulateMean(oneRun, 80_000, mulberry32(0x5eed));
  const diff = Math.abs(estimate - toNumber(atLeastOne));

  return {
    id: 'creative-0006',
    candidateId: 'CAND-0006',
    title: 'Last one standing streak survival',
    difficultyTag: 'hard / creative',
    prompt: '30 players each try for 5 heads in a row. What is the probability at least one player succeeds?',
    answer: `${formatF(atLeastOne)} (${toNumber(atLeastOne).toFixed(3)})`,
    solver: `1 - (1 - 1/2^${streak})^${players}`,
    verification: [
      `Exact complement is ${formatF(none)}.`,
      `Simulation estimate over 80,000 runs is ${estimate.toFixed(3)}.`,
      `Absolute difference is ${diff.toFixed(3)}.`,
    ],
    passed: diff < 0.01,
  };
}

function pairwiseWinProbability(left: number[], right: number[]): Fraction {
  let wins = 0;
  let total = 0;
  for (const a of left) {
    for (const b of right) {
      if (a > b) wins += 1;
      total += 1;
    }
  }
  return frac(wins, total);
}

function verifyNonTransitiveDice(): CreativeVerification {
  const dice = {
    A: [2, 2, 4, 4, 9, 9],
    B: [1, 1, 6, 6, 8, 8],
    C: [3, 3, 5, 5, 7, 7],
  };
  const aBeatsB = pairwiseWinProbability(dice.A, dice.B);
  const bBeatsC = pairwiseWinProbability(dice.B, dice.C);
  const cBeatsA = pairwiseWinProbability(dice.C, dice.A);

  return {
    id: 'creative-0007',
    candidateId: 'CAND-0007',
    title: 'Non-transitive dice strategy',
    difficultyTag: 'expert / creative',
    prompt: 'Three custom dice form a cycle: A tends to beat B, B tends to beat C, and C tends to beat A. Verify the cycle.',
    answer: `A beats B: ${formatF(aBeatsB)}; B beats C: ${formatF(bBeatsC)}; C beats A: ${formatF(cBeatsA)}`,
    solver: 'exact enumeration over 36 pair outcomes for each matchup',
    verification: [
      `Die A: ${dice.A.join(', ')}`,
      `Die B: ${dice.B.join(', ')}`,
      `Die C: ${dice.C.join(', ')}`,
      `A over B: ${formatF(aBeatsB)}`,
      `B over C: ${formatF(bBeatsC)}`,
      `C over A: ${formatF(cBeatsA)}`,
    ],
    passed:
      aBeatsB.num === 5n &&
      aBeatsB.den === 9n &&
      bBeatsC.num === 5n &&
      bBeatsC.den === 9n &&
      cBeatsA.num === 5n &&
      cBeatsA.den === 9n,
  };
}

function renderMarkdown(results: CreativeVerification[]): string {
  const lines = [
    '# Creative / Hard Candidate Verification',
    '',
    '> Deterministic verification pass for `creative-hard-batch-0009.md`. These are review artifacts, not runtime practice templates yet.',
    '',
  ];

  for (const result of results) {
    lines.push(
      `## ${result.id} — ${result.title}`,
      '',
      `- **Candidate:** ${result.candidateId}`,
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Prompt:** ${result.prompt}`,
      `- **Answer:** ${result.answer}`,
      `- **Solver:** ${result.solver}`,
      `- **Passed:** ${result.passed ? 'yes' : 'no'}`,
      '',
      '### Verification',
      '',
      ...result.verification.map((line) => `- ${line}`),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const results = [
    verifyNonlinearPayoff(),
    verifyCouponCollector(),
    verifyBallotLead(),
    verifyOddsEvens(),
    verifyInverseSpinner(),
    verifyLastOneStanding(),
    verifyNonTransitiveDice(),
  ];

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`Creative verification failed: ${failed.map((result) => result.id).join(', ')}`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(results, null, 2)}\n`);
  await writeFile(MD_PATH, renderMarkdown(results));
  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

