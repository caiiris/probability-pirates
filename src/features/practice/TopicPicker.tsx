/**
 * TopicPicker — topic chip selector for the practice loop (WP-6b).
 *
 * Renders a horizontal row of chips, one per topic in TOPICS. The selected
 * topic is controlled externally; the component calls onSelect when the user
 * taps a different chip.
 *
 * Default selection: on first render (when no topic is active or the parent
 * has passed `null`/`undefined`), the component preselects the topic that owns
 * the learner's weakestSkills[0] from subscribeLearnerModel (WP-5). Falls back
 * to TOPICS[0] if the model has no weakest skill or is not yet loaded.
 *
 * The default-selection logic runs only once (at mount) to avoid overriding a
 * user's explicit selection when model data arrives late.
 */

import { useEffect, useRef, useState } from 'react';
import { TOPICS, SKILLS } from '@/content/skills';
import type { Topic } from '@/content/skills';
import { subscribeLearnerModel } from '@/features/learner/learnerModelService';

// ─── Topic display labels ─────────────────────────────────────────────────────

const TOPIC_LABELS: Record<Topic, string> = {
  counting: 'Counting',
  'permutations-combinations': 'Permutations & Combinations',
  'inclusion-exclusion': 'Inclusion-Exclusion',
  'long-run': 'Long-run',
  complement: 'Complement',
  conditional: 'Conditional',
  distributions: 'Distributions',
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  /** Currently selected topic (controlled by PracticePage). */
  selectedTopic: Topic;
  /** Called when the user taps a chip. */
  onSelect: (topic: Topic) => void;
  /** Firebase UID — used to read the learner model for default selection. */
  uid: string | null | undefined;
  /**
   * When false, the model-based default selection is disabled. Used when the
   * parent already chose a topic explicitly (e.g. a `?topic=` deep link from a
   * "Watch out for" misconception card) so that choice is not overridden.
   * Defaults to true.
   */
  autoSuggest?: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TopicPicker({ selectedTopic, onSelect, uid, autoSuggest = true }: Props) {
  // Track whether we have already applied the model-based default. We only do
  // this once at mount so a user's explicit selection is never overridden.
  const defaultApplied = useRef(false);
  // Shadow of the current selectedTopic inside the effect cleanup.
  const selectedTopicRef = useRef(selectedTopic);
  selectedTopicRef.current = selectedTopic;

  // `suggestedTopic` is set by the learner-model subscription and used to
  // preselect the chip on the first render only.
  const [suggestedTopic, setSuggestedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (!autoSuggest) return;
    if (!uid) return;
    const unsub = subscribeLearnerModel(uid, (model) => {
      if (defaultApplied.current) return;
      if (!model || model.weakestSkills.length === 0) return;
      const weakestSkillId = model.weakestSkills[0];
      const skillMeta = SKILLS[weakestSkillId];
      if (skillMeta) {
        setSuggestedTopic(skillMeta.topic as Topic);
      }
    });
    return unsub;
  }, [uid, autoSuggest]);

  // Apply the suggestion exactly once, only if the parent hasn't already set a
  // non-default topic (we compare against the ref to avoid stale state).
  useEffect(() => {
    if (!autoSuggest) return;
    if (defaultApplied.current) return;
    if (suggestedTopic === null) return;
    defaultApplied.current = true;
    // Only override if the parent is STILL on the initial default. If the learner
    // already tapped a chip (or a deep link set a topic) before the model
    // resolved, respect that choice instead of clobbering it.
    if (selectedTopicRef.current !== TOPICS[0]) return;
    onSelect(suggestedTopic);
  }, [suggestedTopic, onSelect, autoSuggest]);

  return (
    <div
      className="flex flex-wrap gap-2 px-4 py-3 border-b bg-card"
      role="group"
      aria-label="Topic"
    >
      {TOPICS.map((topic) => {
        const isSelected = topic === selectedTopic;
        return (
          <button
            key={topic}
            type="button"
            onClick={() => onSelect(topic)}
            aria-pressed={isSelected}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            {TOPIC_LABELS[topic]}
          </button>
        );
      })}
    </div>
  );
}
