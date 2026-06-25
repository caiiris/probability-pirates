import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { frac, toNumber, type Fraction } from '@/lib/probability/exact';
import { mulberry32, type Rng } from '@/lib/simulations';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const JSON_PATH = path.join(OUT_DIR, 'cl-0001-at-least-one-via-complement.json');
const MD_PATH = path.join(OUT_DIR, 'cl-0001-at-least-one-via-complement.md');

type ScenarioId = 'checkInPrompt' | 'puzzleStrategy' | 'clearPing' | 'qualityCheck';

type Params = {
  id: string;
  n: number;
  pNum: number;
  pDen: number;
  scenarioId: ScenarioId;
};

type VerifiedProblem = {
  id: string;
  clusterId: 'CL-0001';
  templateId: 'at-least-one-via-complement';
  topic: 'complement';
  skills: ['complement-rule', 'independence'];
  retrievalForm: 'procedural';
  difficulty: number;
  params: Params;
  prompt: string;
  answer: { kind: 'fraction'; num: string; den: string; display: string; decimal: number };
  verification: {
    solver: '1 - ((pDen - pNum) / pDen)^n';
    exactComplement: string;
    simulation: {
      seed: number;
      trials: number;
      estimate: number;
      sigmaThreshold: number;
      absoluteDifference: number;
      passed: boolean;
    };
  };
  workedSolution: {
    title: string;
    steps: string[];
  };
  reviewNotes: string[];
};

const REVIEW_PARAMS: Params[] = [
  { id: 'cl0001-p01', n: 3, pNum: 1, pDen: 2, scenarioId: 'checkInPrompt' },
  { id: 'cl0001-p02', n: 4, pNum: 3, pDen: 5, scenarioId: 'clearPing' },
  { id: 'cl0001-p03', n: 5, pNum: 1, pDen: 3, scenarioId: 'puzzleStrategy' },
  { id: 'cl0001-p04', n: 6, pNum: 1, pDen: 4, scenarioId: 'qualityCheck' },
  { id: 'cl0001-p05', n: 4, pNum: 7, pDen: 10, scenarioId: 'checkInPrompt' },
];

function powBigInt(base: number, exponent: number): bigint {
  return BigInt(base) ** BigInt(exponent);
}

function solve(params: Params): Fraction {
  const noneNum = powBigInt(params.pDen - params.pNum, params.n);
  const noneDen = powBigInt(params.pDen, params.n);
  return frac(noneDen - noneNum, noneDen);
}

function complementFraction(params: Params): Fraction {
  return frac(powBigInt(params.pDen - params.pNum, params.n), powBigInt(params.pDen, params.n));
}

function rate(params: Params): number {
  const hasLargeDenominator = params.pDen >= 6 ? 90 : 0;
  const hasMiddleProbability = params.pNum !== 1 && params.pNum !== params.pDen - 1 ? 60 : 0;
  return Math.min(1300, Math.max(900, 900 + 45 * (params.n - 2) + hasLargeDenominator + hasMiddleProbability));
}

function probabilityText(params: Params): string {
  return `${params.pNum}/${params.pDen}`;
}

function failureText(params: Params): string {
  return `${params.pDen - params.pNum}/${params.pDen}`;
}

function promptFor(params: Params): string {
  const p = probabilityText(params);
  switch (params.scenarioId) {
    case 'checkInPrompt':
      return `Pascal sends ${params.n} independent check-in prompts. Each prompt has a ${p} chance of being noticed. What is the probability that at least one prompt is noticed?`;
    case 'puzzleStrategy':
      return `A learner tries ${params.n} independent puzzle strategies. Each strategy has a ${p} chance of working. What is the probability that at least one strategy works?`;
    case 'clearPing':
      return `A sensor sends ${params.n} independent pings. Each ping has a ${p} chance of arriving clearly. What is the probability that at least one ping arrives clearly?`;
    case 'qualityCheck':
      return `A robot runs ${params.n} independent quality checks. Each check has a ${p} chance of catching a flaw. What is the probability that at least one check catches the flaw?`;
  }
}

function simulate(params: Params, trials: number, rng: Rng): number {
  let successes = 0;
  for (let trial = 0; trial < trials; trial += 1) {
    let sawSuccess = false;
    for (let attempt = 0; attempt < params.n; attempt += 1) {
      if (rng() < params.pNum / params.pDen) {
        sawSuccess = true;
      }
    }
    if (sawSuccess) {
      successes += 1;
    }
  }
  return successes / trials;
}

function verify(params: Params, index: number): VerifiedProblem['verification'] {
  const exact = solve(params);
  const p = toNumber(exact);
  const trials = 50_000;
  const seed = 0xc10001 + index * 97;
  const estimate = simulate(params, trials, mulberry32(seed));
  const sigmaThreshold = 5 * (Math.sqrt((p * (1 - p)) / trials) || 1 / trials);
  const absoluteDifference = Math.abs(estimate - p);

  return {
    solver: '1 - ((pDen - pNum) / pDen)^n',
    exactComplement: formatFraction(complementFraction(params)),
    simulation: {
      seed,
      trials,
      estimate,
      sigmaThreshold,
      absoluteDifference,
      passed: absoluteDifference < sigmaThreshold,
    },
  };
}

function formatFraction(fraction: Fraction): string {
  return `${fraction.num.toString()}/${fraction.den.toString()}`;
}

function solutionFor(params: Params): VerifiedProblem['workedSolution'] {
  const failure = failureText(params);
  const complement = complementFraction(params);
  const answer = solve(params);

  return {
    title: 'Use the complement',
    steps: [
      `"At least one" is easier to get by looking at the opposite event: zero successes.`,
      `One attempt fails with probability ${failure}.`,
      `Because the attempts are independent, all ${params.n} attempts fail with probability (${failure})^${params.n} = ${formatFraction(complement)}.`,
      `So P(at least one success) = 1 - ${formatFraction(complement)} = ${formatFraction(answer)}.`,
    ],
  };
}

function buildProblem(params: Params, index: number): VerifiedProblem {
  const answer = solve(params);
  const verification = verify(params, index);
  if (!verification.simulation.passed) {
    throw new Error(`${params.id} failed simulation verification`);
  }

  return {
    id: params.id,
    clusterId: 'CL-0001',
    templateId: 'at-least-one-via-complement',
    topic: 'complement',
    skills: ['complement-rule', 'independence'],
    retrievalForm: 'procedural',
    difficulty: rate(params),
    params,
    prompt: promptFor(params),
    answer: {
      kind: 'fraction',
      num: answer.num.toString(),
      den: answer.den.toString(),
      display: formatFraction(answer),
      decimal: toNumber(answer),
    },
    verification,
    workedSolution: solutionFor(params),
    reviewNotes: [
      'Review learner-facing wording for clarity and age fit.',
      'Verify this feels like complement-rule practice, not arithmetic grind.',
      'No source wording should be present; run harvest wording audit before product use.',
    ],
  };
}

function renderMarkdown(problems: VerifiedProblem[]): string {
  const lines: string[] = [
    '# CL-0001 Review Set — At Least One Via Complement',
    '',
    '> Five Pascal-authored practice problems generated from `template-briefs/cl-0001-at-least-one-via-complement.md`.',
    '> Each answer is exact-solver verified and Monte-Carlo checked locally. This is a review artifact, not shipped product content yet.',
    '',
    '## Bank Metadata',
    '',
    '- **Cluster:** CL-0001',
    '- **Template id:** `at-least-one-via-complement`',
    '- **Topic:** `complement`',
    '- **Skills:** `complement-rule`, `independence`',
    '- **Retrieval form:** `procedural`',
    '- **Interaction kind:** `fill-fraction`',
    '- **Reuse posture:** Pascal-authored wording; source inspiration only from approved harvest brief.',
    '',
  ];

  for (const [index, problem] of problems.entries()) {
    lines.push(
      `## Problem ${index + 1} — ${problem.id}`,
      '',
      `- **Difficulty:** ${problem.difficulty}`,
      `- **Params:** n=${problem.params.n}, p=${problem.params.pNum}/${problem.params.pDen}, scenario=${problem.params.scenarioId}`,
      `- **Prompt:** ${problem.prompt}`,
      `- **Answer:** ${problem.answer.display} (${problem.answer.decimal.toFixed(6)})`,
      '',
      '### Verified Solution',
      '',
      ...problem.workedSolution.steps.map((step) => `- ${step}`),
      '',
      '### Verification',
      '',
      `- **Exact solver:** ${problem.verification.solver}`,
      `- **Exact complement:** ${problem.verification.exactComplement}`,
      `- **Simulation:** ${problem.verification.simulation.estimate.toFixed(6)} over ${problem.verification.simulation.trials.toLocaleString()} trials`,
      `- **Absolute diff:** ${problem.verification.simulation.absoluteDifference.toFixed(6)}`,
      `- **5-sigma threshold:** ${problem.verification.simulation.sigmaThreshold.toFixed(6)}`,
      `- **Passed:** ${problem.verification.simulation.passed ? 'yes' : 'no'}`,
      '',
    );
  }

  lines.push(
    '## Human Review Checklist',
    '',
    '- Are the scenarios age-appropriate and not too dry?',
    '- Do the five prompts feel varied enough for a first template family?',
    '- Is the complement move visible in the worked solution?',
    '- Should any problem use multiple-choice scaffolding before `fill-fraction`?',
    '- If approved, convert this family into `src/features/practice/templates/at-least-one-via-complement.ts` after the problem bank layout is approved.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const problems = REVIEW_PARAMS.map(buildProblem);
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(problems, null, 2)}\n`);
  await writeFile(MD_PATH, renderMarkdown(problems));
  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

