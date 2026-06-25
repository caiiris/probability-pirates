/**
 * WP-7 — React Testing Library component tests for StrengthsPanel.
 *
 * Feeds a sample LearnerModel and asserts:
 *   - "Strong" group renders correct labels from strongestSkills (Engine A)
 *   - "Keep working on" group renders correct labels from weakestSkills (Engine A)
 *   - "Introduced" group shows skills in `exposure` but absent from `skills` (Engine B)
 *   - A practiced skill does NOT appear in the Introduced group
 *   - Empty state renders when model is null
 *   - Loading state renders skeleton (no content)
 *   - lessonFirstTryStruggles > 0 shows "worth a practice" invitation
 *
 * Explicit afterEach(cleanup) is required because Vitest does not expose
 * afterEach as a global by default, preventing RTL's auto-cleanup from firing.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StrengthsPanel } from './StrengthsPanel';
import type { LearnerModel, SkillStat, ExposureStat } from './learnerModel';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = 1_700_000_000_000;

function makeStat(recentCorrect: number, rating: number): SkillStat {
  return {
    rating,
    attempts: 5,
    correct: 3,
    recentCorrect,
    firstSeenAt: NOW,
    lastSeenAt: NOW,
  };
}

function makeExposure(struggles = 0): ExposureStat {
  return {
    introducedAt: NOW,
    lessonFirstTries: 2,
    lessonFirstTryStruggles: struggles,
    lastSeenAt: NOW,
  };
}

/**
 * A model with:
 *   - 3 practiced skills (Engine A):
 *       combinations    (recentCorrect=0.85 → pip 3, strong)
 *       permutations    (recentCorrect=0.55 → pip 2, mid — NOT in weakest to avoid dup)
 *       complement-rule (recentCorrect=0.25 → pip 1, weak)
 *   - 2 introduced-only skills (Engine B): conditional-probability, base-rate
 *   - 1 skill in BOTH engines: combinations (Engine A; must NOT appear in Introduced)
 *
 * strongestSkills and weakestSkills intentionally do NOT overlap so each skill
 * label appears exactly once in the rendered output, keeping getByText assertions
 * unambiguous.
 */
const sampleModel: LearnerModel = {
  skills: {
    combinations: makeStat(0.85, 1200),       // strong  → pip 3
    permutations: makeStat(0.55, 1000),        // mid     → pip 2
    'complement-rule': makeStat(0.25, 800),   // weak    → pip 1
  },
  exposure: {
    // 'combinations' is ALSO in skills → must NOT appear in Introduced
    combinations: makeExposure(0),
    // lesson-only skills
    'conditional-probability': makeExposure(0),
    'base-rate': makeExposure(1),              // struggles > 0 → "worth a practice"
  },
  misconceptions: {},
  // No overlap between strongest and weakest so each label appears exactly once.
  strongestSkills: ['combinations', 'permutations'],
  weakestSkills: ['complement-rule'],
  updatedAt: NOW,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

afterEach(cleanup);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StrengthsPanel', () => {
  describe('loading state', () => {
    it('renders a skeleton and no content headings while loading', () => {
      render(<StrengthsPanel model={null} loading={true} />);
      // aria-busy is set on the loading container
      expect(screen.getByLabelText('Loading strengths')).toBeInTheDocument();
      // No skill label text should appear
      expect(screen.queryByText('Combinations')).not.toBeInTheDocument();
      expect(screen.queryByText('Strong')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state text when model is null', () => {
      render(<StrengthsPanel model={null} loading={false} />);
      expect(
        screen.getByText(/do a lesson or some practice to see your strengths/i),
      ).toBeInTheDocument();
    });

    it('renders empty state when model has no skills and no exposure', () => {
      const empty: LearnerModel = {
        skills: {},
        exposure: {},
        misconceptions: {},
        weakestSkills: [],
        strongestSkills: [],
        updatedAt: NOW,
      };
      render(<StrengthsPanel model={empty} loading={false} />);
      expect(
        screen.getByText(/do a lesson or some practice to see your strengths/i),
      ).toBeInTheDocument();
    });
  });

  describe('Strong group (Engine A — strongestSkills)', () => {
    it('renders the correct skill labels from strongestSkills', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      // "Strong" heading
      expect(screen.getByText('Strong')).toBeInTheDocument();
      // Top practiced skills
      expect(screen.getByText('Combinations')).toBeInTheDocument();
      expect(screen.getByText('Permutations')).toBeInTheDocument();
    });
  });

  describe('Keep working on group (Engine A — weakestSkills)', () => {
    it('renders the correct skill labels from weakestSkills', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      expect(screen.getByText('Keep working on')).toBeInTheDocument();
      expect(screen.getByText('Complement rule')).toBeInTheDocument();
    });
  });

  describe('Introduced group (Engine B — exposure minus skills)', () => {
    it('shows skills that are in exposure but NOT in skills', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      expect(screen.getByText('Introduced')).toBeInTheDocument();
      // lesson-only skills
      expect(screen.getByText('Conditional probability')).toBeInTheDocument();
      expect(screen.getByText('Base rates')).toBeInTheDocument();
    });

    it('does NOT show a practiced skill (in both exposure and skills) in the Introduced group', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      // 'combinations' is practiced — it must appear only once (in Strong)
      // and must NOT appear in the Introduced section
      const allLabels = screen.getAllByText('Combinations');
      // Should appear exactly once (Strong group only)
      expect(allLabels).toHaveLength(1);
    });

    it('flags introduced skills with struggles as "worth a practice"', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      // 'base-rate' has lessonFirstTryStruggles=1 → invitation shown
      expect(screen.getByText('worth a practice')).toBeInTheDocument();
    });

    it('does NOT show "worth a practice" for introduced skills with no struggles', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      // 'conditional-probability' has lessonFirstTryStruggles=0 → no invitation
      // There should be exactly one "worth a practice" tag (only base-rate)
      expect(screen.getAllByText('worth a practice')).toHaveLength(1);
    });
  });

  describe('compact mode', () => {
    it('renders without crashing in compact mode and shows group headings', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} compact />);
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.getByText('Keep working on')).toBeInTheDocument();
      expect(screen.getByText('Introduced')).toBeInTheDocument();
    });

    it('shows the compact empty state for compact + null model', () => {
      render(<StrengthsPanel model={null} loading={false} compact />);
      expect(
        screen.getByText(/do a lesson or some practice to see your strengths/i),
      ).toBeInTheDocument();
    });
  });

  describe('mastery pips', () => {
    it('renders pips with aria-labels reflecting level 1/2/3', () => {
      render(<StrengthsPanel model={sampleModel} loading={false} />);
      // combinations: recentCorrect=0.85 → level 3 ("3 out of 3")
      // permutations: recentCorrect=0.55 → level 2 ("2 out of 3")
      // complement-rule: recentCorrect=0.25 → level 1 ("1 out of 3")
      expect(screen.getByLabelText('3 out of 3')).toBeInTheDocument();
      expect(screen.getByLabelText('2 out of 3')).toBeInTheDocument();
      expect(screen.getByLabelText('1 out of 3')).toBeInTheDocument();
    });
  });
});
