// @vitest-environment node
/**
 * Unit tests for F2-A: prompt builders, response validation, no-reveal guard,
 * and the /api/hint handler.
 *
 * All network calls (fetch → OpenAI) and jose token verification are mocked.
 * No real network or OpenAI calls are made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock jose (must be hoisted before hint.ts import) ────────────────────────
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue('mock-jwks-fn'),
  jwtVerify: vi.fn(),
}));

// ── Mock callModel to avoid real OpenAI calls ─────────────────────────────────
vi.mock('./_lib/callModel.ts', () => ({
  callModel: vi.fn(),
}));

import { jwtVerify } from 'jose';
import { callModel } from './_lib/callModel.js';
import {
  buildComputationalMessages,
  buildConceptualMessages,
} from './_lib/prompts.js';
import {
  parseAndValidateBody,
  validateModelOutput,
  looksLikeReveal,
  checkRateLimit,
  verifyFirebaseToken,
} from './hint.js';
import handlerDefault from './hint.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<{
  method: string;
  headers: Record<string, string | undefined>;
  body: unknown;
  socket: { remoteAddress?: string };
}> = {}) {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', 'content-type': 'application/json' },
    body: null,
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function makeRes() {
  const res = {
    _status: 0 as number,
    _json: null as unknown,
    _headers: {} as Record<string, string>,
    status: vi.fn() as ReturnType<typeof vi.fn>,
    json: vi.fn() as ReturnType<typeof vi.fn>,
    setHeader: vi.fn().mockReturnThis() as ReturnType<typeof vi.fn>,
    end: vi.fn(),
  };
  res.status.mockImplementation((code: number) => {
    res._status = code;
    return res;
  });
  res.json.mockImplementation((data: unknown) => {
    res._json = data;
    return res;
  });
  return res;
}

const validComputationalBody = {
  mode: 'computational' as const,
  tryNumber: 1 as const,
  problem: { prompt: 'P(heads) = ?', context: 'fair coin' },
  learnerAnswer: '3/4',
  ground: { answer: '1/2' },
  learnerSummary: { topWeakness: 'gambler-fallacy', recentMisconception: 'gambler' },
};

const validConceptualBody = {
  mode: 'conceptual' as const,
  tryNumber: 2 as const,
  problem: { prompt: 'Explain why each flip is independent.' },
  learnerAnswer: { answer: '1/2', why: 'The coin is due for tails after 9 heads.' },
  ground: {
    answer: '1/2',
    rubricKeyPoints: ['Each flip is independent', 'Past outcomes do not influence future flips'],
    misconceptions: ['gambler', 'hot-hand'],
  },
};

// ── Prompt builders ───────────────────────────────────────────────────────────

describe('buildComputationalMessages', () => {
  it('returns system + user messages', () => {
    const msgs = buildComputationalMessages(validComputationalBody);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
  });

  it('system prompt forbids revealing the answer on tryNumber 1', () => {
    const msgs = buildComputationalMessages({ ...validComputationalBody, tryNumber: 1 });
    const sys = msgs[0].content;
    expect(sys).toMatch(/NEVER reveal/i);
    expect(sys).toMatch(/not reveal/i.source.includes('not reveal') ? /NEVER reveal/i : /NEVER/i);
  });

  it('system prompt forbids revealing the answer on tryNumber 2', () => {
    const msgs = buildComputationalMessages({ ...validComputationalBody, tryNumber: 2 });
    expect(msgs[0].content).toMatch(/NEVER reveal/i);
  });

  it('system prompt allows the answer on tryNumber 3 (explain mode)', () => {
    const msgs = buildComputationalMessages({ ...validComputationalBody, tryNumber: 3 });
    const sys = msgs[0].content;
    expect(sys).not.toMatch(/NEVER reveal/i);
    expect(sys).toMatch(/state the correct answer/i);
  });

  it('wraps learner answer in DATA delimiters', () => {
    const msgs = buildComputationalMessages(validComputationalBody);
    const user = msgs[1].content;
    expect(user).toContain('<<<LEARNER_ANSWER_DATA');
    expect(user).toContain('<<<END_LEARNER_ANSWER_DATA>>>');
  });

  it('omits the ground answer on early hints', () => {
    const msgs = buildComputationalMessages(validComputationalBody);
    expect(msgs[1].content).not.toContain('Correct answer');
    expect(msgs[1].content).not.toContain('1/2');
  });

  it('includes the ground answer on tryNumber 3', () => {
    const msgs = buildComputationalMessages({ ...validComputationalBody, tryNumber: 3 });
    expect(msgs[1].content).toContain('Correct answer');
    expect(msgs[1].content).toContain('1/2');
  });

  it('includes optional context when provided', () => {
    const msgs = buildComputationalMessages(validComputationalBody);
    expect(msgs[1].content).toContain('fair coin');
  });

  it('omits context line when not provided', () => {
    const msgs = buildComputationalMessages({
      ...validComputationalBody,
      problem: { prompt: 'P(heads) = ?' },
    });
    expect(msgs[1].content).not.toContain('Context:');
  });

  it('includes learner summary fields when provided', () => {
    const msgs = buildComputationalMessages(validComputationalBody);
    const user = msgs[1].content;
    expect(user).toContain('gambler-fallacy');
    expect(user).toContain('gambler');
  });
});

describe('buildConceptualMessages', () => {
  it('returns system + user messages', () => {
    const msgs = buildConceptualMessages(validConceptualBody);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
  });

  it('system prompt names the closed misconception set', () => {
    const msgs = buildConceptualMessages(validConceptualBody);
    const sys = msgs[0].content;
    expect(sys).toContain('"gambler"');
    expect(sys).toContain('"hot-hand"');
  });

  it('system prompt lists classification choices', () => {
    const sys = buildConceptualMessages(validConceptualBody)[0].content;
    expect(sys).toContain('correct-reasoning');
    expect(sys).toContain('misconception');
    expect(sys).toContain('irrelevant');
  });

  it('system prompt forbids revealing the answer', () => {
    const sys = buildConceptualMessages(validConceptualBody)[0].content;
    expect(sys).toMatch(/NEVER reveal/i);
  });

  it('wraps learner why text in DATA delimiters', () => {
    const user = buildConceptualMessages(validConceptualBody)[1].content;
    expect(user).toContain('<<<LEARNER_ANSWER_DATA');
    expect(user).toContain('<<<END_LEARNER_ANSWER_DATA>>>');
    expect(user).toContain('The coin is due for tails after 9 heads.');
  });

  it('includes rubric key points in user message', () => {
    const user = buildConceptualMessages(validConceptualBody)[1].content;
    expect(user).toContain('Each flip is independent');
    expect(user).toContain('Past outcomes do not influence future flips');
  });

  it('handles missing rubricKeyPoints and misconceptions gracefully', () => {
    const msgs = buildConceptualMessages({
      ...validConceptualBody,
      ground: { answer: '1/2' },
    });
    expect(msgs).toHaveLength(2);
    expect(msgs[0].content).toContain('(none)');
  });
});

// ── looksLikeReveal ───────────────────────────────────────────────────────────

describe('looksLikeReveal', () => {
  it.each([
    'The correct answer is 1/2.',
    'The answer is one-half.',
    'The solution is P=0.5.',
    'Correct answer: 0.5',
    'Solution: 1/2',
  ])('detects reveal in: %s', (text) => {
    expect(looksLikeReveal(text)).toBe(true);
  });

  it.each([
    'Think about what probability means for one flip.',
    'Is each trial truly independent?',
    'What changes between flips?',
  ])('does not flag innocent hint: %s', (text) => {
    expect(looksLikeReveal(text)).toBe(false);
  });
});

// ── parseAndValidateBody ──────────────────────────────────────────────────────

describe('parseAndValidateBody', () => {
  it('accepts a valid computational body', () => {
    const result = parseAndValidateBody(validComputationalBody);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('computational');
    expect(result!.tryNumber).toBe(1);
  });

  it('accepts a valid conceptual body', () => {
    const result = parseAndValidateBody(validConceptualBody);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('conceptual');
  });

  it('rejects when mode is invalid', () => {
    expect(parseAndValidateBody({ ...validComputationalBody, mode: 'unknown' })).toBeNull();
  });

  it('rejects when tryNumber is out of range', () => {
    expect(parseAndValidateBody({ ...validComputationalBody, tryNumber: 4 })).toBeNull();
    expect(parseAndValidateBody({ ...validComputationalBody, tryNumber: 0 })).toBeNull();
  });

  it('rejects when ground.answer is missing', () => {
    expect(
      parseAndValidateBody({ ...validComputationalBody, ground: { answer: '' } }),
    ).toBeNull();
  });

  it('rejects when problem.prompt is missing', () => {
    expect(
      parseAndValidateBody({ ...validComputationalBody, problem: { prompt: '' } }),
    ).toBeNull();
  });

  it('rejects conceptual body with no learnerAnswer.why', () => {
    expect(
      parseAndValidateBody({
        ...validConceptualBody,
        learnerAnswer: { answer: '1/2' }, // missing why
      }),
    ).toBeNull();
  });

  it('rejects null body', () => {
    expect(parseAndValidateBody(null)).toBeNull();
  });

  it('rejects non-object body', () => {
    expect(parseAndValidateBody('string')).toBeNull();
  });
});

// ── validateModelOutput ───────────────────────────────────────────────────────

describe('validateModelOutput', () => {
  describe('computational mode', () => {
    it('accepts valid computational output', () => {
      const raw = JSON.stringify({ text: 'Think about each flip independently.' });
      const result = validateModelOutput(raw, 'computational', 1, []);
      expect(result).not.toBeNull();
      expect(result!.text).toBe('Think about each flip independently.');
      expect(result!.classification).toBeNull();
      expect(result!.misconceptionKey).toBeNull();
    });

    it('returns null for malformed JSON', () => {
      expect(validateModelOutput('not json', 'computational', 1, [])).toBeNull();
    });

    it('returns null when text is missing', () => {
      expect(
        validateModelOutput(JSON.stringify({ hint: 'hello' }), 'computational', 1, []),
      ).toBeNull();
    });

    it('returns null when text is empty string', () => {
      expect(
        validateModelOutput(JSON.stringify({ text: '' }), 'computational', 1, []),
      ).toBeNull();
    });
  });

  describe('no-reveal guard (tryNumber < 3)', () => {
    it('rejects output containing "The correct answer is" on tryNumber 1', () => {
      const raw = JSON.stringify({ text: 'The correct answer is 1/2.' });
      expect(validateModelOutput(raw, 'computational', 1, [])).toBeNull();
    });

    it('rejects output containing "The answer is" on tryNumber 2', () => {
      const raw = JSON.stringify({ text: 'The answer is one-half.' });
      expect(validateModelOutput(raw, 'computational', 2, [])).toBeNull();
    });

    it('allows reveal patterns on tryNumber 3', () => {
      const raw = JSON.stringify({ text: 'The correct answer is 1/2. Here is why...' });
      const result = validateModelOutput(raw, 'computational', 3, []);
      expect(result).not.toBeNull();
    });

    it('allows non-revealing text on tryNumber 1', () => {
      const raw = JSON.stringify({ text: 'Is each flip independent of the last?' });
      expect(validateModelOutput(raw, 'computational', 1, [])).not.toBeNull();
    });
  });

  describe('conceptual mode', () => {
    it('accepts valid conceptual output with correct-reasoning', () => {
      const raw = JSON.stringify({
        text: 'Good reasoning!',
        classification: 'correct-reasoning',
        misconceptionKey: null,
      });
      const result = validateModelOutput(raw, 'conceptual', 1, ['gambler', 'hot-hand']);
      expect(result).not.toBeNull();
      expect(result!.classification).toBe('correct-reasoning');
      expect(result!.misconceptionKey).toBeNull();
    });

    it('accepts valid conceptual output with a recognised misconception key', () => {
      const raw = JSON.stringify({
        text: 'That sounds like the gambler\'s fallacy.',
        classification: 'misconception',
        misconceptionKey: 'gambler',
      });
      const result = validateModelOutput(raw, 'conceptual', 2, ['gambler', 'hot-hand']);
      expect(result).not.toBeNull();
      expect(result!.misconceptionKey).toBe('gambler');
    });

    it('rejects an unrecognised misconceptionKey outside the closed set', () => {
      const raw = JSON.stringify({
        text: 'Hmm.',
        classification: 'misconception',
        misconceptionKey: 'invented-key',
      });
      expect(
        validateModelOutput(raw, 'conceptual', 1, ['gambler', 'hot-hand']),
      ).toBeNull();
    });

    it('rejects an invalid classification value', () => {
      const raw = JSON.stringify({
        text: 'Not quite.',
        classification: 'partially-correct',
        misconceptionKey: null,
      });
      expect(validateModelOutput(raw, 'conceptual', 1, [])).toBeNull();
    });

    it('accepts null misconceptionKey when classification is correct-reasoning', () => {
      const raw = JSON.stringify({
        text: 'Great!',
        classification: 'correct-reasoning',
        misconceptionKey: null,
      });
      expect(validateModelOutput(raw, 'conceptual', 1, [])).not.toBeNull();
    });

    it('allows any misconceptionKey when no closed set is provided', () => {
      const raw = JSON.stringify({
        text: 'Hmm.',
        classification: 'misconception',
        misconceptionKey: 'gambler',
      });
      // allowedMisconceptions is [] → no restriction
      expect(validateModelOutput(raw, 'conceptual', 1, [])).not.toBeNull();
    });
  });
});

// ── checkRateLimit ────────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  it('allows requests up to the max', () => {
    const buckets = new Map();
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(buckets, 'uid-a', 5, 60_000)).toBe(false);
    }
  });

  it('blocks the request exceeding the max', () => {
    const buckets = new Map();
    for (let i = 0; i < 5; i++) checkRateLimit(buckets, 'uid-b', 5, 60_000);
    expect(checkRateLimit(buckets, 'uid-b', 5, 60_000)).toBe(true);
  });

  it('resets after the window expires', () => {
    const buckets = new Map<string, { count: number; resetAt: number }>();
    // Fill up the bucket with an already-expired window.
    buckets.set('uid-c', { count: 100, resetAt: Date.now() - 1 });
    expect(checkRateLimit(buckets, 'uid-c', 5, 60_000)).toBe(false);
  });

  it('isolates buckets per key', () => {
    const buckets = new Map();
    for (let i = 0; i < 5; i++) checkRateLimit(buckets, 'uid-x', 5, 60_000);
    // uid-y should still be under limit.
    expect(checkRateLimit(buckets, 'uid-y', 5, 60_000)).toBe(false);
  });
});

// ── verifyFirebaseToken ────────────────────────────────────────────────────────

describe('verifyFirebaseToken', () => {
  beforeEach(() => {
    vi.mocked(jwtVerify).mockReset();
  });

  it('returns uid from the token payload', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: 'test-uid-123' },
    } as ReturnType<typeof jwtVerify> extends Promise<infer T> ? Promise<T> extends Promise<infer U> ? U : never : never);
    const uid = await verifyFirebaseToken('fake-token');
    expect(uid).toBe('test-uid-123');
  });

  it('throws when jwtVerify rejects', async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('expired'));
    await expect(verifyFirebaseToken('bad-token')).rejects.toThrow();
  });

  it('throws when sub is missing from payload', async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: {},
    } as ReturnType<typeof jwtVerify> extends Promise<infer T> ? Promise<T> extends Promise<infer U> ? U : never : never);
    await expect(verifyFirebaseToken('no-sub-token')).rejects.toThrow();
  });
});

// ── Handler integration ───────────────────────────────────────────────────────

describe('handler', () => {
  beforeEach(() => {
    vi.mocked(jwtVerify).mockReset();
    vi.mocked(callModel).mockReset();
    // Default: valid token.
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { sub: 'uid-handler-test' },
    } as ReturnType<typeof jwtVerify> extends Promise<infer T> ? Promise<T> extends Promise<infer U> ? U : never : never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error('bad token'));
    const req = makeReq();
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(401);
  });

  it('returns 405 for non-POST methods', async () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(405);
  });

  it('returns 400 for invalid body', async () => {
    const req = makeReq({ body: { mode: 'bad' } });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(400);
  });

  it('returns 200 with valid computational request', async () => {
    vi.mocked(callModel).mockResolvedValueOnce(
      JSON.stringify({ text: 'Is each flip independent?' }),
    );
    const req = makeReq({ body: validComputationalBody });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(200);
    const body = res._json as { text: string; classification: null };
    expect(body.text).toBe('Is each flip independent?');
    expect(body.classification).toBeNull();
  });

  it('returns 200 with valid conceptual request', async () => {
    vi.mocked(callModel).mockResolvedValueOnce(
      JSON.stringify({
        text: 'Think about whether past flips matter.',
        classification: 'misconception',
        misconceptionKey: 'gambler',
      }),
    );
    const req = makeReq({ body: validConceptualBody });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(200);
    const body = res._json as { classification: string; misconceptionKey: string };
    expect(body.classification).toBe('misconception');
    expect(body.misconceptionKey).toBe('gambler');
  });

  it('returns 503 { fallback: true } when callModel throws', async () => {
    vi.mocked(callModel).mockRejectedValueOnce(new Error('OpenAI down'));
    const req = makeReq({ body: validComputationalBody });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(503);
    expect(res._json).toEqual({ fallback: true });
  });

  it('returns 503 { fallback: true } when model output fails schema validation', async () => {
    vi.mocked(callModel).mockResolvedValueOnce(JSON.stringify({ badField: 'oops' }));
    const req = makeReq({ body: validComputationalBody });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(503);
    expect(res._json).toEqual({ fallback: true });
  });

  it('returns 503 when model reveals answer on tryNumber < 3', async () => {
    vi.mocked(callModel).mockResolvedValueOnce(
      JSON.stringify({ text: 'The correct answer is 1/2.' }),
    );
    const req = makeReq({ body: { ...validComputationalBody, tryNumber: 1 } });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    // No-reveal guard triggers → fallback
    expect(res._status).toBe(503);
    expect(res._json).toEqual({ fallback: true });
  });

  it('returns 200 when model reveals answer on tryNumber 3 (allowed)', async () => {
    vi.mocked(callModel).mockResolvedValueOnce(
      JSON.stringify({ text: 'The correct answer is 1/2. Here is why...' }),
    );
    const req = makeReq({ body: { ...validComputationalBody, tryNumber: 3 } });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(200);
  });

  it('handles OPTIONS preflight with 204', async () => {
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();
    await handlerDefault(req, res as unknown as Parameters<typeof handlerDefault>[1]);
    expect(res._status).toBe(204);
    expect(res.end).toHaveBeenCalled();
  });
});
