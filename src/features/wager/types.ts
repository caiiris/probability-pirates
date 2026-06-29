export type WagerFlavor = 'frequency' | 'combinatorics' | 'counterintuition' | 'bayesian';
export type WagerUnit = 'percent' | 'count' | 'fraction';
export type WagerScoring = 'log' | 'abs';
export type WagerStatus = 'live' | 'archived';

/** Public-readable. Anyone authenticated can read. */
export type Wager = {
  id: string; // slug, e.g. "2026-06-27-birthdays"
  sequence: number; // 1, 2, 3, ... (for "Wager #14")
  openAt: number; // Firestore Timestamp -> ms
  prompt: string;
  unit: WagerUnit;
  tags: string[];
  flavor: WagerFlavor;
  scoring: WagerScoring;
  relatedLessonId?: string;
  status: WagerStatus;
  createdBy: 'system'; // 'community' reserved for future
};

/** Gated: readable only AFTER the user has a submission for this wager. */
export type WagerAnswer = {
  trueAnswer: number;
  source: string;
  sourceUrl?: string;
  revealHeadline: string;
  revealExplanation: string; // 2-3 sentences, the teach-back
  revealWorked?: string; // optional fuller derivation
};

/** Per-user, one-shot. */
export type WagerSubmission = {
  uid: string;
  guess: number;
  logError: number; // computed client-side at submit (see C-W2)
  score: number; // 0-100 (see C-W2)
  submittedAt: number;
};

/** Denormalized per-user summary at /users/{uid}/wagerStats/summary. */
export type WagerStats = {
  totalSubmitted: number;
  averageScore: number;
  averageLogError: number;
  lastWagerId?: string;
  last10Scores: number[]; // for the personal calibration sparkline
};

export type HistogramBucket = {
  /** log10 lower bound (for log scoring) or absolute lower bound (for abs). */
  lo: number;
  /** log10 upper bound (for log scoring) or absolute upper bound (for abs). */
  hi: number;
  count: number;
};

export type Histogram = {
  buckets: HistogramBucket[];
  n: number; // total submissions
  scoring: WagerScoring; // matches the source wager
};
