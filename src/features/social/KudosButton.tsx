import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { ACHIEVEMENT_BY_ID } from '@/lib/achievements';
import {
  sendKudos,
  removeKudos,
  hasGivenKudos,
  getKudosCount,
  type SocialUser,
} from './socialService';

type Props = {
  me: SocialUser;
  myAchievements: string[] | undefined;
  targetUid: string;
};

/** Cheer a fellow learner. Prosocial encouragement supports relatedness. */
export function KudosButton({ me, myAchievements, targetUid }: Props) {
  const [given, setGiven] = useState<boolean | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([hasGivenKudos(me.uid, targetUid), getKudosCount(targetUid)]).then(
      ([g, c]) => {
        if (!active) return;
        setGiven(g);
        setCount(c);
      },
    );
    return () => {
      active = false;
    };
  }, [me.uid, targetUid]);

  async function handleClick() {
    if (pending || given === null) return;
    setPending(true);
    if (given) {
      const res = await removeKudos(me.uid, targetUid);
      setPending(false);
      if (res.ok) {
        setGiven(false);
        setCount((c) => Math.max(0, (c ?? 1) - 1));
      }
    } else {
      const res = await sendKudos(me, targetUid, myAchievements);
      setPending(false);
      if (res.ok) {
        setGiven(true);
        setCount((c) => (c ?? 0) + 1);
        track('kudos_sent', { target_uid: targetUid });
        if (res.newAchievement) {
          const def = ACHIEVEMENT_BY_ID[res.newAchievement];
          if (def) toast(`Achievement unlocked: ${def.title}`, { icon: '🏆' });
          track('achievement_earned', { achievement_id: res.newAchievement });
        }
      } else {
        toast(res.error);
      }
    }
  }

  return (
    <Button
      variant={given ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={pending || given === null}
      className="gap-1.5"
      aria-pressed={given ?? false}
      aria-label={given ? 'Remove cheer' : 'Cheer this learner'}
    >
      <Heart className={`w-4 h-4 ${given ? 'fill-current' : ''}`} aria-hidden="true" />
      <span className="tabular-nums">{count ?? 0}</span>
    </Button>
  );
}
