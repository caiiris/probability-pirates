import type { Lesson } from '../types';

/**
 * Lesson 3 — "Naming the toolkit" (Unit 1.2, sample-space).
 *
 * Audience: 8–15 year olds. Voice matches Lesson 1 (`how-likely.ts`) and
 * Lesson 2 (`long-run-frequency.ts`): declarative, grounded, sparing on
 * contractions ("is not" over "isn't"), no em dashes in user-facing copy,
 * no chatty interjections.
 *
 * Pedagogical job: name the things the learner has been counting since
 * Lesson 1. Outcome, sample space, event. No probability calculations
 * here — the formula side comes back in `equally-likely-outcomes`. This
 * lesson is vocabulary done right, with one twist (compound sample space
 * for two coins) so the words land on more than coin-flip-and-die.
 *
 *   1. welcome              — frame the lesson as a vocabulary upgrade
 *   2. define-outcome       — outcome, with examples and a definition callout
 *   3. define-sample-space  — sample space as the set of all outcomes
 *   4. list-coin            — tap-outcomes recap with the new vocabulary
 *   5. two-coins-grid       — autonomous animation builds {HH, HT, TH, TT}
 *   6. define-set-subset    — set and subset definitions, with a playful
 *                              subset picker (no-XP figure, optional play)
 *   7. subset-fill          — fill-text: type any 2-item subset of {R,B,G}
 *   8. define-event         — event as a subset of the sample space
 *                              (slim body: set/subset primer moved to slot 6)
 *   9. pick-the-event       — MCQ: identify "at least one heads" as a subset
 *  10. classical-probability — state P(event) = k/N with k and N named, using
 *                              the event the learner just found in slot 9
 *  11. pick-the-sample-space — MCQ: granularity trap on a card draw
 *  12. prob-of-club         — fill-fraction: P(club) = 13/52, applies k/N to
 *                              the deck the previous slot established
 *  13. three-coins          — fill-text: type any 3-flip outcome (regex-graded)
 *  14. wrap                 — close, segue to equally-likely-outcomes
 *
 * The four named-vocabulary slots (outcome, sample space, event, probability
 * of an event) use the **definition** callout — blue accent, "Definition"
 * eyebrow — distinct from the violet "Theorem" callout used for derivable
 * claims (multiplication principle, complement rule, etc., later in the
 * curriculum). A definition names a word; a theorem makes a claim. Visually
 * distinguishing them helps the learner know what kind of attention the
 * callout asks for.
 *
 * Things deliberately NOT covered (each saved for its own lesson):
 *   - The HT-vs-TH "are these the same outcome?" cognitive conflict.
 *     That is `equally-likely-outcomes`'s opening hook, not this lesson's.
 *     Mentioning it here would steal the punchline.
 *   - The favorable / total formula. Already taught in Lesson 1; the
 *     sequel lesson will revisit it with the pitfalls.
 *   - The multiplication principle (2 × 2 = 4 for two coins). The grid
 *     animation makes it visible without naming the rule; that lands in
 *     Unit 2.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const sampleSpace: Lesson = {
  id: 'sample-space',
  number: 3,
  title: 'Naming the toolkit',
  blurb: 'Outcome. Sample space. Event. The vocabulary every probability question rests on.',
  estimatedMinutes: 5,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'The words every probability problem uses',
      body: [
        'Every probability problem rests on three words: outcome, sample space, and event. You used each one informally in the first two lessons.',
        'This lesson defines them properly, so future problems can reach for the words directly instead of explaining the ideas each time.',
      ],
    },

    {
      id: 'define-outcome',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Outcome',
      prompt:
        'A coin lands heads or tails. A die lands on one of six faces. Each specific way the thing can come out is an outcome.',
      definition: {
        name: 'Outcome',
        statement:
          'An outcome is one specific result of an experiment. An experiment is anything you do that can come out more than one way.',
      },
      body: [
        'Heads is an outcome. So is tails. Rolling a 4 is an outcome. Drawing the queen of hearts is an outcome. Each one is a single specific way the experiment turned out.',
      ],
    },

    {
      id: 'define-sample-space',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Sample space',
      definition: {
        name: 'Sample space',
        statement:
          'The sample space of an experiment is the set of all possible outcomes you could get from running your experiment.',
      },
      body: [
        'For one fair coin flip, the sample space is {H, T}. The curly braces mark a set, which is just a list of items with no duplicates and no fixed order. On a single flip, the coin can only land one of two ways: heads or tails.',
        'Similarly, for one fair die roll, the sample space is {1, 2, 3, 4, 5, 6}.',
        'A sample space is a complete list of outcomes. If something is missing, you got it wrong. If something extra is in it, same problem.',
      ],
    },

    {
      id: 'list-coin',
      kind: 'problem',
      interactionKind: 'tap-outcomes',
      variants: [
        {
          id: 'coin-faces',
          interactionKind: 'tap-outcomes',
          source: 'coin',
          prompt: 'List the sample space for a single coin flip. Tap each side it can land on.',
          expectedOutcomes: ['H', 'T'],
          afterNote: 'The sample space of one fair coin flip is {H, T}. Two outcomes.',
          feedbackCorrect:
            'Right. Two sides, two outcomes, and that is everything in the sample space.',
          feedbackDefault:
            'A coin lands one of two ways. Tap each one to put it in the sample space.',
          feedbackByWrongValue: {
            incomplete: 'A coin has more than one side. Each side belongs in the sample space.',
            duplicate:
              'Each outcome only goes in the set once. Tap a side again to remove it if you double-counted.',
          },
          explanation:
            'Heads is one outcome. Tails is another. Together they make {H, T}, the full sample space of one flip.',
        },
      ],
    },

    {
      id: 'two-coins-grid',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Two coins, four pairs',
      prompt:
        'When flipping two coins, each possible outcome is a pair: {first coin, second coin}. You have four pairs in total. Notice that order matters here!',
      body: [
        'The sample space of two coin flips has four pairs: HH, HT, TH, and TT. Watch them appear below. Do you see how each pair is one specific way the two flips can come out?',
      ],
      figure: {
        kind: 'two-coins-grid',
        caption: 'Sample space of two flips: four ordered pairs, one per cell.',
      },
    },

    // Set/subset definition + playful picker. Has to come before
    // `define-event`, because the event definition leans on the word
    // "subset". The picker is a figure (no continue gate, no XP) so the
    // beat stays light: the learner taps a few subsets by hand before
    // they meet the formal claim that an event IS a subset.
    {
      id: 'define-set-subset',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Set and subset',
      prompt:
        'A set is a collection of items. A subset is a piece of that collection.',
      definition: {
        name: 'Subset',
        statement:
          'A subset of a set is some of the items from that set. A subset can have all the items, none of them, or anything in between.',
      },
      body: [
        'Curly braces mark a set, like {red, blue, green}. You cannot have the same item twice , and the order of the items does not matter.',
        'Pick any of those colors, in any combination, and you have a subset. {red, blue} is a subset. {green} is one. The empty set { } counts too, and so does the full set {red, blue, green}.',
      ],
      figure: {
        kind: 'subset-picker',
        caption: 'Tap any combination to build a subset.',
      },
    },

    // Fill-blank to lock in subset comprehension. Six valid answers
    // (C(4,2) = 6) so the learner exercises the freedom that makes
    // "subset" different from "one specific subset." The set is
    // intentionally a fresh four-item set (fruits), not the three-ball
    // picker from the previous slot — the picker teaches the concept;
    // this slot asks the learner to apply it to new content.
    {
      id: 'subset-fill',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'two-fruit-subset',
          interactionKind: 'fill-text',
          prompt:
            'Type a subset of {apple, orange, watermelon, banana} with exactly two fruits. Separate the fruits with a comma.',
          context: 'Any 2 of the 4 fruits counts. Case and spaces do not matter.',
          placeholder: 'two fruits',
          maxLength: 40,
          // Accepts every ordered pairing of two distinct fruits from
          // {apple, orange, watermelon, banana} — there are C(4,2) = 6
          // unordered pairs, so 12 ordered renderings. Curly braces are
          // optional and the separator is flexible (comma, space, or
          // both). Matched case-insensitively against the trimmed
          // lowercase input.
          acceptRegex:
            '\\{?\\s*(?:apple[ ,]+banana|apple[ ,]+orange|apple[ ,]+watermelon|banana[ ,]+apple|banana[ ,]+orange|banana[ ,]+watermelon|orange[ ,]+apple|orange[ ,]+banana|orange[ ,]+watermelon|watermelon[ ,]+apple|watermelon[ ,]+banana|watermelon[ ,]+orange)\\s*\\}?',
          feedbackCorrect:
            'Yes. Any two of the four is a valid 2-item subset.',
          feedbackDefault:
            'Type two of the four fruit names, separated by a comma. Any pair works.',
          feedbackByWrongAnswer: {
            empty: 'Type two fruit names, separated by a comma. Any 2 of the 4 is fine.',
          },
          explanation:
            'A 2-item subset is any pair of fruits from the four. There are six such subsets: {apple, orange}, {apple, watermelon}, {apple, banana}, {orange, watermelon}, {orange, banana}, and {watermelon, banana}. Any of them is correct.',
        },
      ],
    },

    {
      id: 'define-event',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Event',
      prompt:
        'An event is a question you can ask about an experiment. "Did I roll an even number?" "Did I get at least one heads on two flips?" "Did I draw a heart?"',
      definition: {
        name: 'Event',
        statement:
          'An event is the subset of the sample space whose outcomes answer "yes" to your question.',
      },
      body: [
        'An outcome is one specific result, like rolling a 3 or flipping heads. An event is the group of outcomes that answer "yes" to your question. This makes it a subset of the sample space.',
        'On a fair six-sided die, the sample space is {1, 2, 3, 4, 5, 6}. The event "rolling an even number" is the subset {2, 4, 6}.',
      ],
    },

    {
      id: 'pick-the-event',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'at-least-one-heads',
          interactionKind: 'multiple-choice',
          prompt:
            'You flip two coins. Which set of outcomes is the event "at least one heads"?',
          context: 'The sample space is {HH, HT, TH, TT}. Pick the subset that matches the event.',
          options: [
            { id: 'just-hh', label: '{HH}' },
            { id: 'one-h', label: '{HT, TH}' },
            { id: 'has-h', label: '{HH, HT, TH}' },
            { id: 'all', label: '{HH, HT, TH, TT}' },
          ],
          correctOptionId: 'has-h',
          feedbackCorrect:
            'Right. Three of the four pairs have at least one H. The pair TT is the only one that misses out.',
          feedbackDefault:
            'An event is the set of outcomes where the answer to your question is "yes." Walk through the four pairs and ask the question on each.',
          feedbackByOption: {
            'just-hh':
              'That is the event "two heads," not "at least one." "At least one" is a wider net than "exactly two."',
            'one-h':
              'Those pairs have exactly one H. "At least one" does include pairs with one H, but it does not stop there.',
            all:
              'That is the entire sample space. Walk through each pair and ask if it has at least one H. One of them does not.',
          },
          explanation:
            '"At least one heads" means one or two heads. HH (two), HT (one), and TH (one) all qualify. TT has zero heads, so it stays out.',
        },
      ],
    },

    // Now that outcome / sample space / event are all in hand, close the
    // loop by stating the formula in the new vocabulary. Sits right after
    // pick-the-event so the worked example can reuse the subset the
    // learner just identified ("at least one heads" = {HH, HT, TH}), with
    // no risk of giving away the answer (that MCQ is already submitted).
    // The equally-likely caveat appears in the theorem statement; the
    // next lesson (`equally-likely-outcomes`) tests it harder.
    {
      id: 'classical-probability',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Putting it together',
      definition: {
        name: 'Probability of an event',
        statement:
          'Let k be the number of outcomes in the event, and N be the total number of outcomes in the sample space. If all outcomes are equally likely, then P(event) = k/N.',
      },
      body: [
        'Take one fair die. The event "rolling an even number" is the subset {2, 4, 6}. Here k = 3 (the event has three outcomes) and N = 6 (the sample space {1, 2, 3, 4, 5, 6} has six). So P(even) = k/N = 3/6, which is 1/2.',
        'Take two fair coins. The event "at least one heads" is {HH, HT, TH}, the subset you just picked. Here k = 3 and N = 4, so P(at least one heads) = k/N = 3/4.',
        'This is the same formula you used in Lesson 1, with new names. "Favorable" is k, the size of the event. "Total" is N, the size of the sample space.',
      ],
    },

    {
      id: 'pick-the-sample-space',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'one-card',
          interactionKind: 'multiple-choice',
          prompt:
            'You draw one card from a standard 52-card deck. What is the sample space?',
          options: [
            { id: 'colors', label: '{red, black}' },
            { id: 'suits', label: '{hearts, diamonds, clubs, spades}' },
            { id: 'ranks', label: '{ace, 2, 3, 4, 5, 6, 7, 8, 9, 10, jack, queen, king}' },
            { id: 'cards', label: 'All 52 specific cards (ace of spades, 2 of spades, ...)' },
          ],
          correctOptionId: 'cards',
          feedbackCorrect:
            'Yes. There are 52 different cards you can draw, and each one is a different outcome. The sample space is the full list of 52.',
          feedbackDefault:
            'Each draw lands you on a specific card, not a category. The sample space has to be at least as specific as the result.',
          feedbackByOption: {
            colors:
              'A draw lands you on a specific card, not just a color. Two cards can both be red and still be different draws.',
            suits:
              'A draw lands you on a specific card, not just a suit. Two cards can both be hearts and still be different draws.',
            ranks:
              'A draw lands you on a specific card, not just a rank. Two cards can both be queens and still be different draws.',
          },
          explanation:
            'Outcomes have to be as specific as the experiment is. One draw makes one specific card, so the sample space has to list every possible card.',
        },
      ],
    },

    // Apply the k/N formula to the deck the learner just nailed down.
    // The sample space (52 cards) was established one slot back, the
    // formula was named two slots back, and a suit is a clean, vivid
    // event the learner can count without a diagram. fill-fraction
    // forces them to lay down k over N rather than skip to the
    // simplified 1/4 — that is the conceptual move this lesson is for.
    {
      id: 'prob-of-club',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'p-of-club',
          interactionKind: 'fill-fraction',
          prompt: 'You draw one card from a standard 52-card deck. What is the probability of drawing a club?',
          context:
            'A club is a suit, like hearts or spades. Each suit has 13 cards.',
          numerator: 13,
          denominator: 52,
          numeratorLabel: 'k = clubs in the deck',
          denominatorLabel: 'N = cards in the deck',
          feedbackCorrect:
            'Right. Thirteen clubs out of 52 cards. P(club) = 13/52, which simplifies to 1/4.',
          feedbackDefault:
            'k is the count of outcomes in the event (clubs). N is the total count in the sample space (cards). Type k on top, N on bottom.',
          feedbackByWrongAnswer: {
            '1/4':
              'That is the simplified value, and it is correct. The grader is looking for k/N in its raw form first: count of clubs on top, count of all cards on bottom.',
            '4/52':
              'There are 4 suits in a deck, but here you want clubs, not suits. How many cards are clubs?',
            '13/13':
              'The denominator is the size of the whole sample space, not just the event.',
            '52/13':
              'You flipped the fraction. k goes on top (clubs in the event), N goes on bottom (cards in the sample space).',
            '52/52':
              'That would make every card a club. The numerator k should count just the clubs.',
          },
          explanation:
            'There are 13 clubs in a standard deck and 52 cards total, so k = 13 and N = 52. P(club) = k/N = 13/52, which is 1/4.',
          afterNote: 'P(club) = k/N = 13/52 = 1/4.',
        },
      ],
    },

    {
      id: 'three-coins',
      kind: 'problem',
      interactionKind: 'fill-text',
      variants: [
        {
          id: 'type-an-outcome',
          interactionKind: 'fill-text',
          prompt:
            'You flip three coins. Type one outcome from the sample space. Use H for heads and T for tails, three letters in order.',
          context:
            'Any of the valid outcomes is fine. Case does not matter, and spaces between letters are optional.',
          placeholder: 'three letters',
          maxLength: 16,
          // Three letters, each H or T, optional whitespace anywhere. The
          // regex is matched case-insensitively against `input.trim()
          // .toLowerCase()`, so lowercase character classes here.
          acceptRegex: '\\s*[ht]\\s*[ht]\\s*[ht]\\s*',
          feedbackCorrect:
            'Right. Three flips, three letters, each one H or T. That is exactly the shape of a 3-flip outcome.',
          feedbackDefault:
            'Each flip lands one of two ways. Type three letters, one for each flip, using only H or T.',
          feedbackByWrongAnswer: {
            empty: 'Type something in the box. One letter per flip, three letters total.',
          },
          explanation:
            'The sample space of three flips is the eight strings of three letters where each letter is H or T: HHH, HHT, HTH, HTT, THH, THT, TTH, TTT. Any of those is a valid outcome.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You named the toolkit',
      body:
        'You can now write down the outcome, the sample space, and the event for any experiment with a finite list of results. That is the whole idea of basic probability! \n\nIn the next lesson, we will investigate how our previous definition of probability works in lots of cases, but not all. What happens then?',
      mascotLine: 'First the list. Then the math.',
      segueToLessonId: 'equally-likely-outcomes',
    },
  ],
};
