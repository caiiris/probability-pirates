import type { AccentName } from '@/lib/theme';
import { ACCENT_ORDER } from '@/lib/theme';
import type { GlyphName } from './LessonGlyph';

/**
 * Presentation-only visuals for the course path. Kept here (not on the `Lesson`
 * content model) because it's pure chrome and the content model is remote-config
 * driven. Each lesson gets an accent hue + a node glyph.
 *
 * ADD A LESSON: add an entry keyed by its id. If you forget, `getLessonVisual`
 * falls back to a deterministic accent (by index) and a sensible default glyph,
 * so the path never breaks.
 */
type LessonVisual = { accent: AccentName; glyph: GlyphName };

const VISUALS: Record<string, LessonVisual> = {
  'what-is-probability': { accent: 'violet', glyph: 'die' },
  // The course opener is dice-themed; long-run-frequency lives next to it on
  // the path, so we hand it the cards glyph (instead of falling through to the
  // default coin) to avoid two heads/tails-y lesson nodes back-to-back.
  'long-run-frequency': { accent: 'blue', glyph: 'cards' },
  'law-of-large-numbers': { accent: 'blue', glyph: 'coin' },
  'counting-carefully': { accent: 'green', glyph: 'tree' },
  'counting-gets-hard': { accent: 'teal', glyph: 'cards' },
  'conditional-probability': { accent: 'amber', glyph: 'door' },
  distributions: { accent: 'coral', glyph: 'bars' },
};

const FALLBACK_GLYPHS: GlyphName[] = ['die', 'coin', 'tree', 'cards', 'door', 'bars'];

export function getLessonVisual(lessonId: string, index: number): LessonVisual {
  return (
    VISUALS[lessonId] ?? {
      accent: ACCENT_ORDER[index % ACCENT_ORDER.length],
      glyph: FALLBACK_GLYPHS[index % FALLBACK_GLYPHS.length],
    }
  );
}
