/**
 * PROTOTYPE — case generator contract explorer.
 *
 * Question:
 * Can the agreed data model produce deterministic legal truth candidates from the
 * existing clue/facet catalog, while keeping story choice inside those candidates
 * and freezing state-conditional slot solutions when they are placed?
 *
 * This module is intentionally pure. The terminal shell lives at the project root.
 */

import {
  FRAME_ACCEPTS,
  type AxisDef,
  type CaseDef,
  type ClueCard,
  type Kind,
  type RunContent,
  type SlotFrame,
  type Tag,
} from './engine';
import { facetStatus, type Facet } from './facets';

export type GeneratorStat = 'heat' | 'trust' | 'axis';

export interface GeneratorState {
  heat: number;
  trust: number;
  axis: number;
}

export interface StateCondition {
  stat: GeneratorStat;
  gte?: number;
  lt?: number;
}

export interface PatternEvidence {
  id: string;
  patternId: string;
  sourceSnapshotIds: string[];
  commonClues: string[];
  typicalLocations: string[];
  summary: string;
}

export interface AxisProfile {
  id: string;
  drivenBy: Tag;
  initial: number;
  step: number;
  min: number;
  max: number;
}

export interface AxisPresentation {
  profileId: string;
  label: string;
  low: string;
  high: string;
  hint: string;
}

export interface SlotRequirement {
  slotId: string;
  facetTagsAll?: Tag[];
  meaningIncludesAny?: string[];
}

export interface SlotPreference {
  slotId?: string;
  facetTagsAny?: Tag[];
  meaningIncludesAny?: string[];
  weight: number;
}

export interface StorySeed {
  id: string;
  requires: SlotRequirement[];
  prefers: SlotPreference[];
  axisPresentations: AxisPresentation[];
}

export interface SlotRecipe {
  id: string;
  order: number;
  frame: SlotFrame;
  accepts: Kind[];
  label: string;
}

export interface PatternRecipe {
  id: string;
  version: string;
  evidenceIds: string[];
  slots: SlotRecipe[];
  allowedAxisProfiles: string[];
  allowCardReuse: boolean;
}

export interface SlotSolution {
  id: string;
  cardId: string;
  facetKey: string;
  when?: StateCondition;
}

export interface SlotTruth {
  recipeSlotId: string;
  frame: SlotFrame;
  accepts: Kind[];
  solutions: SlotSolution[];
}

export interface TruthCandidate {
  id: string;
  recipeId: string;
  recipeVersion: string;
  storySeedId: string;
  axisProfile: AxisProfile;
  axisPresentation: AxisPresentation;
  initialState: GeneratorState;
  finalState: GeneratorState;
  slots: SlotTruth[];
  preferenceScore: number;
  trace: string[];
}

export interface CandidateSearchInput {
  clues: Record<string, ClueCard>;
  recipe: PatternRecipe;
  storySeed: StorySeed;
  axisProfile: AxisProfile;
  initialState: GeneratorState;
  knownFacets: ReadonlySet<string>;
  lentFacets: ReadonlySet<string>;
  tagDeltas: RunContent['tagDeltas'];
  maxCandidates?: number;
}

export interface ContractIssue {
  path: string;
  message: string;
}

export interface CasePresentation {
  title: string;
  intro: string;
  teaser?: string;
  contextHint?: string;
  pieces: string[];
  slots: {
    recipeSlotId: string;
    label: string;
    hit?: string;
    josaAfter?: CaseDef['slots'][number]['josaAfter'];
  }[];
  axis: AxisPresentation | null;
}

export interface PrototypeObstacle {
  id: string;
  kind: 'falseClaim';
  effect: string;
  breakCondition: string;
  outcome: string;
}

export interface LegacyMigration {
  caseId: string;
  sourceSnapshotIds: string[];
  recipe: PatternRecipe;
  truth: {
    recipeId: string;
    recipeVersion: string;
    slots: SlotTruth[];
  };
  presentation: CasePresentation;
  obstacles: PrototypeObstacle[];
  axisProfile: AxisProfile | null;
  axisPresentation: AxisPresentation | null;
  issues: ContractIssue[];
}

export interface BranchProbe {
  slotId: string;
  solutionId: string;
  stateBefore: GeneratorState;
  stateAfterPlacement: GeneratorState;
  eligibleBefore: boolean;
  eligibleAfterLiveReevaluation: boolean;
  frozenAcceptanceStable: boolean;
}

export interface FailureVocabularyProbe {
  direction: 'public-overload' | 'coercive-collapse';
  reachable: boolean;
  witnesses: { cardId: string; facetKey: string; tags: Tag[] }[];
}

export interface TripleConstraintReport {
  solvable: boolean;
  coherent: boolean;
  failureDirectionsReachable: boolean;
  failureVocabulary: FailureVocabularyProbe[];
  problems: string[];
}

export interface CandidateSelection {
  ok: boolean;
  candidate?: TruthCandidate;
  reason?: string;
}

const clamp = (value: number, min = 0, max = 10): number =>
  Math.max(min, Math.min(max, value));

function statValue(state: GeneratorState, stat: GeneratorStat): number {
  if (stat === 'heat') return state.heat;
  if (stat === 'trust') return state.trust;
  return state.axis;
}

export function conditionMatches(
  condition: StateCondition | undefined,
  state: GeneratorState,
): boolean {
  if (!condition) return true;
  const value = statValue(state, condition.stat);
  if (condition.gte !== undefined && value < condition.gte) return false;
  if (condition.lt !== undefined && value >= condition.lt) return false;
  return true;
}

function applyFacet(
  state: GeneratorState,
  facet: Facet,
  tagDeltas: RunContent['tagDeltas'],
  profile: AxisProfile,
): GeneratorState {
  let heat = state.heat;
  let trust = state.trust;
  let axis = state.axis;

  for (const tag of facet.tags) {
    const delta = tagDeltas[tag];
    heat += delta.heat;
    trust += delta.trust;
    if (tag === profile.drivenBy) axis += profile.step;
  }

  return {
    heat: clamp(heat),
    trust: clamp(trust),
    axis: clamp(axis, profile.min, profile.max),
  };
}

function requirementFor(seed: StorySeed, slotId: string): SlotRequirement | undefined {
  return seed.requires.find((requirement) => requirement.slotId === slotId);
}

function requirementMatches(requirement: SlotRequirement | undefined, facet: Facet): boolean {
  if (!requirement) return true;
  if (
    requirement.facetTagsAll &&
    !requirement.facetTagsAll.every((tag) => facet.tags.includes(tag))
  ) {
    return false;
  }
  if (
    requirement.meaningIncludesAny &&
    !requirement.meaningIncludesAny.some((word) => facet.meaning.includes(word))
  ) {
    return false;
  }
  return true;
}

function preferenceScore(seed: StorySeed, slotId: string, facet: Facet): number {
  return seed.prefers.reduce((score, preference) => {
    if (preference.slotId && preference.slotId !== slotId) return score;
    const tagMatch =
      !preference.facetTagsAny ||
      preference.facetTagsAny.some((tag) => facet.tags.includes(tag));
    const meaningMatch =
      !preference.meaningIncludesAny ||
      preference.meaningIncludesAny.some((word) => facet.meaning.includes(word));
    return tagMatch && meaningMatch ? score + preference.weight : score;
  }, 0);
}

function presentationFor(seed: StorySeed, profile: AxisProfile): AxisPresentation {
  return (
    seed.axisPresentations.find((presentation) => presentation.profileId === profile.id) ?? {
      profileId: profile.id,
      label: profile.id,
      low: '낮음',
      high: '높음',
      hint: `${profile.drivenBy} 측면이 축을 움직인다.`,
    }
  );
}

interface SearchOption {
  card: ClueCard;
  facet: Facet;
  score: number;
}

function legalOptions(
  input: CandidateSearchInput,
  slot: SlotRecipe,
  state: GeneratorState,
  previousFrame: SlotFrame | null,
  usedCards: ReadonlySet<string>,
): SearchOption[] {
  const requirement = requirementFor(input.storySeed, slot.id);
  const context = {
    heat: state.heat,
    trust: state.trust,
    axis: state.axis,
    prevFrame: previousFrame,
    known: input.knownFacets,
    lent: input.lentFacets,
  };

  return Object.values(input.clues)
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((card) => {
      if (!input.recipe.allowCardReuse && usedCards.has(card.id)) return [];
      if (!slot.accepts.includes(card.kind)) return [];
      return card.facets
        .filter((facet) => facet.frame === slot.frame)
        .filter((facet) => requirementMatches(requirement, facet))
        .filter((facet) => facetStatus(facet, slot.frame, context).usable)
        .map((facet) => ({
          card,
          facet,
          score: preferenceScore(input.storySeed, slot.id, facet),
        }));
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.card.id.localeCompare(b.card.id) ||
        a.facet.key.localeCompare(b.facet.key),
    );
}

export function enumerateLegalCandidates(input: CandidateSearchInput): TruthCandidate[] {
  if (!input.recipe.allowedAxisProfiles.includes(input.axisProfile.id)) return [];

  const limit = input.maxCandidates ?? 50;
  const candidates: TruthCandidate[] = [];
  const orderedSlots = [...input.recipe.slots].sort((a, b) => a.order - b.order);

  function walk(
    slotIndex: number,
    state: GeneratorState,
    usedCards: Set<string>,
    slots: SlotTruth[],
    score: number,
    trace: string[],
  ): void {
    if (candidates.length >= limit) return;
    if (slotIndex >= orderedSlots.length) {
      const candidateId = [
        input.recipe.id,
        input.recipe.version,
        ...slots.flatMap((slot) =>
          slot.solutions.map((solution) => solution.facetKey),
        ),
      ].join('|');
      candidates.push({
        id: candidateId,
        recipeId: input.recipe.id,
        recipeVersion: input.recipe.version,
        storySeedId: input.storySeed.id,
        axisProfile: input.axisProfile,
        axisPresentation: presentationFor(input.storySeed, input.axisProfile),
        initialState: { ...input.initialState },
        finalState: { ...state },
        slots,
        preferenceScore: score,
        trace,
      });
      return;
    }

    const slot = orderedSlots[slotIndex];
    const previousFrame = slotIndex === 0 ? null : orderedSlots[slotIndex - 1].frame;
    const options = legalOptions(input, slot, state, previousFrame, usedCards);

    for (const option of options) {
      const nextState = applyFacet(
        state,
        option.facet,
        input.tagDeltas,
        input.axisProfile,
      );
      const nextUsed = new Set(usedCards);
      nextUsed.add(option.card.id);
      const solution: SlotSolution = {
        id: `${slot.id}:${option.facet.key}`,
        cardId: option.card.id,
        facetKey: option.facet.key,
      };
      walk(
        slotIndex + 1,
        nextState,
        nextUsed,
        [
          ...slots,
          {
            recipeSlotId: slot.id,
            frame: slot.frame,
            accepts: slot.accepts,
            solutions: [solution],
          },
        ],
        score + option.score,
        [
          ...trace,
          `${slot.id} ← ${option.card.name} / ${option.facet.meaning} (${option.facet.tags.join(',') || '태그 없음'})`,
        ],
      );
      if (candidates.length >= limit) return;
    }
  }

  walk(
    0,
    { ...input.initialState },
    new Set<string>(),
    [],
    0,
    [],
  );

  return candidates.sort(
    (a, b) =>
      b.preferenceScore - a.preferenceScore ||
      a.trace.join('|').localeCompare(b.trace.join('|')),
  );
}

export function selectLegalCandidate(
  candidates: TruthCandidate[],
  candidateId: string,
): CandidateSelection {
  const candidate = candidates.find((item) => item.id === candidateId);
  if (!candidate) {
    return {
      ok: false,
      reason: 'sLLM이 선택한 candidateId가 엔진의 합법 후보 목록에 없다.',
    };
  }
  return { ok: true, candidate };
}

function facetForSolution(
  solution: SlotSolution,
  clues: Record<string, ClueCard>,
): Facet | undefined {
  return clues[solution.cardId]?.facets.find((facet) => facet.key === solution.facetKey);
}

export function validateTruthContract(
  slots: SlotTruth[],
  clues: Record<string, ClueCard>,
): ContractIssue[] {
  const issues: ContractIssue[] = [];

  for (const [slotIndex, slot] of slots.entries()) {
    if (slot.solutions.length === 0) {
      issues.push({
        path: `slots[${slotIndex}].solutions`,
        message: '해답이 최소 하나 필요하다.',
      });
      continue;
    }

    for (const [solutionIndex, solution] of slot.solutions.entries()) {
      const path = `slots[${slotIndex}].solutions[${solutionIndex}]`;
      const card = clues[solution.cardId];
      if (!card) {
        issues.push({ path: `${path}.cardId`, message: '존재하지 않는 카드다.' });
        continue;
      }
      const facet = facetForSolution(solution, clues);
      if (!facet) {
        issues.push({
          path: `${path}.facetKey`,
          message: '해당 카드에 속하지 않는 측면이다.',
        });
        continue;
      }
      if (facet.frame !== slot.frame) {
        issues.push({
          path: `${path}.facetKey`,
          message: `측면 frame ${facet.frame}이 슬롯 frame ${slot.frame}과 다르다.`,
        });
      }
      if (!slot.accepts.includes(card.kind)) {
        issues.push({
          path: `${path}.cardId`,
          message: `카드 kind ${card.kind}가 accepts에 없다.`,
        });
      }
      if (
        solution.when &&
        solution.when.gte === undefined &&
        solution.when.lt === undefined
      ) {
        issues.push({
          path: `${path}.when`,
          message: '상태 조건에는 gte 또는 lt가 필요하다.',
        });
      }
    }
  }

  return issues;
}

export function probeFailureVocabulary(
  clues: Record<string, ClueCard>,
  knownFacets: ReadonlySet<string>,
  tagDeltas: RunContent['tagDeltas'],
): FailureVocabularyProbe[] {
  const known = Object.values(clues).flatMap((card) =>
    card.facets
      .filter((facet) => knownFacets.has(facet.key))
      .map((facet) => ({ cardId: card.id, facet })),
  );

  const publicWitnesses = known
    .filter(({ facet }) =>
      facet.tags.some((tag) => tagDeltas[tag].heat > 0),
    )
    .map(({ cardId, facet }) => ({
      cardId,
      facetKey: facet.key,
      tags: facet.tags,
    }));
  const coerciveWitnesses = known
    .filter(({ facet }) =>
      facet.tags.some((tag) => tagDeltas[tag].trust < 0),
    )
    .map(({ cardId, facet }) => ({
      cardId,
      facetKey: facet.key,
      tags: facet.tags,
    }));

  return [
    {
      direction: 'public-overload',
      reachable: publicWitnesses.length > 0,
      witnesses: publicWitnesses,
    },
    {
      direction: 'coercive-collapse',
      reachable: coerciveWitnesses.length > 0,
      witnesses: coerciveWitnesses,
    },
  ];
}

export function validateTripleConstraints(
  candidate: TruthCandidate,
  input: CandidateSearchInput,
  starterKnownFacets: ReadonlySet<string>,
): TripleConstraintReport {
  const problems: string[] = [];
  let state = { ...candidate.initialState };
  let previousFrame: SlotFrame | null = null;

  for (const slot of candidate.slots) {
    const solution = slot.solutions[0];
    const card = input.clues[solution.cardId];
    const facet = facetForSolution(solution, input.clues);
    if (!card || !facet) {
      problems.push(`${slot.recipeSlotId}: 카드·측면 참조가 깨졌다.`);
      continue;
    }
    const verdict = facetStatus(facet, slot.frame, {
      heat: state.heat,
      trust: state.trust,
      axis: state.axis,
      prevFrame: previousFrame,
      known: input.knownFacets,
      lent: input.lentFacets,
    });
    if (!verdict.usable) {
      problems.push(
        `${slot.recipeSlotId}: ${facet.key}를 순차 상태에서 쓸 수 없다 (${verdict.block}).`,
      );
    }
    if (!verdict.fitsRole || !slot.accepts.includes(card.kind)) {
      problems.push(
        `${slot.recipeSlotId}: ${card.id}/${facet.key}가 슬롯 의미 계약과 응집하지 않는다.`,
      );
    }
    state = applyFacet(state, facet, input.tagDeltas, input.axisProfile);
    previousFrame = slot.frame;
  }

  const failureVocabulary = probeFailureVocabulary(
    input.clues,
    starterKnownFacets,
    input.tagDeltas,
  );
  for (const probe of failureVocabulary) {
    if (!probe.reachable) {
      problems.push(
        probe.direction === 'public-overload'
          ? '스타터 어휘로 공개 과다 방향을 밀 수 없다.'
          : '스타터 어휘로 강압 과다 방향을 밀 수 없다.',
      );
    }
  }

  const solvabilityProblems = problems.filter(
    (problem) =>
      problem.includes('쓸 수 없다') || problem.includes('참조가 깨졌다'),
  );
  const coherenceProblems = problems.filter((problem) =>
    problem.includes('응집하지 않는다'),
  );
  return {
    solvable: solvabilityProblems.length === 0,
    coherent: coherenceProblems.length === 0,
    failureDirectionsReachable: failureVocabulary.every((probe) => probe.reachable),
    failureVocabulary,
    problems,
  };
}

function facetForLegacyAnswer(
  cardId: string,
  frame: SlotFrame,
  clues: Record<string, ClueCard>,
): { facet?: Facet; issue?: string } {
  const card = clues[cardId];
  if (!card) return { issue: `카드 ${cardId}가 catalog에 없다.` };
  const facets = card.facets.filter((facet) => facet.frame === frame);
  if (facets.length === 0) {
    return { issue: `카드 ${cardId}에 ${frame} 측면이 없다.` };
  }
  if (facets.length > 1) {
    return { issue: `카드 ${cardId}에 ${frame} 측면이 ${facets.length}개라 암묵 추론이 모호하다.` };
  }
  return { facet: facets[0] };
}

function recipeFromLegacyCase(definition: CaseDef): PatternRecipe {
  return {
    id: `legacy:${definition.patterns.join('+')}`,
    version: 'prototype-v1',
    evidenceIds: definition.patterns.map((pattern) => `legacy-evidence:${pattern}`),
    slots: definition.slots.map((slot, order) => ({
      id: slot.id,
      order,
      frame: slot.role?.frame ?? 'scene',
      accepts:
        slot.role?.accepts ??
        FRAME_ACCEPTS[slot.role?.frame ?? 'scene'],
      label: slot.label,
    })),
    allowedAxisProfiles: definition.axis
      ? [`tag-pressure:${definition.axis.drivenBy}`]
      : ['tag-pressure:논리'],
    allowCardReuse: false,
  };
}

export function axisProfileFromLegacy(axis: AxisDef | undefined): AxisProfile | null {
  if (!axis) return null;
  return {
    id: `tag-pressure:${axis.drivenBy}`,
    drivenBy: axis.drivenBy,
    initial: axis.init,
    step: 1,
    min: 0,
    max: 10,
  };
}

function axisPresentationFromLegacy(
  axis: AxisDef | undefined,
  profile: AxisProfile | null,
): AxisPresentation | null {
  if (!axis || !profile) return null;
  return {
    profileId: profile.id,
    label: axis.label,
    low: axis.low,
    high: axis.high,
    hint: axis.hint,
  };
}

export function migrateLegacyCase(
  definition: CaseDef,
  clues: Record<string, ClueCard>,
): LegacyMigration {
  const issues: ContractIssue[] = [];
  const recipe = recipeFromLegacyCase(definition);

  const slots: SlotTruth[] = definition.slots.map((slot, slotIndex) => {
    const frame = recipe.slots[slotIndex].frame;
    const accepts = recipe.slots[slotIndex].accepts;
    const answers =
      typeof slot.answer === 'string'
        ? [{ cardId: slot.answer, condition: undefined, branch: 'fixed' }]
        : [
            {
              cardId: slot.answer.else,
              condition: { stat: slot.answer.stat, lt: slot.answer.gte } as StateCondition,
              branch: 'else',
            },
            {
              cardId: slot.answer.then,
              condition: { stat: slot.answer.stat, gte: slot.answer.gte } as StateCondition,
              branch: 'then',
            },
          ];

    const solutions = answers.flatMap((answer) => {
      const resolved = facetForLegacyAnswer(answer.cardId, frame, clues);
      if (!resolved.facet) {
        issues.push({
          path: `cases.${definition.id}.slots[${slotIndex}].answer`,
          message: resolved.issue ?? '정답 측면을 찾지 못했다.',
        });
        return [];
      }
      return [
        {
          id: `${slot.id}:${answer.branch}`,
          cardId: answer.cardId,
          facetKey: resolved.facet.key,
          when: answer.condition,
        },
      ];
    });

    return {
      recipeSlotId: slot.id,
      frame,
      accepts,
      solutions,
    };
  });

  issues.push(...validateTruthContract(slots, clues));
  const axisProfile = axisProfileFromLegacy(definition.axis);
  const axisPresentation = axisPresentationFromLegacy(definition.axis, axisProfile);
  const presentation: CasePresentation = {
    title: definition.title,
    intro: definition.intro,
    teaser: definition.teaser,
    contextHint: definition.contextHint,
    pieces: [...definition.pieces],
    slots: definition.slots.map((slot) => ({
      recipeSlotId: slot.id,
      label: slot.label,
      hit: slot.hit,
      josaAfter: slot.josaAfter,
    })),
    axis: axisPresentation,
  };
  if (presentation.pieces.length !== presentation.slots.length + 1) {
    issues.push({
      path: `cases.${definition.id}.presentation.pieces`,
      message: 'pieces는 presentation slots보다 정확히 하나 많아야 한다.',
    });
  }
  if (presentation.slots.some((slot) => !recipe.slots.some((r) => r.id === slot.recipeSlotId))) {
    issues.push({
      path: `cases.${definition.id}.presentation.slots`,
      message: 'recipe에 없는 슬롯을 presentation이 참조한다.',
    });
  }

  return {
    caseId: definition.id,
    sourceSnapshotIds: [`legacy-case:${definition.id}`],
    recipe,
    truth: {
      recipeId: recipe.id,
      recipeVersion: recipe.version,
      slots,
    },
    presentation,
    obstacles: [],
    axisProfile,
    axisPresentation,
    issues,
  };
}

export function sampleConditionStates(): GeneratorState[] {
  const values = [0, 1, 2, 3, 4, 5, 6, 8, 10];
  return values.flatMap((heat) =>
    values.flatMap((trust) =>
      [0, 2, 4, 6, 10].map((axis) => ({ heat, trust, axis })),
    ),
  );
}

export function probeConditionalSolutions(
  migration: LegacyMigration,
  clues: Record<string, ClueCard>,
  tagDeltas: RunContent['tagDeltas'],
  states = sampleConditionStates(),
): BranchProbe[] {
  const profile =
    migration.axisProfile ??
    ({
      id: 'tag-pressure:논리',
      drivenBy: '논리',
      initial: 0,
      step: 1,
      min: 0,
      max: 10,
    } satisfies AxisProfile);
  const probes: BranchProbe[] = [];

  for (const slot of migration.truth.slots) {
    for (const solution of slot.solutions) {
      if (!solution.when) continue;
      const facet = facetForSolution(solution, clues);
      if (!facet) continue;
      for (const state of states) {
        const eligibleBefore = conditionMatches(solution.when, state);
        if (!eligibleBefore) continue;
        const stateAfterPlacement = applyFacet(state, facet, tagDeltas, profile);
        probes.push({
          slotId: slot.recipeSlotId,
          solutionId: solution.id,
          stateBefore: state,
          stateAfterPlacement,
          eligibleBefore,
          eligibleAfterLiveReevaluation: conditionMatches(
            solution.when,
            stateAfterPlacement,
          ),
          // Agreed contract: eligibility is captured when the solution is placed.
          frozenAcceptanceStable: true,
        });
      }
    }
  }

  return probes;
}

export function observedAxisProfiles(cases: CaseDef[]): AxisProfile[] {
  const byId = new Map<string, AxisProfile>();
  for (const definition of cases) {
    const profile = axisProfileFromLegacy(definition.axis);
    if (profile && !byId.has(profile.id)) byId.set(profile.id, profile);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const ALL_TAGS: Tag[] = ['공개', '은밀', '강압', '신중', '논리'];

export function fullTagAxisProfiles(initial = 3): AxisProfile[] {
  return ALL_TAGS.map((tag) => ({
    id: `tag-pressure:${tag}`,
    drivenBy: tag,
    initial,
    step: 1,
    min: 0,
    max: 10,
  }));
}
