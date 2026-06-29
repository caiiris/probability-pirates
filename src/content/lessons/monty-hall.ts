import type { Lesson } from '../types';

/**
 * "Monty Hall" (Unit 5, Conditional Probability). The signature payoff
 * lesson: the famous switch-or-stay puzzle, made believable by hand-play
 * and a simulated batch.
 *
 * Audience: 8–15 year olds. Voice matches L1–L14: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: turn the seductive "it is 50/50 now" intuition into the
 * correct answer that switching wins 2/3 of the time. The host knows where
 * the car is and always opens a goat, so the reveal is information, not
 * luck. Your first door holds 1/3; the other two together hold 2/3, and the
 * host's reveal collapses that whole 2/3 onto the one unopened door.
 *
 *   1. setup          — concept: three doors, one car two goats, you pick,
 *                       the host opens a goat door, then offers a switch.
 *   2. gut-check      — commit-once MCQ: switch, stay, or no difference?
 *                       Trap is the seductive 50/50; correct is "doubles."
 *   3. your-door      — concept: your first door holds 1/3; the other two
 *                       together hold 2/3.
 *   4. other-two      — commit-once MCQ (harvested L5): before any door
 *                       opens, P(car behind the other two) = 2/3. Trap 1/2.
 *   5. the-reveal     — concept: the host always opens a goat, so his
 *                       reveal is information; the 2/3 collapses onto the
 *                       single unopened door.
 *   6. play-and-batch — monty-hall interaction: play rounds, then run a
 *                       batch on autopilot to see ~2/3 vs ~1/3 separate.
 *   7. read-the-rate  — MCQ (harvested L5): 200/300 switch wins → 2/3;
 *                       second variant 100/300 stay wins → 1/3.
 *   8. as-fraction    — fill-fraction (harvested L5): P(win | switch) = 2/3;
 *                       second variant P(win | stay) = 1/3.
 *   9. wrap           — information changed the odds; conditional
 *                       probability turned the reveal into better odds.
 *
 * Design pattern:
 *   - Discovery-first commit-once trap (the famous wrong intuition).
 *   - Reason it out (1/3 vs 2/3), then SEE it (simulation), then name the
 *     rates as a fraction.
 *   - Math: switch wins exactly when the first pick missed (2 of 3); stay
 *     wins only when the first pick hit (1 of 3).
 *
 * Slots 4, 6, 7, and 8 are harvested from the reservoir
 * `05-conditional-probability.ts`, re-voiced into the granular house style.
 */
export const montyHall: Lesson = {
  id: 'monty-hall',
  number: 26,
  title: 'Monty Hall',
  blurb: 'The switch-or-stay puzzle, settled by simulation.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'setup',
      kind: 'concept',
      illustration: { kind: 'doors' },
      title: 'Three doors, one car',
      prompt:
        'A game show puts a car behind one of three doors and a goat behind each of the other two. You want the car.',
      body: [
        'You pick a door, but it stays closed for now. Then the host, who knows exactly what is behind every door, opens one of the two doors you did not pick. He always opens a door with a goat behind it.',
        'Now two doors are still closed: the one you picked and one other. The host offers you a choice. Keep your first door, or switch to the other closed one. What should you do?',
      ],
    },

    // Commit-once trap. The famous wrong intuition: two doors left, so it
    // "must" be 50/50. Right or wrong, Continue unlocks; the payoff is the
    // reasoning and simulation on the next slots.
    {
      id: 'gut-check',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      commitOnce: true,
      variants: [
        {
          id: 'switch-help-hurt',
          interactionKind: 'multiple-choice',
          prompt:
            'Two doors are left closed: yours and one other. Does switching to the other door help, hurt, or make no difference?',
          context:
            'Trust your gut for now. The next pages will test your answer against real games.',
          options: [
            { id: 'fifty', label: 'Switching makes no difference, it is 50/50 now' },
            { id: 'double', label: 'Switching doubles your chance of winning' },
            { id: 'stay', label: 'Staying is the better bet' },
          ],
          correctOptionId: 'double',
          feedbackCorrect:
            'That is the surprising truth, and you will prove it. Switching wins about 2/3 of the time, twice as often as staying.',
          feedbackDefault:
            'Most people say 50/50 because two doors are left. Hold that thought. The next pages show what really happens.',
          feedbackByOption: {
            fifty:
              'This is the famous trap. Two closed doors feel like a coin flip, but the host did not open his door at random. The reasoning ahead shows why switching is better.',
            double:
              'Correct, and you will see it confirmed. Switching wins about 2/3 of the time.',
            stay:
              'Staying is actually the weaker choice. It wins only when your very first guess was already the car. The next pages show why.',
          },
          misconceptionByOption: {
            fifty: 'base_rate_neglect',
          },
          explanation:
            'Your first door was a 1 in 3 guess, and that does not change when the host opens a goat door. The host steers the other 2/3 onto the single door he leaves closed, so switching wins about 2 times in 3.',
          skills: ['monty-hall-reasoning'],
        },
      ],
    },

    {
      id: 'your-door',
      kind: 'concept',
      illustration: { kind: 'doors' },
      title: 'Your door is a 1 in 3 guess',
      prompt:
        'When you first pointed at a door, the car was equally likely to be behind any of the three.',
      body: [
        'So your door has a 1 in 3 chance of hiding the car. That leaves a 2 in 3 chance the car is behind one of the other two doors instead.',
        'Hold on to those two numbers. Your door holds {1/3} of the chance, and the other two doors together hold {2/3}. Opening a door later will not change the fact that your first guess was a 1 in 3 shot.',
      ],
      theorem: {
        name: 'Where the chance lives',
        statement:
          'The three doors start equally likely, so your chosen door holds {1/3} and the two doors you did not pick hold {2/3} between them.',
      },
    },

    // Harvested from reservoir L5 'other-two', re-voiced. Commit-once so the
    // 2/3 lands as a discovery before the reveal slot uses it.
    {
      id: 'other-two',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'pick-one',
          interactionKind: 'multiple-choice',
          prompt:
            'You pick door 1. Before any door opens, what is the chance the car is behind one of the other two doors combined?',
          context:
            'Your door has a 1 in 3 chance. The rest of the chance has to live somewhere.',
          options: [
            { id: 'third', label: '1/3' },
            { id: 'half', label: '1/2' },
            { id: 'twothirds', label: '2/3' },
          ],
          correctOptionId: 'twothirds',
          feedbackCorrect:
            'Right. Your door holds {1/3}, so the other two doors together hold {2/3}.',
          feedbackDefault:
            'All three doors started equal at {1/3} each. How much is left for the two doors you did not pick?',
          feedbackByOption: {
            third:
              'That is the chance for your single door. The other two doors together hold more than that.',
            half:
              'It feels like {1/2}, but the three doors started equal at {1/3} each, so the two you skipped hold {2/3} between them.',
          },
          misconceptionByOption: {
            half: 'base_rate_neglect',
          },
          explanation:
            'The chances across all three doors add up to 1. Your door is {1/3}, so the other two doors share the remaining {2/3}.',
          skills: ['monty-hall-reasoning'],
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
          feedbackCorrect: 'Yes. Your door is {1/3}, and the other two are {2/3} together.',
          feedbackDefault: 'Three equal doors. Your one door is {1/3} of the total.',
          feedbackByOption: {
            third: 'That is just your door. Two doors hold twice as much.',
            half: 'The doors started at {1/3} each, so the two you skipped hold {2/3}.',
          },
          misconceptionByOption: {
            half: 'base_rate_neglect',
          },
          explanation:
            'Your door holds {1/3} of the chance; the remaining {2/3} sits on the other two doors.',
          skills: ['monty-hall-reasoning'],
        },
      ],
    },

    {
      id: 'the-reveal',
      kind: 'concept',
      illustration: { kind: 'doors' },
      title: 'The host hands you information',
      prompt:
        'The host does not open a door at random. He knows where the car is, and he always opens a goat.',
      body: [
        'The two doors you did not pick hold {2/3} of the chance between them. The host now opens one of those two doors and shows you a goat. He never reveals the car, so that {2/3} does not vanish.',
        'Instead the whole {2/3} slides onto the one door he chose to leave closed. Your door is still the {1/3} guess it always was, but the other closed door is now carrying the full {2/3}.',
      ],
      theorem: {
        name: 'The 2/3 collapses',
        statement:
          'Because the host always opens a goat, the {2/3} that sat on the two doors you skipped collapses onto the single door he leaves closed. Switching wins whenever your first pick missed the car.',
      },
    },

    // Harvested from reservoir L5 'play-and-batch'. The monty-hall
    // interaction: hand-play plus an autopilot batch so the ~2/3 vs ~1/3
    // separation is seen, not just argued.
    {
      id: 'play-and-batch',
      kind: 'problem',
      interactionKind: 'monty-hall',
      variants: [
        {
          id: 'doors-sim',
          interactionKind: 'monty-hall',
          prompt:
            'Play a few rounds by hand, then run games on autopilot. Watch how always switching compares to always staying.',
          minGames: 100,
          feedbackCorrect:
            "There it is. Switching wins about {2/3} of the time, staying about {1/3}. The host's reveal is what tips the odds.",
          feedbackDefault: 'Run a batch so the two strategies have room to separate.',
          feedbackByWrongValue: {
            incomplete:
              'Play a round or run a batch of games so the switch and stay rates can pull apart.',
          },
          skills: ['monty-hall-reasoning', 'conditional-probability'],
          explanation:
            "Your first pick is right {1/3} of the time. The host's reveal concentrates the other {2/3} onto the single remaining door, so switching wins about {2/3}.",
        },
      ],
    },

    // Harvested from reservoir L5 'switch-rate'. Read the simulated counts
    // back as the conditional probabilities they estimate.
    {
      id: 'read-the-rate',
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
          feedbackCorrect: 'Yes. About {2/3}. Switching is the winning strategy.',
          feedbackDefault: '200 out of 300 reduces to a simple fraction.',
          feedbackByOption: {
            third: 'That is the staying rate. Switching is the other way around.',
            half: 'It is not a coin flip. Switching wins about twice as often as staying.',
          },
          misconceptionByOption: {
            half: 'base_rate_neglect',
          },
          skills: ['monty-hall-reasoning', 'conditional-probability'],
          explanation:
            'Switching wins whenever your first pick was wrong, which happens 2 times in 3, so P(win if you switch) = {2/3}.',
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
            'Right. Staying wins about {1/3}, only when your first pick was already the car.',
          feedbackDefault: '100 out of 300 reduces to a simple fraction.',
          feedbackByOption: {
            twothirds: 'That is the switching rate. Staying is the other way around.',
            half: 'Staying wins only when your first guess was right, which is 1 in 3.',
          },
          misconceptionByOption: {
            half: 'base_rate_neglect',
          },
          skills: ['monty-hall-reasoning', 'conditional-probability'],
          explanation:
            'Staying wins only if the first pick was already the car, which happens 1 time in 3, so P(win if you stay) = {1/3}.',
        },
      ],
    },

    // Harvested from reservoir L5 'as-fraction'. Name both conditional
    // probabilities exactly as fractions.
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
          misconceptionByFraction: [{ num: 1, den: 2, key: 'base_rate_neglect' }],
          skills: ['monty-hall-reasoning', 'conditional-probability'],
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
          misconceptionByFraction: [{ num: 1, den: 2, key: 'base_rate_neglect' }],
          skills: ['monty-hall-reasoning', 'conditional-probability'],
          explanation: 'Staying wins only if the first pick was the car: 1 out of 3.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'Information changed the odds',
      body:
        "Switching wins two times out of three because the host's reveal is not random. He always opens a goat, so he hands you information about the doors you did not pick.\n\nThat is conditional probability at work: once you learn the host's door is a goat, the {2/3} that sat on the other two doors collapses onto the single door he left closed. You reasoned it out, played it by hand, and watched the simulation confirm it.\n\nNext you put a price on chance itself. When you bet on a probability, what payoff should you expect?",
      mascotLine: 'Two doors left, but never 50/50. Switch and win two in three.',
      segueToLessonId: 'expected-value-intuition',
    },
  ],
};
