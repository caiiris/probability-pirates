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

export function DefaultAvatar({ username, size = 96, className, styleId }: Props) {
  const hashColor = PALETTE[fnv1a32(username) % PALETTE.length];
  const initial = username.charAt(0).toUpperCase();

  const style = getAvatarStyle(styleId);
  const background = style.background ?? hashColor;
  const ring = style.ring ? `0 0 0 ${Math.max(2, size * 0.04)}px ${style.ring}` : undefined;

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className ?? ''}`}
      style={{ width: size, height: size, background, boxShadow: ring }}
      aria-label={`Avatar for ${username}`}
      role="img"
    >
      <span style={{ fontSize: size * 0.4, color: '#fff', fontWeight: 600, lineHeight: 1 }}>
        {initial}
      </span>
    </div>
  );
}
