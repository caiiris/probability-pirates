import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ensurePerformanceMonitoring } from '@/lib/firebase';

// Sentry is loaded only when a DSN is configured, and even then off the
// critical path via dynamic import — so the (heavy) SDK never ships in the
// first-load bundle when error reporting is disabled.
if (import.meta.env.VITE_SENTRY_DSN) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
    });
  });
}

// Firebase Performance Monitoring auto-tracks page loads + network requests.
// Skipped in emulator mode by the helper itself.
ensurePerformanceMonitoring();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
