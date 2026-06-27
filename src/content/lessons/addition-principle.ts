import type { Lesson } from '../types';

/**
 * Lesson 6 — "The addition principle" (Unit 2.5, D95).
 *
 * Audience: 8–15 year olds. Voice matches L1–L5: declarative, grounded,
 * no em dashes, no AI-isms, no staccato fragment lists.
 *
 * Pedagogical job: name the OR move. Multiplication (L5) handled
 * compound choices where you pick one thing AND another. The addition
 * principle handles disjoint cases where you pick one thing OR another.
 * Together, AND/OR are the foundational counting toolkit. Most word
 * problems need both, and the recognition skill — which to use? — is
 * the actual takeaway.
 *
 * Why this lives in Unit 2, not Unit 4 (D95): the roadmap originally
 * paired addition with inclusion-exclusion in Unit 4 ("Counting
 * techniques"). But addition is conceptually SIMPLER than
 * multiplication, and the two are taught as a pair in every classical
 * combinatorics text. Splitting them by 8 lessons left learners with
 * half the rule for everything in between. Inclusion-exclusion remains
 * in Unit 4 as the meaningful "what if cases overlap?" follow-up.
 *
 *   1. welcome       — frame: AND multiplies, what about OR?
 *   2. the-puzzle    — commit-once MCQ: sandwich OR salad. Most
 *                       common miss is 15 = 3 × 5 (multiply-by-reflex
 *                       after L5).
 *   3. resolve       — concept: why this is OR / addition, not AND.
 *                       The lists do not chain; they sit side by side.
 *   4. the-rule      — concept + theorem callout: addition principle.
 *                       Statement names disjoint condition without
 *                       jargon ("no option counts in both types").
 *   5. and-vs-or     — concept: same closet, both rules. 3 shirts
 *                       AND 2 pants = 6 outfits. 3 shirts OR 2 pants
 *                       = 5 picks. Different question, different move.
 *   6. mixed-practice — MCQ: (4 sandwiches OR 3 salads) AND 2 drinks
 *                       = 7 × 2 = 14. Tests recognition end-to-end.
 *   7. wrap          — close, preview inclusion-exclusion for the
 *                       overlapping-cases case. No segue to the next
 *                       stub.
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (same as L2, L4, L5).
 *   - Theorem callout, not definition: this is a derivable claim about
 *     when totals combine by addition, not a new term.
 *   - The recognition slot (`and-vs-or`) uses the SAME closet as L5's
 *     tree figure, so the contrast lands as "same nouns, different
 *     question."
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const additionPrinciple: Lesson = {
  id: 'addition-principle',
  number: 6,
  title: 'The addition principle',
  blurb: 'When choices are disjoint, the counts add. The OR rule to pair with multiplication.',
  estimatedMinutes: 5,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'AND multiplies. What does OR do?',
      body: [
        'Last lesson you saw the multiplication principle: when you make a sequence of choices (a shirt AND a pair of pants), the option counts multiply.',
        'But some problems are not sequences. You pick a sandwich OR a salad. You take the bus OR the train. The lists do not chain together — they sit side by side. That kind of problem has its own counting rule, and it is the other half of the toolkit.',
      ],
    },

    // Commit-once trap. Right after multiplication-principle, learners
    // are primed to multiply. The OR phrasing is supposed to trip that
    // reflex. 15 = 3 × 5 is the canonical miss; the resolve slot turns
    // it into the discovery beat for addition.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      commitOnce: true,
      variants: [
        {
          id: 'sandwich-or-salad',
          interactionKind: 'multiple-choice',
          prompt:
            'A diner offers 3 sandwiches and 5 salads. You can order any one item from the menu. How many choices do you have?',
          options: [
            { id: 'multiply', label: '15' },
            { id: 'add', label: '8' },
            { id: 'sandwich-only', label: '3' },
            { id: 'salad-only', label: '5' },
          ],
          correctOptionId: 'add',
          feedbackCorrect:
            'Right. You pick one item from a list of 3 sandwiches OR 5 salads, so the total is 3 + 5 = 8.',
          feedbackDefault:
            'You are picking one item, not a pair. The two lists do not chain together. How many items are on the combined menu?',
          feedbackByOption: {
            multiply:
              '15 is 3 × 5, the multiplication move from last lesson. That rule is for picking a sandwich AND a salad. Here you pick one item, either a sandwich or a salad, so the rule is different.',
            'sandwich-only':
              'You counted only the sandwiches. The salads also count as valid choices.',
            'salad-only':
              'You counted only the salads. The sandwiches also count as valid choices.',
          },
          explanation:
            'You pick one item from the combined menu. The 3 sandwiches and the 5 salads are all valid orders, so the total is 3 + 5 = 8 choices. Multiplication would apply if you picked a sandwich AND a salad together.',
        },
      ],
    },

    // Resolve. Why this is OR, not AND. The lists do not chain.
    {
      id: 'resolve',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Side by side, not in sequence',
      prompt:
        'Multiplication counts sequences of choices. Addition counts disjoint lists of choices.',
      body: [
        'When you pick a shirt AND a pair of pants, each shirt pairs with each pair of pants, and the count of outfits is 3 × 2. Each leaf of the tree is a pair, so the count grows.',
        'When you pick a sandwich OR a salad, you do not chain the lists. The 3 sandwiches and the 5 salads sit on the menu together, and you choose one item from the combined list. The total is 3 + 5, because every sandwich is a valid order and every salad is too.',
      ],
    },

    // The rule. Theorem callout (violet) — a CLAIM about when totals
    // combine by addition, not a new term to name. Statement avoids the
    // word "disjoint" in favor of plain English.
    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'Two ways to combine choices, one for each connecting word.',
      theorem: {
        name: 'Addition principle',
        statement:
          'If you have m options of one type and n options of a different type, and no option counts in both types, then the total number of ways to pick one option is m + n.',
      },
      body: [
        'The "no option counts in both types" condition matters. If a sandwich somehow also counted as a salad (say, a salad sandwich), you would double-count it by adding 3 + 5. A later lesson handles overlapping cases with the inclusion-exclusion rule. For now, treat the cases as separate.',
        'The principle extends to more than two cases. m + n + p + ... for any number of separate types, as long as no item lives in two of them.',
      ],
    },

    // The recognition slot. Same closet on both rules so the contrast
    // is concrete. No figure needed; the parallel structure of the
    // body carries it.
    {
      id: 'and-vs-or',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'AND multiplies, OR adds',
      prompt: 'Same closet, two questions, two answers.',
      body: [
        'Suppose your closet has 3 shirts and 2 pairs of pants. The question changes the math.',
        '"How many outfits, with one shirt and one pair of pants?" That is AND. Each shirt pairs with each pair of pants, so 3 × 2 = 6 outfits.',
        '"How many single items can you grab, either a shirt or a pair of pants?" That is OR. The lists sit side by side, so 3 + 2 = 5 picks.',
        'Watch the connecting word: AND for sequences (multiply), OR for disjoint lists (add). Almost every counting word problem is some combination of these two moves.',
      ],
    },

    // Mixed-practice MCQ. Tests recognition end-to-end: addition
    // INSIDE multiplication. The two trap distractors capture the two
    // canonical misconceptions on a multi-rule problem:
    //   - 24 = 4 × 3 × 2  (treated everything as AND)
    //   - 9  = 4 + 3 + 2  (treated everything as OR)
    // The "forgot drinks" distractor (7) reinforces that the OR inside
    // must still be combined with the drink choice via AND.
    {
      id: 'mixed-practice',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'combo-meal',
          interactionKind: 'multiple-choice',
          prompt:
            'A diner offers 4 sandwiches and 3 salads. You order one main course (sandwich or salad) plus one drink, with 2 drink options. How many possible orders are there?',
          options: [
            { id: 'all-add', label: '9' },
            { id: 'all-multiply', label: '24' },
            { id: 'correct', label: '14' },
            { id: 'forgot-drinks', label: '7' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. 4 sandwiches + 3 salads = 7 mains (OR), then 7 × 2 = 14 orders (AND with the drink).',
          feedbackDefault:
            'Break it in two steps. The main course is sandwich OR salad. The drink is a separate, second choice. Which step uses AND and which uses OR?',
          feedbackByOption: {
            'all-add':
              '9 is 4 + 3 + 2, treating everything as OR. The drink is a SECOND choice, not a third option on the main menu, so it pairs with each main via AND.',
            'all-multiply':
              '24 is 4 × 3 × 2, treating everything as AND. But a sandwich and a salad are not both ordered as main course — you pick one. That is OR, not AND.',
            'forgot-drinks':
              '7 is the number of mains (4 + 3) but does not include the drink choice. Each main pairs with 2 drinks, so multiply.',
          },
          explanation:
            'Two steps. First, the main: 4 sandwiches OR 3 salads gives 4 + 3 = 7 mains (addition principle, disjoint cases). Second, drinks: each of those 7 mains pairs with 2 drink options, giving 7 × 2 = 14 orders (multiplication principle).',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'AND and OR are the whole toolkit',
      body:
        'With multiplication for AND and addition for OR, you can count almost every compound word problem at this level. Read the connecting words, decide which rule each step needs, and combine them.\n\nThe addition principle has one fine-print condition we have not pushed on: the cases must be disjoint, with no item that counts in two of them. When cases DO overlap (like cards that are hearts OR queens, where the queen of hearts is both), straight addition over-counts. A future lesson, inclusion-exclusion, fixes that. For now, the toolkit is yours.',
      mascotLine: 'AND multiplies. OR adds. The rest is reading.',
    },
  ],
};
