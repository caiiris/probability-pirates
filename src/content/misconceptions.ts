/**
 * Closed set of probability misconceptions the learner model can track.
 *
 * `label`        — short name shown in the UI.
 * `description`  — one sentence naming the mistake in plain English.
 * `fix`          — the corrective takeaway ("remember this instead").
 * `relatedSkills`— skills to practice to address it (must be valid SkillIds).
 */
export const MISCONCEPTIONS = {
  gambler: {
    label: "Gambler's fallacy",
    description: 'Expecting past independent results to change the next outcome — thinking a coin is "due" for tails after a streak of heads.',
    fix: 'Independent trials have no memory: each fair flip stays 1/2 no matter what came before.',
    relatedSkills: ['long-run-vs-single-trial', 'independence'],
  },
  ordered_vs_unordered: {
    label: 'Treats unordered as ordered',
    description: 'Counting arrangements (where order matters) when the problem only cares about which items are chosen.',
    fix: "If rearranging the same items isn't a new outcome, use combinations (nCr), not permutations (nPr).",
    relatedSkills: ['ordered-vs-unordered', 'combinations'],
  },
  conjunction: {
    label: 'Conjunction fallacy',
    description: 'Rating a specific combined event as more likely than one of the single events it contains.',
    fix: 'P(A and B) can never be larger than P(A) or P(B) on their own.',
    relatedSkills: ['independence'],
  },
  base_rate_neglect: {
    label: 'Ignores the base rate',
    description: 'Judging a result from the test accuracy alone while ignoring how rare the underlying condition is.',
    fix: 'Always fold in the base rate — when a condition is rare, most positive tests are false alarms.',
    relatedSkills: ['base-rate', 'conditional-probability'],
  },
  complement_inversion: {
    label: 'Confuses event with complement',
    description: 'Mixing up an event with its opposite — using P when the answer needs 1 − P (or vice versa).',
    fix: 'Check whether the question asks for the event or its opposite before subtracting from 1.',
    relatedSkills: ['complement-rule'],
  },
  replacement_confusion: {
    label: 'Ignores "without replacement"',
    description: 'Treats draws made without replacement as independent — keeping the same denominator instead of shrinking the pool after each draw.',
    fix: 'Without replacement, both the favorable count and the total shrink on every draw: r/(r+b) × (r−1)/(r+b−1) × …',
    relatedSkills: ['conditional-probability', 'independence'],
  },
  add_vs_multiply: {
    label: 'Adds when it should multiply (or vice versa)',
    description: 'Mixes up the addition and multiplication principles — adding independent stages that should multiply, or multiplying disjoint cases that should add.',
    fix: 'AND across stages multiplies; OR across disjoint cases adds. Read the connecting word before combining.',
    relatedSkills: ['multiplication-principle', 'addition-principle'],
  },
  forgot_overlap: {
    label: 'Forgets to subtract the overlap',
    description: 'Adds two set sizes without subtracting their intersection, double-counting the items that belong to both.',
    fix: 'Inclusion–exclusion: |A ∪ B| = |A| + |B| − |A ∩ B|. Subtract what you counted twice.',
    relatedSkills: ['inclusion-exclusion'],
  },
  arrange_without_selecting: {
    label: 'Arranges without selecting',
    description: 'Counts only the internal ordering of the k items (k!) and forgets they are first chosen from n distinct options.',
    fix: 'A permutation P(n, k) both chooses AND orders: multiply n × (n−1) × … for k decreasing factors — that is far more than just k!.',
    relatedSkills: ['permutations', 'ordered-vs-unordered'],
  },
} as const;

export type MisconceptionKey = keyof typeof MISCONCEPTIONS;
