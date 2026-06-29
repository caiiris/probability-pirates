/**
 * wager-deploy — push authored wager JSON files to Firestore.
 *
 * Reads every file under src/content/wagers/*.json and writes two docs per
 * wager: the public meta at /wagers/{id} and the gated answer at
 * /wagers/{id}/private/answer. Idempotent — re-running overwrites cleanly.
 *
 * AUTH: reuses the Firebase CLI's stored OAuth refresh token at
 * ~/.config/configstore/firebase-tools.json, mints a fresh access token via
 * the public firebase-tools OAuth client, and calls the Firestore REST API
 * with that token. Zero per-machine setup beyond `firebase login`, which the
 * user has already done for `firebase deploy --only hosting`.
 *
 * Usage:
 *   npm run wager:deploy            — deploys every JSON file
 *   npm run wager:deploy -- --id=X  — deploys only the wager with id X
 *   npm run wager:deploy -- --dry   — prints planned writes without sending
 */

import { readdir, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// firebase-tools OAuth client credentials. These are public — every install of
// the CLI contains them and they are used for the local-machine login flow
// only. They are not API keys; misuse cannot access anything without an
// already-valid user refresh token.
const FIREBASE_TOOLS_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_TOOLS_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const PROJECT_ID = 'brilliant-clone-102a7';
const REPO_ROOT = process.cwd();
const WAGERS_DIR = path.join(REPO_ROOT, 'src/content/wagers');
const CONFIGSTORE_PATH = path.join(
  homedir(),
  '.config/configstore/firebase-tools.json',
);

type WagerFile = {
  id: string;
  sequence: number;
  openAt: string;
  prompt: string;
  unit: 'percent' | 'count' | 'fraction';
  tags: string[];
  flavor: 'frequency' | 'combinatorics' | 'counterintuition' | 'bayesian';
  scoring: 'log' | 'abs';
  relatedLessonId?: string;
  status: 'live' | 'archived';
  createdBy: 'system';
  trueAnswer: number;
  source: string;
  sourceUrl?: string;
  revealHeadline: string;
  revealExplanation: string;
  revealWorked?: string;
};

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const onlyId = args.find((a) => a.startsWith('--id='))?.split('=')[1];
const dryRun = args.includes('--dry');

// ---------------------------------------------------------------------------
// OAuth: refresh the firebase-tools access token
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string> {
  let store: { tokens?: { refresh_token?: string } };
  try {
    store = JSON.parse(readFileSync(CONFIGSTORE_PATH, 'utf8'));
  } catch (err) {
    throw new Error(
      `Could not read ${CONFIGSTORE_PATH}. Run \`firebase login\` first. (${
        err instanceof Error ? err.message : String(err)
      })`,
    );
  }

  const refreshToken = store.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error(
      'No refresh_token in firebase-tools configstore. Run `firebase login`.',
    );
  }

  // Always mint a fresh access token. The stored access_token may be expired;
  // a single refresh exchange is cheap and removes the expiry-cliff risk.
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FIREBASE_TOOLS_CLIENT_ID,
      client_secret: FIREBASE_TOOLS_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OAuth refresh failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('OAuth refresh returned no access_token');
  }
  return data.access_token;
}

// ---------------------------------------------------------------------------
// Firestore REST helpers
// ---------------------------------------------------------------------------

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type RestValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { arrayValue: { values: RestValue[] } }
  | { nullValue: null };

function toRestValue(v: unknown): RestValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') {
    // ISO date heuristic: if it parses cleanly and the string looks date-shaped
    // we emit timestampValue. Otherwise stringValue.
    if (/^\d{4}-\d{2}-\d{2}T/.test(v) && !isNaN(Date.parse(v))) {
      return { timestampValue: v };
    }
    return { stringValue: v };
  }
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toRestValue) } };
  }
  throw new Error(`toRestValue: unsupported value type for ${JSON.stringify(v)}`);
}

function toRestFields(obj: Record<string, unknown>): Record<string, RestValue> {
  const out: Record<string, RestValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = toRestValue(v);
  }
  return out;
}

/**
 * PATCH a document. With ?updateMask.fieldPaths=... omitted, PATCH semantics
 * replace the full document — same as setDoc without merge. We list every key
 * we're writing in the updateMask so unwritten fields are preserved (we never
 * have any, but it's safer if Firestore later adds aggregates).
 */
async function patchDoc(
  docPath: string,
  fields: Record<string, unknown>,
  accessToken: string,
): Promise<void> {
  const restFields = toRestFields(fields);
  const fieldPaths = Object.keys(restFields);
  const url = new URL(`${BASE_URL}/${docPath}`);
  for (const p of fieldPaths) {
    url.searchParams.append('updateMask.fieldPaths', p);
  }

  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ fields: restFields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${docPath} failed (${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Split a wager file into public + private payloads
// ---------------------------------------------------------------------------

const PUBLIC_KEYS = [
  'id',
  'sequence',
  'openAt',
  'prompt',
  'unit',
  'tags',
  'flavor',
  'scoring',
  'relatedLessonId',
  'status',
  'createdBy',
] as const;

const PRIVATE_KEYS = [
  'trueAnswer',
  'source',
  'sourceUrl',
  'revealHeadline',
  'revealExplanation',
  'revealWorked',
] as const;

function splitWager(wager: WagerFile): {
  publicFields: Record<string, unknown>;
  privateFields: Record<string, unknown>;
} {
  const publicFields: Record<string, unknown> = {};
  for (const k of PUBLIC_KEYS) {
    if (wager[k] !== undefined) publicFields[k] = wager[k];
  }
  const privateFields: Record<string, unknown> = {};
  for (const k of PRIVATE_KEYS) {
    if (wager[k] !== undefined) privateFields[k] = wager[k];
  }
  return { publicFields, privateFields };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(WAGERS_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`wager-deploy: ${WAGERS_DIR} does not exist`);
      process.exit(1);
    }
    throw err;
  }

  let files = entries.filter((e) => e.endsWith('.json')).sort();
  if (onlyId) {
    files = files.filter((f) => f === `${onlyId}.json`);
    if (files.length === 0) {
      console.error(`wager-deploy: no file matches --id=${onlyId}`);
      process.exit(1);
    }
  }

  if (files.length === 0) {
    console.log('wager-deploy: nothing to deploy.');
    return;
  }

  console.log(
    `wager-deploy: ${files.length} wager${files.length !== 1 ? 's' : ''} to ${
      dryRun ? 'preview' : 'push'
    } to project ${PROJECT_ID}`,
  );

  // Parse + split all files first so we surface JSON / shape errors before any
  // network calls.
  const plans: Array<{
    filename: string;
    wager: WagerFile;
    publicFields: Record<string, unknown>;
    privateFields: Record<string, unknown>;
  }> = [];

  for (const filename of files) {
    const filepath = path.join(WAGERS_DIR, filename);
    const text = await readFile(filepath, 'utf8');
    let wager: WagerFile;
    try {
      wager = JSON.parse(text) as WagerFile;
    } catch (err) {
      console.error(
        `  FAIL  ${filename}: JSON parse error — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      process.exit(1);
    }
    const { publicFields, privateFields } = splitWager(wager);
    plans.push({ filename, wager, publicFields, privateFields });
  }

  if (dryRun) {
    for (const p of plans) {
      console.log(`  [dry] wagers/${p.wager.id}`);
      console.log(`        public  keys: ${Object.keys(p.publicFields).join(', ')}`);
      console.log(`        private keys: ${Object.keys(p.privateFields).join(', ')}`);
    }
    console.log('wager-deploy: dry run complete; no writes performed.');
    return;
  }

  const accessToken = await getAccessToken();

  for (const p of plans) {
    try {
      await patchDoc(`wagers/${p.wager.id}`, p.publicFields, accessToken);
      await patchDoc(
        `wagers/${p.wager.id}/private/answer`,
        p.privateFields,
        accessToken,
      );
      console.log(`  PUSH  wagers/${p.wager.id}`);
    } catch (err) {
      console.error(
        `  FAIL  wagers/${p.wager.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      process.exit(1);
    }
  }

  console.log(
    `wager-deploy: ${plans.length} wager${plans.length !== 1 ? 's' : ''} pushed successfully.`,
  );
}

main().catch((err: unknown) => {
  console.error(
    'wager-deploy: unexpected error —',
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
