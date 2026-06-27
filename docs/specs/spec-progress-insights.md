# Spec: Progress Insights (`/progress`)

> Turns the `/progress` page from a single skills list into a real **insights dashboard** built from data the app already collects — **no AI / no API key required**. The eventual AI "narrative summary" sits on top of this structured layer later. Defines the real feature behind the D84 stub ("Progress shipped as a locked stub for future AI-assisted insights"). Status: **partially shipped** (WP-7 added the Strengths panel; this spec defines the rest).
>
> Companion: [`spec-learner-model`](spec-learner-model.md) (the data source), [`spec-practice`](spec-practice.md) (`practiceState` per-topic stats), [`spec-ai-assist`](spec-ai-assist.md) (the optional later AI summary). Reverses the "insights are future/AI" framing of D84 by shipping the structured (non-AI) insights first.

## Current state (what's there today)

`/progress` renders exactly one thing: the **StrengthsPanel** ([`src/features/learner/StrengthsPanel.tsx`](../../src/features/learner/StrengthsPanel.tsx)) — three groups (Strong / Keep working on / Introduced), each a skill label + a 0–3 mastery pip from `recentCorrect`. Clean and honest, but it's a *skills list*, not insights. It's also **sparse for the common user**: Strong/Keep-working-on are practice-only (Engine A), so a learner who's only done lessons sees just "Introduced."

## The problem

The app already collects far more than three skill lists, and none of it is surfaced:

| Signal | Where it lives | Surfaced today? |
| --- | --- | --- |
| **Misconceptions** (`{ key: { count, lastSeenAt } }`) | learner model (Engine A + B) | ❌ no — and it's the highest-value insight |
| Per-topic practice stats (rating / attempts / correct) | `users/{uid}/practiceState/{topic}` | ❌ no |
| Activity over time / streak | profile (`activityDates`, `currentStreak`, `bestStreak`) | ❌ not on this page |
| Course progress + XP/level/rank | lesson progress + profile + `lib/levels` | ❌ not on this page |
| Per-skill mastery detail (rating, accuracy) | learner model `skills[*]` | partial (pip only) |

## Design principles

- **AI-free first.** Everything here is computed from stored data — no model, no key, no latency, no hosting decision. (Addresses the open API-key uncertainty: this ships regardless.)
- **Works for the common (lesson-only) user.** Misconceptions + exposure come from lessons too (Engine B), so the page is useful before anyone practices.
- **Honest, not pseudo-precise.** Keep pips/labels for mastery; reveal raw numbers only on an opt-in "details" affordance, never as the default (consistent with WP-7).
- **Insights, not just stats.** Frame each section as "what to do about it" (e.g. "Watch out for the gambler's fallacy — it tripped you up 3×"), not a bare number.
- **Read-only.** No writes from this page.

## Sections (prioritized)

### S1 — Misconceptions ("Watch out for…") — HIGHEST VALUE

- Source: `model.misconceptions` (already populated by lessons via Engine B and practice via Engine A).
- Render: each recognized misconception with its friendly label (`MISCONCEPTIONS[key].label`), a count, and recency ("caught twice this week"). Sort by recent count.
- Why first: most actionable + interesting insight, works for lesson-only users, data already collected, zero new plumbing.
- Component: a new `MisconceptionsPanel.tsx` (sibling to `StrengthsPanel`), or a fourth section inside it.
- **Shipped (2026-06-26):** a "Watch out for" section now lives inside `StrengthsPanel`, with `fix` copy + a deep link into the related practice topic. **How the signal is captured (and made reliable) is specced separately in [`spec-misconception-capture.md`](spec-misconception-capture.md)** — that doc is what makes this section non-empty in practice (behavioral trap tagging, a weighted confidence threshold, and concurrent recognition-based reasoning capture).

### S2 — Per-topic practice summary

- Source: read `users/{uid}/practiceState/{topic}` for each `TOPICS` entry (≤5 small reads).
- Render: per topic — solved count, accuracy (`correct/attempts`), and a coarse level/rating band (band, not raw Elo, by default). Skip topics with 0 attempts.
- Needs a small hook `usePracticeStateSummary(uid)` that fetches all topic docs.

### S3 — Activity / streak strip

- Source: profile `activityDates` + `currentStreak` / `bestStreak`.
- Render: reuse the existing activity-heatmap visual (the home/profile heatmap) + current/best streak. A Progress page is the natural home for it.

### S4 — Course + level trajectory (lighter)

- Source: `useAllLessonProgress` (lessons completed / total) + `levelFromXp(profile.xp)` (level, rank, XP-to-next).
- Render: a compact "X / Y lessons · Level N (Rank) · M XP to next" line. Mostly a consolidation of data shown elsewhere.

### S5 — Opt-in skill detail (optional)

- Tap a skill row to reveal its rating + accuracy for users who want the number the pip hides.

### S6 — Learning trajectory graph (over time)

A small time-series chart — per-topic Elo rating (and/or accuracy, problems-solved) over time — so the learner *sees themselves improving*. Highest-motivation surface (the intervention→achievement→motivation loop).

- **Derived, not stored per-graph.** Reconstructed by replaying/bucketing the append-only **timestamped attempt log**: rating-at-`t` by replaying `applyPracticeAttempt` over the log; accuracy/solved/XP by time-bucketing. No per-graph storage.
- **Two storage strategies:** (a) derive-from-log client-side — MVP, our scale, source-of-truth-accurate; (b) a daily rollup snapshot for cheap reads at scale, rebuildable from the log. **Start with (a).**
- **Min-N gate:** sparse/noisy with few attempts → show "keep practicing to see your trajectory," not a jagged 3-point line.

## Data capture prerequisite (for S6) — practice-attempt event log

Lessons already log every attempt to the append-only, timestamped `stepAttempts`, so **lesson** trajectories derive for free. **Practice currently stores only aggregates** (`practiceState` rating/counts, learner-model stats) — snapshots, not history. To graph practice over time, add an append-only **`users/{uid}/practiceAttempts/{autoId}`** event log: `{ topic, skills, difficulty, wasCorrect, tryNumber, t }`, owner-only (mirrors `stepAttempts`; needs a Firestore rule like the others). The learner model stays the *current-state cache*; this log is the *history*. Everything in S6 derives from it (+ `stepAttempts`).

## Phasing

- **Phase A (now, no key):** S1 (misconceptions) + S2 (per-topic summary). Biggest value, AI-free, low-collision.
- **Phase B:** S3 (activity strip) + S4 (course/level consolidation).
- **Phase C (needs API key — later):** a one-shot **AI narrative summary** ("Here's your week: long-run frequency is solid; the gambler's fallacy keeps catching you — try 5 long-run problems") generated from this structured data. It sits *on top of* S1–S4, which remain the source of truth and the fallback. Belongs in the offline/`/api` AI layer ([`spec-ai-assist`](spec-ai-assist.md)); never blocks the page.

## Acceptance criteria

1. `/progress` shows a **Misconceptions section** (S1) when `model.misconceptions` is non-empty, with friendly labels + counts; hidden when empty.
2. Misconceptions populate for a **lesson-only** learner (Engine B), so the page is non-trivial before any practice.
3. **Per-topic practice summary** (S2) lists topics the learner has practiced with solved count + accuracy; topics with 0 attempts are omitted.
4. No raw Elo shown by default; any precise number is behind an opt-in detail affordance.
5. Loading + empty states match the app convention (shaped skeletons; encouraging empty copy).
6. Read-only — the page issues no writes.
7. No API key / model call required for S1–S4 (Phase C is explicitly separate).
8. Component tests (RTL, WP-T harness) cover S1 render + empty state.

## Collision / ownership note

`ProgressPage.tsx` + `StrengthsPanel.tsx` are WP-7 files (this workstream's). The new pieces (`MisconceptionsPanel.tsx`, `usePracticeStateSummary.ts`) are new files. The only shared dependency is the **read-only** learner-model API (`useLearnerModel` / `subscribeLearnerModel`) and `practiceState` docs — no writes, no overlap with the practice-runtime or lessons/curriculum workstreams. Safe to build without coordinating, unlike the practice page.

## Design decision + alternatives

**Decision (PI1): ship structured, AI-free insights first; AI narrative is a later layer on top.**

- **Chose:** build S1–S4 from stored data with no model dependency; reserve an AI "your week" summary for Phase C once a key + host exist. The structured sections are always the source of truth and the fallback.
- **Considered:**
  - **Wait and do the AI narrative summary as the headline insight.** Rejected for now: depends on an API key we may not have tonight, adds latency, and would have nothing to fall back to. Structured insights are more reliable and demoable.
  - **Dump raw ratings/numbers (a stats dashboard).** Rejected: pseudo-precise, and contradicts WP-7's "pips not numbers" honesty; precise numbers go behind an opt-in detail.
  - **Fold everything into `StrengthsPanel`.** Rejected: it's already a focused component; misconceptions + per-topic stats are distinct concerns → separate panels composed on the page.
- **Gaps / risks:**
  - Per-topic summary (S2) adds ≤5 Firestore reads on page open; acceptable (cached, owner-only). Could batch later.
  - Misconception taxonomy is closed; novel misconceptions aren't shown until a key is added (consistent with `spec-learner-model`).
  - The page remains sparse until a learner has *some* attempt history; the empty state must encourage a first lesson/practice.

## Out of scope

- The Phase-C AI narrative summary (separate; needs the AI layer + key).
- Cross-device real-time refresh beyond the existing one-refresh contract.
- Public/social sharing of insights (private only).
- Spaced-review scheduling UI (Phase 3, ties to D84 follow-up).
