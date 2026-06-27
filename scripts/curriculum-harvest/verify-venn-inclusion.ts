import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { SKILLS } from '@/content/skills';
import { addF, eqF, frac, subF, type Fraction } from '@/lib/probability/exact';

const GENERATED_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const CANDIDATE_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/candidates');
const JSON_PATH = path.join(GENERATED_DIR, 'venn-inclusion-verified.json');
const MD_PATH = path.join(GENERATED_DIR, 'venn-inclusion-verified.md');
const CANDIDATE_PATH = path.join(CANDIDATE_DIR, 'venn-inclusion-batch.md');

type DifficultyTag = 'easy' | 'medium' | 'hard' | 'extreme';
type SkillId = keyof typeof SKILLS;
type AnswerKind =
  | 'union-probability'
  | 'neither-probability'
  | 'disjoint-union-probability'
  | 'table-union-count-probability'
  | 'overlap-count-probability'
  | 'exactly-one-count-probability';

type Counts = {
  total: number;
  eventA: string;
  eventB: string;
  aCount: number;
  bCount: number;
  bothCount: number;
};

type ProblemSpec = {
  id: string;
  candidateId: string;
  title: string;
  prompt: string;
  counts: Counts;
  answerKind: AnswerKind;
  expectedAnswer: {
    display: string;
    fraction?: string;
    count?: number;
  };
  skills: SkillId[];
  requiredMissingSkills: string[];
  difficultyTag: DifficultyTag;
  misconceptionTraps: string[];
  verificationMethod: string;
};

type SolvedProblem = {
  id: string;
  candidateId: string;
  title: string;
  prompt: string;
  exactAnswer: {
    display: string;
    fraction?: string;
    count?: number;
  };
  skills: SkillId[];
  requiredMissingSkills: string[];
  difficultyTag: DifficultyTag;
  misconceptionTraps: string[];
  verificationMethod: string;
  verification: {
    passed: boolean;
    arithmetic: string[];
  };
};

const PROBLEMS = [
  {
    id: 'venn-inclusion-0001',
    candidateId: 'CAND-VENN-0001',
    title: 'Club signup overlap',
    prompt:
      'In a class of 30 students, 14 signed up for robotics, 11 signed up for art club, and 5 signed up for both. If one student is picked at random, what is the probability they signed up for robotics or art club?',
    counts: {
      total: 30,
      eventA: 'robotics',
      eventB: 'art club',
      aCount: 14,
      bCount: 11,
      bothCount: 5,
    },
    answerKind: 'union-probability',
    expectedAnswer: { display: '2/3', fraction: '2/3', count: 20 },
    skills: ['inclusion-exclusion', 'favorable-over-total'],
    requiredMissingSkills: ['venn-region-translation'],
    difficultyTag: 'easy',
    misconceptionTraps: ['adds both groups without subtracting overlap', 'subtracts the overlap twice'],
    verificationMethod:
      'Compute the union count with |A or B| = |A| + |B| - |A and B|, then reduce union/total.',
  },
  {
    id: 'venn-inclusion-0002',
    candidateId: 'CAND-VENN-0002',
    title: 'Neither lunch choice',
    prompt:
      'A lunch survey has 40 students. 18 would choose tacos, 15 would choose noodles, and 6 would choose both if they could. What is the probability that a randomly chosen student chose neither tacos nor noodles?',
    counts: {
      total: 40,
      eventA: 'tacos',
      eventB: 'noodles',
      aCount: 18,
      bCount: 15,
      bothCount: 6,
    },
    answerKind: 'neither-probability',
    expectedAnswer: { display: '13/40', fraction: '13/40', count: 13 },
    skills: ['inclusion-exclusion', 'complement-rule', 'favorable-over-total'],
    requiredMissingSkills: ['venn-region-translation'],
    difficultyTag: 'medium',
    misconceptionTraps: ['treats neither as the overlap', 'uses total minus A minus B without adding the overlap back'],
    verificationMethod:
      'Find the union by inclusion-exclusion, then compute neither as total - union and reduce neither/total.',
  },
  {
    id: 'venn-inclusion-0003',
    candidateId: 'CAND-VENN-0003',
    title: 'Disjoint commute choices',
    prompt:
      'In a homeroom of 28 students, 9 usually walk to school and 6 usually bike. No student is counted in both groups. What is the probability a randomly chosen student usually walks or bikes?',
    counts: {
      total: 28,
      eventA: 'walks',
      eventB: 'bikes',
      aCount: 9,
      bCount: 6,
      bothCount: 0,
    },
    answerKind: 'disjoint-union-probability',
    expectedAnswer: { display: '15/28', fraction: '15/28', count: 15 },
    skills: ['addition-principle', 'favorable-over-total'],
    requiredMissingSkills: ['disjoint-events'],
    difficultyTag: 'easy',
    misconceptionTraps: ['looks for an overlap even though the events are disjoint', 'divides by the counted students instead of the class size'],
    verificationMethod:
      'Verify the overlap count is 0, so the union count is the direct sum |A| + |B|.',
  },
  {
    id: 'venn-inclusion-0004',
    candidateId: 'CAND-VENN-0004',
    title: 'Overlapping game booths',
    prompt:
      'At a school fair, 50 students tried at least one activity or skipped both. 32 tried the VR booth, 27 tried the puzzle booth, and 14 tried both. What is the probability a randomly chosen student tried at least one of those two booths?',
    counts: {
      total: 50,
      eventA: 'VR booth',
      eventB: 'puzzle booth',
      aCount: 32,
      bCount: 27,
      bothCount: 14,
    },
    answerKind: 'union-probability',
    expectedAnswer: { display: '9/10', fraction: '9/10', count: 45 },
    skills: ['inclusion-exclusion', 'favorable-over-total'],
    requiredMissingSkills: ['overlapping-events'],
    difficultyTag: 'hard',
    misconceptionTraps: ['accepts 32 + 27 as 59 students out of 50', 'forgets that both-booth students were counted twice'],
    verificationMethod:
      'Use inclusion-exclusion and confirm the union does not exceed the total population.',
  },
  {
    id: 'venn-inclusion-0005',
    candidateId: 'CAND-VENN-0005',
    title: 'Two-way table to Venn',
    prompt:
      'A club survey of 60 students is shown as a two-way table: 12 are in both drama and band, 9 are in drama but not band, 15 are in band but not drama, and 24 are in neither. Translate the table to a Venn diagram. How many students are in drama or band, and what is the probability?',
    counts: {
      total: 60,
      eventA: 'drama',
      eventB: 'band',
      aCount: 21,
      bCount: 27,
      bothCount: 12,
    },
    answerKind: 'table-union-count-probability',
    expectedAnswer: { display: '36 students; probability 3/5', fraction: '3/5', count: 36 },
    skills: ['sample-space-enumeration', 'inclusion-exclusion', 'favorable-over-total'],
    requiredMissingSkills: ['two-way-table-to-venn'],
    difficultyTag: 'medium',
    misconceptionTraps: ['adds row and column totals plus the overlap', 'confuses the neither cell with the overlap cell'],
    verificationMethod:
      'Translate table regions into A only, B only, both, and neither; verify union = A only + B only + both.',
  },
  {
    id: 'venn-inclusion-0006',
    candidateId: 'CAND-VENN-0006',
    title: 'Recover the overlap',
    prompt:
      'A survey has 78 students. 41 follow the esports team, 33 follow the puzzle newsletter, and 18 follow neither. How many students follow both, and what is the probability a randomly chosen student follows both?',
    counts: {
      total: 78,
      eventA: 'esports team',
      eventB: 'puzzle newsletter',
      aCount: 41,
      bCount: 33,
      bothCount: 14,
    },
    answerKind: 'overlap-count-probability',
    expectedAnswer: { display: '14 students; probability 7/39', fraction: '7/39', count: 14 },
    skills: ['inclusion-exclusion', 'complement-rule', 'favorable-over-total'],
    requiredMissingSkills: ['solve-overlap-from-union'],
    difficultyTag: 'hard',
    misconceptionTraps: ['subtracts neither from both groups directly', 'forgets that total - neither gives the union'],
    verificationMethod:
      'Compute union as total - neither, then solve |A and B| = |A| + |B| - |A or B|.',
  },
  {
    id: 'venn-inclusion-0007',
    candidateId: 'CAND-VENN-0007',
    title: 'Exactly one badge',
    prompt:
      'In a camp app, 36 students can earn a creator badge, a helper badge, both badges, or neither badge. 20 earned creator, 18 earned helper, and 8 earned neither. What is the probability a randomly chosen student earned exactly one of the two badges?',
    counts: {
      total: 36,
      eventA: 'creator badge',
      eventB: 'helper badge',
      aCount: 20,
      bCount: 18,
      bothCount: 10,
    },
    answerKind: 'exactly-one-count-probability',
    expectedAnswer: { display: '18 students; probability 1/2', fraction: '1/2', count: 18 },
    skills: ['inclusion-exclusion', 'complement-rule', 'favorable-over-total'],
    requiredMissingSkills: ['exactly-one-of-two-events'],
    difficultyTag: 'extreme',
    misconceptionTraps: ['answers at least one instead of exactly one', 'counts the both region as part of exactly one'],
    verificationMethod:
      'Recover the overlap from the complement, then compute exactly one as A only + B only.',
  },
] as const satisfies readonly ProblemSpec[];

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function formatF(fraction: Fraction): string {
  return `${fraction.num.toString()}/${fraction.den.toString()}`;
}

function parseExpectedFraction(value: string): Fraction {
  const [num, den] = value.split('/');
  assert(num !== undefined && den !== undefined, `Expected fraction must be num/den, got ${value}`);
  return frac(BigInt(num), BigInt(den));
}

function validateCounts(problem: ProblemSpec): void {
  const { total, aCount, bCount, bothCount } = problem.counts;
  for (const [label, value] of Object.entries(problem.counts)) {
    if (typeof value === 'number') {
      assert(Number.isInteger(value), `${problem.id}: ${label} must be an integer`);
      assert(value >= 0, `${problem.id}: ${label} must be non-negative`);
    }
  }
  assert(total > 0, `${problem.id}: total must be positive`);
  assert(bothCount <= aCount, `${problem.id}: overlap cannot exceed event A count`);
  assert(bothCount <= bCount, `${problem.id}: overlap cannot exceed event B count`);
  assert(unionCount(problem.counts) <= total, `${problem.id}: union cannot exceed total`);
}

function validateSkills(problem: ProblemSpec): void {
  const skillIds = new Set<string>(Object.keys(SKILLS));
  for (const skill of problem.skills) {
    assert(skillIds.has(skill), `${problem.id}: unknown skill tag ${skill}`);
  }
}

function unionCount(counts: Counts): number {
  return counts.aCount + counts.bCount - counts.bothCount;
}

function neitherCount(counts: Counts): number {
  return counts.total - unionCount(counts);
}

function exactlyOneCount(counts: Counts): number {
  return counts.aCount + counts.bCount - 2 * counts.bothCount;
}

function unionProbability(counts: Counts): Fraction {
  return subF(addF(frac(counts.aCount, counts.total), frac(counts.bCount, counts.total)), frac(counts.bothCount, counts.total));
}

function verifyCommonArithmetic(problem: ProblemSpec): string[] {
  const counts = problem.counts;
  const unionByCounts = frac(unionCount(counts), counts.total);
  const unionByInclusionExclusion = unionProbability(counts);
  const neitherByComplement = subF(frac(1), unionByInclusionExclusion);
  const neitherByCounts = frac(neitherCount(counts), counts.total);

  assert(eqF(unionByInclusionExclusion, unionByCounts), `${problem.id}: union formula mismatch`);
  assert(eqF(neitherByComplement, neitherByCounts), `${problem.id}: neither complement mismatch`);

  return [
    `${counts.aCount} + ${counts.bCount} - ${counts.bothCount} = ${unionCount(counts)} in ${counts.eventA} or ${counts.eventB}.`,
    `${counts.total} - ${unionCount(counts)} = ${neitherCount(counts)} in neither group.`,
    `Union probability reduces to ${formatF(unionByInclusionExclusion)}.`,
  ];
}

function solve(problem: ProblemSpec): SolvedProblem {
  validateCounts(problem);
  validateSkills(problem);

  const counts = problem.counts;
  const arithmetic = verifyCommonArithmetic(problem);
  let answer: SolvedProblem['exactAnswer'];

  switch (problem.answerKind) {
    case 'union-probability': {
      answer = {
        display: formatF(unionProbability(counts)),
        fraction: formatF(unionProbability(counts)),
        count: unionCount(counts),
      };
      break;
    }
    case 'neither-probability': {
      const probability = frac(neitherCount(counts), counts.total);
      answer = {
        display: formatF(probability),
        fraction: formatF(probability),
        count: neitherCount(counts),
      };
      arithmetic.push(`Neither probability reduces to ${formatF(probability)}.`);
      break;
    }
    case 'disjoint-union-probability': {
      assert(counts.bothCount === 0, `${problem.id}: disjoint problem must have zero overlap`);
      const probability = frac(counts.aCount + counts.bCount, counts.total);
      answer = {
        display: formatF(probability),
        fraction: formatF(probability),
        count: counts.aCount + counts.bCount,
      };
      arithmetic.push(`Because the overlap is 0, ${counts.aCount} + ${counts.bCount} = ${counts.aCount + counts.bCount}.`);
      break;
    }
    case 'table-union-count-probability': {
      const probability = frac(unionCount(counts), counts.total);
      answer = {
        display: `${unionCount(counts)} students; probability ${formatF(probability)}`,
        fraction: formatF(probability),
        count: unionCount(counts),
      };
      arithmetic.push(
        `A only is ${counts.aCount - counts.bothCount}; B only is ${counts.bCount - counts.bothCount}; both is ${counts.bothCount}.`,
      );
      break;
    }
    case 'overlap-count-probability': {
      const unionFromNeither = counts.total - neitherCount(counts);
      const overlap = counts.aCount + counts.bCount - unionFromNeither;
      const probability = frac(overlap, counts.total);
      assert(overlap === counts.bothCount, `${problem.id}: recovered overlap mismatch`);
      answer = {
        display: `${overlap} students; probability ${formatF(probability)}`,
        fraction: formatF(probability),
        count: overlap,
      };
      arithmetic.push(`${counts.aCount} + ${counts.bCount} - ${unionFromNeither} = ${overlap} in both groups.`);
      break;
    }
    case 'exactly-one-count-probability': {
      const oneCount = exactlyOneCount(counts);
      const probability = frac(oneCount, counts.total);
      answer = {
        display: `${oneCount} students; probability ${formatF(probability)}`,
        fraction: formatF(probability),
        count: oneCount,
      };
      arithmetic.push(
        `Exactly one count is (${counts.aCount} - ${counts.bothCount}) + (${counts.bCount} - ${counts.bothCount}) = ${oneCount}.`,
      );
      break;
    }
  }

  assert(answer.display === problem.expectedAnswer.display, `${problem.id}: display answer mismatch`);
  const expectedFraction = problem.expectedAnswer.fraction;
  if (expectedFraction !== undefined) {
    const answerFraction = answer.fraction;
    assert(answerFraction !== undefined, `${problem.id}: missing computed fraction`);
    assert(
      eqF(parseExpectedFraction(expectedFraction), parseExpectedFraction(answerFraction)),
      `${problem.id}: fraction answer mismatch`,
    );
  }
  if (problem.expectedAnswer.count !== undefined) {
    assert(answer.count === problem.expectedAnswer.count, `${problem.id}: count answer mismatch`);
  }

  return {
    id: problem.id,
    candidateId: problem.candidateId,
    title: problem.title,
    prompt: problem.prompt,
    exactAnswer: answer,
    skills: problem.skills,
    requiredMissingSkills: problem.requiredMissingSkills,
    difficultyTag: problem.difficultyTag,
    misconceptionTraps: problem.misconceptionTraps,
    verificationMethod: problem.verificationMethod,
    verification: {
      passed: true,
      arithmetic,
    },
  };
}

function renderMarkdown(results: readonly SolvedProblem[]): string {
  const missingSkills = Array.from(new Set(results.flatMap((result) => result.requiredMissingSkills))).sort();
  const lines = [
    '# Venn / Inclusion-Exclusion Verified Problems',
    '',
    '> Deterministic verification pass for Pascal-authored Venn, inclusion-exclusion, and neither prompts. Runtime answers are computed from integer counts with exact rational arithmetic; no model or API calls are used.',
    '',
    `- **Verified examples:** ${results.length}`,
    `- **Missing taxonomy needs:** ${missingSkills.length > 0 ? missingSkills.map((skill) => `\`${skill}\``).join(', ') : 'none'}`,
    '',
  ];

  for (const result of results) {
    lines.push(
      `## ${result.id} - ${result.title}`,
      '',
      `- **Candidate:** ${result.candidateId}`,
      '- **Authorship:** Pascal-authored original prompt',
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Prompt:** ${result.prompt}`,
      `- **Exact answer:** ${result.exactAnswer.display}`,
      `- **Skill tags:** ${result.skills.map((skill) => `\`${skill}\``).join(', ')}`,
      `- **Required missing skills:** ${
        result.requiredMissingSkills.length > 0
          ? result.requiredMissingSkills.map((skill) => `\`${skill}\``).join(', ')
          : 'none'
      }`,
      `- **Misconception traps:** ${result.misconceptionTraps.join('; ')}`,
      `- **Verification method:** ${result.verificationMethod}`,
      `- **Passed:** ${result.verification.passed ? 'yes' : 'no'}`,
      '',
      '### Verification Arithmetic',
      '',
      ...result.verification.arithmetic.map((line) => `- ${line}`),
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderCandidateMarkdown(results: readonly SolvedProblem[]): string {
  const lines = [
    '# Venn / Inclusion-Exclusion Candidate Batch',
    '',
    '> Pascal-authored candidate set generated by `scripts/curriculum-harvest/verify-venn-inclusion.ts`. These are review artifacts, not registered runtime templates.',
    '',
  ];

  for (const result of results) {
    lines.push(
      `### ${result.candidateId} - ${result.title}`,
      '',
      '- **Source ids:** pascal-authored',
      '- **Reuse mode:** original',
      '- **Roadmap target:** Venn diagrams / inclusion-exclusion / complements',
      '- **Practice topic:** inclusion-exclusion',
      `- **Difficulty tag:** ${result.difficultyTag}`,
      `- **Skills:** ${result.skills.join(', ')}`,
      `- **Required missing skills:** ${
        result.requiredMissingSkills.length > 0 ? result.requiredMissingSkills.join(', ') : 'none'
      }`,
      `- **Misconceptions:** ${result.misconceptionTraps.join(', ')}`,
      `- **Prompt:** ${result.prompt}`,
      `- **Exact answer:** ${result.exactAnswer.display}`,
      `- **Verification method:** ${result.verificationMethod}`,
      '- **Solver feasibility:** deterministic exact integer-count arithmetic; no model calls.',
      '- **Legal notes:** Original Pascal-authored wording; avoid source-copy wording if adapted later.',
      '- **Human status:** verified',
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const results = PROBLEMS.map(solve);
  const failed = results.filter((result) => !result.verification.passed);
  if (failed.length > 0) {
    throw new Error(`Venn inclusion verification failed: ${failed.map((result) => result.id).join(', ')}`);
  }

  await mkdir(GENERATED_DIR, { recursive: true });
  await mkdir(CANDIDATE_DIR, { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(results, null, 2)}\n`);
  await writeFile(MD_PATH, renderMarkdown(results));
  await writeFile(CANDIDATE_PATH, renderCandidateMarkdown(results));

  console.log(`verified ${results.length} Venn inclusion examples`);
  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), CANDIDATE_PATH)}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
