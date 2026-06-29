# iris-log — skill scope

> Scope for the personal skill `iris-log`. It is the **living-memory**
> counterpart to `iris-plan`: where `iris-plan` writes a feature's *initial*
> planning snapshot once and freezes it, `iris-log` curates the repo's evolving
> knowledge so a future agent can get current in one read. Status: **built**
> (`~/.cursor/skills/iris-log/`). This doc was the input used to build it.

## 1. Purpose & audience

- **Purpose:** keep the repo's living docs current as features ship, decisions
  change, and bugs/refactors surface — so the docs stay a trustworthy TLDR of the
  project rather than drifting stale.
- **Audience:** future agents first (read-this-before-touching-the-repo), the
  human second.
- **Cadence:** continuous / append-as-you-go. The opposite of `iris-plan`'s
  one-and-done.

## 2. Docs it owns (4, consolidated from 6)

| Doc | Owns | Notes |
| --- | --- | --- |
| `AGENTS.md` (TLDR / front door) | What the repo is, current state, and a map to every other living doc | The headline value: the onboarding index. New doc. Always present-truth. |
| `alternatives.md` (decisions) | All decisions, `open` → `resolved` → `superseded`, each with Chose / Considered / Gaps | The *why*. Append-only history; never rewrite a past entry — supersede it. |
| `design-iterations.md` (iterations) | Test-feedback-driven design changes over time, dated, with status/category | A historical log of *what changed and why*, distinct from decisions. |
| `backlog.md` (merged) | Bugs + refactors + open non-decision issues, one file, each entry tagged `type: bug \| refactor \| issue` | Consolidates the old `bugs.md` + refactor notes + `issues.md`. One file, scannable. |

**Consolidation decisions (resolved):**
- `issues.md` is dissolved: open *decisions* live as `Status: open` entries in
  `alternatives.md`; non-decision open items become `type: issue` backlog entries.
- `bugs.md` + refactor notes + leftover issues merge into a single `backlog.md`
  with a `type:` tag — they're all tracked work items differing only by kind.

## 3. Boundary with iris-plan (the seam)

Decided: **plan seeds, log maintains.** No overlap.

- **`iris-plan`** stamps a feature's *initial* decision entries into
  `alternatives.md` at brainstorm time (next free D-id, append-only) and stops. It
  never re-touches a living doc afterward. The decision-entry *format* is defined
  in `iris-plan`'s templates (it writes the first ones).
- **`iris-log`** owns everything after: new D-ids during the build, marking
  entries `superseded`/reversed, appending iteration entries from test sessions,
  filing backlog items, and refreshing `AGENTS.md`. The *maintenance verbs*
  (supersede, curate, summarize) live here.

## 4. How it works (to design when built)

- **Trigger:** explicit `/iris-log` (e.g. "log this decision", "record this bug",
  "we changed X — update the docs"). Consider a session-start "read `AGENTS.md`"
  convenience; decide at build time.
- **Core loop:**
  1. Classify the input → decision · iteration · backlog item · TLDR-worthy state
     change.
  2. Append to the right doc in its existing format (don't reinvent structure;
     ingest the repo's current convention the way `iris-plan` does).
  3. If the change moves the repo's big picture, refresh the affected `AGENTS.md`
     line.
  4. Keep entries terse and scannable — this is a TLDR, not an essay.
- **Discipline it enforces:** append-only decision history (supersede, never
  rewrite), stable IDs, `AGENTS.md` always present-truth.

## 5. Build checklist — done

- [x] `~/.cursor/skills/iris-log/SKILL.md`, `disable-model-invocation: true`
- [x] Repo-ingest first (find the project's living docs + their conventions),
      same as `iris-plan` Phase 0
- [x] Classify → append → refresh-TLDR loop
- [x] Entry templates for: decision (with supersession), iteration, backlog
      item (`type` tag), plus `AGENTS.md` structure
- [x] `AGENTS.md` generator/refresher (Phase 3)
- [x] One-line boundary note added to `iris-plan` pointing ongoing maintenance here
