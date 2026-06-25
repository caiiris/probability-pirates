export const MISCONCEPTIONS = {
  gambler:              { label: "Gambler's fallacy",                 relatedSkills: ['long-run-vs-single-trial', 'independence'] },
  ordered_vs_unordered: { label: 'Treats unordered as ordered',       relatedSkills: ['ordered-vs-unordered', 'combinations'] },
  conjunction:          { label: 'Conjunction fallacy',               relatedSkills: ['independence'] },
  base_rate_neglect:    { label: 'Ignores the base rate',             relatedSkills: ['base-rate', 'conditional-probability'] },
  complement_inversion: { label: 'Confuses event with complement',    relatedSkills: ['complement-rule'] },
} as const;

export type MisconceptionKey = keyof typeof MISCONCEPTIONS;
