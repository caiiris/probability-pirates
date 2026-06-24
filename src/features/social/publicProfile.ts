/**
 * Public profile projection.
 *
 * `users/{uid}` stays owner-only because it holds PII (email). To let other
 * learners discover, follow, and rank against you, we mirror a PII-free subset
 * into `publicProfiles/{uid}` (public read, owner write). Spark plan has no
 * Cloud Functions, so the mirror is maintained client-side: registration seeds
 * it, gamification writes update it (see habitService), profile edits mirror
 * bio/avatar, and `ensurePublicProfile` backfills/repairs it on load.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/features/auth/AuthProvider';

export type PublicProfile = {
  uid: string;
  /** lowercase, used for prefix search */
  username: string;
  displayUsername: string;
  bio: string;
  avatarUrl: string | null;
  /** Equipped avatar style id (cosmetic, public). */
  avatarStyle: string;
  /** Equipped profile flair id (cosmetic, public). */
  profileFlair: string;
  xp: number;
  lessonsCompleted: number;
  stepsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  milestonesReached: string[];
  achievements: string[];
  activityDates: string[];
  weeklyXp: number;
  weekKey: string | null;
};

/** Fields safe to expose publicly. NEVER includes `email`. */
export function projectPublicFields(profile: UserProfile): Omit<PublicProfile, 'uid'> {
  return {
    username: profile.username,
    displayUsername: profile.displayUsername,
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? null,
    avatarStyle: profile.avatarStyle ?? 'classic',
    profileFlair: profile.profileFlair ?? 'none',
    xp: profile.xp ?? 0,
    lessonsCompleted: profile.lessonsCompleted ?? 0,
    stepsCompleted: profile.stepsCompleted ?? 0,
    currentStreak: profile.currentStreak ?? 0,
    bestStreak: profile.bestStreak ?? 0,
    milestonesReached: profile.milestonesReached ?? [],
    achievements: profile.achievements ?? [],
    activityDates: profile.activityDates ?? [],
    weeklyXp: profile.weeklyXp ?? 0,
    weekKey: profile.weekKey ?? null,
  };
}

/** Public-profile seed written at registration (mirrors the user-doc seed). */
export function publicProfileSeed(params: { username: string; displayUsername: string }) {
  return {
    username: params.username,
    displayUsername: params.displayUsername,
    bio: '',
    avatarUrl: null,
    avatarStyle: 'classic',
    profileFlair: 'none',
    xp: 0,
    lessonsCompleted: 0,
    stepsCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    milestonesReached: [],
    achievements: [],
    activityDates: [],
    weeklyXp: 0,
    weekKey: null,
    createdAt: serverTimestamp(),
  };
}

// Avoid repeating the existence check on every onSnapshot tick this session.
const ensuredThisSession = new Set<string>();

/**
 * Ensure `publicProfiles/{uid}` exists, backfilling it from the private profile
 * for accounts created before this feature shipped. One-shot per session; safe
 * to call repeatedly. Failures are swallowed (best-effort projection).
 */
export async function ensurePublicProfile(uid: string, profile: UserProfile): Promise<void> {
  if (!uid || ensuredThisSession.has(uid)) return;
  ensuredThisSession.add(uid);
  try {
    const ref = doc(db, 'publicProfiles', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        { ...projectPublicFields(profile), createdAt: serverTimestamp() },
        { merge: true },
      );
    }
  } catch (err) {
    // Non-fatal: a missing projection just means reduced social visibility
    // until the next successful write. Don't block the app.
    ensuredThisSession.delete(uid);
    console.warn('[ensurePublicProfile] failed:', err);
  }
}
