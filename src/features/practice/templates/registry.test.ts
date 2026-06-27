/**
 * Registry test for the WP-4 template families.
 *
 * Asserts:
 * 1. TEMPLATES has at least 6 entries after the families register themselves
 * 2. All six WP-4 template ids are present
 * 3. Every topic in TOPICS is covered by at least one template
 * 4. All registered template ids are unique
 * 5. All templates satisfy basic structural invariants (skills non-empty, valid rate range sample)
 */

import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '@/features/practice/practiceEngine';
import { TOPICS } from '@/content/skills';
import { mulberry32 } from '@/lib/simulations';

const WP4_IDS = [
  'sum-of-two-dice',
  'at-least-one-via-complement',
  'k-heads-in-n',
  'pick-k-of-n-unordered',
  'conditional-bayes-2x2',
  'gambler-fallacy-mc',
] as const;

describe('TEMPLATES registry', () => {
  it('has at least 6 registered templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });

  it('contains all six WP-4 template ids', () => {
    const ids = TEMPLATES.map((t) => t.id);
    for (const id of WP4_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('all template ids are unique', () => {
    const ids = TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('covers all five topics (one template per topic minimum)', () => {
    const coveredTopics = new Set(TEMPLATES.map((t) => t.topic));
    for (const topic of TOPICS) {
      expect(coveredTopics.has(topic)).toBe(true);
    }
  });

  it('each template has at least one skill defined', () => {
    for (const template of TEMPLATES) {
      expect(template.skills.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('rate(sample(rng)) returns a finite number in [700, 2000] for each template', () => {
    const rng = mulberry32(0x1234_5678);
    for (const template of TEMPLATES) {
      const params = template.sample(rng);
      const r = template.rate(params);
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(700);
      expect(r).toBeLessThanOrEqual(2000);
    }
  });

  it('each WP-4 template maps to the correct topic', () => {
    const topicById: Record<string, string> = {
      'sum-of-two-dice':             'counting',
      'at-least-one-via-complement': 'complement',
      'k-heads-in-n':                'distributions',
      'pick-k-of-n-unordered':       'permutations-combinations',
      'conditional-bayes-2x2':       'conditional',
      'gambler-fallacy-mc':          'long-run',
    };
    for (const template of TEMPLATES) {
      if (template.id in topicById) {
        expect(template.topic).toBe(topicById[template.id]);
      }
    }
  });
});
