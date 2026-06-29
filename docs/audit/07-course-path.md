# Audit 07 — Course Path / Home + App Navigation Chrome

> Scope: the Home screen and the persistent app shell.
> Feature files: `src/features/course/*` — `HomePage.tsx`, `CoursePath.tsx`,
> `HeroCard.tsx`, `LessonNode.tsx`, `LessonGlyph.tsx`, `ChapterBanner.tsx`,
> `Checkpoint.tsx`, `OceanScene.tsx`, `PathSticker.tsx`, `FlyingDie.tsx`,
> `chapters.ts` (+test), `recommendations.ts` (+test), `lessonVisuals.ts`; the
> app shell `src/components/AppShell.tsx`, `AppHeader.tsx`, `AppFooter.tsx`,
> `src/components/StreakChip.tsx`, `src/hooks/use-mobile.ts`; the catalog gate
> `src/features/flags/useLessons.ts`; the live progress feed
> `src/features/progress/useAllLessonProgress.ts`; the daily companion
> `src/features/captain/CaptainsLog.tsx`.
>
> Ground truth accepted as given: `tsc` clean, `eslint` clean, `vitest`
> 1083/1083. This audit is read-only against source; the suite was not re-run.
>
> Reference contracts: `docs/prd.md` §9.6 (Course Path / Home — 10 ACs),
> §9.9 (responsive + a11y), §9.5.9 (daily-goal pill), `docs/specs/spec-course-path.md`,
> `docs/alternatives.md` (D6, D43, D60, D63, D86, D88, D90, D91).

---

## 1. Overview

### Files & roles

| File | Role |
| --- | --- |
| `HomePage.tsx` | Page composition: loading skeleton, prune-stale-progress effect, the progress chip (`X of Y islands explored`), and the hero-vs-CaptainsLog gate. Renders `CoursePath`. |
| `recommendations.ts` | Pure logic: `nextRecommendedLesson`, `courseProgress`, `dailyGoalDone`. |
| `CoursePath.tsx` | The themed voyage map: groups lessons into chapters, lays nodes on a weaving track, draws hand-drawn ink connectors, chapter chests + final treasure. |
| `HeroCard.tsx` | The one-tap hero — only `Welcome` (new user) and `AllCaughtUp` (whole course done) variants are reachable from Home; `Resume`/`Start` sub-states exist but are gated out (see §3). |
| `LessonNode.tsx` | A single island marker: state badge (completed/in-progress/locked/current), tap → `/lesson/:id`, `?mode=review`, or "coming soon" toast. |
| `ChapterBanner.tsx` | "World" header per chapter with `done/total` count, "Soon" chip for fully-locked chapters; clickable safety-net link to first playable lesson. |
| `Checkpoint.tsx` | Per-chapter coin chest + final-chapter treasure; idempotent claim. |
| `OceanScene.tsx`, `FlyingDie.tsx`, `PathSticker.tsx`, `LessonGlyph.tsx`, `lessonVisuals.ts`, `chapters.ts` | Pure presentation/chrome (sea, ambient art, node glyphs, chaptering). |
| `AppShell.tsx` | Responsive nav: bottom tab bar (<768px) vs sidebar (≥768px), chromeless on `/lesson/*` + `/celebration/*`, route fade + scroll-reset. |
| `AppHeader.tsx`, `StreakChip.tsx` | Persistent top bar: brand, level/XP bar, streak chip, coins, bell, avatar. |
| `useLessons.ts` | Catalog with `comingSoon` recomputed from Remote Config (`available_lesson_ids`, default `['how-likely']`) + an empty-slots safety net. |
| `useAllLessonProgress.ts` | Live `onSnapshot` over `users/{uid}/lessonProgress` → `loading | ready | error`. |

### Routes / nav model

- Home is `/`, eager-loaded, wrapped in `RequireAuth` → `AppShell` (`App.tsx:76-95`). Lesson/celebration are lazy children of the same `AppShell`.
- `AppShell` hides **all** chrome for `CHROMELESS_PREFIXES = ['/lesson/', '/celebration/']` (`AppShell.tsx:38, 184-189`), returning a bare `<Outlet/>` — satisfies AC #6.
- Breakpoint switch is JS-driven via `useIsMobile()` (768px), **not** Tailwind `md:` classes: `<768px` → top bar + fixed bottom nav; `≥768px` → top bar + shadcn `Sidebar`.
- Nav destinations have grown far past the spec's "Home + Profile": `NAV_ITEMS` = Home, Practice, Schedule, Progress, Friends, Profile, plus a Wager sidebar link (`AppShell.tsx:28-35, 236`). This is intended Phase-2 scope creep (social/economy shipped) but drives the 320px crowding risk in §4.

### How Home is wired (the important divergence)

The shipped Home is **not** "header + single hero + flat lesson list." It is a themed scrollable voyage map. The hero card is reserved for two narrative moments only:

```107:117:src/features/course/HomePage.tsx
        {isNewUser || allCompleted ? (
          <HeroCard
            lessons={lessons}
            progressMap={progressMap}
            uid={uid}
            displayUsername={profile?.displayUsername ?? ''}
            isNewUser={isNewUser}
          />
        ) : (
          <CaptainsLog />
        )}
```

For the normal returning learner the "next action" is expressed as the **current node** on the path (`isCurrent`, with a bobbing Start/Continue pill in `LessonNode.tsx:100-110`), driven by `currentLessonId={recommendation?.id ?? null}` (`HomePage.tsx:145`). This is a deliberate redesign (D88/D91 ocean theme) and is internally coherent, but it changes how several §9.6 ACs are satisfied.

---

## 2. What works (against §9.6 / §9.9)

- **AC #1 (recommend next action) — core logic correct.** `nextRecommendedLesson` (`recommendations.ts:9-28`) correctly prioritises in-progress (most-recent `updatedAt`) → first not-started real lesson → `null`, over the *real* (non-`comingSoon`) subset. Verified by `recommendations.test.ts:33-48`. The *Resume/Start* surfacing moved from the hero to the path node, but the recommendation that powers it is right.
- **AC #2 (progress denominator) — correct per D91.** `courseProgress` returns `total = lessons.length` (whole planned course = 34: `how-likely` + 33 stubs) and counts `completed` only for lessons with authored slots (`recommendations.ts:47-55`), so a stale completed doc on a blank stub never inflates the count (`recommendations.test.ts:66-73`). The chip reads `1 of 34 islands explored` (`HomePage.tsx:129-141`) with a clear `aria-label`.
- **AC #3 (full planned course renders).** Every catalog lesson renders via `groupLessonsIntoChapters` (`chapters.ts:139-168`); `chapters.test.ts` proves no unknown ids, no duplicates, no leftovers, monotonic numbering. Locked stubs render with lock badge + "Coming soon" meta (`LessonNode.tsx:64-72, 136-140`).
- **AC #4 (real tap navigates).** `LessonNode.handleTap` routes completed → `?mode=review`, otherwise → `/lesson/:id` (`LessonNode.tsx:39-51`).
- **AC #5 (locked tap blocked).** Locked tap shows a Sonner toast and does **not** navigate, plus a shake (`whileTap` x-keyframes) (`LessonNode.tsx:40-42, 127`). Correct behavior; copy is wrong (see §4 P2).
- **AC #6 (responsive chrome + hidden on immersive).** Bottom nav ↔ sidebar switch and chromeless lesson/celebration both implemented (`AppShell.tsx:196-251`). Header persists (it sits above the internally-scrolling `<main>`).
- **AC #7 (loading skeleton).** `HomePageSkeleton` covers chips, hero, and path nodes; gated on `auth.status === 'loading' || progressState.status === 'loading'` (`HomePage.tsx:59-61, 219-242`) — no flash of empty content.
- **AC #9 (no horizontal scroll).** The path uses percent-based `WEAVE` fractions inside `mx-auto max-w-xl`, and every decorative layer lives inside `OceanScene`'s `overflow-hidden` (`OceanScene.tsx:48-50`). No element widens the document at 320px (caveat: art *clips* rather than scrolls — §4 P2).
- **AC #10 (real-time on return).** `useAllLessonProgress` is a live `onSnapshot` (`useAllLessonProgress.ts:26-39`) and the streak/level/coins come from the live auth profile, so returning from a lesson updates node state, the progress chip, and the streak chip with no manual refresh.
- **§9.9 a11y/motion.** Global `MotionConfig reducedMotion="user"` (`App.tsx:57`) tones down all ambient sea/dice/pill motion. Interactive nodes are real `<button>`/`<Link>` with `aria-label`; decorative dice/ships/stickers are `aria-hidden` and non-focusable (`FlyingDie.tsx:84`, `PathSticker.tsx:74`, `OceanScene` art). The progress chip exposes a text `aria-label` despite its "islands explored" metaphor.

---

## 3. What's missing / incomplete (vs the literal ACs)

These are deliberate redesigns, but they leave gaps against the PRD text:

1. **AC #1 "single hero card" + Replay state is unreachable on the returning path.** The hero only renders when `isNewUser || allCompleted` (`HomePage.tsx:107`). `allCompleted` requires the **entire** 34-lesson catalog to be completed (`HomePage.tsx:76-77`, `HeroCard.tsx:61-62`), which can never happen while 33 lessons are locked stubs. Result: after a learner finishes the only available lesson (`how-likely`), `nextRecommendedLesson` returns `null` → no current node → and the All-Caught-Up hero does not fire → Home shows only `CaptainsLog`. There is **no next-action affordance** in that state (see §4 P1). This is acknowledged in D91 ("CaptainsLog covers the 'more coming' case"), but it is still a soft dead-end against AC #1's "the answer is one tap away."
2. **AC #6.8 / D60 "Replay (fresh variant mix)" not shipped.** Re-entry to a completed lesson is read-only `?mode=review` everywhere (`LessonNode.tsx:47`, `HeroCard.tsx:110`, `ChapterBanner.tsx:40`); `startReplay` (the fresh-variant path) is exported but never called (confirmed in `docs/code-audit.md` L5). The AC text ("starts a fresh attempt with a new variant mix") is not met; the intent ("re-experience a completed lesson") is met by review mode. Divergence, not a defect.
3. **AC #2 header placement.** The spec wants streak + daily-goal pill + course progress in **one sticky header**. Shipped: streak lives in the sticky `AppHeader`; the course-progress chip and the daily-goal indicator are in the **non-sticky page body** (`HomePage.tsx:101, 129-141`). Information is present, location diverges.
4. **§9.5.9 / AC #2 daily-goal pill — pending state dropped.** The always-on "Complete a lesson today" pill was intentionally removed; only a dismissable "Done today" popup remains (`HomePage.tsx:96-101, 164-217`). There is no on-Home indicator of an *unmet* daily goal.
5. **AC #2 zero-streak chip.** `StreakChip` returns `null` at streak 0 (`StreakChip.tsx:47`) — there is no "distinguished zero" state; the chip simply disappears. Arguably better UX, diverges from the AC's "distinguished when active vs zero."
6. **No error state on Home.** `useAllLessonProgress` has an `error` status (`useAllLessonProgress.ts:33-35`) that Home never reads — see §4 P1.

---

## 4. Bugs & risks

### P1

- **P1 — Firestore read error silently renders Home as a brand-new user.**
  `HomePage.tsx:63` collapses any non-`ready` progress state to an empty map: `const progressMap = progressState.status === 'ready' ? progressState.data : new Map();`. On an `onSnapshot` error (permission change, transient network, offline) `useAllLessonProgress` resolves to `{status:'error'}` (`useAllLessonProgress.ts:33-35`), so an existing learner is shown `isNewUser`-style state: the "Welcome aboard… Start your first lesson" hero (because `progressMap.size === 0`, `HomePage.tsx:71`), `0 of 34` progress, and every node reset to "Not started." This is an alarming, misleading reset with no error UI and no retry. The loading skeleton also never reappears (status is `error`, not `loading`). Fix: branch on `error` (toast/inline banner + retain last-known or a neutral "couldn't load progress" state) rather than treating it as "no progress."

- **P1 — Post-completion dead-end (no next-action affordance).**
  When all *available* lessons are complete but the planned course is not (the live config: 1 of 34 playable), `nextRecommendedLesson` → `null` (`recommendations.ts:26-27`), so no node is `isCurrent` and the path shows no Start/Continue pill; simultaneously `allCompleted` is `false`, so the All-Caught-Up hero is suppressed (`HomePage.tsx:76-77, 107`). The returning learner lands on a screen whose only dynamic element is the Captain's daily tip — no "you're caught up, more coming," no replay/review prompt. Logic gap between AC #1 (Replay/all-unlocked-done) and the D91 "all-planned-done" gate. Low code cost: add an "all *available* done" branch that surfaces a review/all-caught-up nudge.

- **P1 — Locked-tap copy promises a sequential unlock that does not exist.**
  `toast(\`Coming soon. Finish Lesson ${lesson.number - 1} first.\`)` (`LessonNode.tsx:41`). Lessons are gated by *authoring + Remote Config*, not by completing the previous lesson. A learner who finishes `how-likely` and taps Lesson 2 is told "Finish Lesson 1 first" — which they just did — and it stays locked. For a deep node (e.g. Lesson 26 / Monty Hall) it reads "Finish Lesson 25 first," also untrue. This builds a false mental model of progression and is the most learner-visible correctness wart. Fix: generic copy ("New chapters are still being charted — coming soon.").

### P2

- **P2 — 6-item bottom nav crowds/overlaps at 320px.** Each `BottomTab` is `flex-1` (≈53px at 320px) but its active pill is `px-5` + a 20px icon ≈ 60px intrinsic (`AppShell.tsx:99-142, 206-213`). The active pill overflows its cell and bleeds ~3–4px into neighbours; labels like "Schedule"/"Practice" at `text-[11px]` are near the cell width. No document scroll (the nav is `fixed inset-x-0`), but it is visually tight/overlapping — a direct consequence of growing nav from 2 → 6 destinations without a 320px pass.
- **P2 — `useIsMobile()` flashes the desktop layout on first paint.** It seeds `undefined` and coerces `!!isMobile → false` before the mount effect runs (`use-mobile.ts:6-18`), so the very first client render is the **sidebar** layout (and the wordmark vs brandmark in `AppHeader`). On a phone this is a one-frame flash of the wrong chrome + layout shift. Common shadcn pattern, but worth a `matchMedia` initializer.
- **P2 — Decorative islands/treasure clip at narrow widths.** A node's `Island` art is `w-[208px]` (current node `w-[236px]`) centered on a 140px column (`LessonNode.tsx:94-99`); for right-weighted nodes (`frac 0.74`) and the 300px treasure (`CoursePath.tsx:139`) the art exceeds the `max-w-xl` track and is clipped by `OceanScene`'s `overflow-hidden`. No scroll, but the comment claiming "islands and labels never clip at the track edges" (`CoursePath.tsx:74-76`) is optimistic at 320px.
- **P2 — `lessonVisuals.ts` keys are stale.** The `VISUALS` map is keyed by the *old* lesson ids (`what-is-probability`, `law-of-large-numbers`, `counting-carefully`, …) (`lessonVisuals.ts:16-26`), but the live catalog ids are `how-likely`, `sample-space`, `permutations`, `monty-hall`, … (`content/index.ts`, `roadmapStubs.ts`). Only `long-run-frequency` still matches; every other node falls back to an index-derived accent/glyph (`lessonVisuals.ts:30-37`). So concept-matched glyphs (`door` for Monty Hall, `cards` for combinations, `tree` for the multiplication principle, `die` for `how-likely`) never appear — the path shows generic cycling glyphs instead. Purely cosmetic, but the file's intent is unmet.
- **P2 — `courseProgress` can count a re-locked authored lesson.** `completed` counts any lesson with `slots.length > 0` and a completed doc (`recommendations.ts:51-53`), while the prune effect only deletes docs for *blank* stubs (`HomePage.tsx:50-56`). An authored lesson rolled back to `comingSoon` via Remote Config (slots intact) keeps contributing to the numerator while `LessonNode` renders it locked — a small numerator/visual mismatch. Edge case.

### Not a bug (verified)
- Recommendation tie-breaking, the `comingSoon`-always-locked visual guard (`LessonNode.tsx:35`), the idempotent prune `prunedRef` (`HomePage.tsx:46-57`), and chromeless detection are all correct.

---

## 5. Pros / Cons

**Pros**
- Recommendation + progress logic are pure, tested, and correct; the D91 denominator/stale-doc handling is genuinely well thought through.
- Clean separation: the lesson player is fully chromeless/immersive, so the heavy ocean theme never bleeds into the actual learning surface.
- Strong progress visibility: per-node state, per-chapter `done/total`, a whole-course chip, a final-treasure goal, and live updates.
- Solid a11y baseline: semantic buttons/links with labels, decorative art hidden, global reduced-motion.
- Resilient catalog/chaptering: unknown ids, leftovers, and empty chapters are all handled so the path never breaks as content ships.

**Cons**
- The map metaphor is animation-dense (sun, 6 clouds, gulls, 3 ships, sky + path dice, 3 wave bands, bobbing pills, sparkles) — motion/visual budget is high and several layers clip on small screens.
- Three PRD ACs (#1 single hero, #2 sticky-header trio, #8 replay) are satisfied "in spirit" by redesigns, so the doc-to-build contract has drifted.
- The biggest learner-facing states (post-completion next step, locked-tap copy, read error) are under-served.
- Nav grew to 6 destinations without a 320px responsive pass.

---

## 6. Learning-science assessment

- **Autonomy / SDT.** Strong on *structure* and *transparency*: the entire 34-lesson roadmap is visible, the learner can freely review any completed lesson, and the chapter/treasure framing gives a sense of a charted journey (competence-supportive). Weakened by the **locked-tap copy** (P1): telling a learner "finish Lesson N-1 first" when they already have, and when the real gate is authoring, undermines the feeling of agency and predictability — the system appears to lie about the rules.
- **Goal salience.** Excellent in the active case: a single bobbing Start/Continue pill is an unambiguous next move (one primary thing). Collapses in the post-completion case (P1): the most motivated returning user — who finished everything available — is met with no goal at all, only a passive tip. Closure/next-step is the weakest beat.
- **Progress visibility.** Best-in-class on this screen — multiple, redundant encodings (node checks, chapter counts, `X/34` chip, chests, treasure). One tradeoff: D91's honest `1/34` denominator (vs the old `1/1`) is truthful but can read as "3% done," dampening early competence; the chapter `done/total` counts and the completed-island visuals partly compensate.
- **Map theme vs extraneous cognitive load.** On *this* screen the seductive detail is largely benign and even germane to motivation, because Home is a navigation/affect surface, not an instructional one — and Mayer's coherence concern bites hardest on instructional material, which is kept on the clean chromeless player. Net: the theme **aids** engagement without taxing learning. Residual risk: the sheer density of independent looping animations is borderline (attention magnets near the focal node), and reduced-motion users get the right calmer treatment, so the floor is protected. Recommendation: thin the ambient layers (fewer clouds/dice) so the current node clearly wins the visual hierarchy.

---

## 7. Prioritized recommendations

1. **(P1) Handle the progress `error` state in `HomePage`** (`HomePage.tsx:63`). Stop mapping `error → empty map`; show a non-destructive inline error/retry and never render the "Welcome / 0 of 34 / all-not-started" state to a learner who actually has progress.
2. **(P1) Add an "all available complete" branch.** When `nextRecommendedLesson` is `null` but `allCompleted` is false, surface a hero/banner ("You're caught up — review a lesson or check back as new chapters open") so Home is never a dead-end. Optionally wire the long-dormant `startReplay` here to finally deliver AC #6.8.
3. **(P1) Fix the locked-tap copy** (`LessonNode.tsx:41`) to a truthful "coming soon / being charted" message that does not imply a sequential unlock.
4. **(P2) 320px nav pass.** Shrink the active-pill padding / icon-only at the smallest width / or cap the bottom bar to the most important destinations so 6 tabs don't overlap.
5. **(P2) Seed `useIsMobile` from `matchMedia`** at first render to kill the desktop-layout flash on phones.
6. **(P2) Re-key `lessonVisuals.ts`** to the live catalog ids so concept-matched glyphs return (and consider folding the map into `chapters.ts`/the catalog to prevent future drift).
7. **(P2) Thin ambient animation + clamp art width** at the track edges so islands/treasure don't clip and the current node wins focus.
8. **(Doc) Reconcile §9.6 ACs #1/#2/#8 with the shipped ocean redesign** (single-hero → path-node, sticky-header trio → header+body split, replay → review) so the PRD reflects D88/D91 reality.

---

## Executive summary

- **Recommendation logic is correct and tested.** `nextRecommendedLesson` (in-progress → first not-started real → null) and `courseProgress` (D91: completed-with-slots over the full 34-lesson planned course) are pure, covered, and behave correctly (`recommendations.ts:9-55`).
- **Home was redesigned into a themed voyage map**; the "next action" moved from a hero card to the highlighted **current node** on the path, and the hero is reserved for Welcome / whole-course-complete only (`HomePage.tsx:107-117`). Coherent, but ACs #1 (single hero), #2 (sticky-header trio), and #8 (replay→review) are now satisfied only in spirit.
- **Real vs locked tap, responsive chrome (bottom nav ↔ sidebar, chromeless on lesson/celebration), loading skeletons, reduced-motion, and live-on-return updates all work** (`LessonNode.tsx`, `AppShell.tsx`, `useAllLessonProgress.ts`).
- **Most severe bug (P1): a Firestore progress read error renders Home as a brand-new user** — `HomePage.tsx:63` maps the `error` status from `useAllLessonProgress.ts:33-35` to an empty map, producing a misleading "Welcome / 0 of 34 / nothing started" reset with no error UI or retry for a learner who actually has progress.
- **Second P1: post-completion dead-end** — once all *available* lessons are done (live config = 1 of 34), `nextRecommendedLesson` returns `null` and `allCompleted` is still false, so Home shows no next-action affordance at all, only the Captain's tip (`HomePage.tsx:76-77, 107`).
- **Third P1 (learner-facing): the locked-tap toast lies** — `Coming soon. Finish Lesson ${lesson.number - 1} first.` (`LessonNode.tsx:41`) implies a sequential unlock, but lessons are gated by authoring/Remote Config; finishing the prior lesson never unlocks the next.
- **Notable P2s:** 6-item bottom nav overlaps at 320px (`AppShell.tsx:206-213`); `useIsMobile` flashes the desktop layout on first paint (`use-mobile.ts:6-18`); `lessonVisuals.ts` is keyed to stale lesson ids so concept glyphs never render (`lessonVisuals.ts:16-26`); decorative islands/treasure clip at narrow widths.
- **Learning-science:** excellent progress visibility and structure-based autonomy with a clean separation of theme (motivational Home) from instruction (chromeless player); weakest beats are goal closure (the post-completion dead-end) and trust (the misleading lock copy). The ocean theme aids rather than harms learning here, though the animation density is borderline and should be thinned so the current node clearly wins focus.
- **Top improvement:** make Home never lie and never dead-end — fix the error-state fallback (P1 #1) and add an all-available-complete next-action, then correct the locked-tap copy.
