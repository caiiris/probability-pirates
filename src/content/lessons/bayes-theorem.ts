import type { Lesson } from '../types';

/**
 * "Bayes' theorem" (Unit 6, Conditional Probability). D109.
 *
 * Audience: 8–15 year olds. Voice matches L1–L18: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: flip a conditional around. You often know P(B | A) and
 * want P(A | B). The classic trap is base-rate neglect, confusing
 * P(positive | sick) with P(sick | positive). The lesson leans on NATURAL
 * FREQUENCIES (counts out of a fixed population) rather than the bare
 * formula, because that is the representation novices reason about correctly.
 *
 *   1. welcome       — recall directionality (P(A|B) is not P(B|A)); Bayes
 *                      is the tool for flipping it
 *   2. the-puzzle    — commit-once MCQ: rare disease, 99% accurate test,
 *                      positive result. Trap "about 99%" (base_rate_neglect);
 *                      correct "about 9%"
 *   3. natural-freq  — concept: walk the 100,000-person count picture so the
 *                      9% becomes obvious (most positives are false alarms)
 *   4. the-rule      — theorem (Bayes) + definition (base rate)
 *   5. flagged-fill  — fill-fraction with CLEAN counts: 90/180 = 1/2, the
 *                      P(condition | flagged) flip (90/100 reverse trap)
 *   6. flip-it       — MCQ: "flu implies fever" does not mean "fever implies
 *                      flu"; flipping needs base rates (base_rate_neglect)
 *   7. base-rate-matters — MCQ: same 99% test on a COMMON disease now gives
 *                      ~99%, proving the base rate drives the answer
 *   8. wrap          — segue to monty-hall (the host\u2019s reveal is the
 *                      evidence you condition on)
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (the medical-test classic).
 *   - Natural frequencies first, formula second; the formula is named only
 *     after the count picture has made the answer feel inevitable.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const bayesTheorem: Lesson = {
  id: 'bayes-theorem',
  number: 26,
  title: "Bayes' theorem",
  blurb: 'Flip a conditional around, and respect the base rate.',
  estimatedMinutes: 7,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'cards' },
      title: 'Flipping the bar around',
      body: [
        'You already know the bar points one way. P(A | B) and P(B | A) are different questions, and they usually have different answers.',
        'Often you know one direction and want the other. A test tells you P(positive | sick), but what you really care about is P(sick | positive). Bayes\u2019 theorem is the tool that flips a conditional from the direction you have to the direction you want.',
      ],
    },

    // Commit-once trap. The seductive answer reads the test accuracy as the
    // answer (99%), ignoring how rare the disease is. Correct is about 9%.
    {
      id: 'the-puzzle',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'disease-test',
          interactionKind: 'multiple-choice',
          prompt:
            'A disease affects 1 in 1000 people. A test is 99% accurate: it catches 99% of sick people and wrongly flags only 1% of healthy people. You test positive. What is the chance you actually have the disease?',
          context: 'Almost everyone tested is healthy, so even a small false-alarm rate matters.',
          options: [
            { id: 'accuracy', label: 'About 99%' },
            { id: 'correct', label: 'About 9%' },
            { id: 'half', label: 'About 50%' },
            { id: 'base', label: 'About 1%' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Surprising, but right. The disease is so rare that the few real cases are buried under false alarms. Out of every 1098 positives, only 99 are truly sick, which is about 9%.',
          feedbackDefault:
            'The 99% is P(positive | sick). You want P(sick | positive), and because the disease is rare you must fold in how many healthy people get flagged too.',
          feedbackByOption: {
            accuracy:
              '99% is the test\u2019s accuracy, P(positive | sick). It is not P(sick | positive). With a 1-in-1000 disease, false alarms from the huge healthy group swamp the real cases.',
            half:
              'It feels like a coin flip, but it is not. Count it out: about 99 true positives against about 999 false positives, so roughly 9%, not 50%.',
            base:
              '1% is close to the disease rate before any test, but a positive result is real information that pushes the chance up from there, to about 9%.',
          },
          misconceptionByOption: {
            accuracy: 'base_rate_neglect',
          },
          explanation:
            'Imagine 100,000 people. About 100 are sick, and 99 of them test positive. Of the 99,900 healthy people, 1% test positive too, which is 999 false alarms. Positives total 99 + 999 = 1098, and only 99 are truly sick: {99/1098}, about 9%.',
          skills: ['base-rate', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'natural-freq',
      kind: 'concept',
      illustration: { kind: 'calendar' },
      title: 'Count real people, not percentages',
      prompt: 'The easiest way to flip a conditional is to picture a crowd.',
      example: {
        title: 'Picture 100,000 people',
        steps: [
          '1 in 1000 has the disease, so about 100 people are sick and 99,900 are healthy.',
          'The test catches 99% of the sick: about 99 true positives.',
          'The test wrongly flags 1% of the healthy: 1% of 99,900 is about 999 false positives.',
          'Positives in total: 99 + 999 = 1098. Only 99 of them are truly sick.',
          'So P(sick | positive) = {99/1098}, which is about 9 in 100.',
        ],
      },
      body: [
        'Nothing here is a trick. The disease is rare, so the healthy group is enormous, and even a tiny 1% slip from a huge group produces more false alarms than there are real cases.',
        'Percentages hide this. Real counts make it plain: most positive tests for a rare disease are false alarms, so a positive raises your chance without coming close to certainty.',
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'The count picture is Bayes\u2019 theorem in disguise.',
      theorem: {
        name: "Bayes' theorem",
        statement:
          'To flip a conditional, use P(A | B) = {P(B | A) × P(A) / P(B)}. It rebuilds the probability you want from the one you know, weighted by the base rate P(A).',
      },
      definition: {
        name: 'Base rate',
        statement:
          'The base rate of an event is how common it is before any test or evidence. Here it is the 1 in 1000 who have the disease.',
      },
      body: [
        'Match it to the crowd. The top, P(B | A) times P(A), is the true positives, the 99 sick people who test positive. The bottom, P(B), is everyone who tests positive, all 1098.',
        'The base rate P(A) is the part people drop. When a condition is rare, that small weight on top is exactly why a positive test stays far from certain.',
      ],
    },

    // Clean-count Bayes flip. 90/180 = 1/2. The reverse 90/100 is the trap.
    {
      id: 'flagged-fill',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'condition-given-flag',
          interactionKind: 'fill-fraction',
          prompt:
            'In a group of 1000 people, 100 have a condition. A test flags 90 of those 100, and also flags 90 of the 900 healthy people. A random flagged person, what is the chance they have the condition? Write it as a fraction.',
          context:
            'Count the flagged people. Some are flagged correctly, some are false alarms.',
          numerator: 90,
          denominator: 180,
          numeratorLabel: 'flagged people who have it',
          denominatorLabel: 'flagged people in total',
          feedbackCorrect:
            'Right. Flagged people total 90 + 90 = 180, and 90 of them truly have it, so {90/180} = {1/2}.',
          feedbackDefault:
            'How many people get flagged in total, and how many of those actually have the condition?',
          feedbackByWrongAnswer: {
            '90/100':
              '90/100 is P(flagged | has it), the direction you were given. You want P(has it | flagged): of the 180 flagged people, 90 truly have it, so {90/180} = {1/2}.',
            '90/1000':
              'The bottom is not everyone, only the people who got flagged. That is 90 + 90 = 180, so {90/180} = {1/2}.',
            '100/1000':
              '100/1000 is the base rate before any test. A positive flag is new information, and it lifts the chance to {90/180} = {1/2}.',
            empty: 'Type the fraction: flagged people who have it on top, all flagged people on the bottom.',
          },
          misconceptionByFraction: [{ num: 9, den: 10, key: 'base_rate_neglect' }],
          explanation:
            'Flagged people are 90 true cases plus 90 false alarms, which is 180. The share that truly have the condition is {90/180} = {1/2}. The given 90/100 was the other direction, P(flagged | has it).',
          afterNote: 'P(has it | flagged) = {90/180} = {1/2}.',
          skills: ['base-rate', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'flip-it',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'fever-flu',
          interactionKind: 'multiple-choice',
          prompt:
            'It is true that "if you have the flu, you almost certainly have a fever." Does that mean "if you have a fever, you almost certainly have the flu"?',
          context: 'These are the two directions of one conditional. Bayes says they need not match.',
          options: [
            {
              id: 'correct',
              label: 'No, fevers come from many illnesses, so a fever rarely pins down the flu',
            },
            { id: 'yes', label: 'Yes, the two statements say the same thing' },
            { id: 'always', label: 'Yes, a fever always means the flu' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. P(fever | flu) is high, but P(flu | fever) is much lower, because colds, infections, and many other illnesses also cause fevers.',
          feedbackDefault:
            'These are the two directions of the same conditional. Flipping P(B | A) into P(A | B) needs the base rates, so the two answers can be very different.',
          feedbackByOption: {
            yes:
              'They are different directions. P(fever | flu) is high, but P(flu | fever) is held down by every other illness that also causes fevers.',
            always:
              'Plenty of illnesses cause fevers, so a fever does not guarantee the flu. The two directions of the conditional are not the same.',
          },
          misconceptionByOption: {
            yes: 'base_rate_neglect',
            always: 'base_rate_neglect',
          },
          explanation:
            'P(fever | flu) can be near 1 while P(flu | fever) stays low, because the base of feverish people includes many other illnesses. Flipping a conditional always depends on the base rates.',
          skills: ['base-rate', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'base-rate-matters',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'common-disease',
          interactionKind: 'multiple-choice',
          prompt:
            'Same 99% accurate test, but now the disease is common: 1 in 2 people have it. You test positive. About how likely are you to be sick?',
          context: 'Only the base rate changed. Picture 1000 people and count again.',
          options: [
            { id: 'correct', label: 'About 99%' },
            { id: 'nine', label: 'Still about 9%' },
            { id: 'half', label: 'About 50%' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Out of 1000 people, 500 are sick and 495 test positive, while only 5 of the 500 healthy give false alarms. Positives total 500, and 495 are truly sick: about 99%.',
          feedbackDefault:
            'Picture 1000 people, half sick and half healthy, and count the true positives against the false alarms.',
          feedbackByOption: {
            nine:
              '9% was the answer when the disease was rare. Now half the people are sick, so the true positives dominate. About 495 of 500 positives are real: roughly 99%.',
            half:
              'The base rate is 50%, but a positive test still adds information. With 495 true positives against just 5 false alarms, the chance climbs to about 99%.',
          },
          misconceptionByOption: {
            nine: 'base_rate_neglect',
          },
          explanation:
            'With a common disease, the same positive test means something very different. Of 1000 people, 500 sick give 495 true positives, and 500 healthy give only 5 false positives, so P(sick | positive) is about {495/500}, roughly 99%. The base rate drives the answer.',
          skills: ['base-rate', 'conditional-probability'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Flip it, and mind the base rate',
      body:
        'Bayes\u2019 theorem turns the conditional you have, P(B given A), into the one you want, P(A given B). The cleanest way to do it is to count a real crowd: true positives on top, all positives on the bottom.\n\nThe lesson of the rare disease is to respect the base rate. When a condition is uncommon, most positive tests are false alarms. Next comes the most famous conditional puzzle of all, Monty Hall, where a game-show host opens a door and hands you exactly the evidence you condition on.',
      mascotLine: 'Flip the bar, but never forget the base rate.',
      segueToLessonId: 'monty-hall',
    },
  ],
};
