import { describe, expect, it } from 'vitest';
import { assertLessonInvariants } from '../assertLessonInvariants';
import { fairGames } from './fair-games';
import type { ConceptSlot, MultipleChoiceVariant } from '../types';

describe('fair-games (Expected Value capstone) invariants', () => {
  it('passes assertLessonInvariants', () => {
    expect(() => assertLessonInvariants(fairGames)).not.toThrow();
  });

  it('is playable on the live path (has content, not coming soon)', () => {
    expect(fairGames.comingSoon).toBeFalsy();
    expect(fairGames.slots.length).toBeGreaterThan(0);
  });

  it('walks the fair-game arc', () => {
    expect(fairGames.slots.map((s) => s.id)).toEqual([
      'welcome',
      'the-rule',
      'coin-bet',
      'dice-bet',
      'house-edge',
      'lottery',
      'insurance',
      'wrap',
    ]);
  });

  it('defines a fair game (E(net) = 0) as a theorem and net gain as a definition', () => {
    const slot = fairGames.slots.find((s) => s.id === 'the-rule') as ConceptSlot | undefined;
    if (slot?.kind === 'concept') {
      expect(slot.theorem?.name).toMatch(/fair game/i);
      expect(slot.definition?.name).toMatch(/net gain/i);
    }
  });

  it('judges the coin bet fair and the dice bet at minus $1', () => {
    const coin = fairGames.slots.find((s) => s.id === 'coin-bet');
    if (coin?.kind === 'problem') {
      const v = coin.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label.toLowerCase()).toMatch(/fair/);
    }
    const dice = fairGames.slots.find((s) => s.id === 'dice-bet');
    if (dice?.kind === 'problem') {
      const v = dice.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label.toLowerCase()).toMatch(
        /minus \$1/,
      );
    }
  });

  it('rejects the lottery as a bad bet despite the jackpot', () => {
    const slot = fairGames.slots.find((s) => s.id === 'lottery');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label.toLowerCase()).toMatch(/no,/);
    }
  });

  it('explains why negative-EV insurance can still be rational', () => {
    const slot = fairGames.slots.find((s) => s.id === 'insurance');
    if (slot?.kind === 'problem') {
      const v = slot.variants[0] as MultipleChoiceVariant;
      expect(v.options.find((o) => o.id === v.correctOptionId)?.label.toLowerCase()).toMatch(
        /protect|rare|huge loss/,
      );
    }
  });

  it('is the course capstone: no segue out of the wrap', () => {
    const wrap = fairGames.slots.find((s) => s.id === 'wrap');
    if (wrap?.kind === 'wrap') {
      expect(wrap.segueToLessonId).toBeUndefined();
      expect(wrap.mascotLine?.length).toBeGreaterThan(0);
    }
  });
});
