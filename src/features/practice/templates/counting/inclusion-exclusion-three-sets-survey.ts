/**
 * Template family: inclusion-exclusion-three-sets-survey
 *
 * Topic: inclusion-exclusion | Skills: inclusion-exclusion
 * Retrieval form: application | Interaction: fill-fraction | Has simulate: yes
 *
 * Parameters: seven disjoint region counts {oa,ob,oc,ab,ac,bc,t} ∈ [1,5]
 *             and a 'none' count ∈ [2,8]. N = sum of all eight.
 * The learner is given the three set sizes and the four overlap sizes
 * (derived from the regions) and must find P(in at least one of A,B,C).
 * Solve:      union = oa+ob+oc+ab+ac+bc+t, answer = union / N.
 *             (Equivalently |A|+|B|+|C|−|A∩B|−|A∩C|−|B∩C|+|A∩B∩C|.)
 * Rate:       Upper-medium band — a three-set inclusion–exclusion word problem.
 */

import type { Template } from '../types';
import { frac } from '@/lib/probability/exact';

type Params = {
  oa: number; // only A
  ob: number; // only B
  oc: number; // only C
  ab: number; // A∩B only (not C)
  ac: number; // A∩C only (not B)
  bc: number; // B∩C only (not A)
  t: number; // A∩B∩C
  none: number; // none of A,B,C
};

const SPORTS = ['soccer', 'basketball', 'tennis'] as const;

function unionCount(p: Params): number {
  return p.oa + p.ob + p.oc + p.ab + p.ac + p.bc + p.t;
}

function totalCount(p: Params): number {
  return unionCount(p) + p.none;
}

export const inclusionExclusionThreeSetsSurveyTemplate: Template<Params> = {
  id: 'inclusion-exclusion-three-sets-survey',
  topic: 'inclusion-exclusion',
  skills: ['inclusion-exclusion'],
  retrievalForm: 'application',

  rate(params) {
    // Upper-medium band; larger participation reads a touch harder. Capped at 1650.
    return Math.min(1650, 1400 + unionCount(params) * 4);
  },

  sample(rng) {
    const region = () => 1 + Math.floor(rng() * 5); // 1..5
    const oa = region();
    const ob = region();
    const oc = region();
    const ab = region();
    const ac = region();
    const bc = region();
    const t = region();
    const none = 2 + Math.floor(rng() * 7); // 2..8
    return { oa, ob, oc, ab, ac, bc, t, none };
  },

  solve(params) {
    return { kind: 'fraction', value: frac(unionCount(params), totalCount(params)) };
  },

  render(params) {
    const { oa, ob, oc, ab, ac, bc, t } = params;
    const answer = this.solve(params);
    if (answer.kind !== 'fraction') throw new Error('solve returned unexpected kind');
    const { num, den } = answer.value;
    const N = totalCount(params);
    const sizeA = oa + ab + ac + t;
    const sizeB = ob + ab + bc + t;
    const sizeC = oc + ac + bc + t;
    const iAB = ab + t;
    const iAC = ac + t;
    const iBC = bc + t;
    const [A, B, C] = SPORTS;
    const union = unionCount(params);
    const trapNum = sizeA + sizeB + sizeC; // omits all overlap subtractions
    const misconceptionByFraction: { num: number; den: number; key: 'forgot_overlap' }[] = [];
    if (trapNum !== union) {
      const tf = frac(trapNum, N);
      misconceptionByFraction.push({ num: Number(tf.num), den: Number(tf.den), key: 'forgot_overlap' });
    }
    return {
      id:
        `inclusion-exclusion-three-sets-survey:` +
        `oa=${oa},ob=${ob},oc=${oc},ab=${ab},ac=${ac},bc=${bc},t=${t},none=${params.none}`,
      interactionKind: 'fill-fraction',
      prompt:
        `In a class of ${N} students, ${sizeA} play ${A}, ${sizeB} play ${B}, and ${sizeC} play ${C}. ` +
        `Also, ${iAB} play both ${A} and ${B}, ${iAC} play both ${A} and ${C}, ${iBC} play both ${B} and ${C}, ` +
        `and ${t} play all three. One student is chosen at random. ` +
        `What is the probability they play at least one of these three sports?`,
      numerator: Number(num),
      denominator: Number(den),
      feedbackCorrect:
        `Correct! |A∪B∪C| = ${sizeA} + ${sizeB} + ${sizeC} − ${iAB} − ${iAC} − ${iBC} + ${t} = ${union}, over ${N}.`,
      feedbackDefault:
        `Add the three group sizes, subtract each pairwise overlap, then add back the ${t} in all three ` +
        `(inclusion–exclusion), and divide by ${N}.`,
      skills: ['inclusion-exclusion'],
      ...(misconceptionByFraction.length > 0 ? { misconceptionByFraction } : {}),
    };
  },

  explain(params) {
    const { oa, ob, oc, ab, ac, bc, t } = params;
    const N = totalCount(params);
    const sizeA = oa + ab + ac + t;
    const sizeB = ob + ab + bc + t;
    const sizeC = oc + ac + bc + t;
    const iAB = ab + t;
    const iAC = ac + t;
    const iBC = bc + t;
    const union = unionCount(params);
    const f = frac(union, N);
    const [A, B, C] = SPORTS;
    return {
      title: `P(plays at least one sport) in a class of ${N}`,
      steps: [
        `Group sizes: |${A}| = ${sizeA}, |${B}| = ${sizeB}, |${C}| = ${sizeC}.`,
        `Pairwise overlaps: |${A}∩${B}| = ${iAB}, |${A}∩${C}| = ${iAC}, |${B}∩${C}| = ${iBC}; all three = ${t}.`,
        `Inclusion–exclusion: ${sizeA} + ${sizeB} + ${sizeC} − ${iAB} − ${iAC} − ${iBC} + ${t} = ${union}.`,
        `P = ${union}/${N} = ${Number(f.num)}/${Number(f.den)}.`,
      ],
    };
  },

  simulate(params, trials, rng) {
    const union = unionCount(params);
    const N = totalCount(params);
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (Math.floor(rng() * N) < union) hits++;
    }
    return hits / trials;
  },
};
