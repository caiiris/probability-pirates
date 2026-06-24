/**
 * Course-path node glyphs. One simple geometric mark per lesson concept, drawn
 * in `currentColor` so the LessonNode decides the color (white on an accent
 * disc, muted when locked). These are chrome marks, distinct from the richer
 * in-lesson illustrations in `src/components/illustrations/`.
 */
import type { ReactNode } from 'react';

export type GlyphName = 'die' | 'coin' | 'cards' | 'door' | 'bars' | 'curve' | 'tree';

export function LessonGlyph({ glyph, className }: { glyph: GlyphName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {GLYPHS[glyph]}
    </svg>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

const GLYPHS: Record<GlyphName, ReactNode> = {
  // a single die showing five pips
  die: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" {...stroke} />
      <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" />
    </>
  ),
  // a coin, mid-flip
  coin: (
    <>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <circle cx="12" cy="12" r="4.5" {...stroke} />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  // two overlapping cards (counting / combinations)
  cards: (
    <>
      <rect
        x="9.5"
        y="5"
        width="10"
        height="13.5"
        rx="2.2"
        {...stroke}
        transform="rotate(11 14.5 12)"
      />
      <rect
        x="5"
        y="6.5"
        width="10"
        height="13.5"
        rx="2.2"
        {...stroke}
        transform="rotate(-6 10 13)"
      />
    </>
  ),
  // a door (conditional probability / Monty Hall)
  door: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="2" {...stroke} />
      <path d="M9.5 7.5h5M9.5 11h5" {...stroke} />
      <circle cx="15" cy="14.5" r="1.1" fill="currentColor" />
    </>
  ),
  // bar chart (distributions)
  bars: (
    <>
      <rect x="4.5" y="13" width="3.4" height="6.5" rx="1.2" fill="currentColor" />
      <rect x="10.3" y="8.5" width="3.4" height="11" rx="1.2" fill="currentColor" />
      <rect x="16.1" y="5" width="3.4" height="14.5" rx="1.2" fill="currentColor" />
    </>
  ),
  // a bell curve (central limit theorem)
  curve: (
    <>
      <path d="M3 18c3 0 3.5-9 9-9s6 9 9 9" {...stroke} />
      <path d="M3 19.5h18" {...stroke} strokeWidth={1.6} />
    </>
  ),
  // a counting tree: root branches into two then into four leaves
  // (multiplication principle / combinatorics)
  tree: (
    <>
      <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
      <path d="M12 6L7.5 11M12 6l4.5 5" {...stroke} />
      <circle cx="7.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="16.5" cy="12" r="1.3" fill="currentColor" />
      <path d="M7.5 13.3L5 18M7.5 13.3l2.5 4.7M16.5 13.3L14 18M16.5 13.3l2.5 4.7" {...stroke} />
      <circle cx="5" cy="19" r="1.1" fill="currentColor" />
      <circle cx="10" cy="19" r="1.1" fill="currentColor" />
      <circle cx="14" cy="19" r="1.1" fill="currentColor" />
      <circle cx="19" cy="19" r="1.1" fill="currentColor" />
    </>
  ),
};
