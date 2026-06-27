import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type GeneratedProblem = {
  id: string;
  templateId: string;
  params: unknown;
  verification: { passed: boolean };
};

const SOURCE_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems/runtime-templates');
const OUT_DIR = path.join(process.cwd(), 'src/content/practiceProblems');
const OUT_PATH = path.join(OUT_DIR, 'verifiedTemplateSeeds.ts');

const TEMPLATE_IDS = [
  'sum-of-two-dice',
  'at-least-one-via-complement',
  'k-heads-in-n',
  'pick-k-of-n-unordered',
  'conditional-bayes-2x2',
  'gambler-fallacy-mc',
  'single-event-prob',
  'permutations-arrange-k-of-n',
  'without-replacement-two-draws',
  'geometric-first-success',
  'binomial-at-least-k',
  'expected-value-die-game',
  'inclusion-exclusion-divisible',
  'inclusion-exclusion-two-events',
  'addition-multiplication-combined',
] as const;

function toConstName(templateId: string): string {
  return `${templateId.replace(/-/g, '_').toUpperCase()}_SEEDS`;
}

async function readProblems(templateId: string): Promise<GeneratedProblem[]> {
  const raw = await readFile(path.join(SOURCE_DIR, `${templateId}.json`), 'utf8');
  const parsed = JSON.parse(raw) as GeneratedProblem[];
  return parsed.filter((problem) => problem.verification.passed);
}

function renderSeedObject(problem: GeneratedProblem): string {
  return [
    '  {',
    `    id: ${JSON.stringify(problem.id)},`,
    `    templateId: ${JSON.stringify(problem.templateId)},`,
    `    params: ${JSON.stringify(problem.params)},`,
    '  },',
  ].join('\n');
}

async function main(): Promise<void> {
  const byTemplate = await Promise.all(
    TEMPLATE_IDS.map(async (templateId) => ({
      templateId,
      problems: await readProblems(templateId),
    })),
  );

  const chunks: string[] = [
    '/**',
    ' * Verified static seed parameters for the practice bank.',
    ' *',
    ' * Generated from docs/curriculum-harvest/generated-problems/runtime-templates.',
    ' * These are params only: runtime still calls each template solve/render/explain.',
    ' * Regenerate with: npm run harvest:write-seed-bank',
    ' */',
    '',
    "import type { Topic } from '@/content/skills';",
    '',
    "export type VerifiedTemplateId =",
    ...TEMPLATE_IDS.map((id, index) => `  | ${JSON.stringify(id)}${index === TEMPLATE_IDS.length - 1 ? ';' : ''}`),
    '',
    'export type VerifiedTemplateSeed = {',
    '  id: string;',
    '  templateId: VerifiedTemplateId;',
    '  params: unknown;',
    '};',
    '',
  ];

  for (const { templateId, problems } of byTemplate) {
    chunks.push(
      `export const ${toConstName(templateId)} = [`,
      ...problems.map(renderSeedObject),
      '] as const satisfies readonly VerifiedTemplateSeed[];',
      '',
    );
  }

  chunks.push(
    'export const VERIFIED_TEMPLATE_SEEDS = [',
    ...TEMPLATE_IDS.map((templateId) => `  ...${toConstName(templateId)},`),
    '] as const satisfies readonly VerifiedTemplateSeed[];',
    '',
    'export const VERIFIED_SEED_COUNT_BY_TEMPLATE = VERIFIED_TEMPLATE_SEEDS.reduce(',
    '  (counts, seed) => {',
    '    counts[seed.templateId] = (counts[seed.templateId] ?? 0) + 1;',
    '    return counts;',
    '  },',
    '  {} as Record<VerifiedTemplateId, number>,',
    ');',
    '',
    'export const VERIFIED_SEED_COUNT_BY_TOPIC: Partial<Record<Topic, number>> = {};',
    '',
  );

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, `${chunks.join('\n')}`);
  console.log(`wrote ${path.relative(process.cwd(), OUT_PATH)}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

