import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { lessonById } from '../src/content/index';

const REPO_ROOT = process.cwd();
const WAGERS_DIR = path.join(REPO_ROOT, 'src/content/wagers');

const VALID_FLAVORS = new Set(['frequency', 'combinatorics', 'counterintuition', 'bayesian']);
const VALID_UNITS = new Set(['percent', 'count', 'fraction']);
const VALID_SCORINGS = new Set(['log', 'abs']);
const VALID_STATUSES = new Set(['live', 'archived']);

type ValidationError = string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateWagerFile(raw: unknown, filename: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isRecord(raw)) {
    return ['root value must be a JSON object'];
  }

  // Required string fields
  for (const field of ['id', 'prompt', 'source', 'revealHeadline', 'revealExplanation'] as const) {
    if (typeof raw[field] !== 'string' || (raw[field] as string).trim() === '') {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  // sequence: positive integer
  if (typeof raw.sequence !== 'number' || !Number.isInteger(raw.sequence) || raw.sequence < 1) {
    errors.push('sequence must be a positive integer');
  }

  // openAt: ISO 8601 string
  if (typeof raw.openAt !== 'string' || isNaN(Date.parse(raw.openAt as string))) {
    errors.push('openAt must be a valid ISO 8601 date string');
  }

  // unit enum
  if (!VALID_UNITS.has(raw.unit as string)) {
    errors.push(`unit must be one of: ${[...VALID_UNITS].join(', ')} (got ${JSON.stringify(raw.unit)})`);
  }

  // flavor enum
  if (!VALID_FLAVORS.has(raw.flavor as string)) {
    errors.push(
      `flavor must be one of: ${[...VALID_FLAVORS].join(', ')} (got ${JSON.stringify(raw.flavor)})`,
    );
  }

  // scoring enum
  if (!VALID_SCORINGS.has(raw.scoring as string)) {
    errors.push(
      `scoring must be one of: ${[...VALID_SCORINGS].join(', ')} (got ${JSON.stringify(raw.scoring)})`,
    );
  }

  // status enum
  if (!VALID_STATUSES.has(raw.status as string)) {
    errors.push(
      `status must be one of: ${[...VALID_STATUSES].join(', ')} (got ${JSON.stringify(raw.status)})`,
    );
  }

  // createdBy must be 'system'
  if (raw.createdBy !== 'system') {
    errors.push(`createdBy must be "system" (got ${JSON.stringify(raw.createdBy)})`);
  }

  // tags: string[]
  if (!Array.isArray(raw.tags) || (raw.tags as unknown[]).some((t) => typeof t !== 'string')) {
    errors.push('tags must be an array of strings');
  }

  // trueAnswer: number
  if (typeof raw.trueAnswer !== 'number') {
    errors.push('trueAnswer must be a number');
  }

  // Sanity check: trueAnswer > 0 for log scoring
  if (
    raw.scoring === 'log' &&
    typeof raw.trueAnswer === 'number' &&
    raw.trueAnswer <= 0
  ) {
    errors.push(
      `trueAnswer must be > 0 when scoring is "log" (got ${raw.trueAnswer}); log(0) and log of negative numbers are undefined`,
    );
  }

  // Optional string fields with constraints
  if (raw.sourceUrl !== undefined && typeof raw.sourceUrl !== 'string') {
    errors.push('sourceUrl must be a string if present');
  }
  if (raw.revealWorked !== undefined && typeof raw.revealWorked !== 'string') {
    errors.push('revealWorked must be a string if present');
  }

  // id should match filename (advisory — error if they diverge to catch copy-paste mistakes)
  const expectedId = path.basename(filename, '.json');
  if (typeof raw.id === 'string' && raw.id !== expectedId) {
    errors.push(
      `id "${raw.id}" does not match filename "${expectedId}" — the id must equal the filename (without .json)`,
    );
  }

  // Cross-check relatedLessonId against the live lesson registry (R-W5)
  if (raw.relatedLessonId !== undefined) {
    if (typeof raw.relatedLessonId !== 'string' || raw.relatedLessonId.trim() === '') {
      errors.push('relatedLessonId must be a non-empty string if present');
    } else if (!lessonById.has(raw.relatedLessonId as string)) {
      errors.push(
        `relatedLessonId "${raw.relatedLessonId}" does not match any lesson in src/content/index — ` +
          `valid ids: ${[...lessonById.keys()].join(', ')}`,
      );
    }
  }

  return errors;
}

async function main(): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(WAGERS_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('wager:validate — src/content/wagers/ does not exist; nothing to validate.');
      console.log('Summary: 0 files checked, 0 passed, 0 failed.');
      process.exit(0);
    }
    throw err;
  }

  const jsonFiles = entries.filter((e) => e.endsWith('.json')).sort();

  if (jsonFiles.length === 0) {
    console.log('wager:validate — no .json files in src/content/wagers/; nothing to validate.');
    console.log('Summary: 0 files checked, 0 passed, 0 failed.');
    process.exit(0);
  }

  let passed = 0;
  let failed = 0;

  for (const filename of jsonFiles) {
    const filepath = path.join(WAGERS_DIR, filename);
    let raw: unknown;

    try {
      const text = await readFile(filepath, 'utf8');
      try {
        raw = JSON.parse(text) as unknown;
      } catch (parseErr) {
        console.log(`  FAIL  ${filename}`);
        console.log(
          `        JSON parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
        );
        failed++;
        continue;
      }
    } catch (readErr) {
      console.log(`  FAIL  ${filename}`);
      console.log(
        `        Could not read file: ${readErr instanceof Error ? readErr.message : String(readErr)}`,
      );
      failed++;
      continue;
    }

    const errors = validateWagerFile(raw, filename);
    if (errors.length === 0) {
      console.log(`  PASS  ${filename}`);
      passed++;
    } else {
      console.log(`  FAIL  ${filename}`);
      for (const err of errors) {
        console.log(`        - ${err}`);
      }
      failed++;
    }
  }

  const total = passed + failed;
  console.log('');
  console.log(
    `Summary: ${total} file${total !== 1 ? 's' : ''} checked, ${passed} passed, ${failed} failed.`,
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error('wager:validate — unexpected error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
