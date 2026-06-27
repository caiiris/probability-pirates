# Spec: Grounded Socratic Tutor (Phase 3 delivery)

> **Phase 3.** The marquee "real learning" AI feature: a live, multi-turn tutor that guides a learner through a **hard, multi-step problem** — meeting them at each step — while staying grounded so it never teaches wrong math. This is the high-leverage thing a hint bank can't do. **Status: planned (Phase 3).** Not in the Phase-2 scope; this doc is the design + delivery contract for when we build it.
>
> Companion: [`spec-ai-assist`](spec-ai-assist.md) (the runtime AI infra this reuses), [`spec-practice`](spec-practice.md) (the problem/`solve()`/`explain()` shapes it grounds on), [`spec-ai-difficulty-annotation`](spec-ai-difficulty-annotation.md). Pairs with a Phase-2/2.5 **deterministic vetted-hint bank** for the foundations layer (see "Two layers").

## Why this exists (pedagogical rationale)

The single largest result in education is Bloom's **2-sigma**: 1:1 tutoring beats classroom instruction by ~two standard deviations. The mechanism is a responsive guide while a learner **works through a hard, multi-step problem**, scaffolding at the edge of competence (Vygotsky's ZPD) and fading support as they get it. **Thinking through complicated multi-step problems is where the deepest learning happens** — and a fixed, pre-written hint cannot support it, because a multi-step reasoning path branches in unbounded ways no bank can enumerate. That requires a model in the loop. This feature is that tutor.

## Two layers (this is not either/or)

The product wants both, for different parts of the learning arc:

- **Foundations layer — deterministic vetted hints** (Phase 2/2.5). Short, structured, single-answer problems (the current interaction kinds). The learner's wrong answer is *classified in code* into a misconception and served a pre-authored, vetted hint. Instant, exact, no runtime model. Great for retrieval drilling the high-leverage 20%.
- **Depth layer — this tutor** (Phase 3). A few **genuinely multi-step problems** where the value is the *reasoning*, guided live. Latency-tolerant, model-in-the-loop, grounded.

The tutor does NOT replace the foundations layer; it sits on top of it for hard problems.

## Prerequisites (what must exist before this ships)

1. **Multi-step problems with room to show work.** Today every interaction is a single computable answer (tap / fraction / MC / grid). The tutor needs problems with *intermediate steps* — i.e., the **harder, competition-style problems** the curriculum-harvest track is producing. The tutor and that hard-content track are the same investment.
2. **A code-computed answer + a canonical worked solution per problem.** Reuses the `solve()` (exact answer) and `explain()`/derivation (canonical steps) shapes. These are the tutor's ground truth.
3. **The AI runtime host + key** from [`spec-ai-assist`](spec-ai-assist.md) (server-side key, function reachable from the deployed site).

## The grounding contract (the core of the design)

The app's non-negotiable is **it never teaches wrong math.** An ungrounded tutor will, on some tangent, confidently assert a wrong step. So the tutor is **problem-scoped and solver-grounded**:

- Every turn, the function injects, as authoritative context: the **problem**, its **code-computed answer** (`solve`), and the **canonical worked solution** (`explain` steps). The model's job is to **guide the learner toward that known solution**, not to derive math from scratch.
- **Socratic / no-reveal:** the tutor asks the next question or gives the next smallest nudge; it does **not** state the final answer or dump the full solution. (Cognitive-debt protection — the learner does the thinking.)
- **Final answer stays code-verified.** When the learner commits an answer, correctness is decided by `solve()`, never by the model.
- **Honest limit:** the *conversational layer is best-effort*, not verified token-by-token. The model is anchored by the canonical solution, which bounds (does not eliminate) the chance it mis-states a step on the learner's specific tangent. We accept this for the dialog, because the **answer** and the **canonical path** remain authoritative. This tradeoff is stated plainly rather than pretended away.

## Interaction design

- **Multi-turn, step-aware dialog** scoped to one problem. The learner can show partial work / ask "is this right so far?" / "I'm stuck."
- **Hint ladder** (scaffolding → fading): nudge → pointed question → reveal the *next* step (never the whole solution) → as a last resort, walk one step and hand back control.
- **"Show your work" input** for intermediate reasoning (free text or structured sub-steps where possible).
- **Metacognitive prompts** ("what do you know? what are you trying to find?") — the Carraher/SAT "prime before solving" effect from the learning-science notes.
- **Advance criteria:** the tutor confirms a step against the canonical solution before moving on; the problem completes when the learner reaches the code-verified answer.

## Latency posture

Latency that would be unacceptable for a snappy single-answer hint is **fine here**: a learner mulls a hard problem for minutes, so a 1–2s tutor reply reads as "thinking," not lag. Stream tokens; show the instant fallback (the canonical worked solution) if the model is unavailable. (This is why the live model belongs on the *depth* layer, not the foundations layer.)

## Architecture

```mermaid
flowchart LR
    UI[Tutor dialog UI - multi-turn, scoped to one hard problem] -->|"turn + history + learner work"| Fn[/api/tutor]
    Fn --> Tok[verify token]
    Fn --> Ground[inject solve() answer + explain() canonical steps as ground truth]
    Fn --> Model[stream from Gemini - Socratic, no-reveal system prompt]
    Model --> UI
    UI -->|learner commits answer| Check[checkAnswer / solve = authoritative]
    Fn -.unavailable/off.-> Fallback[show canonical worked solution]
```

- Reuses the [`spec-ai-assist`](spec-ai-assist.md) function infra (`/api/tutor`), server-side key, token verification, structured payload.
- Multi-turn state held client-side; each turn re-sends the (bounded) history + the grounding payload.
- **Fallback (AI off / unreachable):** the problem degrades to "try it, then see the worked solution" — the app still teaches.

## Learning-science design choices

- **Socratic, no-reveal** — protects against cognitive debt; the learner generates the reasoning.
- **Scaffolding + fading** — the hint ladder gives the *least* help that unblocks, then withdraws.
- **Productive struggle** — the tutor waits/redirects rather than rescuing immediately.
- **Grounded in a canonical solution** — keeps the math correct and the guidance coherent.
- **Metacognition** — primes the learner to plan before computing.

## Decision + alternatives

**Decision (T1): a grounded, problem-scoped, Socratic tutor on verifiable multi-step problems — not an open chatbot.**

- **Chose:** a live tutor bound to a single hard problem, fed the code-verified answer + canonical steps, Socratic/no-reveal, with the final answer code-checked and the conversational layer accepted as best-effort.
- **Considered:**
  - **Open "ask anything" chatbot.** Rejected: a system prompt is not a security boundary, and unbounded Q&A will state wrong math — fatal to the app's core guarantee. (The brief also warned against bolting on a chatbot.)
  - **Deterministic vetted hints only.** Insufficient for multi-step reasoning (can't enumerate branching paths) — but kept as the complementary *foundations* layer.
  - **Tutor without grounding** (just a good system prompt). Rejected: drifts into wrong assertions; grounding in `solve`/`explain` is what makes it safe enough to ship.
  - **Tutor on open-ended proof problems.** Out of scope: the numeric domain gives us a verifiable answer + canonical steps to anchor on; open proofs lose that anchor.
- **Gaps / risks:**
  - Conversational layer is best-effort, not verified token-by-token (stated limit). Mitigated by canonical-solution grounding + final-answer code check.
  - Requires new multi-step problem content + a dialog UI — substantial; hence Phase 3.
  - Latency/cost per session (bounded; fine for low traffic on the free tier).
  - Moderation/age-appropriateness surface for a free-text dialog with minors — needs a safety filter + scope lock.
- **See also:** [`spec-ai-assist`](spec-ai-assist.md) (D96 LLM-not-judge; runtime infra), [`spec-practice`](spec-practice.md) (problem shapes), the curriculum-harvest hard-problem track.

## Out of scope (even within Phase 3 v1)

- Open-domain chat / topics beyond the current problem.
- Tutoring open-ended proofs (no verifiable anchor).
- Voice / multimodal.
- The tutor grading free-form reasoning as "correct" (final answer stays code-verified; the tutor guides, it doesn't certify intermediate steps as proven).

## Dependencies / phasing

- **Depends on:** multi-step problem content (curriculum hard-problem track), `solve()`/`explain()` per problem, the AI runtime host + key (spec-ai-assist).
- **Phase 3 v1:** one or a few hand-picked hard problems with a grounded tutor + fallback.
- **Later:** more problems, tutor-aware difficulty/adaptivity, tie-in with the learner model (which concepts to tutor next).
