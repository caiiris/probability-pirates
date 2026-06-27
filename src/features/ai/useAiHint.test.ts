import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAiHint } from './useAiHint';
import type { HintRequest } from './useAiHint';

// ---------------------------------------------------------------------------
// Mock Firebase auth singleton so tests never touch a real Firebase project.
// vi.hoisted ensures the variable is initialised before the hoisted vi.mock
// factory runs (vitest 2.x hoisting semantics).
// ---------------------------------------------------------------------------

const mockGetIdToken = vi.hoisted(() =>
  vi.fn<() => Promise<string>>().mockResolvedValue('test-firebase-token'),
);

vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { getIdToken: mockGetIdToken },
  },
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MINIMAL_REQUEST: HintRequest = {
  mode: 'computational',
  tryNumber: 1,
  problem: { prompt: 'What is P(heads)?' },
  learnerAnswer: { value: '0.6' },
  ground: { answer: '0.5' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAiHint', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    // Default: AI enabled.
    vi.stubEnv('VITE_AI_ENABLED', 'true');
    mockGetIdToken.mockResolvedValue('test-firebase-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Flag off — no network call
  // -------------------------------------------------------------------------

  describe('when VITE_AI_ENABLED is not "true"', () => {
    it('returns fallbackUsed:true and never calls fetch when flag is "false"', async () => {
      vi.stubEnv('VITE_AI_ENABLED', 'false');
      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
      expect(result.text).toBe('');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns fallbackUsed:true and never calls fetch when flag is empty string', async () => {
      vi.stubEnv('VITE_AI_ENABLED', '');
      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns fallbackUsed:true and never calls fetch when flag is undefined', async () => {
      // Simulate unset by providing a value that isn't 'true'
      vi.stubEnv('VITE_AI_ENABLED', 'not-set');
      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 200 — successful response parsed correctly
  // -------------------------------------------------------------------------

  describe('on 200 response', () => {
    it('returns parsed text and fallbackUsed:false', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            text: 'Think about independence between flips.',
            classification: null,
            misconceptionKey: null,
            modelVersion: 'gpt-5',
          }),
          { status: 200 },
        ),
      );

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(false);
      expect(result.text).toBe('Think about independence between flips.');
      expect(result.classification).toBeNull();
      expect(result.misconceptionKey).toBeNull();
    });

    it('returns classification and misconceptionKey when present', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            text: 'That reasoning reflects the gambler\'s fallacy.',
            classification: 'misconception',
            misconceptionKey: 'gambler',
            modelVersion: 'gpt-5',
          }),
          { status: 200 },
        ),
      );

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(false);
      expect(result.classification).toBe('misconception');
      expect(result.misconceptionKey).toBe('gambler');
    });

    it('sends Authorization header containing the Firebase ID token', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ text: 'nudge' }), { status: 200 }),
      );

      const { requestHint } = useAiHint();
      await requestHint(MINIMAL_REQUEST);

      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-firebase-token');
    });

    it('POSTs to /api/hint when VITE_AI_API_BASE is not set', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ text: 'ok' }), { status: 200 }),
      );

      const { requestHint } = useAiHint();
      await requestHint(MINIMAL_REQUEST);

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toBe('/api/hint');
    });

    it('falls back on 200 with malformed JSON body', async () => {
      fetchMock.mockResolvedValueOnce(new Response('not-json', { status: 200 }));

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
    });

    it('falls back on 200 with missing text field', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ classification: 'correct-reasoning' }), { status: 200 }),
      );

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Non-200 / network failures → fallback
  // -------------------------------------------------------------------------

  describe('on failure', () => {
    it('returns fallbackUsed:true on 503', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ fallback: true }), { status: 503 }),
      );

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
    });

    it('returns fallbackUsed:true on 429', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
    });

    it('returns fallbackUsed:true on network error (fetch throws)', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
    });

    it('returns fallbackUsed:true on 401', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const { requestHint } = useAiHint();
      const result = await requestHint(MINIMAL_REQUEST);

      expect(result.fallbackUsed).toBe(true);
    });

    it('does not throw to the caller on any failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('unexpected'));

      const { requestHint } = useAiHint();
      await expect(requestHint(MINIMAL_REQUEST)).resolves.toMatchObject({ fallbackUsed: true });
    });
  });
});
