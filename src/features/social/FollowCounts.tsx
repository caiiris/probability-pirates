import { useEffect, useState } from 'react';
import { getFollowCounts } from './socialService';
import { FollowListDialog } from './FollowListDialog';

type Props = {
  uid: string;
  /** Bump to force a refetch (e.g. after a follow/unfollow elsewhere). */
  refreshKey?: number;
};

/** Tappable "N followers · M following" row that opens the relevant list. */
export function FollowCounts({ uid, refreshKey = 0 }: Props) {
  const [counts, setCounts] = useState<{ followers: number; following: number } | null>(null);
  const [dialog, setDialog] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    let active = true;
    getFollowCounts(uid).then((c) => {
      if (active) setCounts(c);
    });
    return () => {
      active = false;
    };
  }, [uid, refreshKey]);

  const followers = counts?.followers ?? 0;
  const following = counts?.following ?? 0;

  return (
    <>
      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={() => setDialog('followers')}
          className="hover:text-foreground text-muted-foreground transition-colors"
        >
          <span className="font-semibold text-foreground tabular-nums">{followers}</span>{' '}
          {followers === 1 ? 'follower' : 'followers'}
        </button>
        <button
          type="button"
          onClick={() => setDialog('following')}
          className="hover:text-foreground text-muted-foreground transition-colors"
        >
          <span className="font-semibold text-foreground tabular-nums">{following}</span> following
        </button>
      </div>

      <FollowListDialog
        uid={uid}
        mode={dialog ?? 'followers'}
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
      />
    </>
  );
}
