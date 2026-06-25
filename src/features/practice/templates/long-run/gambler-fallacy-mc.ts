/**
 * Template family: gambler-fallacy-mc
 *
 * Topic: long-run | Skills: long-run-vs-single-trial, independence
 * Retrieval form: definition | Interaction: multiple-choice | No simulate
 *
 * Parameters: streakLen ∈ {3..8} (number of heads in a row), flavor ∈ {0..2}
 *   (flavor selects the phrasing: coin flip / die / sports streak)
 * Solve:  { kind: 'choice', optionId: 'independent' }
 *
 * Vetting: structural assertion only (no Monte-Carlo; no exact enumeration of a
 * count). The test asserts:
 *   - solve always returns { kind:'choice', optionId:'independent' }
 *   - render's correctOptionId equals solve's optionId for all sampled params
 *   - exactly one option with id='independent' exists
 *   - misconceptionByOption.due === 'gambler'
 */

import type { Template } from '../types';
import type { MisconceptionKey } from '@/content/misconceptions';

type Params = { streakLen: number; flavor: number };

const FLAVORS = [
  {
    article: 'coin',
    verb: 'flipped',
    outcome: 'heads',
    question: 'What is the probability the next flip lands tails?',
  },
  {
    article: 'six-sided die',
    verb: 'rolled',
    outcome: 'sixes',
    question: 'What is the probability the next roll is also a 6?',
  },
  {
    article: 'basketball player',
    verb: 'made',
    outcome: 'free throws in a row',
    question: 'Assuming each free throw is an independent 50/50 shot, what is the probability the next attempt is a miss?',
  },
] as const;

function unchangedProbability(flavor: number): string {
  return flavor === 1 ? '1/6' : '1/2';
}

export const gamblerFallacyMcTemplate: Template<Params> = {
  id: 'gambler-fallacy-mc',
  topic: 'long-run',
  skills: ['long-run-vs-single-trial', 'independence'],
  retrievalForm: 'definition',

  rate({ streakLen }) {
    // Longer streaks feel more convincing, making the fallacy harder to reject
    return 800 + (streakLen - 3) * 30;
  },

  sample(rng) {
    const streakLen = 3 + Math.floor(rng() * 6);   // 3..8
    const flavor = Math.floor(rng() * 3);           // 0..2
    return { streakLen, flavor };
  },

  solve(_params) {
    return { kind: 'choice', optionId: 'independent' };
  },

  render(params) {
    const { streakLen, flavor } = params;
    const sc = FLAVORS[flavor];
    const answer = this.solve(params);
    if (answer.kind !== 'choice') throw new Error('solve returned unexpected kind');

    const options = [
      {
        id: 'independent',
        label: `${unchangedProbability(flavor)} — each outcome is independent of previous results`,
      },
      {
        id: 'due',
        label:
          flavor === 1
            ? 'Less than 1/6 — a non-six is "due" after so many sixes'
            : 'Greater than 1/2 — the opposite outcome is "due"',
        subtext: "Gambler's fallacy: past outcomes do not change future probabilities",
      },
      {
        id: 'hot',
        label: flavor === 2
          ? 'Greater than 1/2 — the player is "on a roll" (hot hand)'
          : 'Greater than 1/2 — the streak will continue',
        subtext: 'Hot-hand belief: each trial is still independent',
      },
      {
        id: 'unknown',
        label: 'Cannot be determined from the information given',
      },
    ];

    const misconceptionByOption: Record<string, MisconceptionKey> = {
      due: 'gambler',
    };

    const feedbackByOption: Record<string, string> = {
      independent:
        'Correct! Each trial is independent — past outcomes have no effect on future probabilities.',
      due:
        "This is the gambler's fallacy. An independent random process has no \"memory\" — the coin/die doesn't know it's been on a streak.",
      hot:
        'This is the hot-hand belief. For truly independent events, streaks don\'t change the probability of any single outcome.',
      unknown:
        `We do know! The key information is that each trial is independent with P = ${unchangedProbability(flavor)}, so the next-outcome probability stays ${unchangedProbability(flavor)} regardless of history.`,
    };

    return {
      id: `gambler-fallacy-mc:streak=${streakLen},flavor=${flavor}`,
      interactionKind: 'multiple-choice',
      prompt:
        flavor === 2
          ? `A basketball player has ${sc.verb} ${streakLen} ${sc.outcome}. ${sc.question}`
          : `A fair ${sc.article} has been ${sc.verb} and landed on ${sc.outcome} ${streakLen} times in a row. ${sc.question}`,
      options,
      correctOptionId: answer.optionId,
      feedbackByOption,
      misconceptionByOption,
      feedbackCorrect:
        'Correct! Independent events have no memory — the probability stays the same no matter what came before.',
      feedbackDefault:
        "The key is independence: past results don't change the probability of future outcomes for a fair coin, die, or any independent process.",
      skills: ['long-run-vs-single-trial', 'independence'],
    };
  },

  explain({ streakLen, flavor }) {
    const sc = FLAVORS[flavor];
    const probability = unchangedProbability(flavor);
    return {
      title: `Independence and the gambler's fallacy`,
      steps: [
        `A fair ${flavor === 2 ? 'shot' : sc.article} has P(outcome) = ${probability} on every trial.`,
        `Each trial is independent: the outcome does not depend on previous results.`,
        `A streak of ${streakLen} ${sc.outcome} is surprising, but it doesn't "use up" probability.`,
        `P(next outcome) = ${probability}, exactly as before the streak began.`,
        `The gambler's fallacy is the mistaken belief that a streak makes the opposite outcome "due."`,
      ],
    };
  },
};
