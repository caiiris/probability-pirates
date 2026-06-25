# Probability Pirates

A mobile-first, **learn-by-doing probability app** for motivated middle and high-school students.
Each lesson is a short sequence of interactive steps with instant, hand-written
feedback on every answer. 

**Live:** https://probability-pirates.web.app

## Stack

Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Framer Motion + React
Router + Firebase (Auth, Firestore, Analytics) + Firebase Hosting.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web-app config
npm run dev                  # http://localhost:5173
```

Env vars are documented in `.env.example`. The app reads live Firebase by
default; set `VITE_USE_EMULATOR=true` to point at the local emulator suite
instead.

### Local Firebase emulators (optional)

```bash
npx firebase-tools emulators:start   # Auth :9099, Firestore :8080, UI :4000
# then run the app with VITE_USE_EMULATOR=true
```

## Scripts

| Command                           | Does                                                |
| --------------------------------- | --------------------------------------------------- |
| `npm run dev`                     | Vite dev server                                     |
| `npm run build`                   | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run verify`                  | `typecheck` + `lint` + `test` (the pre-commit gate) |
| `npm run test` / `test:watch`     | Vitest                                              |
| `npm run audit-feedback`          | Reports lessons missing hand-written feedback copy  |
| `npm run format` / `format:check` | Prettier                                            |

## Deploy

Builds are static; hosted on Firebase Hosting.

```bash
npm run build
npx firebase-tools deploy --only hosting --project brilliant-clone-102a7
# rules: npx firebase-tools deploy --only firestore:rules --project brilliant-clone-102a7
```

Run through [`docs/deploy-checklist.md`](docs/deploy-checklist.md) before each
production deploy.

## Content model

Lessons are TypeScript files in `src/content/lessons/` — no CMS, no admin UI.
A lesson is a sequence of typed `Slot`s (concept / problem / wrap); problem slots
carry one or more `Variant`s per interaction kind. See
[`docs/specs/spec-content-model.md`](docs/specs/spec-content-model.md).

## Documentation

| Doc                                                    | What                                       |
| ------------------------------------------------------ | ------------------------------------------ |
| [`docs/prd.md`](docs/prd.md)                           | Product requirements + acceptance criteria |
| [`docs/architecture.md`](docs/architecture.md)         | State, routing, errors, perf budget        |
| [`docs/ui-stack.md`](docs/ui-stack.md)                 | UI stack, design tokens, breakpoints, a11y |
| [`docs/build-order.md`](docs/build-order.md)           | Spec dependency graph                      |
| [`docs/alternatives.md`](docs/alternatives.md)         | Decision history (D1–D77+)                 |
| [`docs/issues.md`](docs/issues.md)                     | Open issues / known gaps                   |
| [`docs/deploy-checklist.md`](docs/deploy-checklist.md) | Pre-deploy verification gates              |
| [`docs/privacy.md`](docs/privacy.md)                   | Data collection + privacy stance           |

## License

MIT — see [`LICENSE`](LICENSE).
