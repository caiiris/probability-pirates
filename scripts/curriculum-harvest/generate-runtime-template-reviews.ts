import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { checkAnswer } from '@/lib/checkAnswer';
import { fnv1a32 } from '@/lib/hash';
import { toNumber, type ExactAnswer } from '@/lib/probability/exact';
import { mulberry32 } from '@/lib/simulations';
import { answerToPayload } from '@/features/practice/practiceEngine';
import { ALL_TEMPLATES } from '@/features/practice/templates/index';
import type { Template } from '@/features/practice/templates/types';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems/runtime-templates');
const SUMMARY_MD_PATH = path.join(OUT_DIR, 'README.md');
const PROBLEMS_PER_TEMPLATE = 5;
const SIMULATION_TRIALS = 50_000;

type Verification =
  | {
      method: 'solver-render-simulation';
      exactProbability: number;
      simulationEstimate: number;
      absoluteDifference: number;
      sigmaThreshold: number;
      passed: boolean;
    }
  | {
      method: 'solver-render-structural';
      passed: boolean;
      note: string;
    };

type SerializableProblem = {
  id: string;
  instanceId: string;
  templateId: string;
  topic: string;
  skills: string[];
  retrievalForm: string;
  difficulty: number;
  params: unknown;
  interactionKind: string;
  prompt: string;
  context: string | null;
  answer: string;
  renderedCorrectness: boolean;
  explanation: { title: string; steps: string[] };
  verification: Verification;
};

function serializeAnswer(answer: ExactAnswer): string {
  switch (answer.kind) {
    case 'choice':
      return `choice:${answer.optionId}`;
    case 'fraction':
      return `${answer.value.num.toString()}/${answer.value.den.toString()}`;
    case 'int':
      return String(answer.value);
  }
}

function numericProbability(answer: ExactAnswer): number | null {
  if (answer.kind === 'fraction') {
    return toNumber(answer.value);
  }
  if (answer.kind === 'int' && answer.value >= 0 && answer.value <= 1) {
    return answer.value;
  }
  return null;
}

function verify<P>(
  template: Template<P>,
  params: P,
  answer: ExactAnswer,
  index: number,
): Verification {
  const p = numericProbability(answer);
  if (template.simulate === undefined || p === null) {
    return {
      method: 'solver-render-structural',
      passed: true,
      note:
        template.simulate === undefined
          ? 'No simulator declared; structural render/answer check only.'
          : 'Answer is not a numeric probability; structural render/answer check only.',
    };
  }

  const estimate = template.simulate(params, SIMULATION_TRIALS, mulberry32(0x51_0000 + index * 197));
  const sigmaThreshold = 5 * (Math.sqrt((p * (1 - p)) / SIMULATION_TRIALS) || 1 / SIMULATION_TRIALS);
  const absoluteDifference = Math.abs(estimate - p);
  return {
    method: 'solver-render-simulation',
    exactProbability: p,
    simulationEstimate: estimate,
    absoluteDifference,
    sigmaThreshold,
    passed: absoluteDifference < sigmaThreshold,
  };
}

function makeInstanceId(templateId: string, params: unknown): string {
  return `${templateId}:${fnv1a32(JSON.stringify(params))}`;
}

function generateForTemplate<P>(template: Template<P>, templateIndex: number): SerializableProblem[] {
  const rng = mulberry32(0xa11ce + templateIndex * 10_000);
  const problems: SerializableProblem[] = [];
  const seen = new Set<string>();

  let guard = 0;
  while (problems.length < PROBLEMS_PER_TEMPLATE) {
    guard += 1;
    if (guard > 500) {
      throw new Error(`${template.id}: could not generate ${PROBLEMS_PER_TEMPLATE} unique instances`);
    }

    const params = template.sample(rng);
    const instanceId = makeInstanceId(template.id, params);
    if (seen.has(instanceId)) {
      continue;
    }
    seen.add(instanceId);

    const answer = template.solve(params);
    const variant = template.render(params);
    const payload = answerToPayload(answer, variant);
    const renderedCorrectness = checkAnswer(variant, payload).wasCorrect;
    if (!renderedCorrectness) {
      throw new Error(`${instanceId}: answerToPayload + checkAnswer did not grade correct`);
    }

    const verification = verify(template, params, answer, problems.length + templateIndex * 100);
    if (!verification.passed) {
      throw new Error(`${instanceId}: verification failed`);
    }

    problems.push({
      id: `${template.id}-p${String(problems.length + 1).padStart(2, '0')}`,
      instanceId,
      templateId: template.id,
      topic: template.topic,
      skills: template.skills,
      retrievalForm: template.retrievalForm,
      difficulty: template.rate(params),
      params,
      interactionKind: variant.interactionKind,
      prompt: variant.prompt,
      context: 'context' in variant && typeof variant.context === 'string' ? variant.context : null,
      answer: serializeAnswer(answer),
      renderedCorrectness,
      explanation: template.explain(params),
      verification,
    });
  }

  return problems;
}

function renderTemplateMarkdown(template: Template, problems: SerializableProblem[]): string {
  const lines: string[] = [
    `# Runtime Review — ${template.id}`,
    '',
    '> Generated from the actual runtime template. Each item is checked with `answerToPayload` + `checkAnswer`; numeric probability templates are also Monte-Carlo verified.',
    '',
    '## Template Metadata',
    '',
    `- **Template:** \`${template.id}\``,
    `- **Topic:** \`${template.topic}\``,
    `- **Skills:** ${template.skills.map((skill) => `\`${skill}\``).join(', ')}`,
    `- **Retrieval form:** \`${template.retrievalForm}\``,
    '',
  ];

  for (const [index, problem] of problems.entries()) {
    lines.push(
      `## Problem ${index + 1} — ${problem.id}`,
      '',
      `- **Instance id:** \`${problem.instanceId}\``,
      `- **Difficulty:** ${problem.difficulty}`,
      `- **Params:** ${JSON.stringify(problem.params)}`,
      `- **Interaction:** \`${problem.interactionKind}\``,
      `- **Prompt:** ${problem.prompt}`,
      ...(problem.context ? [`- **Context:**\n\n${problem.context}`] : []),
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
      `- **Method:** ${problem.verification.method}`,
    );

    if (problem.verification.method === 'solver-render-simulation') {
      lines.push(
        `- **Exact probability:** ${problem.verification.exactProbability.toFixed(6)}`,
        `- **Simulation estimate:** ${problem.verification.simulationEstimate.toFixed(6)}`,
        `- **Absolute diff:** ${problem.verification.absoluteDifference.toFixed(6)}`,
        `- **5-sigma threshold:** ${problem.verification.sigmaThreshold.toFixed(6)}`,
      );
    } else {
      lines.push(`- **Note:** ${problem.verification.note}`);
    }

    lines.push(`- **Passed:** ${problem.verification.passed ? 'yes' : 'no'}`, '');
  }

  lines.push(
    '## Human Review Notes',
    '',
    '- Check prompt voice and age fit.',
    '- Check whether the worked solution teaches the intended move.',
    '- Check whether this should ship as-is or needs scenario/copy polish.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function renderSummary(allProblems: Array<{ template: Template; problems: SerializableProblem[] }>): string {
  const lines = [
    '# Runtime Practice Template Review Sets',
    '',
    `Generated ${new Date().toISOString()} from the registered WP-4 runtime templates.`,
    '',
    '| Template | Topic | Problems | Verification | File |',
    '| --- | --- | ---: | --- | --- |',
  ];

  for (const { template, problems } of allProblems) {
    const methods = Array.from(new Set(problems.map((problem) => problem.verification.method))).join(', ');
    lines.push(
      `| \`${template.id}\` | \`${template.topic}\` | ${problems.length} | ${methods} | [review](./${template.id}.md) |`,
    );
  }

  lines.push('', 'All files in this folder are review artifacts, not product seed content.', '');
  return `${lines.join('\n')}`;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const allProblems = ALL_TEMPLATES.map((template, index) => ({
    template,
    problems: generateForTemplate(template, index),
  }));

  for (const { template, problems } of allProblems) {
    await writeFile(path.join(OUT_DIR, `${template.id}.json`), `${JSON.stringify(problems, null, 2)}\n`);
    await writeFile(path.join(OUT_DIR, `${template.id}.md`), renderTemplateMarkdown(template, problems));
  }

  await writeFile(SUMMARY_MD_PATH, renderSummary(allProblems));
  console.log(`wrote ${allProblems.length} template review sets to ${path.relative(process.cwd(), OUT_DIR)}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

