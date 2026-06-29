import type { Lesson } from '../types';

/**
 * "Fair games" (Unit 7, Expected Value). The course capstone. D112.
 *
 * Audience: 8–15 year olds. Voice matches L1–L21: declarative, grounded,
 * sparing on contractions, no em dashes in user-facing copy, no chatty
 * interjections, sentences that flow.
 *
 * Pedagogical job: use expected value to judge a bet. A game is fair when its
 * expected NET gain is 0; it favors you when E > 0 and favors the other side
 * when E < 0. Then point the tool at real decisions: the casino house edge,
 * the lottery, and insurance (a deliberately negative-EV purchase that can
 * still be rational because of risk). Misconceptions hunted:
 *   1. comparing the gross payoff without subtracting the cost to play;
 *   2. "huge jackpot" overriding terrible odds;
 *   3. assuming negative expected value always means "do not do it."
 *
 *   1. welcome      — every bet has a price and a payoff; compare them
 *   2. the-rule     — theorem (fair when E(net) = 0) + definition (net gain)
 *   3. coin-bet     — MCQ: pay $1, heads returns $2, tails $0; net E = 0, fair
 *   4. dice-bet     — MCQ: pay $2, win $6 on a six; expected net = minus $1
 *   5. house-edge   — concept: the casino\u2019s small negative edge times the
 *                     long run (Unit 1) guarantees the house profits
 *   6. lottery      — MCQ: a giant jackpot with tiny odds is still a bad bet
 *   7. insurance    — MCQ: negative expected value can still be smart, because
 *                     it caps a rare catastrophic loss (risk, not just EV)
 *   8. wrap         — course capstone; no segue
 *
 * NOTE: no expected-value SkillId exists in content/skills.ts, so variants
 * leave `skills` unset on purpose (allowed; logs a migration warning).
 *
 * Design pattern:
 *   - State the fair-game test, drill it on two clean bets, then widen to the
 *     three real-world arenas where expected value is the deciding lens.
 *   - The insurance slot is the deliberate sophistication: it shows EV is the
 *     main tool, not the only one, which is an honest place to end the course.
 *
 * Design decisions are logged in `docs/design-iterations.md`.
 */
export const fairGames: Lesson = {
  id: 'fair-games',
  number: 32,
  title: 'Fair games',
  blurb: 'A bet is fair when the expected net gain is zero.',
  estimatedMinutes: 6,
  slots: [
    {
      id: 'welcome',
      kind: 'concept',
      illustration: { kind: 'coin' },
      title: 'Is this bet worth it?',
      body: [
        'Most games of chance ask for something up front. You buy a ticket, pay to play, or put down a stake. In return you might win a payoff. The question is whether the payoff is worth the price.',
        'Expected value answers it. Compare what you expect to win against what it costs to play, and you can tell at a glance whether a bet is fair, generous, or quietly stacked against you.',
      ],
    },

    {
      id: 'the-rule',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'The rule, named',
      prompt: 'A fair game leaves you even in the long run.',
      theorem: {
        name: 'Fair game',
        statement:
          'A game is fair when its expected net gain is 0. If the expected net gain is above 0 the game favors you; if it is below 0 it favors the other side.',
      },
      definition: {
        name: 'Net gain',
        statement:
          'Net gain is what you walk away with minus what you paid to play. A win of $2 on a $1 ticket is a net gain of $1; a loss is a negative net gain.',
      },
      body: [
        'The word "net" is the whole trick. A payoff that looks generous can still be a bad deal once you subtract the cost of playing.',
        'Fair does not mean you cannot lose on a given play. It means that over the long run, the wins and losses average out to zero, so you neither gain nor bleed money.',
      ],
    },

    {
      id: 'coin-bet',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'fair-coin-bet',
          interactionKind: 'multiple-choice',
          prompt:
            'A coin game costs $1 to play. Heads pays you $2 back, tails pays you nothing. Is this game fair?',
          context: 'Work with net gain: on heads you are $1 ahead, on tails you are $1 behind.',
          options: [
            { id: 'correct', label: 'Fair, the expected net gain is $0' },
            { id: 'good', label: 'It favors you' },
            { id: 'bad', label: 'It favors the house' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Net gain is plus $1 on heads and minus $1 on tails, so E(net) = {1/2} times 1 plus {1/2} times (minus 1) = $0. Fair.',
          feedbackDefault:
            'Subtract the $1 cost from each payoff to get the net, then weight by {1/2} each.',
          feedbackByOption: {
            good:
              'It would favor you only if the expected net gain were positive. Here it is {1/2} times 1 plus {1/2} times (minus 1) = $0, exactly fair.',
            bad:
              'The house has no edge here. Net gain is plus $1 or minus $1, equally likely, so E(net) = $0. The game is fair.',
          },
          explanation:
            'Net gain is the $2 payoff minus the $1 cost on heads (plus $1), and minus the $1 cost on tails (minus $1). E(net) = {1/2} times 1 plus {1/2} times (minus 1) = $0, so the game is fair.',
        },
      ],
    },

    {
      id: 'dice-bet',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'six-bet',
          interactionKind: 'multiple-choice',
          prompt:
            'It costs $2 to roll one die. You win $6 if you roll a six, otherwise nothing. What is the expected net gain per play?',
          context: 'Find the expected winnings first, then subtract the $2 cost.',
          options: [
            { id: 'correct', label: 'Minus $1' },
            { id: 'fair', label: '$0, it is fair' },
            { id: 'positive', label: 'Plus $1' },
            { id: 'full-cost', label: 'Minus $2' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Expected winnings are {1/6} times 6 = $1, and after the $2 cost the expected net gain is 1 minus 2 = minus $1.',
          feedbackDefault:
            'Expected winnings are {1/6} times 6. Then subtract the $2 you paid to play.',
          feedbackByOption: {
            fair:
              'It is not fair. Expected winnings are only {1/6} times 6 = $1, below the $2 cost, so the expected net gain is 1 minus 2 = minus $1.',
            positive:
              'Plus $1 is the expected winnings before the cost. Subtract the $2 you paid: 1 minus 2 = minus $1.',
            'full-cost':
              'Minus $2 forgets the $1 you expect to win back. Net is expected winnings minus cost: 1 minus 2 = minus $1.',
          },
          explanation:
            'Expected winnings: {1/6} times 6 plus {5/6} times 0 = $1. Net gain subtracts the cost: 1 minus 2 = minus $1 per play. The game favors the house.',
        },
      ],
    },

    {
      id: 'house-edge',
      kind: 'concept',
      illustration: { kind: 'die' },
      title: 'Why the house always wins',
      prompt: 'A tiny negative edge, played a million times, is a fortune.',
      body: [
        'Casinos do not need to cheat. Every bet is designed so the player\u2019s expected net gain is a little below zero. On an American roulette wheel, betting $1 on a single number pays $35 if it hits, with probability {1/38}, and loses your $1 the other {37/38} of the time.',
        'That works out to about minus 5 cents of expected net gain on every dollar bet. Small, but it never flips in your favor.',
        'Now bring back the long run from the very first unit. A 5-cent edge means almost nothing on one spin, but across millions of spins the average takes over, and the house collects its 5 cents per dollar as reliably as clockwork. The same law that pins a coin near one-half is what guarantees the casino its profit.',
      ],
    },

    {
      id: 'lottery',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'jackpot',
          interactionKind: 'multiple-choice',
          prompt:
            'A lottery ticket costs $2. The jackpot is $1,000,000, with a 1 in 10,000,000 chance of winning. Ignoring smaller prizes, is buying a ticket a good bet by expected value?',
          context: 'Expected payoff is the jackpot times its probability. Compare it to the $2 cost.',
          options: [
            {
              id: 'correct',
              label: 'No, the expected payoff is about $0.10, far below the $2 cost',
            },
            { id: 'jackpot-huge', label: 'Yes, the jackpot is enormous' },
            { id: 'someone', label: 'Yes, someone has to win it' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. Expected payoff is 1,000,000 divided by 10,000,000 = $0.10. Paying $2 for a dime of expected value is a net gain of about minus $1.90 per ticket.',
          feedbackDefault:
            'Multiply the jackpot by its probability to get the expected payoff, then compare it to the $2 ticket.',
          feedbackByOption: {
            'jackpot-huge':
              'A huge prize with tiny odds can still be a poor bet. The expected payoff is 1,000,000 times {1/10000000} = $0.10, nowhere near the $2 cost.',
            someone:
              'Someone winning does not make your ticket worth it. Your expected payoff is only $0.10 against a $2 cost, a net gain of about minus $1.90.',
          },
          explanation:
            'Expected payoff is jackpot times probability: 1,000,000 divided by 10,000,000 = $0.10. The expected net gain is 0.10 minus 2 = minus $1.90 per ticket, so by expected value it is a bad bet.',
        },
      ],
    },

    {
      id: 'insurance',
      kind: 'problem',
      interactionKind: 'multiple-choice',
      variants: [
        {
          id: 'why-insure',
          interactionKind: 'multiple-choice',
          prompt:
            'Insurance has a negative expected value for you on average, since the company must profit to stay in business. Why can buying it still be a smart choice?',
          context: 'Expected value is the main lens, but it is not the only thing that matters.',
          options: [
            {
              id: 'correct',
              label: 'It protects you from a rare but huge loss you could not absorb',
            },
            { id: 'positive-ev', label: 'Because it actually has a positive expected value' },
            { id: 'will-claim', label: 'Because you will probably make a claim and profit' },
          ],
          correctOptionId: 'correct',
          feedbackCorrect:
            'Right. A small, certain cost can be worth trading for protection against a rare disaster that would wipe you out. Expected value is not the only thing that matters; how much you can afford to lose matters too.',
          feedbackDefault:
            'Think about what a house fire or a hospital bill would cost compared to a monthly premium.',
          feedbackByOption: {
            'positive-ev':
              'It does not have positive expected value for you; the insurer\u2019s profit guarantees it is slightly negative. The reason to buy it is protection against ruin, not a positive average.',
            'will-claim':
              'Most people pay more in premiums than they ever claim, which is exactly why the expected value is negative. You buy it for the rare catastrophe, not for an average profit.',
          },
          explanation:
            'Insurance is a deliberately negative-EV purchase. You trade a small certain cost for protection against a rare loss too large to survive. Expected value ranks bets on average, but when one outcome could ruin you, avoiding that risk can be worth a slightly negative average.',
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      title: 'You can value a gamble',
      body:
        'A game is fair when its expected net gain is zero, good when it is positive, and a loser when it is negative. That single test exposes the casino\u2019s quiet edge and the lottery\u2019s false promise, while insurance shows that a negative average can still buy something worth having: safety from ruin.\n\nThat is the whole arc of the course. You learned what probability means, counted outcomes with care, conditioned on new evidence, and now you can put a price on chance itself. The math of luck is no longer a mystery. It is a tool you can use.',
      mascotLine: 'Expected net gain zero is fair. Below zero, walk away.',
    },
  ],
};
