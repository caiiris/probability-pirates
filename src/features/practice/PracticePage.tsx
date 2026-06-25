/**
 * PracticePage — top-level route for /practice (WP-6b).
 *
 * WP-6b changes vs WP-6a:
 * - Renders TopicPicker above the session; switching topic restarts the loop
 *   in the selected topic (key prop on PracticeSession resets its state).
 * - Passes `topic` and `uid` down to PracticeSession for adaptive serving and
 *   Firestore writes.
 * - TopicPicker preselects the learner's weakest topic on first render.
 */

import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { TOPICS } from '@/content/skills';
import type { Topic } from '@/content/skills';
import { useAuth } from '@/features/auth/AuthProvider';
import { TopicPicker } from '@/features/practice/TopicPicker';
import { PracticeSession } from '@/features/practice/PracticeSession';

export function PracticePage() {
  // Default to the first topic; TopicPicker overrides this once the learner
  // model loads (via its internal subscribeLearnerModel effect).
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);

  const authState = useAuth();
  const uid =
    authState.status === 'authenticated' ? authState.user.uid : null;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <header className="shrink-0 border-b px-4 py-4 flex items-center gap-3 bg-card">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight">Practice</h1>
      </header>

      <TopicPicker selectedTopic={topic} onSelect={setTopic} uid={uid} />

      <div className="flex-1 flex flex-col min-h-0">
        {/*
         * key={topic} forces PracticeSession to remount when the topic changes,
         * resetting all local state (instance, currentAnswer, solutionRevealed,
         * useSlotState). This is the correct behaviour: switching topic restarts
         * the loop in the new topic.
         */}
        <PracticeSession key={topic} topic={topic} uid={uid} />
      </div>
    </div>
  );
}
