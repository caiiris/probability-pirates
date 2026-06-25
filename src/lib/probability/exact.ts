/**
 * Exact arithmetic oracle for the probability practice engine.
 *
 * Implements contracts C1 (Fraction + combinatorics) and C2 (ExactAnswer)
 * from docs/specs/wp/wp-contracts.md.
 *
 * Pure TypeScript — no React, no Firebase, no external dependencies.
 * Uses bigint for lossless rational arithmetic.
 */

// ---------------------------------------------------------------------------
// C1 — Fraction type + arithmetic
// ---------------------------------------------------------------------------

/** Exact rational. Always stored reduced; `den > 0`. */
export type Fraction = { num: bigint; den: bigint };

/** Greatest common divisor over non-negative bigints (Euclidean). */
function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a === 0n ? 1n : a;
}

/** Reduce to lowest terms; normalize sign so `den > 0`. */
export function reduce(f: Fraction): Fraction {
  if (f.den === 0n) throw new RangeError('Fraction denominator must not be zero');
  const g = gcd(f.num < 0n ? -f.num : f.num, f.den < 0n ? -f.den : f.den);
  let num = f.num / g;
  let den = f.den / g;
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  return { num, den };
}

/**
 * Construct a reduced fraction. Throws if `den === 0`.
 * Normalizes sign to numerator (den always > 0 after reduction).
 * If `den` is omitted it defaults to 1 (whole number).
 */
export function frac(num: bigint | number, den?: bigint | number): Fraction {
  const n = BigInt(num);
  const d = den === undefined ? 1n : BigInt(den);
  if (d === 0n) throw new RangeError('Fraction denominator must not be zero');
  return reduce({ num: n, den: d });
}

export function addF(a: Fraction, b: Fraction): Fraction {
  return reduce({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
}

export function subF(a: Fraction, b: Fraction): Fraction {
  return reduce({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
}

export function mulF(a: Fraction, b: Fraction): Fraction {
  return reduce({ num: a.num * b.num, den: a.den * b.den });
}

export function divF(a: Fraction, b: Fraction): Fraction {
  if (b.num === 0n) throw new RangeError('Division by zero fraction');
  // a/b_num * b_den — divide by flipping b
  return reduce({ num: a.num * b.den, den: a.den * b.num });
}

/** Structural equality after reduction (e.g. 3/6 === 1/2). */
export function eqF(a: Fraction, b: Fraction): boolean {
  const ra = reduce(a);
  const rb = reduce(b);
  return ra.num === rb.num && ra.den === rb.den;
}

/** For tolerance comparisons against Monte-Carlo estimates. */
export function toNumber(f: Fraction): number {
  return Number(f.num) / Number(f.den);
}

// ---------------------------------------------------------------------------
// C1 — Combinatorics over bigint
// ---------------------------------------------------------------------------

/** n! as bigint. Throws RangeError for negative n. */
export function factorial(n: number): bigint {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`factorial requires a non-negative integer, got ${n}`);
  }
  let result = 1n;
  for (let i = 2; i <= n; i++) {
    result *= BigInt(i);
  }
  return result;
}

/** P(n, r) = n! / (n-r)!  Throws RangeError if r > n or either is negative. */
export function nPr(n: number, r: number): bigint {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || n < r) {
    throw new RangeError(`nPr requires 0 <= r <= n, got n=${n}, r=${r}`);
  }
  // Compute directly to avoid computing full n! when n is large
  let result = 1n;
  for (let i = n; i > n - r; i--) {
    result *= BigInt(i);
  }
  return result;
}

/** C(n, r) = n! / (r! * (n-r)!)  Throws RangeError if r > n or either is negative. */
export function nCr(n: number, r: number): bigint {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || n < r) {
    throw new RangeError(`nCr requires 0 <= r <= n, got n=${n}, r=${r}`);
  }
  // Use the smaller of r and n-r for efficiency
  const k = r < n - r ? r : n - r;
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = (result * BigInt(n - i)) / BigInt(i + 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// C2 — ExactAnswer
// ---------------------------------------------------------------------------

export type ExactAnswer =
  | { kind: 'int'; value: number }
  | { kind: 'fraction'; value: Fraction } // always reduced
  | { kind: 'choice'; optionId: string };
