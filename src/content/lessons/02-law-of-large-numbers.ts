import type { Lesson } from '../types';

export const lesson2: Lesson = {
  id: 'law-of-large-numbers',
  number: 2,
  title: 'Law of large numbers',
  blurb: 'Why simulation works. Watch a ratio converge as you flip more times.',
  estimatedMinutes: 5,
  slots: [
    {
      id: 'recap',
      kind: 'concept',
      prompt:
        'A probability is a prediction about the long run, not the next flip. Saying P(heads) is 1/2 does not promise heads, tails, heads, tails.',
      illustration: { kind: 'coin' },
    },
    {
      id: 'theory-anchor',
      kind: 'problem',
      interactionKind: 'fill-fraction',
      variants: [
        {
          id: 'heads',
          interactionKind: 'fill-fraction',
          prompt: 'A fair coin has two equally likely sides. What is P(heads)? Enter it as a fraction.',
          numerator: 1,
          denominator: 2,
          feedbackCorrect: 'Right. One favorable side out of two.',
          feedbackDefault: 'Count the favorable sides, then divide by the total number of sides.',
          feedbackByWrongAnswer: {
            '1/1': 'A coin has two sides, and heads is only one of them.',
            '2/2': 'That would make heads certain on every flip.',
          },
          explanation: 'Favorable outcomes over total outcomes: 1 head out of 2 equally likely sides.',
        },
        {
          id: 'six',
          interactionKind: 'fill-fraction',
          prompt: 'What is P(rolling a six) on a fair die? Tap the faces to count, then enter the fraction.',
          numerator: 1,
          denominator: 6,
          showDieContext: true,
          feedbackCorrect: 'Yes. One favorable face out of six.',
          feedbackDefault: 'Only one face shows a six. How many faces are there in total?',
          feedbackByWrongAnswer: {
            '6/6': 'That would mean every roll is a six.',
            '1/3': 'Only one face is a six, not two.',
          },
          explanation: 'One six out of six equally likely faces, so P(six) is 1/6.',
        },
      ],
    },
    {
      id: 'bumpy',
      kind: 'concept',
      prompt:
        'Theory says half. But flip a real coin ten times and you might get seven heads. A short run is bumpy. Watch what happens when the run gets long.',
      illustration: { kind: 'coin' },
    },
    {
      id: 'watch-converge',
      kind: 'problem',
      interactionKind: 'simulate-proportion',
      variants: [
        {
          id: 'coin-converge',
          interactionKind: 'simulate-proportion',
          prompt: 'Flip the coin many times. Watch the running share of heads. Keep flipping until you reach 200.',
          scenario: 'coin',
          targetProbability: 0.5,
          targetLabel: 'True P(heads) = 50%',
          minTrials: 200,
          feedbackCorrect:
            'See it? Early on the share swings, but as the flips pile up it settles toward 50%. That is the law of large numbers.',
          feedbackDefault: 'Keep flipping. The share steadies only after many flips.',
          feedbackByWrongValue: {
            incomplete: 'Run more flips. The pattern shows up after a couple hundred.',
          },
          explanation:
            'Each flip is still 50/50. Over many flips the lucky streaks cancel out, so the running share closes in on the true probability.',
        },
        {
          id: 'die-converge',
          interactionKind: 'simulate-proportion',
          prompt: 'Roll the die many times. Watch the running share of sixes. Keep rolling until you reach 200.',
          scenario: 'die-six',
          targetProbability: 1 / 6,
          targetLabel: 'True P(six) is about 16.7%',
          minTrials: 200,
          feedbackCorrect:
            'The share of sixes wanders at first, then settles near one in six. More rolls, steadier share.',
          feedbackDefault: 'Keep rolling. One in six only shows up clearly after many rolls.',
          feedbackByWrongValue: {
            incomplete: 'Run more rolls. The share needs a couple hundred to settle.',
          },
          explanation:
            'A six lands once in six rolls on average. Averaging over many rolls cancels the streaks, so the share approaches 1/6.',
        },
      ],
    },
    {
      id: 'which-closer',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'coin-runs',
          interactionKind: 'multiple-choice',
          prompt: "Which run's share of heads is more likely to land within one percent of 50%?",
          context: 'Think about what you just watched: more trials, steadier share.',
          options: [
            { id: 'few', label: '20 flips' },
            { id: 'many', label: '2000 flips' },
          ],
          correctOptionId: 'many',
          feedbackCorrect: 'Right. More flips means the share hugs 50% more tightly.',
          feedbackDefault: 'More trials make the share steadier, not less steady.',
          feedbackByOption: {
            few: 'A short run swings widely. Twenty flips can easily be 60% or 40% heads.',
          },
          explanation:
            'As the number of trials grows, the running share converges to the true probability. Short runs stay noisy.',
        },
        {
          id: 'die-runs',
          interactionKind: 'multiple-choice',
          prompt: "Which run's share of sixes is more likely to land near one in six?",
          context: 'You just saw it: the share steadies as the rolls add up.',
          options: [
            { id: 'few', label: '30 rolls' },
            { id: 'many', label: '3000 rolls' },
          ],
          correctOptionId: 'many',
          feedbackCorrect: 'Yes. More rolls pull the share close to one in six.',
          feedbackDefault: 'More trials make the share steadier.',
          feedbackByOption: {
            few: 'Thirty rolls is a short run. The share of sixes can swing far from one in six.',
          },
          explanation:
            'The law of large numbers: the running share converges to the true probability as trials grow.',
        },
      ],
    },
    {
      id: 'why-simulate',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'estimate-messy',
          interactionKind: 'multiple-choice',
          prompt: 'Suppose a probability is too messy to work out by counting. How could you still estimate it?',
          options: [
            { id: 'count', label: 'List every possible outcome by hand' },
            { id: 'trials', label: 'Run the situation many times and take the share that succeed' },
            { id: 'guess', label: 'Guess and round to a simple fraction' },
          ],
          correctOptionId: 'trials',
          feedbackCorrect:
            'Exactly. Run it many times and read off the share. That is simulation, and it works even when counting fails.',
          feedbackDefault: 'When you cannot count, you can still measure by repeating the trial.',
          feedbackByOption: {
            count: 'That is the very thing that breaks down when there are too many outcomes.',
            guess: 'A guess is not an estimate. Running trials gives you a number you can trust.',
          },
          explanation:
            'Simulation trades exact counting for many repetitions. The law of large numbers makes the measured share approach the true probability.',
        },
        {
          id: 'birthday-foreshadow',
          interactionKind: 'multiple-choice',
          prompt:
            'You want the chance that two people in a room of 30 share a birthday, and the formula is hard. What is the most reliable way to estimate it?',
          options: [
            { id: 'count', label: 'Write out every combination of birthdays' },
            { id: 'trials', label: 'Fill the room with random birthdays many times and take the share with a match' },
            { id: 'guess', label: 'Assume it must be about 30 out of 365' },
          ],
          correctOptionId: 'trials',
          feedbackCorrect:
            'Right. Simulate the room many times and read off the share. You will do exactly this in the birthday lesson coming up.',
          feedbackDefault: 'You cannot list the combinations by hand, but you can repeat the trial.',
          feedbackByOption: {
            count: 'There are far too many combinations to write out.',
            guess: 'That intuition is way off, as you will see when the birthday lesson arrives.',
          },
          explanation:
            'Repeating a trial and taking the share is simulation. It estimates a probability without any counting formula.',
        },
      ],
    },
    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You watched probability settle',
      body:
        'A single trial is unpredictable, but the long-run share is not. That is why simulation works: repeat a situation enough times and the share lands on the true probability. Next, the counting tools that make the formula side work when the sample space is too big to list.',
      segueToLessonId: 'counting-carefully',
    },
  ],
};
