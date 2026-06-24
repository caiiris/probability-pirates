/**
 * Avatar style catalog — cosmetic-only identity items bought with coins.
 *
 * `classic` is free and owned by everyone (the original username-hash color).
 * Paid styles swap the avatar background for a gradient and may add a ring.
 * Pure data + lookup; no Firebase, no React.
 */

export type AvatarStyle = {
  id: string;
  name: string;
  /** Coin price; 0 for the free default. */
  price: number;
  /**
   * CSS background for the avatar. `null` means "use the per-username hash
   * color" (the classic look). Gradients are fine.
   */
  background: string | null;
  /** Optional ring/frame color drawn around the avatar. */
  ring?: string;
};

export const DEFAULT_AVATAR_STYLE = 'classic';

export const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'classic', name: 'Classic', price: 0, background: null },
  {
    id: 'ocean',
    name: 'Ocean',
    price: 150,
    background: 'linear-gradient(135deg, #2E8FFF, #14B8A6)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    price: 150,
    background: 'linear-gradient(135deg, #F59E0B, #FB5E58)',
  },
  {
    id: 'orchid',
    name: 'Orchid',
    price: 150,
    background: 'linear-gradient(135deg, #6B4EFF, #FB5E58)',
  },
  {
    id: 'forest',
    name: 'Forest',
    price: 150,
    background: 'linear-gradient(135deg, #22C55E, #14B8A6)',
  },
  {
    id: 'gold',
    name: 'Captain\u2019s Gold',
    price: 300,
    background: 'linear-gradient(135deg, #FCD988, #E89A2B)',
    ring: '#B45309',
  },
];

const BY_ID = new Map(AVATAR_STYLES.map((s) => [s.id, s]));

/** Look up a style by id, falling back to the free classic style. */
export function getAvatarStyle(id: string | null | undefined): AvatarStyle {
  return (id && BY_ID.get(id)) || BY_ID.get(DEFAULT_AVATAR_STYLE)!;
}

/** True if `id` is a real, known style. */
export function isAvatarStyle(id: string | null | undefined): boolean {
  return !!id && BY_ID.has(id);
}
