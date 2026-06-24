import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { track } from '@/lib/analytics';
import { CompassRose } from '@/components/illustrations/CompassRose';
import { EmptyState } from '@/components/EmptyState';
import { OceanScene } from '@/features/course/OceanScene';
import { searchUsers, type SocialUser } from './socialService';
import { UserListItem } from './UserListItem';
import { FollowCounts } from './FollowCounts';
import { Leaderboard } from './Leaderboard';

export function SocialPage() {
  const auth = useAuth();
  const uid = auth.status === 'authenticated' ? auth.user.uid : '';

  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<SocialUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = queryText.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const found = await searchUsers(q, uid);
      setResults(found);
      setSearching(false);
      track('user_search', { query_length: q.length, result_count: found.length });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [queryText, uid]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
      {/* Map-banner header */}
      <OceanScene calm>
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <CompassRose className="w-16 drop-shadow-sm" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Crew</h1>
          <p className="max-w-xs text-sm text-[color:var(--ink)]/75">
            Find fellow explorers and race the weekly voyage.
          </p>
          {uid && (
            <div className="mt-1">
              <FollowCounts uid={uid} />
            </div>
          )}
        </div>
      </OceanScene>

      {/* Search */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Find explorers</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search learners by username"
            className="pl-9"
            aria-label="Search learners by username"
            autoComplete="off"
          />
        </div>

        {queryText.trim() && (
          <div className="space-y-1">
            {searching && results === null ? (
              <p className="text-sm text-muted-foreground py-2">Searching…</p>
            ) : results && results.length > 0 ? (
              results.map((u) => <UserListItem key={u.uid} user={u} />)
            ) : (
              <EmptyState
                icon={<CompassRose className="w-12" />}
                title="No explorers found"
                description={`No learners match “${queryText.trim()}”. Try another username.`}
              />
            )}
          </div>
        )}
      </div>

      {/* Weekly leaderboard */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">The weekly voyage</h2>
          <span className="text-xs text-muted-foreground">Resets Monday</span>
        </div>
        {uid && <Leaderboard myUid={uid} />}
      </div>
    </div>
  );
}
