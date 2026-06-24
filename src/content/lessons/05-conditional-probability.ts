import type { Lesson } from '../types';

export const lesson5: Lesson = {
  id: 'conditional-probability',
  number: 5,
  title: 'Conditional probability',
  blurb: 'Monty Hall: switch or stay? Only simulation makes it believable.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'intro',
      kind: 'concept',
      illustration: { kind: 'doors' },
      title: 'Conditional probability',
      prompt:
        'When you learn something new, the odds can change. Conditional probability is what they change to. The classic test is the Monty Hall problem.',
      body: [
        'Until now we have asked "what is the chance of A?" From here on we will also ask "what is the chance of A, given that we already know B?" The two answers are usually not the same.',
      ],
      theorem: {
        name: 'Conditional probability',
        statement:
          'For events A and B with P(B) > 0, the conditional probability of A given B is P(A | B) = {P(A and B) / P(B)}. In words: among the outcomes where B happens, the share that also have A. In general, P(A | B) ≠ P(A).',
      },
    },
    {
      id: 'setup',
      kind: 'concept',
      prompt:
        'Three doors. One hides a car, two hide goats. You pick a door. The host, who knows what is behind each, opens a different door to reveal a goat, then offers to let you switch.',
      illustration: { kind: 'doors' },
    },
    {
      id: 'other-two',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'pick-one',
          interactionKind: 'multiple-choice',
          prompt:
            'You pick door 1. Before anything opens, what is the chance the car is behind one of the other two doors combined?',
          context:
            'Your door has a 1 in 3 chance. The rest of the probability has to live somewhere.',
          options: [
            { id: 'third', label: '1/3' },
            { id: 'half', label: '1/2' },
            { id: 'twothirds', label: '2/3' },
          ],
          correctOptionId: 'twothirds',
          feedbackCorrect: 'Right. Your door holds 1/3, so the other two together hold 2/3.',
          feedbackDefault:
            'All three doors started at 1/3. How much is left for the two you did not pick?',
          feedbackByOption: {
            third: 'That is the chance for your single door. The other two together hold more.',
            half: 'It feels like 1/2, but the three doors started equal at 1/3 each, so two of them hold 2/3.',
          },
          explanation:
            'Probabilities sum to 1. Your door is 1/3, so the other two doors share the remaining 2/3.',
        },
        {
          id: 'pick-two',
          interactionKind: 'multiple-choice',
          prompt:
            'You pick door 2. What is the chance the car is behind one of the other two doors put together?',
          context: 'Each door started equally likely. Your door is one of three.',
          options: [
            { id: 'third', label: '1/3' },
            { id: 'half', label: '1/2' },
            { id: 'twothirds', label: '2/3' },
          ],
          correctOptionId: 'twothirds',
          feedbackCorrect: 'Yes. Your door is 1/3, the other two are 2/3 together.',
          feedbackDefault: 'Three equal doors. Your one door is 1/3 of the total.',
          feedbackByOption: {
            third: 'That is just your door. Two doors hold twice as much.',
            half: 'The doors started at 1/3 each, so the two you skipped hold 2/3.',
          },
          explanation:
            'Your door holds 1/3 of the probability; the remaining 2/3 sits on the other two doors.',
        },
      ],
    },
    {
      id: 'play-and-batch',
      kind: 'problem',
      interactionKind: 'monty-hall',
      variants: [
        {
          id: 'doors-sim',
          interactionKind: 'monty-hall',
          prompt:
            'Play a few rounds, then run games on autopilot. Compare always switching against always staying.',
          minGames: 100,
          feedbackCorrect:
            "There it is. Switching wins about 2/3 of the time, staying about 1/3. Switching turns the host's reveal into information.",
          feedbackDefault: 'Run a batch so the two strategies have room to separate.',
          feedbackByWrongValue: {
            incomplete: 'Run a batch of games so the switch and stay rates can separate.',
          },
          explanation:
            "Your first pick is right 1/3 of the time. The host's reveal concentrates the other 2/3 onto the single remaining door, so switching wins 2/3.",
        },
      ],
    },
    {
      id: 'switch-rate',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'switch',
          interactionKind: 'multiple-choice',
          prompt:
            'After 300 games of always switching, you won about 200. So P(win if you switch) is closest to:',
          context: '200 out of 300 reduces to a simple fraction.',
          options: [
            { id: 'third', label: '1/3' },
            { id: 'half', label: '1/2' },
            { id: 'twothirds', label: '2/3' },
          ],
          correctOptionId: 'twothirds',
          feedbackCorrect: 'Yes. About 2/3. Switching is the winning strategy.',
          feedbackDefault: '200 out of 300 reduces to a simple fraction.',
          feedbackByOption: {
            third: 'That is the staying rate. Switching is the other way around.',
            half: 'It is not a coin flip. Switching wins about twice as often as staying.',
          },
          explanation:
            'Switching wins whenever your first pick was wrong, which happens 2 times in 3.',
        },
        {
          id: 'stay',
          interactionKind: 'multiple-choice',
          prompt:
            'After 300 games of always staying, you won about 100. So P(win if you stay) is closest to:',
          context: '100 out of 300 reduces to a simple fraction.',
          options: [
            { id: 'third', label: '1/3' },
            { id: 'half', label: '1/2' },
            { id: 'twothirds', label: '2/3' },
          ],
          correctOptionId: 'third',
          feedbackCorrect:
            'Right. Staying wins about 1/3, only when your first pick was already the car.',
          feedbackDefault: '100 out of 300 reduces to a simple fraction.',
          feedbackByOption: {
            twothirds: 'That is the switching rate. Staying is the other way around.',
            half: 'Staying wins only when your first guess was right, which is 1 in 3.',
          },
          explanation: 'Staying wins only if the first pick was the car, probability 1/3.',
        },
      ],
    },
    {
      id: 'as-fraction',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'switch-fraction',
          interactionKind: 'fill-fraction',
          prompt: 'Write the probability of winning if you always switch, as a fraction.',
          numerator: 2,
          denominator: 3,
          feedbackCorrect: '2/3. Switching wins two times out of three.',
          feedbackDefault:
            'Switching wins when the first pick missed. How many of the three first picks miss?',
          feedbackByWrongAnswer: {
            '1/3': 'That is the staying probability. Switching is higher.',
            '1/2': 'Not a coin flip. Switching wins about twice as often as staying.',
          },
          explanation: 'Switching wins exactly when the first pick missed the car: 2 out of 3.',
        },
        {
          id: 'stay-fraction',
          interactionKind: 'fill-fraction',
          prompt: 'Write the probability of winning if you always stay, as a fraction.',
          numerator: 1,
          denominator: 3,
          feedbackCorrect: '1/3. Staying only wins when your first pick was right.',
          feedbackDefault:
            'Staying wins only on a correct first guess. How many of the three first picks are right?',
          feedbackByWrongAnswer: {
            '2/3': 'That is the switching probability.',
            '1/2': 'Staying wins only on a correct first guess, which is 1 in 3.',
          },
          explanation: 'Staying wins only if the first pick was the car: 1 out of 3.',
        },
      ],
    },
    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Information changed the odds',
      body: "Switching wins two times out of three because the host's reveal is not random. He always opens a goat, so he hands you information, and conditional probability turns that information into better odds. You have now counted, simulated, and reasoned about conditional chance. Distributions are next.",
      segueToLessonId: 'distributions',
    },
  ],
};
