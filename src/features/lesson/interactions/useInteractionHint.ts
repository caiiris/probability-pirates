import { useState } from 'react';

const STORAGE_KEY = 'interactionHintsDismissed';

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveDismissed(kinds: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kinds));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

/**
 * Returns whether the hint for `kind` is visible, and a `dismiss` callback
 * that hides it and persists the choice to localStorage.
 */
export function useInteractionHint(kind: string): [boolean, () => void] {
  const [visible, setVisible] = useState(() => !getDismissed().includes(kind));

  function dismiss() {
    setVisible(false);
    const current = getDismissed();
    if (!current.includes(kind)) {
      saveDismissed([...current, kind]);
    }
  }

  return [visible, dismiss];
}
