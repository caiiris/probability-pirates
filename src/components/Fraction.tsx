import { Fragment, type ReactNode } from 'react';

type Props = {
  numerator: number | string;
  denominator: number | string;
  className?: string;
};

/**
 * Tiny inline fraction. CSS only, no math renderer dependency. Used in
 * worked-example steps inside concept slots so 3/6 reads as the stacked
 * textbook form, not as a slash.
 */
export function Fraction({ numerator, denominator, className = '' }: Props) {
  return (
    <span
      className={`inline-flex flex-col items-center align-middle leading-none num ${className}`}
      role="math"
      aria-label={`${numerator} over ${denominator}`}
    >
      <span className="px-1.5 pb-0.5 text-[0.95em]">{numerator}</span>
      <span className="block w-full border-t border-current" aria-hidden="true" />
      <span className="px-1.5 pt-0.5 text-[0.95em]">{denominator}</span>
    </span>
  );
}

/**
 * Parses `{a/b}` segments in a string into stacked Fraction components and
 * leaves the rest as plain text. No HTML, no markdown — this is the only
 * inline affordance concept-slot body / theorem / example / derivation
 * strings get. Pre-existing limitation: `a` and `b` cannot themselves
 * contain `/`, `{`, or `}`, so `{(3/3)/(6/3)}` is *not* matched (use prose
 * for nested algebra).
 */
export function renderInlineMath(text: string): ReactNode[] {
  type Part = { kind: 'text'; value: string } | { kind: 'frac'; num: string; den: string };
  const parts: Part[] = [];
  const regex = /\{([^/{}]+)\/([^/{}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: 'text', value: text.slice(last, m.index) });
    parts.push({ kind: 'frac', num: m[1].trim(), den: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  return parts.map((p, i) =>
    p.kind === 'text' ? (
      <Fragment key={i}>{p.value}</Fragment>
    ) : (
      <Fraction key={i} numerator={p.num} denominator={p.den} />
    ),
  );
}
