import { describe, it, expect } from 'vitest';
import { ERROR_COPY, authErrorFromFirebaseCode } from './errors';

/** Recursively collect every leaf string in the nested copy catalog. */
function allStrings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (node && typeof node === 'object') {
    return Object.values(node).flatMap(allStrings);
  }
  return [];
}

const strings = allStrings(ERROR_COPY);

describe('ERROR_COPY catalog', () => {
  it('has copy to test', () => {
    expect(strings.length).toBeGreaterThan(0);
  });

  // docs/ui-directive.md: em dashes are banned in shipped strings.
  it('contains no em dashes or en dashes', () => {
    const offenders = strings.filter((s) => s.includes('\u2014') || s.includes('\u2013'));
    expect(offenders).toEqual([]);
  });

  // Failure states stay calm; the directive permits exclamations only where warranted.
  it('contains no exclamation marks', () => {
    const offenders = strings.filter((s) => s.includes('!'));
    expect(offenders).toEqual([]);
  });

  // The whole point of the module: raw Firebase codes never reach the learner.
  it('never leaks a raw firebase/* code', () => {
    const offenders = strings.filter((s) => /auth\//.test(s) || /\bcode\b.*[:=]/.test(s));
    expect(offenders).toEqual([]);
  });

  it('every string is non-empty and trimmed', () => {
    for (const s of strings) {
      expect(s.length).toBeGreaterThan(0);
      expect(s).toBe(s.trim());
    }
  });
});

describe('authErrorFromFirebaseCode', () => {
  it('maps known Firebase auth codes to typed, friendly errors', () => {
    expect(authErrorFromFirebaseCode('auth/email-already-in-use')).toEqual({
      code: 'email-in-use',
      message: ERROR_COPY.auth.emailInUse,
    });
    expect(authErrorFromFirebaseCode('auth/popup-closed-by-user').code).toBe('popup-closed');
    expect(authErrorFromFirebaseCode('auth/cancelled-popup-request').code).toBe('popup-closed');
    expect(authErrorFromFirebaseCode('auth/account-exists-with-different-credential').code).toBe(
      'account-exists-different-credential',
    );
  });

  it('falls back to the generic unknown error for unrecognized or missing codes', () => {
    expect(authErrorFromFirebaseCode('auth/some-new-code')).toEqual({
      code: 'unknown',
      message: ERROR_COPY.auth.unknown,
    });
    expect(authErrorFromFirebaseCode(undefined)).toEqual({
      code: 'unknown',
      message: ERROR_COPY.auth.unknown,
    });
  });

  it('returns a message for every mapped code (no empty strings)', () => {
    const codes = [
      'auth/email-already-in-use',
      'auth/operation-not-allowed',
      'auth/too-many-requests',
      'auth/network-request-failed',
      'auth/popup-blocked',
      undefined,
    ];
    for (const c of codes) {
      expect(authErrorFromFirebaseCode(c).message.length).toBeGreaterThan(0);
    }
  });
});
