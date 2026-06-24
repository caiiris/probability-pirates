/**
 * Profile flair catalog — cosmetic title badges shown under a learner's name,
 * bought with coins. Pure data + lookup; no Firebase, no React.
 *
 * `none` is free and owned by everyone (no badge). Paid flair is a titled,
 * gradient pill with a small icon. `icon` is a key resolved to a lucide icon in
 * `FlairBadge` so this module stays React-free.
 */

export type FlairIconKey =
  | 'compass'
  | 'map'
  | 'storm'
  | 'gem'
  | 'anchor'
  | 'crown';

export type ProfileFlair = {
  id: string;
  /** Store name + badge label. */
  name: string;
  price: number;
  icon: FlairIconKey;
  /** CSS gradient for the badge pill. `null` for the free "no flair" option. */
  background: string | null;
  /** Adds a soft glow ring for premium flair. */
  glow?: boolean;
};

export const DEFAULT_FLAIR = 'none';

export const PROFILE_FLAIR: ProfileFlair[] = [
  { id: 'none', name: 'No flair', price: 0, icon: 'compass', background: null },
  {
    id: 'navigator',
    name: 'Navigator',
    price: 150,
    icon: 'compass',
    background: 'linear-gradient(135deg, #4DA3FF 0%, #2E8FFF 45%, #14B8A6 100%)',
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    price: 150,
    icon: 'map',
    background: 'linear-gradient(135deg, #FBCB6B 0%, #F59E0B 50%, #22C55E 100%)',
  },
  {
    id: 'storm-rider',
    name: 'Storm Rider',
    price: 200,
    icon: 'storm',
    background: 'linear-gradient(135deg, #8A6BFF 0%, #6B4EFF 50%, #2E8FFF 100%)',
  },
  {
    id: 'treasure-hunter',
    name: 'Treasure Hunter',
    price: 200,
    icon: 'gem',
    background: 'linear-gradient(135deg, #FFD98A 0%, #F59E0B 45%, #FB5E58 100%)',
  },
  {
    id: 'first-mate',
    name: 'First Mate',
    price: 250,
    icon: 'anchor',
    background: 'linear-gradient(135deg, #2FD9C4 0%, #14B8A6 45%, #6B4EFF 100%)',
  },
  {
    id: 'legend',
    name: 'Legend',
    price: 400,
    icon: 'crown',
    background: 'linear-gradient(135deg, #FFF1C2 0%, #FCD988 35%, #E89A2B 70%, #B45309 100%)',
    glow: true,
  },
];

const BY_ID = new Map(PROFILE_FLAIR.map((f) => [f.id, f]));

/** Look up flair by id, falling back to the free "no flair" option. */
export function getFlair(id: string | null | undefined): ProfileFlair {
  return (id && BY_ID.get(id)) || BY_ID.get(DEFAULT_FLAIR)!;
}

/** True if `id` is a real, known flair. */
export function isFlair(id: string | null | undefined): boolean {
  return !!id && BY_ID.has(id);
}
