import { Link } from 'react-router-dom';
import { DefaultAvatar } from '@/features/profile/DefaultAvatar';
import type { SocialUser } from './socialService';

type Props = {
  user: SocialUser;
  /** Optional trailing element (e.g. XP, a follow button). */
  trailing?: React.ReactNode;
  onNavigate?: () => void;
};

/** A tappable user row linking to their public profile. */
export function UserListItem({ user, trailing, onNavigate }: Props) {
  return (
    <Link
      to={`/u/${user.username}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-muted transition-colors"
    >
      <DefaultAvatar username={user.displayUsername} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{user.displayUsername}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
      </div>
      {trailing}
    </Link>
  );
}
