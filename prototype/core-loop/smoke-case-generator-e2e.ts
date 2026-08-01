import { readFileSync } from 'node:fs';
import {
  approvePatternContract,
  buildGeneratedArtifacts,
  buildSourceFixture,
  canonicalJson,
  candidateSummaries,
  safePublicPieces,
  type ModelTranscript,
  type PatternContractFixture,
  validatePresentationOutput,
  validateSelectorOutput,
  validateSourceFixture,
  validateTasteOutput,
} from './src/lib/case-generator-e2e';
import {
  enumerateLegalCandidates,
  type CandidateSearchInput,
} from './src/lib/case-generator-prototype';
import { CONTENT } from './src/lib/content';

function expect(ok: boolean, label: string): void {
  if (!ok) throw new Error(`[case-generator-e2e] FAIL — ${label}`);
  console.log(`[case-generator-e2e] PASS — ${label}`);
}

const sourcePath =
  process.env.PG204_SOURCE ?? 'fixtures/case-generator/pg204-source.txt';
const source = readFileSync(sourcePath, 'utf8');
const fixture = buildSourceFixture(source);
const issues = validateSourceFixture(fixture, source);

expect(fixture.pgId === 204, 'fixture는 Project Gutenberg 204를 고정한다');
expect(
  fixture.story.startAnchor === 'The Invisible Man' &&
    fixture.story.endAnchor === 'The Honour of Israel Gow',
  '이야기 시작·끝 anchor를 고정한다',
);
expect(
  fixture.paragraphs.length === 5 &&
    fixture.paragraphs.every((paragraph) => paragraph.sha256.length === 64),
  '선택한 다섯 문단과 문단별 SHA-256을 기록한다',
);
expect(
  fixture.source.sha256.length === 64 &&
    fixture.source.revision.length > 0 &&
    fixture.source.extractedAt === '2026-07-28',
  '전체 원문 SHA-256·revision·추출일을 기록한다',
);
expect(issues.length === 0, 'fixture 문단과 hash가 실제 원문에 다시 대조된다');

const contract = JSON.parse(
  readFileSync(
    'fixtures/case-generator/pg204-invisible-man.contract.json',
    'utf8',
  ),
) as PatternContractFixture;
const approval = approvePatternContract(fixture, contract);
expect(approval.issues.length === 0, '고정 source evidence만 recipe로 승인한다');

const allKnown = new Set(
  Object.values(CONTENT.clues).flatMap((card) =>
    card.facets.map((facet) => facet.key),
  ),
);
const searchInput: CandidateSearchInput = {
  clues: CONTENT.clues,
  recipe: approval.recipe!,
  storySeed: contract.storySeed,
  axisProfile: contract.axisProfile,
  initialState: {
    heat: CONTENT.initial.heat,
    trust: CONTENT.initial.trust,
    axis: contract.axisProfile.initial,
  },
  knownFacets: allKnown,
  lentFacets: new Set(),
  tagDeltas: CONTENT.tagDeltas,
  maxCandidates: 30,
};
const firstCandidates = enumerateLegalCandidates(searchInput);
const secondCandidates = enumerateLegalCandidates(searchInput);
expect(firstCandidates.length > 1, '의미 계약으로 합법 후보를 둘 이상 연다');
expect(
  firstCandidates.map((item) => item.id).join('\n') ===
    secondCandidates.map((item) => item.id).join('\n'),
  '같은 recipe와 storySeed는 같은 candidate 순서를 만든다',
);

const inventedEvidence: PatternContractFixture = structuredClone(contract);
inventedEvidence.evidence.sourceSnapshotIds.push('invented-paragraph');
expect(
  approvePatternContract(fixture, inventedEvidence).issues.some(
    (issue) => issue.path === 'evidence.sourceSnapshotIds',
  ),
  '원문 fixture에 없는 근거 ID를 거부한다',
);

const summaries = candidateSummaries(firstCandidates, CONTENT.clues);
expect(
  summaries.length === firstCandidates.length &&
    !('truth' in (summaries[0] as unknown as Record<string, unknown>)),
  'selector에는 candidate 요약만 전달한다',
);
expect(
  validateSelectorOutput(
    { candidateId: 'invented', reason: '없는 후보' },
    new Set(firstCandidates.map((candidate) => candidate.id)),
  ).some((issue) => issue.path === 'candidateId'),
  'selector가 allowlist 밖 candidateId를 발명하면 거부한다',
);
expect(
  validateSelectorOutput(
    {
      candidateId: firstCandidates[0].id,
      reason: '원문 근거와 사회적 투명성 구조가 가장 직접적이다.',
      truth: {},
    },
    new Set(firstCandidates.map((candidate) => candidate.id)),
  ).some((issue) => issue.path === 'selector'),
  'selector가 candidate payload를 수정하려 하면 거부한다',
);

const presentation = {
  title: '눈 위의 배달부',
  intro:
    '눈 덮인 공동주택에서 한 남자가 사라졌다. 네 감시자는 아무도 드나들지 않았다고 증언한다.',
  teaser: '보이지 않은 사람이 아니라, 보았지만 세지 않은 사람이 있었다.',
  contextHint: '수첩 메모: 정직한 증언도 질문이 세지 않은 사람을 빠뜨릴 수 있다.',
  pieces: [
    '네 증언이 겹치는 자리에는 ',
    '. 그 이름이 비어 있다. 감시선을 통과한 존재는 ',
    '. 범인은 일상 속에 ',
    '. 사건이 끝난 뒤 눈 위에는 ',
    '. 그 흔적만 남았다.',
  ],
  slots: contract.recipe.slots.map((slot) => ({
    recipeSlotId: slot.id,
    label: slot.label,
    hit: `${slot.label}의 의미 계약이 확정됐다.`,
  })),
  axis: contract.storySeed.axisPresentations[0],
};
expect(
  validatePresentationOutput(
    { presentation },
    firstCandidates[0],
    CONTENT.clues,
  ).length === 0,
  '표현기는 truth를 바꾸지 않고 유효한 presentation만 반환한다',
);
expect(
  validatePresentationOutput(
    { presentation, truth: { replaced: true } },
    firstCandidates[0],
    CONTENT.clues,
  ).some((issue) => issue.path === 'presenter'),
  '표현기가 truth 필드를 반환하면 거부한다',
);
const leakedPresentation = structuredClone(presentation);
leakedPresentation.pieces[0] =
  `${firstCandidates[0].trace[0]} ← ${CONTENT.clues[firstCandidates[0].slots[0].solutions[0].cardId].name}`;
expect(
  validatePresentationOutput(
    { presentation: leakedPresentation },
    firstCandidates[0],
    CONTENT.clues,
  ).some((issue) => issue.path === 'presentation.pieces[0]'),
  'presentation 조각이 candidate trace·정답 카드·측면을 누출하면 거부한다',
);
const unseparatedPresentation = structuredClone(presentation);
unseparatedPresentation.pieces[1] = '그러나 익숙한 얼굴은 지나갔다.';
expect(
  validatePresentationOutput(
    { presentation: unseparatedPresentation },
    firstCandidates[0],
    CONTENT.clues,
  ).some((issue) => issue.path === 'presentation.pieces[1]'),
  '슬롯 뒤 조각이 구두점 없이 카드명에 붙으면 거부한다',
);
expect(
  validateTasteOutput({
    decision: 'keep',
    tasteScore: 84,
    reasons: ['근거와 반전이 같은 사회적 맹점을 회수한다.'],
  }).length === 0,
  '취향 필터는 keep/reject·점수·이유만 반환한다',
);

const transcript: ModelTranscript = {
  format: 'CaseGeneratorTranscript@1',
  modelId: 'fixture/model',
  seed: 428,
  exchanges: [
    {
      role: 'selector',
      promptVersion: 'selector@1',
      input: summaries,
      rawResponse: '{"candidateId":"fixture","reason":"fixture"}',
      parsed: {
        candidateId: firstCandidates[0].id,
        reason: '원문 근거와 사회적 투명성 구조가 가장 직접적이다.',
      },
    },
    {
      role: 'presenter',
      promptVersion: 'presenter@1',
      input: {
        truth: firstCandidates[0],
        storySeed: contract.storySeed,
      },
      rawResponse: '{"presentation":"fixture"}',
      parsed: { presentation },
    },
    {
      role: 'taste',
      promptVersion: 'taste@1',
      input: { summary: 'fixture' },
      rawResponse: '{"decision":"keep","tasteScore":84}',
      parsed: {
        decision: 'keep',
        tasteScore: 84,
        reasons: ['근거와 반전이 같은 사회적 맹점을 회수한다.'],
      },
    },
  ],
};
const artifactsA = buildGeneratedArtifacts({
  sourceFixture: fixture,
  contract,
  candidates: firstCandidates,
  transcript,
  content: CONTENT,
});
const artifactsB = buildGeneratedArtifacts({
  sourceFixture: fixture,
  contract,
  candidates: firstCandidates,
  transcript,
  content: CONTENT,
});
expect(artifactsA.report.ok, 'GeneratedCase validator 보고서가 전 항목 PASS다');
expect(
  JSON.stringify(
    (artifactsA.generatedCase.presentation as { pieces: string[] }).pieces,
  ) === JSON.stringify(safePublicPieces()),
  'pre-solve pieces는 모델 표현이 아니라 공개 등급 계약으로 정규화된다',
);
const generatedInterludes = (
  artifactsA.pack as {
    interludes?: {
      afterCaseId: string;
      beforeCaseId: string;
      actions: { kind: string }[];
    }[];
  }
).interludes ?? [];
expect(
  generatedInterludes.length === 1 &&
    generatedInterludes[0].afterCaseId === 'boss' &&
    generatedInterludes[0].beforeCaseId ===
      'generated.pg204-invisible-man.case' &&
    JSON.stringify(
      generatedInterludes[0].actions.map((action) => action.kind),
    ) === JSON.stringify(['recon', 'interview', 'stabilize']),
  'alongside case는 최신 run 그래프가 요구하는 진입 인터루드를 함께 emit한다',
);
expect(
  canonicalJson(artifactsA) === canonicalJson(artifactsB),
  '같은 transcript의 두 emit이 byte-identical하다',
);

console.log('[case-generator-e2e] ALL CONTRACT TESTS PASS');
