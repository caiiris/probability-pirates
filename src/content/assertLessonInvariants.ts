import type { Lesson, ProblemSlot, Variant } from './types';

function assertNonEmptyString(value: string, path: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${path}: required string must not be empty`);
  }
}

function assertVariantInvariants(
  lesson: Lesson,
  slot: ProblemSlot,
  variant: Variant,
): void {
  const basePath = `${lesson.id}/${slot.id}/${variant.id}`;

  assertNonEmptyString(variant.prompt, `${basePath}.prompt`);
  assertNonEmptyString(variant.feedbackCorrect, `${basePath}.feedbackCorrect`);
  assertNonEmptyString(variant.feedbackDefault, `${basePath}.feedbackDefault`);

  if (variant.interactionKind !== slot.interactionKind) {
    throw new Error(
      `${basePath}: variant interactionKind "${variant.interactionKind}" does not match slot interactionKind "${slot.interactionKind}"`,
    );
  }

  switch (variant.interactionKind) {
    case 'tap-outcomes': {
      if (variant.expectedOutcomes.length === 0) {
        throw new Error(`${basePath}: expectedOutcomes must not be empty`);
      }
      break;
    }
    case 'fill-fraction': {
      if (variant.denominator <= 0) {
        throw new Error(`${basePath}: denominator must be positive`);
      }
      if (variant.numerator < 0 || variant.numerator > variant.denominator) {
        throw new Error(
          `${basePath}: numerator must be between 0 and denominator inclusive`,
        );
      }
      break;
    }
    case 'tap-event': {
      if (variant.sampleSpace.length === 0) {
        throw new Error(`${basePath}: sampleSpace must not be empty`);
      }
      if (variant.correctOutcomes.length === 0) {
        throw new Error(`${basePath}: correctOutcomes must not be empty`);
      }
      for (const outcome of variant.correctOutcomes) {
        if (!variant.sampleSpace.includes(outcome)) {
          throw new Error(
            `${basePath}: correctOutcome "${outcome}" is not in sampleSpace`,
          );
        }
      }
      break;
    }
    case 'grid-event': {
      if (variant.rows <= 0 || variant.cols <= 0) {
        throw new Error(`${basePath}: rows and cols must be positive`);
      }
      assertNonEmptyString(
        variant.liveCounterTemplate,
        `${basePath}.liveCounterTemplate`,
      );
      for (const [row, col] of variant.correctCells) {
        if (row < 1 || row > variant.rows || col < 1 || col > variant.cols) {
          throw new Error(
            `${basePath}: correctCell [${row}, ${col}] is out of bounds for ${variant.rows}×${variant.cols} grid`,
          );
        }
      }
      break;
    }
    case 'multiple-choice': {
      if (variant.options.length < 2) {
        throw new Error(`${basePath}: multiple-choice must have at least 2 options`);
      }
      const optionIds = new Set(variant.options.map((option) => option.id));
      if (!optionIds.has(variant.correctOptionId)) {
        throw new Error(
          `${basePath}: correctOptionId "${variant.correctOptionId}" is not in options`,
        );
      }
      for (const option of variant.options) {
        assertNonEmptyString(option.label, `${basePath}.options.${option.id}.label`);
      }
      break;
    }
    default: {
      const exhaustive: never = variant;
      throw new Error(`${basePath}: unknown variant kind ${JSON.stringify(exhaustive)}`);
    }
  }
}

function assertSlotInvariants(lesson: Lesson, slot: Lesson['slots'][number]): void {
  const basePath = `${lesson.id}/${slot.id}`;

  switch (slot.kind) {
    case 'concept': {
      assertNonEmptyString(slot.prompt, `${basePath}.prompt`);
      break;
    }
    case 'wrap': {
      assertNonEmptyString(slot.title, `${basePath}.title`);
      assertNonEmptyString(slot.body, `${basePath}.body`);
      break;
    }
    case 'problem': {
      if (slot.variants.length === 0) {
        throw new Error(`${basePath}: problem slot must have at least one variant`);
      }
      for (const variant of slot.variants) {
        assertVariantInvariants(lesson, slot, variant);
      }
      break;
    }
    default: {
      const exhaustive: never = slot;
      throw new Error(`${basePath}: unknown slot kind ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Validates lesson content invariants. Skips slot checks for coming-soon lessons.
 */
export function assertLessonInvariants(lesson: Lesson): void {
  assertNonEmptyString(lesson.id, `${lesson.id}.id`);
  assertNonEmptyString(lesson.title, `${lesson.id}.title`);
  assertNonEmptyString(lesson.blurb, `${lesson.id}.blurb`);

  if (lesson.comingSoon) {
    return;
  }

  if (lesson.slots.length === 0) {
    throw new Error(`${lesson.id}: lesson must have at least one slot`);
  }

  const slotIds = new Set<string>();
  for (const slot of lesson.slots) {
    if (slotIds.has(slot.id)) {
      throw new Error(`${lesson.id}: duplicate slot id "${slot.id}"`);
    }
    slotIds.add(slot.id);
    assertSlotInvariants(lesson, slot);
  }
}
