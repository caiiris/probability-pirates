import { describe, it, expect } from 'vitest';
import { xpForAttempt, LESSON_COMPLETION_BONUS } from './xp';

describe('xpForAttempt', () => {
  it('awards 10 XP for first-try correct', () => {
    expect(xpForAttempt(1, true)).toBe(10);
  });
  it('awards 5 XP for second-try correct', () => {
    expect(xpForAttempt(2, true)).toBe(5);
  });
  it('awards 2 XP for third-try correct', () => {
    expect(xpForAttempt(3, true)).toBe(2);
  });
  it('awards 2 XP for fifth-try correct', () => {
    expect(xpForAttempt(5, true)).toBe(2);
  });
  it('awards 0 XP for wrong answers', () => {
    expect(xpForAttempt(1, false)).toBe(0);
    expect(xpForAttempt(2, false)).toBe(0);
    expect(xpForAttempt(3, false)).toBe(0);
  });
  it('LESSON_COMPLETION_BONUS is 50', () => {
    expect(LESSON_COMPLETION_BONUS).toBe(50);
  });
});
