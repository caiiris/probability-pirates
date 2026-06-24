import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchAndActivate,
  getString,
} from 'firebase/remote-config';
import { getRemoteConfigSafe } from '@/lib/firebase';
import {
  REMOTE_CONFIG_DEFAULTS,
  REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS,
  parseAvailableLessonIds,
} from './remoteFlagsConfig';

type RemoteFlags = {
  availableLessonIds: ReadonlySet<string>;
  /** false until the first fetchAndActivate resolves (or fails).
   *  UI may render using defaults during loading; nothing blocks on it. */
  ready: boolean;
};

const DEFAULT_FLAGS: RemoteFlags = {
  availableLessonIds: new Set(
    parseAvailableLessonIds(REMOTE_CONFIG_DEFAULTS.available_lesson_ids),
  ),
  ready: false,
};

const RemoteFlagsContext = createContext<RemoteFlags>(DEFAULT_FLAGS);

export function RemoteFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<RemoteFlags>(DEFAULT_FLAGS);

  useEffect(() => {
    const rc = getRemoteConfigSafe();
    if (!rc) return;

    rc.defaultConfig = { ...REMOTE_CONFIG_DEFAULTS };
    rc.settings.minimumFetchIntervalMillis = REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS;

    let cancelled = false;
    fetchAndActivate(rc)
      .catch((err) => {
        // Don't fail the app — defaults will be used.
        console.warn('[RemoteFlags] fetchAndActivate failed:', err);
      })
      .finally(() => {
        if (cancelled) return;
        const raw = getString(rc, 'available_lesson_ids');
        setFlags({
          availableLessonIds: new Set(parseAvailableLessonIds(raw)),
          ready: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RemoteFlagsContext.Provider value={flags}>
      {children}
    </RemoteFlagsContext.Provider>
  );
}

export function useRemoteFlags(): RemoteFlags {
  return useContext(RemoteFlagsContext);
}

/** True if the lesson id is currently marked available via Remote Config
 *  (or via the bundled defaults during cold start). */
export function useIsLessonAvailable(lessonId: string): boolean {
  const { availableLessonIds } = useRemoteFlags();
  return useMemo(
    () => availableLessonIds.has(lessonId),
    [availableLessonIds, lessonId],
  );
}
