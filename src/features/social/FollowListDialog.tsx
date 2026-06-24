import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getFollowers, getFollowing, type SocialUser } from './socialService';
import { UserListItem } from './UserListItem';

type Props = {
  uid: string;
  mode: 'followers' | 'following';
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FollowListDialog({ uid, mode, open, onOpenChange }: Props) {
  const [users, setUsers] = useState<SocialUser[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsers(null);
    const load = mode === 'followers' ? getFollowers : getFollowing;
    let active = true;
    load(uid).then((list) => {
      if (active) setUsers(list);
    });
    return () => {
      active = false;
    };
  }, [open, uid, mode]);

  const emptyText = mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="capitalize">{mode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {users === null ? (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
          ) : (
            users.map((u) => (
              <UserListItem key={u.uid} user={u} onNavigate={() => onOpenChange(false)} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
