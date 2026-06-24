import type { AchievementId } from '@/lib/achievements';
import type { EmblemName } from './Emblem';
import type { Tone } from './Medallion';

/**
 * Presentation-only look for each trophy: a unique emblem + a tone (an accent
 * hue, or a bronze/silver/gold metal for the progressive XP chain so the set
 * reads as a tiered collection). Kept out of the pure `lib/achievements` catalog.
 */
export const ACHIEVEMENT_VISUALS: Record<AchievementId, { emblem: EmblemName; tone: Tone }> = {
  flawless: { emblem: 'gem', tone: 'violet' },
  'bounce-back': { emblem: 'rebound', tone: 'violet' },
  'welcome-back': { emblem: 'sunrise', tone: 'teal' },
  'xp-100': { emblem: 'bolt', tone: 'bronze' },
  'xp-500': { emblem: 'star', tone: 'silver' },
  'xp-1000': { emblem: 'cap', tone: 'gold' },
  'course-cleared': { emblem: 'crown', tone: 'gold' },
  'new-connection': { emblem: 'link', tone: 'coral' },
  cheerleader: { emblem: 'heart', tone: 'coral' },
};

/** Streak milestones share the flame emblem; the rising day count + metal tier
 *  do the differentiating. */
export function streakTone(threshold: number): Tone {
  if (threshold >= 60) return 'gold';
  if (threshold >= 14) return 'silver';
  return 'bronze';
}
