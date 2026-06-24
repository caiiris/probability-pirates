import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { ERROR_COPY } from '@/lib/errors';
import { ACHIEVEMENT_BY_ID } from '@/lib/achievements';
import { follow, unfollow, isFollowing, type SocialUser } from './socialService';

type Props = {
  me: SocialUser;
  myAchievements: string[] | undefined;
  target: SocialUser;
  /** Called after a successful follow/unfollow so callers can refresh counts. */
  onChange?: (nowFollowing: boolean) => void;
};

export function FollowButton({ me, myAchievements, target, onChange }: Props) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    isFollowing(me.uid, target.uid).then((f) => {
      if (active) setFollowing(f);
    });
    return () => {
      active = false;
    };
  }, [me.uid, target.uid]);

  async function handleClick() {
    if (pending || following === null) return;
    setPending(true);
    if (following) {
      const res = await unfollow(me.uid, target.uid);
      setPending(false);
      if (res.ok) {
        setFollowing(false);
        track('unfollow_user', { target_uid: target.uid });
        onChange?.(false);
      } else {
        toast(ERROR_COPY.social.unfollow);
      }
    } else {
      const res = await follow(me, target, myAchievements);
      setPending(false);
      if (res.ok) {
        setFollowing(true);
        track('follow_user', { target_uid: target.uid });
        if (res.newAchievement) {
          const def = ACHIEVEMENT_BY_ID[res.newAchievement];
          if (def) toast(`Achievement unlocked: ${def.title}`, { icon: '🏆' });
          track('achievement_earned', { achievement_id: res.newAchievement });
        }
        onChange?.(true);
      } else {
        toast(res.error);
      }
    }
  }

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={pending || following === null}
      className="gap-1.5"
    >
      {following ? (
        <>
          <UserCheck className="w-4 h-4" aria-hidden="true" /> Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Follow
        </>
      )}
    </Button>
  );
}
