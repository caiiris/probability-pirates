import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { HARVEST_DIR, REPO_ROOT } from './validate';

type TextFile = {
  path: string;
  text: string;
};

type SourcePhrase = {
  sourcePath: string;
  phrase: string;
};

type Match = {
  targetPath: string;
  sourcePath: string;
  phrase: string;
};

const DEFAULT_NGRAM_SIZE = 8;
const DEFAULT_MAX_MATCHES = 50;
const SOURCE_CHUNKS_DIR = path.join(HARVEST_DIR, 'chunks');
const DEFAULT_TARGETS = [
  'docs/curriculum-harvest/template-briefs',
  'src/content/lessons',
  'src/features/practice/templates',
];

const TEXT_EXTENSIONS = new Set(['.md', '.ts', '.tsx']);
const METADATA_LINE_PATTERNS = [
  /^\s*-\s+\*\*source/i,
  /^\s*-\s+\*\*source ids/i,
  /^\s*-\s+\*\*source inspiration/i,
  /^\s*-\s+\*\*reuse mode/i,
  /^\s*-\s+\*\*license/i,
  /^\s*-\s+\*\*target topics/i,
  /^\s*-\s+\*\*legal notes/i,
  /^\s*-\s+\*\*human status/i,
  /^\s*-\s+\*\*candidate refs/i,
  /^\s*-\s+\*\*suggested status/i,
  /^\s*#{1,6}\s+/,
];

function parseArgs(argv: string[]): { ngramSize: number; maxMatches: number; targets: string[] } {
  let ngramSize = DEFAULT_NGRAM_SIZE;
  let maxMatches = DEFAULT_MAX_MATCHES;
  const targets: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--ngram' && next !== undefined) {
      ngramSize = Number(next);
      index += 1;
      continue;
    }

    if (arg === '--max-matches' && next !== undefined) {
      maxMatches = Number(next);
      index += 1;
      continue;
    }

    targets.push(arg);
  }

  if (!Number.isInteger(ngramSize) || ngramSize < 5 || ngramSize > 14) {
    throw new Error('--ngram must be an integer from 5 to 14');
  }

  if (!Number.isInteger(maxMatches) || maxMatches < 1) {
    throw new Error('--max-matches must be a positive integer');
  }

  return {
    ngramSize,
    maxMatches,
    targets: targets.length > 0 ? targets : DEFAULT_TARGETS,
  };
}

function repoPath(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectTextFiles(inputPath: string): Promise<string[]> {
  const absolutePath = path.resolve(REPO_ROOT, inputPath);
  if (!(await pathExists(absolutePath))) {
    return [];
  }

  const info = await stat(absolutePath);
  if (info.isFile()) {
    return TEXT_EXTENSIONS.has(path.extname(absolutePath)) ? [absolutePath] : [];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const childPath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTextFiles(repoPath(childPath))));
      continue;
    }

    if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(childPath);
    }
  }

  return files;
}

function stripBoilerplate(text: string): string {
  return text
    .split('\n')
    .filter((line) => !METADATA_LINE_PATTERNS.some((pattern) => pattern.test(line)))
    .join('\n')
    .replace(/```[\s\S]*?```/g, ' ');
}

function tokenize(text: string): string[] {
  return stripBoilerplate(text)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function ngrams(words: string[], ngramSize: number): string[] {
  const result: string[] = [];
  for (let index = 0; index <= words.length - ngramSize; index += 1) {
    result.push(words.slice(index, index + ngramSize).join(' '));
  }
  return result;
}

async function loadTextFiles(paths: string[]): Promise<TextFile[]> {
  return Promise.all(
    paths.map(async (filePath) => ({
      path: repoPath(filePath),
      text: await readFile(filePath, 'utf8'),
    })),
  );
}

function buildSourceMap(sourceFiles: TextFile[], ngramSize: number): Map<string, SourcePhrase> {
  const sourceMap = new Map<string, SourcePhrase>();

  for (const sourceFile of sourceFiles) {
    const sourceWords = tokenize(sourceFile.text);
    for (const phrase of ngrams(sourceWords, ngramSize)) {
      if (!sourceMap.has(phrase)) {
        sourceMap.set(phrase, { sourcePath: sourceFile.path, phrase });
      }
    }
  }

  return sourceMap;
}

function findMatches(
  targetFiles: TextFile[],
  sourceMap: Map<string, SourcePhrase>,
  ngramSize: number,
  maxMatches: number,
): Match[] {
  const matches: Match[] = [];
  const seen = new Set<string>();

  for (const targetFile of targetFiles) {
    const targetWords = tokenize(targetFile.text);
    for (const phrase of ngrams(targetWords, ngramSize)) {
      const sourcePhrase = sourceMap.get(phrase);
      if (sourcePhrase === undefined) {
        continue;
      }

      const key = `${targetFile.path}\0${sourcePhrase.sourcePath}\0${phrase}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      matches.push({
        targetPath: targetFile.path,
        sourcePath: sourcePhrase.sourcePath,
        phrase: sourcePhrase.phrase,
      });

      if (matches.length >= maxMatches) {
        return matches;
      }
    }
  }

  return matches;
}

async function main(): Promise<void> {
  const { ngramSize, maxMatches, targets } = parseArgs(process.argv.slice(2));
  const sourcePaths = await collectTextFiles(repoPath(SOURCE_CHUNKS_DIR));
  const targetPaths = (await Promise.all(targets.map((target) => collectTextFiles(target)))).flat();

  if (sourcePaths.length === 0) {
    console.log('No source chunks found. Run npm run harvest:ingest first.');
    return;
  }

  if (targetPaths.length === 0) {
    console.log('No target files found.');
    return;
  }

  const sourceFiles = await loadTextFiles(sourcePaths);
  const targetFiles = await loadTextFiles(targetPaths);
  const sourceMap = buildSourceMap(sourceFiles, ngramSize);
  const matches = findMatches(targetFiles, sourceMap, ngramSize, maxMatches);

  console.log(`source chunks: ${sourceFiles.length}`);
  console.log(`target files: ${targetFiles.length}`);
  console.log(`ngram size: ${ngramSize}`);

  if (matches.length === 0) {
    console.log('wording audit: passed (no suspicious overlaps)');
    return;
  }

  console.log(`wording audit: ${matches.length} suspicious overlap(s)`);
  for (const match of matches) {
    console.log('');
    console.log(`target: ${match.targetPath}`);
    console.log(`source: ${match.sourcePath}`);
    console.log(`phrase: "${match.phrase}"`);
  }

  process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

