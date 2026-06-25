import { describe, it, expect } from 'vitest';
import { authErrorFromFirebase } from '@/lib/errors';
import { takeAuthRedirectError, setAuthRedirectError } from '@/features/auth/authRedirect';

describe('authErrorFromFirebase', () => {
  it('maps missing initial state to redirectStateLost copy', () => {
    const err = authErrorFromFirebase(
      new Error('Unable to process request because this application is missing the initial state.'),
    );
    expect(err.message).toMatch(/Safari or Chrome/i);
  });
});

describe('auth redirect error buffer', () => {
  it('takeAuthRedirectError clears after read', () => {
    setAuthRedirectError('Test message');
    expect(takeAuthRedirectError()).toBe('Test message');
    expect(takeAuthRedirectError()).toBeNull();
  });
});
