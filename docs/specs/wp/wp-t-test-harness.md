# WP-T — Component-test harness (React Testing Library + jsdom)

> **Type:** test infrastructure. **Depends on:** nothing. **Blocks:** the UI WPs (6a, 6b, 6c, 7), which now ship real component tests. **Server/AI:** no.
>
> One-time setup so UI work packages can be tested reliably (render -> interact -> assert) instead of relying on manual smoke. Owner chose reliability over speed (open question #8).

## Goal

Add React Testing Library + jsdom to the existing Vitest setup so components can be mounted and exercised in tests, without disturbing the existing pure-logic test suite.

## Files

- **Edit** `package.json` (devDependencies) — add `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`. Use the package manager to add latest compatible versions; do not hand-pin guesses.
- **Edit** the Vitest config (`vitest.config.ts` / `vite.config.ts` `test` block) — set `environment: 'jsdom'` (or per-file `// @vitest-environment jsdom` if the repo prefers node default), and register a setup file.
- **Add** `src/test/setup.ts` — `import '@testing-library/jest-dom/vitest'`; any global cleanup (`afterEach(cleanup)` is automatic in RTL ≥ recent, confirm).
- **Add** `src/test/smoke.test.tsx` — a trivial component render test proving the harness works.

## Steps (loop until green)

1. Install the four devDeps via the package manager.
2. Configure Vitest: jsdom environment + `setupFiles: ['src/test/setup.ts']`. If existing pure-logic tests assume the `node` environment, prefer per-file `@vitest-environment jsdom` pragmas for component tests OR confirm jsdom-global is harmless for them (run the full suite to verify no regressions).
3. Write `setup.ts` and the smoke test (render a `<button>Hi</button>` wrapper, assert it's in the document).
4. Run the FULL suite (`npx vitest run`) — all existing tests must still pass. Run `npm run typecheck`.

## Test plan / Definition of Done

- `src/test/smoke.test.tsx` passes (a component mounts and a `@testing-library/jest-dom` matcher like `toBeInTheDocument()` works).
- The entire pre-existing test suite still passes (no environment regression).
- `npm run typecheck` clean; `npm run build` unaffected (test deps are dev-only).

## Boundaries (do NOT touch)

- Do not convert existing pure-logic tests to component tests.
- Do not change app source files — this is test infra only.
- Do not add E2E tooling (Playwright/Cypress) — RTL component tests only for this batch.
