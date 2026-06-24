import { useParams, Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLessons } from '@/features/flags/useLessons';
import { usePublicProfile } from '@/features/social/usePublicProfile';
import { FollowButton } from '@/features/social/FollowButton';
import { FollowCounts } from '@/features/social/FollowCounts';
import { KudosButton } from '@/features/social/KudosButton';
import type { SocialUser } from '@/features/social/socialService';
import { ProfileBody } from './ProfileBody';

export function PublicProfilePage() {
  const { username = '' } = useParams<{ username: string }>();
  const auth = useAuth();
  // Whole planned course as the denominator (live + locked roadmap stubs),
  // so the public stat reads as the user's share of the entire curriculum
  // rather than just the currently-shipped subset (D91).
  const courseTotal = useLessons().length;
  const state = usePublicProfile(username);

  const me = auth.status === 'authenticated' ? auth.user : null;
  const myProfile = auth.status === 'authenticated' ? auth.profile : null;

  // Viewing your own username? Send to the editable profile instead.
  if (myProfile && myProfile.username === username.toLowerCase()) {
    return <Navigate to="/profile" replace />;
  }

  if (state.status === 'loading') return <PublicProfileSkeleton />;

  if (state.status === 'not-found') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold">Learner not found</h1>
        <p className="text-sm text-muted-foreground">
          No one goes by <span className="font-medium">@{username}</span>.
        </p>
        <Link to="/friends" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Find learners
        </Link>
      </div>
    );
  }

  const pp = state.profile;
  const meUser: SocialUser | null =
    me && myProfile
      ? {
          uid: me.uid,
          username: myProfile.username,
          displayUsername: myProfile.displayUsername,
          avatarUrl: myProfile.avatarUrl,
        }
      : null;
  const target: SocialUser = {
    uid: pp.uid,
    username: pp.username,
    displayUsername: pp.displayUsername,
    avatarUrl: pp.avatarUrl,
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <Link to="/friends" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 -ml-2' })}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
      </Link>

      <ProfileBody
        displayUsername={pp.displayUsername}
        bio={pp.bio}
        emptyBioText="No bio yet."
        xp={pp.xp}
        lessonsCompleted={pp.lessonsCompleted}
        stepsCompleted={pp.stepsCompleted ?? 0}
        currentStreak={pp.currentStreak}
        bestStreak={pp.bestStreak}
        courseCompleted={Math.min(pp.lessonsCompleted, courseTotal)}
        courseTotal={courseTotal}
        activityDates={pp.activityDates}
        milestonesReached={pp.milestonesReached}
        achievements={pp.achievements}
        avatarStyleId={pp.avatarStyle}
        flairId={pp.profileFlair}
        actions={
          meUser ? (
            <div className="flex items-center gap-2">
              <FollowButton me={meUser} myAchievements={myProfile?.achievements} target={target} />
              <KudosButton me={meUser} myAchievements={myProfile?.achievements} targetUid={pp.uid} />
            </div>
          ) : null
        }
        counts={<FollowCounts uid={pp.uid} />}
      />
    </div>
  );
}

function PublicProfileSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-8 w-40 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
