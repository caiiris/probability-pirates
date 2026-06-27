import { describe, it, expect } from 'vitest';
import { summarizeByTopic } from './topicSummary';
import { emptyModel, type LearnerModel, type SkillStat } from './learnerModel';

const NOW = 1_700_000_000_000;

function stat(attempts: number, correct: number): SkillStat {
  return { rating: 1000, attempts, correct, recentCorrect: 0.5, firstSeenAt: NOW, lastSeenAt: NOW };
}

describe('summarizeByTopic', () => {
  it('groups per-skill stats by topic and computes accuracy', () => {
    const model: LearnerModel = {
      ...emptyModel(NOW),
      skills: {
        // both permutations-combinations
        combinations: stat(10, 8),
        permutations: stat(10, 4),
        // complement
        'complement-rule': stat(4, 1),
      },
    };
    const summary = summarizeByTopic(model);

    const pc = summary.find((s) => s.topic === 'permutations-combinations')!;
    expect(pc.attempts).toBe(20);
    expect(pc.solved).toBe(12);
    expect(pc.accuracy).toBe(60); // 12/20

    const comp = summary.find((s) => s.topic === 'complement')!;
    expect(comp.attempts).toBe(4);
    expect(comp.solved).toBe(1);
    expect(comp.accuracy).toBe(25);
  });

  it('omits topics with zero practice attempts', () => {
    const model: LearnerModel = {
      ...emptyModel(NOW),
      skills: { combinations: stat(3, 2) },
    };
    const summary = summarizeByTopic(model);
    expect(summary.map((s) => s.topic)).toEqual(['permutations-combinations']);
    expect(summary.some((s) => s.topic === 'distributions')).toBe(false);
  });

  it('returns an empty array for a model with no practice', () => {
    expect(summarizeByTopic(emptyModel(NOW))).toEqual([]);
  });
});
