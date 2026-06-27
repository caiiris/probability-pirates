import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { MISCONCEPTIONS } from '@/content/misconceptions';
import { SKILLS } from '@/content/skills';
import { addF, frac, mulF, nCr, subF, toNumber, type Fraction } from '@/lib/probability/exact';
import { mulberry32, type Rng } from '@/lib/simulations';
import { format as formatWithPrettier, resolveConfig } from 'prettier';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const CANDIDATE_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/candidates');
const JSON_PATH = path.join(OUT_DIR, 'challenge-games-verified.json');
const MD_PATH = path.join(OUT_DIR, 'challenge-games-verified.md');
const CANDIDATE_PATH = path.join(CANDIDATE_DIR, 'challenge-games-batch.md');

type ChallengeVerification = {
  id: string;
  candidateId: string;
  title: string;
  category: string;
  difficultyTag: 'hard' | 'extreme';
  prompt: string;
  answer: string;
  solver: string;
  exactMethod: string;
  skillTags: string[];
  misconceptionTraps: string[];
  missingTaxonomyIds: string[];
  verification: string[];
  passed: boolean;
};

const skillIds = new Set<string>(Object.keys(SKILLS));
const misconceptionIds = new Set<string>(Object.keys(MISCONCEPTIONS));

function formatF(f: Fraction): string {
  return `${f.num.toString()}/${f.den.toString()}`;
}

function formatDecimal(f: Fraction, digits = 3): string {
  return toNumber(f).toFixed(digits);
}

function powF(base: Fraction, exp: number): Fraction {
  let result = frac(1);
  for (let i = 0; i < exp; i += 1) {
    result = mulF(result, base);
  }
  return result;
}

function powInt(base: number, exp: number): bigint {
  let result = 1n;
  for (let i = 0; i < exp; i += 1) {
    result *= BigInt(base);
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

function missingTaxonomyIds(skillTags: string[], misconceptionTraps: string[]): string[] {
  return [
    ...skillTags.filter((tag) => !skillIds.has(tag)).map((tag) => `skill:${tag}`),
    ...misconceptionTraps
      .filter((tag) => !misconceptionIds.has(tag))
      .map((tag) => `misconception:${tag}`),
  ];
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

function averageFace(die: number[]): Fraction {
  return frac(
    die.reduce((sum, face) => sum + face, 0),
    die.length,
  );
}

function verifyNonTransitiveDice(): ChallengeVerification {
  const dice = {
    A: [4, 4, 6, 6, 11, 11],
    B: [3, 3, 8, 8, 10, 10],
    C: [5, 5, 7, 7, 9, 9],
  };
  const aBeatsB = pairwiseWinProbability(dice.A, dice.B);
  const bBeatsC = pairwiseWinProbability(dice.B, dice.C);
  const cBeatsA = pairwiseWinProbability(dice.C, dice.A);
  const averages = [averageFace(dice.A), averageFace(dice.B), averageFace(dice.C)];
  const skillTags = [
    'sample-space-enumeration',
    'favorable-over-total',
    'pairwise-comparison',
    'fair-game',
  ];
  const misconceptionTraps = [
    'compares_averages_instead_of_win_probability',
    'assumes_transitivity',
  ];

  return {
    id: 'challenge-game-0001',
    candidateId: 'CG-CAND-0001',
    title: 'Skyship non-transitive dice draft',
    category: 'non-transitive dice / custom dice strategy',
    difficultyTag: 'extreme',
    prompt:
      'In a skyship duel, your opponent picks one of three six-sided custom dice first. You may then pick either remaining die. A higher roll wins the round. Which reply should you make to each opponent die, and why is there no single best die?',
    answer: `Pick A against B, B against C, and C against A; each favored matchup wins ${formatF(aBeatsB)} of rounds.`,
    solver:
      'Enumerate the 36 equally likely roll pairs for each matchup and choose the die with more winning pairs.',
    exactMethod: 'Exact enumeration over 36 ordered roll pairs per matchup.',
    skillTags,
    misconceptionTraps,
    missingTaxonomyIds: missingTaxonomyIds(skillTags, misconceptionTraps),
    verification: [
      `Die A faces: ${dice.A.join(', ')}; mean ${formatF(averages[0])}.`,
      `Die B faces: ${dice.B.join(', ')}; mean ${formatF(averages[1])}.`,
      `Die C faces: ${dice.C.join(', ')}; mean ${formatF(averages[2])}.`,
      `A beats B: ${formatF(aBeatsB)}.`,
      `B beats C: ${formatF(bBeatsC)}.`,
      `C beats A: ${formatF(cBeatsA)}.`,
    ],
    passed:
      aBeatsB.num === 5n &&
      aBeatsB.den === 9n &&
      bBeatsC.num === 5n &&
      bBeatsC.den === 9n &&
      cBeatsA.num === 5n &&
      cBeatsA.den === 9n &&
      averages.every((average) => average.num === 7n && average.den === 1n),
  };
}

function verifyThreeTokenScoringBooth(): ChallengeVerification {
  const counts = { amber: 5, blue: 4, crimson: 3 };
  const total = nCr(counts.amber + counts.blue + counts.crimson, 3);
  const allSame = nCr(counts.amber, 3) + nCr(counts.blue, 3) + nCr(counts.crimson, 3);
  const allDifferent = BigInt(counts.amber * counts.blue * counts.crimson);
  const exactlyTwoColors = total - allSame - allDifferent;
  const expectedScore = addF(
    addF(mulF(frac(5), frac(exactlyTwoColors, total)), mulF(frac(-4), frac(allSame, total))),
    mulF(frac(-2), frac(allDifferent, total)),
  );
  const skillTags = ['combinations', 'favorable-over-total', 'expected-value', 'fair-game'];
  const misconceptionTraps = [
    'ordered_vs_unordered',
    'symmetry_means_fair',
    'ignores_payout_weights',
  ];

  return {
    id: 'challenge-game-0002',
    candidateId: 'CG-CAND-0002',
    title: 'Three-token scoring booth',
    category: 'fair/unfair token games',
    difficultyTag: 'hard',
    prompt:
      'A booth has 5 amber, 4 blue, and 3 crimson tokens. Draw 3 without replacement. You score +5 for exactly two colors, -4 for all one color, and -2 for all three colors. Is the game fair to the player?',
    answer: `No. The expected score is ${formatF(expectedScore)} points, so the player has an edge.`,
    solver:
      'Count unordered 3-token hands by color pattern, then average the score over all C(12, 3) hands.',
    exactMethod: 'Exact combination counts for all 3-token hands.',
    skillTags,
    misconceptionTraps,
    missingTaxonomyIds: missingTaxonomyIds(skillTags, misconceptionTraps),
    verification: [
      `Total hands: C(12, 3) = ${total.toString()}.`,
      `All one color: C(5, 3) + C(4, 3) + C(3, 3) = ${allSame.toString()}.`,
      `All three colors: 5 x 4 x 3 = ${allDifferent.toString()}.`,
      `Exactly two colors: ${exactlyTwoColors.toString()}.`,
      `Expected score: 5(${exactlyTwoColors.toString()})/220 - 4(${allSame.toString()})/220 - 2(${allDifferent.toString()})/220 = ${formatF(expectedScore)}.`,
    ],
    passed:
      total === 220n &&
      allSame === 15n &&
      allDifferent === 60n &&
      exactlyTwoColors === 145n &&
      expectedScore.num === 109n &&
      expectedScore.den === 44n,
  };
}

function sequenceHasRun(sequence: boolean[], runLength: number): boolean {
  let streak = 0;
  for (const isHeads of sequence) {
    streak = isHeads ? streak + 1 : 0;
    if (streak >= runLength) return true;
  }
  return false;
}

function verifyStreakSurvivalFinale(): ChallengeVerification {
  const players = 15;
  const flips = 5;
  const runLength = 4;
  const sequenceCount = 2 ** flips;
  let survivorSequences = 0;

  for (let mask = 0; mask < sequenceCount; mask += 1) {
    const sequence = Array.from({ length: flips }, (_, index) => (mask & (1 << index)) !== 0);
    if (sequenceHasRun(sequence, runLength)) survivorSequences += 1;
  }

  const individual = frac(survivorSequences, sequenceCount);
  const none = powF(subF(frac(1), individual), players);
  const atLeastOne = subF(frac(1), none);

  function oneRun(rng: Rng): number {
    for (let player = 0; player < players; player += 1) {
      const flipsSeen = Array.from({ length: flips }, () => rng() < 0.5);
      if (sequenceHasRun(flipsSeen, runLength)) return 1;
    }
    return 0;
  }

  const trials = 120_000;
  const estimate = simulateMean(oneRun, trials, mulberry32(0x51eaf00d));
  const diff = Math.abs(estimate - toNumber(atLeastOne));
  const skillTags = [
    'complement-rule',
    'independence',
    'long-run-vs-single-trial',
    'streak-survival',
  ];
  const misconceptionTraps = ['gambler', 'complement_inversion', 'expected_count_as_probability'];

  return {
    id: 'challenge-game-0003',
    candidateId: 'CG-CAND-0003',
    title: 'Streak survival finale',
    category: 'last-one-standing streak survival',
    difficultyTag: 'hard',
    prompt:
      'Fifteen finalists each flip a fair coin 5 times. A finalist survives if their row contains at least 4 heads in a row. What is the probability at least one finalist survives?',
    answer: `${formatF(atLeastOne)} (${formatDecimal(atLeastOne)})`,
    solver:
      'First enumerate the 32 possible 5-flip rows for one finalist, then use the complement that no finalist survives.',
    exactMethod: `Exact row enumeration plus formula 1 - (1 - ${formatF(individual)})^${players}.`,
    skillTags,
    misconceptionTraps,
    missingTaxonomyIds: missingTaxonomyIds(skillTags, misconceptionTraps),
    verification: [
      `${survivorSequences} of ${sequenceCount} one-player flip rows contain a run of ${runLength} heads.`,
      `Individual survival probability: ${formatF(individual)}.`,
      `Exact formula: 1 - (1 - ${formatF(individual)})^${players} = ${formatF(atLeastOne)}.`,
      `Simulation sanity check over ${trials.toLocaleString()} contests: ${estimate.toFixed(3)}.`,
      `Absolute simulation difference: ${diff.toFixed(3)}.`,
    ],
    passed:
      survivorSequences === 3 && individual.num === 3n && individual.den === 32n && diff < 0.006,
  };
}

function couponFormulaCompleteCount(types: number, draws: number): bigint {
  let total = 0n;
  for (let missing = 0; missing <= types; missing += 1) {
    const term = nCr(types, missing) * powInt(types - missing, draws);
    total += missing % 2 === 0 ? term : -term;
  }
  return total;
}

function couponEnumerationCompleteCount(types: number, draws: number): bigint {
  let complete = 0n;
  const total = Number(powInt(types, draws));
  for (let code = 0; code < total; code += 1) {
    let remaining = code;
    const seen = new Set<number>();
    for (let draw = 0; draw < draws; draw += 1) {
      seen.add(remaining % types);
      remaining = Math.floor(remaining / types);
    }
    if (seen.size === types) complete += 1n;
  }
  return complete;
}

function verifyCouponCollectorVault(): ChallengeVerification {
  const types = 4;
  const draws = 7;
  const total = powInt(types, draws);
  const formulaCount = couponFormulaCompleteCount(types, draws);
  const enumerationCount = couponEnumerationCompleteCount(types, draws);
  const exact = frac(formulaCount, total);

  function oneRun(rng: Rng): number {
    const seen = new Set<number>();
    for (let draw = 0; draw < draws; draw += 1) {
      seen.add(Math.floor(rng() * types));
    }
    return seen.size === types ? 1 : 0;
  }

  const trials = 120_000;
  const estimate = simulateMean(oneRun, trials, mulberry32(0xc011ec7));
  const diff = Math.abs(estimate - toNumber(exact));
  const skillTags = [
    'inclusion-exclusion',
    'multiplication-principle',
    'coupon-collector',
    'simulation',
  ];
  const misconceptionTraps = ['ignores_duplicates', 'assumes_each_draw_adds_new_type', 'gambler'];

  return {
    id: 'challenge-game-0004',
    candidateId: 'CG-CAND-0004',
    title: 'Vault crest coupon chase',
    category: 'coupon collector small sets',
    difficultyTag: 'hard',
    prompt:
      'A puzzle vault has 4 equally likely crest tokens. You open 7 boxes, each with one random crest. What is the probability you have seen all 4 crests by then?',
    answer: `${formatF(exact)} (${formatDecimal(exact)})`,
    solver:
      'Use inclusion-exclusion on missing crest types, and verify by enumerating all 4^7 draw strings.',
    exactMethod:
      'Exact inclusion-exclusion formula compared with exhaustive enumeration of all draw strings.',
    skillTags,
    misconceptionTraps,
    missingTaxonomyIds: missingTaxonomyIds(skillTags, misconceptionTraps),
    verification: [
      `Formula count: 4^7 - 4 x 3^7 + 6 x 2^7 - 4 x 1^7 = ${formulaCount.toString()}.`,
      `Enumeration count over ${total.toString()} draw strings: ${enumerationCount.toString()}.`,
      `Exact probability: ${formatF(exact)}.`,
      `Simulation sanity check over ${trials.toLocaleString()} vaults: ${estimate.toFixed(3)}.`,
      `Absolute simulation difference: ${diff.toFixed(3)}.`,
    ],
    passed:
      formulaCount === enumerationCount &&
      formulaCount === 8400n &&
      exact.num === 525n &&
      exact.den === 1024n &&
      diff < 0.006,
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

function verifyBallotLeadScoreboard(): ChallengeVerification {
  const red = 6;
  const blue = 4;
  const sequences = ballotSequences(red, blue);
  const favorable = sequences.filter((sequence) => {
    let lead = 0;
    return sequence.every((scorer) => {
      lead += scorer === 'A' ? 1 : -1;
      return lead > 0;
    });
  });
  const exact = frac(favorable.length, sequences.length);
  const formula = frac(red - blue, red + blue);
  const skillTags = ['ordered-vs-unordered', 'combinations', 'ballot-path-counting'];
  const misconceptionTraps = ['ordered_vs_unordered', 'final_margin_equals_staying_ahead'];

  return {
    id: 'challenge-game-0005',
    candidateId: 'CG-CAND-0005',
    title: 'Scoreboard lead lock',
    category: 'ballot/lead probability for small totals',
    difficultyTag: 'extreme',
    prompt:
      'A match ended Red 6, Blue 4. The 10 scoring cards are shuffled and revealed in random order. Given that final score, what is the chance Red is strictly ahead after every reveal?',
    answer: `${formatF(exact)} (${formatDecimal(exact)})`,
    solver:
      'Enumerate all scoring-card orders with six Red cards and four Blue cards, then compare to the ballot formula.',
    exactMethod: 'Exact enumeration of C(10, 4) reveal orders, checked against (a - b) / (a + b).',
    skillTags,
    misconceptionTraps,
    missingTaxonomyIds: missingTaxonomyIds(skillTags, misconceptionTraps),
    verification: [
      `Total reveal orders: C(10, 4) = ${sequences.length}.`,
      `Strictly-ahead orders: ${favorable.length}.`,
      `Enumeration probability: ${formatF(exact)}.`,
      `Ballot formula check: (${red} - ${blue}) / (${red} + ${blue}) = ${formatF(formula)}.`,
    ],
    passed:
      sequences.length === 210 &&
      favorable.length === 42 &&
      exact.num === formula.num &&
      exact.den === formula.den &&
      exact.num === 1n &&
      exact.den === 5n,
  };
}

function verifyFirstRubyTokenDuel(): ChallengeVerification {
  const ruby = 4;
  const slate = 5;
  const total = nCr(ruby + slate, ruby);
  let favorable = 0n;

  for (let firstRubyPosition = 1; firstRubyPosition <= slate + 1; firstRubyPosition += 1) {
    if (firstRubyPosition % 2 === 1) {
      favorable += nCr(ruby + slate - firstRubyPosition, ruby - 1);
    }
  }

  const exact = frac(favorable, total);
  const skillTags = ['combinations', 'complement-rule', 'fair-game', 'ordered-vs-unordered'];
  const misconceptionTraps = ['symmetry_means_fair', 'ignores_without_replacement_dependence'];

  return {
    id: 'challenge-game-0006',
    candidateId: 'CG-CAND-0006',
    title: 'First-ruby token duel',
    category: 'fair/unfair token games',
    difficultyTag: 'hard',
    prompt:
      'A cup holds 4 ruby tokens and 5 slate tokens. Tokens are drawn without replacement until the first ruby appears. Mina wins if that first ruby is on an odd-numbered draw; Sol wins if it is on an even-numbered draw. Is the duel fair?',
    answer: `No. Mina wins with probability ${formatF(exact)} (${formatDecimal(exact)}).`,
    solver:
      'Choose the positions of the 4 ruby tokens among 9 positions; Mina wins when the earliest ruby position is 1, 3, or 5.',
    exactMethod: 'Exact position enumeration using combinations.',
    skillTags,
    misconceptionTraps,
    missingTaxonomyIds: missingTaxonomyIds(skillTags, misconceptionTraps),
    verification: [
      `Total ruby-position sets: C(9, 4) = ${total.toString()}.`,
      `Earliest ruby at position 1: C(8, 3) = ${nCr(8, 3).toString()}.`,
      `Earliest ruby at position 3: C(6, 3) = ${nCr(6, 3).toString()}.`,
      `Earliest ruby at position 5: C(4, 3) = ${nCr(4, 3).toString()}.`,
      `Favorable sets: ${favorable.toString()}.`,
      `Mina win probability: ${formatF(exact)}.`,
    ],
    passed: total === 126n && favorable === 80n && exact.num === 40n && exact.den === 63n,
  };
}

function collectMissingTaxonomyIds(results: ChallengeVerification[]): string[] {
  return [...new Set(results.flatMap((result) => result.missingTaxonomyIds))].sort();
}

function renderMarkdown(results: ChallengeVerification[]): string {
  const missing = collectMissingTaxonomyIds(results);
  const lines = [
    '# Challenge Games Candidate Verification',
    '',
    '> Deterministic verification pass for `challenge-games-batch.md`. These are review artifacts only; no runtime templates, registry entries, or taxonomy files were edited.',
    '',
    '## Summary',
    '',
    `- **Verified problems:** ${results.length}`,
    '- **Source posture:** Pascal-authored contexts and values; no proprietary sources or copied problem text.',
    '- **Verification posture:** Exact enumeration or closed-form exact count for every answer; deterministic simulations appear only as sanity checks.',
    '- **Runtime status:** review artifact only.',
    '',
    '## Missing Taxonomy IDs',
    '',
    ...missing.map((id) => `- ${id}`),
    '',
  ];

  for (const result of results) {
    lines.push(
      `## ${result.id} - ${result.title}`,
      '',
      `- **Candidate:** ${result.candidateId}`,
      `- **Category:** ${result.category}`,
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Prompt:** ${result.prompt}`,
      `- **Answer:** ${result.answer}`,
      `- **Solver:** ${result.solver}`,
      `- **Exact method:** ${result.exactMethod}`,
      `- **Skill tags:** ${result.skillTags.join(', ')}`,
      `- **Misconception traps:** ${result.misconceptionTraps.join(', ')}`,
      `- **Missing taxonomy IDs:** ${result.missingTaxonomyIds.length > 0 ? result.missingTaxonomyIds.join(', ') : 'none'}`,
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

function renderJson(results: ChallengeVerification[]): string {
  return `${JSON.stringify(
    {
      lane: 'challenge-games',
      sourceCandidateFile: 'docs/curriculum-harvest/candidates/challenge-games-batch.md',
      reviewOnly: true,
      generatedBy: 'scripts/curriculum-harvest/verify-challenge-games.ts',
      verifiedCount: results.length,
      missingTaxonomyIds: collectMissingTaxonomyIds(results),
      results,
    },
    null,
    2,
  )}\n`;
}

function renderCandidateBatch(results: ChallengeVerification[]): string {
  const lines = [
    '# Challenge Games Candidate Batch',
    '',
    '> Pascal-authored creative challenge game candidates. These are review artifacts only; do not wire them into runtime templates or the registry from this file.',
    '',
    '## Batch Notes',
    '',
    '- **Source ids:** pascal-authored-challenge-games',
    '- **Reuse mode:** original-authoring-only',
    '- **Verification artifact:** `docs/curriculum-harvest/generated-problems/challenge-games-verified.md`',
    '- **Legal notes:** No proprietary sources, NRICH text, AoPS text, or copied problem wording. Contexts and numbers are authored for this repository.',
    '- **Taxonomy notes:** Missing IDs are listed per candidate; do not add ad hoc IDs inside problem records.',
    '',
  ];

  for (const result of results) {
    lines.push(
      `### ${result.candidateId} - ${result.title}`,
      '',
      '- **Source ids:** pascal-authored-challenge-games',
      '- **Reuse mode:** original-authoring-only',
      '- **Roadmap target:** Challenge practice / creative probability games',
      `- **Practice topic:** ${result.category}`,
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Skills:** ${result.skillTags.join(', ')}`,
      `- **Misconceptions:** ${result.misconceptionTraps.join(', ')}`,
      `- **Missing taxonomy IDs:** ${result.missingTaxonomyIds.length > 0 ? result.missingTaxonomyIds.join(', ') : 'none'}`,
      `- **Core trick:** ${result.solver}`,
      '- **Why it matters:** This is contest-adjacent but probability-first: the challenge is to define the sample space and verify the game outcome exactly.',
      `- **Template sketch:** ${result.prompt}`,
      '- **Interaction fit:** challenge card with prediction, exact enumeration reveal, and misconception-specific distractors.',
      `- **Solver feasibility:** ${result.exactMethod}`,
      '- **Legal notes:** Original Pascal context and values; keep away from NRICH/AoPS wording and proprietary sources.',
      '- **Human status:** pending',
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const results = [
    verifyNonTransitiveDice(),
    verifyThreeTokenScoringBooth(),
    verifyStreakSurvivalFinale(),
    verifyCouponCollectorVault(),
    verifyBallotLeadScoreboard(),
    verifyFirstRubyTokenDuel(),
  ];

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(
      `Challenge game verification failed: ${failed.map((result) => result.id).join(', ')}`,
    );
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CANDIDATE_DIR, { recursive: true });
  const prettierOptions = (await resolveConfig(JSON_PATH)) ?? {};
  await writeFile(
    JSON_PATH,
    await formatWithPrettier(renderJson(results), { ...prettierOptions, parser: 'json' }),
  );
  await writeFile(
    MD_PATH,
    await formatWithPrettier(renderMarkdown(results), { ...prettierOptions, parser: 'markdown' }),
  );
  await writeFile(
    CANDIDATE_PATH,
    await formatWithPrettier(renderCandidateBatch(results), {
      ...prettierOptions,
      parser: 'markdown',
    }),
  );

  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), CANDIDATE_PATH)}`);
  console.log(`verified ${results.length} challenge game problems`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
