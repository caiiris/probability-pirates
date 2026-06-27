/**
 * Vitest workspace — extends the existing src test suite with the new api/ tests.
 * Created for F2-A: enables `npx vitest run api/` without modifying vitest.config.ts.
 * The existing `vitest.config.ts` remains unchanged; its settings apply to the
 * 'src' project through the workspace inline config below.
 */
import { defineWorkspace } from 'vitest/config';
import path from 'path';

export default defineWorkspace([
  // Existing src tests — preserves every setting from vitest.config.ts inline.
  {
    test: {
      name: 'src',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  // New api tests (F2-A). Node environment: server-side code, no DOM needed.
  {
    test: {
      name: 'api',
      include: ['api/**/*.test.ts'],
      environment: 'node',
    },
    // The api/ sources use `.js` import specifiers (required by Vercel's Node
    // ESM runtime, which transpiles each function per-file). This alias lets
    // vitest resolve those `.js` specifiers back to the `.ts` sources in tests.
    resolve: {
      extensionAlias: { '.js': ['.ts', '.js'] },
    },
  },
]);
