/**
 * Pascal accent ramp — JS mirror of the Layer 1 primitives in `src/index.css`.
 *
 * SVG illustrations, the confetti burst, and charts can't read Tailwind classes,
 * so they read these values. This file is the single source of truth for JS;
 * `index.css` is the source of truth for CSS. Keep the two in sync.
 *
 * ADD A NEW ACCENT: add the trio to `index.css` (Layers 1 + 3), then add the
 * matching `{ soft, base, deep }` entry to `ACCENTS` below. Nothing else needs
 * to change — `AccentName` and `ACCENT_BASES` update automatically.
 */

export type AccentStop = {
  /** Tinted surface (backgrounds, fills behind an icon). */
  soft: string;
  /** The solid, saturated color (icon body, dot, bar). */
  base: string;
  /** Darker shade for text on tint, strokes, and pressed depth. */
  deep: string;
};

export const ACCENTS = {
  violet: { soft: '#EEE9FF', base: '#6B4EFF', deep: '#3A2A8C' },
  blue: { soft: '#E4F0FF', base: '#2E8FFF', deep: '#1B4F99' },
  teal: { soft: '#DEF6F1', base: '#14B8A6', deep: '#0B6B61' },
  green: { soft: '#E3F7EA', base: '#22C55E', deep: '#15803D' },
  amber: { soft: '#FEF1DA', base: '#F59E0B', deep: '#B45309' },
  coral: { soft: '#FFE7E6', base: '#FB5E58', deep: '#B42318' },
} as const satisfies Record<string, AccentStop>;

export type AccentName = keyof typeof ACCENTS;

/** Stable ordering for cycling through accents (e.g. lesson nodes, confetti). */
export const ACCENT_ORDER: AccentName[] = ['violet', 'blue', 'teal', 'green', 'amber', 'coral'];

/** The saturated base of every accent, in order — handy for multi-color bursts. */
export const ACCENT_BASES: string[] = ACCENT_ORDER.map((name) => ACCENTS[name].base);

/** Pick a deterministic accent for an index (wraps). Use for ordered content. */
export function accentForIndex(index: number): AccentStop {
  const name =
    ACCENT_ORDER[((index % ACCENT_ORDER.length) + ACCENT_ORDER.length) % ACCENT_ORDER.length];
  return ACCENTS[name];
}

/** Neutral / ink tokens that JS occasionally needs (shadows, SVG strokes). */
export const NEUTRALS = {
  paper: '#FAFAFC',
  surface: '#FFFFFF',
  ink: '#211C30',
  inkSoft: '#6B6577',
  line: '#ECEAF1',
} as const;
