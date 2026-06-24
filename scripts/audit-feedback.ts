import { lessons } from '../src/content/index';
import { isFeedbackTodo, type ProblemSlot, type Variant } from '../src/content/types';

type FeedbackField =
  | 'feedbackByWrongValue'
  | 'feedbackByWrongAnswer'
  | 'feedbackByWrongOutcome'
  | 'feedbackByOption'
  | 'feedbackByCell';

type FieldRequirement = 'required' | 'optional';

const FEEDBACK_FIELDS_BY_KIND: Record<
  Variant['interactionKind'],
  Array<{ field: FeedbackField; requirement: FieldRequirement }>
> = {
  'tap-outcomes': [{ field: 'feedbackByWrongValue', requirement: 'required' }],
  'fill-fraction': [{ field: 'feedbackByWrongAnswer', requirement: 'required' }],
  'tap-event': [{ field: 'feedbackByWrongOutcome', requirement: 'required' }],
  'grid-event': [{ field: 'feedbackByCell', requirement: 'optional' }],
  'multiple-choice': [{ field: 'feedbackByOption', requirement: 'required' }],
  // Simulation kinds only need the 'incomplete' nudge; it falls back to
  // feedbackDefault, so the per-key hint is optional.
  'simulate-proportion': [{ field: 'feedbackByWrongValue', requirement: 'optional' }],
  'monty-hall': [{ field: 'feedbackByWrongValue', requirement: 'optional' }],
};

const BASE_STRING_FIELDS = ['prompt', 'feedbackCorrect', 'feedbackDefault', 'explanation'] as const;

function getVariantFeedbackRecord(
  variant: Variant,
  field: FeedbackField,
): Record<string, string> | undefined {
  switch (field) {
    case 'feedbackByWrongValue':
      return variant.interactionKind === 'tap-outcomes' ||
        variant.interactionKind === 'simulate-proportion' ||
        variant.interactionKind === 'monty-hall'
        ? variant.feedbackByWrongValue
        : undefined;
    case 'feedbackByWrongAnswer':
      return variant.interactionKind === 'fill-fraction'
        ? variant.feedbackByWrongAnswer
        : undefined;
    case 'feedbackByWrongOutcome':
      return variant.interactionKind === 'tap-event' ? variant.feedbackByWrongOutcome : undefined;
    case 'feedbackByOption':
      return variant.interactionKind === 'multiple-choice' ? variant.feedbackByOption : undefined;
    case 'feedbackByCell':
      return variant.interactionKind === 'grid-event' ? variant.feedbackByCell : undefined;
    default:
      return undefined;
  }
}

type Finding = {
  kind: 'missing' | 'optional-empty' | 'placeholder';
  path: string;
  detail: string;
};

function auditVariant(lessonId: string, slot: ProblemSlot, variant: Variant): Finding[] {
  const findings: Finding[] = [];
  const path = `${lessonId}/${slot.id}/${variant.id}`;

  for (const fieldKey of BASE_STRING_FIELDS) {
    const value = (variant as Record<string, unknown>)[fieldKey];
    if (typeof value === 'string' && isFeedbackTodo(value)) {
      findings.push({
        kind: 'placeholder',
        path,
        detail: `${fieldKey}: ${value}`,
      });
    }
  }

  for (const { field, requirement } of FEEDBACK_FIELDS_BY_KIND[variant.interactionKind]) {
    const record = getVariantFeedbackRecord(variant, field);
    const isMissing = !record || Object.keys(record).length === 0;

    if (isMissing) {
      if (requirement === 'required') {
        findings.push({
          kind: 'missing',
          path,
          detail: `missing ${field} entries`,
        });
      } else {
        findings.push({
          kind: 'optional-empty',
          path,
          detail: `${field} is empty — consider per-cell hints for richer feedback`,
        });
      }
      continue;
    }

    for (const [key, value] of Object.entries(record)) {
      if (isFeedbackTodo(value)) {
        findings.push({
          kind: 'placeholder',
          path,
          detail: `${field}["${key}"]: ${value}`,
        });
      }
    }
  }

  return findings;
}

function main(): void {
  const findings: Finding[] = [];

  for (const lesson of lessons) {
    if (lesson.comingSoon) {
      continue;
    }

    for (const slot of lesson.slots) {
      if (slot.kind !== 'problem') {
        continue;
      }

      for (const variant of slot.variants) {
        findings.push(...auditVariant(lesson.id, slot, variant));
      }
    }
  }

  const grouped: Record<Finding['kind'], Finding[]> = {
    missing: [],
    placeholder: [],
    'optional-empty': [],
  };
  for (const finding of findings) {
    grouped[finding.kind].push(finding);
  }

  const totalBlocking = grouped.missing.length + grouped.placeholder.length;

  if (findings.length === 0) {
    console.log('Feedback audit: clean. No missing entries or placeholders.');
    process.exit(0);
  }

  console.log('Feedback audit results:\n');

  if (grouped.missing.length > 0) {
    console.log(`Missing required feedback (${grouped.missing.length}):`);
    for (const f of grouped.missing) {
      console.log(`  - ${f.path}: ${f.detail}`);
    }
    console.log('');
  }

  if (grouped.placeholder.length > 0) {
    console.log(`Pending TODO placeholders (${grouped.placeholder.length}):`);
    for (const f of grouped.placeholder) {
      console.log(`  - ${f.path}: ${f.detail}`);
    }
    console.log('');
  }

  if (grouped['optional-empty'].length > 0) {
    console.log(`Optional gaps (${grouped['optional-empty'].length}):`);
    for (const f of grouped['optional-empty']) {
      console.log(`  - ${f.path}: ${f.detail}`);
    }
    console.log('');
  }

  // CI gate: missing-required and placeholders block. Optional gaps inform only.
  // Currently exits 0 to keep dev unblocked while content is in flux.
  // See docs/issues.md I007 — flip to process.exit(totalBlocking > 0 ? 1 : 0) before launch.
  if (totalBlocking > 0) {
    console.log(`${totalBlocking} blocking item(s) above. Will fail CI once I007 is closed.`);
  }
  process.exit(0);
}

main();
