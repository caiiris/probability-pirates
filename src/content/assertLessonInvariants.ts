import type { CombinationPickerConfig, Lesson, ProblemSlot, Variant } from './types';
import { SKILLS } from '@/content/skills';
import { MISCONCEPTIONS } from '@/content/misconceptions';

/** Tracks variant ids already warned about missing skills, to avoid repeat noise. */
const _warnedMissingSkills = new Set<string>();

function assertNonEmptyString(value: string, path: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${path}: required string must not be empty`);
  }
}

function assertTwoStageBranchFigure(
  figure: {
    stageA: { label: string; count: number };
    stageB: { label: string; count: number };
    stepMs?: number;
    holdMs?: number;
    caption?: string;
  },
  basePath: string,
): void {
  assertNonEmptyString(figure.stageA.label, `${basePath}.stageA.label`);
  assertNonEmptyString(figure.stageB.label, `${basePath}.stageB.label`);
  if (figure.stageA.count < 1 || figure.stageA.count > 6) {
    throw new Error(
      `${basePath}.stageA.count must be between 1 and 6 (got ${figure.stageA.count})`,
    );
  }
  if (figure.stageB.count < 1 || figure.stageB.count > 6) {
    throw new Error(
      `${basePath}.stageB.count must be between 1 and 6 (got ${figure.stageB.count})`,
    );
  }
  if (figure.stepMs !== undefined && figure.stepMs <= 0) {
    throw new Error(`${basePath}.stepMs must be positive`);
  }
  if (figure.holdMs !== undefined && figure.holdMs <= 0) {
    throw new Error(`${basePath}.holdMs must be positive`);
  }
  if (figure.caption !== undefined) {
    assertNonEmptyString(figure.caption, `${basePath}.caption`);
  }
}

function assertCombinationPicker(
  picker: CombinationPickerConfig,
  basePath: string,
): void {
  assertNonEmptyString(picker.stageALabel, `${basePath}.combinationPicker.stageALabel`);
  assertNonEmptyString(picker.stageBLabel, `${basePath}.combinationPicker.stageBLabel`);
  if (picker.stageAOptions.length < 2 || picker.stageAOptions.length > 6) {
    throw new Error(`${basePath}.combinationPicker.stageAOptions must have 2–6 items`);
  }
  if (picker.stageBOptions.length < 2 || picker.stageBOptions.length > 6) {
    throw new Error(`${basePath}.combinationPicker.stageBOptions must have 2–6 items`);
  }
  for (let i = 0; i < picker.stageAOptions.length; i++) {
    assertNonEmptyString(
      picker.stageAOptions[i],
      `${basePath}.combinationPicker.stageAOptions[${i}]`,
    );
  }
  for (let i = 0; i < picker.stageBOptions.length; i++) {
    assertNonEmptyString(
      picker.stageBOptions[i],
      `${basePath}.combinationPicker.stageBOptions[${i}]`,
    );
  }
  if (picker.addButtonLabel !== undefined) {
    assertNonEmptyString(picker.addButtonLabel, `${basePath}.combinationPicker.addButtonLabel`);
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
      if (variant.context !== undefined) {
        assertNonEmptyString(variant.context, `${basePath}.context`);
      }
      break;
    }
    case 'number-fill': {
      if (!Number.isInteger(variant.answer)) {
        throw new Error(`${basePath}: number-fill answer must be an integer`);
      }
      if (variant.answerLabel !== undefined) {
        assertNonEmptyString(variant.answerLabel, `${basePath}.answerLabel`);
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
      if (variant.misconceptionByOption !== undefined) {
        for (const [optionId, misconceptionKey] of Object.entries(variant.misconceptionByOption)) {
          if (!(misconceptionKey in MISCONCEPTIONS)) {
            throw new Error(
              `${basePath}.misconceptionByOption["${optionId}"]: unknown misconception key "${misconceptionKey}"`,
            );
          }
          if (!optionIds.has(optionId)) {
            throw new Error(
              `${basePath}.misconceptionByOption: option id "${optionId}" does not exist in options`,
            );
          }
        }
      }
      if (variant.strategyHint !== undefined) {
        assertNonEmptyString(variant.strategyHint, `${basePath}.strategyHint`);
      }
      if (variant.combinationPicker !== undefined) {
        assertCombinationPicker(variant.combinationPicker, basePath);
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
    case 'fill-text': {
      assertNonEmptyString(variant.acceptRegex, `${basePath}.acceptRegex`);
      // Compile the pattern at load time so a bad regex blows up here
      // instead of silently rejecting every learner answer at runtime.
      try {
        new RegExp(variant.acceptRegex, 'i');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `${basePath}.acceptRegex: not a valid regex (${message})`,
        );
      }
      if (variant.maxLength !== undefined && variant.maxLength <= 0) {
        throw new Error(`${basePath}.maxLength must be positive`);
      }
      if (variant.placeholder !== undefined) {
        assertNonEmptyString(variant.placeholder, `${basePath}.placeholder`);
      }
      if (variant.context !== undefined) {
        assertNonEmptyString(variant.context, `${basePath}.context`);
      }
      if (variant.combinationPicker !== undefined) {
        assertCombinationPicker(variant.combinationPicker, basePath);
      }
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

  if (variant.skills !== undefined) {
    for (const skillId of variant.skills) {
      if (!(skillId in SKILLS)) {
        throw new Error(`${basePath}.skills: unknown skill id "${skillId}"`);
      }
    }
  } else {
    if (!_warnedMissingSkills.has(variant.id)) {
      console.warn(`[WP-2] variant ${basePath} has no skills tagged (optional during migration)`);
      _warnedMissingSkills.add(variant.id);
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
        slot.definition ||
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
      if (slot.definition !== undefined) {
        if (slot.definition.name !== undefined) {
          assertNonEmptyString(slot.definition.name, `${basePath}.definition.name`);
        }
        assertNonEmptyString(slot.definition.statement, `${basePath}.definition.statement`);
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
        switch (slot.figure.kind) {
          case 'settling-line': {
            if (slot.figure.targetProbability < 0 || slot.figure.targetProbability > 1) {
              throw new Error(
                `${basePath}.figure.targetProbability must be between 0 and 1`,
              );
            }
            assertNonEmptyString(slot.figure.targetLabel, `${basePath}.figure.targetLabel`);
            if (slot.figure.trialCount !== undefined && slot.figure.trialCount <= 0) {
              throw new Error(`${basePath}.figure.trialCount must be positive`);
            }
            if (slot.figure.caption !== undefined) {
              assertNonEmptyString(slot.figure.caption, `${basePath}.figure.caption`);
            }
            break;
          }
          case 'two-coins-grid': {
            if (slot.figure.stepMs !== undefined && slot.figure.stepMs <= 0) {
              throw new Error(`${basePath}.figure.stepMs must be positive`);
            }
            if (slot.figure.holdMs !== undefined && slot.figure.holdMs <= 0) {
              throw new Error(`${basePath}.figure.holdMs must be positive`);
            }
            if (slot.figure.caption !== undefined) {
              assertNonEmptyString(slot.figure.caption, `${basePath}.figure.caption`);
            }
            break;
          }
          case 'subset-picker': {
            if (slot.figure.caption !== undefined) {
              assertNonEmptyString(slot.figure.caption, `${basePath}.figure.caption`);
            }
            break;
          }
          case 'tree-diagram': {
            assertTwoStageBranchFigure(slot.figure, `${basePath}.figure`);
            break;
          }
          case 'road-fork': {
            assertTwoStageBranchFigure(slot.figure, `${basePath}.figure`);
            break;
          }
          default: {
            const exhaustive: never = slot.figure;
            throw new Error(
              `${basePath}.figure: unknown kind ${JSON.stringify(exhaustive)}`,
            );
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
