/**
 * POST /api/hint — F2 personalized hint / 3-try ladder (contract C-2).
 *
 * Auth: Firebase ID token in Authorization: Bearer <token>
 * On any failure: 503 { fallback: true }
 * 401 unauth · 429 rate-limited
 *
 * Security model:
 *  - Token verified against Google JWKS (jose); uid used only for rate limiting.
 *  - Learner free text wrapped as DATA in prompts (injection-contained).
 *  - Model response validated against schema before return; parse failure → 503.
 *  - Answer NEVER revealed by model when tryNumber < 3 (enforced by prompt +
 *    post-response guard; spec AI-E4).
 *  - No key in client bundle; no PII in request body.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { callModel } from './_lib/callModel.js';
import { buildComputationalMessages, buildConceptualMessages } from './_lib/prompts.js';
import type {
  GroundComputational,
  GroundConceptual,
  LearnerSummary,
  ProblemField,
} from './_lib/prompts.js';

// ── Minimal Vercel-compatible handler types (avoids adding @vercel/node dep) ─

interface MinimalReq {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  socket?: { remoteAddress?: string };
}

interface MinimalRes {
  status(code: number): MinimalRes;
  json(data: unknown): MinimalRes;
  setHeader(name: string, value: string): MinimalRes;
  end(): void;
}

// ── JWKS / token verification ─────────────────────────────────────────────────

// Firebase Auth ID tokens are signed by the `securetoken` service, whose public
// keys are published (in JWK form) at this endpoint. NOTE: this is NOT
// `oauth2/v3/certs` (that set is for Google Sign-In / OIDC id_tokens and does
// not contain the key that signs Firebase ID tokens — using it yields 401s).
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

// Module-level singleton — cached across warm invocations in the same region.
const jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

function getProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID ?? 'brilliant-clone-102a7';
}

/** Verifies a Firebase ID token and returns the uid. Throws on failure. */
export async function verifyFirebaseToken(token: string): Promise<string> {
  const projectId = getProjectId();
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Token missing sub claim');
  }
  return payload.sub;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

const UID_MAX = 30;
const UID_WINDOW_MS = 5 * 60 * 1000;
const IP_MAX = 60;
const IP_WINDOW_MS = 5 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

// In-memory; per-region; not perfect for multi-device bursts (acceptable per spec).
const uidBuckets = new Map<string, Bucket>();
const ipBuckets = new Map<string, Bucket>();

/** Returns true if the key is over-limit (and should be 429'd). Increments count otherwise. */
export function checkRateLimit(
  buckets: Map<string, Bucket>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (bucket.count >= max) return true;
  bucket.count++;
  return false;
}

// ── Request / response types ──────────────────────────────────────────────────

type HintMode = 'computational' | 'conceptual';
type TryNumber = 1 | 2 | 3;

interface HintRequestBody {
  mode: HintMode;
  tryNumber: TryNumber;
  problem: ProblemField;
  learnerAnswer: unknown;
  ground: GroundComputational | GroundConceptual;
  learnerSummary?: LearnerSummary;
}

type Classification = 'correct-reasoning' | 'misconception' | 'irrelevant';

interface HintResponseBody {
  text: string;
  classification: Classification | null;
  misconceptionKey: string | null;
  modelVersion: string;
}

const VALID_CLASSIFICATIONS: readonly string[] = [
  'correct-reasoning',
  'misconception',
  'irrelevant',
];

// ── Body validation ───────────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** Returns a typed body or null if the request is malformed. */
export function parseAndValidateBody(raw: unknown): HintRequestBody | null {
  const b = asRecord(raw);
  if (!b) return null;

  const { mode, tryNumber, problem, learnerAnswer, ground } = b;

  if (mode !== 'computational' && mode !== 'conceptual') return null;
  if (tryNumber !== 1 && tryNumber !== 2 && tryNumber !== 3) return null;

  const prob = asRecord(problem);
  if (!prob || typeof prob.prompt !== 'string' || !prob.prompt) return null;

  const gnd = asRecord(ground);
  if (!gnd || typeof gnd.answer !== 'string' || !gnd.answer) return null;

  if (mode === 'conceptual') {
    const la = asRecord(learnerAnswer);
    if (!la || typeof la.why !== 'string') return null;
  }

  return {
    mode: mode as HintMode,
    tryNumber: tryNumber as TryNumber,
    problem: {
      prompt: prob.prompt as string,
      context: typeof prob.context === 'string' ? prob.context : undefined,
    },
    learnerAnswer,
    ground: gnd as unknown as GroundComputational | GroundConceptual,
    learnerSummary: asRecord(b.learnerSummary) as LearnerSummary | undefined,
  };
}

// ── Response validation ───────────────────────────────────────────────────────

/**
 * Patterns that strongly suggest the model is revealing the answer (AI-E4).
 * Applied only when tryNumber < 3 (hint mode).
 */
const REVEAL_PATTERNS = [
  /\bthe correct answer is\b/i,
  /\bthe answer is\b/i,
  /\bthe solution is\b/i,
  /\bcorrect answer:\s*/i,
  /\bsolution:\s*/i,
];

/** Returns true if the text contains a recognisable answer-reveal pattern. */
export function looksLikeReveal(text: string): boolean {
  return REVEAL_PATTERNS.some((re) => re.test(text));
}

/**
 * Parse and validate the raw model output against the C-2 response schema.
 * Returns null on any validation failure (caller returns 503 fallback).
 */
export function validateModelOutput(
  rawText: string,
  mode: HintMode,
  tryNumber: TryNumber,
  allowedMisconceptions: string[],
): HintResponseBody | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (typeof parsed.text !== 'string' || !parsed.text) return null;

  // No-reveal guard for hint turns (AI-E4).
  if (tryNumber < 3 && looksLikeReveal(parsed.text)) return null;

  if (mode === 'computational') {
    return {
      text: parsed.text,
      classification: null,
      misconceptionKey: null,
      modelVersion: process.env.OPENAI_MODEL ?? 'unknown',
    };
  }

  // Conceptual — validate classification and misconceptionKey.
  const classification = parsed.classification;
  if (
    classification !== null &&
    !VALID_CLASSIFICATIONS.includes(classification as string)
  ) {
    return null;
  }

  const misconceptionKey = parsed.misconceptionKey;
  if (
    misconceptionKey !== null &&
    (typeof misconceptionKey !== 'string' ||
      (allowedMisconceptions.length > 0 &&
        !allowedMisconceptions.includes(misconceptionKey)))
  ) {
    return null;
  }

  return {
    text: parsed.text,
    classification: (classification ?? null) as Classification | null,
    misconceptionKey: (misconceptionKey ?? null) as string | null,
    modelVersion: process.env.OPENAI_MODEL ?? 'unknown',
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(
  req: MinimalReq,
  res: MinimalRes,
): Promise<void> {
  // CORS — allow cross-origin calls (VITE_AI_API_BASE may differ from site origin).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 1. Token verification.
  const authHeader = req.headers['authorization'] ?? req.headers['Authorization'];
  const rawToken = typeof authHeader === 'string' ? authHeader : undefined;
  const token = rawToken?.replace(/^Bearer\s+/i, '').trim() ?? '';

  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  let uid: string;
  try {
    uid = await verifyFirebaseToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // 2. Rate limiting.
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip =
    (typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0]?.trim()
      : Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : undefined) ??
    req.socket?.remoteAddress ??
    'unknown';

  if (checkRateLimit(uidBuckets, uid, UID_MAX, UID_WINDOW_MS)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }
  if (checkRateLimit(ipBuckets, ip, IP_MAX, IP_WINDOW_MS)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  // 3. Parse and validate body.
  const body = parseAndValidateBody(req.body);
  if (!body) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { mode, tryNumber, problem, learnerAnswer, ground, learnerSummary } = body;

  // 4. Build prompt messages (ground is loaded from request — never from the model).
  let messages;
  if (mode === 'computational') {
    messages = buildComputationalMessages({
      problem,
      learnerAnswer,
      ground: ground as GroundComputational,
      tryNumber,
      learnerSummary,
    });
  } else {
    const la = learnerAnswer as { answer: unknown; why: string };
    messages = buildConceptualMessages({
      problem,
      learnerAnswer: la,
      ground: ground as GroundConceptual,
      tryNumber,
      learnerSummary,
    });
  }

  // 5. Call model.
  let rawOutput: string;
  try {
    rawOutput = await callModel(messages, { json: true });
  } catch {
    res.status(503).json({ fallback: true });
    return;
  }

  // 6. Validate response schema.
  const allowedMisconceptions =
    mode === 'conceptual'
      ? ((ground as GroundConceptual).misconceptions ?? [])
      : [];

  const validated = validateModelOutput(rawOutput, mode, tryNumber, allowedMisconceptions);
  if (!validated) {
    res.status(503).json({ fallback: true });
    return;
  }

  // 7. Return.
  res.status(200).json(validated);
}
