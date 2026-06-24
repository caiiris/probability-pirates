import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';
import type { Analytics } from 'firebase/analytics';

// `firebase/analytics` and `firebase/performance` are intentionally NOT imported
// statically. Neither is needed for first interaction, so both are pulled in via
// dynamic import() inside their accessors below — keeping them out of the
// first-load bundle (only fetched once telemetry actually runs).

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Remote Config is lazy: window-only (it uses IndexedDB), and we never
// want vitest/jsdom to construct it. Callers get null in non-browser envs.
let remoteConfigSingleton: RemoteConfig | null = null;
export function getRemoteConfigSafe(): RemoteConfig | null {
  if (typeof window === 'undefined') return null;
  if (!remoteConfigSingleton) {
    remoteConfigSingleton = getRemoteConfig(app);
  }
  return remoteConfigSingleton;
}

// Analytics is browser-only AND can fail (cookies blocked, IE, certain
// privacy contexts). isSupported() is the documented preflight. We return
// a cached promise so callers can `await getAnalyticsSafe()` without
// thrashing the check.
let analyticsPromise: Promise<Analytics | null> | null = null;
export function getAnalyticsSafe(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!firebaseConfig.measurementId) return Promise.resolve(null);
  // Skip analytics when running against the emulator — no point polluting GA
  // with dev hits, and the emulator doesn't proxy Analytics anyway.
  if (import.meta.env.VITE_USE_EMULATOR === 'true') return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = import('firebase/analytics')
      .then(({ getAnalytics, isSupported }) =>
        isSupported().then((supported) => (supported ? getAnalytics(app) : null)),
      )
      .catch((err) => {
        console.warn('[firebase] Analytics unavailable:', err);
        return null;
      });
  }
  return analyticsPromise;
}

// Performance Monitoring is browser-only and one-shot. Loaded via dynamic
// import so the SDK stays out of the first-load bundle; the fetch happens
// after first paint and never blocks interaction.
let performanceStarted = false;
export function ensurePerformanceMonitoring(): void {
  if (typeof window === 'undefined' || performanceStarted) return;
  if (import.meta.env.VITE_USE_EMULATOR === 'true') return;
  performanceStarted = true;
  void import('firebase/performance')
    .then(({ getPerformance }) => {
      getPerformance(app);
    })
    .catch((err) => {
      console.warn('[firebase] Performance Monitoring unavailable:', err);
    });
}

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Guard against Vite HMR re-evaluation throwing "already connected"
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch {
    // Emulators already connected — safe to ignore during hot-module reload
  }
}
