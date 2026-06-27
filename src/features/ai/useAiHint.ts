import { auth } from '@/lib/firebase';

// ---------------------------------------------------------------------------
// Types — C-3 contract (see docs/specs/wp/f2-build-plan.md §C)
// ---------------------------------------------------------------------------

/** Full payload sent to POST /api/hint (C-2). */
export type HintRequest = {
  mode: 'computational' | 'conceptual';
  tryNumber: 1 | 2 | 3;
  problem: { prompt: string; context?: string };
  learnerAnswer: Record<string, unknown>;
  ground: {
    answer: string;
    canonicalWhy?: string;
    rubricKeyPoints?: string[];
    misconceptions?: string[];
  };
  learnerSummary?: { topWeakness: string; recentMisconception: string };
};

/** Shape returned to callers. `fallbackUsed: true` → show authored copy. */
export type HintResult = {
  text: string;
  classification?: string | null;
  misconceptionKey?: string | null;
  fallbackUsed: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FALLBACK: HintResult = { text: '', fallbackUsed: true };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Calls POST /api/hint with a Firebase ID token.
 * On any failure (AI disabled, no user, network error, non-200) returns
 * `{ fallbackUsed: true }` so the caller renders authored copy.
 * Never throws.
 */
export function useAiHint(): { requestHint: (req: HintRequest) => Promise<HintResult> } {
  async function requestHint(req: HintRequest): Promise<HintResult> {
    // Flag gate — short-circuit with no network call when AI is disabled.
    if (import.meta.env.VITE_AI_ENABLED !== 'true') {
      return FALLBACK;
    }

    // Obtain the Firebase ID token for the current user.
    const user = auth.currentUser;
    if (!user) return FALLBACK;

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch {
      return FALLBACK;
    }

    // Build the endpoint URL. VITE_AI_API_BASE may be a full origin
    // (e.g. "https://fn.example.com") when the function lives on a separate
    // host; omitting it falls back to a same-origin relative path.
    const base = import.meta.env.VITE_AI_API_BASE ?? '';
    const url = `${base}/api/hint`;

    // Network request — any throw (offline, CORS, DNS) → fallback.
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(req),
      });
    } catch {
      return FALLBACK;
    }

    // Non-2xx (including 429, 503) → fallback so UI never shows an error.
    if (!res.ok) {
      return FALLBACK;
    }

    // Parse and validate the response shape.
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return FALLBACK;
    }

    if (
      typeof data !== 'object' ||
      data === null ||
      typeof (data as Record<string, unknown>).text !== 'string'
    ) {
      return FALLBACK;
    }

    const d = data as Record<string, unknown>;
    return {
      text: d.text as string,
      classification: typeof d.classification === 'string' ? d.classification : null,
      misconceptionKey: typeof d.misconceptionKey === 'string' ? d.misconceptionKey : null,
      fallbackUsed: false,
    };
  }

  return { requestHint };
}
