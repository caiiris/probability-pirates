/**
 * Per-topic practice rollup for the Progress page (spec-progress-insights S2).
 *
 * Pure: derived entirely from the already-loaded learner model (Engine A
 * per-skill stats), grouped by each skill's topic. No new Firestore reads, no
 * new storage. Topics with zero practice attempts are omitted.
 */

import { SKILLS, TOPICS } from '@/content/skills';
import type { SkillId, Topic } from '@/content/skills';
import type { LearnerModel, SkillStat } from './learnerModel';

export type TopicSummary = {
  topic: Topic;
  /** Total correct practice answers across the topic's skills. */
  solved: number;
  /** Total practice attempts across the topic's skills. */
  attempts: number;
  /** Rounded percentage correct (0–100). */
  accuracy: number;
};

export function summarizeByTopic(model: LearnerModel): TopicSummary[] {
  const totals: Partial<Record<Topic, { solved: number; attempts: number }>> = {};

  for (const [id, stat] of Object.entries(model.skills) as [SkillId, SkillStat][]) {
    const topic = SKILLS[id]?.topic;
    if (!topic) continue;
    const bucket = totals[topic] ?? { solved: 0, attempts: 0 };
    bucket.solved += stat.correct;
    bucket.attempts += stat.attempts;
    totals[topic] = bucket;
  }

  // Preserve TOPICS order; drop topics with no attempts.
  return TOPICS.flatMap((topic) => {
    const bucket = totals[topic];
    if (!bucket || bucket.attempts === 0) return [];
    return [
      {
        topic,
        solved: bucket.solved,
        attempts: bucket.attempts,
        accuracy: Math.round((bucket.solved / bucket.attempts) * 100),
      },
    ];
  });
}
