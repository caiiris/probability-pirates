import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOutUser } from '@/features/auth/userService';
import { useAllLessonProgress } from '@/features/progress/useAllLessonProgress';
import { courseProgress } from '@/features/course/recommendations';
import { useLessons } from '@/features/flags/useLessons';
import { FollowCounts } from '@/features/social/FollowCounts';
import { CoinChip } from '@/features/economy/CoinChip';
import { ProfileBody } from './ProfileBody';
import { EditProfileDialog } from './EditProfileDialog';

export function ProfilePage() {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : '';
  const profile = auth.status === 'authenticated' ? auth.profile : null;
  const progressState = useAllLessonProgress(uid);
  const lessons = useLessons();

  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (auth.status === 'loading' || !profile || progressState.status === 'loading') {
    return <ProfileSkeleton />;
  }

  const progressMap = progressState.status === 'ready' ? progressState.data : new Map();
  const { completed: courseCompleted, total: courseTotal } = courseProgress(lessons, progressMap);

  async function handleLogout() {
    await signOutUser();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <ProfileBody
        displayUsername={profile.displayUsername}
        bio={profile.bio}
        emptyBioText="Tap Edit to add a bio."
        xp={profile.xp}
        lessonsCompleted={profile.lessonsCompleted}
        stepsCompleted={profile.stepsCompleted}
        currentStreak={profile.currentStreak}
        bestStreak={profile.bestStreak}
        courseCompleted={courseCompleted}
        courseTotal={courseTotal}
        activityDates={profile.activityDates}
        milestonesReached={profile.milestonesReached}
        achievements={profile.achievements}
        avatarStyleId={profile.avatarStyle}
        flairId={profile.profileFlair}
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit profile
          </Button>
        }
        counts={<FollowCounts uid={uid} />}
      />

      {/* Wallet */}
      <Link
        to="/store"
        className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft hover:bg-muted/50 transition-colors"
        aria-label={`Wallet: ${profile.coins ?? 0} coins. Open store.`}
      >
        <CoinChip coins={profile.coins ?? 0} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Wallet</p>
          <p className="text-xs text-muted-foreground">Earn coins from chests and achievements</p>
        </div>
        <span className="text-sm font-medium text-primary flex items-center gap-0.5 shrink-0">
          Store <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </Link>

      <Separator />

      {/* Log out */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => setLogoutOpen(true)}
      >
        Log out
      </Button>

      {/* Edit profile dialog */}
      <EditProfileDialog
        uid={uid}
        currentUsername={profile.username}
        currentDisplayUsername={profile.displayUsername}
        currentBio={profile.bio}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Log out confirm dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You can sign back in any time.
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
