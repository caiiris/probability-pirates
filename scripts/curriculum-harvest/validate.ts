import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export type ReuseMode =
  | 'copy-ok'
  | 'adapt-ok-with-attribution'
  | 'inspiration-only'
  | 'permission-needed'
  | 'blocked';

export type SourceStatus = 'approved' | 'permission-needed' | 'blocked';

export type Retrieval =
  | { kind: 'manual-download'; path: string }
  | { kind: 'public-url'; url: string }
  | { kind: 'none' };

export type HarvestSource = {
  id: string;
  title: string;
  url: string;
  retrieval: Retrieval;
  license: {
    name: string;
    url: string;
    commercialOk: boolean;
    shareAlike: boolean;
    requiresAttribution: boolean;
  };
  reuseMode: ReuseMode;
  status: SourceStatus;
  targetTopics: string[];
  notes: string;
};

export type HarvestIndexEntry = {
  sourceId: string;
  sourceTitle: string;
  reuseMode: ReuseMode;
  chunkPath: string;
  hash: string;
  wordCount: number;
  processed: boolean;
};

const VALID_REUSE_MODES = new Set<ReuseMode>([
  'copy-ok',
  'adapt-ok-with-attribution',
  'inspiration-only',
  'permission-needed',
  'blocked',
]);

const VALID_STATUSES = new Set<SourceStatus>(['approved', 'permission-needed', 'blocked']);

export const REPO_ROOT = process.cwd();
export const HARVEST_DIR = path.join(REPO_ROOT, 'docs/curriculum-harvest');
export const SOURCES_PATH = path.join(HARVEST_DIR, 'sources.json');
export const INDEX_PATH = path.join(HARVEST_DIR, 'index.json');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, pathLabel: string, errors: string[]): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${pathLabel} must be a non-empty string`);
  }
}

function assertBoolean(value: unknown, pathLabel: string, errors: string[]): asserts value is boolean {
  if (typeof value !== 'boolean') {
    errors.push(`${pathLabel} must be a boolean`);
  }
}

function assertStringArray(
  value: unknown,
  pathLabel: string,
  errors: string[],
): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    errors.push(`${pathLabel} must be an array of strings`);
  }
}

function validateRetrieval(value: unknown, sourceId: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${sourceId}.retrieval must be an object`);
    return;
  }

  const kind = value.kind;
  if (kind !== 'manual-download' && kind !== 'public-url' && kind !== 'none') {
    errors.push(`${sourceId}.retrieval.kind is invalid`);
    return;
  }

  if (kind === 'manual-download') {
    assertString(value.path, `${sourceId}.retrieval.path`, errors);
  }

  if (kind === 'public-url') {
    assertString(value.url, `${sourceId}.retrieval.url`, errors);
  }
}

function validateLicense(value: unknown, sourceId: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${sourceId}.license must be an object`);
    return;
  }

  assertString(value.name, `${sourceId}.license.name`, errors);
  assertString(value.url, `${sourceId}.license.url`, errors);
  assertBoolean(value.commercialOk, `${sourceId}.license.commercialOk`, errors);
  assertBoolean(value.shareAlike, `${sourceId}.license.shareAlike`, errors);
  assertBoolean(value.requiresAttribution, `${sourceId}.license.requiresAttribution`, errors);
}

export async function loadSources(): Promise<HarvestSource[]> {
  const raw = await readFile(SOURCES_PATH, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('sources.json must contain an array');
  }

  const errors: string[] = [];
  const ids = new Set<string>();

  for (const [index, source] of parsed.entries()) {
    const sourceLabel = isRecord(source) && typeof source.id === 'string' ? source.id : `source[${index}]`;

    if (!isRecord(source)) {
      errors.push(`${sourceLabel} must be an object`);
      continue;
    }

    assertString(source.id, `${sourceLabel}.id`, errors);
    assertString(source.title, `${sourceLabel}.title`, errors);
    assertString(source.url, `${sourceLabel}.url`, errors);
    validateRetrieval(source.retrieval, sourceLabel, errors);
    validateLicense(source.license, sourceLabel, errors);
    assertStringArray(source.targetTopics, `${sourceLabel}.targetTopics`, errors);
    assertString(source.notes, `${sourceLabel}.notes`, errors);

    if (typeof source.id === 'string') {
      if (ids.has(source.id)) {
        errors.push(`${source.id} appears more than once`);
      }
      ids.add(source.id);
    }

    if (!VALID_REUSE_MODES.has(source.reuseMode as ReuseMode)) {
      errors.push(`${sourceLabel}.reuseMode is invalid`);
    }

    if (!VALID_STATUSES.has(source.status as SourceStatus)) {
      errors.push(`${sourceLabel}.status is invalid`);
    }

    if (source.status === 'blocked' && source.reuseMode !== 'blocked') {
      errors.push(`${sourceLabel} is blocked but reuseMode is not blocked`);
    }

    if (source.reuseMode === 'blocked' && source.status !== 'blocked') {
      errors.push(`${sourceLabel} has blocked reuseMode but status is not blocked`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid sources.json:\n- ${errors.join('\n- ')}`);
  }

  return parsed as HarvestSource[];
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loadIndexIfPresent(): Promise<HarvestIndexEntry[]> {
  if (!(await pathExists(INDEX_PATH))) {
    return [];
  }

  const raw = await readFile(INDEX_PATH, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('index.json must contain an array');
  }

  return parsed as HarvestIndexEntry[];
}

async function main(): Promise<void> {
  const sources = await loadSources();
  const index = await loadIndexIfPresent();
  const approved = sources.filter((source) => source.status === 'approved');
  const blocked = sources.filter((source) => source.status === 'blocked');

  console.log(`sources: ${sources.length}`);
  console.log(`approved: ${approved.length}`);
  console.log(`blocked: ${blocked.length}`);
  console.log(`indexed chunks: ${index.length}`);
}

if (process.argv[1]?.endsWith('scripts/curriculum-harvest/validate.ts')) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

