import type { Lesson } from '../types';

/**
 * Lesson 2 — "What does probability really mean?" (Unit 1.1, D89/D91/D92).
 *
 * Audience: 8–15 year olds. Voice matches Lesson 1 (`how-likely.ts`):
 * declarative, grounded, sparing on contractions ("is not" over "isn't"),
 * no em dashes in user-facing copy, no chatty interjections ("Plot twist",
 * "Nope", "Way off"). Sentences are short to medium, not telegraphic.
 *
 * Pedagogy: discovery-first arc. The named idea (probability = fraction)
 * is stated AFTER the learner has seen it on the slider, not before.
 *
 *   1. welcome      — frame the second way to find probability
 *   2. puzzle       — commit-once MCQ that surfaces the conflict
 *   3. lets-flip    — motivate the simulation; name the technique
 *   4. scrub-demo   — falling-balls slider, the discovery beat (coin)
 *   5. long-run-share — name what they just saw (theorem callout + coin figure)
 *   6. unknown-coin — apply 1: estimate P on a coin you cannot count
 *   7. die-roll     — hands-on generalization: roll a die and watch the share
 *                     of sixes settle near 1/6. A second, button-driven
 *                     manipulative (vs. the slider) so "settling" reads as a
 *                     general law, not a coin trick.
 *   8. streak-trap  — apply 2: kill the gambler's fallacy. The deep point is
 *                     independence vs. convergence — the average settles
 *                     because early flips get swamped, NOT because the coin
 *                     corrects itself.
 *   9. wobble-test  — apply 3: judge what a fair coin should look like
 *  10. frequentists — fun-fact page reconciling the two views and pointing
 *                     out toward statistics and machine learning
 *  11. wrap         — close, segue to sample-space
 */
export const longRunFrequency: Lesson = {
  id: 'long-run-frequency',
  number: 2,
  title: 'The long run',
  blurb: 'Flip a coin many times. The fraction of heads settles on the probability.',
  estimatedMinutes: 7,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Another way to find probability',
      quote: {
        text: 'Probability theory is nothing but common sense reduced to calculation.',
        attribution: 'Pierre-Simon Laplace, 1814',
      },
      body: [
        'Last lesson, you found probability by counting outcomes.',
        'Counting works when every outcome is equally likely, like the faces of a fair die. But you cannot count the outcomes of an unfamiliar coin, or of who wins a game tomorrow. Today, you will see the other way to pin down a probability: by repeating something many times and watching what settles out.',
      ],
    },

    // Cognitive-conflict MCQ. `commitOnce` makes it a prediction slot:
    // answer once, see feedback, continue right or wrong. The next slots
    // resolve whatever the learner picked.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      commitOnce: true,
      variants: [
        {
          id: 'puzzle',
          interactionKind: 'multiple-choice',
          prompt: 'You flip a fair coin 10 times and get 7 heads. Which is true?',
          options: [
            {
              id: 'biased',
              label: 'The coin is unfair, and heads really happens about 7 times in 10',
            },
            { id: 'broken', label: 'The math failed. "1/2" was the wrong prediction here' },
            {
              id: 'longrun',
              label: 'Nothing is wrong. "1/2" describes many flips, not any single set of 10',
            },
            {
              id: 'gambler',
              label: 'The coin owes us tails now, so the next flip is more likely to land tails',
            },
          ],
          correctOptionId: 'longrun',
          feedbackCorrect:
            'Right. "1/2" is the number the fraction lands on after many flips, not a promise about any single set of 10.',
          feedbackDefault:
            'Each flip is heads or tails, never half. So what is the "1/2" really about?',
          feedbackByOption: {
            biased:
              'Could be, but a perfectly fair coin can show 7 heads in 10 flips just by luck. To know for sure, you would need many more flips.',
            broken:
              'The math is fine. "1/2" simply says something different from "exactly 5 heads in 10 flips." The next pages show what.',
            gambler:
              'Famous trap, called the gambler\u2019s fallacy. The coin has no memory. Past flips do not change the probability of the next one.',
          },
          explanation:
            'A single flip is unpredictable. "1/2" is a sharp prediction about many flips, not any single stretch of 10.',
        },
      ],
    },

    // Motivate the sim. The puzzle posed the question; this slot says
    // let us go find out, and names the technique (simulation) so the
    // learner has a real word for what they are about to do.
    {
      id: 'lets-flip',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'See it for yourself',
      body: [
        'On the next page, drag the slider to flip a coin many times. Watch where the fraction of heads ends up.',
        'Trying something many times and watching what happens is called simulation. Mathematicians, scientists, and engineers use simulation all the time to figure out uncountable real-world problems.',
      ],
    },

    {
      id: 'scrub-demo',
      kind: 'problem',
      interactionKind: 'scrub-trials',
      variants: [
        {
          id: 'coin-scrub',
          interactionKind: 'scrub-trials',
          prompt: 'Drag the slider to flip more times. Watch where the fraction lands.',
          scenario: 'coin',
          targetProbability: 0.5,
          targetLabel: 'Where the fraction should land',
          minN: 10,
          maxN: 10_000,
          reachN: 1_000,
          // Same seed every render so the bar is reproducible. The learner
          // can scrub back and forth without the visualization re-rolling.
          seed: 0xc01d,
          feedbackCorrect:
            'Ten thousand flips, and the fraction sits almost exactly on 50%. That is what "1/2" really means.',
          feedbackDefault: 'Drag further. The fraction settles down with more flips.',
          feedbackByWrongValue: {
            incomplete: 'Drag the slider to the right. The wobble dies down past a thousand flips.',
          },
          explanation:
            'Flip enough and the fraction settles on a single number. That number is the probability.',
        },
      ],
    },

    // Name what they just saw. Theorem callout is the formal artifact; the
    // body defines the term it uses ("event") and explains the picture in
    // the figure. The figure renders a static convergence line so the
    // settling story is on screen as well as in prose.
    {
      id: 'long-run-share',
      kind: 'concept',
      // Body mentions "a red card from a deck of cards" as one of the example
      // events — illustration mirrors that to break up the run of coin slots.
      illustration: { kind: 'cards' },
      title: 'Another view of probability',
      theorem: {
        name: 'Probability',
        statement: 'P(event) is the fraction of times the event happens, after many, many tries.',
      },
      body: [
        'An event is something that can happen on a single try: heads on a flip, a 6 on a die, a red card from a deck of cards. On any one try, the event either happens or it does not.',
        'A single try is unpredictable. But with enough tries, the fraction of times the event happens settles on one number. That number is the probability.',
      ],
      figure: {
        kind: 'settling-line',
        scenario: 'coin',
        targetProbability: 0.5,
        targetLabel: '1/2',
        trialCount: 10_000,
        seed: 0xc01d,
        caption:
          'The running fraction of heads over 10,000 flips of the coin. The probability settles near 1/2 after many flips.',
      },
    },

    // Apply 1. Estimate P when you cannot count outcomes. Right answer is
    // the long-run measurement: many flips, use the fraction.
    {
      id: 'unknown-coin',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'estimate-bias',
          interactionKind: 'multiple-choice',
          prompt:
            'You find a coin you have never seen before and want to know its P(heads). What should you do?',
          options: [
            { id: 'half', label: 'Say P(heads) = 1/2.' },
            { id: 'few', label: 'Flip the coin 10 times and use the fraction you get.' },
            { id: 'many', label: 'Flip the coin 10,000 times and use the fraction you get.' },
          ],
          correctOptionId: 'many',
          feedbackCorrect:
            'Right. The settled fraction is the probability, and many flips is what gets you there.',
          feedbackDefault:
            'You saw it on the slider. A few flips is unreliable, but after many flips the fraction settles.',
          feedbackByOption: {
            half: 'Counting only works when every outcome is equally likely, and that is not promised here.',
            few: 'Closer, but 10 flips is very little. You could see 7 heads or 3 heads by luck and walk away with the wrong answer.',
          },
          explanation:
            'When you cannot count outcomes, the way to find a probability is to repeat the event many times and read off the fraction. The more flips you run, the less it wobbles and the more you can trust the answer.',
        },
      ],
    },

    // Apply 1.5. Hands-on generalization. The named theorem and the apply
    // MCQ have both been about coins; a learner could quietly conclude the
    // fraction "always settles to 1/2." Rolling a die and watching the share
    // of sixes settle near 1/6 kills that, and gives the lesson a second
    // manipulative with a different feel (tap-to-roll vs. drag-the-slider).
    {
      id: 'die-roll',
      kind: 'problem',
      interactionKind: 'simulate-proportion',
      variants: [
        {
          id: 'die-six',
          interactionKind: 'simulate-proportion',
          prompt: 'Roll a die and watch the probability of rolling a six.',
          scenario: 'die-six',
          targetProbability: 1 / 6,
          targetLabel: '1/6',
          minTrials: 100,
          feedbackCorrect:
            'Same story, different number. The long-run idea works for any probability question.',
          feedbackDefault: 'Roll more. One in six only shows up once the rolls pile up.',
          feedbackByWrongValue: {
            incomplete:
              'Keep rolling. A handful of rolls tells you almost nothing; the share needs a while to steady.',
          },
          explanation:
            'The fraction settles for any event you can repeat, and it lands on that event\u2019s own number: about 1/2 for heads, about 1/6 for a six.',
        },
      ],
    },

    // Apply 2. The gambler's fallacy, drilled on its own. The opening puzzle
    // named it as a wrong option, but everyone should confront it directly,
    // because it is THE classic misconception and it hides a subtle point:
    // long-run convergence does NOT mean the coin "corrects itself." The
    // explanation separates independence (each flip is fresh) from
    // convergence (early flips get swamped by the later thousands).
    {
      id: 'streak-trap',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'five-in-a-row',
          interactionKind: 'multiple-choice',
          prompt:
            'A fair coin just landed heads five times in a row. What is P(heads) on the next flip?',
          options: [
            { id: 'less', label: 'Less than 1/2' },
            { id: 'half', label: 'Still 1/2' },
            { id: 'more', label: 'More than 1/2' },
          ],
          correctOptionId: 'half',
          feedbackCorrect:
            'Right. The coin cannot remember the last five flips. The next one is a fresh 1/2.',
          feedbackDefault: 'Think about it: does a single flip of a coin affect the flip after it?',
          feedbackByOption: {
            less: 'This is the gambler\u2019s fallacy. The coin keeps no score, so it is never "owed" a tails.',
            more: 'A coin has no hot streak. The flips before do not push the next one either way.',
          },
          explanation:
            'Each flip stands on its own: still 1/2, whatever came before. Here is the part people get backwards. The fraction settles down NOT because the coin fixes its mistakes, but because after thousands of flips a few early heads barely move the average at all.',
        },
      ],
    },

    // Apply 3. Wobble intuition the other direction: given a known fair
    // coin, what would actually be a surprise? The "exactly 50" option
    // earns an honest fact in its feedback rather than being a trick.
    {
      id: 'wobble-test',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'surprise-100',
          interactionKind: 'multiple-choice',
          prompt: 'You flip a fair coin 100 times. Which result would be a real surprise?',
          options: [
            { id: 'h47', label: '47 heads' },
            { id: 'h53', label: '53 heads' },
            { id: 'h30', label: '25 heads' },
            { id: 'h50', label: 'Exactly 50 heads' },
          ],
          correctOptionId: 'h30',
          feedbackCorrect:
            'Yes. 25 out of 100 means 25%, which is far from the 50% a fair coin should give.',
          feedbackDefault:
            'A fair coin should land close to 50 heads in 100. How far off would a result have to be before you stopped trusting the coin?',
          feedbackByOption: {
            h47: '47 out of 100 is very close to 1/2, the true probability.',
            h53: '53 out of 100 is very close to 1/2, the true probability.',
            h50: 'Surprisingly, getting exactly 1/2 is uncommon. Only about 8% of fair coins land exactly 50 heads in 100 flips. But this is still a very normal result.',
          },
          explanation:
            'After many flips, the fraction stays near the true probability. Small wobbles like 47 or 53 are common. Big swings like 30 are very unlikely for a fair coin.',
        },
      ],
    },

    // Frequentist fun-fact page. Names both views, answers the natural
    // "do they conflict?" question, and points outward to statistics and
    // machine learning. No theorem callout; this is cultural framing,
    // not a definition.
    {
      id: 'frequentists',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Two views, both useful',
      prompt:
        'Last lesson you found probability by counting. This lesson, by flipping many times. Math has names for both: classical (counting) and frequentist (long-run).',
      body: [
        'In fact, the two views are the same! Counting works when you can list every outcome, like the faces of a die or the cards in a deck. The long-run view takes over when you cannot, like an unfamiliar coin or whether it rains tomorrow. They are simply tools for two kinds of problems, and where both apply, they land on the same answer.',
        'A whole field called statistics is built on the long-run view. Machine learning rests on it too: a model learns from many examples to predict the next one. The idea you just met is the foundation underneath both.',
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You found what 1/2 means',
      body: 'Probability is the fraction you get from many flips. Single flips jump around. With enough flips, the fraction settles.\n\nIn the next lesson, you go back to counting, this time for an experiment with more outcomes than you can hold in your head. You will list the outcomes, name them, and use the formula again.',
      mascotLine: 'Bet on the long run, never the next flip.',
      segueToLessonId: 'sample-space',
    },
  ],
};
