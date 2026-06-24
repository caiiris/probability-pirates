import { Compass, Map, CloudLightning, Gem, Anchor, Crown } from 'lucide-react';
import { getFlair, type FlairIconKey } from './profileFlair';

const ICONS: Record<FlairIconKey, typeof Compass> = {
  compass: Compass,
  map: Map,
  storm: CloudLightning,
  gem: Gem,
  anchor: Anchor,
  crown: Crown,
};

type Props = {
  flairId: string | null | undefined;
  className?: string;
};

/**
 * A learner's equipped flair, rendered as a gradient title pill with an icon.
 * Renders nothing for the free "no flair" option so profiles without flair stay
 * clean. White text + soft shadow keeps it legible on any gradient.
 */
export function FlairBadge({ flairId, className = '' }: Props) {
  const flair = getFlair(flairId);
  if (!flair.background) return null;

  const Icon = ICONS[flair.icon];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${className}`}
      style={{
        background: flair.background,
        // soft inner highlight for depth + optional outer glow for premium flair
        boxShadow: flair.glow
          ? '0 0 0 1px rgba(255,255,255,0.35) inset, 0 4px 14px -2px rgba(184,83,9,0.55)'
          : '0 0 0 1px rgba(255,255,255,0.3) inset',
      }}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
      <span style={{ textShadow: '0 1px 1px rgba(0,0,0,0.18)' }}>{flair.name}</span>
    </span>
  );
}
