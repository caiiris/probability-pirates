import type { Lesson, ProblemSlot, Variant } from './types';

function assertNonEmptyString(value: string, path: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${path}: required string must not be empty`);
  }
}

function assertVariantInvariants(lesson: Lesson, slot: ProblemSlot, variant: Variant): void {
  const basePath = `${lesson.id}/${slot.id}/${variant.id}`;

  assertNonEmptyString(variant.prompt, `${basePath}.prompt`);
  assertNonEmptyString(variant.feedbackCorrect, `${basePath}.feedbackCorrect`);
  assertNonEmptyString(variant.feedbackDefault, `${basePath}.feedbackDefault`);
  if (variant.afterNote !== undefined) {
    assertNonEmptyString(variant.afterNote, `${basePath}.afterNote`);
  }

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
        throw new Error(`${basePath}: numerator must be between 0 and denominator inclusive`);
      }
      if (variant.numeratorLabel !== undefined) {
        assertNonEmptyString(variant.numeratorLabel, `${basePath}.numeratorLabel`);
      }
      if (variant.denominatorLabel !== undefined) {
        assertNonEmptyString(variant.denominatorLabel, `${basePath}.denominatorLabel`);
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
          throw new Error(`${basePath}: correctOutcome "${outcome}" is not in sampleSpace`);
        }
      }
      break;
    }
    case 'grid-event': {
      if (variant.rows <= 0 || variant.cols <= 0) {
        throw new Error(`${basePath}: rows and cols must be positive`);
      }
      assertNonEmptyString(variant.liveCounterTemplate, `${basePath}.liveCounterTemplate`);
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
    case 'simulate-proportion': {
      if (variant.targetProbability < 0 || variant.targetProbability > 1) {
        throw new Error(`${basePath}: targetProbability must be between 0 and 1`);
      }
      if (variant.minTrials <= 0) {
        throw new Error(`${basePath}: minTrials must be positive`);
      }
      assertNonEmptyString(variant.targetLabel, `${basePath}.targetLabel`);
      if (variant.scenario === 'birthday' && (variant.roomSize ?? 0) < 2) {
        throw new Error(`${basePath}: birthday scenario requires roomSize >= 2`);
      }
      break;
    }
    case 'scrub-trials': {
      if (variant.targetProbability < 0 || variant.targetProbability > 1) {
        throw new Error(`${basePath}: targetProbability must be between 0 and 1`);
      }
      if (variant.minN <= 0 || variant.maxN <= 0) {
        throw new Error(`${basePath}: minN and maxN must be positive`);
      }
      if (variant.minN >= variant.maxN) {
        throw new Error(`${basePath}: minN must be strictly less than maxN`);
      }
      if (variant.reachN < variant.minN || variant.reachN > variant.maxN) {
        throw new Error(`${basePath}: reachN must be within [minN, maxN]`);
      }
      assertNonEmptyString(variant.targetLabel, `${basePath}.targetLabel`);
      break;
    }
    case 'monty-hall': {
      if (variant.minGames <= 0) {
        throw new Error(`${basePath}: minGames must be positive`);
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
      const hasTeachContent = Boolean(
        slot.title ||
        (slot.body && slot.body.length > 0) ||
        slot.example ||
        slot.theorem ||
        slot.derivation ||
        slot.quote,
      );
      if (slot.prompt !== undefined) {
        assertNonEmptyString(slot.prompt, `${basePath}.prompt`);
      } else if (!hasTeachContent) {
        throw new Error(`${basePath}: concept slot must have a prompt or teach content`);
      }
      if (slot.title !== undefined) {
        assertNonEmptyString(slot.title, `${basePath}.title`);
      }
      if (slot.body !== undefined) {
        if (slot.body.length === 0) {
          throw new Error(`${basePath}.body: must not be empty when present`);
        }
        slot.body.forEach((para, i) => assertNonEmptyString(para, `${basePath}.body[${i}]`));
      }
      if (slot.example !== undefined) {
        if (slot.example.title !== undefined) {
          assertNonEmptyString(slot.example.title, `${basePath}.example.title`);
        }
        if (slot.example.steps.length === 0) {
          throw new Error(`${basePath}.example.steps: must not be empty`);
        }
        slot.example.steps.forEach((step, i) =>
          assertNonEmptyString(step, `${basePath}.example.steps[${i}]`),
        );
      }
      if (slot.theorem !== undefined) {
        if (slot.theorem.name !== undefined) {
          assertNonEmptyString(slot.theorem.name, `${basePath}.theorem.name`);
        }
        assertNonEmptyString(slot.theorem.statement, `${basePath}.theorem.statement`);
      }
      if (slot.quote !== undefined) {
        assertNonEmptyString(slot.quote.text, `${basePath}.quote.text`);
        if (slot.quote.attribution !== undefined) {
          assertNonEmptyString(slot.quote.attribution, `${basePath}.quote.attribution`);
        }
      }
      if (slot.derivation !== undefined) {
        assertNonEmptyString(slot.derivation.title, `${basePath}.derivation.title`);
        if (slot.derivation.steps.length === 0) {
          throw new Error(`${basePath}.derivation.steps: must not be empty`);
        }
        slot.derivation.steps.forEach((step, i) =>
          assertNonEmptyString(step, `${basePath}.derivation.steps[${i}]`),
        );
        if (slot.derivation.question !== undefined) {
          assertNonEmptyString(slot.derivation.question, `${basePath}.derivation.question`);
        }
      }
      if (slot.figure !== undefined) {
        if (slot.figure.kind === 'settling-line') {
          if (slot.figure.targetProbability < 0 || slot.figure.targetProbability > 1) {
            throw new Error(`${basePath}.figure.targetProbability must be between 0 and 1`);
          }
          assertNonEmptyString(slot.figure.targetLabel, `${basePath}.figure.targetLabel`);
          if (slot.figure.trialCount !== undefined && slot.figure.trialCount <= 0) {
            throw new Error(`${basePath}.figure.trialCount must be positive`);
          }
          if (slot.figure.caption !== undefined) {
            assertNonEmptyString(slot.figure.caption, `${basePath}.figure.caption`);
          }
        }
      }
      break;
    }
    case 'wrap': {
      assertNonEmptyString(slot.title, `${basePath}.title`);
      assertNonEmptyString(slot.body, `${basePath}.body`);
      if (slot.mascotLine !== undefined) {
        assertNonEmptyString(slot.mascotLine, `${basePath}.mascotLine`);
      }
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
