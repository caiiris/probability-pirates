import { fnv1a32 } from '@/lib/hash';
import { ACCENT_BASES } from '@/lib/theme';
import { getAvatarStyle } from '@/features/economy/avatarStyles';

// Avatar background draws from the brand accent ramp so identities stay on-palette.
const PALETTE = ACCENT_BASES;

type Props = {
  username: string;
  size?: number;
  className?: string;
  /** Equipped avatar style id; defaults to the classic username-hash color. */
  styleId?: string;
};

/**
 * The "polish" layer: an upper-left highlight + lower-right soft shadow drawn
 * as radial gradients in PERCENTAGES, so it scales with any avatar size.
 * Stacked above the user's chosen background (flat color or gradient), this
 * turns the flat disc into a satisfying pebble/coin-like orb without changing
 * its hue.
 */
const POLISH_OVERLAY =
  'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.32), transparent 50%),' +
  ' radial-gradient(circle at 70% 88%, rgba(0,0,0,0.18), transparent 55%)';

export function DefaultAvatar({ username, size = 96, className, styleId }: Props) {
  const hashColor = PALETTE[fnv1a32(username) % PALETTE.length];
  const initial = username.charAt(0).toUpperCase();

  const style = getAvatarStyle(styleId);
  const background = style.background ?? hashColor;

  // Compose three things into a single box-shadow:
  //   1. (optional) outer ring for paid styles like "Captain's Gold"
  //   2. an inset 1px white rim, so the disc reads as a polished bevel
  //   3. a soft inset bottom shadow, deepening the lower curve
  const shadows: string[] = [];
  if (style.ring) shadows.push(`0 0 0 ${Math.max(2, size * 0.04)}px ${style.ring}`);
  shadows.push('inset 0 0 0 1px rgba(255,255,255,0.22)');
  shadows.push(`inset 0 -${Math.max(2, size * 0.05)}px ${Math.max(4, size * 0.12)}px rgba(0,0,0,0.10)`);

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        // Layered: polish overlay on top, user color underneath.
        background: `${POLISH_OVERLAY}, ${background}`,
        boxShadow: shadows.join(', '),
      }}
      aria-label={`Avatar for ${username}`}
      role="img"
    >
      <span
        className="font-display"
        style={{
          fontSize: size * 0.46,
          color: '#fff',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          // Soft drop on the letter so it reads as carved into the disc, not
          // pasted on. Scaled with size so it's never a heavy bevel at 32px.
          textShadow: `0 ${Math.max(1, size * 0.02)}px ${Math.max(2, size * 0.04)}px rgba(0,0,0,0.18)`,
        }}
      >
        {initial}
      </span>
    </div>
  );
}
