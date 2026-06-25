import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { sampleSpace } from './sample-space';
import { checkAnswer } from '@/lib/checkAnswer';
import type {
  ConceptSlot,
  FillFractionVariant,
  FillTextVariant,
  Lesson,
  MultipleChoiceVariant,
  ProblemSlot,
} from '../types';

describe('sample-space (Unit 1.2) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(sampleSpace)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(sampleSpace.comingSoon).toBeFalsy();
    expect(sampleSpace.slots.length).toBeGreaterThan(0);
  });

  it('walks the vocabulary arc: welcome → outcome → space → list → two-coins → set/subset → subset-fill → event → pick-event → formula → MCQ → P(club) → three-coins → wrap', () => {
    const ids = sampleSpace.slots.map((s) => s.id);
    expect(ids).toEqual([
      'welcome',
      'define-outcome',
      'define-sample-space',
      'list-coin',
      'two-coins-grid',
      'define-set-subset',
      'subset-fill',
      'define-event',
      'pick-the-event',
      'classical-probability',
      'pick-the-sample-space',
      'prob-of-club',
      'three-coins',
      'wrap',
    ]);
  });

  it('places prob-of-club immediately after pick-the-sample-space so the 52-card sample space is fresh', () => {
    const ids = sampleSpace.slots.map((s) => s.id);
    expect(ids.indexOf('pick-the-sample-space')).toBe(ids.indexOf('prob-of-club') - 1);
    // And the k/N formula slot precedes it (the fill-fraction lays down k
    // over N — that move only makes sense after the formula is named).
    expect(ids.indexOf('classical-probability')).toBeLessThan(ids.indexOf('prob-of-club'));
  });

  it('places define-set-subset and subset-fill before define-event so subset is defined before it is used', () => {
    // The `define-event` definition statement says "subset of the sample
    // space" — that wording only lands if `subset` has already been
    // defined. Locking this order keeps a future shuffle from regressing.
    const ids = sampleSpace.slots.map((s) => s.id);
    expect(ids.indexOf('define-set-subset')).toBeLessThan(ids.indexOf('define-event'));
    expect(ids.indexOf('subset-fill')).toBeLessThan(ids.indexOf('define-event'));
    // subset-fill should immediately follow define-set-subset (the figure
    // on define-set-subset primes the fill-blank).
    expect(ids.indexOf('define-set-subset')).toBe(ids.indexOf('subset-fill') - 1);
  });

  it('places the classical-probability slot right after pick-the-event so the worked example can reuse the just-picked subset', () => {
    const ids = sampleSpace.slots.map((s) => s.id);
    expect(ids.indexOf('pick-the-event')).toBe(ids.indexOf('classical-probability') - 1);
  });

  it('mixes concept teaching with a tap-outcomes recap, two fill-texts, two MCQs, and a fill-fraction', () => {
    const problems = sampleSpace.slots.filter((s) => s.kind === 'problem') as ProblemSlot[];
    expect(problems.map((p) => p.interactionKind)).toEqual([
      'tap-outcomes',
      'fill-text',
      'multiple-choice',
      'multiple-choice',
      'fill-fraction',
      'fill-text',
    ]);
  });

  it('defines outcome, sample space, event, and probability-of-an-event as named definition callouts', () => {
    // Terminology lives in the `definition` field (blue accent, "Definition"
    // eyebrow), distinct from `theorem` (violet, used for derivable claims).
    // The visual difference cues the learner that the slot is teaching
    // vocabulary, not stating a result that needs proof.
    const slots = sampleSpace.slots as ConceptSlot[];
    const outcome = slots.find((s) => s.id === 'define-outcome');
    const space = slots.find((s) => s.id === 'define-sample-space');
    const event = slots.find((s) => s.id === 'define-event');
    const formula = slots.find((s) => s.id === 'classical-probability');
    expect(outcome?.definition?.name).toBe('Outcome');
    expect(space?.definition?.name).toBe('Sample space');
    expect(event?.definition?.name).toBe('Event');
    expect(formula?.definition?.name).toBe('Probability of an event');
    // Each statement must be non-empty (asserted by invariants too, but
    // pin it here so a future edit cannot silently strip the named idea).
    expect(outcome?.definition?.statement.length).toBeGreaterThan(0);
    expect(space?.definition?.statement.length).toBeGreaterThan(0);
    expect(event?.definition?.statement.length).toBeGreaterThan(0);
    expect(formula?.definition?.statement.length).toBeGreaterThan(0);
    // And none of these slots should use the `theorem` field — terminology
    // belongs on `definition`. If a future edit reaches for `theorem` for
    // any of these four, this test trips.
    for (const slot of [outcome, space, event, formula]) {
      expect(slot?.theorem).toBeUndefined();
    }
  });

  it('states the classical formula with explicit k and N variables, and connects back to Lesson 1', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'classical-probability') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      // The statement defines k and N as variables (so later lessons and
      // problems can lean on those letters), names both halves of the
      // formula, and carries the equally-likely caveat. The mathy
      // variables here are a deliberate escalation from Lesson 1's
      // "favorable / total" prose — same idea, named for re-use.
      const statement = slot.definition?.statement ?? '';
      const lower = statement.toLowerCase();
      expect(statement).toMatch(/\bk\b/);
      expect(statement).toMatch(/\bN\b/);
      // The formula itself, written out (loose match — could be P(event)
      // = k/N or P = k/N or similar).
      expect(lower).toMatch(/k\s*\/\s*n/);
      expect(lower).toMatch(/event/);
      expect(lower).toMatch(/sample space/);
      expect(lower).toMatch(/equally likely|all outcomes/);

      // The body should pin the connection back to Lesson 1's "favorable
      // / total" framing so the new vocabulary reads as an upgrade, not
      // a fresh start.
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/lesson 1|earlier|previously|same formula/);
      // And the body should USE the formula at least once with a worked
      // example (die-even is the canonical one).
      expect(body).toMatch(/3\s*\/\s*6|3\/6/);
      // The body must show k and N in at least one worked example — that
      // is the point of introducing variables, to make them feel
      // operational, not just symbolic.
      expect(body).toMatch(/k\s*=\s*\d/);
      expect(body).toMatch(/n\s*=\s*\d/);
    }
  });

  it('asks P(club) on the prob-of-club fill-fraction, with k=13 and N=52 keyed to a deck-of-cards context', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'prob-of-club');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-fraction');
      const v = slot.variants[0] as FillFractionVariant;
      expect(v.numerator).toBe(13);
      expect(v.denominator).toBe(52);
      // The context blurb defines "suit = 13 cards" so the learner has
      // what they need without leaving the slot. Without it, this would
      // require outside knowledge about decks.
      expect(v.context?.length ?? 0).toBeGreaterThan(0);
      expect(v.context?.toLowerCase()).toMatch(/suit|13 cards/);
      // Labels should name k and N explicitly (this is the lesson where
      // those variables get introduced).
      expect(v.numeratorLabel ?? '').toMatch(/k\b/);
      expect(v.denominatorLabel ?? '').toMatch(/N\b/);

      // Wrong-answer feedback must cover the canonical misconceptions.
      // 4/52 (counted suits, not cards in the event) is the most common
      // miss, so it deserves a tailored hint.
      const wrongKeys = Object.keys(v.feedbackByWrongAnswer ?? {});
      expect(wrongKeys).toContain('4/52');
    }
  });

  it('does not give away the unsimplified 13/52 fraction in the prob-of-club prompt, context, or default feedback', () => {
    // The grader wants k/N in raw form (13/52). If the prompt or
    // default feedback spelled "13/52", the question becomes a copy
    // exercise. The afterNote and explanation are post-attempt and ARE
    // allowed to show the answer.
    const slot = sampleSpace.slots.find((s) => s.id === 'prob-of-club');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillFractionVariant;
      const learnerVisible = [v.prompt, v.context ?? '', v.feedbackDefault]
        .join(' ')
        .toLowerCase();
      expect(learnerVisible).not.toMatch(/13\s*\/\s*52/);
      expect(learnerVisible).not.toMatch(/1\s*\/\s*4/);
    }
  });

  it('introduces curly-brace set notation on the same slot where it first appears', () => {
    // Sample-space is the first lesson on the live path that uses `{...}`
    // notation. An 8\u201315 year old who has not seen sets in school is
    // staring at unfamiliar symbols otherwise, so the same slot that
    // first shows `{H, T}` must also gloss what the braces mean.
    const slot = sampleSpace.slots.find((s) => s.id === 'define-sample-space') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/curly braces/);
      // The gloss must name the term "set" and explain it in plain
      // English (no duplicates, order does not matter).
      expect(body).toMatch(/set/);
      expect(body).toMatch(/no duplicates|no repeats|order does not matter|no fixed order/);
    }
  });

  it('distinguishes event from outcome explicitly in the body (no "is the difference?" left to the reader)', () => {
    // The most common reader confusion at this stage is "what is the
    // difference between an outcome and an event?" The body must
    // answer that directly, not leave the reader to infer it from
    // syntax. Specifically: outcome is one specific result; event is
    // a group / subset of outcomes.
    const slot = sampleSpace.slots.find((s) => s.id === 'define-event') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      const body = (slot.body ?? []).join(' ').toLowerCase();
      // Outcome described as singular.
      expect(body).toMatch(/one specific|one result|single result|a single outcome|one outcome/);
      // Event described as a set / group / subset of outcomes.
      expect(body).toMatch(/(set|group|bag|bundle|subset).{0,40}outcomes?/);
      // Definition statement should land "subset of the sample space"
      // (or equivalent "set of outcomes") so the body and callout agree.
      const statement = slot.definition?.statement.toLowerCase() ?? '';
      expect(statement).toMatch(/subset of the sample space|set of outcomes/);
    }
  });

  it('defines subset on its own slot, with both a definition callout and a playful picker figure', () => {
    // Set/subset is the prereq for "event is a subset of the sample
    // space," and used to live as five paragraphs inside `define-event`.
    // Splitting it out keeps `define-event` skimmable and gives subset
    // its own beat: blue definition callout + interactive picker so the
    // word lands by hand, not by reading.
    const slot = sampleSpace.slots.find((s) => s.id === 'define-set-subset') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      // Definition (not theorem) — terminology, not a derivable claim.
      expect(slot.definition?.name).toBe('Subset');
      expect(slot.definition?.statement.length).toBeGreaterThan(0);
      expect(slot.theorem).toBeUndefined();
      // The statement must define subset relative to a set ("of a set"
      // or "from a set"). Permissive so rewordings keep passing.
      expect((slot.definition?.statement ?? '').toLowerCase()).toMatch(/of (the |a )?set|from (the |a )?set/);

      // The body must briefly cover set in plain English so the
      // definition's "of a set" reads as familiar, not new jargon.
      const body = (slot.body ?? []).join(' ').toLowerCase();
      expect(body).toMatch(/curly braces|collection|set/);
      // And it should cover the boundary cases (empty set, full set
      // as a subset), since those are the cases the picker exposes.
      expect(body).toMatch(/empty set|none of them|empty/);
      expect(body).toMatch(/full set|all the items|all three|every|whole set/);

      // The playful subset picker figure must be wired up.
      expect(slot.figure?.kind).toBe('subset-picker');
      if (slot.figure?.kind === 'subset-picker') {
        expect(slot.figure.caption?.length).toBeGreaterThan(0);
      }
    }
  });

  it('accepts every valid 2-item subset of {apple, orange, watermelon, banana} on the subset-fill problem and rejects anything else', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'subset-fill');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;

      // All twelve ordered renderings of the six 2-item subsets must
      // grade correct. The author wrote the regex against lowercase /
      // trimmed input, so we check case and separator variants too.
      const valid2ItemRenderings = [
        // Each unordered pair, in alphabetical order then reversed.
        'apple, orange',
        'orange, apple',
        'apple, watermelon',
        'watermelon, apple',
        'apple, banana',
        'banana, apple',
        'orange, watermelon',
        'watermelon, orange',
        'orange, banana',
        'banana, orange',
        'watermelon, banana',
        'banana, watermelon',
        // Separator / case / brace variants on a sampled pair.
        'apple,orange',
        'apple orange',
        'Apple, Orange',
        'APPLE, ORANGE',
        '{apple, orange}',
        '{watermelon, banana}',
      ];
      for (const text of valid2ItemRenderings) {
        expect(checkAnswer(v, { text }).wasCorrect, `expected "${text}" correct`).toBe(true);
      }

      // Wrong-shape inputs: single fruit, all four fruits, duplicate
      // fruit, unknown fruit, empty. None of these is a valid 2-item
      // subset of the four-fruit set.
      const wrong = [
        '',
        'apple',
        'apple, orange, watermelon',
        'apple, orange, watermelon, banana',
        'apple, apple',
        'apple, grape',
        '{}',
        '1, 2',
      ];
      for (const text of wrong) {
        expect(checkAnswer(v, { text }).wasCorrect, `expected "${text}" wrong`).toBe(false);
      }
    }
  });

  it('does not give away a specific 2-item subset in the subset-fill prompt or feedback', () => {
    // The fill has six valid answers. If the prompt or feedback names
    // one verbatim — either by writing it in braces like "{apple, orange}"
    // or by naming a 2-fruit pair in prose — the question becomes a
    // copy-the-example exercise.
    const slot = sampleSpace.slots.find((s) => s.id === 'subset-fill');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillTextVariant;
      const learnerVisible = [
        v.prompt,
        v.context ?? '',
        v.feedbackDefault,
        v.placeholder ?? '',
        ...Object.values(v.feedbackByWrongAnswer ?? {}),
      ]
        .join(' ')
        .toLowerCase();

      const FRUITS = ['apple', 'orange', 'watermelon', 'banana'] as const;

      // Any braced group {...} must list all four fruits (the full set
      // reference) or zero fruits. A 2-or-3-of-4 brace group would be a
      // verbatim answer or a near-miss giveaway.
      const bracedGroups = learnerVisible.match(/\{[^}]*\}/g) ?? [];
      for (const group of bracedGroups) {
        const fruits = FRUITS.filter((f) => group.includes(f));
        expect(
          fruits.length === 0 || fruits.length === FRUITS.length,
          `braced group "${group}" leaks a partial subset (${fruits.length} of ${FRUITS.length} fruits)`,
        ).toBe(true);
      }

      // Outside the braced groups, no "X, Y" pair of two distinct fruits
      // should appear in prose either.
      const stripped = learnerVisible.replace(/\{[^}]*\}/g, '');
      for (let i = 0; i < FRUITS.length; i++) {
        for (let j = 0; j < FRUITS.length; j++) {
          if (i === j) continue;
          const pair = new RegExp(`${FRUITS[i]}[, ]+${FRUITS[j]}`);
          expect(
            stripped,
            `prose leaks the 2-item subset "${FRUITS[i]}, ${FRUITS[j]}"`,
          ).not.toMatch(pair);
        }
      }

      // The explanation IS allowed to list the six subsets — that is
      // the post-attempt teaching moment.
      const explanation = (v.explanation ?? '').toLowerCase();
      expect(explanation).toMatch(/apple.+orange|apple.+watermelon|apple.+banana/);
    }
  });

  it('upgrades event in the callout to "subset of the sample space"', () => {
    const event = sampleSpace.slots.find((s) => s.id === 'define-event') as
      | ConceptSlot
      | undefined;
    expect(event?.kind).toBe('concept');
    if (event?.kind === 'concept') {
      const statement = event.definition?.statement.toLowerCase() ?? '';
      expect(statement).toMatch(/subset/);
      expect(statement).toMatch(/sample space/);
    }
  });

  it('renders the two-coins-grid figure as an autonomous looping animation (no learner input)', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'two-coins-grid') as
      | ConceptSlot
      | undefined;
    expect(slot?.kind).toBe('concept');
    if (slot?.kind === 'concept') {
      expect(slot.figure?.kind).toBe('two-coins-grid');
      if (slot.figure?.kind === 'two-coins-grid') {
        // A non-empty caption is required so the figure is interpretable
        // on its own without the body text.
        expect(slot.figure.caption?.length).toBeGreaterThan(0);
      }
      // The slot is conceptually a concept, not a problem. The animation
      // is a figure attached to the slot (declarative chrome), not an
      // interaction the learner has to drive.
      expect(slot.kind).toBe('concept');
    }
  });

  it('does NOT preempt the HT-vs-TH cognitive conflict (saved for equally-likely-outcomes)', () => {
    // The two-coins-grid slot lists HT and TH as separate outcomes but
    // does not stage the "are these the same?" tension. That hook is
    // reserved for the next lesson; preempting it here would steal the
    // punchline.
    const slot = sampleSpace.slots.find((s) => s.id === 'two-coins-grid') as
      | ConceptSlot
      | undefined;
    if (slot?.kind === 'concept') {
      const text = [slot.prompt ?? '', ...(slot.body ?? [])].join(' ').toLowerCase();
      // No phrasing that draws out "wait, are HT and TH actually
      // different?" — that question lands in the next lesson.
      expect(text).not.toMatch(/are.*the same|same outcome|equally likely/);
    }
  });

  it('asks "at least one heads" as the event MCQ; correct answer is the 3-element subset', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'pick-the-event');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('multiple-choice');
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('has-h');
      // Distractors test specific misconceptions: "exactly two heads,"
      // "exactly one heads," and "the entire sample space" (forgetting
      // that TT does not qualify).
      const optionIds = v.options.map((o) => o.id).sort();
      expect(optionIds).toEqual(['all', 'has-h', 'just-hh', 'one-h']);
    }
  });

  it('does not give away the right answer in the MCQ wrong-answer feedback', () => {
    // Wrong-answer feedback should explain why the pick fails, not name
    // the right option. We assert this by checking that no wrong-answer
    // feedback string contains a literal cited substring of the correct
    // option label. The check is intentionally specific to known cases
    // so it stays meaningful as content evolves.
    const slot = sampleSpace.slots.find((s) => s.id === 'pick-the-event');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      // The right answer is "{HH, HT, TH}". If a wrong-answer feedback
      // string spelled it out verbatim, the question becomes a giveaway.
      const giveaway = '{HH, HT, TH}';
      for (const [optionId, feedback] of Object.entries(v.feedbackByOption)) {
        if (optionId === v.correctOptionId) continue;
        expect(feedback).not.toContain(giveaway);
      }
    }
  });

  it('asks the card-draw sample-space MCQ; correct answer is the full 52-card list', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'pick-the-sample-space');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.correctOptionId).toBe('cards');
      // All four distractors test wrong-granularity misconceptions
      // (color, suit, rank, full list). Walk all four feedback strings
      // to confirm none of them literally names the right answer.
      for (const [optionId, feedback] of Object.entries(v.feedbackByOption)) {
        if (optionId === v.correctOptionId) continue;
        expect(feedback.toLowerCase()).not.toMatch(/52 specific cards|all 52/);
      }
    }
  });

  it('asks the three-coin fill-text question and accepts all 8 valid outcomes', () => {
    const slot = sampleSpace.slots.find((s) => s.id === 'three-coins');
    expect(slot?.kind).toBe('problem');
    if (slot?.kind === 'problem') {
      expect(slot.interactionKind).toBe('fill-text');
      const v = slot.variants[0] as FillTextVariant;

      // Every one of the 8 valid 3-flip outcomes must grade correct, with
      // case and spacing both flexible per the owner's spec.
      for (const outcome of ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT']) {
        expect(checkAnswer(v, { text: outcome }).wasCorrect).toBe(true);
        expect(checkAnswer(v, { text: outcome.toLowerCase() }).wasCorrect).toBe(true);
        // With spaces between letters.
        const spaced = outcome.split('').join(' ');
        expect(checkAnswer(v, { text: spaced }).wasCorrect).toBe(true);
      }

      // Wrong inputs must be rejected without crashing.
      for (const wrong of ['HH', 'HHTH', 'HHX', '123', '']) {
        expect(checkAnswer(v, { text: wrong }).wasCorrect).toBe(false);
      }
    }
  });

  it('does not leak any of the 8 valid outcomes through the prompt, context, or default feedback', () => {
    // The fill-text question is open-ended (any of 8 is correct), but
    // copy should still avoid spelling a specific outcome — that turns
    // the question into a copy-the-example exercise.
    const slot = sampleSpace.slots.find((s) => s.id === 'three-coins');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as FillTextVariant;
      const learnerVisible = [
        v.prompt,
        v.context ?? '',
        v.feedbackDefault,
        v.placeholder ?? '',
        ...Object.values(v.feedbackByWrongAnswer ?? {}),
      ]
        .join(' ')
        .toUpperCase();
      for (const outcome of ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT']) {
        // Look for the outcome as a standalone word so substrings like
        // "HEADS" do not false-match.
        const pattern = new RegExp(`\\b${outcome}\\b`);
        expect(pattern.test(learnerVisible), `learner-visible copy contains "${outcome}"`).toBe(false);
      }
      // The explanation is allowed to list the full sample space — that
      // is the post-attempt teaching moment.
      expect(v.explanation?.toUpperCase()).toMatch(/HHH.+TTT/);
    }
  });

  it('segues to equally-likely-outcomes on the wrap and previews the formula\u2019s pitfalls', () => {
    const wrap = sampleSpace.slots.find((s) => s.id === 'wrap');
    expect(wrap?.kind).toBe('wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBe('equally-likely-outcomes');
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
      // The wrap should hint that the next lesson stress-tests the
      // favorable / total formula (that is its whole job).
      expect(wrap.body.toLowerCase()).toMatch(/favorable|formula|works in lots of cases|not all/);
    }
  });

  it('rejects an empty figure caption at validation time', () => {
    const broken: Lesson = structuredClone(sampleSpace);
    const slot = broken.slots.find((s) => s.id === 'two-coins-grid') as ConceptSlot | undefined;
    if (slot?.kind === 'concept' && slot.figure?.kind === 'two-coins-grid') {
      slot.figure.caption = '   ';
    }
    expect(() => assertLessonInvariants(broken)).toThrow();
  });
});
