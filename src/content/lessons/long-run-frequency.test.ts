import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { longRunFrequency } from './long-run-frequency';
import type {
  ConceptSlot,
  Lesson,
  MultipleChoiceVariant,
  ProblemSlot,
  ScrubTrialsVariant,
  SimulateProportionVariant,
} from '../types';

describe('long-run-frequency (Unit 1.1) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(longRunFrequency)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(longRunFrequency.comingSoon).toBeFalsy();
    expect(longRunFrequency.slots.length).toBeGreaterThan(0);
  });

  it('weaves problem slots through the teaching: puzzle MCQ + coin scrub + apply MCQ + die sim + two apply MCQs', () => {
    const kinds = new Set(longRunFrequency.slots.map((s) => s.kind));
    expect(kinds.has('concept')).toBe(true);
    expect(kinds.has('problem')).toBe(true);
    expect(kinds.has('wrap')).toBe(true);

    const problems = longRunFrequency.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    // Puzzle gut-check (commit-once MCQ), the coin slider, the first apply
    // MCQ, the hands-on die generalization, then two more apply MCQs
    // (gambler's fallacy + wobble). Two distinct manipulatives — a slider
    // and a button-driven roller — keep the back half from being a wall of
    // multiple-choice screens.
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'multiple-choice',
      'scrub-trials',
      'multiple-choice',
      'simulate-proportion',
      'multiple-choice',
      'multiple-choice',
    ]);
  });

  it('walks the discovery-first arc: welcome → puzzle → motivate sim → coin demo → name → apply → die generalization → gambler → wobble → fun fact → wrap', () => {
    const ids = longRunFrequency.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'the-puzzle',
      'lets-flip',
      'scrub-demo',
      'long-run-share',
      'unknown-coin',
      'die-roll',
      'streak-trap',
      'wobble-test',
      'frequentists',
      'wrap',
    ]);
  });

  it('discovers convergence on the slider BEFORE naming it (theorem-after-experience)', () => {
    const ids = longRunFrequency.slots.map((s) => s.id);
    // Sim comes before the named theorem — the user sees the share settle,
    // then we put a name on what they saw. This is the explicit owner ask
    // and matches D77/D88's discovery-first pedagogy.
    expect(ids.indexOf('scrub-demo')).toBeLessThan(ids.indexOf('long-run-share'));
    // The motivate-the-sim slot ("let's actually flip some") sits between
    // the puzzle and the sim so the learner has a reason to drag.
    expect(ids.indexOf('the-puzzle')).toBeLessThan(ids.indexOf('lets-flip'));
    expect(ids.indexOf('lets-flip')).toBeLessThan(ids.indexOf('scrub-demo'));
  });

  it('generalizes from the coin to any probability with a hands-on die roller (not just a static chart)', () => {
    const ids = longRunFrequency.slots.map((s) => s.id);
    // The die generalization is an INTERACTIVE simulate-proportion slot —
    // the learner rolls a die and watches the share of sixes settle near
    // 1/6 — rather than a read-only figure. It sits after the named theorem
    // so "settling works for any p, not just 1/2" lands as something the
    // learner does, and before the wobble MCQ.
    expect(ids.indexOf('long-run-share')).toBeLessThan(ids.indexOf('die-roll'));
    expect(ids.indexOf('die-roll')).toBeLessThan(ids.indexOf('wobble-test'));

    const slot = longRunFrequency.slots.find((s) => s.id === 'die-roll');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('simulate-proportion');
      const v = slot.variants[0] as SimulateProportionVariant;
      expect(v.scenario).toBe('die-six');
      expect(v.targetProbability).toBeCloseTo(1 / 6, 3);
      // Engagement gate: the learner must actually roll a good number of
      // times before Continue unlocks, so they see the share steady.
      expect(v.minTrials).toBeGreaterThan(0);
    }
  });

  it("orders the apply MCQs after naming, then closes with the frequentist fun-fact", () => {
    const ids = longRunFrequency.slots.map((s) => s.id);
    expect(ids.indexOf('long-run-share')).toBeLessThan(ids.indexOf('unknown-coin'));
    expect(ids.indexOf('unknown-coin')).toBeLessThan(ids.indexOf('wobble-test'));
    expect(ids.indexOf('wobble-test')).toBeLessThan(ids.indexOf('frequentists'));
  });

  it('configures the scrub demo with a coin scenario, a 50% reference, and a low engagement gate', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'scrub-demo');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const variant = slot.variants[0] as ScrubTrialsVariant;
      expect(variant.scenario).toBe('coin');
      expect(variant.targetProbability).toBe(0.5);
      expect(variant.minN).toBeLessThan(variant.reachN);
      expect(variant.reachN).toBeLessThanOrEqual(variant.maxN);
      // Determinism: every render of the bar at the same N should land on
      // the same H/T split, so the slider must declare its seed.
      expect(typeof variant.seed).toBe('number');
    }
  });

  it('frames the welcome with a probability pull-quote that connects to last lesson\u2019s counting view', () => {
    const welcome = longRunFrequency.slots.find((s) => s.id === 'welcome') as
      | ConceptSlot
      | undefined;
    expect(welcome?.kind).toBe('concept');
    if (welcome?.kind === 'concept') {
      expect(welcome.quote?.text).toBeTruthy();
      expect(welcome.quote?.attribution).toBeTruthy();
      // The opening hooks back to how-likely's counting framing so the
      // lesson reads as a continuation, not a fresh start.
      expect(welcome.body?.some((p) => /count/i.test(p))).toBe(true);
    }
  });

  it('poses the puzzle as a commit-once MCQ before naming the idea', () => {
    const ids = longRunFrequency.slots.map((s) => s.id);
    expect(ids.indexOf('the-puzzle')).toBeLessThan(ids.indexOf('long-run-share'));

    const puzzle = longRunFrequency.slots.find((s) => s.id === 'the-puzzle');
    expect(puzzle?.kind).toBe('problem');
    if (puzzle?.kind === 'problem') {
      // Gut-check, not a graded quiz: one answer, no retry, Continue
      // unlocks right or wrong. The next slot's theorem resolves it.
      expect(puzzle.commitOnce).toBe(true);
      expect(puzzle.interactionKind).toBe('multiple-choice');
      const v = puzzle.variants[0] as MultipleChoiceVariant;
      // The correct option states the lesson's thesis — long-run, not a
      // 10-flip promise.
      expect(v.correctOptionId).toBe('longrun');
      // Distractors include the gambler's-fallacy trap so we name and
      // dismiss it here rather than in a later lesson.
      const optionIds = v.options.map((o) => o.id).sort();
      expect(optionIds).toContain('gambler');
      expect(optionIds).toContain('biased');
    }
  });

  it('names "Probability" as a theorem after the slider, defines "event" up front, and stays out of jargon', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'long-run-share') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toBe('Probability');
      expect(slot.theorem?.statement.length).toBeGreaterThan(0);
      // The theorem uses the word "event," so the body must define it
      // before the reader leaves the slot. The first body paragraph names
      // the term explicitly.
      const firstBody = (slot.body?.[0] ?? '').toLowerCase();
      expect(firstBody).toMatch(/event/);
      expect(firstBody).toMatch(/something that can happen|happens|either happens/);
      // Audience is 8\u201315; the body should not lean on jargon like
      // "convergence," "experiment," or "long-run share" in the rendered
      // copy. The theorem callout is the only place "event" appears as a
      // technical term; other jargon stays out.
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).not.toMatch(/convergence|experiment|long-run share/);
    }
  });

  it('attaches a settling-line figure to the named-theorem slot (visual proof of convergence)', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'long-run-share') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.figure?.kind).toBe('settling-line');
      if (slot.figure?.kind === 'settling-line') {
        expect(slot.figure.scenario).toBe('coin');
        expect(slot.figure.targetProbability).toBe(0.5);
        // The figure must be deterministic — same seed every render so
        // the line on screen is reproducible and a learner returning to
        // the slot does not see a different convergence picture.
        expect(typeof slot.figure.seed).toBe('number');
        // A non-empty caption is required so the figure is interpretable
        // on its own (matters for screen readers and quick scanning).
        expect(slot.figure.caption?.length).toBeGreaterThan(0);
      }
    }
  });

  it('drills the gambler\u2019s fallacy on its own and separates independence from convergence', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'streak-trap');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      // The trap: after a streak, the next flip is "still 1/2." The two
      // wrong options are the two flavors of the fallacy (overdue / hot
      // streak).
      expect(v.correctOptionId).toBe('half');
      const optionIds = v.options.map((o) => o.id).sort();
      expect(optionIds).toEqual(['half', 'less', 'more']);
      // The wrong-answer feedback must actually name the fallacy.
      expect(v.feedbackByOption.less).toMatch(/gambler|owed|score|memory/i);
      // The deep point: convergence is NOT the coin correcting itself. The
      // explanation has to make the independence-vs-convergence distinction
      // explicit, or the lesson teaches the fallacy by omission.
      const explanation = (v.explanation ?? '').toLowerCase();
      expect(explanation).toMatch(/not because|swamped|barely move|on its own|stands on its own/);
    }
  });

  it('asks the apply MCQ — "estimate P on a weird coin" — and rewards "many flips"', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'unknown-coin');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      // Three options: assume 1/2 / few flips / many flips. Right answer
      // is the long-run measurement.
      expect(v.options.map((o) => o.id).sort()).toEqual(['few', 'half', 'many']);
      expect(v.correctOptionId).toBe('many');
    }
  });

  it('asks the wobble-test MCQ — "what would surprise you?" — and rewards "30 heads"', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'wobble-test');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      // Right answer is the result that lies far outside the wobble.
      expect(v.correctOptionId).toBe('h30');
      // The "exactly 50" option earns its honest fun-fact feedback
      // ("getting EXACTLY 50 is rare") rather than being a trick.
      expect(v.feedbackByOption.h50).toMatch(/exactly|rare|uncommon/i);
    }
  });

  it('puts the frequentist fun-fact on its own page and names statistics + ML', () => {
    const slot = longRunFrequency.slots.find((s) => s.id === 'frequentists') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const text = [slot.prompt ?? '', ...(slot.body ?? [])].join(' ').toLowerCase();
      // Both views named.
      expect(text).toMatch(/frequentist/);
      expect(text).toMatch(/classical/);
      // The "do they conflict?" reconciliation is the slot's payload.
      expect(text).toMatch(/disagree|conflict|both|nope/);
      // Outward pointers so the learner sees this as the foundation of
      // bigger fields, not a one-off trick.
      expect(text).toMatch(/statistics|machine learning/);
    }
  });

  it('segues to the next unit lesson (sample-space) on the wrap', () => {
    const wrap = longRunFrequency.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('sample-space');
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });

  it('rejects an empty quote attribution at validation time', () => {
    const broken: Lesson = structuredClone(longRunFrequency);
    const slot = broken.slots.find((s) => s.id === 'welcome') as ConceptSlot | undefined;
    if (slot?.kind === 'concept' && slot.quote) {
      slot.quote.attribution = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow();
  });
});
