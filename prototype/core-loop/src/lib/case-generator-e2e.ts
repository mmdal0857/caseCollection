import { createHash } from 'node:crypto';
import type {
  AxisProfile,
  CasePresentation,
  PatternEvidence,
  PatternRecipe,
  StorySeed,
  TruthCandidate,
} from './case-generator-prototype';
import {
  migrateLegacyCase,
  probeConditionalSolutions,
  validateTripleConstraints,
  validateTruthContract,
} from './case-generator-prototype';
import type { ClueCard, RunContent } from './engine';

export interface SourceFixtureParagraph {
  id: string;
  text: string;
  sha256: string;
}

export interface SourceFixture {
  format: 'SourceSnapshot@1';
  pgId: 204;
  story: {
    startAnchor: 'The Invisible Man';
    endAnchor: 'The Honour of Israel Gow';
  };
  source: {
    revision: string;
    extractedAt: '2026-07-28';
    sha256: string;
    bytes: number;
  };
  paragraphs: SourceFixtureParagraph[];
}

export interface FixtureIssue {
  path: string;
  message: string;
}

export interface PatternContractFixture {
  format: 'PatternContract@1';
  approved: boolean;
  evidence: PatternEvidence;
  recipe: PatternRecipe;
  storySeed: StorySeed;
  axisProfile: AxisProfile;
}

export interface PatternContractApproval {
  recipe?: PatternRecipe;
  issues: FixtureIssue[];
}

export interface CandidateSummary {
  candidateId: string;
  preferenceScore: number;
  slots: {
    slotId: string;
    frame: string;
    cardKind: string;
    facetMeaning: string;
    tags: string[];
  }[];
}

export interface SelectorOutput {
  candidateId: string;
  reason: string;
}

export interface PresenterOutput {
  presentation: CasePresentation;
}

export interface TasteOutput {
  decision: 'keep' | 'reject';
  tasteScore: number;
  reasons: string[];
}

export type ModelRole = 'selector' | 'presenter' | 'taste';

export interface ModelExchange {
  role: ModelRole;
  promptVersion: string;
  input: unknown;
  rawResponse: string;
  parsed: unknown;
}

export interface ModelTranscript {
  format: 'CaseGeneratorTranscript@1';
  modelId: string;
  seed: number;
  exchanges: ModelExchange[];
}

export interface GeneratedArtifacts {
  generatedCase: Record<string, unknown>;
  pack: Record<string, unknown>;
  report: {
    format: 'GeneratedCaseValidatorReport@1';
    ok: boolean;
    candidateFingerprint: string;
    outputHash: string;
    provenanceHash: string;
    checks: {
      id: string;
      ok: boolean;
      paths: string[];
    }[];
  };
}

const PARAGRAPH_ANCHORS = [
  'swore stubbornly that he had watched the door',
  'Have you ever noticed this--that people never answer what you say?',
  'mentally invisible man',
  'barring carrier-pigeons',
  'Nobody ever notices postmen somehow',
] as const;

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeLf(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function storySpan(source: string): string {
  const normalized = normalizeLf(source);
  const startMarker = '\nThe Invisible Man\n';
  const endMarker = '\nThe Honour of Israel Gow\n';
  const start = normalized.lastIndexOf(startMarker);
  const end = normalized.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('PG204에서 The Invisible Man 이야기 anchor를 찾지 못했다.');
  }
  return normalized.slice(start + startMarker.length, end);
}

function paragraphsIn(span: string): string[] {
  return span
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function buildSourceFixture(source: string): SourceFixture {
  const storyParagraphs = paragraphsIn(storySpan(source));
  const selected = PARAGRAPH_ANCHORS.map((anchor, index) => {
    const matches = storyParagraphs.filter((paragraph) => paragraph.includes(anchor));
    if (matches.length !== 1) {
      throw new Error(
        `fixture anchor "${anchor}"가 ${matches.length}개 문단과 일치한다.`,
      );
    }
    const text = matches[0];
    return {
      id: `pg204-invisible-man-${String(index + 1).padStart(2, '0')}`,
      text,
      sha256: sha256(text),
    };
  });

  return {
    format: 'SourceSnapshot@1',
    pgId: 204,
    story: {
      startAnchor: 'The Invisible Man',
      endAnchor: 'The Honour of Israel Gow',
    },
    source: {
      revision: 'Project Gutenberg pg204 local snapshot',
      extractedAt: '2026-07-28',
      sha256: sha256(source),
      bytes: Buffer.byteLength(source, 'utf8'),
    },
    paragraphs: selected,
  };
}

export function validateSourceFixture(
  fixture: SourceFixture,
  source: string,
): FixtureIssue[] {
  const issues: FixtureIssue[] = [];
  if (fixture.format !== 'SourceSnapshot@1') {
    issues.push({ path: 'format', message: 'SourceSnapshot@1이 아니다.' });
  }
  if (fixture.source.sha256 !== sha256(source)) {
    issues.push({ path: 'source.sha256', message: '전체 원문 hash가 다르다.' });
  }
  if (fixture.source.bytes !== Buffer.byteLength(source, 'utf8')) {
    issues.push({ path: 'source.bytes', message: '전체 원문 byte 수가 다르다.' });
  }

  const paragraphs = new Set(paragraphsIn(storySpan(source)));
  const ids = new Set<string>();
  fixture.paragraphs.forEach((paragraph, index) => {
    const path = `paragraphs[${index}]`;
    if (ids.has(paragraph.id)) {
      issues.push({ path: `${path}.id`, message: '문단 id가 중복됐다.' });
    }
    ids.add(paragraph.id);
    if (!paragraphs.has(paragraph.text)) {
      issues.push({
        path: `${path}.text`,
        message: '선택 문단이 고정 이야기 span에 없다.',
      });
    }
    if (paragraph.sha256 !== sha256(paragraph.text)) {
      issues.push({ path: `${path}.sha256`, message: '문단 hash가 다르다.' });
    }
  });
  return issues;
}

export function approvePatternContract(
  sourceFixture: SourceFixture,
  contract: PatternContractFixture,
): PatternContractApproval {
  const issues: FixtureIssue[] = [];
  const sourceIds = new Set(
    sourceFixture.paragraphs.map((paragraph) => paragraph.id),
  );

  if (contract.format !== 'PatternContract@1') {
    issues.push({ path: 'format', message: 'PatternContract@1이 아니다.' });
  }
  if (!contract.approved) {
    issues.push({ path: 'approved', message: 'recipe가 승인되지 않았다.' });
  }
  if (
    contract.evidence.sourceSnapshotIds.length === 0 ||
    !contract.evidence.sourceSnapshotIds.every((id) => sourceIds.has(id))
  ) {
    issues.push({
      path: 'evidence.sourceSnapshotIds',
      message: '고정 source fixture에 없는 근거 ID가 있다.',
    });
  }
  if (!contract.recipe.evidenceIds.includes(contract.evidence.id)) {
    issues.push({
      path: 'recipe.evidenceIds',
      message: '승인 recipe가 pattern evidence를 참조하지 않는다.',
    });
  }
  if (
    !contract.recipe.allowedAxisProfiles.includes(contract.axisProfile.id)
  ) {
    issues.push({
      path: 'recipe.allowedAxisProfiles',
      message: '선택한 axis profile이 recipe allowlist에 없다.',
    });
  }

  const slotIds = new Set<string>();
  const orders = new Set<number>();
  contract.recipe.slots.forEach((slot, index) => {
    if (slotIds.has(slot.id)) {
      issues.push({
        path: `recipe.slots[${index}].id`,
        message: 'recipe slot id가 중복됐다.',
      });
    }
    slotIds.add(slot.id);
    if (orders.has(slot.order)) {
      issues.push({
        path: `recipe.slots[${index}].order`,
        message: 'recipe slot order가 중복됐다.',
      });
    }
    orders.add(slot.order);
  });
  for (const requirement of contract.storySeed.requires) {
    if (!slotIds.has(requirement.slotId)) {
      issues.push({
        path: 'storySeed.requires',
        message: `없는 recipe slot ${requirement.slotId}을 요구한다.`,
      });
    }
  }

  return issues.length === 0
    ? { recipe: structuredClone(contract.recipe), issues }
    : { issues };
}

function exactKeys(
  value: unknown,
  allowed: readonly string[],
  path: string,
): FixtureIssue[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [{ path, message: '객체가 아니다.' }];
  }
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  return extra.length === 0
    ? []
    : [{ path, message: `허용되지 않은 필드: ${extra.join(', ')}` }];
}

export function candidateSummaries(
  candidates: TruthCandidate[],
  clues: Record<string, ClueCard>,
): CandidateSummary[] {
  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    preferenceScore: candidate.preferenceScore,
    slots: candidate.slots.map((slot) => {
      const solution = slot.solutions[0];
      const card = clues[solution.cardId];
      const facet = card?.facets.find(
        (candidateFacet) => candidateFacet.key === solution.facetKey,
      );
      return {
        slotId: slot.recipeSlotId,
        frame: slot.frame,
        cardKind: card?.kind ?? 'unknown',
        facetMeaning: facet?.meaning ?? 'unknown',
        tags: [...(facet?.tags ?? [])],
      };
    }),
  }));
}

export function validateSelectorOutput(
  value: unknown,
  candidateIds: ReadonlySet<string>,
): FixtureIssue[] {
  const issues = exactKeys(value, ['candidateId', 'reason'], 'selector');
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return issues;
  }
  const candidateId = (value as Record<string, unknown>).candidateId;
  const reason = (value as Record<string, unknown>).reason;
  if (typeof candidateId !== 'string' || !candidateIds.has(candidateId)) {
    issues.push({
      path: 'candidateId',
      message: '엔진이 열거한 candidate allowlist에 없다.',
    });
  }
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    issues.push({ path: 'reason', message: '선택 이유가 필요하다.' });
  }
  return issues;
}

const JOSA_LEAD_RE =
  /^(이|가|은|는|을|를|로|으로|과|와|이다|다)(?![가-힣])/;

export function validatePresentationOutput(
  value: unknown,
  candidate: TruthCandidate,
  clues?: Record<string, ClueCard>,
): FixtureIssue[] {
  const issues = exactKeys(value, ['presentation'], 'presenter');
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return issues;
  }
  const presentation = (value as Record<string, unknown>).presentation;
  issues.push(
    ...exactKeys(
      presentation,
      ['title', 'intro', 'teaser', 'contextHint', 'pieces', 'slots', 'axis'],
      'presentation',
    ),
  );
  if (
    typeof presentation !== 'object' ||
    presentation === null ||
    Array.isArray(presentation)
  ) {
    return issues;
  }
  const record = presentation as Record<string, unknown>;
  for (const field of ['title', 'intro'] as const) {
    if (typeof record[field] !== 'string' || record[field].trim().length === 0) {
      issues.push({
        path: `presentation.${field}`,
        message: '비어 있지 않은 문자열이어야 한다.',
      });
    }
  }
  const pieces = Array.isArray(record.pieces) ? record.pieces : [];
  if (
    pieces.length !== candidate.slots.length + 1 ||
    !pieces.every((piece) => typeof piece === 'string')
  ) {
    issues.push({
      path: 'presentation.pieces',
      message: 'pieces는 truth slots보다 정확히 하나 많은 문자열 배열이어야 한다.',
    });
  } else {
    const forbiddenTokens = candidate.slots.flatMap((slot) => {
      const solution = slot.solutions[0];
      const card = clues?.[solution.cardId];
      const facet = card?.facets.find(
        (candidateFacet) => candidateFacet.key === solution.facetKey,
      );
      return [
        slot.recipeSlotId,
        solution.cardId,
        solution.facetKey,
        card?.name,
        facet?.meaning,
      ].filter(
        (token): token is string =>
          typeof token === 'string' && token.length >= 2,
      );
    });
    pieces.slice(1).forEach((piece, index) => {
      const trimmed = String(piece).replace(/^\s+/, '');
      if (JOSA_LEAD_RE.test(trimmed)) {
        issues.push({
          path: `presentation.pieces[${index + 1}]`,
          message: '슬롯 직후 리터럴 조사가 정답 받침을 누출한다.',
        });
      }
      if (!/^[.,!?;:—…-]/.test(trimmed)) {
        issues.push({
          path: `presentation.pieces[${index + 1}]`,
          message: '슬롯 뒤 조각은 카드명과 붙지 않도록 구두점으로 시작해야 한다.',
        });
      }
    });
    pieces.forEach((piece, index) => {
      const text = String(piece);
      if (
        text.includes('←') ||
        forbiddenTokens.some((token) => text.includes(token))
      ) {
        issues.push({
          path: `presentation.pieces[${index}]`,
          message:
            '추리문 조각이 candidate trace·정답 카드·측면을 미리 누출한다.',
        });
      }
    });
  }

  const slots = Array.isArray(record.slots) ? record.slots : [];
  const expectedIds = candidate.slots.map((slot) => slot.recipeSlotId);
  const actualIds = slots.flatMap((slot) =>
    typeof slot === 'object' &&
    slot !== null &&
    !Array.isArray(slot) &&
    typeof (slot as Record<string, unknown>).recipeSlotId === 'string'
      ? [(slot as Record<string, unknown>).recipeSlotId as string]
      : [],
  );
  if (
    slots.length !== expectedIds.length ||
    expectedIds.some((id) => !actualIds.includes(id)) ||
    new Set(actualIds).size !== actualIds.length
  ) {
    issues.push({
      path: 'presentation.slots',
      message: 'presentation slot 참조가 확정 truth와 일치하지 않는다.',
    });
  }
  slots.forEach((slot, index) => {
    issues.push(
      ...exactKeys(
        slot,
        ['recipeSlotId', 'label', 'hit', 'josaAfter'],
        `presentation.slots[${index}]`,
      ),
    );
  });
  return issues;
}

export function validateTasteOutput(value: unknown): FixtureIssue[] {
  const issues = exactKeys(
    value,
    ['decision', 'tasteScore', 'reasons'],
    'taste',
  );
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return issues;
  }
  const record = value as Record<string, unknown>;
  if (record.decision !== 'keep' && record.decision !== 'reject') {
    issues.push({
      path: 'taste.decision',
      message: 'decision은 keep 또는 reject다.',
    });
  }
  if (
    !Number.isInteger(record.tasteScore) ||
    Number(record.tasteScore) < 0 ||
    Number(record.tasteScore) > 100
  ) {
    issues.push({
      path: 'taste.tasteScore',
      message: 'tasteScore는 0..100 정수다.',
    });
  }
  if (
    !Array.isArray(record.reasons) ||
    record.reasons.length === 0 ||
    !record.reasons.every(
      (reason) => typeof reason === 'string' && reason.trim().length > 0,
    )
  ) {
    issues.push({
      path: 'taste.reasons',
      message: 'reasons는 비어 있지 않은 문자열 배열이다.',
    });
  }
  return issues;
}

function sortForCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForCanonical);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortForCanonical(child)]),
  );
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(sortForCanonical(value))}\n`;
}

export function safePublicPieces(): string[] {
  return [
    '네 증언이 겹치는 자리에는 ',
    '. 그 공백을 통과한 존재를 설명하는 열쇠는 ',
    '. 그 선택은 우연이 아니라 ',
    '. 마지막으로 현장에 남은 것은 ',
    '. 네 고리가 같은 사람을 가리킨다.',
  ];
}

function exchangeFor(
  transcript: ModelTranscript,
  role: ModelRole,
): ModelExchange | undefined {
  return transcript.exchanges.find((exchange) => exchange.role === role);
}

function candidateInput(
  contract: PatternContractFixture,
  candidate: TruthCandidate,
  content: RunContent,
) {
  const allKnown = new Set(
    Object.values(content.clues).flatMap((card) =>
      card.facets.map((facet) => facet.key),
    ),
  );
  return {
    clues: content.clues,
    recipe: contract.recipe,
    storySeed: contract.storySeed,
    axisProfile: contract.axisProfile,
    initialState: candidate.initialState,
    knownFacets: allKnown,
    lentFacets: new Set<string>(),
    tagDeltas: content.tagDeltas,
  };
}

function generatedLegacyCase(
  candidate: TruthCandidate,
  presentation: CasePresentation,
  contract: PatternContractFixture,
) {
  const presentationBySlot = new Map(
    presentation.slots.map((slot) => [slot.recipeSlotId, slot]),
  );
  const selectedCardIds = candidate.slots.map(
    (slot) => slot.solutions[0].cardId,
  );
  return {
    id: 'generated.pg204-invisible-man.case',
    title: presentation.title,
    intro: presentation.intro,
    teaser: presentation.teaser,
    contextHint: presentation.contextHint,
    pieces: presentation.pieces,
    slots: candidate.slots.map((slot) => {
      const displayed = presentationBySlot.get(slot.recipeSlotId);
      return {
        id: `generated.pg204-invisible-man.${slot.recipeSlotId}`,
        label: displayed?.label ?? slot.recipeSlotId,
        answer: slot.solutions[0].cardId,
        hit: displayed?.hit,
        josaAfter: displayed?.josaAfter,
        role: { frame: slot.frame, accepts: slot.accepts },
      };
    }),
    patterns: ['invisible-man'],
    guestClues: [...new Set(selectedCardIds)],
    guestPattern: 'invisible-man',
    guestFacets: candidate.slots.map(
      (slot) => slot.solutions[0].facetKey,
    ),
    axis: {
      id: 'generated.pg204-invisible-man.visibility',
      label: candidate.axisPresentation.label,
      low: candidate.axisPresentation.low,
      high: candidate.axisPresentation.high,
      init: contract.axisProfile.initial,
      drivenBy: contract.axisProfile.drivenBy,
      hint: candidate.axisPresentation.hint,
    },
    packPool: [],
  };
}

export function buildGeneratedArtifacts(input: {
  sourceFixture: SourceFixture;
  contract: PatternContractFixture;
  candidates: TruthCandidate[];
  transcript: ModelTranscript;
  content: RunContent;
}): GeneratedArtifacts {
  const checks: GeneratedArtifacts['report']['checks'] = [];
  const addCheck = (id: string, issues: FixtureIssue[]) => {
    checks.push({
      id,
      ok: issues.length === 0,
      paths: issues.map((issue) => `${issue.path}: ${issue.message}`),
    });
  };

  const approval = approvePatternContract(input.sourceFixture, input.contract);
  addCheck('pattern-evidence-recipe', approval.issues);

  const selector = exchangeFor(input.transcript, 'selector');
  const presenter = exchangeFor(input.transcript, 'presenter');
  const taste = exchangeFor(input.transcript, 'taste');
  const transcriptIssues: FixtureIssue[] = [];
  if (
    input.transcript.format !== 'CaseGeneratorTranscript@1' ||
    input.transcript.exchanges.length !== 3 ||
    !selector ||
    !presenter ||
    !taste
  ) {
    transcriptIssues.push({
      path: 'transcript',
      message: 'selector/presenter/taste 교환이 정확히 하나씩 필요하다.',
    });
  }
  addCheck('transcript-shape', transcriptIssues);

  const selectorIssues = validateSelectorOutput(
    selector?.parsed,
    new Set(input.candidates.map((candidate) => candidate.id)),
  );
  addCheck('selector-allowlist', selectorIssues);
  const selectedId =
    typeof selector?.parsed === 'object' &&
    selector.parsed !== null &&
    !Array.isArray(selector.parsed)
      ? (selector.parsed as Record<string, unknown>).candidateId
      : undefined;
  const candidate = input.candidates.find(
    (item) => item.id === selectedId,
  ) ?? input.candidates[0];

  const presenterIssues = validatePresentationOutput(
    presenter?.parsed,
    candidate,
    input.content.clues,
  );
  addCheck('presentation-references-josa', presenterIssues);
  const tasteIssues = validateTasteOutput(taste?.parsed);
  addCheck('taste-authority', tasteIssues);

  const truthIssues = validateTruthContract(candidate.slots, input.content.clues);
  addCheck('truth-contract', truthIssues);
  const starterKnown = new Set(
    input.content.starterClues.flatMap((cardId) => {
      const facet = input.content.clues[cardId]?.facets[0];
      return facet ? [facet.key] : [];
    }),
  );
  const triple = validateTripleConstraints(
    candidate,
    candidateInput(input.contract, candidate, input.content),
    starterKnown,
  );
  addCheck(
    'triple-constraints',
    triple.problems.map((message, index) => ({
      path: `triple[${index}]`,
      message,
    })),
  );

  const conditionalProbes = input.content.cases.flatMap((definition) =>
    probeConditionalSolutions(
      migrateLegacyCase(definition, input.content.clues),
      input.content.clues,
      input.content.tagDeltas,
    ),
  );
  addCheck(
    'conditional-lock-stability',
    conditionalProbes
      .filter((probe) => !probe.frozenAcceptanceStable)
      .map((probe) => ({
        path: `conditional.${probe.slotId}.${probe.solutionId}`,
        message: 'lock-time 동결 뒤 정답 안정성이 깨졌다.',
      })),
  );

  const modelPresentation =
    typeof presenter?.parsed === 'object' &&
    presenter.parsed !== null &&
    !Array.isArray(presenter.parsed)
      ? ((presenter.parsed as Record<string, unknown>)
          .presentation as CasePresentation)
      : ({
          title: 'invalid',
          intro: 'invalid',
          pieces: [],
          slots: [],
          axis: null,
        } satisfies CasePresentation);
  const presentation: CasePresentation = {
    ...modelPresentation,
    pieces: safePublicPieces(),
  };
  addCheck(
    'public-piece-contract',
    presentation.pieces.length === candidate.slots.length + 1
      ? []
      : [
          {
            path: 'presentation.pieces',
            message: '공개 등급 추리문 조각 수가 truth slot과 맞지 않는다.',
          },
        ],
  );
  const tasteOutput = (taste?.parsed ?? {
    decision: 'reject',
    tasteScore: 0,
    reasons: ['invalid'],
  }) as TasteOutput;
  addCheck(
    'taste-kept',
    tasteOutput.decision === 'keep'
      ? []
      : [{ path: 'taste.decision', message: '취향 필터가 reject했다.' }],
  );

  const transcriptHash = sha256(canonicalJson(input.transcript));
  const rawResponseHash = sha256(
    input.transcript.exchanges
      .map((exchange) => exchange.rawResponse)
      .join('\n'),
  );
  const inputHash = sha256(
    canonicalJson({
      source: input.sourceFixture,
      contract: input.contract,
      transcript: input.transcript,
    }),
  );
  const provenance = {
    sourceSnapshotIds: input.sourceFixture.paragraphs.map(
      (paragraph) => paragraph.id,
    ),
    sourceSha256: input.sourceFixture.source.sha256,
    recipeId: input.contract.recipe.id,
    recipeVersion: input.contract.recipe.version,
    modelId: input.transcript.modelId,
    promptVersions: input.transcript.exchanges.map(
      (exchange) => exchange.promptVersion,
    ),
    seed: input.transcript.seed,
    rawResponseSha256: rawResponseHash,
    transcriptSha256: transcriptHash,
    validatorVersion: 'generated-case-e2e@1',
    inputSha256: inputHash,
    normalizedOutputSha256: '0'.repeat(64),
  };
  const generatedCase: Record<string, unknown> = {
    format: 'GeneratedCase@1',
    id: 'generated.pg204-invisible-man.case',
    truth: candidate,
    presentation,
    obstacles: [],
    taste: tasteOutput,
    provenance,
  };
  provenance.normalizedOutputSha256 = sha256(canonicalJson(generatedCase));

  const packProvenance = {
    sourceSnapshotIds: provenance.sourceSnapshotIds,
    inputSha256: inputHash,
    modelId: input.transcript.modelId,
    promptVersion: provenance.promptVersions.join('+'),
    seed: input.transcript.seed,
    rawResponseSha256: rawResponseHash,
    validatorVersion: 'generated-case-e2e@1',
    outputSha256: '0'.repeat(64),
  };
  const generatedCaseForPack = generatedLegacyCase(
    candidate,
    presentation,
    input.contract,
  );
  const guestFacetKey = generatedCaseForPack.guestFacets[0];
  if (guestFacetKey === undefined) {
    throw new Error('generated case에 인터뷰 허용 측면이 없다');
  }
  const entryInterlude = {
    id: 'generated.pg204-invisible-man.interlude.boss-case',
    afterCaseId: 'boss',
    beforeCaseId: generatedCaseForPack.id,
    apBudget: 2,
    actions: [
      {
        id: 'generated.pg204-invisible-man.interlude.recon',
        kind: 'recon',
        cost: 1,
        label: '눈보라 기록 대조',
        resultText: generatedCaseForPack.title,
        revealKind: 'background',
        revealValue: generatedCaseForPack.title,
      },
      {
        id: 'generated.pg204-invisible-man.interlude.interview',
        kind: 'interview',
        cost: 1,
        label: '빠진 목격자 확인',
        resultText: '다음 사건에서 공개된 목격 측면 하나를 빌린다.',
        guestFacetKey,
      },
      {
        id: 'generated.pg204-invisible-man.interlude.stabilize',
        kind: 'stabilize',
        cost: 1,
        label: '수사선 정돈',
        resultText: '새 사건으로 넘어가기 전에 과열된 수사선을 정돈한다.',
        stat: 'heat',
        delta: -1,
      },
    ],
    presentation:
      '완결된 사건부 뒤에 도착한 눈보라 기록이 다음 수사선을 연다.',
    provenance: packProvenance,
  };
  const pack: Record<string, unknown> = {
    format: 'game-data-pack',
    formatVersion: 2,
    id: 'generated.pg204-invisible-man',
    name: 'PG204 · 눈 위의 배달부',
    version: '1.0.0',
    mergeMode: 'alongside',
    provenance: packProvenance,
    cases: [generatedCaseForPack],
    interludes: [entryInterlude],
  };
  packProvenance.outputSha256 = sha256(canonicalJson(pack));

  const outputHash = provenance.normalizedOutputSha256;
  const provenanceHash = sha256(canonicalJson(provenance));
  const ok = checks.every((check) => check.ok);
  return {
    generatedCase,
    pack,
    report: {
      format: 'GeneratedCaseValidatorReport@1',
      ok,
      candidateFingerprint: sha256(
        canonicalJson(input.candidates.map((item) => item.id)),
      ),
      outputHash,
      provenanceHash,
      checks,
    },
  };
}
