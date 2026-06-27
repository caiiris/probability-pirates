import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { addF, eqF, frac, mulF, nCr, subF, toNumber, type Fraction } from '@/lib/probability/exact';
import { SKILLS, type SkillId } from '@/content/skills';

const OUT_DIR = path.join(process.cwd(), 'docs/curriculum-harvest/generated-problems');
const JSON_PATH = path.join(OUT_DIR, 'without-replacement-verified.json');
const MD_PATH = path.join(OUT_DIR, 'without-replacement-verified.md');
const CANDIDATE_PATH = path.join(
  process.cwd(),
  'docs/curriculum-harvest/candidates/without-replacement-batch.md',
);

const LANE_ID = 'without-replacement-casework-probability';
const MISSING_TAXONOMY_IDS = ['without-replacement', 'casework-probability'] as const;

type DifficultyTag = 'medium' | 'medium-hard' | 'hard';

type ExactValue = {
  label: string;
  fraction: {
    text: string;
    numerator: string;
    denominator: string;
    decimalApprox: number;
  };
};

type VerificationCheck = {
  label: string;
  method: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string[];
};

type VerificationResult = {
  passed: boolean;
  checks: VerificationCheck[];
};

type VerifiedExample = {
  id: string;
  candidateId: string;
  title: string;
  difficultyTag: DifficultyTag;
  prompt: string;
  answer: string;
  exactValues: ExactValue[];
  skills: SkillId[];
  misconceptions: string[];
  solver: {
    primaryMethod: string;
    formula: string;
    steps: string[];
  };
  verificationResult: VerificationResult;
  provenance: {
    promptAuthorship: 'original';
    sourceCopying: 'none';
    reviewOnly: true;
  };
};

function formatF(f: Fraction): string {
  return `${f.num.toString()}/${f.den.toString()}`;
}

function exactValue(label: string, fraction: Fraction): ExactValue {
  return {
    label,
    fraction: {
      text: formatF(fraction),
      numerator: fraction.num.toString(),
      denominator: fraction.den.toString(),
      decimalApprox: Number(toNumber(fraction).toFixed(6)),
    },
  };
}

function sumF(values: Fraction[]): Fraction {
  return values.reduce((sum, value) => addF(sum, value), frac(0));
}

function sequentialProduct(steps: Array<[number, number]>): Fraction {
  return steps.reduce((product, [num, den]) => mulF(product, frac(num, den)), frac(1));
}

function choose(n: number, r: number): bigint {
  return nCr(n, r);
}

function byCount(favorable: bigint, total: bigint): Fraction {
  return frac(favorable, total);
}

function check(label: string, method: string, actual: Fraction, expected: Fraction, details: string[]): VerificationCheck {
  return {
    label,
    method,
    actual: formatF(actual),
    expected: formatF(expected),
    passed: eqF(actual, expected),
    details,
  };
}

function assertKnownSkills(skills: SkillId[]): SkillId[] {
  for (const skill of skills) {
    if (!(skill in SKILLS)) {
      throw new Error(`Unknown skill id: ${skill}`);
    }
  }
  return skills;
}

function buildExample(args: Omit<VerifiedExample, 'provenance' | 'verificationResult'> & { checks: VerificationCheck[] }): VerifiedExample {
  return {
    id: args.id,
    candidateId: args.candidateId,
    title: args.title,
    difficultyTag: args.difficultyTag,
    prompt: args.prompt,
    answer: args.answer,
    exactValues: args.exactValues,
    skills: assertKnownSkills(args.skills),
    misconceptions: args.misconceptions,
    solver: args.solver,
    verificationResult: {
      passed: args.checks.every((result) => result.passed),
      checks: args.checks,
    },
    provenance: {
      promptAuthorship: 'original',
      sourceCopying: 'none',
      reviewOnly: true,
    },
  };
}

function enumerateCombinations<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];

  function step(start: number, chosen: T[]): void {
    if (chosen.length === size) {
      result.push([...chosen]);
      return;
    }

    for (let i = start; i <= items.length - (size - chosen.length); i += 1) {
      step(i + 1, [...chosen, items[i]]);
    }
  }

  step(0, []);
  return result;
}

function exactMixExample(): VerifiedExample {
  const red = 5;
  const blue = 4;
  const silver = 3;
  const total = red + blue + silver;
  const draws = 3;
  const primary = byCount(choose(red, 1) * choose(blue, 2), choose(total, draws));
  const orderedSequential = sumF([
    sequentialProduct([
      [red, total],
      [blue, total - 1],
      [blue - 1, total - 2],
    ]),
    sequentialProduct([
      [blue, total],
      [red, total - 1],
      [blue - 1, total - 2],
    ]),
    sequentialProduct([
      [blue, total],
      [blue - 1, total - 1],
      [red, total - 2],
    ]),
  ]);

  return buildExample({
    id: 'wr-0001',
    candidateId: 'CAND-WR-0001',
    title: 'One red and two blue enamel pins',
    difficultyTag: 'medium-hard',
    prompt:
      'A craft box has 5 red pins, 4 blue pins, and 3 silver pins. You grab 3 pins without looking and do not put any back. What is the probability you get exactly 1 red pin and exactly 2 blue pins?',
    answer: formatF(primary),
    exactValues: [exactValue('P(exactly 1 red and 2 blue)', primary)],
    skills: ['combinations', 'favorable-over-total', 'multiplication-principle'],
    misconceptions: ['uses-with-replacement-denominators', 'counts-only-one-order', 'treats-exactly-as-at-least'],
    solver: {
      primaryMethod: 'combinations over unordered 3-pin hands',
      formula: 'C(5,1) * C(4,2) / C(12,3)',
      steps: [
        'Choose the one red pin: C(5,1).',
        'Choose the two blue pins: C(4,2).',
        'Divide by all 3-pin hands from 12 pins: C(12,3).',
      ],
    },
    checks: [
      check('ordered sequential casework', 'RBB + BRB + BBR sequential products', orderedSequential, primary, [
        `Combination count gives ${formatF(primary)}.`,
        `Summing the three possible orders gives ${formatF(orderedSequential)}.`,
      ]),
    ],
  });
}

function sameCategoryExample(): VerifiedExample {
  const counts = [
    { label: 'brass', count: 6 },
    { label: 'steel', count: 5 },
    { label: 'copper', count: 4 },
  ];
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const samePairs = counts.reduce((sum, item) => sum + choose(item.count, 2), 0n);
  const primary = byCount(samePairs, choose(total, 2));
  const sequential = sumF(counts.map((item) => sequentialProduct([[item.count, total], [item.count - 1, total - 1]])));

  return buildExample({
    id: 'wr-0002',
    candidateId: 'CAND-WR-0002',
    title: 'Two matching hardware tokens',
    difficultyTag: 'medium',
    prompt:
      'A workshop drawer has 6 brass tokens, 5 steel tokens, and 4 copper tokens. Two tokens are drawn without replacement. What is the probability the two tokens are made of the same metal?',
    answer: formatF(primary),
    exactValues: [exactValue('P(same metal)', primary)],
    skills: ['combinations', 'favorable-over-total', 'addition-principle'],
    misconceptions: ['assumes-same-and-different-are-equally-likely', 'forgets-one-category-case', 'multiplies-counts-across-categories'],
    solver: {
      primaryMethod: 'casework by metal category',
      formula: '(C(6,2) + C(5,2) + C(4,2)) / C(15,2)',
      steps: [
        'Same-metal pairs can be brass-brass, steel-steel, or copper-copper.',
        'Add the three same-category counts.',
        'Divide by all unordered pairs of tokens.',
      ],
    },
    checks: [
      check('sequential category sum', 'sum c/15 * (c-1)/14 across metals', sequential, primary, [
        `Same-metal pair count is ${samePairs.toString()}.`,
        `Sequential probability sum gives ${formatF(sequential)}.`,
      ]),
    ],
  });
}

function atLeastOneByComplementExample(): VerifiedExample {
  const target = 4;
  const other = 8;
  const total = target + other;
  const draws = 3;
  const none = byCount(choose(other, draws), choose(total, draws));
  const primary = subF(frac(1), none);
  const directCases = sumF(
    [1, 2, 3].map((targetsDrawn) =>
      byCount(choose(target, targetsDrawn) * choose(other, draws - targetsDrawn), choose(total, draws)),
    ),
  );

  return buildExample({
    id: 'wr-0003',
    candidateId: 'CAND-WR-0003',
    title: 'At least one mystery book',
    difficultyTag: 'medium',
    prompt:
      'A librarian sets aside 4 mystery novels and 8 other novels. A student randomly takes 3 novels without replacement. What is the probability that at least one of the 3 novels is a mystery?',
    answer: formatF(primary),
    exactValues: [exactValue('P(at least one mystery)', primary), exactValue('P(no mystery)', none)],
    skills: ['complement-rule', 'combinations', 'favorable-over-total'],
    misconceptions: ['adds-overlapping-at-least-one-cases', 'answers-the-complement', 'treats-draws-as-with-replacement'],
    solver: {
      primaryMethod: 'complement rule with combinations',
      formula: '1 - C(8,3) / C(12,3)',
      steps: [
        'The complement of at least one mystery is no mysteries.',
        'No mysteries means all 3 books come from the 8 other novels.',
        'Subtract that probability from 1.',
      ],
    },
    checks: [
      check('direct casework', 'exactly 1 mystery + exactly 2 mysteries + exactly 3 mysteries', directCases, primary, [
        `Complement gives ${formatF(primary)}.`,
        `Direct casework gives ${formatF(directCases)}.`,
      ]),
    ],
  });
}

function replacementComparisonExample(): VerifiedExample {
  const star = 3;
  const plain = 7;
  const total = star + plain;
  const withoutReplacement = byCount(choose(star, 2), choose(total, 2));
  const withoutSequential = sequentialProduct([
    [star, total],
    [star - 1, total - 1],
  ]);
  const withReplacement = sequentialProduct([
    [star, total],
    [star, total],
  ]);
  const withReplacementSquared = frac(star * star, total * total);
  const gap = subF(withReplacement, withoutReplacement);

  return buildExample({
    id: 'wr-0004',
    candidateId: 'CAND-WR-0004',
    title: 'Sticker draw with replacement comparison',
    difficultyTag: 'medium-hard',
    prompt:
      'A sticker pouch has 3 star stickers and 7 plain stickers. You draw 2 stickers. Compare the probability of getting 2 stars if you put the first sticker back before drawing again versus if you do not put it back.',
    answer: `With replacement: ${formatF(withReplacement)}. Without replacement: ${formatF(withoutReplacement)}. With replacement is higher by ${formatF(gap)}.`,
    exactValues: [
      exactValue('P(2 stars with replacement)', withReplacement),
      exactValue('P(2 stars without replacement)', withoutReplacement),
      exactValue('with-replacement minus without-replacement', gap),
    ],
    skills: ['multiplication-principle', 'independence', 'conditional-probability'],
    misconceptions: ['treats-without-replacement-as-independent', 'forgets-the-first-star-is-removed', 'compares-decimals-without-common-denominators'],
    solver: {
      primaryMethod: 'sequential products for both sampling rules',
      formula: 'with replacement: (3/10)(3/10); without replacement: (3/10)(2/9)',
      steps: [
        'With replacement, the bag resets before the second draw.',
        'Without replacement, one star and one total sticker are gone after a first star.',
        'Compare the exact fractions by subtracting without-replacement from with-replacement.',
      ],
    },
    checks: [
      check('without-replacement combination check', 'C(3,2) / C(10,2) equals (3/10)(2/9)', withoutSequential, withoutReplacement, [
        `Sequential without-replacement probability is ${formatF(withoutSequential)}.`,
        `Combination without-replacement probability is ${formatF(withoutReplacement)}.`,
      ]),
      check('with-replacement square check', '(3/10)^2 equals 9/100', withReplacement, withReplacementSquared, [
        `Independent with-replacement product is ${formatF(withReplacement)}.`,
        `Direct square is ${formatF(withReplacementSquared)}.`,
      ]),
    ],
  });
}

function prizeCaseworkExample(): VerifiedExample {
  const gold = 3;
  const silver = 5;
  const blank = 4;
  const total = gold + silver + blank;
  const draws = 4;
  const oneGoldOneSilver = choose(gold, 1) * choose(silver, 1) * choose(blank, 2);
  const twoGold = choose(gold, 2) * choose(silver, 0) * choose(blank, 2);
  const primary = byCount(oneGoldOneSilver + twoGold, choose(total, draws));
  const alternate = byCount((choose(gold + silver, 2) - choose(silver, 2)) * choose(blank, 2), choose(total, draws));

  return buildExample({
    id: 'wr-0005',
    candidateId: 'CAND-WR-0005',
    title: 'Exactly two prizes with at least one gold',
    difficultyTag: 'hard',
    prompt:
      'A carnival bowl holds 3 gold prize slips, 5 silver prize slips, and 4 blank slips. Four slips are drawn without replacement. What is the probability that exactly 2 of the slips are prize slips and at least 1 of those prize slips is gold?',
    answer: formatF(primary),
    exactValues: [exactValue('P(exactly 2 prizes and at least 1 gold)', primary)],
    skills: ['combinations', 'addition-principle', 'favorable-over-total'],
    misconceptions: ['misses-the-two-gold-case', 'counts-at-least-one-gold-without-exactly-two-prizes', 'double-counts-one-gold-one-silver'],
    solver: {
      primaryMethod: 'disjoint casework over prize composition',
      formula: '[C(3,1)C(5,1)C(4,2) + C(3,2)C(5,0)C(4,2)] / C(12,4)',
      steps: [
        'Exactly 2 prize slips means the other 2 slips must be blank.',
        'At least one gold leaves two disjoint prize cases: 1 gold + 1 silver, or 2 gold.',
        'Add those favorable cases and divide by all 4-slip hands.',
      ],
    },
    checks: [
      check('alternate prize-complement count', '[C(8,2) - C(5,2)]C(4,2) / C(12,4)', alternate, primary, [
        `Direct disjoint cases give ${formatF(primary)}.`,
        `All two-prize choices except all-silver choices give ${formatF(alternate)}.`,
      ]),
    ],
  });
}

function enumerationExample(): VerifiedExample {
  const items = [
    { id: 'R1', category: 'red' },
    { id: 'R2', category: 'red' },
    { id: 'B1', category: 'blue' },
    { id: 'B2', category: 'blue' },
    { id: 'G1', category: 'green' },
  ];
  const draws = 3;
  const hands = enumerateCombinations(items, draws);
  const favorableHands = hands.filter((hand) => new Set(hand.map((item) => item.category)).size === draws);
  const enumerated = frac(favorableHands.length, hands.length);
  const formula = byCount(choose(2, 1) * choose(2, 1) * choose(1, 1), choose(items.length, draws));

  return buildExample({
    id: 'wr-0006',
    candidateId: 'CAND-WR-0006',
    title: 'All different color badges',
    difficultyTag: 'medium',
    prompt:
      'A badge tray has 2 red badges, 2 blue badges, and 1 green badge. Three badges are drawn without replacement. What is the probability the three badges are all different colors?',
    answer: formatF(formula),
    exactValues: [exactValue('P(all different colors)', formula)],
    skills: ['sample-space-enumeration', 'combinations', 'favorable-over-total'],
    misconceptions: ['counts-color-patterns-instead-of-labeled-badges', 'forgets-the-single-green-badge', 'assumes-each-color-is-equally-likely'],
    solver: {
      primaryMethod: 'combination count checked by exact enumeration',
      formula: 'C(2,1) * C(2,1) * C(1,1) / C(5,3)',
      steps: [
        'All different means one red, one blue, and one green badge.',
        'Choose the labeled badge from each color group.',
        'Divide by all labeled 3-badge hands.',
      ],
    },
    checks: [
      check('exact labeled-hand enumeration', 'enumerate all C(5,3) labeled hands and filter all-different categories', enumerated, formula, [
        `Enumeration listed ${hands.length} total labeled hands.`,
        `Enumeration found ${favorableHands.length} all-different hands.`,
      ]),
    ],
  });
}

function buildExamples(): VerifiedExample[] {
  return [
    exactMixExample(),
    sameCategoryExample(),
    atLeastOneByComplementExample(),
    replacementComparisonExample(),
    prizeCaseworkExample(),
    enumerationExample(),
  ];
}

function renderSkillList(skills: readonly SkillId[]): string {
  return skills.map((skill) => `\`${skill}\``).join(', ');
}

function renderMarkdown(examples: VerifiedExample[]): string {
  const lines = [
    '# Without Replacement / Casework Verification',
    '',
    '> Deterministic verification pass for original sampling-without-replacement candidates. These are harvest/review artifacts only; no runtime practice templates or registries are edited.',
    '',
    '## Lane Summary',
    '',
    `- **Lane id:** \`${LANE_ID}\``,
    `- **Examples verified:** ${examples.length}`,
    '- **Runtime correctness source:** exact TypeScript solver/verifier using combinations, sequential products, and exact enumeration',
    `- **Missing taxonomy IDs:** ${MISSING_TAXONOMY_IDS.map((id) => `\`${id}\``).join(', ')}`,
    '- **Blockers:** none for review artifacts; taxonomy review needed before using the missing IDs as runtime SkillIds',
    '- **Source copying:** none; prompts are original Pascal-authored examples',
    '',
  ];

  for (const example of examples) {
    lines.push(
      `## ${example.id} — ${example.title}`,
      '',
      `- **Candidate:** ${example.candidateId}`,
      `- **Difficulty tag:** ${example.difficultyTag}`,
      `- **Skills:** ${renderSkillList(example.skills)}`,
      `- **Misconceptions:** ${example.misconceptions.join(', ')}`,
      `- **Prompt:** ${example.prompt}`,
      `- **Answer:** ${example.answer}`,
      `- **Solver:** ${example.solver.primaryMethod}; \`${example.solver.formula}\``,
      `- **Verification result:** ${example.verificationResult.passed ? 'passed' : 'failed'}`,
      '',
      '### Exact Values',
      '',
      ...example.exactValues.map((value) => `- **${value.label}:** ${value.fraction.text} (${value.fraction.decimalApprox})`),
      '',
      '### Solver Steps',
      '',
      ...example.solver.steps.map((step) => `- ${step}`),
      '',
      '### Verification Checks',
      '',
    );

    for (const result of example.verificationResult.checks) {
      lines.push(
        `- **${result.label}:** ${result.passed ? 'passed' : 'failed'} via ${result.method}. Expected ${result.expected}; actual ${result.actual}.`,
        ...result.details.map((detail) => `  - ${detail}`),
      );
    }

    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function renderCandidateMarkdown(examples: VerifiedExample[]): string {
  const lines = [
    '# Without Replacement / Casework Candidate Batch',
    '',
    '> Original harvest candidates for sampling without replacement. Generated with `tsx scripts/curriculum-harvest/verify-without-replacement.ts`; outputs are review artifacts only.',
    '',
    '- **Reuse mode:** original-authored',
    '- **Roadmap target:** counting, conditional probability, and complement practice',
    '- **Suggested missing taxonomy IDs:** `without-replacement`, `casework-probability`',
    '- **Existing SkillIds used now:** `sample-space-enumeration`, `favorable-over-total`, `multiplication-principle`, `combinations`, `complement-rule`, `independence`, `conditional-probability`, `addition-principle`',
    '- **Legal notes:** no source copying; contexts, values, and wording are newly authored for Pascal review.',
    '',
  ];

  for (const example of examples) {
    lines.push(
      `## ${example.candidateId} — ${example.title}`,
      '',
      `- **Generated problem id:** ${example.id}`,
      `- **Practice topic:** counting / conditional`,
      `- **Difficulty tag:** ${example.difficultyTag}`,
      `- **Skills:** ${renderSkillList(example.skills)}`,
      `- **Misconceptions:** ${example.misconceptions.join(', ')}`,
      `- **Core trick:** ${example.solver.steps[0]}`,
      `- **Prompt:** ${example.prompt}`,
      `- **Answer:** ${example.answer}`,
      `- **Solver feasibility:** exact arithmetic in \`verify-without-replacement.ts\` using ${example.solver.primaryMethod}.`,
      `- **Verification result:** ${example.verificationResult.passed ? 'passed' : 'failed'}`,
      '- **Human status:** pending review',
      '',
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderJson(examples: VerifiedExample[]): string {
  const payload = {
    laneId: LANE_ID,
    reviewOnly: true,
    sourceCopying: 'none',
    generatedBy: 'scripts/curriculum-harvest/verify-without-replacement.ts',
    artifacts: {
      markdown: 'docs/curriculum-harvest/generated-problems/without-replacement-verified.md',
      json: 'docs/curriculum-harvest/generated-problems/without-replacement-verified.json',
      candidates: 'docs/curriculum-harvest/candidates/without-replacement-batch.md',
    },
    taxonomy: {
      usedExistingSkillIds: Array.from(new Set(examples.flatMap((example) => example.skills))).sort(),
      missingSuggestedSkillIds: [...MISSING_TAXONOMY_IDS],
    },
    examples,
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

async function main(): Promise<void> {
  const examples = buildExamples();
  const failed = examples.filter((example) => !example.verificationResult.passed);
  if (failed.length > 0) {
    throw new Error(`Without-replacement verification failed: ${failed.map((example) => example.id).join(', ')}`);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(CANDIDATE_PATH), { recursive: true });
  await writeFile(JSON_PATH, renderJson(examples));
  await writeFile(MD_PATH, renderMarkdown(examples));
  await writeFile(CANDIDATE_PATH, renderCandidateMarkdown(examples));

  console.log(`wrote ${path.relative(process.cwd(), JSON_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_PATH)}`);
  console.log(`wrote ${path.relative(process.cwd(), CANDIDATE_PATH)}`);
  console.log(`verified ${examples.length} without-replacement examples`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
