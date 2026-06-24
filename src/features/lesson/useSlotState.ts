import { useEffect, useReducer } from 'react';
import type { AttemptPayload } from '@/features/progress/progressService';

export type FeedbackState = 'idle' | 'correct' | 'wrong';

type SlotState = {
  attemptNumber: number;
  feedbackState: FeedbackState;
  explanationRevealed: boolean;
  lastAnswer: AttemptPayload | null;
  /** Increments on every wrong answer so animations can key off it and replay. */
  wrongTick: number;
};

type Action =
  | { type: 'WRONG'; answer: AttemptPayload }
  | { type: 'CORRECT'; answer: AttemptPayload }
  | { type: 'RESET' };

function reducer(state: SlotState, action: Action): SlotState {
  switch (action.type) {
    case 'WRONG':
      return {
        ...state,
        attemptNumber: state.attemptNumber + 1,
        feedbackState: 'wrong',
        explanationRevealed: state.attemptNumber >= 2,
        lastAnswer: action.answer,
        wrongTick: state.wrongTick + 1,
      };
    case 'CORRECT':
      return {
        ...state,
        feedbackState: 'correct',
        lastAnswer: action.answer,
      };
    case 'RESET':
      return initialState();
  }
}

function initialState(): SlotState {
  return {
    attemptNumber: 1,
    feedbackState: 'idle',
    explanationRevealed: false,
    lastAnswer: null,
    wrongTick: 0,
  };
}

export function useSlotState(slotId: string) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    dispatch({ type: 'RESET' });
  }, [slotId]);

  return { state, dispatch };
}
