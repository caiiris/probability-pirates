# Curriculum Harvest

Agent-run workspace for mining open probability resources without external LLM
API calls.

## Loop

1. Add or update sources in `sources.json`.
2. Put manually downloaded/extracted text in `raw/`, or mark a source as
   `public-url` if the script can fetch it directly.
3. Run `npm run harvest:ingest`.
4. Ask a Cursor agent to process a bounded batch of chunk files into
   `candidates/`.
5. Cluster candidates, draft template briefs, and update `review-queue.md`.
6. Human-review Gate A/B/C decisions before anything becomes product code.

The raw source text and chunks are local research artifacts and are gitignored by
default. Commit source metadata, candidates, briefs, accepted decisions, and
implementation plans.

## Agent Rules

- Do not copy source wording into final learner-facing copy.
- Preserve source ids and reuse mode on every candidate.
- Treat unclear licenses as `permission-needed` or `inspiration-only`.
- Prefer problem families with deterministic `solve()` plans.
- Write only to your assigned batch file when running in parallel.

