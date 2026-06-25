import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { chunkText } from './chunk';
import {
  HARVEST_DIR,
  INDEX_PATH,
  REPO_ROOT,
  type HarvestIndexEntry,
  type HarvestSource,
  loadSources,
} from './validate';

const RAW_DIR = path.join(HARVEST_DIR, 'raw');
const CHUNKS_DIR = path.join(HARVEST_DIR, 'chunks');
const execFileAsync = promisify(execFile);

function toRepoRelative(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

function looksLikePdf(buffer: Buffer, contentType: string): boolean {
  return contentType.includes('application/pdf') || buffer.subarray(0, 4).toString() === '%PDF';
}

async function extractPdfText(source: HarvestSource, buffer: Buffer): Promise<string> {
  await mkdir(RAW_DIR, { recursive: true });
  const pdfPath = path.join(RAW_DIR, `${source.id}.pdf`);
  await writeFile(pdfPath, buffer);

  const { stdout } = await execFileAsync('pdftotext', ['-layout', pdfPath, '-'], {
    maxBuffer: 50 * 1024 * 1024,
  });

  return stdout;
}

async function fetchPublicUrl(source: HarvestSource, url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${source.id}: fetch failed ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());

  if (looksLikePdf(buffer, contentType)) {
    return extractPdfText(source, buffer);
  }

  const body = buffer.toString('utf8');
  if (contentType.includes('text/html') || body.includes('<html')) {
    return htmlToText(body);
  }

  return body;
}

async function loadSourceText(source: HarvestSource): Promise<string | null> {
  if (source.retrieval.kind === 'none') {
    console.log(`${source.id}: skipped (no retrieval)`);
    return null;
  }

  if (source.retrieval.kind === 'manual-download') {
    const fullPath = path.resolve(REPO_ROOT, source.retrieval.path);
    try {
      return await readFile(fullPath, 'utf8');
    } catch {
      console.warn(`${source.id}: missing manual text at ${source.retrieval.path}; skipped`);
      return null;
    }
  }

  try {
    const text = await fetchPublicUrl(source, source.retrieval.url);
    await mkdir(RAW_DIR, { recursive: true });
    await writeFile(path.join(RAW_DIR, `${source.id}.txt`), text);
    return text;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${source.id}: ${message}; skipped`);
    return null;
  }
}

function buildChunkMarkdown(source: HarvestSource, ordinal: number, text: string): string {
  const padded = String(ordinal).padStart(4, '0');
  return [
    `# ${source.id} chunk ${padded}`,
    '',
    `- **Source:** ${source.title}`,
    `- **Source id:** ${source.id}`,
    `- **URL:** ${source.url}`,
    `- **Reuse mode:** ${source.reuseMode}`,
    `- **License:** ${source.license.name}`,
    `- **Target topics:** ${source.targetTopics.join(', ')}`,
    '',
    '---',
    '',
    text,
    '',
  ].join('\n');
}

async function writeChunksForSource(source: HarvestSource, text: string): Promise<HarvestIndexEntry[]> {
  const chunks = chunkText(text);
  const sourceChunkDir = path.join(CHUNKS_DIR, source.id);
  await mkdir(sourceChunkDir, { recursive: true });

  const entries: HarvestIndexEntry[] = [];

  for (const chunk of chunks) {
    const padded = String(chunk.ordinal).padStart(4, '0');
    const chunkPath = path.join(sourceChunkDir, `chunk-${padded}.md`);
    const markdown = buildChunkMarkdown(source, chunk.ordinal, chunk.text);
    await writeFile(chunkPath, markdown);
    entries.push({
      sourceId: source.id,
      sourceTitle: source.title,
      reuseMode: source.reuseMode,
      chunkPath: toRepoRelative(chunkPath),
      hash: sha256(markdown),
      wordCount: chunk.wordCount,
      processed: false,
    });
  }

  console.log(`${source.id}: wrote ${entries.length} chunks`);
  return entries;
}

async function main(): Promise<void> {
  const sources = await loadSources();
  const approvedSources = sources.filter(
    (source) => source.status === 'approved' && source.reuseMode !== 'blocked',
  );
  const index: HarvestIndexEntry[] = [];

  await rm(CHUNKS_DIR, { recursive: true, force: true });
  await mkdir(CHUNKS_DIR, { recursive: true });

  for (const source of approvedSources) {
    const text = await loadSourceText(source);
    if (text === null || text.trim().length === 0) {
      continue;
    }

    index.push(...(await writeChunksForSource(source, text)));
  }

  await writeFile(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`index: wrote ${index.length} chunks to ${toRepoRelative(INDEX_PATH)}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

