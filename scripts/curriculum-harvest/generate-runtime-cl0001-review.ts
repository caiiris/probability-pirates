import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { checkAnswer } from '@/lib/checkAnswer';
import { fnv1a32 } from '@/lib/hash';
import { toNumber } from '@/lib/probability/exact';
import { mulberry32 } from '@/lib/simulations';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { atLeastOneViaComplementTemplate } from '@/features/practice/templates/complement/at-least-one-via-complement';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const JSON_PATH = path.join(OUT_DIR, 'runtime-cl-0001-at-least-one-via-complement.json');
const MD_PATH = path.join(OUT_DIR, 'runtime-cl-0001-at-least-one-via-complement.md');

type SerializableInstance = {
  id: string;
  instanceId: string;
  templateId: string;
  topic: string;
  skills: string[];
  retrievalForm: string;
  difficulty: number;
  params: Parameters<typeof atLeastOneViaComplementTemplate.solve>[0];
  prompt: string;
  answer: string;
  renderedCorrectness: boolean;
  explanation: { title: string; steps: string[] };
  verification: {
    exactProbability: number;
    simulationEstimate: number;
    absoluteDifference: number;
    sigmaThreshold: number;
    passed: boolean;
  };
};

function serializeAnswer(answer: ReturnType<typeof atLeastOneViaComplementTemplate.solve>): string {
  if (answer.kind !== 'fraction') {
    return JSON.stringify(answer);
  }

  return `${answer.value.num.toString()}/${answer.value.den.toString()}`;
}

function exactProbability(answer: ReturnType<typeof atLeastOneViaComplementTemplate.solve>): number {
  if (answer.kind === 'fraction') {
    return toNumber(answer.value);
  }

  if (answer.kind === 'int') {
    return answer.value;
  }

  throw new Error('Choice answers are not numeric probabilities');
}

function runSimulation(
  params: Parameters<typeof atLeastOneViaComplementTemplate.solve>[0],
  answer: ReturnType<typeof atLeastOneViaComplementTemplate.solve>,
  index: number,
): SerializableInstance['verification'] {
  if (atLeastOneViaComplementTemplate.simulate === undefined) {
    throw new Error('Template has no simulator');
  }

  const p = exactProbability(answer);
  const trials = 50_000;
  const estimate = atLeastOneViaComplementTemplate.simulate(params, trials, mulberry32(0xa11ce + index * 101));
  const sigmaThreshold = 5 * (Math.sqrt((p * (1 - p)) / trials) || 1 / trials);
  const absoluteDifference = Math.abs(estimate - p);

  return {
    exactProbability: p,
    simulationEstimate: estimate,
    absoluteDifference,
    sigmaThreshold,
    passed: absoluteDifference < sigmaThreshold,
  };
}

function generateProblems(): SerializableInstance[] {
  const rng = mulberry32(0xc10001);
  const problems: SerializableInstance[] = [];
  const seenInstanceIds = new Set<string>();

  while (problems.length < 5) {
    const params = atLeastOneViaComplementTemplate.sample(rng);
    const instanceId = `${atLeastOneViaComplementTemplate.id}:${fnv1a32(JSON.stringify(params))}`;
    if (seenInstanceIds.has(instanceId)) {
      continue;
    }
    seenInstanceIds.add(instanceId);

    const answer = atLeastOneViaComplementTemplate.solve(params);
    const variant = atLeastOneViaComplementTemplate.render(params);
    const explanation = atLeastOneViaComplementTemplate.explain(params);
    const difficulty = atLeastOneViaComplementTemplate.rate(params);
    const payload = answerToPayload(answer, variant);
    const renderedCorrectness = checkAnswer(variant, payload).wasCorrect;
    const verification = runSimulation(params, answer, problems.length);

    if (!renderedCorrectness) {
      throw new Error(`${instanceId} rendered answer does not grade correct`);
    }

    if (!verification.passed) {
      throw new Error(`${instanceId} failed simulation verification`);
    }

    problems.push({
      id: `runtime-cl0001-p${String(problems.length + 1).padStart(2, '0')}`,
      instanceId,
      templateId: atLeastOneViaComplementTemplate.id,
      topic: atLeastOneViaComplementTemplate.topic,
      skills: atLeastOneViaComplementTemplate.skills,
      retrievalForm: atLeastOneViaComplementTemplate.retrievalForm,
      difficulty,
      params,
      prompt: variant.prompt,
      answer: serializeAnswer(answer),
      renderedCorrectness,
      explanation,
      verification,
    });
  }

  return problems;
}

function renderMarkdown(problems: SerializableInstance[]): string {
  const lines = [
    '# Runtime CL-0001 Review Set — At Least One Via Complement',
    '',
    '> Generated from the actual runtime template via `generateInstance(atLeastOneViaComplementTemplate, rng)`, not from the earlier brief-only generator.',
    '> Each item is checked by `answerToPayload` + `checkAnswer` and Monte-Carlo verified against `solve()`.',
    '',
  ];

  for (const [index, problem] of problems.entries()) {
    lines.push(
      `## Problem ${index + 1} — ${problem.id}`,
      '',
      `- **Instance id:** \`${problem.instanceId}\``,
      `- **Template:** \`${problem.templateId}\``,
      `- **Topic:** \`${problem.topic}\``,
      `- **Skills:** ${problem.skills.map((skill) => `\`${skill}\``).join(', ')}`,
      `- **Retrieval form:** \`${problem.retrievalForm}\``,
      `- **Difficulty:** ${problem.difficulty}`,
      `- **Params:** ${JSON.stringify(problem.params)}`,
      `- **Prompt:** ${problem.prompt}`,
      `- **Answer:** ${problem.answer}`,
      `- **Rendered answer grades correct:** ${problem.renderedCorrectness ? 'yes' : 'no'}`,
      '',
      '### Worked Solution',
      '',
      `**${problem.explanation.title}**`,
      '',
      ...problem.explanation.steps.map((step) => `- ${step}`),
      '',
      '### Verification',
      '',
      `- **Exact probability:** ${problem.verification.exactProbability.toFixed(6)}`,
      `- **Simulation estimate:** ${problem.verification.simulationEstimate.toFixed(6)}`,
      `- **Absolute diff:** ${problem.verification.absoluteDifference.toFixed(6)}`,
      `- **5-sigma threshold:** ${problem.verification.sigmaThreshold.toFixed(6)}`,
      `- **Passed:** ${problem.verification.passed ? 'yes' : 'no'}`,
      '',
    );
  }

  lines.push(
    '## Review Notes',
    '',
    '- These are real runtime template instances.',
    '- Review prompt voice, scenario variety, and whether the denominator labels feel appropriate.',
    '- If approved, the next step is wiring a minimal practice UI to serve generated instances.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const problems = generateProblems();
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

