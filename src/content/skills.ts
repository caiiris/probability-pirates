export const SKILLS = {
  'sample-space-enumeration': { label: 'Listing outcomes',          topic: 'counting' },
  'equally-likely-outcomes':  { label: 'Equally likely outcomes',   topic: 'counting' },
  'favorable-over-total':     { label: 'Favorable / total',         topic: 'counting' },
  'long-run-vs-single-trial': { label: 'Long-run vs single trial',  topic: 'long-run' },
  'frequentist-view':         { label: 'Probability as a share',    topic: 'long-run' },
  'multiplication-principle': { label: 'Multiplication principle',  topic: 'counting' },
  'ordered-vs-unordered':     { label: 'Ordered vs unordered',      topic: 'counting' },
  'permutations':             { label: 'Permutations',              topic: 'counting' },
  'combinations':             { label: 'Combinations',              topic: 'counting' },
  'complement-rule':          { label: 'Complement rule',           topic: 'complement' },
  'independence':             { label: 'Independence',              topic: 'complement' },
  'birthday-paradox':         { label: 'Birthday paradox',          topic: 'counting' },
  'conditional-probability':  { label: 'Conditional probability',   topic: 'conditional' },
  'base-rate':                { label: 'Base rates',                topic: 'conditional' },
  'monty-hall-reasoning':     { label: 'Monty Hall reasoning',      topic: 'conditional' },
  'binomial-pmf':             { label: 'Binomial distribution',     topic: 'distributions' },
} as const;

export type SkillId = keyof typeof SKILLS;
export type Topic = (typeof SKILLS)[SkillId]['topic'];
export const TOPICS = ['counting', 'long-run', 'complement', 'conditional', 'distributions'] as const;
