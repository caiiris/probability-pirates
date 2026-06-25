import { describe, it, expect } from 'vitest';
import {
  frac,
  reduce,
  addF,
  subF,
  mulF,
  divF,
  eqF,
  toNumber,
  factorial,
  nPr,
  nCr,
} from './exact';

// ---------------------------------------------------------------------------
// Fraction construction and reduction
// ---------------------------------------------------------------------------

describe('frac / reduce', () => {
  it('frac(3,6) reduces to 1/2', () => {
    const f = frac(3, 6);
    expect(f.num).toBe(1n);
    expect(f.den).toBe(2n);
  });

  it('frac(-1,-2) reduces to 1/2 (double negation)', () => {
    const f = frac(-1, -2);
    expect(f.num).toBe(1n);
    expect(f.den).toBe(2n);
  });

  it('frac(1,-2) reduces to -1/2 (sign moves to numerator)', () => {
    const f = frac(1, -2);
    expect(f.num).toBe(-1n);
    expect(f.den).toBe(2n);
  });

  it('frac(1,0) throws RangeError', () => {
    expect(() => frac(1, 0)).toThrow(RangeError);
  });

  it('frac(0,5) gives 0/1', () => {
    const f = frac(0, 5);
    expect(f.num).toBe(0n);
    expect(f.den).toBe(1n);
  });

  it('frac accepts bigint arguments', () => {
    const f = frac(3n, 6n);
    expect(f.num).toBe(1n);
    expect(f.den).toBe(2n);
  });

  it('frac with omitted den defaults to whole number', () => {
    const f = frac(4);
    expect(f.num).toBe(4n);
    expect(f.den).toBe(1n);
  });

  it('reduce normalizes sign: den always positive', () => {
    const r = reduce({ num: -3n, den: -6n });
    expect(r.num).toBe(1n);
    expect(r.den).toBe(2n);
  });

  it('reduce with den=0 throws', () => {
    expect(() => reduce({ num: 1n, den: 0n })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

describe('addF', () => {
  it('1/2 + 1/3 = 5/6', () => {
    const result = addF(frac(1, 2), frac(1, 3));
    expect(result.num).toBe(5n);
    expect(result.den).toBe(6n);
  });

  it('1/4 + 3/4 = 1', () => {
    const result = addF(frac(1, 4), frac(3, 4));
    expect(result.num).toBe(1n);
    expect(result.den).toBe(1n);
  });
});

describe('subF', () => {
  it('3/4 - 1/4 = 1/2', () => {
    const result = subF(frac(3, 4), frac(1, 4));
    expect(result.num).toBe(1n);
    expect(result.den).toBe(2n);
  });

  it('1/3 - 1/3 = 0', () => {
    const result = subF(frac(1, 3), frac(1, 3));
    expect(result.num).toBe(0n);
    expect(result.den).toBe(1n);
  });
});

describe('mulF', () => {
  it('2/3 * 3/4 = 1/2', () => {
    const result = mulF(frac(2, 3), frac(3, 4));
    expect(result.num).toBe(1n);
    expect(result.den).toBe(2n);
  });

  it('0 * 5/7 = 0', () => {
    const result = mulF(frac(0, 1), frac(5, 7));
    expect(result.num).toBe(0n);
    expect(result.den).toBe(1n);
  });
});

describe('divF', () => {
  it('1/2 ÷ 1/4 = 2', () => {
    const result = divF(frac(1, 2), frac(1, 4));
    expect(result.num).toBe(2n);
    expect(result.den).toBe(1n);
  });

  it('2/3 ÷ 4/9 = 3/2', () => {
    const result = divF(frac(2, 3), frac(4, 9));
    expect(result.num).toBe(3n);
    expect(result.den).toBe(2n);
  });

  it('divF by zero fraction throws RangeError', () => {
    expect(() => divF(frac(1, 2), frac(0, 1))).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// Equality
// ---------------------------------------------------------------------------

describe('eqF', () => {
  it('eqF(3/6, 1/2) is true', () => {
    expect(eqF(frac(3, 6), frac(1, 2))).toBe(true);
  });

  it('eqF(1/2, 1/3) is false', () => {
    expect(eqF(frac(1, 2), frac(1, 3))).toBe(false);
  });

  it('eqF with negative equivalents: -2/-4 === 1/2', () => {
    expect(eqF(frac(-2, -4), frac(1, 2))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toNumber
// ---------------------------------------------------------------------------

describe('toNumber', () => {
  it('toNumber(1/4) === 0.25', () => {
    expect(toNumber(frac(1, 4))).toBe(0.25);
  });

  it('toNumber(1/2) === 0.5', () => {
    expect(toNumber(frac(1, 2))).toBe(0.5);
  });

  it('toNumber(0/1) === 0', () => {
    expect(toNumber(frac(0, 1))).toBe(0);
  });

  it('toNumber(1/1) === 1', () => {
    expect(toNumber(frac(1, 1))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Combinatorics
// ---------------------------------------------------------------------------

describe('factorial', () => {
  it('factorial(0) = 1n', () => {
    expect(factorial(0)).toBe(1n);
  });

  it('factorial(1) = 1n', () => {
    expect(factorial(1)).toBe(1n);
  });

  it('factorial(5) = 120n', () => {
    expect(factorial(5)).toBe(120n);
  });

  it('factorial(10) = 3628800n', () => {
    expect(factorial(10)).toBe(3628800n);
  });

  it('factorial(-1) throws RangeError', () => {
    expect(() => factorial(-1)).toThrow(RangeError);
  });

  it('factorial(1.5) throws RangeError (non-integer)', () => {
    expect(() => factorial(1.5)).toThrow(RangeError);
  });
});

describe('nCr', () => {
  it('nCr(5,2) = 10n', () => {
    expect(nCr(5, 2)).toBe(10n);
  });

  it('nCr(52,5) = 2598960n', () => {
    expect(nCr(52, 5)).toBe(2598960n);
  });

  it('nCr(5,0) = 1n', () => {
    expect(nCr(5, 0)).toBe(1n);
  });

  it('nCr(5,5) = 1n', () => {
    expect(nCr(5, 5)).toBe(1n);
  });

  it('nCr(3,5) throws RangeError (r > n)', () => {
    expect(() => nCr(3, 5)).toThrow(RangeError);
  });

  it('nCr(-1,0) throws RangeError (negative n)', () => {
    expect(() => nCr(-1, 0)).toThrow(RangeError);
  });
});

describe('nPr', () => {
  it('nPr(5,2) = 20n', () => {
    expect(nPr(5, 2)).toBe(20n);
  });

  it('nPr(5,0) = 1n', () => {
    expect(nPr(5, 0)).toBe(1n);
  });

  it('nPr(5,5) = 120n', () => {
    expect(nPr(5, 5)).toBe(120n);
  });

  it('nPr(3,5) throws RangeError (r > n)', () => {
    expect(() => nPr(3, 5)).toThrow(RangeError);
  });

  it('nPr(-1,0) throws RangeError (negative n)', () => {
    expect(() => nPr(-1, 0)).toThrow(RangeError);
  });
});
