# Deploy checklist

> Verification gates that must pass before each production deploy. Referenced by
> `docs/prd.md` §9.8 and `docs/build-order.md`. Run top to bottom; do not deploy
> with an open ❌.

**Live URL:** https://brilliant-clone-102a7.web.app
**Host:** Firebase Hosting (project `brilliant-clone-102a7`, Spark plan)
**Deploy command:** `npm run build && npx firebase-tools deploy --only hosting --project brilliant-clone-102a7`

> Note on hosting choice: the PRD names Vercel, but the project ships on Firebase
> Hosting because Auth/Firestore/CLI were already wired to the Firebase project,
> giving a public URL with no extra account setup. Hosting is free on Spark.

---

## 1. Local gates (must be green before building)

- [ ] `npm run verify` passes (typecheck + lint + format + 162 tests).
- [ ] `npm run audit-feedback` shows no `[TODO]` placeholders (optional per-cell gaps are acceptable).
- [ ] No AI: `git grep -iE "openai|anthropic|@google/generative|langchain|@ai-sdk"` returns nothing in `src/`, and `package.json` has no LLM SDK.

## 2. Build + bundle budget

- [ ] `npm run build` succeeds.
- [ ] First-load JS gzipped **< 300 KB** (D64). Check the entry chunk:
      `gzip -c dist/assets/index-*.js | wc -c` → must be `< 307200` bytes.
      _Current: ~298.8 KB. Margin is thin; investigate any feature that pushes it over._
- [ ] No `@sentry/*` payload in the entry chunk unless `VITE_SENTRY_DSN` is set
      (`rg -c "@sentry/react|captureException" dist/assets/index-*.js` → `0`).

## 3. Environment / Firebase console

- [ ] Host env has all `VITE_FIREBASE_*` vars (see `.env.example`); `VITE_USE_EMULATOR=false`.
- [ ] Built bundle is pointed at live Firebase, not the emulator:
      `rg -c "localhost:9099|localhost:8080" dist/assets/*.js` → `0`.
- [ ] Firestore rules deployed: `npx firebase-tools deploy --only firestore:rules`.
- [ ] Firebase Console → Authentication → Sign-in method: **Google provider enabled**
      and **"One account per email address"** on (required for the Google button; I031).
- [ ] Firebase Console → Authentication → Settings → Authorized domains includes
      `brilliant-clone-102a7.web.app` (and `.firebaseapp.com`).

## 4. Post-deploy HTTP smoke (automatable from a shell)

- [ ] `/` returns HTTP 200 and serves the real build (`<title>Probability Pirates</title>`).
- [ ] SPA rewrite works: `/profile`, `/lesson/what-is-probability`, and an unknown
      route all return 200 (client router handles gating + 404 → Home).

## 5. Manual smoke — the 5 brief scenarios (run on a real phone, ~390px)

These mirror the PRD §MVP testing scenario. Use a fresh account each pass.

1. **Complete a lesson end to end, recover from a wrong answer.**
   - Register a new account; land on Home.
   - Start Lesson 1. On a problem slot, submit a **wrong** answer →
     instant (<100ms-feeling) red feedback + a specific hand-written hint, **not** just a red X.
   - Continue stays **locked** until you get it right (no bail-out, D55).
   - Finish the lesson → celebration screen (confetti, XP count-up, streak chip, next-lesson preview).

2. **Manipulate the interactive element and watch the visual respond live.**
   - On the 6×6 grid slot, tap cells → the live `X / 36` counter updates in real time, smoothly.
   - Rapid-tap ~50 times → no jank, no pinch-zoom, stays ~60 FPS.

3. **Leave mid-lesson, return, confirm progress + streak persist.**
   - Mid-lesson, close the tab (or hard-reload). Reopen → resume at the **same slot**.
   - After completing a lesson, confirm the streak/XP persisted on Home and Profile.

4. **Finish a lesson → path recommends a sensible next step.**
   - After completion, Home hero recommends the next unlocked lesson (or Replay if all done).

5. **The whole thing on a phone-sized screen.**
   - No horizontal scroll at 320–390px. Bottom nav on mobile. Touch targets comfortable.

## 6. Lighthouse (deployed URL, AC 9.8.6)

- [ ] Mobile run: Performance / Accessibility / Best Practices each **≥ 90**.
- [ ] Desktop run: same three **≥ 90**.

## 7. Final scope sanity (negative criteria, PRD §9.10)

- [ ] No model API calls or keys in the deployed build.
- [ ] Decide consciously: social / store / schedule surfaces are either owned in the
      PRD or flag-hidden for the demo (they currently ship; PRD §9.10 says they should not).
