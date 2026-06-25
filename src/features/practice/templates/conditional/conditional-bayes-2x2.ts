/**
 * Template family: conditional-bayes-2x2
 *
 * Topic: conditional | Skills: conditional-probability, base-rate
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: a 2×2 integer count table {tp, fp, fn, tn}
 *   tp = disease AND test+ (true positive)
 *   fp = no-disease AND test+ (false positive)
 *   fn = disease AND test- (false negative)
 *   tn = no-disease AND test- (true negative)
 *
 * Solve:  P(disease | test+) = tp / (tp + fp)  (exact reduced fraction)
 * Rate:   harder when P(disease|test+) is low (counterintuitive base-rate scenario)
 * Simulate: sample from test-positive subpopulation; Bernoulli(tp/(tp+fp)) per trial
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = {
  tp: number; // true positives
  fp: number; // false positives
  fn: number; // false negatives
  tn: number; // true negatives
};

export const conditionalBayes2x2Template: Template<Params> = {
  id: 'conditional-bayes-2x2',
  topic: 'conditional',
  skills: ['conditional-probability', 'base-rate'],
  retrievalForm: 'application',

  rate({ tp, fp }) {
    // Current non-creative bank is intentionally labeled Easy (<950).
    // Low P(signal|test+) is still relatively harder inside the easy band.
    const p = tp / (tp + fp);
    return Math.round(760 + (1 - p) * 170);
  },

  sample(rng) {
    // tp: small (models low-prevalence scenarios, the interesting case)
    const tp = 2 + Math.floor(rng() * 28);     // 2–29
    // fp: often much larger than tp, creating the base-rate neglect trap
    const fp = 10 + Math.floor(rng() * 90);    // 10–99
    const fn = 1 + Math.floor(rng() * 20);     // 1–20
    const tn = 100 + Math.floor(rng() * 400);  // 100–499
    return { tp, fp, fn, tn };
  },

  solve({ tp, fp }) {
    return { kind: 'fraction', value: frac(tp, tp + fp) };
  },

  render(params) {
    const { tp, fp, fn, tn } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const total = tp + fp + fn + tn;
    return {
      id: `conditional-bayes-2x2:${tp},${fp},${fn},${tn}`,
      interactionKind: 'fill-fraction',
      prompt:
        `Given that a person tests positive, what is the probability they truly have the signal?`,
      context:
        `In a study, ${total} people were tested for a rare signal:\n` +
        `• ${tp} tested positive and truly had the signal\n` +
        `• ${fp} tested positive but did not have the signal\n` +
        `• ${fn} tested negative but truly had the signal\n` +
        `• ${tn} tested negative and did not have the signal`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! Among the ${tp + fp} people who tested positive, ${tp} truly have the signal: P = ${Number(num)}/${Number(den)}.`,
      feedbackDefault:
        `Condition on the event "test positive": only look at the ${tp + fp} people with a positive result. ` +
        `Of those, ${tp} truly have the signal, so P(signal | test+) = ${tp}/${tp + fp}.`,
      skills: ['conditional-probability', 'base-rate'],
    };
  },

  explain({ tp, fp, fn, tn }) {
    const testPos = tp + fp;
    const f = frac(tp, testPos);
    const total = tp + fp + fn + tn;
    return {
      title: `P(signal | test positive)`,
      steps: [
        `Total people: ${total}. Test-positive people: ${tp} + ${fp} = ${testPos}.`,
        `Among test-positive, ${tp} truly have the signal.`,
        `Condition on test+: P(signal | test+) = ${tp} / ${testPos}.`,
        `Reduced: ${Number(f.num)} / ${Number(f.den)}.`,
        `Note: even a sensitive test can have a low true-signal rate among positives when the signal is rare (base-rate neglect).`,
      ],
    };
  },

  simulate({ tp, fp }, trials, rng) {
    // Sample from the test-positive subpopulation: each person is disease+ with probability
    // tp/(tp+fp). This avoids the variance inflation of rejection-sampling the full population.
    const testPos = tp + fp;
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (rng() * testPos < tp) hits++;
    }
    return hits / trials;
  },
};
