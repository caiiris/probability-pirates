import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { SKILLS } from '@/content/skills';
import { addF, divF, eqF, frac, mulF, subF, type Fraction } from '@/lib/probability/exact';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const CANDIDATE_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/candidates');
const JSON_PATH = path.join(OUT_DIR, 'expected-value-verified.json');
const MD_PATH = path.join(OUT_DIR, 'expected-value-verified.md');
const CANDIDATE_PATH = path.join(CANDIDATE_DIR, 'expected-value-batch.md');
const SCRIPT_ID = 'scripts/curriculum-harvest/verify-expected-value.ts';

const TAXONOMY_SKILLS = new Set<string>(Object.keys(SKILLS));

type DifficultyTag = 'medium' | 'hard' | 'extreme';

type PayoffOutcome = {
  label: string;
  probability: Fraction;
  payoffCents: Fraction;
};

type SerializedOutcome = {
  label: string;
  probability: string;
  payoffCents: string;
};

type ExpectedValueVerification = {
  id: string;
  candidateId: string;
  title: string;
  category: string;
  difficultyTag: DifficultyTag;
  prompt: string;
  answer: string;
  solver: string;
  skills: string[];
  recognizedSkillIds: string[];
  missingTaxonomyIds: string[];
  misconceptions: string[];
  coreTrick: string;
  templateSketch: string;
  interactionFit: string;
  solverFeasibility: string;
  outcomes?: SerializedOutcome[];
  verification: string[];
  passed: boolean;
};

type LanePayload = {
  generatedBy: string;
  expands: string;
  noModelOrApiCalls: boolean;
  problemCount: number;
  verifiedCount: number;
  missingTaxonomyIds: string[];
  blockers: string[];
  problems: ExpectedValueVerification[];
};

function formatF(f: Fraction): string {
  return `${f.num.toString()}/${f.den.toString()}`;
}

function formatCents(f: Fraction): string {
  if (f.den !== 1n) return `${formatF(f)} cents`;

  const negative = f.num < 0n;
  const abs = negative ? -f.num : f.num;
  const dollars = abs / 100n;
  const cents = abs % 100n;
  return `${negative ? '-' : ''}$${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
}

function formatCentsExact(f: Fraction): string {
  if (f.den === 1n) return `${formatCents(f)} (${formatF(f)} cents)`;
  return `${formatF(f)} cents (${formatF(divF(f, frac(100)))} dollars)`;
}

function compareF(a: Fraction, b: Fraction): number {
  const diff = subF(a, b);
  if (diff.num < 0n) return -1;
  if (diff.num > 0n) return 1;
  return 0;
}

function sumProbabilities(outcomes: PayoffOutcome[]): Fraction {
  return outcomes.reduce((sum, outcome) => addF(sum, outcome.probability), frac(0));
}

function expectedCents(outcomes: PayoffOutcome[]): Fraction {
  return outcomes.reduce(
    (sum, outcome) => addF(sum, mulF(outcome.payoffCents, outcome.probability)),
    frac(0),
  );
}

function serializeOutcomes(outcomes: PayoffOutcome[]): SerializedOutcome[] {
  return outcomes.map((outcome) => ({
    label: outcome.label,
    probability: formatF(outcome.probability),
    payoffCents: formatF(outcome.payoffCents),
  }));
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function attachTaxonomy(
  result: Omit<ExpectedValueVerification, 'recognizedSkillIds' | 'missingTaxonomyIds'>,
): ExpectedValueVerification {
  return {
    ...result,
    recognizedSkillIds: result.skills.filter((skill) => TAXONOMY_SKILLS.has(skill)),
    missingTaxonomyIds: result.skills.filter((skill) => !TAXONOMY_SKILLS.has(skill)),
  };
}

function verifySimplePayoffTable(): ExpectedValueVerification {
  const outcomes: PayoffOutcome[] = [
    { label: 'Red sector', probability: frac(1, 2), payoffCents: frac(200) },
    { label: 'Blue sector', probability: frac(1, 3), payoffCents: frac(50) },
    { label: 'Gray sector', probability: frac(1, 6), payoffCents: frac(-100) },
  ];
  const probabilitySum = sumProbabilities(outcomes);
  const expected = expectedCents(outcomes);

  return attachTaxonomy({
    id: 'expected-value-0001',
    candidateId: 'EV-CAND-0001',
    title: 'Spinner payoff table average',
    category: 'simple payoff table expected value',
    difficultyTag: 'medium',
    prompt:
      'A carnival spinner lands on red with probability 1/2, blue with probability 1/3, and gray with probability 1/6. Red pays $2.00, blue pays $0.50, and gray loses $1.00. What is the long-run average payoff per spin?',
    answer: formatCentsExact(expected),
    solver: 'E = 200(1/2) + 50(1/3) - 100(1/6) cents',
    skills: ['expected-value', 'weighted-average', 'long-run-vs-single-trial', 'probability-distribution'],
    misconceptions: [
      'chooses-most-likely-outcome-as-average',
      'ignores-negative-payoff',
      'adds-payoffs-without-probability-weights',
    ],
    coreTrick: 'Treat each payoff as a signed number of cents before taking the weighted average.',
    templateSketch: 'Generate a 3- or 4-row payoff table with rational probabilities and signed cent payoffs.',
    interactionFit: 'Payoff table plus fill-currency answer.',
    solverFeasibility: 'Exact rational cents arithmetic over a short outcome table.',
    outcomes: serializeOutcomes(outcomes),
    verification: [
      `Probability mass sums to ${formatF(probabilitySum)}.`,
      `Exact expected payoff is ${formatCentsExact(expected)}.`,
      'Negative gray spins are included as negative cents, not ignored.',
    ],
    passed: eqF(probabilitySum, frac(1)) && eqF(expected, frac(100)),
  });
}

function verifyFairEntryPrice(): ExpectedValueVerification {
  const outcomes: PayoffOutcome[] = [
    { label: 'Top stripe', probability: frac(1, 4), payoffCents: frac(700) },
    { label: 'Small stripe', probability: frac(1, 8), payoffCents: frac(100) },
    { label: 'Blank stripe', probability: frac(5, 8), payoffCents: frac(0) },
  ];
  const probabilitySum = sumProbabilities(outcomes);
  const fairPrice = expectedCents(outcomes);

  return attachTaxonomy({
    id: 'expected-value-0002',
    candidateId: 'EV-CAND-0002',
    title: 'Fair entry price for a prize wheel',
    category: 'fair entry price',
    difficultyTag: 'medium',
    prompt:
      'A prize wheel pays $7.00 on the top stripe, $1.00 on a small stripe, and $0 on the blank area. The probabilities are 1/4, 1/8, and 5/8. What exact entry price, in cents, would make this game fair in the long run?',
    answer: `Fair price = ${formatCentsExact(fairPrice)}`,
    solver: 'Fair entry price equals the expected gross prize.',
    skills: ['expected-value', 'fair-game', 'weighted-average', 'long-run-vs-single-trial'],
    misconceptions: [
      'sets-fair-price-to-most-common-prize',
      'rounds-before-computing',
      'confuses-gross-prize-with-net-gain',
    ],
    coreTrick: 'A fair price is the break-even long-run average prize before rounding.',
    templateSketch: 'Generate prize-wheel probabilities and ask for the exact fair entry price in cents.',
    interactionFit: 'Fill-fraction cents answer, optionally followed by a fair/unfair comparison.',
    solverFeasibility: 'Exact rational cents arithmetic; no decimal rounding required.',
    outcomes: serializeOutcomes(outcomes),
    verification: [
      `Probability mass sums to ${formatF(probabilitySum)}.`,
      `Expected gross prize is ${formatCentsExact(fairPrice)}.`,
      'The answer is intentionally a rational number of cents, so rounding is not part of verification.',
    ],
    passed: eqF(probabilitySum, frac(1)) && eqF(fairPrice, frac(375, 2)),
  });
}

function verifyNonlinearBonusTrap(): ExpectedValueVerification {
  const outcomes: PayoffOutcome[] = [
    { label: '0 stars', probability: frac(1, 5), payoffCents: frac(0) },
    { label: '1 star', probability: frac(3, 10), payoffCents: frac(60) },
    { label: '2 stars', probability: frac(1, 4), payoffCents: frac(120) },
    { label: '3 stars', probability: frac(1, 5), payoffCents: frac(270) },
    { label: '5 stars', probability: frac(1, 20), payoffCents: frac(570) },
  ];
  const probabilitySum = sumProbabilities(outcomes);
  const expected = expectedCents(outcomes);
  const expectedStars = addF(
    addF(addF(mulF(frac(1), frac(3, 10)), mulF(frac(2), frac(1, 4))), mulF(frac(3), frac(1, 5))),
    mulF(frac(5), frac(1, 20)),
  );
  const naiveLinearPayoff = mulF(expectedStars, frac(60));

  return attachTaxonomy({
    id: 'expected-value-0003',
    candidateId: 'EV-CAND-0003',
    title: 'Bonus stars with nonlinear payoff',
    category: 'nonlinear payoff rule',
    difficultyTag: 'hard',
    prompt:
      'An arcade card reveals 0, 1, 2, 3, or 5 stars with probabilities 1/5, 3/10, 1/4, 1/5, and 1/20. The first two stars pay 60 cents each, but every star after the second pays 150 cents. What is the long-run average payoff per card?',
    answer: formatCentsExact(expected),
    solver: 'Convert each star count to its rule-based payoff first, then weight those payoffs.',
    skills: ['expected-value', 'payoff-modeling', 'weighted-average', 'nonlinear-payoff'],
    misconceptions: [
      'multiplies-expected-count-by-unit-price',
      'ignores-bonus-threshold',
      'uses-most-likely-count-as-average',
    ],
    coreTrick: 'Expected star count times 60 cents is wrong because the payoff rule changes after two stars.',
    templateSketch: 'Generate a count distribution with a threshold bonus, discount, or penalty rule.',
    interactionFit: 'Rule interpretation card, payoff-table builder, then exact cents entry.',
    solverFeasibility: 'Exact cents per outcome; verify the nonlinear shortcut gives a different value.',
    outcomes: serializeOutcomes(outcomes),
    verification: [
      `Probability mass sums to ${formatF(probabilitySum)}.`,
      `Exact expected payoff is ${formatCentsExact(expected)}.`,
      `Expected stars are ${formatF(expectedStars)}.`,
      `Naive 60-cent shortcut gives ${formatCentsExact(naiveLinearPayoff)}, so the trap is active.`,
    ],
    passed:
      eqF(probabilitySum, frac(1)) &&
      eqF(expected, frac(261, 2)) &&
      eqF(naiveLinearPayoff, frac(99)) &&
      !eqF(expected, naiveLinearPayoff),
  });
}

function verifyChooseBetweenGames(): ExpectedValueVerification {
  const gameA: PayoffOutcome[] = [
    { label: 'Jackpot', probability: frac(1, 5), payoffCents: frac(700) },
    { label: 'Miss', probability: frac(4, 5), payoffCents: frac(-50) },
  ];
  const gameB: PayoffOutcome[] = [
    { label: 'Win', probability: frac(1, 2), payoffCents: frac(240) },
    { label: 'No win', probability: frac(1, 2), payoffCents: frac(0) },
  ];
  const expectedA = expectedCents(gameA);
  const expectedB = expectedCents(gameB);
  const edge = subF(expectedB, expectedA);

  return attachTaxonomy({
    id: 'expected-value-0004',
    candidateId: 'EV-CAND-0004',
    title: 'Choose the better long-run game',
    category: 'choose between two games by expected value',
    difficultyTag: 'hard',
    prompt:
      'You can play one of two games many times. Game A pays $7.00 with probability 1/5 and loses $0.50 otherwise. Game B pays $2.40 with probability 1/2 and pays $0 otherwise. Which game has the better long-run average payoff?',
    answer: `Choose Game B; its expected payoff is higher by ${formatCentsExact(edge)} per play.`,
    solver: 'Compute each game EV separately, then compare.',
    skills: ['expected-value', 'strategy-choice', 'weighted-average', 'long-run-vs-single-trial'],
    misconceptions: [
      'chooses-largest-jackpot',
      'ignores-loss-frequency',
      'compares-win-probability-without-payoff-size',
    ],
    coreTrick: 'The bigger jackpot is not enough; long-run choice depends on probability-weighted payoff.',
    templateSketch: 'Generate two games with competing jackpot size and win frequency.',
    interactionFit: 'Two-card comparison with multiple-choice strategy and exact EV reveal.',
    solverFeasibility: 'Two exact EV computations and a rational comparison.',
    verification: [
      `Game A expected payoff is ${formatCentsExact(expectedA)}.`,
      `Game B expected payoff is ${formatCentsExact(expectedB)}.`,
      `Game B edge is ${formatCentsExact(edge)}.`,
    ],
    passed:
      eqF(sumProbabilities(gameA), frac(1)) &&
      eqF(sumProbabilities(gameB), frac(1)) &&
      eqF(expectedA, frac(100)) &&
      eqF(expectedB, frac(120)) &&
      compareF(expectedB, expectedA) > 0,
  });
}

function verifyNetGainAfterCost(): ExpectedValueVerification {
  const prizeOutcomes: PayoffOutcome[] = [
    { label: '$20 prize', probability: frac(1, 20), payoffCents: frac(2000) },
    { label: '$5 prize', probability: frac(3, 20), payoffCents: frac(500) },
    { label: 'No prize', probability: frac(16, 20), payoffCents: frac(0) },
  ];
  const gross = expectedCents(prizeOutcomes);
  const cost = frac(275);
  const net = subF(gross, cost);

  return attachTaxonomy({
    id: 'expected-value-0005',
    candidateId: 'EV-CAND-0005',
    title: 'Raffle ticket expected net gain',
    category: 'expected net gain after cost',
    difficultyTag: 'medium',
    prompt:
      'A raffle ticket costs $2.75. It wins $20 with probability 1/20, $5 with probability 3/20, and $0 otherwise. What is the expected net gain per ticket over the long run?',
    answer: `${formatCentsExact(net)} per ticket`,
    solver: 'Expected net gain = expected gross prize - ticket cost.',
    skills: ['expected-value', 'expected-net-gain', 'weighted-average', 'long-run-vs-single-trial'],
    misconceptions: [
      'reports-gross-prize-instead-of-net',
      'forgets-ticket-cost',
      'treats-rare-large-prize-as-typical',
    ],
    coreTrick: 'Subtract the certain cost after computing the expected gross prize.',
    templateSketch: 'Generate a raffle or insurance table with a fixed entry cost.',
    interactionFit: 'Prize table plus signed currency entry for net gain.',
    solverFeasibility: 'Exact integer cents arithmetic; cost is a deterministic subtraction.',
    outcomes: serializeOutcomes(prizeOutcomes),
    verification: [
      `Prize probabilities sum to ${formatF(sumProbabilities(prizeOutcomes))}.`,
      `Expected gross prize is ${formatCentsExact(gross)}.`,
      `After subtracting ${formatCentsExact(cost)}, expected net gain is ${formatCentsExact(net)}.`,
    ],
    passed: eqF(sumProbabilities(prizeOutcomes), frac(1)) && eqF(gross, frac(175)) && eqF(net, frac(-100)),
  });
}

function verifyFairJackpot(): ExpectedValueVerification {
  const cost = frac(300);
  const refundExpected = mulF(frac(300), frac(2, 6));
  const jackpot = divF(subF(cost, refundExpected), frac(1, 6));
  const net = subF(addF(mulF(jackpot, frac(1, 6)), refundExpected), cost);

  return attachTaxonomy({
    id: 'expected-value-0006',
    candidateId: 'EV-CAND-0006',
    title: 'Set the jackpot to make a die game fair',
    category: 'fair game payoff design',
    difficultyTag: 'hard',
    prompt:
      'A die game costs $3.00. Rolling a 6 wins a jackpot, rolling 4 or 5 returns $3.00, and rolling 1, 2, or 3 pays $0. What jackpot makes the expected net gain exactly $0?',
    answer: `The fair jackpot is ${formatCentsExact(jackpot)}.`,
    solver: 'Set jackpot(1/6) + 300(2/6) - 300 = 0 and solve exactly.',
    skills: ['expected-value', 'fair-game', 'payoff-modeling', 'algebraic-payoff'],
    misconceptions: [
      'sets-jackpot-equal-to-entry-cost',
      'forgets-refund-outcomes',
      'solves-for-gross-payoff-instead-of-net-zero',
    ],
    coreTrick: 'Fair means expected net gain is zero, so the known refund outcomes reduce the jackpot needed.',
    templateSketch: 'Generate a cost, a partial-refund event, and solve for the fair jackpot or penalty.',
    interactionFit: 'Equation-building step followed by fill-currency answer.',
    solverFeasibility: 'Single linear equation over rational cents.',
    verification: [
      `Expected refund contribution is ${formatCentsExact(refundExpected)}.`,
      `Required jackpot solves to ${formatCentsExact(jackpot)}.`,
      `Expected net gain with that jackpot is ${formatCentsExact(net)}.`,
    ],
    passed: eqF(refundExpected, frac(100)) && eqF(jackpot, frac(1200)) && eqF(net, frac(0)),
  });
}

function verifyTwoDiceStrategy(): ExpectedValueVerification {
  let safeGross = frac(0);
  let riskyGross = frac(0);
  const outcomeProbability = frac(1, 36);

  for (let first = 1; first <= 6; first += 1) {
    for (let second = 1; second <= 6; second += 1) {
      safeGross = addF(safeGross, mulF(frac(Math.max(first, second) * 100), outcomeProbability));

      let riskyPayoff = -100;
      if (first === second) {
        riskyPayoff = 1000;
      } else if (Math.abs(first - second) === 1) {
        riskyPayoff = 200;
      }
      riskyGross = addF(riskyGross, mulF(frac(riskyPayoff), outcomeProbability));
    }
  }

  const entryCost = frac(300);
  const safeNet = subF(safeGross, entryCost);
  const riskyNet = subF(riskyGross, entryCost);
  const edge = subF(safeNet, riskyNet);

  return attachTaxonomy({
    id: 'expected-value-0007',
    candidateId: 'EV-CAND-0007',
    title: 'Two-dice booth strategy',
    category: 'payoff strategy choice',
    difficultyTag: 'extreme',
    prompt:
      'Two arcade booths each cost $3.00 and use two fair dice. Safe Booth pays $1.00 times the higher die. Risky Booth pays $10.00 for doubles, $2.00 when the dice differ by 1, and charges a $1.00 penalty otherwise. Which booth has the better long-run net payoff?',
    answer: `Choose Safe Booth; its expected net payoff is higher by ${formatCentsExact(edge)}.`,
    solver: 'Enumerate the 36 ordered dice outcomes and compute net EV for each booth.',
    skills: ['expected-value', 'strategy-choice', 'sample-space-enumeration', 'payoff-modeling'],
    misconceptions: [
      'chooses-largest-possible-prize',
      'ignores-ordered-dice-outcomes',
      'forgets-entry-cost-or-penalty',
    ],
    coreTrick: 'The risky booth has a bigger top prize, but its many penalty outcomes dominate the average.',
    templateSketch: 'Generate two dice-based payoff strategies and verify by exact 36-outcome enumeration.',
    interactionFit: 'Outcome-grid comparison plus choose-strategy multiple choice.',
    solverFeasibility: 'Exact enumeration over 36 ordered outcomes with rational cents comparison.',
    verification: [
      `Safe Booth gross EV is ${formatCentsExact(safeGross)}; net EV is ${formatCentsExact(safeNet)}.`,
      `Risky Booth gross EV is ${formatCentsExact(riskyGross)}; net EV is ${formatCentsExact(riskyNet)}.`,
      `Safe Booth edge is ${formatCentsExact(edge)}.`,
    ],
    passed:
      eqF(safeGross, frac(4025, 9)) &&
      eqF(riskyGross, frac(500, 3)) &&
      eqF(safeNet, frac(1325, 9)) &&
      eqF(riskyNet, frac(-400, 3)) &&
      compareF(safeNet, riskyNet) > 0,
  });
}

function buildResults(): ExpectedValueVerification[] {
  return [
    verifySimplePayoffTable(),
    verifyFairEntryPrice(),
    verifyNonlinearBonusTrap(),
    verifyChooseBetweenGames(),
    verifyNetGainAfterCost(),
    verifyFairJackpot(),
    verifyTwoDiceStrategy(),
  ];
}

function renderMarkdown(payload: LanePayload): string {
  const lines = [
    '# Expected Value Candidate Verification',
    '',
    '> Deterministic verification pass for expected value / fair games / payoff strategy candidates. These are review artifacts, not runtime practice templates yet.',
    '',
    `- **Generated by:** \`${payload.generatedBy}\``,
    `- **Expands:** ${payload.expands}`,
    `- **No model/API calls:** ${payload.noModelOrApiCalls ? 'yes' : 'no'}`,
    `- **Verified problems:** ${payload.verifiedCount}/${payload.problemCount}`,
    `- **Missing taxonomy IDs:** ${payload.missingTaxonomyIds.length > 0 ? payload.missingTaxonomyIds.join(', ') : 'none'}`,
    '',
    '## Blockers / Taxonomy Notes',
    '',
    ...(payload.blockers.length > 0 ? payload.blockers.map((blocker) => `- ${blocker}`) : ['- None.']),
    '',
  ];

  for (const result of payload.problems) {
    lines.push(
      `## ${result.id} - ${result.title}`,
      '',
      `- **Candidate:** ${result.candidateId}`,
      `- **Category:** ${result.category}`,
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Prompt:** ${result.prompt}`,
      `- **Answer:** ${result.answer}`,
      `- **Solver:** ${result.solver}`,
      `- **Skills:** ${result.skills.join(', ')}`,
      `- **Recognized taxonomy IDs:** ${result.recognizedSkillIds.length > 0 ? result.recognizedSkillIds.join(', ') : 'none'}`,
      `- **Missing taxonomy IDs:** ${result.missingTaxonomyIds.length > 0 ? result.missingTaxonomyIds.join(', ') : 'none'}`,
      `- **Misconception traps:** ${result.misconceptions.join(', ')}`,
      `- **Passed:** ${result.passed ? 'yes' : 'no'}`,
      '',
    );

    if (result.outcomes !== undefined) {
      lines.push('### Outcome Payoffs', '');
      for (const outcome of result.outcomes) {
        lines.push(`- ${outcome.label}: probability ${outcome.probability}, payoff ${outcome.payoffCents} cents`);
      }
      lines.push('');
    }

    lines.push('### Verification', '', ...result.verification.map((line) => `- ${line}`), '');
  }

  return `${lines.join('\n')}\n`;
}

function renderCandidateBatch(payload: LanePayload): string {
  const lines = [
    '# Expected Value Candidate Batch',
    '',
    '> Generated by `scripts/curriculum-harvest/verify-expected-value.ts`. Original Pascal-authored examples only; no model/API calls and no runtime app edits.',
    '',
    '## Batch Notes',
    '',
    `- **Expands:** ${payload.expands}`,
    `- **Verified problems:** ${payload.verifiedCount}/${payload.problemCount}`,
    `- **Missing taxonomy IDs:** ${payload.missingTaxonomyIds.length > 0 ? payload.missingTaxonomyIds.join(', ') : 'none'}`,
    '- **Taxonomy action:** Record missing IDs here only. Do not edit runtime taxonomy as part of this lane.',
    '',
  ];

  for (const result of payload.problems) {
    lines.push(
      `### ${result.candidateId} - ${result.title}`,
      '',
      '- **Source ids:** pascal-authored-expected-value-lane',
      '- **Reuse mode:** original',
      '- **Roadmap target:** Unit 7 - Expected Value',
      '- **Practice topic:** expected-value',
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Skills:** ${result.skills.join(', ')}`,
      `- **Missing taxonomy ids:** ${result.missingTaxonomyIds.length > 0 ? result.missingTaxonomyIds.join(', ') : 'none'}`,
      `- **Misconceptions:** ${result.misconceptions.join(', ')}`,
      `- **Core trick:** ${result.coreTrick}`,
      `- **Why it matters:** Frames expected value as long-run average payoff, fair price, or strategy choice instead of abstract random-variable vocabulary.`,
      `- **Template sketch:** ${result.templateSketch}`,
      `- **Interaction fit:** ${result.interactionFit}`,
      `- **Solver feasibility:** ${result.solverFeasibility}`,
      '- **Legal notes:** Original wording and values authored for Pascal; no source text copied.',
      '- **Human status:** verified',
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const problems = buildResults();
  const failed = problems.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`Expected value verification failed: ${failed.map((result) => result.id).join(', ')}`);
  }

  const missingTaxonomyIds = unique(problems.flatMap((result) => result.missingTaxonomyIds));
  const blockers =
    missingTaxonomyIds.length > 0
      ? [
          `Runtime taxonomy is missing these proposed skill IDs: ${missingTaxonomyIds.join(', ')}.`,
          'In particular, `expected-value` is not present in `src/content/skills.ts`; this lane records it without editing taxonomy.',
        ]
      : [];
  const payload: LanePayload = {
    generatedBy: SCRIPT_ID,
    expands: 'CL-0022 - Nonlinear payoff expected value, broadened into fair price, net gain, and strategy-choice variants.',
    noModelOrApiCalls: true,
    problemCount: problems.length,
    verifiedCount: problems.length - failed.length,
    missingTaxonomyIds,
    blockers,
    problems,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CANDIDATE_DIR, { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(MD_PATH, renderMarkdown(payload));
  await writeFile(CANDIDATE_PATH, renderCandidateBatch(payload));

  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), CANDIDATE_PATH)}`);
  console.log(`verified ${payload.verifiedCount}/${payload.problemCount} expected-value problems`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
