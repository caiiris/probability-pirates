import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const JSON_PATH = path.join(OUT_DIR, 'model-inference-verified.json');
const MD_PATH = path.join(OUT_DIR, 'model-inference-verified.md');

type ScoringMethod = 'expected-count-distance' | 'multinomial-log-likelihood';

type CandidateModel = {
  id: string;
  label: string;
  probabilities: number[];
};

type ProblemDefinition = {
  id: string;
  candidateId: string;
  title: string;
  difficultyTag: string;
  skillTags: string[];
  misconceptions: string[];
  taxonomyStatus: string[];
  prompt: string;
  observedLabels: string[];
  observedCounts: number[];
  models: CandidateModel[];
  intendedModelId: string;
  scoringMethod: ScoringMethod;
  answer: string;
  workedSolution: string[];
  notes: string[];
};

type CandidateScore = {
  id: string;
  label: string;
  expectedCounts: number[];
  score: number;
};

type VerificationResult = {
  scoringMethod: ScoringMethod;
  selectedModelId: string;
  selectedModelLabel: string;
  intendedModelId: string;
  scoreMargin: number;
  passed: boolean;
  candidateScores: CandidateScore[];
  summary: string;
};

type VerifiedProblem = ProblemDefinition & {
  sampleSize: number;
  verification: VerificationResult;
};

const EPSILON = 1e-9;

const problems: ProblemDefinition[] = [
  {
    id: 'model-inference-0001',
    candidateId: 'MI-CAND-0001',
    title: 'Choose the spinner from frequency counts',
    difficultyTag: 'medium-hard / model inference',
    skillTags: ['relative-frequency', 'expected-counts', 'model-selection', 'inverse-spinner'],
    misconceptions: [
      'expects-observed-counts-to-match-exactly',
      'ignores-total-sample-size',
      'chooses-largest-section-from-largest-count-only',
    ],
    taxonomyStatus: ['missing-canonical-topic:model-inference', 'missing-skill-id:inverse-spinner'],
    prompt:
      'A hidden 3-color spinner was spun 60 times. The counts were red 33, blue 17, yellow 10. Which candidate spinner is the best match?',
    observedLabels: ['red', 'blue', 'yellow'],
    observedCounts: [33, 17, 10],
    models: [
      { id: 'A', label: 'red 1/2, blue 1/3, yellow 1/6', probabilities: [1 / 2, 1 / 3, 1 / 6] },
      { id: 'B', label: 'red 1/3, blue 1/3, yellow 1/3', probabilities: [1 / 3, 1 / 3, 1 / 3] },
      { id: 'C', label: 'red 2/3, blue 1/6, yellow 1/6', probabilities: [2 / 3, 1 / 6, 1 / 6] },
    ],
    intendedModelId: 'A',
    scoringMethod: 'expected-count-distance',
    answer: 'Spinner A is the best match.',
    workedSolution: [
      'Convert each spinner to expected counts out of 60 spins.',
      'Spinner A expects about 30 red, 20 blue, and 10 yellow.',
      'That is closer to 33, 17, 10 than the fair spinner or the very-red spinner.',
    ],
    notes: ['Uses distance from expected counts so students can reason visually before seeing likelihood language.'],
  },
  {
    id: 'model-inference-0002',
    candidateId: 'MI-CAND-0002',
    title: 'Fair coin or biased coin from one run',
    difficultyTag: 'medium-hard / simulation interpretation',
    skillTags: ['relative-frequency', 'fairness', 'sampling-noise', 'model-selection'],
    misconceptions: [
      'calls-any-imbalance-proof-of-bias',
      'ignores-that-random-runs-are-uneven',
      'overweights-last-few-flips',
    ],
    taxonomyStatus: ['missing-canonical-topic:model-inference', 'missing-skill-id:sampling-noise'],
    prompt:
      'A coin is flipped 60 times and lands heads 32 times, tails 28 times. Which model is most supported: fair, heads-biased, or tails-biased?',
    observedLabels: ['heads', 'tails'],
    observedCounts: [32, 28],
    models: [
      { id: 'A', label: 'fair coin: heads 1/2, tails 1/2', probabilities: [1 / 2, 1 / 2] },
      { id: 'B', label: 'heads-biased coin: heads 13/20, tails 7/20', probabilities: [13 / 20, 7 / 20] },
      { id: 'C', label: 'tails-biased coin: heads 7/20, tails 13/20', probabilities: [7 / 20, 13 / 20] },
    ],
    intendedModelId: 'A',
    scoringMethod: 'multinomial-log-likelihood',
    answer: 'The fair coin model is most supported.',
    workedSolution: [
      'A fair coin would expect 30 heads and 30 tails in 60 flips.',
      'The observed run is slightly high on heads, but 32 to 28 is still close to fair.',
      'The biased models make one side much too common compared with the data.',
    ],
    notes: ['This is a sampling-noise example: uneven counts do not automatically mean a coin is unfair.'],
  },
  {
    id: 'model-inference-0003',
    candidateId: 'MI-CAND-0003',
    title: 'Loaded die or fair die',
    difficultyTag: 'hard / model inference',
    skillTags: ['relative-frequency', 'multinomial-likelihood', 'fairness', 'die-models'],
    misconceptions: [
      'checks-only-one-face-instead-of-the-whole-pattern',
      'assumes-every-nonuniform-run-is-fair-noise',
      'confuses-most-common-face-with-complete-model',
    ],
    taxonomyStatus: ['missing-canonical-topic:model-inference', 'missing-skill-id:multinomial-likelihood'],
    prompt:
      'A six-sided die is rolled 60 times. The counts for faces 1 through 6 are 6, 7, 8, 10, 12, 17. Which model best explains the run?',
    observedLabels: ['1', '2', '3', '4', '5', '6'],
    observedCounts: [6, 7, 8, 10, 12, 17],
    models: [
      { id: 'A', label: 'fair die: each face 1/6', probabilities: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6] },
      {
        id: 'B',
        label: 'high-face die: 1/10, 1/10, 3/20, 3/20, 1/5, 3/10',
        probabilities: [1 / 10, 1 / 10, 3 / 20, 3 / 20, 1 / 5, 3 / 10],
      },
      {
        id: 'C',
        label: 'middle-heavy die: 1/10, 3/20, 1/4, 1/4, 3/20, 1/10',
        probabilities: [1 / 10, 3 / 20, 1 / 4, 1 / 4, 3 / 20, 1 / 10],
      },
    ],
    intendedModelId: 'B',
    scoringMethod: 'multinomial-log-likelihood',
    answer: 'The high-face die model is most likely.',
    workedSolution: [
      'The counts rise steadily toward the larger faces.',
      'The high-face model expects 6, 6, 9, 9, 12, 18 rolls across the six faces.',
      'That whole pattern is closer than a fair die or a middle-heavy die.',
    ],
    notes: ['This is the real-bias counterpart to the fair-coin sampling-noise item.'],
  },
  {
    id: 'model-inference-0004',
    candidateId: 'MI-CAND-0004',
    title: 'Small sample chart with no exact match',
    difficultyTag: 'medium-hard / visual model match',
    skillTags: ['expected-counts', 'small-sample-noise', 'chart-interpretation', 'model-selection'],
    misconceptions: [
      'rejects-best-model-because-it-is-not-exact',
      'forgets-small-samples-are-lumpy',
      'chooses-the-model-with-the-same-largest-bar-only',
    ],
    taxonomyStatus: ['missing-canonical-topic:model-inference', 'missing-skill-id:visual-model-match'],
    prompt:
      'A short simulation made this bar chart after 10 spins: red 4, blue 4, yellow 2. Which spinner is the best visual match, even though none matches exactly?',
    observedLabels: ['red', 'blue', 'yellow'],
    observedCounts: [4, 4, 2],
    models: [
      { id: 'A', label: 'red 1/2, blue 3/10, yellow 1/5', probabilities: [1 / 2, 3 / 10, 1 / 5] },
      { id: 'B', label: 'red 1/3, blue 1/3, yellow 1/3', probabilities: [1 / 3, 1 / 3, 1 / 3] },
      { id: 'C', label: 'red 3/5, blue 1/5, yellow 1/5', probabilities: [3 / 5, 1 / 5, 1 / 5] },
    ],
    intendedModelId: 'A',
    scoringMethod: 'expected-count-distance',
    answer: 'Spinner A is the best visual match, even though the observed bars are not exact.',
    workedSolution: [
      'Out of 10 spins, Spinner A expects 5 red, 3 blue, and 2 yellow.',
      'The chart shows 4 red, 4 blue, and 2 yellow, only one spin away in red and blue.',
      'With only 10 spins, exact matching is not expected.',
    ],
    notes: ['Required small-sample example: the best visual match is deliberately not exact.'],
  },
  {
    id: 'model-inference-0005',
    candidateId: 'MI-CAND-0005',
    title: 'Match a simulation table to a model',
    difficultyTag: 'hard / simulation interpretation',
    skillTags: ['simulation-table', 'relative-frequency', 'multinomial-likelihood', 'model-selection'],
    misconceptions: [
      'compares-only-the-largest-category',
      'ignores-low-frequency-categories',
      'treats-a-simulation-table-as-a-guaranteed-ratio',
    ],
    taxonomyStatus: ['missing-canonical-topic:model-inference', 'missing-skill-id:simulation-table-match'],
    prompt:
      'A classroom simulator assigns each student one of four project topics. In 80 simulated students, the table was art 37, robotics 24, ecology 12, music 7. Which probability model most likely generated the table?',
    observedLabels: ['art', 'robotics', 'ecology', 'music'],
    observedCounts: [37, 24, 12, 7],
    models: [
      { id: 'A', label: 'balanced: 1/4 each', probabilities: [1 / 4, 1 / 4, 1 / 4, 1 / 4] },
      { id: 'B', label: 'art-leaning: 9/20, 3/10, 3/20, 1/10', probabilities: [9 / 20, 3 / 10, 3 / 20, 1 / 10] },
      { id: 'C', label: 'robotics-leaning: 3/10, 2/5, 1/5, 1/10', probabilities: [3 / 10, 2 / 5, 1 / 5, 1 / 10] },
    ],
    intendedModelId: 'B',
    scoringMethod: 'multinomial-log-likelihood',
    answer: 'The art-leaning model is most likely.',
    workedSolution: [
      'The observed table is about 46%, 30%, 15%, and 9%.',
      'The art-leaning model expects 45%, 30%, 15%, and 10%.',
      'That matches all four categories better than a balanced or robotics-leaning model.',
    ],
    notes: ['Uses a non-spinner context while keeping the reasoning probability-first.'],
  },
  {
    id: 'model-inference-0006',
    candidateId: 'MI-CAND-0006',
    title: 'Noise or bias on an equal spinner',
    difficultyTag: 'medium-hard / sampling noise',
    skillTags: ['sampling-noise', 'fairness', 'relative-frequency', 'model-selection'],
    misconceptions: [
      'declares-bias-from-a-small-lead',
      'expects-equal-spinner-counts-to-be-equal-every-time',
      'ignores-plausible-random-variation',
    ],
    taxonomyStatus: ['missing-canonical-topic:model-inference', 'missing-skill-id:sampling-noise'],
    prompt:
      'An equal 3-section spinner is tested for 24 spins and gives red 9, blue 8, yellow 7. A student says red must be favored. Which model is best supported?',
    observedLabels: ['red', 'blue', 'yellow'],
    observedCounts: [9, 8, 7],
    models: [
      { id: 'A', label: 'equal spinner: 1/3, 1/3, 1/3', probabilities: [1 / 3, 1 / 3, 1 / 3] },
      { id: 'B', label: 'red-favored spinner: 9/20, 7/20, 1/5', probabilities: [9 / 20, 7 / 20, 1 / 5] },
      { id: 'C', label: 'yellow-favored spinner: 1/5, 7/20, 9/20', probabilities: [1 / 5, 7 / 20, 9 / 20] },
    ],
    intendedModelId: 'A',
    scoringMethod: 'multinomial-log-likelihood',
    answer: 'The equal spinner model is still best supported.',
    workedSolution: [
      'An equal spinner expects 8, 8, and 8 spins in 24 tries.',
      'The observed 9, 8, 7 is very close to that expectation.',
      'The red-favored model would predict a bigger red lead and a smaller yellow count than we saw.',
    ],
    notes: ['Explicitly contrasts sampling noise with a claim of real bias.'],
  },
];

function assertProbabilities(problem: ProblemDefinition): void {
  const categoryCount = problem.observedCounts.length;

  for (const model of problem.models) {
    if (model.probabilities.length !== categoryCount) {
      throw new Error(`${problem.id} ${model.id} has ${model.probabilities.length} probabilities for ${categoryCount} counts`);
    }

    if (model.probabilities.some((probability) => probability <= 0)) {
      throw new Error(`${problem.id} ${model.id} contains a non-positive probability`);
    }

    const sum = model.probabilities.reduce((total, probability) => total + probability, 0);
    if (Math.abs(sum - 1) > EPSILON) {
      throw new Error(`${problem.id} ${model.id} probabilities sum to ${sum}`);
    }
  }
}

function sampleSize(counts: number[]): number {
  return counts.reduce((total, count) => total + count, 0);
}

function expectedCounts(probabilities: number[], total: number): number[] {
  return probabilities.map((probability) => probability * total);
}

function squaredExpectedCountDistance(probabilities: number[], counts: number[]): number {
  const total = sampleSize(counts);
  return expectedCounts(probabilities, total).reduce((sum, expected, index) => {
    const diff = counts[index] - expected;
    return sum + diff * diff;
  }, 0);
}

function multinomialLogLikelihood(probabilities: number[], counts: number[]): number {
  return counts.reduce((sum, count, index) => sum + count * Math.log(probabilities[index]), 0);
}

function scoreModel(problem: ProblemDefinition, model: CandidateModel): CandidateScore {
  const total = sampleSize(problem.observedCounts);
  const score =
    problem.scoringMethod === 'expected-count-distance'
      ? squaredExpectedCountDistance(model.probabilities, problem.observedCounts)
      : multinomialLogLikelihood(model.probabilities, problem.observedCounts);

  return {
    id: model.id,
    label: model.label,
    expectedCounts: expectedCounts(model.probabilities, total),
    score,
  };
}

function compareScores(method: ScoringMethod, left: CandidateScore, right: CandidateScore): number {
  if (method === 'expected-count-distance') {
    return left.score - right.score;
  }
  return right.score - left.score;
}

function scoreMargin(method: ScoringMethod, best: CandidateScore, runnerUp: CandidateScore): number {
  if (method === 'expected-count-distance') {
    return runnerUp.score - best.score;
  }
  return best.score - runnerUp.score;
}

function verify(problem: ProblemDefinition): VerifiedProblem {
  assertProbabilities(problem);

  const scores = problem.models.map((model) => scoreModel(problem, model));
  const ranked = [...scores].sort((left, right) => compareScores(problem.scoringMethod, left, right));
  const best = ranked[0];
  const runnerUp = ranked[1];
  const margin = scoreMargin(problem.scoringMethod, best, runnerUp);
  const passed = best.id === problem.intendedModelId && margin > EPSILON;

  return {
    ...problem,
    sampleSize: sampleSize(problem.observedCounts),
    verification: {
      scoringMethod: problem.scoringMethod,
      selectedModelId: best.id,
      selectedModelLabel: best.label,
      intendedModelId: problem.intendedModelId,
      scoreMargin: margin,
      passed,
      candidateScores: ranked,
      summary:
        problem.scoringMethod === 'expected-count-distance'
          ? `Selected ${best.id} because it has the smallest squared distance from expected counts.`
          : `Selected ${best.id} because it has the largest multinomial log likelihood.`,
    },
  };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3);
}

function formatCounts(labels: string[], counts: number[]): string {
  return labels.map((label, index) => `${label} ${formatNumber(counts[index])}`).join(', ');
}

function formatScore(method: ScoringMethod, score: number): string {
  return method === 'expected-count-distance' ? score.toFixed(3) : score.toFixed(3);
}

function renderMarkdown(results: VerifiedProblem[]): string {
  const lines = [
    '# Model Inference Candidate Verification',
    '',
    '> Deterministic generation and verification for self-authored model inference, simulation interpretation, and inverse spinner candidates.',
    '> These are review artifacts only; no runtime app code is changed.',
    '',
    `- **Problems verified:** ${results.length}`,
    '- **Generation mode:** static authored examples with deterministic scoring; no model/API calls',
    '- **Source visual policy:** no source visual copying; any future visuals should be Pascal-authored',
    '- **Missing taxonomy IDs:** `model-inference`, `inverse-spinner`, `sampling-noise`, `visual-model-match`, `simulation-table-match`, `multinomial-likelihood`',
    '',
  ];

  for (const result of results) {
    lines.push(
      `## ${result.id} — ${result.title}`,
      '',
      `- **Candidate:** ${result.candidateId}`,
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Skill tags:** ${result.skillTags.map((tag) => `\`${tag}\``).join(', ')}`,
      `- **Misconceptions:** ${result.misconceptions.map((tag) => `\`${tag}\``).join(', ')}`,
      `- **Taxonomy status:** ${result.taxonomyStatus.map((entry) => `\`${entry}\``).join(', ')}`,
      `- **Sample size:** ${result.sampleSize}`,
      `- **Observed counts:** ${formatCounts(result.observedLabels, result.observedCounts)}`,
      `- **Prompt:** ${result.prompt}`,
      `- **Answer:** ${result.answer}`,
      `- **Scoring method:** \`${result.verification.scoringMethod}\``,
      `- **Verification result:** ${result.verification.passed ? 'passed' : 'failed'}; selected ${result.verification.selectedModelId}, intended ${result.verification.intendedModelId}`,
      '',
      '### Candidate Scores',
      '',
    );

    for (const score of result.verification.candidateScores) {
      lines.push(
        `- **${score.id}:** ${score.label}; expected ${formatCounts(
          result.observedLabels,
          score.expectedCounts,
        )}; score ${formatScore(result.verification.scoringMethod, score.score)}`,
      );
    }

    lines.push('', '### Worked Solution', '', ...result.workedSolution.map((step) => `- ${step}`), '', '### Notes', '');
    lines.push(...result.notes.map((note) => `- ${note}`), `- ${result.verification.summary}`, '');
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const results = problems.map((problem) => verify(problem));
  const failed = results.filter((result) => !result.verification.passed);

  if (failed.length > 0) {
    throw new Error(`Model inference verification failed: ${failed.map((result) => result.id).join(', ')}`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(results, null, 2)}\n`);
  await writeFile(MD_PATH, renderMarkdown(results));
  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
  console.log(`verified ${results.length} model inference problems`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
