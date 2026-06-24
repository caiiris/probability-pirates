import { describe, it, expect } from 'vitest';
import { checkAnswer } from './checkAnswer';
import type { Variant } from '@/content/types';

// ---------------------------------------------------------------------------
// tap-outcomes
// ---------------------------------------------------------------------------
const tapOutcomes: Variant = {
  id: 'test',
  interactionKind: 'tap-outcomes',
  prompt: '',
  source: 'd6',
  expectedOutcomes: ['1', '2', '3', '4', '5', '6'],
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: tap-outcomes', () => {
  it('correct when all expected collected', () => {
    const r = checkAnswer(tapOutcomes, { collected: ['1', '2', '3', '4', '5', '6'] });
    expect(r.wasCorrect).toBe(true);
  });
  it('wrong for duplicate', () => {
    const r = checkAnswer(tapOutcomes, { collected: ['1', '1'] });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('duplicate');
  });
  it('wrong for unexpected value', () => {
    const r = checkAnswer(tapOutcomes, { collected: ['7'] });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('7');
  });
  it('wrong for incomplete set', () => {
    const r = checkAnswer(tapOutcomes, { collected: ['1', '2'] });
    expect(r.wasCorrect).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fill-fraction
// ---------------------------------------------------------------------------
const fillFraction: Variant = {
  id: 'test',
  interactionKind: 'fill-fraction',
  prompt: '',
  numerator: 1,
  denominator: 2,
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: fill-fraction', () => {
  it('correct for exact answer', () => {
    expect(checkAnswer(fillFraction, { numerator: 1, denominator: 2 }).wasCorrect).toBe(true);
  });
  it('correct for equivalent reduced form (3/6 == 1/2)', () => {
    expect(checkAnswer(fillFraction, { numerator: 3, denominator: 6 }).wasCorrect).toBe(true);
  });
  it('wrong for incorrect answer', () => {
    const r = checkAnswer(fillFraction, { numerator: 1, denominator: 6 });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('1/6');
  });
  it('wrong for zero denominator', () => {
    const r = checkAnswer(fillFraction, { numerator: 1, denominator: 0 });
    expect(r.wasCorrect).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tap-event
// ---------------------------------------------------------------------------
const tapEvent: Variant = {
  id: 'test',
  interactionKind: 'tap-event',
  prompt: '',
  sampleSpace: ['1', '2', '3', '4', '5', '6'],
  correctOutcomes: ['2', '4', '6'],
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: tap-event', () => {
  it('correct for exact event', () => {
    expect(checkAnswer(tapEvent, { selected: ['2', '4', '6'] }).wasCorrect).toBe(true);
  });
  it('correct regardless of order', () => {
    expect(checkAnswer(tapEvent, { selected: ['6', '2', '4'] }).wasCorrect).toBe(true);
  });
  it('wrong for extra selection', () => {
    const r = checkAnswer(tapEvent, { selected: ['2', '4', '6', '1'] });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('1');
  });
  it('wrong for incomplete selection', () => {
    expect(checkAnswer(tapEvent, { selected: ['2', '4'] }).wasCorrect).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// grid-event
// ---------------------------------------------------------------------------
const gridEvent: Variant = {
  id: 'test',
  interactionKind: 'grid-event',
  prompt: '',
  rows: 6,
  cols: 6,
  correctCells: [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]],
  liveCounterTemplate: '{count} / 36',
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: grid-event', () => {
  it('correct for exact cells', () => {
    const cells: Array<[number, number]> = [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]];
    expect(checkAnswer(gridEvent, { selectedCells: cells }).wasCorrect).toBe(true);
  });
  it('wrong for extra cell', () => {
    const cells: Array<[number, number]> = [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1], [1, 1]];
    const r = checkAnswer(gridEvent, { selectedCells: cells });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('1,1');
  });
  it('wrong for missing cell', () => {
    const cells: Array<[number, number]> = [[1, 6], [2, 5]];
    expect(checkAnswer(gridEvent, { selectedCells: cells }).wasCorrect).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// multiple-choice
// ---------------------------------------------------------------------------
const multipleChoice: Variant = {
  id: 'test',
  interactionKind: 'multiple-choice',
  prompt: '',
  options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
  correctOptionId: 'a',
  feedbackByOption: { b: 'Wrong' },
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: multiple-choice', () => {
  it('correct for right option', () => {
    expect(checkAnswer(multipleChoice, { optionId: 'a' }).wasCorrect).toBe(true);
  });
  it('wrong for wrong option with key', () => {
    const r = checkAnswer(multipleChoice, { optionId: 'b' });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('b');
  });
});

// ---------------------------------------------------------------------------
// simulate-proportion — correct once minTrials reached
// ---------------------------------------------------------------------------
const simulate: Variant = {
  id: 'test',
  interactionKind: 'simulate-proportion',
  prompt: '',
  scenario: 'coin',
  targetProbability: 0.5,
  targetLabel: 'True P(heads) = 50%',
  minTrials: 200,
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: simulate-proportion', () => {
  it('correct once minTrials reached', () => {
    expect(checkAnswer(simulate, { trials: 200 }).wasCorrect).toBe(true);
    expect(checkAnswer(simulate, { trials: 999 }).wasCorrect).toBe(true);
  });
  it('wrong (incomplete) below minTrials', () => {
    const r = checkAnswer(simulate, { trials: 12 });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('incomplete');
  });
});

// ---------------------------------------------------------------------------
// monty-hall — correct once minGames reached
// ---------------------------------------------------------------------------
const monty: Variant = {
  id: 'test',
  interactionKind: 'monty-hall',
  prompt: '',
  minGames: 100,
  feedbackCorrect: '',
  feedbackDefault: '',
};

describe('checkAnswer: monty-hall', () => {
  it('correct once minGames reached', () => {
    expect(checkAnswer(monty, { games: 100 }).wasCorrect).toBe(true);
  });
  it('wrong (incomplete) below minGames', () => {
    const r = checkAnswer(monty, { games: 3 });
    expect(r.wasCorrect).toBe(false);
    if (!r.wasCorrect) expect(r.matchedWrongKey).toBe('incomplete');
  });
});
